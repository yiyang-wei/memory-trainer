import React from "react";
import { Play, Flame, Trophy, ChevronRight } from "lucide-react";
import { MODES, modeByKey, modeHeadline, countOf, presetLabel, presetDetail } from "../../engine/catalog.js";
import { challengeById, challengesForMode, scoreNoun } from "../../challenges.js";
import { dayStreak } from "../../engine/history.js";
import { ART, Squiggle, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";

const levelName = (ch) => (presetLabel(ch) === "∞" ? `∞ ${ch.title}` : ch.title);

export default function Home({ g, onOpen, onFree, onQuickPlay }) {
  const last = g.prefs.last;
  const heroMode = last?.mode || "pattern";
  const practice = last?.intent === "practice";
  const lastChallenge = !practice && last?.challengeId ? challengeById(last.challengeId) : null;
  const shownChallenge = lastChallenge || challengesForMode(heroMode)[0];
  const cfg = g.config[heroMode];
  const heroDetail = practice
    ? `Free play · ${cfg.boardSize}×${cfg.boardSize}`
    : `${levelName(shownChallenge)} · ${presetDetail(shownChallenge)}`;
  // Only a ranked level has a record worth showing here; after free play the ranked
  // trophy would describe a different game from the one Continue starts.
  const heroRecord = lastChallenge ? g.stats.challenge[lastChallenge.id] : null;
  const streak = dayStreak(g.history);
  const HeroArt = ART[heroMode];
  const heroName = modeByKey(heroMode).name;

  return (
    <main className="td-page with-tabs td-in">
      <header className="td-home-head">
        <div className="td-title-wrap">
          <h1 className="td-h1">Memory Trainer</h1>
          <Squiggle width={140} color={THEME.pattern.main} />
        </div>
        {streak > 0 && (
          <span className="td-streak td-slap" style={{ "--tilt": "4deg", "--delay": "260ms" }} aria-label={`${streak} day streak`}>
            <Flame size={16} fill="#E0AA3E" color="#E0AA3E" strokeWidth={1.5} />
            {streak}
          </span>
        )}
      </header>

      <section className="td-sticker td-continue td-rise" style={modeVars(heroMode)} aria-label={`Continue ${heroName}`}>
        <button type="button" className="td-continue-open" onClick={() => onOpen(heroMode)} aria-label={`Open ${heroName}`} />
        <span className="td-continue-art">
          <HeroArt size={78} />
        </span>
        <div className="td-continue-text">
          <span className="td-kicker">{last ? "Continue" : "Start here"}</span>
          <span className="td-continue-name">{heroName}</span>
          <span className="td-continue-detail">{heroDetail}</span>
          {heroRecord?.best > 0 && (
            <span className="td-best">
              <Trophy size={12} strokeWidth={2.8} />
              {countOf(heroRecord.best, scoreNoun(lastChallenge))}
            </span>
          )}
        </div>
        <button type="button" className="td-play-round" onClick={onQuickPlay} aria-label={`Play ${heroName}`}>
          <Play size={23} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
        </button>
      </section>

      <div className="td-tiles">
        {MODES.map((m, i) => {
          const Art = ART[m.key];
          const head = modeHeadline(g.stats, m.key);
          return (
            <button
              key={m.key}
              type="button"
              className="td-tile td-rise"
              style={{ ...modeVars(m.key), "--delay": `${70 + i * 45}ms` }}
              onClick={() => onOpen(m.key)}
            >
              <span className="td-tile-top">
                <span className="td-tile-art">
                  <Art size={60} />
                </span>
                {head.held > 0 && (
                  <span className="td-tile-rec" aria-label={`Record ${countOf(head.best, head.noun)}`}>
                    <Trophy size={12} strokeWidth={2.8} />
                    {head.best}
                  </span>
                )}
              </span>
              <span className="td-tile-name">{m.name}</span>
              <span className="td-tile-sub">{m.tagline}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="td-free td-rise" style={{ "--delay": "260ms" }} onClick={onFree}>
        <ART.free size={48} />
        <span className="td-free-text">
          <span className="td-tile-name">Free Play</span>
          <span className="td-tile-sub">Your own rules</span>
        </span>
        <ChevronRight size={22} color="#5B49A8" strokeWidth={2.6} />
      </button>
    </main>
  );
}
