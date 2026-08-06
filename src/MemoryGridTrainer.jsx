import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Settings,
  Play,
  RotateCcw,
  Grid3x3,
  ListOrdered,
  Eye,
  Timer,
  Repeat,
  X,
  Check,
  Flame,
  Minus,
  Plus,
  HeartCrack,
  TrendingUp,
  Layers,
  HelpCircle,
  Gauge,
  Square,
  Flag,
  Trophy,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { loadSettings, saveSettings, loadStats, saveStats, mergeRun, recordFor, practiceKey } from "./storage.js";
import { TutorialPlayer, TUTORIAL_SCRIPTS, MODE_RULES } from "./tutorial.jsx";
import {
  ADAPTIVE_MIN_BOARD,
  ADAPTIVE_MAX_BOARD,
  computeAdaptiveClear,
  computeAdaptiveFail,
} from "./ladder.js";
import {
  CHALLENGES,
  challengeById,
  challengesForMode,
  challengeParams,
  runScore,
  scoreNoun,
  DEFAULT_CHALLENGE_DISPLAY_TIME,
  CHALLENGE_DISPLAY_TIME_MIN,
  CHALLENGE_DISPLAY_TIME_MAX,
} from "./challenges.js";

const C = {
  bg: "#EEF0F6",
  surface: "#FFFFFF",
  ink: "#3B3F51",
  mutedInk: "#9298AC",
  accent: "#8CA0DB",
  accentSoft: "#DCE4F7",
  success: "#7FBF9E",
  successSoft: "#E1F2E9",
  wrong: "#E38585",
  wrongSoft: "#FBE7E7",
  heart: "#E0778C",
  heartEmpty: "#DEE1EA",
  gold: "#E0AA3E",
  cellIdle: "#E3E6F0",
  cellBorder: "#D3D8E6",
};

const TONE_BG = {
  idle: C.cellIdle,
  highlight: C.accent,
  success: C.success,
  wrong: C.wrong,
};
const TONE_BORDER = {
  idle: C.cellBorder,
  highlight: C.accent,
  success: C.success,
  wrong: C.wrong,
};

// Pattern memory: 6x6 board, 10 cards to find.
// Sequence memory: 3x3 board, 10 steps, repeats allowed.
// Progressive sequence: 3x3 board, starts at 3 steps, +1 each round, repeats always on.
// Queue: 3x3 board, patterns of 4 cells, 3 patterns in flight, reproduce the oldest each round.
const DEFAULT_CONFIG = {
  pattern: { boardSize: 6, level: 10, displayTime: 2, adaptive: true },
  sequence: { boardSize: 3, level: 10, allowRepeat: true, displayTime: 1 },
  progressive: { boardSize: 3, startLength: 3, increment: 1, displayTime: 1 },
  queue: { boardSize: 3, level: 4, queueSize: 3, displayTime: 2 },
};

const MODE_OPTIONS = [
  { key: "pattern", icon: <Grid3x3 size={20} />, label: "Pattern" },
  { key: "sequence", icon: <ListOrdered size={20} />, label: "Sequence" },
  { key: "progressive", icon: <TrendingUp size={20} />, label: "Progressive" },
  { key: "queue", icon: <Layers size={20} />, label: "Queue" },
];

const MODE_BLURB = {
  pattern: "Memorize the highlighted cells, then tap them all.",
  sequence: "Memorize the order, then repeat it back.",
  progressive: "The sequence grows every round — how far can you go?",
  queue: "A queue of patterns keeps growing — reproduce the oldest one while a new one joins the back.",
};

// practiceKey() is a machine identity ("boardSize=6,level=10,..."); the Records screen
// needs it back as something readable.
const CONFIG_LABELS = {
  boardSize: (v) => `${v}×${v}`,
  level: (v) => `${v} cells`,
  displayTime: (v) => `${v}s`,
  queueSize: (v) => `${v} deep`,
  startLength: (v) => `from ${v}`,
  increment: (v) => `+${v}/round`,
  adaptive: (v) => (v === "true" ? "adaptive" : null),
  allowRepeat: (v) => (v === "true" ? "repeats" : "no repeats"),
};

const describeConfigKey = (key) =>
  key
    .split(",")
    .map((pair) => {
      const [k, v] = pair.split("=");
      return CONFIG_LABELS[k] ? CONFIG_LABELS[k](v) : null;
    })
    .filter(Boolean)
    .join(" · ");

// Every score noun is a plain plural (rounds / cells / steps / patterns), so one rule
// covers them all rather than each call site remembering to special-case 1.
const countOf = (n, noun) => `${n} ${n === 1 ? noun.replace(/s$/, "") : noun}`;

const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";

const SUCCESS_HOLD = 480; // how long the success glow lingers before reset
const RESET_ANIM = 700; // how long the flip-down reset wave takes
const RESIZE_HOLD = 900; // how long the board-size-change transition holds, cells already blank

// Every non-game screen shares this shell so the menu, records and tutorial feel like one
// app rather than three overlays.
function Stepper({ icon, value, onChange, min, max, step = 1, format, label }) {
  const s = typeof step === "function" ? step(value) : step;
  const dec = () => onChange(Math.max(min, +(value - s).toFixed(2)));
  const inc = () => onChange(Math.min(max, +(value + s).toFixed(2)));
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: C.bg,
        borderRadius: 16,
        padding: "10px 14px",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: C.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.accent,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={dec}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            border: "none",
            background: C.surface,
            boxShadow: "0 1px 2px rgba(59,63,81,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: value <= min ? C.mutedInk : C.ink,
            cursor: value <= min ? "default" : "pointer",
            opacity: value <= min ? 0.5 : 1,
          }}
        >
          <Minus size={14} />
        </button>
        <div
          role="status"
          style={{
            minWidth: 44,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            color: C.ink,
            fontSize: 15,
          }}
        >
          {format ? format(value) : value}
        </div>
        <button
          onClick={inc}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            border: "none",
            background: C.surface,
            boxShadow: "0 1px 2px rgba(59,63,81,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: value >= max ? C.mutedInk : C.ink,
            cursor: value >= max ? "default" : "pointer",
            opacity: value >= max ? 0.5 : 1,
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ icon, checked, onChange, label = "Toggle" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: C.bg,
        borderRadius: 16,
        padding: "10px 14px",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: checked ? C.accentSoft : "#E7E9F1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: checked ? C.accent : C.mutedInk,
        }}
      >
        {icon}
      </div>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={label}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          border: "none",
          background: checked ? C.accent : "#D5D9E5",
          position: "relative",
          cursor: "pointer",
          transition: "background 150ms ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 150ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

