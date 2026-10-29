import React from "react";
import { ArrowRight, Play, Flame, Trophy } from "lucide-react";
import { MODES, modeHeadline, countOf, presetLabel, presetDetail } from "../../engine/catalog.js";
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
        ? `${presetLabel(heroChallenge) === "∞" ? "∞ " + heroChallenge.title : heroChallenge.title} · ${presetDetail(heroChallenge)}`
        : null;
  const heroHead = modeHeadline(g.stats, heroMode);
  const streak = dayStreak(g.history);
  const HeroArt = ART[heroMode];
  const others = MODES.filter((m) => m.key !== heroMode);

  return (
    <main className="gl-page with-tabs gl-screen-in">
      <div className="gl-home-head">
        <h1 className="gl-h1">Memory Trainer</h1>
        {streak > 0 && (
          <span className="gl-streak" aria-label={`${streak} day streak`}>
            <Flame size={16} fill="#E0AA3E" strokeWidth={0} />
            {streak}
          </span>
        )}
      </div>

      <div className="gl-hero" style={modeVars(heroMode)} role="group" aria-label={MODES.find((m) => m.key === heroMode).name}>
        <button
          type="button"
          onClick={() => onOpen(heroMode)}
          style={{ position: "absolute", inset: 0, border: "none", background: "none", cursor: "pointer" }}
          aria-label={`Open ${MODES.find((m) => m.key === heroMode).name}`}
        />
        <div className="gl-hero-art" style={{ pointerEvents: "none" }}>
          <HeroArt size={128} />
        </div>
        <div className="gl-hero-text" style={{ pointerEvents: "none" }}>
          <span className="gl-hero-kicker">{last ? "Continue" : "Start here"}</span>
          <span className="gl-hero-name">{MODES.find((m) => m.key === heroMode).name}</span>
          {heroDetail && <span className="gl-hero-detail">{heroDetail}</span>}
          {heroHead.held > 0 && last?.intent !== "practice" && (
            <span className="gl-tile-best">
              <Trophy size={13} color="#C98A1A" strokeWidth={2.6} />
              {countOf(heroHead.best, heroHead.noun)}
            </span>
          )}
        </div>
        <button type="button" className="gl-go" onClick={onQuickPlay} aria-label="Play">
          <Play size={22} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
        </button>
      </div>

      <div className="gl-tiles">
        {others.map((m) => {
          const Art = ART[m.key];
          const head = modeHeadline(g.stats, m.key);
          return (
            <button key={m.key} type="button" className="gl-tile" style={modeVars(m.key)} onClick={() => onOpen(m.key)}>
              <span className="gl-tile-name">{m.name}</span>
              {head.held > 0 ? (
                <span className="gl-tile-best">
                  <Trophy size={12} color="#C98A1A" strokeWidth={2.6} />
                  {countOf(head.best, head.noun)}
                </span>
              ) : (
                <span className="gl-tile-sub">{m.tagline}</span>
              )}
              <span className="gl-tile-art">
                <Art size={74} />
              </span>
              <span className="gl-tile-arrow">
                <ArrowRight size={18} strokeWidth={2.8} />
              </span>
            </button>
          );
        })}
        <button type="button" className="gl-tile" style={modeVars("free")} onClick={onFree}>
          <span className="gl-tile-name">Free Play</span>
          <span className="gl-tile-sub">Your own rules</span>
          <span className="gl-tile-art">
            <ART.free size={74} />
          </span>
          <span className="gl-tile-arrow">
            <ArrowRight size={18} strokeWidth={2.8} />
          </span>
        </button>
      </div>
    </main>
  );
}
