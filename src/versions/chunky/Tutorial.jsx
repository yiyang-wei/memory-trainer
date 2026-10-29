import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { TutorialPlayer, TUTORIAL_SCRIPTS, MODE_RULES } from "../../tutorial.jsx";
import { MODES } from "../../engine/catalog.js";
import { THEME, modeVars } from "./theme.js";

// The original palette, which the tutorial's queue strip reads.
const C = {
  ink: "#3B3F51",
  mutedInk: "#5F6478",
  accent: "#6F86D6",
  accentSoft: "#DFE5F8",
  success: "#5DB38A",
  successSoft: "#DCF1E6",
  gold: "#E3A52F",
  cellBorder: "#D3D8E5",
  surface: "#FFFFFF",
};

// Adapts the tutorial's card props to a Chunky keycap.
function makeCard(mode) {
  const t = THEME[mode];
  return function TutCard({ faceUp, tone, content }) {
    const fill =
      !faceUp ? null : tone === "success" ? ["#5DB38A", "#3F9068"] : tone === "highlight" ? [t.main, t.edge] : null;
    return (
      <div className={`ck-tut-cell${faceUp ? " up" : ""}`} style={fill ? { "--f": fill[0], "--fe": fill[1] } : undefined}>
        {content}
      </div>
    );
  };
}

const CARDS = Object.fromEntries(MODES.map((m) => [m.key, makeCard(m.key)]));

export default function Tutorial({ initialMode, onBack }) {
  const [mode, setMode] = useState(initialMode);
  return (
    <main className="ck-page" style={modeVars(mode)}>
      <div className="ck-topbar">
        <button type="button" className="ck-key ck-icon-key" onClick={onBack} aria-label="Back">
          <ChevronLeft size={24} strokeWidth={2.8} />
        </button>
        <span className="ck-topbar-title">How to play</span>
        <span />
      </div>
      <div className="ck-levels" role="tablist" aria-label="Exercise">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === mode}
            className={`ck-key ck-level${m.key === mode ? " on" : " outline"}`}
            style={{ minHeight: 50, ...modeVars(m.key) }}
            onClick={() => setMode(m.key)}
          >
            <span className="ck-level-label" style={{ fontSize: 14 }}>
              {m.name}
            </span>
          </button>
        ))}
      </div>
      <section className="ck-card ck-tut">
        <TutorialPlayer key={mode} mode={mode} script={TUTORIAL_SCRIPTS[mode]} C={C} Card={CARDS[mode]} />
        <ul>
          {MODE_RULES[mode].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