function ModeCarousel({ mode, onChange, options }) {
  const cardRefs = useRef({});
  useEffect(() => {
    const el = cardRefs.current[mode];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [mode]);

  return (
    <div className="mode-carousel">
      {options.map((o) => (
        <button
          key={o.key}
          ref={(el) => {
            cardRefs.current[o.key] = el;
          }}
          onClick={() => onChange(o.key)}
          className="mode-card"
          style={{
            background: mode === o.key ? C.accent : C.bg,
            color: mode === o.key ? "#fff" : C.mutedInk,
          }}
        >
          {o.icon}
          <span style={{ fontWeight: 700, fontSize: 12 }}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Screen({ title, onBack, children, footer }) {
  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        background: C.bg,
        fontFamily: FONT,
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 }}>
        {(title || onBack) && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 40 }}>
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Back"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 13,
                  border: "none",
                  background: C.surface,
                  boxShadow: "0 2px 8px rgba(59,63,81,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.ink,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: C.ink }}>{title}</h1>
          </div>
        )}
        {children}
        {footer}
      </div>
    </div>
  );
}

function MenuButton({ icon, label, description, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "left",
        background: C.surface,
        border: "none",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 2px 12px rgba(59,63,81,0.07)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: accent ? C.accent : C.accentSoft,
          color: accent ? "#fff" : C.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 12, color: C.mutedInk, lineHeight: 1.35, marginTop: 2 }}>{description}</div>
      </div>
    </button>
  );
}

function DrainBar({ duration, active, barKey }) {
  const [width, setWidth] = useState("100%");
  useEffect(() => {
    if (!active) return;
    setWidth("100%");
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setWidth("0%"));
    });
    // Intentionally not depending on `duration`: changing it mid-drain would restart the
    // animation rather than let the current round's bar finish.
    return () => cancelAnimationFrame(raf1);
  }, [barKey, active]);
  return (
    <div style={{ height: 8, borderRadius: 6, background: C.accentSoft, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width,
          background: C.accent,
          transition: active ? `width ${duration}s linear` : "none",
        }}
      />
    </div>
  );
}

function SegmentBar({ count, filled, current, color, currentColor }) {
  const segs = Array.from({ length: count }, (_, i) => i);
  return (
    <div style={{ display: "flex", gap: 4, height: 8, flexWrap: "wrap" }}>
      {segs.map((i) => {
        let bg = C.accentSoft;
        if (currentColor !== undefined && i === current) bg = currentColor;
        else if (i < filled) bg = color;
        return (
          <div
            key={i}
            style={{
              flex: "1 0 6px",
              minWidth: 6,
              borderRadius: 6,
              background: bg,
              transition: "background 150ms ease",
            }}
          />
        );
      })}
    </div>
  );
}

