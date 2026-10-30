import React from "react";
import { Volume2, Vibrate, BookOpen, ArrowLeftRight, History, ChevronRight } from "lucide-react";
import { Switch, Tape, Marker } from "./ui.jsx";
import { THEME } from "./theme.js";

function Row({ icon, bg, fg, label, children }) {
  return (
    <div className="sb-row">
      <span className="sb-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span className="sb-row-label">{label}</span>
      {children}
    </div>
  );
}

function LinkRow({ icon, bg, fg, label, ...props }) {
  const Tag = props.href ? "a" : "button";
  return (
    <Tag className="sb-set-link" type={props.href ? undefined : "button"} {...props}>
      <span className="sb-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={20} color="#8A90A3" strokeWidth={2.6} />
    </Tag>
  );
}

export default function SettingsScreen({ g, onHelp }) {
  return (
    <main className="sb-page with-tabs sb-in">
      <h1 className="sb-h1">
        <Marker color={THEME.queue.main}>Settings</Marker>
      </h1>

      <section className="sb-card sb-set-card sb-place" style={{ "--tilt": "-0.6deg" }}>
        <Tape color={THEME.pattern.main} pattern="stripe" width={54} angle={4} style={{ top: -10, right: 30 }} />
        <div className="sb-rows">
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

      <section className="sb-card sb-set-card sb-place" style={{ "--tilt": "0.5deg", "--delay": "60ms" }}>
        <Tape color={THEME.sequence.main} pattern="dots" width={48} angle={-5} style={{ top: -10, left: 34 }} />
        <LinkRow icon={<BookOpen size={19} strokeWidth={2.4} />} bg="#E1F2E9" fg="#2A6E4F" label="How to play" onClick={onHelp} />
      </section>

      <section className="sb-card sb-set-card sb-place" style={{ "--tilt": "-0.4deg", "--delay": "120ms" }}>
        <Tape color={THEME.free.main} pattern="plain" width={50} angle={3} style={{ top: -10, right: 48 }} />
        <LinkRow icon={<ArrowLeftRight size={19} strokeWidth={2.4} />} bg="#ECE8FA" fg="#5B49A8" label="Switch version" href="/" />
        <LinkRow icon={<History size={19} strokeWidth={2.4} />} bg="#FBF1DC" fg="#8A5A0E" label="Today's version" href="/classic" />
      </section>
    </main>
  );
}
