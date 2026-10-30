import React, { useEffect, useRef, useState } from "react";
import { X, Trophy } from "lucide-react";
import { modeByKey, presetLabel, formatSpeed } from "../../engine/catalog.js";
import { Board, Hearts, Burst, Tape, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";

const COUNT_STEP = 520;
const MAX_DOTS = 10;

// What the player is being asked to do right now, in as few words as possible.
export function cueFor(g) {
  const { phase, mode } = g;
  if (phase === "memorize") {
    if (mode === "pattern") return "Memorize";
    if (mode === "queue")
      return g.revealCount > 1 ? "Watch them line up" : "A new one joins";
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
  if (phase === "gameover")
    return g.endReason === "quit" ? "Run ended" : "Out of hearts";
  return "Get ready";
}

// The level in a few characters, for the header chip.
export function levelChip(g) {
  const name = modeByKey(g.mode).name;
  if (!g.isChallenge) return `${name} · ${g.boardSize}×${g.boardSize}`;
  const title =
    presetLabel(g.challenge) === "∞"
      ? `∞ ${g.challenge.title}`
      : g.challenge.title;
  return `${name} ${title} · ${formatSpeed(g.displayTime)}`;
}

// The record expressed in cleared rounds, so it can sit on the same track as this run.
// Endless presets record the value reached, which is rampStart + rounds − 1.
export function recordRounds(g) {
  const best = g.record.best;
  if (!best) return 0;
  if (g.isChallenge && g.challenge.kind === "endless")
    return Math.max(0, best - g.challenge.rampStart + 1);
  return best;
}

function RunTrack({ g }) {
  const rec = recordRounds(g);
  const cleared = g.streak;
  const total = Math.max(rec, cleared + 1);
  if (total <= MAX_DOTS) {
    const items = [];
    for (let i = 0; i < total; i++) {
      items.push(
        <span
          key={i}
          className={`dot${i < cleared ? " done" : i === cleared ? " now" : ""}`}
        />,
      );
      if (rec > 0 && i === rec - 1)
        items.push(
          <Trophy key="rec" size={16} color="#C98A1A" strokeWidth={2.8} />,
        );
    }
    return (
      <div
        className="sb-round-dots"
        role="img"
        aria-label={`${cleared} rounds cleared${rec ? `, record ${rec}` : ""}`}
      >
        {items}
      </div>
    );
  }
  return (
    <div
      className="sb-round-dots"
      role="img"
      aria-label={`${cleared} rounds cleared, record ${rec}`}
    >
      <div className="sb-round-bar">
        <span style={{ width: `${(cleared / total) * 100}%` }} />
        {rec > 0 && (
          <Trophy
            size={16}
            color="#C98A1A"
            strokeWidth={2.8}
            style={{
              position: "absolute",
              left: `calc(${(rec / total) * 100}% - 8px)`,
              top: -18,
            }}
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
    const id = setTimeout(() => finishedRef.current(), 800);
    return () => clearTimeout(id);
  }, [g.phase, count]);

  const counting = count > 0;
  const quit = () => {
    if (counting || g.phase === "idle" || g.phase === "gameover") onQuit();
    else g.endRun();
  };

  const roundNo = g.isChallenge ? g.rung : g.streak + 1;
  const live = !counting && g.phase !== "idle";

  // Progress dots: steps shown while a sequence plays, cells/steps entered while
  // recalling. A long sequence collapses to a bar so the dots never wrap into a wall.
  const isSeqMemorize = g.isSequenceLike && g.phase === "memorize";
  const dotTotal = isSeqMemorize ? g.revealCount : g.roundTarget;
  const dotDone = isSeqMemorize ? g.revealedSteps : g.roundDone;
  const dotNow = isSeqMemorize
    ? g.activeStepPos
    : g.phase === "recall" && g.isSequenceLike
      ? g.inputIndex
      : -1;

  const queueSlots =
    g.mode === "queue" ? Math.max(g.queueLength, g.queueSize || 0) : 0;
  const revealingSlot =
    g.phase === "memorize" && g.activeStepPos >= 0
      ? queueSlots - g.revealCount + g.activeStepPos
      : -1;

  return (
    <main className="sb-page sb-game sb-in" style={modeVars(g.mode)}>
      <div className="sb-game-head">
        <button
          type="button"
          className="sb-icon-btn"
          onClick={quit}
          aria-label="End run"
        >
          <X size={23} strokeWidth={2.6} />
        </button>
        <span
          className="sb-pill tinted"
          style={{ transform: "rotate(-1.5deg)" }}
        >
          {levelChip(g)}
        </span>
        {/* A fresh run always starts on 3; the engine still holds the last run until then. */}
        <Hearts count={counting ? 3 : g.hearts} />
      </div>

      <div className="sb-game-body">
        <div className="sb-round">
          <span
            key={roundNo}
            className={`sb-round-num${live ? " bump" : ""}`}
            style={{ visibility: live ? "visible" : "hidden" }}
          >
            {roundNo}
          </span>
          {live ? <RunTrack g={g} /> : <div className="sb-round-dots" />}
        </div>

        <div className="sb-game-mid">
          {queueSlots > 0 && (
            <div className="sb-queue" aria-label="Queue">
              {Array.from({ length: queueSlots }, (_, i) => (
                <span
                  key={i}
                  className={`sb-qslot${i === revealingSlot ? " filled" : g.phase === "recall" && i === 0 ? " front" : ""}`}
                  style={{ "--tilt": `${i % 2 ? 2 : -2}deg` }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          )}

          <div className="sb-board-wrap">
            <section
              className={`sb-card sb-graph sb-board-card${g.phase === "success" ? " pulse" : ""}${g.phase === "resizing" ? " resizing" : ""}`}
            >
              <Tape
                color={THEME[g.mode].main}
                pattern="stripe"
                width={70}
                angle={-30}
                style={{ top: 4, left: -22 }}
              />
              <Tape
                color={THEME[g.mode].main}
                pattern="stripe"
                width={70}
                angle={-30}
                style={{ bottom: 4, right: -22 }}
              />
              <Board g={g} blank={counting} />
              {g.phase === "success" && (
                <Burst seed={g.streak} key={g.streak} />
              )}
              {counting && (
                <div className="sb-countdown">
                  <span key={count}>{count}</span>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="sb-game-foot">
          <div className="sb-cue" aria-live="polite">
            {counting ? "Get ready" : cueFor(g)}
          </div>
          <div className="sb-progress" aria-hidden="true">
            {live && dotTotal <= 16
              ? Array.from({ length: dotTotal }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i === dotNow
                        ? "now"
                        : i < dotDone
                          ? isSeqMemorize
                            ? "seen"
                            : "done"
                          : ""
                    }
                  />
                ))
              : null}
            {live && dotTotal > 16 && (
              <div className="sb-round-bar" style={{ width: 220 }}>
                <span
                  style={{
                    width: `${(dotDone / Math.max(1, dotTotal)) * 100}%`,
                    background: "var(--ok)",
                  }}
                />
              </div>
            )}
          </div>
          {/* Always laid out, so the board doesn't jump when the bar comes and goes. */}
          <div
            className="sb-drain"
            aria-hidden="true"
            style={{
              visibility:
                g.mode === "pattern" && g.phase === "memorize"
                  ? "visible"
                  : "hidden",
            }}
          >
            {g.mode === "pattern" && g.phase === "memorize" && (
              <span
                key={g.barKey}
                style={{ animationDuration: `${g.displayTime}s` }}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