function Card({ faceUp, tone, content, badge, clickable, onClick, transitionDelay, transitionDuration, shake, label }) {
  return (
    <div className={`cell-wrap${shake ? " shake" : ""}`}>
      <div className="card-scene">
        <button
          onClick={onClick}
          disabled={!clickable}
          aria-label={label}
          className={`card${faceUp ? " flipped" : ""}${clickable ? "" : " no-interact"}`}
          style={{ transitionDelay, transitionDuration }}
        >
          <div className="card-face card-face-front" style={{ background: C.cellIdle, borderColor: C.cellBorder }} />
          <div
            className="card-face card-face-back"
            style={{ background: TONE_BG[tone], borderColor: TONE_BORDER[tone] }}
          >
            {content}
            {badge && (
              <span
                style={{
                  position: "absolute",
                  bottom: 3,
                  right: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  opacity: 0.9,
                }}
              >
                {badge}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

export default function MemoryGridTrainer() {
  const [restored] = useState(() => loadSettings(DEFAULT_CONFIG, "pattern"));
  const [mode, setMode] = useState(restored.mode); // 'pattern' | 'sequence' | 'progressive' | 'queue'
  const [intent, setIntent] = useState(restored.intent); // 'challenge' (ranked) | 'practice'
  const [config, setConfig] = useState(restored.config);
  const [stats, setStats] = useState(() =>
    loadStats(Object.keys(DEFAULT_CONFIG), CHALLENGES.map((c) => c.id))
  );
  const [challengeId, setChallengeId] = useState(() => challengesForMode(restored.mode)[0].id);
  const [challengeDisplayTime, setChallengeDisplayTime] = useState(restored.challengeDisplayTime);
  const [showSettings, setShowSettings] = useState(false);
  // 'menu' is the landing screen; 'modes' picks a mode for the chosen intent. The tutorial
  // is a screen rather than an overlay so the Queue demo has room for its queue strip.
  const [screen, setScreen] = useState("menu"); // menu | modes | game | records | tutorial
  const [tutorialMode, setTutorialMode] = useState("pattern");

  const [phase, setPhase] = useState("idle"); // idle, memorize, recall, success, resetting, gameover
  const [pattern, setPattern] = useState(new Set());
  const [found, setFound] = useState(new Set());
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeStepPos, setActiveStepPos] = useState(-1);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [wrongCells, setWrongCells] = useState(new Set()); // cells confirmed wrong for the current round/step
  const [flashCorrect, setFlashCorrect] = useState(null);
  const [queueList, setQueueList] = useState([]); // queue mode: patterns waiting behind the current target
  const [revealPatterns, setRevealPatterns] = useState([]); // queue mode: pattern(s) currently rolling in memorize phase
  const [adaptive, setAdaptive] = useState(null); // pattern mode: { level, boardSize, clearStreak, failStreak }

  const [hearts, setHearts] = useState(3);
  const [strikes, setStrikes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [barKey, setBarKey] = useState(0);

  // Challenge only: which rung of the ladder the current round is, 1-based. Every cleared
  // round steps it up by one, so the score at the end is simply how many rungs were cleared.
  const [rung, setRung] = useState(1);
  const [endReason, setEndReason] = useState("lost"); // 'lost' | 'quit'
  const [newRecord, setNewRecord] = useState(false);

  useEffect(() => {
    saveSettings({ config, mode, intent, challengeDisplayTime });
  }, [config, mode, intent, challengeDisplayTime]);

  const timers = useRef([]);
  // Starts true: nothing is in flight at mount, so an early mode switch banks nothing.
  const sessionEnded = useRef(true);
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
  // A Challenge drives its own preset, so adaptive practice never applies inside one.
  const isAdaptivePattern = !isChallenge && mode === "pattern" && modeConfig.adaptive;

  // configBoardSize/configLevel are the saved settings (what the Settings sheet shows and
  // edits); boardSize/level are what's actually in play, which diverges from the saved
  // config inside a Challenge (driven by the preset) or an adaptive practice run.
  const configBoardSize = modeConfig.boardSize;
  const configLevel = modeConfig.level;
  // `rung` counts rounds played, so the parameters follow from rounds *cleared*.
  const preset = isChallenge ? challengeParams(challenge, rung - 1) : null;

  const boardSize = isChallenge
    ? preset.boardSize
    : isAdaptivePattern && adaptive
      ? adaptive.boardSize
      : configBoardSize;
  const level = isChallenge ? preset.level : isAdaptivePattern && adaptive ? adaptive.level : configLevel;
  // The one Challenge setting the player controls, and it only turns down from 2s.
  const challengeSpeed = challengeDisplayTime[challengeId] ?? DEFAULT_CHALLENGE_DISPLAY_TIME;
  const displayTime = isChallenge ? challengeSpeed : modeConfig.displayTime;
  const queueSize = isChallenge ? preset.queueSize : modeConfig.queueSize;
  const startLength = isChallenge ? preset.startLength : modeConfig.startLength;
  const increment = isChallenge ? preset.increment : modeConfig.increment;
  // Challenge sequences always allow repeats — a no-repeat rule would cap length at the
  // cell count and make the longer presets impossible on a small board.
  const allowRepeat = isChallenge ? true : mode === "sequence" ? modeConfig.allowRepeat : isProgressive;

  const total = boardSize * boardSize;
  // Pattern/Queue: cap at half the board so the last few cells aren't a trivial deduction.
  // Sequence: repeats make length effectively unbounded, so just cap at a generous 60.
  const configTotal = configBoardSize * configBoardSize;
  const maxLevel =
    isPatternLike ? Math.floor(configTotal / 2) : modeConfig.allowRepeat ? 60 : Math.min(configTotal - 1, 60);

  // A fixed preset scores rounds cleared; an endless one scores the level it reached.
  // Practice keeps its own best per exact configuration, never a ranked record.
  const configKey = practiceKey(modeConfig);
  const record = recordFor(stats, { mode, intent, challengeId, configKey });
  const sessionScore = isChallenge ? runScore(challenge, streak) : streak;

  const updateModeConfig = (patch) =>
    setConfig((c) => ({ ...c, [mode]: { ...c[mode], ...patch } }));

  const updateBoardSize = (v) =>
    setConfig((c) => {
      const mc = c[mode];
      if (mode === "progressive") {
        return { ...c, [mode]: { ...mc, boardSize: v } };
      }
      const t = v * v;
      const maxL = mode === "pattern" || mode === "queue" ? Math.floor(t / 2) : mc.allowRepeat ? 60 : Math.min(t - 1, 60);
      return { ...c, [mode]: { ...mc, boardSize: v, level: Math.min(mc.level, maxL) } };
    });

  const updateAllowRepeat = (val) =>
    setConfig((c) => {
      const mc = c[mode];
      const t = mc.boardSize * mc.boardSize;
      const maxL = val ? 60 : Math.min(t - 1, 60);
      return { ...c, [mode]: { ...mc, allowRepeat: val, level: Math.min(mc.level, maxL) } };
    });

  const generatePatternOfSize = (size, t = total) => {
    const idxs = Array.from({ length: t }, (_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return new Set(idxs.slice(0, size));
  };

  const generateSequence = (len, t) => {
    if (allowRepeat) {
      return Array.from({ length: len }, () => Math.floor(Math.random() * t));
    }
    const idxs = Array.from({ length: t }, (_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return idxs.slice(0, len);
  };

  // Every round parameter is resolved here rather than read from the closure, so a
  // Challenge can hand the next rung's board/level/queue depth straight in — the round
  // that runs is always the one the caller asked for, never a stale render's.
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

    if (mode === "pattern") {
      const p = generatePatternOfSize(rLevel, rTotal);
      setPattern(p);
      setFound(new Set());
      setPhase("memorize");
      setBarKey((k) => k + 1);
      addTimer(() => setPhase("recall"), displayTime * 1000);
    } else if (mode === "queue") {
      setFound(new Set());
      setPhase("memorize");
      setActiveStepPos(-1);
      setRevealedSteps(0);
      const stepDur = displayTime * 1000;
      const gap = 200;

      // The patterns joining the back: the whole queue on the opening round, and
      // afterwards one replacement plus however many extra a deepening rung asked for.
      const fresh = Array.from({ length: isFirstRound ? rQueue : rGrowBy }, () =>
        generatePatternOfSize(rLevel, rTotal)
      );
      const nextQueue = isFirstRound ? fresh : [...queueList.slice(1), ...fresh];
      const incoming = fresh;

      setQueueList(nextQueue);
      setPattern(nextQueue[0]);
      setRevealPatterns(incoming);
      incoming.forEach((_, idx) => {
        const onAt = idx * (stepDur + gap);
        addTimer(() => setActiveStepPos(idx), onAt);
        addTimer(() => {
          setActiveStepPos(-1);
          setRevealedSteps(idx + 1);
        }, onAt + stepDur);
      });
      addTimer(() => setPhase("recall"), incoming.length * (stepDur + gap));
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
      const stepDur = displayTime * 1000;
      const gap = 200;
      seq.forEach((_, idx) => {
        const onAt = idx * (stepDur + gap);
        addTimer(() => setActiveStepPos(idx), onAt);
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
    sessionEnded.current = false;
    if (isAdaptivePattern) {
      setAdaptive({ level: modeConfig.level, boardSize: modeConfig.boardSize, clearStreak: 0, failStreak: 0 });
    }
    // A Challenge always opens on rung 1 regardless of what Settings holds.
    startRound(true, isChallenge ? challengeParams(challenge, 0) : null);
  };

  // Folds the finished run into the stats, exactly once — a stray timer or a second exit
  // path would otherwise inflate the play count. Returns whether it beat the record it
  // belongs to (the ranked one for a Challenge, this exact config's for Practice).
  const bankSession = () => {
    if (sessionEnded.current) return false;
    sessionEnded.current = true;
    const nextStats = mergeRun(stats, {
      mode,
      intent,
      challengeId,
      configKey,
      score: sessionScore,
      displayTime,
    });
    setStats(nextStats);
    saveStats(nextStats);
    return sessionScore > record.best;
  };

  const finishSession = (reason) => {
    const beatRecord = bankSession();
    clearTimers();
    setNewRecord(beatRecord);
    setEndReason(reason);
    setPhase("gameover");
  };

  const advanceRound = (overrides = null, holdBeforeReset = SUCCESS_HOLD) => {
    addTimer(() => setPhase("resetting"), holdBeforeReset);
    addTimer(() => startRound(false, overrides), holdBeforeReset + RESET_ANIM);
  };

  // A transition that also changes the board size needs an extra beat: the reset wave
  // hides the old pattern first, THEN the grid reshapes (still blank) with its own
  // "resizing" cue, and only after that does the next round reveal anything. Without it
  // the grid would reshape while the old round's pattern is still visibly on screen.
  // `applyState` commits the new ladder position at whichever moment the board is blank.
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
    advanceTo(
      { level: nextAdaptive.level, boardSize: nextAdaptive.boardSize },
      () => setAdaptive(nextAdaptive),
      holdBeforeReset
    );

  // One cleared round, one rung. Queue deepens by handing the next round an extra pattern
  // to append; the other modes just take the rung's board/level.
  // One cleared round, one step. A fixed preset simply replays the same parameters; an
  // endless one advances its ramp, which for Queue means an extra pattern joins the back.
  const advanceChallengeRung = () => {
    const nextRung = rung + 1;
    const next = challengeParams(challenge, nextRung - 1);
    const overrides = { ...next, growBy: mode === "queue" ? next.queueSize - queueSize + 1 : 1 };
    advanceTo(overrides, () => setRung(nextRung));
  };

  // Scheduling the round end from inside a setHearts updater would run it twice under
  // StrictMode (updaters must stay pure), so derive the new count here instead — every
  // caller is a click handler, where `hearts` is already the current value.
  const registerWrong = () => {
    setStrikes((s) => s + 1);
    const nextHearts = hearts - 1;
    setHearts(nextHearts);
    if (nextHearts > 0) return;
    if (isAdaptivePattern) {
      // Adaptive mode never hard-stops: a depleted-hearts round is a "fail" that
      // adjusts the level/board (if it's the 2nd fail in a row) and keeps going.
      advanceAdaptiveRound(computeAdaptiveFail(adaptive), 380);
    } else {
      addTimer(() => finishSession("lost"), 380);
    }
  };

  const handleCellClick = (i) => {
    if (phase !== "recall") return;

    if (isPatternLike) {
      if (found.has(i) || wrongCells.has(i)) return;
      if (pattern.has(i)) {
        const nf = new Set(found);
        nf.add(i);
        setFound(nf);
        if (nf.size === pattern.size) {
          setPhase("success");
          setStreak((s) => s + 1);
          if (isChallenge) {
            advanceChallengeRung();
          } else if (isAdaptivePattern) {
            advanceAdaptiveRound(computeAdaptiveClear(adaptive), SUCCESS_HOLD);
          } else {
            advanceRound();
          }
        }
      } else {
        setWrongCells((prev) => new Set(prev).add(i));
        registerWrong();
      }
    } else {
      if (wrongCells.has(i)) return;
      const expected = sequence[inputIndex];
      if (i === expected) {
        setFlashCorrect(i);
        addTimer(() => setFlashCorrect(null), 220);
        setWrongCells(new Set()); // moving to a new step — earlier wrong guesses may be valid here
        const next = inputIndex + 1;
        setInputIndex(next);
        if (next === sequence.length) {
          setPhase("success");
          setStreak((s) => s + 1);
          if (isChallenge) advanceChallengeRung();
          else advanceRound();
        }
      } else {
        setWrongCells((prev) => new Set(prev).add(i));
        registerWrong();
      }
    }
  };

  const resetToIdle = () => {
    // Bailing out mid-run (Settings, mode switch) still banks what was achieved rather
    // than silently dropping it; no-op once the session has already been scored.
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
  };

  const applySettingsAndRestart = () => {
    setShowSettings(false);
    resetToIdle();
  };

  // Switching modes mid-round would leave stale round state rendering against the new
  // mode's board size, so any mode picker (idle screen, settings, tutorial) routes here.
  const changeMode = (key) => {
    setMode(key);
    // Challenge presets belong to a mode, so a stale id from the previous mode would
    // resolve to the wrong board entirely. Callers that want a specific preset set it
    // straight after this, overwriting the default.
    setChallengeId(challengesForMode(key)[0].id);
    resetToIdle();
  };


  // Settings can change board size/level live; if a round were still running underneath,
  // those edits would resize the grid out from under it. So opening Settings immediately
  // stops the game — the only way back in is Apply & Restart, then pressing Play again.
  const openSettings = () => {
    resetToIdle();
    setShowSettings(true);
  };

  // Smaller gap on bigger boards so cells stay a reasonable size; scale the flip speed
  // down for very short display times so it can complete within the reveal window.
  const cellGap = Math.max(3, 8 - (boardSize - 3));
  const boardMax = 380;
  const flipMs = Math.min(420, displayTime * 1000 * 0.6);

  const getCellVisual = (i) => {
    let tone = "idle";
    let content = null;
    let badge = null;
    let faceUp = false;

    if (phase === "memorize" && mode === "pattern" && pattern.has(i)) {
      faceUp = true;
      tone = "highlight";
    }
    if (phase === "memorize" && mode === "queue" && activeStepPos >= 0 && revealPatterns[activeStepPos]?.has(i)) {
      faceUp = true;
      tone = "highlight";
    }
    if (phase === "memorize" && isSequenceLike && activeStepPos >= 0 && sequence[activeStepPos] === i) {
      faceUp = true;
      tone = "highlight";
    }
    if (phase === "recall" || phase === "success") {
      if (isPatternLike && found.has(i)) {
        faceUp = true;
        tone = "success";
        content = <Check size={18} color="#fff" strokeWidth={3} />;
      }
      if (isSequenceLike && flashCorrect === i) {
        faceUp = true;
        tone = "success";
        content = <Check size={18} color="#fff" strokeWidth={3} />;
      }
    }
    if (phase === "gameover") {
      if (isPatternLike && pattern.has(i)) {
        faceUp = true;
        const isFound = found.has(i);
        tone = isFound ? "success" : "highlight";
        content = isFound ? <Check size={16} color="#fff" strokeWidth={3} /> : null;
      }
      if (isSequenceLike) {
        const positions = sequence.reduce((acc, c, p) => (c === i ? [...acc, p] : acc), []);
        if (positions.length > 0) {
          faceUp = true;
          const pending = positions.some((p) => p >= inputIndex);
          tone = pending ? "highlight" : "success";
          badge = positions.map((p) => p + 1).join(",");
        }
      }
    }
    if (wrongCells.has(i)) {
      faceUp = true;
      tone = "wrong";
      content = <X size={18} color="#fff" strokeWidth={3} />;
    }
    if (phase === "resetting" || phase === "resizing") {
      faceUp = false;
    }

    return { faceUp, tone, content, badge };
  };

  // Streak doesn't reflect difficulty in modes where the level itself climbs, so those
  // show the current level as the headline stat instead.
  // In a Challenge the rung *is* the score, so show it directly. Otherwise streak only
  // fails to reflect difficulty in the modes where the level itself climbs.
  const showsLevelStat = (isChallenge && challenge.kind === "endless") || isProgressive || isAdaptivePattern;
  const primaryStatValue = isChallenge
    ? challenge.kind === "endless"
      ? level
      : streak
    : isProgressive
      ? sequence.length
      : isAdaptivePattern
        ? level
        : streak;
  const isPlaying = phase !== "idle" && phase !== "gameover";

  // What the saved record and the just-finished run actually amounted to, in the mode's
  // own terms, so a bare rung number never has to be decoded by the player.
  const recordNoun = isChallenge ? scoreNoun(challenge) : "rounds";
  const recordDescription =
    isChallenge && record.best > 0
      ? `${countOf(record.best, recordNoun)}${record.bestDisplayTime ? ` at ${record.bestDisplayTime}s` : ""}`
      : null;
  const practiceSummary = isProgressive
    ? `${configBoardSize}×${configBoardSize}, from ${modeConfig.startLength} steps, ${modeConfig.displayTime}s`
    : mode === "queue"
      ? `${configBoardSize}×${configBoardSize}, ${configLevel} cells, ${modeConfig.queueSize} deep, ${modeConfig.displayTime}s`
      : `${configBoardSize}×${configBoardSize}, ${configLevel} ${mode === "sequence" ? "steps" : "cells"}, ${modeConfig.displayTime}s`;

  let barNode;
  if (phase === "memorize" && mode === "pattern") {
    barNode = <DrainBar duration={displayTime} active barKey={barKey} />;
  } else if (phase === "memorize" && mode === "queue") {
    barNode = (
      <SegmentBar
        count={Math.max(revealPatterns.length, 1)}
        filled={revealedSteps}
        current={activeStepPos}
        color={C.accent}
        currentColor={C.gold}
      />
    );
  } else if (phase === "memorize" && isSequenceLike) {
    barNode = (
      <SegmentBar
        count={Math.max(sequence.length, 1)}
        filled={revealedSteps}
        current={activeStepPos}
        color={C.accent}
        currentColor={C.gold}
      />
    );
  } else if ((phase === "recall" || phase === "success") && isSequenceLike) {
    barNode = (
      <SegmentBar
        count={Math.max(sequence.length, 1)}
        filled={inputIndex}
        current={inputIndex}
        color={C.success}
        currentColor={C.gold}
      />
    );
  } else if ((phase === "recall" || phase === "success") && isPatternLike) {
    barNode = <SegmentBar count={Math.max(pattern.size, 1)} filled={found.size} color={C.success} />;
  } else {
    barNode = <div style={{ height: 8 }} />;
  }

  // Leaving the game for any other screen tears the run down first, banking whatever it
  // was worth — same rule as switching mode or opening Settings.
  const goHome = () => {
    resetToIdle();
    setScreen("menu");
  };

  const openTutorial = (fromMode) => {
    setTutorialMode(fromMode || mode);
    setScreen("tutorial");
  };

  if (screen === "menu") {
    return (
      <Screen>
        <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
            Memory Trainer
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.mutedInk }}>
            Four ways to stretch how much you can hold at once.
          </p>
        </div>
        <MenuButton
          accent
          icon={<Trophy size={21} />}
          label="Challenge"
          description="Ranked. Locked settings, one step harder each round."
          onClick={() => {
            setIntent("challenge");
            setScreen("challenges");
          }}
        />
        <MenuButton
          icon={<Dumbbell size={21} />}
          label="Training"
          description="Your own settings, unranked. Warm up or drill a weak spot."
          onClick={() => {
            setIntent("practice");
            setScreen("modes");
          }}
        />
        <MenuButton
          icon={<BarChart3 size={21} />}
          label="Records"
          description="Challenge records and your training bests."
          onClick={() => setScreen("records")}
        />
        <MenuButton
          icon={<BookOpen size={21} />}
          label="How to play"
          description="A walkthrough of each mode."
          onClick={() => openTutorial(mode)}
        />
      </Screen>
    );
  }

  if (screen === "challenges") {
    return (
      <Screen title="Challenge" onBack={() => setScreen("menu")}>
        <div style={{ fontSize: 12, color: C.mutedInk, lineHeight: 1.5, padding: "0 4px" }}>
          Each row is one mode, easiest on the left. Settings are fixed apart from speed,
          which only turns down — so a record always means "at this pace or faster".
        </div>
        {MODE_OPTIONS.map((o) => (
          <div
            key={o.key}
            style={{
              background: C.surface,
              borderRadius: 20,
              padding: "14px 0 12px",
              boxShadow: "0 2px 12px rgba(59,63,81,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 16px 10px",
                fontSize: 14,
                fontWeight: 700,
                color: C.ink,
              }}
            >
              <span style={{ color: C.accent, display: "flex" }}>{o.icon}</span>
              {o.label}
            </div>
            <div className="mode-carousel" style={{ scrollSnapType: "none" }}>
              {challengesForMode(o.key).map((ch) => {
                const rec = stats.challenge[ch.id];
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      changeMode(o.key);
                      setChallengeId(ch.id);
                      setScreen("game");
                    }}
                    style={{
                      flex: "0 0 auto",
                      width: 108,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 3,
                      padding: "11px 12px",
                      borderRadius: 15,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      background: ch.kind === "endless" ? C.accentSoft : C.bg,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{ch.title}</span>
                    <span style={{ fontSize: 10.5, color: C.mutedInk, lineHeight: 1.25 }}>{ch.detail}</span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        color: rec.best > 0 ? C.ink : C.mutedInk,
                      }}
                    >
                      <Trophy size={10} color={rec.best > 0 ? C.gold : C.heartEmpty} />
                      {rec.best > 0 ? countOf(rec.best, scoreNoun(ch)) : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Screen>
    );
  }

  if (screen === "modes") {
    return (
      <Screen title="Training" onBack={() => setScreen("menu")}>
        <div style={{ fontSize: 12, color: C.mutedInk, lineHeight: 1.5, padding: "0 4px" }}>
          Pick a mode, then tune it however you like in Settings. Bests are kept per
          configuration and stay out of the records.
        </div>
        {MODE_OPTIONS.map((o) => {
          const modeRecord = recordFor(stats, {
            mode: o.key,
            intent: "practice",
            configKey: practiceKey(config[o.key]),
          });
          return (
            <button
              key={o.key}
              onClick={() => {
                changeMode(o.key);
                setScreen("game");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                textAlign: "left",
                background: C.surface,
                border: "none",
                borderRadius: 20,
                padding: "14px 16px",
                boxShadow: "0 2px 12px rgba(59,63,81,0.07)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  background: C.accentSoft,
                  color: C.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {o.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{o.label}</div>
                <div style={{ fontSize: 12, color: C.mutedInk, lineHeight: 1.35, marginTop: 2 }}>
                  {MODE_BLURB[o.key]}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 6,
                    fontSize: 11,
                    color: modeRecord.plays > 0 ? C.ink : C.mutedInk,
                  }}
                >
                  <Trophy size={11} color={modeRecord.plays > 0 ? C.gold : C.heartEmpty} />
                  {modeRecord.plays > 0 ? (
                    <span>
                      Best here <strong>{modeRecord.best}</strong>
                    </span>
                  ) : (
                    <span style={{ opacity: 0.8 }}>Not played yet</span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} color={C.mutedInk} style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </Screen>
    );
  }

  if (screen === "records") {
    return (
      <Screen title="Records" onBack={() => setScreen("menu")}>
        <div
          style={{
            background: C.surface,
            borderRadius: 20,
            padding: 16,
            boxShadow: "0 2px 12px rgba(59,63,81,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <Trophy size={15} color={C.gold} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Challenge records</span>
          </div>
          <div style={{ fontSize: 11, color: C.mutedInk, marginBottom: 12, lineHeight: 1.4 }}>
            Fixed presets score rounds cleared; endless ones score the level reached.
          </div>
          {MODE_OPTIONS.map((o) => (
            <div key={o.key} style={{ paddingTop: 9, borderTop: `1px solid ${C.bg}` }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.ink,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: C.accent, display: "flex" }}>{o.icon}</span>
                {o.label}
              </div>
              {challengesForMode(o.key).map((ch) => {
                const r = stats.challenge[ch.id];
                return (
                  <div
                    key={ch.id}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "3px 0 3px 22px",
                    }}
                  >
                    <span style={{ fontSize: 11, color: C.mutedInk }}>
                      {ch.title} · {ch.detail}
                      {r.bestDisplayTime ? ` · at ${r.bestDisplayTime}s` : ""}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.best > 0 ? C.ink : C.heartEmpty, flexShrink: 0 }}>
                      {r.best > 0 ? countOf(r.best, scoreNoun(ch)) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div
          style={{
            background: C.surface,
            borderRadius: 20,
            padding: 16,
            boxShadow: "0 2px 12px rgba(59,63,81,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <Dumbbell size={15} color={C.accent} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Training bests</span>
          </div>
          <div style={{ fontSize: 11, color: C.mutedInk, marginBottom: 12, lineHeight: 1.4 }}>
            Rounds cleared, kept separately for each configuration you've played.
          </div>
          {MODE_OPTIONS.every((o) => Object.keys(stats.practice[o.key] || {}).length === 0) ? (
            <div style={{ fontSize: 12, color: C.mutedInk, paddingTop: 8, borderTop: `1px solid ${C.bg}` }}>
              No training runs yet.
            </div>
          ) : (
            MODE_OPTIONS.map((o) => {
              const entries = Object.entries(stats.practice[o.key] || {});
              if (entries.length === 0) return null;
              return (
                <div key={o.key} style={{ paddingTop: 9, borderTop: `1px solid ${C.bg}` }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.ink,
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ color: C.accent, display: "flex" }}>{o.icon}</span>
                    {o.label}
                  </div>
                  {entries
                    .sort((a, b) => b[1].best - a[1].best)
                    .map(([key, rec]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "3px 0 3px 22px",
                        }}
                      >
                        <span style={{ fontSize: 11, color: C.mutedInk, wordBreak: "break-word" }}>
                          {describeConfigKey(key)}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, flexShrink: 0 }}>
                          {rec.best}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })
          )}
        </div>
      </Screen>
    );
  }

  if (screen === "tutorial") {
    return (
      <Screen title="How to play" onBack={() => setScreen(isPlaying || phase === "gameover" ? "game" : "menu")}>
        <div style={{ background: C.surface, borderRadius: 20, padding: "16px 0", boxShadow: "0 2px 12px rgba(59,63,81,0.07)" }}>
          <ModeCarousel mode={tutorialMode} onChange={setTutorialMode} options={MODE_OPTIONS} />
          <div style={{ padding: "6px 20px 0" }}>
            <div style={{ background: C.bg, borderRadius: 18, padding: "18px 12px" }}>
              <TutorialPlayer mode={tutorialMode} script={TUTORIAL_SCRIPTS[tutorialMode]} C={C} Card={Card} />
            </div>
            <ul style={{ margin: "14px 0 0", padding: "0 0 0 18px", color: C.ink, fontSize: 12.5, lineHeight: 1.65 }}>
              {MODE_RULES[tutorialMode].map((line) => (
                <li key={line} style={{ marginBottom: 3 }}>
                  {line}
                </li>
              ))}
            </ul>
            <div
              style={{
                marginTop: 12,
                fontSize: 11.5,
                color: C.mutedInk,
                lineHeight: 1.5,
                borderTop: `1px solid ${C.bg}`,
                paddingTop: 10,
              }}
            >
              <strong style={{ color: C.ink }}>Challenge</strong> offers{" "}
              {challengesForMode(tutorialMode).length} fixed presets for this mode — the endless one gets
              harder every cleared round, the rest hold steady and count how long you last.
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <div
      style={{
        minHeight: 620,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        background: C.bg,
        fontFamily: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.surface,
            borderRadius: 20,
            padding: "12px 16px",
            boxShadow: "0 2px 10px rgba(59,63,81,0.06)",
          }}
        >
          <button
            onClick={goHome}
            aria-label="Back to menu"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: "none",
              background: C.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.ink,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <div key={hearts} className="hearts-row pulse">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={22}
                color={i < hearts ? C.heart : C.heartEmpty}
                fill={i < hearts ? C.heart : "none"}
                strokeWidth={i < hearts ? 0 : 2}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: showsLevelStat ? C.accent : C.gold }}>
              {showsLevelStat ? <TrendingUp size={18} /> : <Flame size={18} fill={C.gold} strokeWidth={0} />}
              <span key={primaryStatValue} className="streak-pop" style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
                {primaryStatValue}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.mutedInk }}>
              <X size={16} strokeWidth={3} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{strikes}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Mid-run, this slot becomes the way out: adaptive mode never hits game over,
                so without it the only exit is a mode switch that scores nothing. */}
            {isPlaying ? (
              <button
                onClick={() => finishSession("quit")}
                aria-label="End session"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border: "none",
                  background: C.wrongSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.wrong,
                  cursor: "pointer",
                }}
              >
                <Square size={15} fill={C.wrong} strokeWidth={0} />
              </button>
            ) : (
              <button
                onClick={() => openTutorial(mode)}
                aria-label="How to play"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border: "none",
                  background: C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.ink,
                  cursor: "pointer",
                }}
              >
                <HelpCircle size={18} />
              </button>
            )}
            <button
              onClick={openSettings}
              aria-label="Settings"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: C.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.ink,
                cursor: "pointer",
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div
          className={phase === "success" ? "board-pulse" : phase === "resizing" ? "board-resize-pulse" : ""}
          style={{
            position: "relative",
            background: C.surface,
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 2px 14px rgba(59,63,81,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {barNode}

          <div style={{ position: "relative", width: "100%", maxWidth: boardMax, aspectRatio: "1 / 1", margin: "0 auto" }}>
            <div
              className={phase === "resizing" ? "grid-resize-fade" : ""}
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                gridTemplateRows: `repeat(${boardSize}, 1fr)`,
                gap: cellGap,
              }}
            >
              {Array.from({ length: total }, (_, i) => {
                const { faceUp, tone, content, badge } = getCellVisual(i);
                // A cell confirmed wrong stays locked (and marked) for the rest of this
                // round/step — it can't be the answer, so don't let it cost another heart.
                // Once hearts hit 0, lock the whole board so late taps can't sneak in
                // during the brief delay before the round actually ends.
                const clickable = phase === "recall" && !wrongCells.has(i) && hearts > 0;
                const row = Math.floor(i / boardSize);
                const col = i % boardSize;
                const waveDelay = Math.min((row + col) * 30, 240);
                // Pattern/Queue's memorize reveal flips all at once; only the between-round reset uses the wave.
                const transitionDelay = phase === "resetting" ? `${waveDelay}ms` : "0ms";
                return (
                  <Card
                    key={i}
                    faceUp={faceUp}
                    tone={tone}
                    content={content}
                    badge={badge}
                    clickable={clickable}
                    onClick={() => handleCellClick(i)}
                    transitionDelay={transitionDelay}
                    transitionDuration={`${flipMs}ms`}
                    shake={wrongCells.has(i)}
                    label={`Row ${row + 1}, column ${col + 1}`}
                  />
                );
              })}
            </div>

            {phase === "idle" && (
              <div
                className="idle-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.88)",
                  borderRadius: 12,
                }}
              >
                <button
                  onClick={startGame}
                  aria-label="Start"
                  className="play-btn"
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    border: "none",
                    background: C.accent,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 18px rgba(140,160,219,0.5)",
                    cursor: "pointer",
                  }}
                >
                  <Play size={30} fill="#fff" style={{ marginLeft: 4 }} />
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", color: C.mutedInk, fontSize: 12, letterSpacing: 0.2 }}>
            {phase === "memorize" && "Memorize"}
            {phase === "recall" && "Your turn"}
            {phase === "idle" && "Press play to begin"}
            {phase === "success" && "Nice!"}
            {phase === "resetting" && "Next round..."}
            {phase === "resizing" && `Board resizing to ${boardSize}×${boardSize}...`}
            {phase === "gameover" && (endReason === "quit" ? "Session ended" : "Here's the answer")}
          </div>
        </div>

        {phase === "idle" && (
          <div
            className="idle-mode-panel"
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: "16px 0 18px",
              boxShadow: "0 2px 14px rgba(59,63,81,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: C.ink,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              <span style={{ color: C.accent, display: "flex" }}>
                {MODE_OPTIONS.find((o) => o.key === mode)?.icon}
              </span>
              {MODE_OPTIONS.find((o) => o.key === mode)?.label}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: isChallenge ? C.accentSoft : C.bg,
                  color: isChallenge ? C.accent : C.mutedInk,
                  borderRadius: 999,
                  padding: "3px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {isChallenge ? <Trophy size={11} /> : <Dumbbell size={11} />}
                {isChallenge ? "Challenge" : "Training"}
              </span>
            </div>
            <div style={{ textAlign: "center", color: C.mutedInk, fontSize: 12, lineHeight: 1.4, padding: "0 20px" }}>
              {MODE_BLURB[mode]}
            </div>

            <div style={{ textAlign: "center", padding: "0 20px" }}>
              {isChallenge ? (
                <div style={{ color: C.mutedInk, fontSize: 12, lineHeight: 1.5 }}>
                  {challenge.kind === "endless"
                    ? "Gets one step harder every cleared round. Ends when you slip."
                    : "Fixed difficulty. Ends when you slip — how long can you hold it?"}
                  <br />
                  <strong style={{ color: C.ink }}>
                    {challenge.title} · {challenge.detail} · {displayTime}s
                  </strong>
                </div>
              ) : (
                <div style={{ color: C.mutedInk, fontSize: 12, lineHeight: 1.5 }}>
                  Your settings, unranked. Bests are kept per configuration.
                  <br />
                  <strong style={{ color: C.ink }}>{practiceSummary}</strong>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 8,
                  color: C.mutedInk,
                  fontSize: 12,
                }}
              >
                <Trophy size={13} color={record.plays > 0 ? C.gold : C.heartEmpty} />
                {record.plays > 0 ? (
                  <>
                    <span>
                      {isChallenge ? "Record" : "Best here"}{" "}
                      <strong style={{ color: C.ink, fontWeight: 700 }}>
                        {isChallenge && recordDescription ? recordDescription : record.best}
                      </strong>
                    </span>
                    <span style={{ opacity: 0.6 }}>· {record.plays} played</span>
                  </>
                ) : (
                  <span style={{ opacity: 0.75 }}>
                    {isChallenge ? "No record yet" : "Not played at these settings yet"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {phase === "gameover" && (
          <div
            className="gameover-panel"
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: 18,
              boxShadow: "0 2px 14px rgba(59,63,81,0.07)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            {endReason === "quit" ? <Flag size={32} color={C.accent} /> : <HeartCrack size={34} color={C.heart} />}
            <div style={{ display: "flex", gap: 22 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", color: C.gold }}>
                  <Flame size={16} fill={C.gold} strokeWidth={0} />
                </div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 17 }}>{streak}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", color: C.mutedInk }}>
                  <X size={15} strokeWidth={3} />
                </div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 17 }}>{strikes}</div>
              </div>
            </div>

            {/* A Challenge reports the rung it stopped at and what that rung actually
                asked for, so the number means something without a lookup table. */}
            {isChallenge && (
              <div style={{ textAlign: "center", color: C.mutedInk, fontSize: 12, lineHeight: 1.5 }}>
                {challenge.kind === "endless" ? "Reached " : "Held "}
                <strong style={{ color: C.ink }}>{countOf(sessionScore, recordNoun)}</strong>
                <br />
                {challenge.title} · {challenge.detail} · {displayTime}s
              </div>
            )}

            {newRecord ? (
              <div
                className="record-badge"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#FBF1DC",
                  color: "#8A6410",
                  borderRadius: 999,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Trophy size={13} />
                {isChallenge ? "New record!" : "New best at these settings!"}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.mutedInk, fontSize: 12 }}>
                <Trophy size={13} color={C.gold} />
                {isChallenge ? "Record" : "Best here"}{" "}
                <strong style={{ color: C.ink }}>
                  {isChallenge ? countOf(record.best, recordNoun) : record.best}
                </strong>
              </div>
            )}
            <button
              onClick={() => {
                resetToIdle();
                setScreen(isChallenge ? "challenges" : "modes");
              }}
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: "none",
                background: C.accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(140,160,219,0.5)",
              }}
              aria-label="Back to menu"
            >
              <RotateCcw size={22} />
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div
          className="settings-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(59,63,81,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 20,
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="settings-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: 20,
              width: "100%",
              maxWidth: 360,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 12px 40px rgba(59,63,81,0.25)",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.ink, fontWeight: 700, fontSize: 16 }}>
                <Settings size={18} />
                Settings
              </div>
              <button
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  border: "none",
                  background: C.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.mutedInk,
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* A Challenge fixes every setting below, so say that plainly rather than
                showing steppers that silently have no effect on the next run. */}
            {isChallenge && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  background: C.accentSoft,
                  color: C.ink,
                  borderRadius: 14,
                  padding: "10px 12px",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                <Trophy size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>
                    {challenge.title} · {challenge.detail}
                  </strong>
                  <br />
                  Board and size are fixed so one record means one thing. Speed is yours —
                  it only turns down, so going faster can never inflate a record.
                </span>
              </div>
            )}

            {isChallenge && (
              <Stepper
                icon={<Timer size={16} />}
                value={challengeSpeed}
                onChange={(v) => setChallengeDisplayTime((d) => ({ ...d, [challengeId]: v }))}
                min={CHALLENGE_DISPLAY_TIME_MIN}
                max={CHALLENGE_DISPLAY_TIME_MAX}
                step={(v) => (v <= 1 ? 0.1 : 0.25)}
                label="display time"
                format={(v) => `${v.toFixed(1)}s`}
              />
            )}

            {!isChallenge && mode === "sequence" && (
              <ToggleRow icon={<Repeat size={16} />} checked={allowRepeat} onChange={updateAllowRepeat} label="Allow repeat" />
            )}

            {!isChallenge && mode === "pattern" && (
              <ToggleRow
                icon={<Gauge size={16} />}
                checked={modeConfig.adaptive}
                onChange={(v) => updateModeConfig({ adaptive: v })}
                label="Adaptive difficulty"
              />
            )}

            {!isChallenge && (
            <Stepper
              icon={<Grid3x3 size={16} />}
              value={configBoardSize}
              onChange={updateBoardSize}
              min={ADAPTIVE_MIN_BOARD}
              max={ADAPTIVE_MAX_BOARD}
              label="board size"
              format={(v) => `${v}×${v}`}
            />
            )}

            {!isChallenge && !isProgressive && (
              <Stepper
                icon={mode === "sequence" ? <ListOrdered size={16} /> : <Eye size={16} />}
                value={configLevel}
                onChange={(v) => updateModeConfig({ level: v })}
                min={2}
                max={maxLevel}
                label={mode === "sequence" ? "sequence length" : "cells to find"}
              />
            )}

            {!isChallenge && mode === "queue" && (
              <Stepper
                icon={<Layers size={16} />}
                value={modeConfig.queueSize}
                onChange={(v) => updateModeConfig({ queueSize: v })}
                min={2}
                max={6}
                label="queue size"
              />
            )}

            {!isChallenge && isProgressive && (
              <>
                <Stepper
                  icon={<ListOrdered size={16} />}
                  value={modeConfig.startLength}
                  onChange={(v) => updateModeConfig({ startLength: v })}
                  min={2}
                  max={20}
                  label="starting length"
                />
                <Stepper
                  icon={<TrendingUp size={16} />}
                  value={modeConfig.increment}
                  onChange={(v) => updateModeConfig({ increment: v })}
                  min={1}
                  max={5}
                  label="steps added per round"
                />
              </>
            )}

            {!isChallenge && (
            <Stepper
              icon={<Timer size={16} />}
              value={displayTime}
              onChange={(v) => updateModeConfig({ displayTime: v })}
              min={0.1}
              max={5}
              step={(v) => (v < 1 ? 0.1 : 0.5)}
              label="display time"
              format={(v) => `${v.toFixed(1)}s`}
            />
            )}

            <button
              onClick={applySettingsAndRestart}
              style={{
                marginTop: 6,
                border: "none",
                background: C.accent,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 14,
                padding: "12px 0",
                cursor: "pointer",
              }}
            >
              {isChallenge ? "Done" : "Apply"}
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
