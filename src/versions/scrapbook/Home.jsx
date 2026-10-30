import React from "react";
import { Play, Flame, ChevronRight } from "lucide-react";
import { MODES, modeByKey, modeHeadline, presetLabel, presetDetail } from "../../engine/catalog.js";
import { challengeById, challengesForMode } from "../../challenges.js";
import { dayStreak } from "../../engine/history.js";
import { ART, Tape, MiniStamp, Marker, DoodleArrow, DoodleStar, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";

// Each tile is taped down a little differently, like a page put together by hand.
const TILES = [
  { tilt: "-1.4deg", tape: { pattern: "stripe", angle: 4, style: { top: -10, right: 22 } } },
  { tilt: "1.2deg", tape: { pattern: "dots", angle: -5, style: { top: -10, right: 26 } } },
  { tilt: "0.9deg", tape: { pattern: "plain", angle: -3, style: { top: -10, right: 20 } } },
  { tilt: "-1.1deg", tape: { pattern: "stripe", angle: 6, style: { top: -10, right: 24 } } },
];

const levelName = (ch) => (presetLabel(ch) === "∞" ? `∞ ${ch.title}` : ch.title);

export default function Home({ g, onOpen, onFree, onQuickPlay }) {
  const last = g.prefs.last;
  const heroMode = last?.mode || "pattern";
  const heroChallenge = last?.intent === "challenge" && last.challengeId ? challengeById(last.challengeId) : null;
  const shownLevel = heroChallenge || challengesForMode(heroMode)[0];
  const heroDetail = last?.intent === "practice" ? "Free play" : `${levelName(shownLevel)} · ${presetDetail(shownLevel)}`;
  // Only a ranked level has a record worth stamping; free play keeps its own bests.
  const heroRecord = last?.intent !== "practice" ? g.stats.challenge[shownLevel.id] : null;
  const streak = dayStreak(g.history);
  const HeroArt = ART[heroMode];
  const heroName = modeByKey(heroMode).name;

  return (
    <main className="sb-page with-tabs sb-in">
      <div className="sb-home-head">
        <h1 className="sb-h1">
          Memory <Marker color={THEME.pattern.main}>Trainer</Marker>
        </h1>
        {streak > 0 && (
          <span className="sb-streak" aria-label={`${streak} day streak`}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <Flame size={15} fill="currentColor" strokeWidth={0} />
              {streak}
            </span>
            <small>{streak === 1 ? "day" : "days"}</small>
          </span>
        )}
      </div>

      <section className="sb-card sb-continue sb-place" style={modeVars(heroMode)} aria-label={`Continue ${heroName}`}>
        <Tape color={THEME[heroMode].main} pattern="stripe" width={74} angle={-32} style={{ top: 4, left: -18 }} />
        <button type="button" className="sb-continue-open" onClick={() => onOpen(heroMode)} aria-label={`Open ${heroName}`} />
        <span className="sb-continue-art">
          <HeroArt size={76} />
        </span>
        <div className="sb-continue-text">
          <span className="sb-kicker">
            {last ? "continue" : "start here"}
            <DoodleArrow width={24} color={THEME[heroMode].ink} />
          </span>
          <span className="sb-continue-name">{heroName}</span>
          <span className="sb-continue-detail">{heroDetail}</span>
          {heroRecord?.best > 0 && <MiniStamp color="#B07B17">Best {heroRecord.best}</MiniStamp>}
        </div>
        <button type="button" className="sb-play-round" onClick={onQuickPlay} aria-label={`Play ${heroName}`}>
          <Play size={24} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
        </button>
      </section>

      <div className="sb-tiles">
        {MODES.map((m, i) => {
          const Art = ART[m.key];
          const head = modeHeadline(g.stats, m.key);
          const look = TILES[i];
          return (
            <button
              key={m.key}
              type="button"
              className="sb-tile sb-place"
              style={{ ...modeVars(m.key), "--tilt": look.tilt, "--delay": `${90 + i * 60}ms` }}
              onClick={() => onOpen(m.key)}
            >
              <Tape color={THEME[m.key].main} width={50} {...look.tape} />
              <span className="sb-tile-art">
                <Art size={58} />
              </span>
              {head.held > 0 && (
                <MiniStamp color={THEME[m.key].ink} tilt={i % 2 ? 4 : -4}>
                  Best {head.best}
                </MiniStamp>
              )}
              <span className="sb-tile-name">{m.name}</span>
              <span className="sb-tile-sub">{m.tagline}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="sb-free sb-place" style={{ "--delay": "340ms" }} onClick={onFree}>
        <Tape color={THEME.free.main} pattern="dots" width={46} angle={-8} style={{ top: -9, left: 18 }} />
        <ART.free size={52} />
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <span className="sb-tile-name">Free Play</span>
          <span className="sb-tile-sub">Your own rules</span>
        </span>
        <DoodleStar size={20} color="#A898E0" />
        <ChevronRight size={22} color="#5B49A8" strokeWidth={2.6} />
      </button>
    </main>
  );
}
