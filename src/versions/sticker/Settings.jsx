import React from "react";
import { Volume2, Vibrate, BookOpen, ArrowLeftRight, History, ChevronRight } from "lucide-react";
import { Switch, Squiggle } from "./ui.jsx";
import { THEME } from "./theme.js";

function Row({ icon, bg, fg, label, children }) {
  return (
    <div className="st-row">
      <span className="st-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span className="st-row-label">{label}</span>
      {children}
    </div>
  );
}

function LinkRow({ icon, bg, fg, label, ...props }) {
  const Tag = props.href ? "a" : "button";
  return (
    <Tag className="st-set-link" type={props.href ? undefined : "button"} {...props}>
      <span className="st-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={20} color="#8A90A3" strokeWidth={2.6} />
    </Tag>
  );
}

export default function SettingsScreen({ g, onHelp }) {
  return (
    <main className="st-page with-tabs st-in">
      <div className="st-title-wrap">
        <h1 className="st-h1">Settings</h1>
        <Squiggle width={110} color={THEME.queue.main} />
      </div>

      <section className="st-sticker st-card st-slap" style={{ "--tilt": "-0.6deg" }}>
        <div className="st-rows">
          <Row icon={<Volume2 size={19} strokeWidth={2.4} />} bg="#DCE4F7" fg="#44589F" label="Sound">
            <Switch
              checked={g.prefs.sound}
              onChange={(v) => {
                g.setSound(v);
                // The preference ref updates on the next render, so play the sample after it.
                if (v) setTimeout(() => g.emit("correct"), 30);
              }}
              label="Sound"
            />
          </Row>
          <Row icon={<Vibrate size={19} strokeWidth={2.4} />} bg="#FBE5EA" fg="#A8435B" label="Vibration">
            <Switch
              checked={g.prefs.haptics}
              onChange={(v) => {
                g.setHaptics(v);
                if (v) setTimeout(() => g.emit("clear"), 30);
              }}
              label="Vibration"
            />
          </Row>
        </div>
      </section>

      <section className="st-sticker st-card st-slap" style={{ "--tilt": "0.5deg", "--delay": "60ms" }}>
        <LinkRow icon={<BookOpen size={19} strokeWidth={2.4} />} bg="#E1F2E9" fg="#2A6E4F" label="How to play" onClick={onHelp} />
      </section>

      <section className="st-sticker st-card st-slap" style={{ "--tilt": "-0.4deg", "--delay": "120ms" }}>
        <LinkRow icon={<ArrowLeftRight size={19} strokeWidth={2.4} />} bg="#ECE8FA" fg="#5B49A8" label="Switch version" href="/versions" />
        <LinkRow icon={<History size={19} strokeWidth={2.4} />} bg="#FBF1DC" fg="#8A5A0E" label="Classic version" href="/classic" />
      </section>
    </main>
  );
}
