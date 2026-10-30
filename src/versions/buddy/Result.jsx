import React from "react";
import { X, RotateCcw, ChartColumn, Timer, Zap, Target } from "lucide-react";
import { countOf, formatDuration, formatSpeed } from "../../engine/catalog.js";
import { Board, Bars, Confetti, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";
import { levelChip, accentFor } from "./Game.jsx";
import { LiveBuddy, Bubble } from "./Buddy.jsx";
import { BOING, RECORD, after, lower, jumpFx } from "./jumps.js";

// What the buddy makes of the run.
const verdict = (r, endReason) => {
  if (r.isRecord && r.score > 0) return { say: "New record!", mood: "cheer", record: true };
  if (r.previousBest > 0 && r.previousBest - r.score === 1) return { say: "So close!", mood: "gentle" };
  if (endReason === "quit") return { say: "Good stop", mood: "idle" };
  if (r.score === 0) return { say: "Next time!", mood: "gentle" };
  return { say: "Nice run!", mood: "happy" };
};

// One line on how this run sits against the best, never "2 more to beat 2".
const trendFor = (r, record) => {
  if (record) return r.previousBest > 0 ? `Up from ${r.previousBest}` : "Your first record";
  const best = Math.max(r.previousBest, r.score);
  if (best === 0) return "Clear a round to score";
  if (r.score === best) return "Matched your best";
  if (r.score === 0) return `Your best is ${best}`;
  return `${best - r.score} short of ${best}`;
};

export default function Result({ g, onAgain, onRecords, onClose }) {
  const r = g.runStats;
  const t = THEME[g.mode];

  if (!r) {
    return (
      <main className="bd-page bd-in" style={modeVars(g.mode)}>
        <button type="button" className="bd-primary" style={{ marginTop: "auto" }} onClick={onAgain}>
          Play
        </button>
      </main>
    );
  }

  const v = verdict(r, g.endReason);
  // A record gets the big leap and a nice run a hop, once the sheet has slid up. Its
  // bubble is just above, so the leap is lower here and the bubble stays in front.
  const leap = v.record ? lower(RECORD, 0.6) : v.mood === "happy" ? lower(BOING, 0.7) : null;
  const jump = leap ? { n: 1, motion: after(leap, 0.45) } : null;
  const runs = g.history.filter((h) =>
    g.isChallenge ? h.challengeId === g.challengeId : h.intent === "practice" && h.mode === g.mode
  );
  const noun = countOf(r.score, r.noun).replace(/^\d+ /, "");

  return (
    <main className="bd-result bd-in" style={modeVars(g.mode)}>
      {v.record && <Confetti />}
      <div className="bd-result-top">
        <div className="bd-game-head">
          <button type="button" className="bd-icon-btn" onClick={onClose} aria-label="Close">
            <X size={23} strokeWidth={2.6} />
          </button>
          <span className="bd-pill tinted" style={{ transform: "rotate(-1.5deg)" }}>
            {levelChip(g)}
          </span>
          <span style={{ width: 46 }} />
        </div>
        <div className="bd-result-stage">
          <div className="bd-sticker bd-result-board" aria-label="The answer">
            <Board g={g} interactive={false} />
          </div>
        </div>
      </div>

      <section className="bd-sheet" aria-label="Run summary">
        <span className="bd-handle" aria-hidden="true" />

        <div className="bd-verdict">
          <div className="bd-verdict-score">
            <div className="bd-score">
              <span className="bd-score-num">{r.score}</span>
              <span className="bd-score-noun">{noun}</span>
            </div>
            {r.previousBest > 0 && (
              <span className="bd-was">
                {r.isRecord ? "was" : "best"} {r.previousBest}
              </span>
            )}
          </div>
          <div className="bd-verdict-buddy">
            <Bubble tail="down" className={`bd-verdict-say${v.record ? " gold" : ""}`}>
              {v.say}
            </Bubble>
            <LiveBuddy mood={v.mood} accent={accentFor(g.mode)} label={v.say} jump={jump} fx={jumpFx(g.prefs)} />
          </div>
        </div>

        <div className="bd-stats">
          <div className="bd-stat" style={{ background: "#DCE4F7", "--tilt": "-1.5deg" }}>
            <Timer size={21} color="#44589F" strokeWidth={2.4} />
            <span className="bd-stat-value">{formatDuration(r.durationMs)}</span>
            <span className="bd-stat-label">Time</span>
          </div>
          <div className="bd-stat" style={{ background: "#FBE5EA", "--tilt": "1deg" }}>
            <Zap size={21} color="#A8435B" strokeWidth={2.4} />
            <span className="bd-stat-value">{formatSpeed(r.displayTime)}</span>
            <span className="bd-stat-label">Show time</span>
          </div>
          <div className="bd-stat" style={{ background: "#E1F2E9", "--tilt": "-0.8deg" }}>
            <Target size={21} color="#2A6E4F" strokeWidth={2.4} />
            <span className="bd-stat-value">{r.accuracy == null ? "—" : `${Math.round(r.accuracy * 100)}%`}</span>
            <span className="bd-stat-label">Accuracy</span>
          </div>
        </div>

        <div className="bd-trend">
          <Bars values={runs.map((h) => h.score)} color={t.main} count={9} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{trendFor(r, v.record)}</span>
            <span style={{ fontSize: 13, fontWeight: 650, color: "var(--muted)" }}>
              {runs.length === 1 ? "First run here" : `${runs.length} runs here`}
            </span>
          </div>
        </div>

        <div className="bd-buttons">
          <button type="button" className="bd-primary" style={{ flex: 2 }} onClick={onAgain}>
            <RotateCcw size={20} strokeWidth={2.6} />
            Play again
          </button>
          <button type="button" className="bd-secondary" style={{ flex: 1, minHeight: 62 }} onClick={onRecords} aria-label="Records">
            <ChartColumn size={22} strokeWidth={2.4} />
          </button>
        </div>
      </section>
    </main>
  );
}
