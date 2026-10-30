import React, { useRef, useState } from "react";
import { Play, Flame, Trophy, ChevronRight } from "lucide-react";
import { MODES, modeByKey, modeHeadline, countOf, presetLabel, presetDetail } from "../../engine/catalog.js";
import { challengeById, challengesForMode, scoreNoun } from "../../challenges.js";
import { dayStreak } from "../../engine/history.js";
import { ART, DoodleArrow, DoodleStar, modeVars } from "./ui.jsx";
import { THEME } from "./theme.js";
import { LiveBuddy, Bubble } from "./Buddy.jsx";
import { POKES, jumpFx } from "./jumps.js";

const TILTS = ["-1.6deg", "1.3deg", "1.1deg", "-1.4deg"];

const levelName = (ch) => (presetLabel(ch) === "∞" ? `∞ ${ch.title}` : ch.title);

// One or two words from the buddy, in place of a page title.
const greeting = (history) => {
  if (!history.length) return "Hi there!";
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Morning!";
  if (h >= 12 && h < 18) return "Hey again!";
  if (h >= 18 && h < 23) return "Evening!";
  return "Night owl?";
};

export default function Home({ g, onOpen, onFree, onQuickPlay }) {
  const last = g.prefs.last;
  const heroMode = last?.mode || "pattern";
  const heroChallenge = last?.intent === "challenge" && last.challengeId ? challengeById(last.challengeId) : null;
  const firstLevel = challengesForMode(heroMode)[0];
  const heroDetail =
    last?.intent === "practice"
      ? "Free play"
      : `${levelName(heroChallenge || firstLevel)} · ${presetDetail(heroChallenge || firstLevel)}`;
  const heroRecord = heroChallenge ? g.stats.challenge[heroChallenge.id] : null;
  const streak = dayStreak(g.history);
  const HeroArt = ART[heroMode];
  const heroName = modeByKey(heroMode).name;

  // Tapping the buddy makes it jump, a different jump each time. A tap mid-jump only
  // says hi; the next jump waits for this one to land.
  const [jump, setJump] = useState({ n: 0, motion: null });
  const jumping = useRef(false);
  const poke = () => {
    g.emit("tap");
    if (jumping.current) return;
    jumping.current = true;
    setJump((j) => ({ n: j.n + 1, motion: POKES[j.n % POKES.length] }));
  };

  return (
    <main className="bd-page with-tabs bd-in">
      <div className="bd-home-head">
        <button type="button" className="bd-home-buddy" onClick={poke} aria-label="Say hi">
          <LiveBuddy jump={jump} fx={jumpFx(g.prefs)} onSettle={() => (jumping.current = false)} />
        </button>
        <Bubble tail="left" className="bd-greet">
          <h1 className="bd-h1">{greeting(g.history)}</h1>
        </Bubble>
        {streak > 0 && (
          <span className="bd-streak" aria-label={`${streak} day streak`}>
            <Flame size={17} fill="#E0AA3E" color="#fff" strokeWidth={2} />
            {streak}
          </span>
        )}
      </div>

      <section className="bd-sticker bd-continue bd-slap" style={modeVars(heroMode)} aria-label={`Continue ${heroName}`}>
        <button type="button" className="bd-continue-open" onClick={() => onOpen(heroMode)} aria-label={`Open ${heroName}`} />
        <span className="bd-continue-art">
          <HeroArt size={74} />
        </span>
        <div className="bd-continue-text">
          <span className="bd-kicker">
            {last ? "Continue" : "Start here"}
            <DoodleArrow width={26} color={THEME[heroMode].ink} />
          </span>
          <span className="bd-continue-name">{heroName}</span>
          <span className="bd-continue-detail">{heroDetail}</span>
          {heroRecord?.best > 0 && (
            <span className="bd-best">
              <Trophy size={12} strokeWidth={2.8} />
              {countOf(heroRecord.best, scoreNoun(heroChallenge))}
            </span>
          )}
        </div>
        <button type="button" className="bd-play-round" onClick={onQuickPlay} aria-label={`Play ${heroName}`}>
          <Play size={24} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
        </button>
      </section>

      <div className="bd-tiles">
        {MODES.map((m, i) => {
          const Art = ART[m.key];
          const head = modeHeadline(g.stats, m.key);
          return (
            <button
              key={m.key}
              type="button"
              className="bd-tile bd-slap"
              style={{ ...modeVars(m.key), "--tilt": TILTS[i], "--delay": `${80 + i * 60}ms` }}
              onClick={() => onOpen(m.key)}
            >
              <span className="bd-tile-art">
                <Art size={54} />
              </span>
              <span className="bd-tile-name">{m.name}</span>
              {head.held > 0 ? (
                <span className="bd-best">
                  <Trophy size={12} strokeWidth={2.8} />
                  {countOf(head.best, head.noun)}
                </span>
              ) : (
                <span className="bd-tile-sub">{m.tagline}</span>
              )}
            </button>
          );
        })}
      </div>

      <button type="button" className="bd-free bd-slap" style={{ "--delay": "340ms" }} onClick={onFree}>
        <ART.free size={50} />
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <span className="bd-tile-name">Free Play</span>
          <span className="bd-tile-sub" style={{ marginTop: 0 }}>
            Your own rules
          </span>
        </span>
        <DoodleStar size={20} color="#A898E0" />
        <ChevronRight size={22} color="#5B49A8" strokeWidth={2.6} />
      </button>
    </main>
  );
}
