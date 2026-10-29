import React from "react";
import { Play, Flame, Trophy, ChevronRight } from "lucide-react";
import { MODES, modeByKey, modeHeadline, countOf, presetLabel, presetDetail } from "../../engine/catalog.js";
import { challengeById } from "../../challenges.js";
import { dayStreak } from "../../engine/history.js";
import { ART } from "./ui.jsx";
import { modeVars } from "./theme.js";

export default function Home({ g, onOpen, onFree, onQuickPlay }) {
  const last = g.prefs.last;
  const heroMode = last?.mode || "pattern";
  const heroChallenge = last?.intent === "challenge" && last.challengeId ? challengeById(last.challengeId) : null;
  const heroDetail =
    last?.intent === "practice"
      ? "Free play"
      : heroChallenge
        ? `${presetLabel(heroChallenge) === "∞" ? "∞ " : ""}${heroChallenge.title} · ${presetDetail(heroChallenge)}`
        : "Tap play to begin";
  const streak = dayStreak(g.history);
  const HeroArt = ART[heroMode];

  return (
    <main className="ck-page with-tabs">
      <div className="ck-home-head ck-in">
        <h1 className="ck-h1">Memory Trainer</h1>
        {streak > 0 && (
          <span className="ck-streak" aria-label={`${streak} day streak`}>
            <Flame size={18} fill="#E3A52F" strokeWidth={0} />
            {streak}
          </span>
        )}
      </div>

      <section className="ck-continue ck-in" style={{ ...modeVars(heroMode), "--i": 1 }} aria-label="Continue">
        <button
          type="button"
          onClick={() => onOpen(heroMode)}
          aria-label={`Open ${modeByKey(heroMode).name}`}
          style={{ position: "absolute", inset: 0, border: "none", background: "none", borderRadius: 28, cursor: "pointer" }}
        />
        <span className="ck-continue-art" style={{ pointerEvents: "none" }}>
          <HeroArt size={76} />
        </span>
        <span className="ck-continue-text" style={{ pointerEvents: "none" }}>
          <span className="ck-kicker">{last ? "Continue" : "Start here"}</span>
          <span className="ck-continue-name">{modeByKey(heroMode).name}</span>
          <span className="ck-continue-detail">{heroDetail}</span>
        </span>
        <button type="button" className="ck-key ck-play-key" onClick={onQuickPlay} aria-label="Play" style={{ position: "relative" }}>
          <Play size={28} fill="#fff" strokeWidth={0} style={{ marginLeft: 4 }} />
        </button>
      </section>

      <div className="ck-tiles">
        {MODES.map((m, idx) => {
          const Art = ART[m.key];
          const head = modeHeadline(g.stats, m.key);
          return (
            <button
              key={m.key}
              type="button"
              className="ck-key ck-tile ck-in"
              style={{ ...modeVars(m.key), "--i": idx + 2 }}
              onClick={() => onOpen(m.key)}
              aria-label={`${m.name}${head.held ? `, best ${countOf(head.best, head.noun)}` : ""}`}
            >
              <span className="ck-tile-art">
                <Art size={82} />
              </span>
              <span className="ck-tile-name">{m.name}</span>
              <span className="ck-tile-foot">
                {head.held > 0 ? (
                  <span className="ck-best">
                    <Trophy size={13} color="#B9821A" strokeWidth={2.8} />
                    {countOf(head.best, head.noun)}
                  </span>
                ) : (
                  <span className="ck-tile-sub">{m.tagline}</span>
                )}
                <span className="ck-pips" aria-hidden="true">
                  {head.levels.map((l) => (
                    <i key={l.id} className={l.best > 0 ? "on" : ""} />
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button type="button" className="ck-key ck-free ck-in" style={{ ...modeVars("free"), "--i": 6 }} onClick={onFree}>
        <span
          style={{
            width: 54,
            height: 50,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ART.free size={52} />
        </span>
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>Free Play</span>
          <span style={{ fontSize: 14, fontWeight: 550, color: "var(--muted)" }}>Your own rules</span>
        </span>
        <ChevronRight size={24} strokeWidth={2.8} color="#5B49A8" />
      </button>
    </main>
  );
}
