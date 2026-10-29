import React from "react";
import { Volume2, Vibrate, BookOpen, ArrowLeftRight, History, ChevronRight } from "lucide-react";
import { Switch } from "./ui.jsx";

function Row({ icon, bg, fg, label, children }) {
  return (
    <div className="gl-row">
      <span className="gl-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span className="gl-row-label">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsScreen({ g, onHelp }) {
  return (
    <main className="gl-page with-tabs gl-screen-in">
      <h1 className="gl-h1" style={{ marginBottom: 16 }}>
        Settings
      </h1>

      <section className="gl-card gl-rows" style={{ marginTop: 0 }}>
        <Row icon={<Volume2 size={18} strokeWidth={2.4} />} bg="#DCE4F7" fg="#44589F" label="Sound">
          <Switch
            checked={g.prefs.sound}
            onChange={(v) => {
              g.setSound(v);
              if (v) setTimeout(() => g.emit("correct"), 0);
            }}
            label="Sound"
          />
        </Row>
        <Row icon={<Vibrate size={18} strokeWidth={2.4} />} bg="#FBE5EA" fg="#A8435B" label="Vibration">
          <Switch checked={g.prefs.haptics} onChange={(v) => g.setHaptics(v)} label="Vibration" />
        </Row>
      </section>

      <section className="gl-card gl-rows">
        <button type="button" className="gl-set-link" onClick={onHelp}>
          <span className="gl-row-icon" style={{ background: "#E1F2E9", color: "#2A6E4F" }}>
            <BookOpen size={18} strokeWidth={2.4} />
          </span>
          <span style={{ flex: 1 }}>How to play</span>
          <ChevronRight size={20} color="#8A90A3" />
        </button>
      </section>

      <section className="gl-card gl-rows">
        <a className="gl-set-link" href="/">
          <span className="gl-row-icon" style={{ background: "#ECE8FA", color: "#5B49A8" }}>
            <ArrowLeftRight size={18} strokeWidth={2.4} />
          </span>
          <span style={{ flex: 1 }}>Switch version</span>
          <ChevronRight size={20} color="#8A90A3" />
        </a>
        <a className="gl-set-link" href="/classic" style={{ borderTop: "1px solid var(--line)" }}>
          <span className="gl-row-icon" style={{ background: "#FBF1DC", color: "#8A5A0E" }}>
            <History size={18} strokeWidth={2.4} />
          </span>
          <span style={{ flex: 1 }}>Today's version</span>
          <ChevronRight size={20} color="#8A90A3" />
        </a>
      </section>
    </main>
  );
}
