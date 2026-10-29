import React from "react";
import { X, RotateCcw, ChartColumn, Timer, Zap, Target, Trophy, Sparkles, Flag, ThumbsUp } from "lucide-react";
import { countOf, formatDuration, formatSpeed } from "../../engine/catalog.js";
import { Board, Bars, Confetti, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";
import { levelChip } from "./Game.jsx";

// The sticker that slaps onto the sheet: celebratory when earned, encouraging otherwise.
const verdict = (r, endReason) => {
  if (r.isRecord && r.score > 0) return { label: "New record", bg: "#E0AA3E", Icon: Trophy, record: true };
  if (r.previousBest > 0 && r.previousBest - r.score === 1) return { label: "So close", bg: "#E0778C", Icon: Sparkles };
  if (endReason === "quit") return { label: "Run ended", bg: "#8CA0DB", Icon: Flag };
  return { label: r.score > 0 ? "Nice run" : "Keep going", bg: "#7FBF9E", Icon: ThumbsUp };
};

export default function Result({ g, onAgain, onRecords, onClose }) {
  const r = g.runStats;
  const t = THEME[g.mode];

  if (!r) {
    return (
      <main className="st-page st-in" style={modeVars(g.mode)}>
        <button type="button" className="st-primary" style={{ marginTop: "auto" }} onClick={onAgain}>
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
  const trendLine = v.record
    ? r.previousBest > 0
      ? `Up from ${r.previousBest}`
      : "First record here"
    : best > r.score
      ? `${best - r.score} more to beat ${best}`
      : "Matched your best";
  const noun = countOf(r.score, r.noun).replace(/^\d+ /, "");

  return (
    <main className="st-result st-in" style={modeVars(g.mode)}>
      {v.record && <Confetti />}
      <div className="st-result-top">
        <div className="st-game-head">
          <button type="button" className="st-icon-btn" onClick={onClose} aria-label="Close">
            <X size={23} strokeWidth={2.6} />
          </button>
          <span className="st-pill tinted" style={{ transform: "rotate(-1.5deg)" }}>
            {levelChip(g)}
          </span>
          <span style={{ width: 46 }} />
        </div>
        <div className="st-sticker st-result-board" aria-label="The answer">
          <Board g={g} interactive={false} />
        </div>
      </div>

      <section className="st-sheet" aria-label="Run summary">
        <span className="st-handle" aria-hidden="true" />

        <div className="st-verdict">
          <div className="st-badge" style={{ background: v.bg, color: "#fff" }}>
            <v.Icon size={30} strokeWidth={2.4} />
            <span>{v.label}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <div className="st-score">
              <span className="st-score-num">{r.score}</span>
              <span className="st-score-noun">{noun}</span>
            </div>
            {r.previousBest > 0 && (
              <span className="st-was" style={{ alignSelf: "flex-start" }}>
                {r.isRecord ? "was" : "best"} {r.previousBest}
              </span>
            )}
          </div>
        </div>

        <div className="st-stats">
          <div className="st-stat" style={{ background: "#DCE4F7", "--tilt": "-1.5deg" }}>
            <Timer size={21} color="#44589F" strokeWidth={2.4} />
            <span className="st-stat-value">{formatDuration(r.durationMs)}</span>
            <span className="st-stat-label">Time</span>
          </div>
          <div className="st-stat" style={{ background: "#FBE5EA", "--tilt": "1deg" }}>
            <Zap size={21} color="#A8435B" strokeWidth={2.4} />
            <span className="st-stat-value">{formatSpeed(r.displayTime)}</span>
            <span className="st-stat-label">Show time</span>
          </div>
          <div className="st-stat" style={{ background: "#E1F2E9", "--tilt": "-0.8deg" }}>
            <Target size={21} color="#2A6E4F" strokeWidth={2.4} />
            <span className="st-stat-value">{r.accuracy == null ? "—" : `${Math.round(r.accuracy * 100)}%`}</span>
            <span className="st-stat-label">Accuracy</span>
          </div>
        </div>

        <div className="st-trend">
          <Bars values={runs.map((h) => h.score)} color={t.main} count={9} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{trendLine}</span>
            <span style={{ fontSize: 13, fontWeight: 650, color: "var(--muted)" }}>
              {runs.length === 1 ? "First run here" : `${runs.length} runs here`}
            </span>
          </div>
        </div>

        <div className="st-buttons">
          <button type="button" className="st-primary" style={{ flex: 2 }} onClick={onAgain}>
            <RotateCcw size={20} strokeWidth={2.6} />
            Play again
          </button>
          <button type="button" className="st-secondary" style={{ flex: 1, minHeight: 62 }} onClick={onRecords} aria-label="Records">
            <ChartColumn size={22} strokeWidth={2.4} />
          </button>
        </div>
      </section>
    </main>
  );
}
