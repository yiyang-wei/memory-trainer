import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { TutorialPlayer, TUTORIAL_SCRIPTS, MODE_RULES } from "../../tutorial.jsx";
import { MODES } from "../../engine/catalog.js";
import { modeVars } from "./ui.jsx";

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
    <div className={`td-cell t-${tone}${faceUp ? " up" : ""}`} style={{ width: "100%", height: "100%" }}>
      <span className="td-cell-face">{content}</span>
    </div>
  );
}

export default function Tutorial({ initialMode, onBack }) {
  const [mode, setMode] = useState(initialMode);
  return (
    <main className="td-page td-in" style={modeVars(mode)}>
      <div className="td-topbar">
        <button type="button" className="td-icon-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={23} strokeWidth={2.6} />
        </button>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>How to play</span>
        <span style={{ width: 46 }} />
      </div>
      <div className="td-tut-chips" role="tablist" aria-label="Exercise">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === mode}
            className={`td-chip${m.key === mode ? " on" : ""}`}
            style={modeVars(m.key)}
            onClick={() => setMode(m.key)}
          >
            <span className="td-chip-label" style={{ fontSize: 13.5 }}>
              {m.name}
            </span>
          </button>
        ))}
      </div>
      <section className="td-sticker td-tut">
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
