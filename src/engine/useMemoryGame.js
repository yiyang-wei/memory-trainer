// The game itself, with no UI attached: settings, records, run history and the round
// state machine. Every redesigned version renders from this one hook, so the rules,
// scoring and stored records are identical whichever version the player opens.
//
// The round logic is ported from MemoryGridTrainer.jsx (the classic screen) and keeps its
// guarantees: a run is banked exactly once, a Challenge preset never moves its board,
// and adaptive practice changes board size only while the board is blank.

import { useState, useEffect, useRef } from "react";
import { loadSettings, saveSettings, loadStats, saveStats, mergeRun, recordFor, practiceKey } from "../storage.js";
import { computeAdaptiveClear, computeAdaptiveFail } from "../ladder.js";
import {
  CHALLENGES,
  challengeById,
  challengesForMode,
  challengeParams,
  runScore,
  scoreNoun,
  DEFAULT_CHALLENGE_DISPLAY_TIME,
} from "../challenges.js";
import { loadPrefs, savePrefs } from "./prefs.js";
import { loadHistory, appendRun } from "./history.js";
import { playFeedback } from "./feedback.js";

// Same defaults as the classic screen, so both read the same saved settings.
export const DEFAULT_CONFIG = {
  pattern: { boardSize: 6, level: 10, displayTime: 2, adaptive: true },
  sequence: { boardSize: 3, level: 10, allowRepeat: true, displayTime: 1 },
  progressive: { boardSize: 3, startLength: 3, increment: 1, displayTime: 1 },
  queue: { boardSize: 3, level: 4, queueSize: 3, displayTime: 2 },
};

export const SUCCESS_HOLD = 480; // how long the success glow lingers before reset
export const RESET_ANIM = 700; // how long the flip-down reset wave takes
export const RESIZE_HOLD = 900; // how long a board-size change holds, cells already blank

// Pattern/Queue cap at half the board so the last cells aren't a trivial deduction;
// sequences with repeats are effectively unbounded, so they cap at a generous 60.
export const practiceLevelMax = (mode, cfg) => {
  const t = cfg.boardSize * cfg.boardSize;
  if (mode === "pattern" || mode === "queue") return Math.floor(t / 2);
  return cfg.allowRepeat ? 60 : Math.min(t - 1, 60);
};

