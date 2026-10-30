import React, { useState } from "react";
import { ChevronDown, Flame, Trophy } from "lucide-react";
import { MODES, levelsFor, countOf, formatSpeed, practiceBests, totalHeld } from "../../engine/catalog.js";
import { recentChallengeBests, dayStreak } from "../../engine/history.js";
import { ART, Tape, Marker, RoundStamp, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";

const CARDS = [
  { tilt: "-0.7deg", tape: { pattern: "stripe", angle: -4, style: { top: -10, left: "38%" } } },
  { tilt: "0.6deg", tape: { pattern: "dots", angle: 5, style: { top: -10, left: "44%" } } },
  { tilt: "-0.5deg", tape: { pattern: "plain", angle: -6, style: { top: -10, left: "40%" } } },
  { tilt: "0.7deg", tape: { pattern: "stripe", angle: 3, style: { top: -10, left: "46%" } } },
];

const shortDate = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// When a ranked record was first set: the earliest run on that level that reached it.
const recordDate = (history, level) => {
  const run = history.find((h) => h.intent === "challenge" && h.challengeId === level.id && h.score === level.best);
  return run ? shortDate(run.t) : null;
};

export default function Records({ g }) {
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState(null);
  const recent = range === "week" ? recentChallengeBests(g.history, 7) : null;
  const streak = dayStreak(g.history);
  const { held, total } = totalHeld(g.stats);
  const weekRuns = g.history.filter((r) => r.t > Date.now() - 7 * 864e5).length;

  const pick = (r) => {
    g.emit("tap");
    setRange(r);
  };

  return (
    <main className="sb-page with-tabs sb-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <h1 className="sb-h1">
          <Marker color={THEME.progressive.main}>Records</Marker>
        </h1>
        <div className="sb-seg" role="tablist" aria-label="Range">
          <button type="button" role="tab" aria-selected={range === "all"} className={range === "all" ? "on" : ""} onClick={() => pick("all")}>
            All
          </button>
          <button type="button" role="tab" aria-selected={range === "week"} className={range === "week" ? "on" : ""} onClick={() => pick("week")}>
            7 days
          </button>
        </div>
      </div>

      {MODES.map((m, idx) => {
        const t = THEME[m.key];
        const Art = ART[m.key];
        const look = CARDS[idx];
        const levels = levelsFor(g.stats, m.key).map((l) => ({ ...l, shown: recent ? recent[l.id] || 0 : l.best }));
        const heldCount = levels.filter((l) => l.shown > 0).length;
        const isOpen = open === m.key;
        const custom = recent ? [] : practiceBests(g.stats, m.key).slice(0, 4);
        return (
          <section
            key={`${m.key}-${range}`}
            className="sb-card sb-rec-card sb-place"
            style={{ ...modeVars(m.key), "--tilt": look.tilt, "--delay": `${idx * 60}ms` }}
          >
            <Tape color={t.main} width={56} {...look.tape} />
            <button
              type="button"
              className="sb-rec-head"
              aria-expanded={isOpen}
              onClick={() => {
                g.emit("tap");
                setOpen(isOpen ? null : m.key);
              }}
            >
              <span className="sb-rec-art">
                <Art size={40} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="sb-rec-name">{m.name}</span>
                <span className="sb-rec-sub">
                  {heldCount} of {levels.length} stamped
                </span>
              </span>
              <ChevronDown
                size={22}
                color="#8A90A3"
                strokeWidth={2.6}
                style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 240ms cubic-bezier(0.3,1.4,0.5,1)" }}
              />
            </button>

            <div className="sb-rec-tiles">
              {levels.map((l, i) => (
                <div
                  key={l.id}
                  role="img"
                  aria-label={`${l.label}: ${l.shown ? countOf(l.shown, l.noun) : "no record"}`}
                  className={`sb-rec-tile ${l.shown > 0 ? "has" : "none"}`}
                  style={{ "--tilt": l.shown > 0 ? `${i % 2 ? 2 : -2.5}deg` : "0deg", "--delay": `${idx * 60 + 180 + i * 70}ms` }}
                >
                  <span className="sb-rec-tile-size">{l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}</span>
                  <span className="sb-rec-tile-num">{l.shown > 0 ? l.shown : "—"}</span>
                </div>
              ))}
            </div>

            {isOpen && (
              <div className="sb-rec-list">
                {levels.map((l) => {
                  const when = l.shown > 0 && !recent ? recordDate(g.history, l) : null;
                  return (
                    <div key={l.id} className="sb-rec-item">
                      <span className="sb-rec-tag" style={{ background: t.tint, color: t.ink }}>
                        {l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 650, color: "var(--muted)" }}>
                        {l.shown > 0 && l.bestDisplayTime && !recent ? `at ${formatSpeed(l.bestDisplayTime)}` : l.detail}
                        {when && <span className="sb-rec-date"> · {when}</span>}
                      </span>
                      <span style={{ fontWeight: 800, color: l.shown ? "var(--ink)" : "var(--faint)" }}>
                        {l.shown > 0 ? countOf(l.shown, l.noun) : "—"}
                      </span>
                    </div>
                  );
                })}
                {custom.map((c) => (
                  <div key={c.key} className="sb-rec-item">
                    <span className="sb-rec-tag" style={{ background: "#ECE8FA", color: "#5B49A8" }}>
                      Free
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 650, color: "var(--muted)" }}>{c.label}</span>
                    <span style={{ fontWeight: 800 }}>{countOf(c.best, "rounds")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="sb-card sb-total sb-place" style={{ "--delay": "280ms" }}>
        <Tape color={THEME.progressive.main} pattern="dots" width={52} angle={-35} style={{ top: 2, left: -16 }} />
        <RoundStamp label="Collected" Icon={Trophy} color="#B07B17" size={70} tilt={-8} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 19, fontWeight: 800 }}>
            {held} / {total} levels
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexWrap: "wrap", fontSize: 13.5, fontWeight: 650, color: "var(--muted)" }}>
            {streak > 0 && (
              <>
                <Flame size={15} fill="#E0AA3E" color="#E0AA3E" strokeWidth={1.5} />
                {streak}-day streak ·
              </>
            )}{" "}
            {weekRuns} {weekRuns === 1 ? "run" : "runs"} this week
          </span>
        </div>
      </section>
    </main>
  );
}
