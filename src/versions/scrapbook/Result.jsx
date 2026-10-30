import React from "react";
import { X, RotateCcw, ChartColumn, Timer, Zap, Target, Trophy, Sparkles, Flag, ThumbsUp } from "lucide-react";
import { countOf, formatDuration, formatSpeed } from "../../engine/catalog.js";
import { Board, Bars, Confetti, Tape, RoundStamp, DoodleArrow, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";
import { levelChip } from "./Game.jsx";

// The stamp pressed onto the sheet: celebratory when earned, encouraging otherwise.
const verdict = (r, endReason) => {
  if (r.isRecord && r.score > 0) return { label: "New best", ink: "#B07B17", Icon: Trophy, record: true };
  if (r.previousBest > 0 && r.previousBest - r.score === 1) return { label: "So close", ink: "#C2506A", Icon: Sparkles };
  if (endReason === "quit") return { label: "Run ended", ink: "#5E74C4", Icon: Flag };
  return { label: r.score > 0 ? "Nice run" : "Keep going", ink: "#3B8A64", Icon: ThumbsUp };
};

// One handwritten line next to the score.
const noteFor = (r, best) => {
  if (r.isRecord && r.score > 0) return r.previousBest > 0 ? `up from ${r.previousBest}!` : "first record!";
  if (best > 0 && r.score === best) return "ties your best";
  if (best > 0) return `best is ${best}`;
  return "next time!";
};

export default function Result({ g, onAgain, onRecords, onClose }) {
  const r = g.runStats;
  const t = THEME[g.mode];

  if (!r) {
    return (
      <main className="sb-page sb-in" style={modeVars(g.mode)}>
        <button type="button" className="sb-primary" style={{ marginTop: "auto" }} onClick={onAgain}>
          Play
        </button>
      </main>
    );
  }

  const v = verdict(r, g.endReason);
  const runs = g.history.filter((h) =>
    g.isChallenge ? h.challengeId === g.challengeId : h.intent === "practice" && h.mode === g.mode
  );
  const best = Math.max(r.previousBest, r.score);
  const noun = countOf(r.score, r.noun).replace(/^\d+ /, "");

  return (
    <main className="sb-result sb-in" style={modeVars(g.mode)}>
      {v.record && <Confetti />}
      <div className="sb-result-top">
        <div className="sb-game-head">
          <button type="button" className="sb-icon-btn" onClick={onClose} aria-label="Close">
            <X size={23} strokeWidth={2.6} />
          </button>
          <span className="sb-pill tinted" style={{ transform: "rotate(-1.5deg)" }}>
            {levelChip(g)}
          </span>
          <span style={{ width: 46 }} />
        </div>
        <div className="sb-result-stage">
          <div className="sb-card sb-graph sb-result-board" aria-label="The answer">
            <Tape color={t.main} pattern="stripe" width={58} angle={-30} style={{ top: 2, left: -18 }} />
            <Tape color={t.main} pattern="stripe" width={58} angle={-30} style={{ bottom: 2, right: -18 }} />
            <Board g={g} interactive={false} />
          </div>
        </div>
      </div>

      <div className="sb-sheet-wrap">
        <section className="sb-sheet sb-torn" aria-label="Run summary">
          <div className="sb-verdict">
            <RoundStamp label={v.label} Icon={v.Icon} color={v.ink} size={100} className={v.record ? "thunk" : "soft"} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <div className="sb-score">
                <span className="sb-score-num">{r.score}</span>
                <span className="sb-score-noun">{noun}</span>
              </div>
              <span className="sb-note" style={{ color: v.record ? "#B07B17" : "var(--muted)" }}>
                <DoodleArrow width={26} style={{ transform: "scaleX(-1) rotate(-20deg)" }} />
                {noteFor(r, best)}
              </span>
            </div>
          </div>

          <div className="sb-stats">
            <div className="sb-stat" style={{ background: "#DCE4F7", "--tilt": "-1.2deg" }}>
              <Timer size={21} color="#44589F" strokeWidth={2.4} />
              <span className="sb-stat-value">{formatDuration(r.durationMs)}</span>
              <span className="sb-stat-label">Time</span>
            </div>
            <div className="sb-stat" style={{ background: "#FBE5EA", "--tilt": "0.8deg" }}>
              <Zap size={21} color="#A8435B" strokeWidth={2.4} />
              <span className="sb-stat-value">{formatSpeed(r.displayTime)}</span>
              <span className="sb-stat-label">Show time</span>
            </div>
            <div className="sb-stat" style={{ background: "#E1F2E9", "--tilt": "-0.6deg" }}>
              <Target size={21} color="#2A6E4F" strokeWidth={2.4} />
              <span className="sb-stat-value">{r.accuracy == null ? "—" : `${Math.round(r.accuracy * 100)}%`}</span>
              <span className="sb-stat-label">Accuracy</span>
            </div>
          </div>

          <div className="sb-trend">
            <Bars values={runs.map((h) => h.score)} color={t.main} count={9} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 17, fontWeight: 800 }}>{runs.length === 1 ? "First run" : `${runs.length} runs`}</span>
              <span style={{ fontSize: 13, fontWeight: 650, color: "var(--muted)" }}>on this level</span>
            </div>
          </div>

          <div className="sb-buttons">
            <button type="button" className="sb-primary" style={{ flex: 2 }} onClick={onAgain}>
              <RotateCcw size={20} strokeWidth={2.6} />
              Play again
            </button>
            <button type="button" className="sb-secondary" style={{ flex: 1, minHeight: 60 }} onClick={onRecords} aria-label="Records">
              <ChartColumn size={22} strokeWidth={2.4} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
