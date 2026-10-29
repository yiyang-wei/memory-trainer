import React from "react";
import { X, Play, ChartColumn, Timer, Zap, Target } from "lucide-react";
import { modeByKey, countOf, formatDuration, formatSpeed, presetLabel } from "../../engine/catalog.js";
import { Confetti, Bars } from "./ui.jsx";
import { THEME, modeVars } from "./theme.js";

// The stamp's word: celebratory when it's earned, encouraging when it isn't.
const verdict = (r, endReason) => {
  if (r.isRecord && r.score > 0) return { stamp: "New record", gold: true };
  if (r.previousBest > 0 && r.previousBest - r.score === 1) return { stamp: "So close" };
  if (endReason === "quit") return { stamp: "Run ended" };
  return { stamp: r.score > 0 ? "Nice run" : "Keep going" };
};

export default function Result({ g, onAgain, onRecords, onClose }) {
  const r = g.runStats;
  const t = THEME[g.mode];
  if (!r) {
    return (
      <main className="ck-page">
        <button type="button" className="ck-key ck-primary" onClick={onAgain}>
          Play
        </button>
      </main>
    );
  }
  const v = verdict(r, g.endReason);
  const name = modeByKey(g.mode).name;
  const levelName = g.isChallenge
    ? `${name} · ${presetLabel(g.challenge) === "∞" ? "∞ " : ""}${g.challenge.title}`
    : `${name} · Free play`;
  const runs = g.history.filter((h) =>
    g.isChallenge ? h.challengeId === g.challengeId : h.intent === "practice" && h.mode === g.mode
  );
  const best = Math.max(r.previousBest, r.score);
  const line = v.gold
    ? r.previousBest > 0
      ? `Up from ${r.previousBest}`
      : "First record!"
    : best > r.score
      ? `${best - r.score} more to beat ${best}`
      : "Matched your best";

  return (
    <main className="ck-page" style={modeVars(g.mode)}>
      {v.gold && <Confetti />}
      <div style={{ display: "flex" }}>
        <button type="button" className="ck-key ck-icon-key" onClick={onClose} aria-label="Close">
          <X size={24} strokeWidth={2.8} />
        </button>
      </div>

      <section className="ck-result">
        <span className={`ck-stamp ${v.gold ? "gold" : "plain"}`}>{v.stamp}</span>
        <span className="ck-score">{r.score}</span>
        <span className="ck-score-noun">{countOf(r.score, r.noun).replace(/^\d+ /, "")}</span>
        <span className="ck-mode-chip" style={{ marginTop: 12 }}>
          {levelName}
        </span>

        <div className="ck-stats">
          <div className="ck-stat ck-in" style={{ "--i": 2 }}>
            <span className="ck-stat-icon" style={{ background: "#6F86D6", boxShadow: "0 3px 0 #4F64B8" }}>
              <Timer size={20} strokeWidth={2.6} />
            </span>
            <span className="ck-stat-value">{formatDuration(r.durationMs)}</span>
            <span className="ck-stat-label">Time</span>
          </div>
          <div className="ck-stat ck-in" style={{ "--i": 3 }}>
            <span className="ck-stat-icon" style={{ background: "#E2667F", boxShadow: "0 3px 0 #BC4A62" }}>
              <Zap size={20} strokeWidth={2.6} />
            </span>
            <span className="ck-stat-value">{formatSpeed(r.displayTime)}</span>
            <span className="ck-stat-label">Show time</span>
          </div>
          <div className="ck-stat ck-in" style={{ "--i": 4 }}>
            <span className="ck-stat-icon" style={{ background: "#5DB38A", boxShadow: "0 3px 0 #3F9068" }}>
              <Target size={20} strokeWidth={2.6} />
            </span>
            <span className="ck-stat-value">{r.accuracy == null ? "—" : `${Math.round(r.accuracy * 100)}%`}</span>
            <span className="ck-stat-label">Accuracy</span>
          </div>
        </div>

        <div className="ck-card ck-trend ck-in" style={{ "--i": 5 }}>
          <Bars values={runs.map((h) => h.score)} color={t.main} edge={t.edge} count={8} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 19, fontWeight: 700 }}>{line}</span>
            <span style={{ fontSize: 14, fontWeight: 550, color: "var(--muted)" }}>
              {runs.length === 1 ? "First run here" : `${runs.length} runs here`}
            </span>
          </div>
        </div>
      </section>

      <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <button type="button" className="ck-key ck-primary" onClick={onAgain}>
          <Play size={22} fill="#fff" strokeWidth={0} />
          Play again
        </button>
        <button type="button" className="ck-key ck-secondary outline" onClick={onRecords}>
          <ChartColumn size={20} strokeWidth={2.6} />
          View records
        </button>
      </div>
    </main>
  );
}
