import React, { useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { MODES, levelsFor, countOf, formatSpeed, practiceBests, totalHeld } from "../../engine/catalog.js";
import { recentChallengeBests, dayStreak } from "../../engine/history.js";
import { ART, Squiggle, modeVars } from "./ui.jsx";
import Buddy from "./Buddy.jsx";
import { THEME } from "./theme.js";

const TILTS = ["-0.7deg", "0.6deg", "-0.5deg", "0.7deg"];

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
    <main className="bd-page with-tabs bd-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div className="bd-title-wrap">
          <h1 className="bd-h1">Records</h1>
          <Squiggle width={104} color={THEME.progressive.main} />
        </div>
        <div className="bd-seg" role="tablist" aria-label="Range">
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
        const levels = levelsFor(g.stats, m.key).map((l) => ({ ...l, shown: recent ? recent[l.id] || 0 : l.best }));
        const heldCount = levels.filter((l) => l.shown > 0).length;
        const isOpen = open === m.key;
        const custom = recent ? [] : practiceBests(g.stats, m.key).slice(0, 4);
        return (
          <section
            key={m.key}
            className="bd-sticker bd-rec-card bd-slap"
            style={{ ...modeVars(m.key), "--tilt": TILTS[idx], "--delay": `${idx * 60}ms` }}
          >
            <button
              type="button"
              className="bd-rec-head"
              aria-expanded={isOpen}
              onClick={() => {
                g.emit("tap");
                setOpen(isOpen ? null : m.key);
              }}
            >
              <span className="bd-rec-art">
                <Art size={40} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="bd-rec-name">{m.name}</span>
                <span className="bd-rec-sub">
                  {heldCount} of {levels.length} levels
                </span>
              </span>
              <ChevronDown
                size={22}
                color="#8A90A3"
                strokeWidth={2.6}
                style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)" }}
              />
            </button>

            <div className="bd-rec-tiles">
              {levels.map((l, i) => (
                <div
                  key={l.id}
                  role="img"
                  aria-label={`${l.label}: ${l.shown ? countOf(l.shown, l.noun) : "no record"}`}
                  className={`bd-rec-tile ${l.shown > 0 ? "has" : "none"}`}
                  style={{ "--tilt": l.shown > 0 ? `${i % 2 ? 1.5 : -1.5}deg` : "0deg" }}
                >
                  <span className="bd-rec-tile-size">{l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}</span>
                  <span className="bd-rec-tile-num">{l.shown > 0 ? l.shown : "—"}</span>
                </div>
              ))}
            </div>

            {isOpen && (
              <div className="bd-rec-list">
                {levels.map((l) => (
                  <div key={l.id} className="bd-rec-item">
                    <span className="bd-rec-tag" style={{ background: t.tint, color: t.ink }}>
                      {l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 650, color: "var(--muted)" }}>
                      {l.shown > 0 && l.bestDisplayTime && !recent ? `at ${formatSpeed(l.bestDisplayTime)}` : l.detail}
                    </span>
                    <span style={{ fontWeight: 800, color: l.shown ? "var(--ink)" : "var(--faint)" }}>
                      {l.shown > 0 ? countOf(l.shown, l.noun) : "—"}
                    </span>
                  </div>
                ))}
                {custom.map((c) => (
                  <div key={c.key} className="bd-rec-item">
                    <span className="bd-rec-tag" style={{ background: "#ECE8FA", color: "#5B49A8" }}>
                      Free
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 650, color: "var(--muted)" }}>{c.label}</span>
                    <span style={{ fontWeight: 800 }}>{countOf(c.best, "rounds")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="bd-sticker bd-total bd-slap" style={{ "--delay": "280ms" }}>
        <span className="bd-total-buddy">
          <Buddy mood={held === 0 ? "think" : weekRuns > 0 ? "happy" : "idle"} />
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 19, fontWeight: 800 }}>{held === 0 ? "No records yet" : `${held} / ${total} levels`}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 650, color: "var(--muted)" }}>
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
