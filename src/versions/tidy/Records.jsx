import React, { useState } from "react";
import { ChevronDown, Flame, Trophy } from "lucide-react";
import { MODES, levelsFor, countOf, formatSpeed, practiceBests, totalHeld } from "../../engine/catalog.js";
import { recentChallengeBests, dayStreak } from "../../engine/history.js";
import { ART, AlbumSlot, SLOT_TILTS, Squiggle, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";

const levelName = (l) => (l.endless && l.label === "∞" ? `Endless ${l.challenge.title}` : l.label);

// Records as a sticker album: one page section per exercise, one slot per level. A slot
// stays a dashed outline until a record is held there.
export default function Records({ g }) {
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState(null);
  const recent = range === "week" ? recentChallengeBests(g.history, 7) : null;
  const streak = dayStreak(g.history);
  const { held, total } = totalHeld(g.stats);
  const weekHeld = recent ? Object.values(recent).filter((v) => v > 0).length : 0;
  const weekRuns = g.history.filter((r) => r.t > Date.now() - 7 * 864e5).length;

  const pick = (r) => {
    if (r === range) return;
    g.emit("tap");
    setRange(r);
  };

  return (
    <main className="td-page with-tabs td-in">
      <header className="td-rec-top">
        <div className="td-title-wrap">
          <h1 className="td-h1">Records</h1>
          <Squiggle width={96} color={THEME.progressive.main} />
        </div>
        <div className="td-seg" role="tablist" aria-label="Range">
          <button type="button" role="tab" aria-selected={range === "all"} className={range === "all" ? "on" : ""} onClick={() => pick("all")}>
            All
          </button>
          <button type="button" role="tab" aria-selected={range === "week"} className={range === "week" ? "on" : ""} onClick={() => pick("week")}>
            7 days
          </button>
        </div>
      </header>

      <section className="td-sticker td-total td-rise">
        <span className="td-total-badge" aria-hidden="true">
          <Trophy size={26} color="#fff" strokeWidth={2.4} />
        </span>
        <div className="td-total-text">
          <span className="td-total-num">
            {recent ? weekHeld : held}
            <span> / {total} stickers</span>
          </span>
          <span className="td-total-sub">
            {streak > 0 && (
              <>
                <Flame size={14} fill="#E0AA3E" color="#E0AA3E" strokeWidth={1.5} />
                {streak}-day streak ·{" "}
              </>
            )}
            {weekRuns} {weekRuns === 1 ? "run" : "runs"} this week
          </span>
        </div>
      </section>

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
            className="td-sticker td-album td-rise"
            style={{ ...modeVars(m.key), "--delay": `${60 + idx * 50}ms` }}
          >
            <button
              type="button"
              className="td-album-head"
              aria-expanded={isOpen}
              onClick={() => {
                g.emit("tap");
                setOpen(isOpen ? null : m.key);
              }}
            >
              <span className="td-album-art">
                <Art size={36} />
              </span>
              <span className="td-album-name">{m.name}</span>
              <span className="td-album-count">
                {heldCount}/{levels.length}
              </span>
              <ChevronDown
                size={20}
                color="#8A90A3"
                strokeWidth={2.6}
                style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 240ms var(--spring)" }}
              />
            </button>

            {/* Keyed on the range so switching views re-sticks the stickers. */}
            <div className="td-slots" key={range}>
              {levels.map((l, i) => (
                <AlbumSlot
                  key={l.id}
                  label={l.label}
                  name={levelName(l)}
                  value={l.shown}
                  noun={l.noun}
                  tilt={SLOT_TILTS[(i + idx) % SLOT_TILTS.length]}
                  delay={120 + idx * 50 + i * 55}
                />
              ))}
            </div>

            {isOpen && (
              <div className="td-rec-list">
                {levels.map((l) => (
                  <div key={l.id} className="td-rec-item">
                    <span className="td-rec-tag" style={{ background: t.tint, color: t.ink }}>
                      {l.endless && l.label === "∞" ? `∞ ${l.challenge.title}` : l.label}
                    </span>
                    <span className="td-rec-detail">
                      {l.shown > 0 && l.bestDisplayTime && !recent ? `at ${formatSpeed(l.bestDisplayTime)}` : l.detail}
                    </span>
                    <span style={{ fontWeight: 800, color: l.shown ? "var(--ink)" : "var(--faint)" }}>
                      {l.shown > 0 ? countOf(l.shown, l.noun) : "—"}
                    </span>
                  </div>
                ))}
                {custom.map((c) => (
                  <div key={c.key} className="td-rec-item">
                    <span className="td-rec-tag" style={{ background: "#ECE8FA", color: "#5B49A8" }}>
                      Free
                    </span>
                    <span className="td-rec-detail">{c.label}</span>
                    <span style={{ fontWeight: 800 }}>{countOf(c.best, "rounds")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
