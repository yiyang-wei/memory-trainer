import React, { useEffect, useRef, useState } from "react";
import { X, Trophy } from "lucide-react";
import { modeByKey, presetLabel, formatSpeed } from "../../engine/catalog.js";
import { Board, Hearts, Burst, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";
import { LiveBuddy, Bubble } from "./Buddy.jsx";
import { CLEAR, FLOATY, TUCK, jumpFx } from "./jumps.js";

const COUNT_STEP = 520;
const MAX_DOTS = 10;
// Rounds in a row, without a miss, that earn the buddy its halo.
const HALO_AFTER = 3;

// The bobble on the buddy's antenna takes the exercise colour (gold on Pattern, whose
// colour is the buddy's own).
export const accentFor = (mode) => (mode === "pattern" ? "#E0AA3E" : THEME[mode].main);

// What the buddy says right now, in as few words as possible.
export function cueFor(g) {
  const { phase, mode } = g;
  if (phase === "memorize") {
    if (mode === "pattern") return "Memorize!";
    if (mode === "queue") return g.revealCount > 1 ? "Watch them line up" : "A new one joins";
    return "Watch the order";
  }
  if (phase === "recall") {
    if (mode === "pattern") return `Find all ${g.roundTarget}`;
    if (mode === "queue") return "Recall #1, the oldest";
    if (mode === "progressive") return "Repeat it all";
    return "Your turn";
  }
  if (phase === "success") return g.strikes === 0 ? "Perfect!" : "Nice!";
  if (phase === "resetting") return "Next one";
  if (phase === "resizing") return `Now ${g.boardSize}×${g.boardSize}!`;
  if (phase === "gameover") return g.endReason === "quit" ? "Run ended" : "Out of hearts";
  return "Ready?";
}

const moodFor = (g) => {
  const { phase } = g;
  if (phase === "memorize") return "watch";
  if (phase === "recall") return "think";
  if (phase === "success" || phase === "resetting" || phase === "resizing") return "happy";
  if (phase === "gameover") return g.endReason === "quit" ? "idle" : "gentle";
  return "idle";
};

// The level in a few characters, for the header chip.
export function levelChip(g) {
  const name = modeByKey(g.mode).name;
  if (!g.isChallenge) return `${name} · ${g.boardSize}×${g.boardSize}`;
  const title = presetLabel(g.challenge) === "∞" ? `∞ ${g.challenge.title}` : g.challenge.title;
  return `${name} ${title} · ${formatSpeed(g.displayTime)}`;
}

// The record expressed in cleared rounds, so it can sit on the same track as this run.
// Endless presets record the value reached, which is rampStart + rounds − 1.
export function recordRounds(g) {
  const best = g.record.best;
  if (!best) return 0;
  if (g.isChallenge && g.challenge.kind === "endless") return Math.max(0, best - g.challenge.rampStart + 1);
  return best;
}

function RunTrack({ g }) {
  const rec = recordRounds(g);
  const cleared = g.streak;
  const total = Math.max(rec, cleared + 1);
  if (total <= MAX_DOTS) {
    const items = [];
    for (let i = 0; i < total; i++) {
      items.push(<span key={i} className={`dot${i < cleared ? " done" : i === cleared ? " now" : ""}`} />);
      if (rec > 0 && i === rec - 1) items.push(<Trophy key="rec" size={16} color="#C98A1A" strokeWidth={2.8} />);
    }
    return (
      <div className="bd-round-dots" role="img" aria-label={`${cleared} rounds cleared${rec ? `, record ${rec}` : ""}`}>
        {items}
      </div>
    );
  }
  return (
    <div className="bd-round-dots" role="img" aria-label={`${cleared} rounds cleared, record ${rec}`}>
      <div className="bd-round-bar">
        <span style={{ width: `${(cleared / total) * 100}%` }} />
        {rec > 0 && (
          <Trophy
            size={16}
            color="#C98A1A"
            strokeWidth={2.8}
            style={{ position: "absolute", left: `calc(${(rec / total) * 100}% - 8px)`, top: -18 }}
          />
        )}
      </div>
    </div>
  );
}

export default function Game({ g, onQuit, onFinished }) {
  const [count, setCount] = useState(3);
  const startRef = useRef(g.startGame);
  startRef.current = g.startGame;
  const emitRef = useRef(g.emit);
  emitRef.current = g.emit;

  // A short 3-2-1 before every run, so the first pattern never flashes while the player
  // is still finding the board.
  useEffect(() => {
    let n = 3;
    emitRef.current("count");
    const id = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(id);
        setCount(0);
        startRef.current();
      } else {
        setCount(n);
        emitRef.current("count");
      }
    }, COUNT_STEP);
    return () => clearInterval(id);
  }, []);

  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  useEffect(() => {
    if (g.phase !== "gameover" || count > 0) return;
    // The result screen keeps the answer on show, so only a short beat is needed here.
    const id = setTimeout(() => finishedRef.current(), 900);
    return () => clearTimeout(id);
  }, [g.phase, count]);

  // Brief reactions on top of the phase mood: a grin per correct tap, a wince per miss.
  const [react, setReact] = useState(null);
  const reactTimer = useRef(null);
  const seen = useRef({ strikes: g.strikes, done: g.roundDone });
  useEffect(() => {
    const prev = seen.current;
    seen.current = { strikes: g.strikes, done: g.roundDone };
    let next = null;
    if (g.strikes > prev.strikes && g.hearts > 0) {
      next = { mood: "oops", text: g.hearts === 1 ? "Last heart!" : "Oops!", ms: 900 };
    } else if (g.phase === "recall" && g.roundDone > prev.done) {
      next = { mood: "happy", ms: 380 };
    }
    if (!next) return;
    setReact({ ...next, k: Date.now() });
    clearTimeout(reactTimer.current);
    reactTimer.current = setTimeout(() => setReact(null), next.ms);
  }, [g.strikes, g.roundDone, g.hearts, g.phase]);
  useEffect(() => () => clearTimeout(reactTimer.current), []);
  // A miss is old news once the round moves on.
  useEffect(() => {
    if (g.phase !== "recall") setReact(null);
  }, [g.phase]);

  // Every cleared round gets a jump. Passing the record gets a flip (once a run), and the
  // round that earns the halo a floaty hop. A miss knocks the halo off.
  const [jump, setJump] = useState({ n: 0, motion: null });
  const [halo, setHalo] = useState(false);
  const clean = useRef(0);
  const flipped = useRef(false);
  const latest = useRef(g);
  latest.current = g;
  useEffect(() => {
    if (g.phase !== "success") return;
    const now = latest.current;
    clean.current += 1;
    let motion = CLEAR;
    if (now.record.best > 0 && now.sessionScore > now.record.best && !flipped.current) {
      flipped.current = true;
      motion = TUCK;
    } else if (clean.current === HALO_AFTER) motion = FLOATY;
    if (clean.current >= HALO_AFTER) setHalo(true);
    setJump((j) => ({ n: j.n + 1, motion }));
  }, [g.phase]);
  const strikesSeen = useRef(g.strikes);
  useEffect(() => {
    const missed = g.strikes > strikesSeen.current;
    strikesSeen.current = g.strikes;
    if (!missed) return;
    clean.current = 0;
    setHalo((h) => (h ? "falling" : false));
  }, [g.strikes]);
  useEffect(() => {
    if (halo !== "falling") return undefined;
    const id = setTimeout(() => setHalo(false), 700);
    return () => clearTimeout(id);
  }, [halo]);

  const counting = count > 0;
  const quit = () => {
    if (counting || g.phase === "idle" || g.phase === "gameover") onQuit();
    else g.endRun();
  };

  const roundNo = g.isChallenge ? g.rung : g.streak + 1;
  const live = !counting && g.phase !== "idle";

  // Passing the old record mid-run is worth a cheer before the run is even over.
  const pastRecord = g.record.best > 0 && g.sessionScore > g.record.best;
  let mood = counting ? "idle" : moodFor(g);
  let text = counting ? "Ready?" : cueFor(g);
  if (g.phase === "success" && pastRecord) {
    mood = "cheer";
    text = "New best!";
  }
  if (react && !counting) {
    mood = react.mood;
    if (react.text) text = react.text;
  }

  // Progress dots: steps shown while a sequence plays, cells/steps entered while
  // recalling. A long sequence collapses to a bar so the dots never wrap into a wall.
  const isSeqMemorize = g.isSequenceLike && g.phase === "memorize";
  const dotTotal = isSeqMemorize ? g.revealCount : g.roundTarget;
  const dotDone = isSeqMemorize ? g.revealedSteps : g.roundDone;
  const dotNow = isSeqMemorize ? g.activeStepPos : g.phase === "recall" && g.isSequenceLike ? g.inputIndex : -1;
  const draining = g.mode === "pattern" && g.phase === "memorize";

  const queueSlots = g.mode === "queue" ? Math.max(g.queueLength, g.queueSize || 0) : 0;
  const revealingSlot = g.phase === "memorize" && g.activeStepPos >= 0 ? queueSlots - g.revealCount + g.activeStepPos : -1;

  return (
    <main className="bd-game bd-in" style={modeVars(g.mode)}>
      <div className="bd-game-head">
        <button type="button" className="bd-icon-btn" onClick={quit} aria-label="End run">
          <X size={23} strokeWidth={2.6} />
        </button>
        <span className="bd-pill tinted" style={{ transform: "rotate(-1.5deg)" }}>
          {levelChip(g)}
        </span>
        <Hearts count={counting ? 3 : g.hearts} />
      </div>

      <div className="bd-game-body">
        <div className="bd-round">
          <span key={roundNo} className={`bd-round-num${live ? " bump" : ""}`} style={{ visibility: live ? "visible" : "hidden" }}>
            {roundNo}
          </span>
          {live ? <RunTrack g={g} /> : <div className="bd-round-dots" />}
        </div>

        {queueSlots > 0 && (
          <div className="bd-queue" aria-label="Queue">
            {Array.from({ length: queueSlots }, (_, i) => (
              <span
                key={i}
                className={`bd-qslot${i === revealingSlot ? " filled" : g.phase === "recall" && i === 0 ? " front" : ""}`}
                style={{ "--tilt": `${i % 2 ? 2 : -2}deg` }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        )}

        <section
          className={`bd-sticker bd-board-card${g.phase === "success" ? " pulse" : ""}${g.phase === "resizing" ? " resizing" : ""}`}
        >
          <Board g={g} blank={counting} />
          {g.phase === "success" && <Burst seed={g.streak} key={g.streak} />}
          {counting && (
            <div className="bd-countdown">
              <span key={count}>{count}</span>
            </div>
          )}
        </section>
      </div>

      <div className="bd-hud">
        <LiveBuddy className="bd-hud-buddy" mood={mood} accent={accentFor(g.mode)} halo={halo} jump={jump} fx={jumpFx(g.prefs)} />
        <Bubble tail="left" className="bd-hud-bubble">
          <span key={text} className="bd-say" aria-live="polite">
            {text}
          </span>
          <div className="bd-progress" aria-hidden="true">
            {draining ? (
              <div className="bd-drain">
                <span key={g.barKey} style={{ animationDuration: `${g.displayTime}s` }} />
              </div>
            ) : live && dotTotal > 16 ? (
              <div className="bd-round-bar" style={{ width: "100%" }}>
                <span style={{ width: `${(dotDone / Math.max(1, dotTotal)) * 100}%`, background: "var(--ok)" }} />
              </div>
            ) : live && g.phase !== "gameover" ? (
              Array.from({ length: dotTotal }, (_, i) => (
                <span key={i} className={i === dotNow ? "now" : i < dotDone ? (isSeqMemorize ? "seen" : "done") : ""} />
              ))
            ) : null}
          </div>
        </Bubble>
      </div>
    </main>
  );
}
