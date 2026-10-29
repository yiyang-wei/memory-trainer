import React, { useState } from "react";
import { ChevronDown, Flame, Trophy as TrophyIcon } from "lucide-react";
import { MODES, levelsFor, countOf, formatSpeed, practiceBests, totalHeld } from "../../engine/catalog.js";
import { recentChallengeBests, dayStreak } from "../../engine/history.js";
import { ART, MiniBars, Trophy } from "./ui.jsx";
import { THEME } from "./theme.js";

export default function Records({ g }) {
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState(null);
  const recent = range === "week" ? recentChallengeBests(g.history, 7) : null;
  const streak = dayStreak(g.history);
  const { held, total } = totalHeld(g.stats);
  const weekRuns = g.history.filter((r) => r.t > Date.now() - 7 * 864e5).length;

  return (
    <main className="gl-page with-tabs gl-screen-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <h1 className="gl-h1">Records</h1>
        <div className="gl-seg" role="tablist" aria-label="Range">
          <button type="button" role="tab" aria-selected={range === "all"} className={range === "all" ? "on" : ""} onClick={() => setRange("all")}>
            All
          </button>
          <button type="button" role="tab" aria-selected={range === "week"} className={range === "week" ? "on" : ""} onClick={() => setRange("week")}>
            7 days
          </button>
        </div>
      </div>

      {MODES.map((m) => {
        const t = THEME[m.key];
        const Art = ART[m.key];
        const levels = levelsFor(g.stats, m.key).map((l) => ({ ...l, shown: recent ? recent[l.id] || 0 : l.best }));
        const heldLevels = levels.filter((l) => l.shown > 0);
        const top = heldLevels.find((l) => l.endless) || heldLevels[heldLevels.length - 1];
        const isOpen = open === m.key;
        const custom = practiceBests(g.stats, m.key);
        return (
          <section key={m.key} className="gl-card gl-rec-card">
            <button type="button" className="gl-rec-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : m.key)}>
              <span className="gl-rec-icon" style={{ background: `linear-gradient(150deg, ${t.g1}, ${t.g2})` }}>
                <Art size={36} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="gl-rec-name">{m.name}</span>
                <span className="gl-rec-sub">
                  {heldLevels.length} of {levels.length} levels
                </span>
              </span>
              <MiniBars values={levels.map((l) => l.shown)} color={t.main} count={levels.length} />
              <span className="gl-rec-num" style={{ color: top ? "var(--ink)" : "var(--faint)" }}>
                {top ? top.shown : "—"}
              </span>
              <ChevronDown size={20} color="#8A90A3" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }} />
            </button>
            {isOpen && (
              <div className="gl-rec-levels">
                {levels.map((l) => (
                  <div key={l.id} className="gl-rec-level">
                    <span className="gl-rec-level-tag" style={{ background: t.soft, color: t.ink }}>
                      {l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}
                    </span>
                    <span style={{ flex: 1, color: "var(--muted)", fontWeight: 700, fontSize: 13 }}>
                      {l.shown > 0 && l.bestDisplayTime && !recent ? `at ${formatSpeed(l.bestDisplayTime)}` : l.detail}
                    </span>
                    <span style={{ fontWeight: 900, color: l.shown ? "var(--ink)" : "var(--faint)" }}>
                      {l.shown > 0 ? countOf(l.shown, l.noun) : "—"}
                    </span>
                  </div>
                ))}
                {!recent &&
                  custom.slice(0, 4).map((c) => (
                    <div key={c.key} className="gl-rec-level">
                      <span className="gl-rec-level-tag" style={{ background: "#ECE8FA", color: "#5B49A8" }}>
                        Free
                      </span>
                      <span style={{ flex: 1, color: "var(--muted)", fontWeight: 700, fontSize: 13 }}>{c.label}</span>
                      <span style={{ fontWeight: 900 }}>{countOf(c.best, "rounds")}</span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="gl-card gl-keep">
        <Trophy size={58} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 18, fontWeight: 900 }}>
            {held} / {total} levels
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 750, color: "var(--muted)" }}>
            {streak > 0 ? (
              <>
                <Flame size={14} fill="#E0AA3E" strokeWidth={0} /> {streak}-day streak · {weekRuns} runs this week
              </>
            ) : (
              <>
                <TrophyIcon size={13} strokeWidth={2.6} /> {weekRuns} runs this week
              </>
            )}
          </span>
        </div>
      </section>
    </main>
  );
}
