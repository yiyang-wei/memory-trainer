import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { TutorialPlayer, TUTORIAL_SCRIPTS, MODE_RULES } from "../../tutorial.jsx";
import { MODES } from "../../engine/catalog.js";
import { modeVars } from "./theme.js";

// The original palette, which the tutorial's queue strip reads.
const C = {
  ink: "#3B3F51",
  mutedInk: "#5F6478",
  accent: "#8CA0DB",
  accentSoft: "#DCE4F7",
  success: "#7FBF9E",
  successSoft: "#E1F2E9",
  gold: "#E0AA3E",
  cellBorder: "#D3D8E6",
  surface: "#FFFFFF",
};

function TutCard({ faceUp, tone, content }) {
  return (
    <div className={`gl-cell t-${tone}${faceUp ? " up" : ""}`} style={{ width: "100%", height: "100%" }}>
      <span className="gl-cell-face">{content}</span>
    </div>
  );
}

export default function Tutorial({ initialMode, onBack }) {
  const [mode, setMode] = useState(initialMode);
  return (
    <main className="gl-page gl-screen-in" style={modeVars(mode)}>
      <div className="gl-topbar">
        <button type="button" className="gl-icon-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={22} strokeWidth={2.6} />
        </button>
        <span className="gl-topbar-title">How to play</span>
        <span />
      </div>
      <div className="gl-chips" role="tablist" aria-label="Exercise">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === mode}
            className={`gl-chip${m.key === mode ? " on" : ""}`}
            style={{ minHeight: 48 }}
            onClick={() => setMode(m.key)}
          >
            <span className="gl-chip-label" style={{ fontSize: 13.5 }}>
              {m.name}
            </span>
          </button>
        ))}
      </div>
      <section className="gl-card gl-tut" style={{ marginTop: 14 }}>
        <TutorialPlayer key={mode} mode={mode} script={TUTORIAL_SCRIPTS[mode]} C={C} Card={TutCard} />
        <ul>
          {MODE_RULES[mode].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
