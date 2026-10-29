import React from "react";
import { Play, Flame, Trophy, ChevronRight } from "lucide-react";
import { MODES, modeByKey, modeHeadline, countOf, presetLabel, presetDetail } from "../../engine/catalog.js";
import { challengeById, challengesForMode, scoreNoun } from "../../challenges.js";
import { dayStreak } from "../../engine/history.js";
import { ART, Squiggle, DoodleArrow, DoodleStar, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";

const TILTS = ["-1.8deg", "1.4deg", "1.2deg", "-1.5deg"];

const levelName = (ch) => (presetLabel(ch) === "∞" ? `∞ ${ch.title}` : ch.title);

export default function Home({ g, onOpen, onFree, onQuickPlay }) {
  const last = g.prefs.last;
  const heroMode = last?.mode || "pattern";
  const heroChallenge = last?.intent === "challenge" && last.challengeId ? challengeById(last.challengeId) : null;
  const heroDetail =
    last?.intent === "practice" ? "Free play" : `${levelName(heroChallenge || challengesForMode(heroMode)[0])} · ${presetDetail(heroChallenge || challengesForMode(heroMode)[0])}`;
  const heroHead = modeHeadline(g.stats, heroMode);
  const heroRecord = heroChallenge ? g.stats.challenge[heroChallenge.id] : null;
  const streak = dayStreak(g.history);
  const HeroArt = ART[heroMode];
  const heroName = modeByKey(heroMode).name;

  return (
    <main className="st-page with-tabs st-in">
      <div className="st-home-head">
        <div className="st-title-wrap">
          <h1 className="st-h1">Memory Trainer</h1>
          <Squiggle width={150} color={THEME.pattern.main} />
        </div>
        {streak > 0 && (
          <span className="st-streak" aria-label={`${streak} day streak`}>
            <Flame size={17} fill="#E0AA3E" color="#fff" strokeWidth={2} />
            {streak}
          </span>
        )}
      </div>

      <section className="st-sticker st-continue st-slap" style={modeVars(heroMode)} aria-label={`Continue ${heroName}`}>
        <button type="button" className="st-continue-open" onClick={() => onOpen(heroMode)} aria-label={`Open ${heroName}`} />
        <span className="st-continue-art">
          <HeroArt size={84} />
        </span>
        <div className="st-continue-text">
          <span className="st-kicker">
            {last ? "Continue" : "Start here"}
            <DoodleArrow width={26} color={THEME[heroMode].ink} />
          </span>
          <span className="st-continue-name">{heroName}</span>
          <span className="st-continue-detail">{heroDetail}</span>
          {(heroRecord?.best || (!heroChallenge && heroHead.held > 0)) && (
            <span className="st-best">
              <Trophy size={12} strokeWidth={2.8} />
              {heroRecord ? countOf(heroRecord.best, scoreNoun(heroChallenge)) : countOf(heroHead.best, heroHead.noun)}
            </span>
          )}
        </div>
        <button type="button" className="st-play-round" onClick={onQuickPlay} aria-label={`Play ${heroName}`}>
          <Play size={24} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
        </button>
      </section>

      <div className="st-tiles">
        {MODES.map((m, i) => {
          const Art = ART[m.key];
          const head = modeHeadline(g.stats, m.key);
          return (
            <button
              key={m.key}
              type="button"
              className="st-tile st-slap"
              style={{ ...modeVars(m.key), "--tilt": TILTS[i], "--delay": `${80 + i * 60}ms` }}
              onClick={() => onOpen(m.key)}
            >
              <span className="st-tile-name">{m.name}</span>
              {head.held > 0 ? (
                <span className="st-best">
                  <Trophy size={12} strokeWidth={2.8} />
                  {countOf(head.best, head.noun)}
                </span>
              ) : (
                <span className="st-tile-sub">{m.tagline}</span>
              )}
              <span className="st-tile-art">
                <Art size={84} />
              </span>
            </button>
          );
        })}
      </div>

      <button type="button" className="st-free st-slap" style={{ "--delay": "340ms" }} onClick={onFree}>
        <ART.free size={56} />
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <span className="st-tile-name">Free Play</span>
          <span className="st-tile-sub" style={{ marginTop: 0 }}>
            Your own rules
          </span>
        </span>
        <DoodleStar size={20} color="#A898E0" />
        <ChevronRight size={22} color="#5B49A8" strokeWidth={2.6} />
      </button>
    </main>
  );
}
