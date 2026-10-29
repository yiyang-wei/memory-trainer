import React, { useState } from "react";
import { ChevronDown, Flame, Trophy } from "lucide-react";
import { MODES, levelsFor, countOf, formatSpeed, practiceBests, totalHeld } from "../../engine/catalog.js";
import { recentChallengeBests, dayStreak } from "../../engine/history.js";
import { ART } from "./ui.jsx";
import { THEME, modeVars } from "./theme.js";

export default function Records({ g }) {
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState(null);
  const recent = range === "week" ? recentChallengeBests(g.history, 7) : null;
  const streak = dayStreak(g.history);
  const { held, total } = totalHeld(g.stats);
  const weekRuns = g.history.filter((r) => r.t > Date.now() - 7 * 864e5).length;

  const pickRange = (r) => {
    if (r === range) return;
    g.emit("tap");
    setRange(r);
  };

  return (
    <main className="ck-page with-tabs">
      <div className="ck-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
        <h1 className="ck-h1">Records</h1>
        <div className="ck-seg" role="tablist" aria-label="Range">
          <button
            type="button"
            role="tab"
            aria-selected={range === "all"}
            className={`ck-key${range === "all" ? " on" : " outline"}`}
            onClick={() => pickRange("all")}
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={range === "week"}
            className={`ck-key${range === "week" ? " on" : " outline"}`}
            onClick={() => pickRange("week")}
          >
            7 days
          </button>
        </div>
      </div>

      {MODES.map((m, idx) => {
        const t = THEME[m.key];
        const Art = ART[m.key];
        const levels = levelsFor(g.stats, m.key).map((l) => ({ ...l, shown: recent ? recent[l.id] || 0 : l.best }));
        const heldCount = levels.filter((l) => l.shown > 0).length;
        const isOpen = open === m.key;
        const custom = practiceBests(g.stats, m.key);
        return (
          <section key={m.key} className="ck-card ck-rec ck-in" style={{ ...modeVars(m.key), "--i": idx + 1 }}>
            <button
              type="button"
              className="ck-rec-head"
              aria-expanded={isOpen}
              onClick={() => {
                g.emit("tap");
                setOpen(isOpen ? null : m.key);
              }}
            >
              <span className="ck-rec-icon" aria-hidden="true">
                <Art size={34} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span className="ck-rec-name">{m.name}</span>
                <span className="ck-rec-sub">
                  {heldCount} of {levels.length} levels
                </span>
              </span>
              <ChevronDown
                size={24}
                strokeWidth={2.8}
                color="#8A90A3"
                style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              />
            </button>

            <div className="ck-mosaic">
              {levels.map((l) => (
                <div
                  key={l.id}
                  role="img"
                  aria-label={`${l.endless ? "Endless " + l.challenge.title : l.label}: ${l.shown > 0 ? countOf(l.shown, l.noun) : "no record"}`}
                  className={`ck-mtile${l.shown > 0 ? "" : " empty"}`}
                >
                  <small>{l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}</small>
                  <b>{l.shown > 0 ? l.shown : "—"}</b>
                </div>
              ))}
            </div>

            {isOpen && (
              <div className="ck-rec-list">
                {levels.map((l) => (
                  <div key={l.id} className="ck-rec-line">
                    <span className="ck-tag" style={{ background: t.tint, color: t.ink }}>
                      {l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}
                    </span>
                    <span style={{ flex: 1, color: "var(--muted)", fontWeight: 550, fontSize: 14 }}>
                      {l.shown > 0 && l.bestDisplayTime && !recent ? `at ${formatSpeed(l.bestDisplayTime)}` : l.detail}
                    </span>
                    <span style={{ fontWeight: 700, color: l.shown ? "var(--ink)" : "var(--faint)" }}>
                      {l.shown > 0 ? countOf(l.shown, l.noun) : "—"}
                    </span>
                  </div>
                ))}
                {!recent &&
                  custom.slice(0, 4).map((c) => (
                    <div key={c.key} className="ck-rec-line">
                      <span className="ck-tag" style={{ background: THEME.free.tint, color: THEME.free.ink }}>
                        Free
                      </span>
                      <span style={{ flex: 1, color: "var(--muted)", fontWeight: 550, fontSize: 14 }}>{c.label}</span>
                      <span style={{ fontWeight: 700 }}>{countOf(c.best, "rounds")}</span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="ck-card ck-total ck-in" style={{ "--i": 5 }}>
        <span
          className="ck-cap"
          style={{ width: 60, height: 60, borderRadius: 18, "--c": "#E3A52F", "--ce": "#B9821A", "--cd": "5px", flexShrink: 0 }}
          aria-hidden="true"
        >
          <Trophy size={30} strokeWidth={2.6} />
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>
            {held} / {total} levels
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14.5, fontWeight: 550, color: "var(--muted)" }}>
            {streak > 0 && (
              <>
                <Flame size={15} fill="#E3A52F" strokeWidth={0} /> {streak}-day streak ·
              </>
            )}{" "}
            {weekRuns} runs this week
          </span>
        </div>
      </section>
    </main>
  );
}
