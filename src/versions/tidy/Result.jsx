import React from "react";
import { X, RotateCcw, ChartColumn, Timer, Zap, Target, Sparkles, Flag, ThumbsUp } from "lucide-react";
import { countOf, formatDuration, formatSpeed, presetLabel } from "../../engine/catalog.js";
import { AlbumSlot, Bars, Board, Confetti, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";
import { levelChip } from "./Game.jsx";

// Anything short of a record gets a small encouraging sticker; a record gets the album
// sticker itself.
const verdict = (r, endReason) => {
  if (r.previousBest > 0 && r.previousBest - r.score === 1) return { label: "So close", bg: "#E0778C", Icon: Sparkles };
  if (endReason === "quit") return { label: "Run ended", bg: "#8CA0DB", Icon: Flag };
  return { label: r.score > 0 ? "Nice run" : "Keep going", bg: "#7FBF9E", Icon: ThumbsUp };
};

// One short line under the score.
const compare = (r) => {
  if (r.isRecord && r.score > 0) return r.previousBest > 0 ? `New record · up from ${r.previousBest}` : "New record";
  if (r.previousBest > 0 && r.score === r.previousBest) return "Matched your best";
  if (r.previousBest > 0 && r.score > 0) return `${r.previousBest - r.score} short of your best`;
  if (r.previousBest > 0) return `Your best is ${r.previousBest}`;
  return "No record yet";
};

export default function Result({ g, onAgain, onRecords, onClose }) {
  const r = g.runStats;
  const t = THEME[g.mode];

  if (!r) {
    return (
      <main className="td-page td-in" style={modeVars(g.mode)}>
        <button type="button" className="td-primary" style={{ marginTop: "auto" }} onClick={onAgain}>
          Play
        </button>
      </main>
    );
  }

  const record = r.isRecord && r.score > 0;
  const v = verdict(r, g.endReason);
  const runs = g.history.filter((h) =>
    g.isChallenge ? h.challengeId === g.challengeId : h.intent === "practice" && h.mode === g.mode
  );
  const noun = countOf(r.score, r.noun).replace(/^\d+ /, "");
  const slotLabel = g.isChallenge ? presetLabel(g.challenge) : `${g.boardSize}×${g.boardSize}`;

  return (
    <main className="td-result td-in" style={modeVars(g.mode)}>
      {record && <Confetti />}
      <div className="td-result-top">
        <div className="td-game-head">
          <button type="button" className="td-icon-btn" onClick={onClose} aria-label="Close">
            <X size={22} strokeWidth={2.6} />
          </button>
          <span className="td-pill tinted">{levelChip(g)}</span>
          <span style={{ width: 44 }} />
        </div>
        <div className="td-result-stage">
          <div className="td-sticker td-result-board" aria-label="The answer">
            <Board g={g} interactive={false} />
          </div>
        </div>
      </div>

      <section className="td-sheet" aria-label="Run summary">
        <span className="td-handle" aria-hidden="true" />

        <div className="td-verdict">
          {record ? (
            <div className="td-verdict-slot">
              <AlbumSlot label={slotLabel} value={r.score} noun={r.noun} tilt={-6} delay={260} fresh big />
              <span className="td-new-tag">New</span>
            </div>
          ) : (
            <div className="td-badge" style={{ background: v.bg }}>
              <v.Icon size={26} strokeWidth={2.4} />
              <span>{v.label}</span>
            </div>
          )}
          <div className="td-verdict-text">
            <div className="td-score">
              <span className="td-score-num">{r.score}</span>
              <span className="td-score-noun">{noun}</span>
            </div>
            <span className={`td-compare${record ? " gold" : ""}`}>{compare(r)}</span>
          </div>
        </div>

        <div className="td-stats">
          <div className="td-stat">
            <Timer size={19} color={t.ink} strokeWidth={2.4} />
            <span className="td-stat-value">{formatDuration(r.durationMs)}</span>
            <span className="td-stat-label">Time</span>
          </div>
          <div className="td-stat">
            <Zap size={19} color={t.ink} strokeWidth={2.4} />
            <span className="td-stat-value">{formatSpeed(r.displayTime)}</span>
            <span className="td-stat-label">Show time</span>
          </div>
          <div className="td-stat">
            <Target size={19} color={t.ink} strokeWidth={2.4} />
            <span className="td-stat-value">{r.accuracy == null ? "—" : `${Math.round(r.accuracy * 100)}%`}</span>
            <span className="td-stat-label">Accuracy</span>
          </div>
        </div>

        <div className="td-trend">
          <Bars values={runs.map((h) => h.score)} color={t.main} count={10} />
          <span className="td-trend-label">{runs.length === 1 ? "First run" : `Last ${Math.min(10, runs.length)} runs`}</span>
        </div>

        <div className="td-buttons">
          <button type="button" className="td-primary" style={{ flex: 1 }} onClick={onAgain}>
            <RotateCcw size={20} strokeWidth={2.6} />
            Play again
          </button>
          <button type="button" className="td-secondary td-square" onClick={onRecords} aria-label="Records">
            <ChartColumn size={22} strokeWidth={2.4} />
          </button>
        </div>
      </section>
    </main>
  );
}