const shuffled = (t) => {
  const idxs = Array.from({ length: t }, (_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return idxs;
};

export function useMemoryGame() {
  const [restored] = useState(() => loadSettings(DEFAULT_CONFIG, "pattern"));
  const [prefs, setPrefs] = useState(loadPrefs);
  const [mode, setMode] = useState(restored.mode);
  const [intent, setIntent] = useState(restored.intent);
  const [config, setConfig] = useState(restored.config);
  const [stats, setStats] = useState(() => loadStats(Object.keys(DEFAULT_CONFIG), CHALLENGES.map((c) => c.id)));
  const [history, setHistory] = useState(loadHistory);
  const [challengeId, setChallengeId] = useState(() => {
    const last = loadPrefs().last;
    const id = last?.challengeId;
    return id && challengeById(id).mode === restored.mode ? id : challengesForMode(restored.mode)[0].id;
  });
  const [challengeDisplayTime, setChallengeDisplayTime] = useState(restored.challengeDisplayTime);

  const [phase, setPhase] = useState("idle"); // idle, memorize, recall, success, resetting, resizing, gameover
  const [pattern, setPattern] = useState(new Set());
  const [found, setFound] = useState(new Set());
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeStepPos, setActiveStepPos] = useState(-1);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [wrongCells, setWrongCells] = useState(new Set());
  const [flashCorrect, setFlashCorrect] = useState(null);
  const [queueList, setQueueList] = useState([]);
  const [revealPatterns, setRevealPatterns] = useState([]);
  const [adaptive, setAdaptive] = useState(null);

  const [hearts, setHearts] = useState(3);
  const [strikes, setStrikes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [barKey, setBarKey] = useState(0);
  const [rung, setRung] = useState(1);
  const [endReason, setEndReason] = useState("lost");
  const [newRecord, setNewRecord] = useState(false);
  const [runStats, setRunStats] = useState(null);

  useEffect(() => {
    saveSettings({ config, mode, intent, challengeDisplayTime });
  }, [config, mode, intent, challengeDisplayTime]);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  // Read through a ref so timers scheduled by an older render still honour a toggle
  // flipped since.
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const emit = (type) => playFeedback(type, prefsRef.current);

  const timers = useRef([]);
  const sessionEnded = useRef(true);
  const run = useRef({ startedAt: 0, correct: 0, wrong: 0 });
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };
  useEffect(() => () => clearTimers(), []);

  const isProgressive = mode === "progressive";
  const isSequenceLike = mode === "sequence" || isProgressive;
  const isPatternLike = mode === "pattern" || mode === "queue";

  const modeConfig = config[mode];
  const isChallenge = intent === "challenge";
  const challenge = challengeById(challengeId);
  const isAdaptivePattern = !isChallenge && mode === "pattern" && modeConfig.adaptive;

  const preset = isChallenge ? challengeParams(challenge, rung - 1) : null;
  const boardSize = isChallenge
    ? preset.boardSize
    : isAdaptivePattern && adaptive
      ? adaptive.boardSize
      : modeConfig.boardSize;
  const level = isChallenge ? preset.level : isAdaptivePattern && adaptive ? adaptive.level : modeConfig.level;
  const speedFor = (id) => challengeDisplayTime[id] ?? DEFAULT_CHALLENGE_DISPLAY_TIME;
  const displayTime = isChallenge ? speedFor(challengeId) : modeConfig.displayTime;
  const queueSize = isChallenge ? preset.queueSize : modeConfig.queueSize;
  const startLength = isChallenge ? preset.startLength : modeConfig.startLength;
  const increment = isChallenge ? preset.increment : modeConfig.increment;
  // Challenge sequences always allow repeats — a no-repeat rule would cap length at the
  // cell count and make the longer presets impossible on a small board.
  const allowRepeat = isChallenge ? true : mode === "sequence" ? modeConfig.allowRepeat : isProgressive;
  const total = boardSize * boardSize;

  const configKey = practiceKey(modeConfig);
  const record = recordFor(stats, { mode, intent, challengeId, configKey });
  const sessionScore = isChallenge ? runScore(challenge, streak) : streak;
  const recordNoun = isChallenge ? scoreNoun(challenge) : "rounds";

  // ---------- Selection ----------

  const selectChallenge = (id) => {
    const ch = challengeById(id);
    resetToIdle();
    setMode(ch.mode);
    setIntent("challenge");
    setChallengeId(ch.id);
  };

  const selectPractice = (key) => {
    resetToIdle();
    setMode(key);
    setIntent("practice");
  };

  // Board size and repeats both bound the level, so either change re-clamps it.
  const updatePractice = (key, patch) =>
    setConfig((c) => {
      const next = { ...c[key], ...patch };
      if ("level" in next) next.level = Math.min(next.level, practiceLevelMax(key, next));
      return { ...c, [key]: next };
    });

  const setChallengeSpeed = (id, v) => setChallengeDisplayTime((d) => ({ ...d, [id]: v }));

  const setSound = (v) => setPrefs((p) => ({ ...p, sound: v }));
  const setHaptics = (v) => setPrefs((p) => ({ ...p, haptics: v }));

  // ---------- Rounds ----------

  const generatePatternOfSize = (size, t = total) => new Set(shuffled(t).slice(0, size));

  const generateSequence = (len, t) => {
    if (allowRepeat) return Array.from({ length: len }, () => Math.floor(Math.random() * t));
    return shuffled(t).slice(0, len);
  };

  // Every round parameter is resolved here rather than read from the closure, so a
  // Challenge can hand the next step's board/level/queue depth straight in.
  const startRound = (isFirstRound = false, overrides = null) => {
    clearTimers();
    setWrongCells(new Set());
    setFlashCorrect(null);
    setHearts(3); // hearts refresh every round

    const rBoard = overrides?.boardSize ?? boardSize;
    const rLevel = overrides?.level ?? level;
    const rQueue = overrides?.queueSize ?? queueSize;
    const rGrowBy = overrides?.growBy ?? 1;
    const rTotal = rBoard * rBoard;
    const stepDur = displayTime * 1000;
    const gap = 200;

    if (mode === "pattern") {
      setPattern(generatePatternOfSize(rLevel, rTotal));
      setFound(new Set());
      setPhase("memorize");
      setBarKey((k) => k + 1);
      emit("reveal");
      addTimer(() => setPhase("recall"), stepDur);
    } else if (mode === "queue") {
      setFound(new Set());
      setPhase("memorize");
      setActiveStepPos(-1);
      setRevealedSteps(0);
      // The patterns joining the back: the whole queue on the opening round, and
      // afterwards one replacement plus however many extra a deepening step asked for.
      const fresh = Array.from({ length: isFirstRound ? rQueue : rGrowBy }, () => generatePatternOfSize(rLevel, rTotal));
      const nextQueue = isFirstRound ? fresh : [...queueList.slice(1), ...fresh];
      setQueueList(nextQueue);
      setPattern(nextQueue[0]);
      setRevealPatterns(fresh);
      fresh.forEach((_, idx) => {
        const onAt = idx * (stepDur + gap);
        addTimer(() => {
          setActiveStepPos(idx);
          emit("reveal");
        }, onAt);
        addTimer(() => {
          setActiveStepPos(-1);
          setRevealedSteps(idx + 1);
        }, onAt + stepDur);
      });
      addTimer(() => setPhase("recall"), fresh.length * (stepDur + gap));
    } else {
      const seq = isProgressive
        ? isFirstRound
          ? Array.from({ length: startLength }, () => Math.floor(Math.random() * rTotal))
          : [...sequence, ...Array.from({ length: increment }, () => Math.floor(Math.random() * rTotal))]
        : generateSequence(rLevel, rTotal);
      setSequence(seq);
      setInputIndex(0);
      setRevealedSteps(0);
      setActiveStepPos(-1);
      setPhase("memorize");
      seq.forEach((_, idx) => {
        const onAt = idx * (stepDur + gap);
        addTimer(() => {
          setActiveStepPos(idx);
          emit("reveal");
        }, onAt);
        addTimer(() => {
          setActiveStepPos(-1);
          setRevealedSteps(idx + 1);
        }, onAt + stepDur);
      });
      addTimer(() => setPhase("recall"), seq.length * (stepDur + gap));
    }
  };

  const startGame = () => {
    clearTimers();
    setStrikes(0);
    setStreak(0);
    setRung(1);
    setNewRecord(false);
    setRunStats(null);
    sessionEnded.current = false;
    run.current = { startedAt: Date.now(), correct: 0, wrong: 0 };
    setPrefs((p) => ({ ...p, last: { mode, intent, challengeId } }));
    if (isAdaptivePattern) {
      setAdaptive({ level: modeConfig.level, boardSize: modeConfig.boardSize, clearStreak: 0, failStreak: 0 });
    }
    emit("start");
    startRound(true, isChallenge ? challengeParams(challenge, 0) : null);
  };

  // Folds the finished run into the stats and history, exactly once. Returns the stats
  // the result screen shows, including whether it beat the record it belongs to.
  const bankSession = () => {
    if (sessionEnded.current) return null;
    sessionEnded.current = true;
    const { startedAt, correct, wrong } = run.current;
    const durationMs = Date.now() - startedAt;
    const taps = correct + wrong;
    const accuracy = taps > 0 ? correct / taps : null;
    const nextStats = mergeRun(stats, { mode, intent, challengeId, configKey, score: sessionScore, displayTime });
    setStats(nextStats);
    saveStats(nextStats);
    setHistory((h) =>
      appendRun(h, {
        t: Date.now(),
        mode,
        intent,
        challengeId: isChallenge ? challengeId : null,
        configKey: isChallenge ? null : configKey,
        score: sessionScore,
        rounds: streak,
        displayTime,
        durationMs,
        accuracy,
      })
    );
    return {
      score: sessionScore,
      rounds: streak,
      noun: recordNoun,
      previousBest: record.best,
      isRecord: sessionScore > record.best,
      durationMs,
      accuracy,
      correct,
      wrong,
      displayTime,
      strikes,
    };
  };

  const finishSession = (reason) => {
    const result = bankSession();
    clearTimers();
    if (result) {
      setRunStats(result);
      setNewRecord(result.isRecord);
      emit(result.isRecord ? "record" : "over");
    }
    setEndReason(reason);
    setPhase("gameover");
  };

  const advanceRound = (overrides = null, holdBeforeReset = SUCCESS_HOLD) => {
    addTimer(() => setPhase("resetting"), holdBeforeReset);
    addTimer(() => startRound(false, overrides), holdBeforeReset + RESET_ANIM);
  };

  // A transition that also changes the board size hides the old pattern first, then
  // reshapes the (still blank) grid, and only then reveals the next round.
  const advanceTo = (overrides, applyState, holdBeforeReset = SUCCESS_HOLD) => {
    if (overrides.boardSize === boardSize) {
      applyState();
      advanceRound(overrides, holdBeforeReset);
      return;
    }
    addTimer(() => setPhase("resetting"), holdBeforeReset);
    addTimer(() => {
      applyState();
      setPhase("resizing");
    }, holdBeforeReset + RESET_ANIM);
    addTimer(() => startRound(false, overrides), holdBeforeReset + RESET_ANIM + RESIZE_HOLD);
  };

  const advanceAdaptiveRound = (nextAdaptive, holdBeforeReset) =>
    advanceTo({ level: nextAdaptive.level, boardSize: nextAdaptive.boardSize }, () => setAdaptive(nextAdaptive), holdBeforeReset);

  // One cleared round, one step. A fixed preset replays the same parameters; an endless
  // one advances its ramp, which for Queue means an extra pattern joins the back.
  const advanceChallengeRung = () => {
    const nextRung = rung + 1;
    const next = challengeParams(challenge, nextRung - 1);
    const overrides = { ...next, growBy: mode === "queue" ? next.queueSize - queueSize + 1 : 1 };
    advanceTo(overrides, () => setRung(nextRung));
  };

  const roundCleared = () => {
    setPhase("success");
    setStreak((s) => s + 1);
    emit("clear");
    if (isChallenge) advanceChallengeRung();
    else if (isAdaptivePattern) advanceAdaptiveRound(computeAdaptiveClear(adaptive), SUCCESS_HOLD);
    else advanceRound();
  };

  // Every caller is a click handler, where `hearts` is already the current value, so the
  // round end is scheduled here rather than from inside a (StrictMode-doubled) updater.
  const registerWrong = () => {
    run.current.wrong += 1;
    emit("wrong");
    setStrikes((s) => s + 1);
    const nextHearts = hearts - 1;
    setHearts(nextHearts);
    if (nextHearts > 0) return;
    if (isAdaptivePattern) {
      // Adaptive practice never hard-stops: an emptied round is a "fail" that retunes.
      advanceAdaptiveRound(computeAdaptiveFail(adaptive), 380);
    } else {
      addTimer(() => finishSession("lost"), 380);
    }
  };

  const handleCellClick = (i) => {
    if (phase !== "recall" || hearts <= 0) return;
    if (isPatternLike) {
      if (found.has(i) || wrongCells.has(i)) return;
      if (pattern.has(i)) {
        run.current.correct += 1;
        const nf = new Set(found);
        nf.add(i);
        setFound(nf);
        if (nf.size === pattern.size) roundCleared();
        else emit("correct");
      } else {
        setWrongCells((prev) => new Set(prev).add(i));
        registerWrong();
      }
    } else {
      if (wrongCells.has(i)) return;
      if (i === sequence[inputIndex]) {
        run.current.correct += 1;
        setFlashCorrect(i);
        addTimer(() => setFlashCorrect(null), 220);
        setWrongCells(new Set()); // a new step — earlier wrong guesses may be valid here
        const next = inputIndex + 1;
        setInputIndex(next);
        if (next === sequence.length) roundCleared();
        else emit("correct");
      } else {
        setWrongCells((prev) => new Set(prev).add(i));
        registerWrong();
      }
    }
  };

  // Bailing out mid-run still banks what was achieved rather than dropping it; a no-op
  // once the session has already been scored.
  function resetToIdle() {
    bankSession();
    clearTimers();
    setPhase("idle");
    setRung(1);
    setNewRecord(false);
    setHearts(3);
    setStrikes(0);
    setStreak(0);
    setPattern(new Set());
    setFound(new Set());
    setSequence([]);
    setInputIndex(0);
    setActiveStepPos(-1);
    setRevealedSteps(0);
    setWrongCells(new Set());
    setFlashCorrect(null);
    setQueueList([]);
    setRevealPatterns([]);
    setAdaptive(null);
  }

  // ---------- Rendering helpers ----------

  // What one cell shows right now. `mark` is "check" | "x" | null and `badge` is the
  // step number(s) shown on the answer reveal; each version draws them its own way.
  const cellVisual = (i) => {
    let faceUp = false;
    let tone = "idle";
    let mark = null;
    let badge = null;

    if (phase === "memorize") {
      if (mode === "pattern" && pattern.has(i)) {
        faceUp = true;
        tone = "highlight";
      }
      if (mode === "queue" && activeStepPos >= 0 && revealPatterns[activeStepPos]?.has(i)) {
        faceUp = true;
        tone = "highlight";
      }
      if (isSequenceLike && activeStepPos >= 0 && sequence[activeStepPos] === i) {
        faceUp = true;
        tone = "highlight";
      }
    }
    if (phase === "recall" || phase === "success") {
      if ((isPatternLike && found.has(i)) || (isSequenceLike && flashCorrect === i)) {
        faceUp = true;
        tone = "success";
        mark = "check";
      }
    }
    if (phase === "gameover") {
      if (isPatternLike && pattern.has(i)) {
        faceUp = true;
        const isFound = found.has(i);
        tone = isFound ? "success" : "missed";
        mark = isFound ? "check" : null;
      }
      if (isSequenceLike) {
        const positions = sequence.reduce((acc, c, p) => (c === i ? [...acc, p] : acc), []);
        if (positions.length > 0) {
          faceUp = true;
          tone = positions.some((p) => p >= inputIndex) ? "missed" : "success";
          badge = positions.map((p) => p + 1).join(",");
        }
      }
    }
    if (wrongCells.has(i)) {
      faceUp = true;
      tone = "wrong";
      mark = "x";
    }
    if (phase === "resetting" || phase === "resizing") faceUp = false;
    return { faceUp, tone, mark, badge, shake: wrongCells.has(i) };
  };

  const isPlaying = phase !== "idle" && phase !== "gameover";
  const clickable = phase === "recall" && hearts > 0;

  // What the round in progress is asking for, for progress dots.
  const roundTarget = isPatternLike ? pattern.size : sequence.length;
  const roundDone = isPatternLike ? found.size : inputIndex;

  return {
    // configuration
    mode,
    intent,
    isChallenge,
    challengeId,
    challenge,
    config,
    modeConfig,
    stats,
    history,
    prefs,
    speedFor,
    record,
    recordNoun,
    selectChallenge,
    selectPractice,
    updatePractice,
    setChallengeSpeed,
    setSound,
    setHaptics,
    emit,
    // the round
    phase,
    isPlaying,
    clickable,
    boardSize,
    total,
    level,
    displayTime,
    queueSize,
    allowRepeat,
    isPatternLike,
    isSequenceLike,
    isProgressive,
    isAdaptivePattern,
    adaptive,
    hearts,
    strikes,
    streak,
    rung,
    barKey,
    sequenceLength: sequence.length,
    inputIndex,
    activeStepPos,
    revealedSteps,
    revealCount: mode === "queue" ? revealPatterns.length : sequence.length,
    queueLength: queueList.length,
    roundTarget,
    roundDone,
    sessionScore,
    newRecord,
    endReason,
    runStats,
    cellVisual,
    handleCellClick,
    startGame,
    endRun: () => finishSession("quit"),
    resetToIdle,
  };
}
