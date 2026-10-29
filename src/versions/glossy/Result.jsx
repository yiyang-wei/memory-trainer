import React from "react";
import { X, Play, ChartColumn, Timer, Zap, Target } from "lucide-react";
import { modeByKey, countOf, formatDuration, formatSpeed, presetLabel } from "../../engine/catalog.js";
import { Trophy, Confetti, MiniBars, ART } from "./ui.jsx";
import { THEME, modeVars } from "./theme.js";

// The verdict line: celebratory when it's earned, encouraging when it isn't.
const verdict = (r, endReason) => {
  if (r.isRecord && r.score > 0) return { title: "New Record!", gold: true };
  if (r.previousBest > 0 && r.previousBest - r.score === 1) return { title: "So close!" };
  if (endReason === "quit") return { title: "Run ended" };
  return { title: r.score > 0 ? "Nice run!" : "Keep at it" };
};

export default function Result({ g, onAgain, onRecords, onClose }) {
  const r = g.runStats;
  const t = THEME[g.mode];
  if (!r) {
    return (
      <main className="gl-page gl-screen-in">
        <button type="button" className="gl-primary" onClick={onAgain}>
          Play
        </button>
      </main>
    );
  }
  const v = verdict(r, g.endReason);
  const levelName = g.isChallenge
    ? `${modeByKey(g.mode).name} · ${presetLabel(g.challenge) === "∞" ? "∞ " + g.challenge.title : g.challenge.title}`
    : `${modeByKey(g.mode).name} · Free play`;
  const runs = g.history.filter((h) =>
    g.isChallenge ? h.challengeId === g.challengeId : h.intent === "practice" && h.mode === g.mode
  );
  const scores = runs.map((h) => h.score);
  const best = Math.max(r.previousBest, r.score);
  const trendLine = v.gold
    ? r.previousBest > 0
      ? `Up from ${r.previousBest}`
      : "Your first record"
    : best === 0
      ? "Clear a round to score"
      : best > r.score
        ? `${best - r.score} more to beat ${best}`
        : "Matched your best";
  const HeroArt = ART[g.mode];

  return (
    <main className="gl-page gl-screen-in" style={modeVars(g.mode)}>
      {v.gold && <Confetti />}
      <div style={{ display: "flex" }}>
        <button type="button" className="gl-icon-btn" onClick={onClose} aria-label="Close">
          <X size={22} strokeWidth={2.6} />
        </button>
      </div>

      <section className="gl-result">
        {r.score > 0 ? (
          <Trophy size={v.gold ? 150 : 118} silver={!v.gold} />
        ) : (
          <div className="gl-trophy" style={{ padding: "18px 0 8px" }}>
            <HeroArt size={110} />
          </div>
        )}
        <span className={`gl-result-title${v.gold ? " gold" : ""}`}>{v.title}</span>
        <span className="gl-result-score">{r.score}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: "var(--muted)" }}>
          {countOf(r.score, r.noun).replace(/^\d+ /, "")}
        </span>
        <span className="gl-pill" style={{ marginTop: 10, background: t.soft, color: t.ink, boxShadow: "none" }}>
          {levelName}
        </span>

        <div className="gl-card gl-stats">
          <div className="gl-stat">
            <Timer size={22} color="#6F86D6" strokeWidth={2.4} />
            <span className="gl-stat-value">{formatDuration(r.durationMs)}</span>
            <span className="gl-stat-label">Time</span>
          </div>
          <div className="gl-stat">
            <Zap size={22} color="#E0778C" strokeWidth={2.4} />
            <span className="gl-stat-value">{formatSpeed(r.displayTime)}</span>
            <span className="gl-stat-label">Show time</span>
          </div>
          <div className="gl-stat">
            <Target size={22} color="#5FA383" strokeWidth={2.4} />
            <span className="gl-stat-value">{r.accuracy == null ? "—" : `${Math.round(r.accuracy * 100)}%`}</span>
            <span className="gl-stat-label">Accuracy</span>
          </div>
        </div>

        <div className="gl-card gl-trend">
          <MiniBars values={scores} color={t.main} count={9} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 17, fontWeight: 900 }}>{trendLine}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
              {runs.length === 1 ? "First run here" : `${runs.length} runs here`}
            </span>
          </div>
        </div>
      </section>

      <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <button type="button" className="gl-primary" onClick={onAgain}>
          <Play size={20} fill="#fff" strokeWidth={0} />
          Play Again
        </button>
        <button type="button" className="gl-secondary" onClick={onRecords}>
          <ChartColumn size={19} strokeWidth={2.4} />
          View Records
        </button>
      </div>
    </main>
  );
}
