import React, { useEffect, useRef, useState } from "react";
import { X, Trophy } from "lucide-react";
import { Board, Hearts, Burst } from "./ui.jsx";
import { modeVars } from "./theme.js";

const COUNT_STEP = 520;

// What the player is being asked to do right now, in as few words as possible.
export function cueFor(g) {
  const { phase, mode } = g;
  if (phase === "memorize") {
    if (mode === "pattern") return "Memorize";
    if (mode === "queue") return g.revealCount > 1 ? "Watch them line up" : "A new one joins";
    return "Watch the order";
  }
  if (phase === "recall") {
    if (mode === "pattern") return `Find all ${g.roundTarget}`;
    if (mode === "queue") return "Recall #1, the oldest";
    if (mode === "progressive") return "Repeat it all";
    return "Repeat the order";
  }
  if (phase === "success") return g.strikes === 0 ? "Perfect!" : "Nice!";
  if (phase === "resetting") return "Next round";
  if (phase === "resizing") return `Board ${g.boardSize}×${g.boardSize}`;
  if (phase === "gameover") return g.endReason === "quit" ? "Run ended" : "Out of hearts";
  return "Get ready";
}

export default function Game({ g, onQuit, onFinished }) {
  const [count, setCount] = useState(3);
  const startRef = useRef(g.startGame);
  startRef.current = g.startGame;
  const emitRef = useRef(g.emit);
  emitRef.current = g.emit;

  // A short 3-2-1 before every run, so the first pattern never flashes while the player
  // is still looking for the board.
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
    // Hold on the revealed answer for a moment before the results.
    const id = setTimeout(() => finishedRef.current(), 1500);
    return () => clearTimeout(id);
  }, [g.phase, count]);

  const counting = count > 0;
  const quit = () => {
    if (counting || g.phase === "idle" || g.phase === "gameover") onQuit();
    else g.endRun();
  };

  const roundNo = g.isChallenge ? g.rung : g.streak + 1;
  const showTarget = !counting && g.phase !== "idle";
  const bigNumber = g.mode === "queue" ? g.level : g.isSequenceLike ? g.sequenceLength || g.level : g.level;

  // Progress dots: steps revealed while memorizing a sequence, cells/steps entered while
  // recalling. A long sequence collapses to a bar so the dots never wrap into a wall.
  const isSeqMemorize = g.isSequenceLike && g.phase === "memorize";
  // Queue's slot strip already shows the reveal, so its dots only count the recall.
  const dotTotal = g.mode === "queue" && g.phase === "memorize" ? 0 : isSeqMemorize ? g.revealCount : g.roundTarget;
  const dotDone = isSeqMemorize ? g.revealedSteps : g.roundDone;
  const dotNow = isSeqMemorize ? g.activeStepPos : g.phase === "recall" && g.isSequenceLike ? g.inputIndex : -1;

  const queueSlots = g.mode === "queue" ? Math.max(g.queueLength, g.queueSize || 0) : 0;
  const revealingSlot = g.phase === "memorize" && g.activeStepPos >= 0 ? queueSlots - g.revealCount + g.activeStepPos : -1;

  return (
    <main className="gl-page gl-screen-in" style={modeVars(g.mode)}>
      <div className="gl-game-head">
        <button type="button" className="gl-icon-btn" onClick={quit} aria-label="End run">
          <X size={22} strokeWidth={2.6} />
        </button>
        <span className="gl-pill" style={{ color: "var(--m-ink)" }}>
          Round {roundNo}
          {g.record.best > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#B07B17" }}>
              · <Trophy size={13} strokeWidth={2.8} />
              {g.record.best}
            </span>
          )}
        </span>
        <Hearts count={g.hearts} />
      </div>

      <div className="gl-game-body">
      <div className="gl-target" aria-live="polite">
        <span className="gl-target-num" style={{ visibility: showTarget ? "visible" : "hidden" }}>
          {bigNumber}
        </span>
        <span className="gl-target-cue">{counting ? "Get ready" : cueFor(g)}</span>
        <div className="gl-progress-dots" aria-hidden="true">
          {showTarget && dotTotal <= 16
            ? Array.from({ length: dotTotal }, (_, i) => (
                <span key={i} className={i === dotNow ? "now" : i < dotDone ? "done" : ""} />
              ))
            : null}
          {showTarget && dotTotal > 16 && (
            <div className="gl-drain" style={{ width: 220, marginTop: 2 }}>
              <span style={{ animation: "none", transform: `scaleX(${dotDone / Math.max(1, dotTotal)})` }} />
            </div>
          )}
        </div>
      </div>

      {queueSlots > 0 && (
        <div className="gl-queue" aria-label="Queue">
          {Array.from({ length: queueSlots }, (_, i) => (
            <span
              key={i}
              className={`gl-qslot${i === revealingSlot ? " filled" : g.phase === "recall" && i === 0 ? " front" : ""}`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      )}

      <section
        className={`gl-card gl-board-card${g.phase === "success" ? " pulse" : ""}${g.phase === "resizing" ? " resizing" : ""}`}
      >
        <Board g={g} mode={g.mode} />
        {g.phase === "success" && <Burst seed={g.streak} key={g.streak} />}
        {counting && (
          <div className="gl-countdown">
            <span key={count}>{count}</span>
          </div>
        )}
      </section>

      {/* Always present for Pattern so the board doesn't jump when the timer appears. */}
      {g.mode === "pattern" && (
        <div className="gl-drain" aria-hidden="true" style={{ visibility: g.phase === "memorize" ? "visible" : "hidden" }}>
          {g.phase === "memorize" && <span key={g.barKey} style={{ animationDuration: `${g.displayTime}s` }} />}
        </div>
      )}
      </div>
    </main>
  );
}
