import React, { useEffect, useRef, useState } from "react";
import { X, Trophy } from "lucide-react";
import { modeByKey, presetLabel } from "../../engine/catalog.js";
import { Board, Hearts, Burst } from "./ui.jsx";
import { modeVars } from "./theme.js";

const COUNT_STEP = 520;
const MAX_SEGS = 10;

// What the player is being asked to do right now, in as few words as possible.
function cueFor(g) {
  const { phase, mode } = g;
  if (phase === "memorize") {
    if (mode === "pattern") return `Memorize ${g.roundTarget}`;
    if (mode === "queue") return g.revealCount > 1 ? "Watch them line up" : "A new one joins";
    return "Watch the order";
  }
  if (phase === "recall") {
    if (mode === "pattern") return `Find all ${g.roundTarget}`;
    if (mode === "queue") return "Recall #1";
    if (mode === "progressive") return "Repeat it all";
    return "Your turn";
  }
  if (phase === "success") return g.hearts === 3 ? "Perfect!" : "Nice!";
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
    // Hold on the revealed answer for a moment before the results.
    const id = setTimeout(() => finishedRef.current(), 1500);
    return () => clearTimeout(id);
  }, [g.phase, count]);

  const counting = count > 0;
  const quit = () => {
    if (counting || g.phase === "idle" || g.phase === "gameover") onQuit();
    else g.endRun();
  };

  const name = modeByKey(g.mode).name;
  const chip = g.isChallenge
    ? `${name} ${presetLabel(g.challenge) === "∞" ? "∞" : g.challenge.title}`
    : `${name} · Free`;
  const roundNo = g.isChallenge ? g.rung : g.streak + 1;
  const cue = counting ? "Get ready" : cueFor(g);

  // Progress dots: steps revealed while memorizing a sequence, cells/steps entered while
  // recalling. Long sequences collapse to a meter so the dots never become a wall.
  const isSeqMemorize = g.isSequenceLike && g.phase === "memorize";
  const dotTotal = isSeqMemorize ? g.revealCount : g.roundTarget;
  const dotDone = isSeqMemorize ? g.revealedSteps : g.roundDone;
  const dotNow = isSeqMemorize ? g.activeStepPos : g.phase === "recall" && g.isSequenceLike ? g.inputIndex : -1;
  const showDots = !counting && g.phase !== "idle" && dotTotal > 0;

  const queueSlots = g.mode === "queue" ? Math.max(g.queueLength, g.queueSize || 0) : 0;
  const revealingSlot = g.phase === "memorize" && g.activeStepPos >= 0 ? queueSlots - g.revealCount + g.activeStepPos : -1;

  // Run vs record, in rounds. An endless record is stored as the level reached, so it's
  // converted back to rounds cleared before it can sit on the same track.
  const cleared = g.streak;
  const recordRounds =
    g.isChallenge && g.challenge.kind === "endless" ? Math.max(0, g.record.best - g.challenge.rampStart + 1) : g.record.best;
  const needed = Math.max(5, recordRounds + 1, cleared + 1);
  const segCount = Math.min(MAX_SEGS, needed);
  const segStart = Math.max(0, cleared + 1 - segCount);
  const segs = Array.from({ length: segCount }, (_, k) => {
    const r = segStart + k + 1;
    const playing = g.phase !== "gameover" && !counting;
    let state = "";
    if (r <= cleared) state = recordRounds > 0 && r > recordRounds ? "beat" : "done";
    else if (r === cleared + 1 && playing) state = "now";
    return { r, state, trophy: recordRounds > 0 && r === recordRounds };
  });

  return (
    <main className="ck-page ck-game" style={modeVars(g.mode)}>
      <div className="ck-game-head">
        <button type="button" className="ck-key ck-icon-key" onClick={quit} aria-label="End run">
          <X size={24} strokeWidth={2.8} />
        </button>
        <span className="ck-mode-chip">{chip}</span>
      </div>

      <div className="ck-game-body">
      <div className="ck-cue" aria-live="polite">
        <span key={cue} className="ck-cue-text pop">
          {cue}
        </span>
        {showDots && dotTotal <= 16 && (
          <div className="ck-dotrow" aria-hidden="true">
            {Array.from({ length: dotTotal }, (_, i) => (
              <i key={i} className={i === dotNow ? "now" : i < dotDone ? "done" : ""} />
            ))}
          </div>
        )}
        {showDots && dotTotal > 16 && (
          <div className="ck-meter" aria-hidden="true">
            <span style={{ width: `${(dotDone / dotTotal) * 100}%` }} />
          </div>
        )}
      </div>

      {queueSlots > 0 && (
        <div className="ck-queue" aria-label="Queue">
          {Array.from({ length: queueSlots }, (_, i) => (
            <span
              key={`${i}-${i === revealingSlot}`}
              className={`ck-qslot${i === revealingSlot ? " filled" : g.phase === "recall" && i === 0 ? " front" : ""}`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      )}

      <section className={`ck-card ck-board-card${g.phase === "success" ? " pulse" : ""}${g.phase === "resizing" ? " resizing" : ""}`}>
        <div className="ck-board-wrap">
          <Board g={g} mode={g.mode} />
        </div>
        {g.phase === "success" && <Burst seed={g.streak} key={g.streak} />}
        {counting && (
          <div className="ck-countdown">
            <span key={count}>{count}</span>
          </div>
        )}
      </section>

      {/* Always present for Pattern so the board doesn't jump when the timer appears. */}
      {g.mode === "pattern" && (
        <div className="ck-drain" aria-hidden="true" style={{ visibility: g.phase === "memorize" ? "visible" : "hidden" }}>
          {g.phase === "memorize" && <span key={g.barKey} style={{ animationDuration: `${g.displayTime}s` }} />}
        </div>
      )}
      </div>

      <section className="ck-hud" aria-label="Run">
        <div className="ck-round" aria-label={`Round ${roundNo}`}>
          <b>{roundNo}</b>
          <small>round</small>
        </div>
        <div
          className="ck-run"
          role="img"
          aria-label={`${cleared} cleared${recordRounds > 0 ? `, record ${g.record.best}` : ""}`}
        >
          <div className="ck-run-marks" style={{ gridTemplateColumns: `repeat(${segCount}, minmax(0, 1fr))` }}>
            {segs.map((s) => (
              <span key={s.r}>{s.trophy && <Trophy size={15} color="#B9821A" strokeWidth={2.8} />}</span>
            ))}
          </div>
          <div className="ck-run-segs" style={{ gridTemplateColumns: `repeat(${segCount}, minmax(0, 1fr))` }}>
            {segs.map((s) => (
              <i key={s.r} className={s.state} />
            ))}
          </div>
        </div>
        <Hearts count={g.hearts} size={20} />
      </section>
    </main>
  );
}
