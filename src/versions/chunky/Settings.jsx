import React from "react";
import { Volume2, Vibrate, BookOpen, ArrowLeftRight, History, ChevronRight } from "lucide-react";
import { Switch } from "./ui.jsx";

function Icon({ bg, edge, children }) {
  return (
    <span className="ck-row-icon" style={{ background: bg, boxShadow: `0 3px 0 ${edge}`, color: "#fff" }}>
      {children}
    </span>
  );
}

export default function SettingsScreen({ g, onHelp }) {
  return (
    <main className="ck-page with-tabs">
      <h1 className="ck-h1 ck-in" style={{ margin: "4px 0 16px" }}>
        Settings
      </h1>

      <section className="ck-card ck-rows ck-in" style={{ marginTop: 0, "--i": 1 }}>
        <div className="ck-row">
          <Icon bg="#6F86D6" edge="#4F64B8">
            <Volume2 size={20} strokeWidth={2.6} />
          </Icon>
          <span className="ck-row-label">Sound</span>
          <Switch
            checked={g.prefs.sound}
            onChange={(v) => {
              g.setSound(v);
              if (v) setTimeout(() => g.emit("correct"), 0);
            }}
            label="Sound"
          />
        </div>
        <div className="ck-row">
          <Icon bg="#E2667F" edge="#BC4A62">
            <Vibrate size={20} strokeWidth={2.6} />
          </Icon>
          <span className="ck-row-label">Vibration</span>
          <Switch
            checked={g.prefs.haptics}
            onChange={(v) => {
              g.setHaptics(v);
              if (v && navigator.vibrate) navigator.vibrate(20);
            }}
            label="Vibration"
          />
        </div>
      </section>

      <section className="ck-card ck-rows ck-in" style={{ "--i": 2 }}>
        <button type="button" className="ck-set-link" onClick={onHelp}>
          <Icon bg="#5DB38A" edge="#3F9068">
            <BookOpen size={20} strokeWidth={2.6} />
          </Icon>
          <span style={{ flex: 1 }}>How to play</span>
          <ChevronRight size={22} color="#8A90A3" strokeWidth={2.6} />
        </button>
      </section>

      <section className="ck-card ck-rows ck-in" style={{ "--i": 3 }}>
        <a className="ck-set-link" href="/">
          <Icon bg="#9A87DB" edge="#7562BE">
            <ArrowLeftRight size={20} strokeWidth={2.6} />
          </Icon>
          <span style={{ flex: 1 }}>Switch version</span>
          <ChevronRight size={22} color="#8A90A3" strokeWidth={2.6} />
        </a>
        <a className="ck-set-link" href="/classic" style={{ borderTop: "2px solid var(--line)" }}>
          <Icon bg="#E3A52F" edge="#B9821A">
            <History size={20} strokeWidth={2.6} />
          </Icon>
          <span style={{ flex: 1 }}>Today's version</span>
          <ChevronRight size={22} color="#8A90A3" strokeWidth={2.6} />
        </a>
      </section>
    </main>
  );
}
