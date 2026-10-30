import React from "react";
import { Volume2, Vibrate, BookOpen, ArrowLeftRight, History, ChevronRight } from "lucide-react";
import { Switch, Squiggle } from "./ui.jsx";
import Buddy from "./Buddy.jsx";
import { THEME } from "./theme.js";

function Row({ icon, bg, fg, label, children }) {
  return (
    <div className="bd-row">
      <span className="bd-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span className="bd-row-label">{label}</span>
      {children}
    </div>
  );
}

function LinkRow({ icon, bg, fg, label, ...props }) {
  const Tag = props.href ? "a" : "button";
  return (
    <Tag className="bd-set-link" type={props.href ? undefined : "button"} {...props}>
      <span className="bd-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight size={20} color="#8A90A3" strokeWidth={2.6} />
    </Tag>
  );
}

export default function SettingsScreen({ g, onHelp }) {
  const on = Number(g.prefs.sound) + Number(g.prefs.haptics);
  const mood = on === 2 ? "happy" : on === 1 ? "idle" : "gentle";
  return (
    <main className="bd-page with-tabs bd-in">
      <div className="bd-set-head">
        <div className="bd-title-wrap">
          <h1 className="bd-h1">Settings</h1>
          <Squiggle width={110} color={THEME.queue.main} />
        </div>
        {/* The buddy perks up with sound and buzz on, and dozes with both off. */}
        <span key={mood} className="bd-set-buddy bd-buddy-pop">
          <Buddy mood={mood} />
        </span>
      </div>

      <section className="bd-sticker bd-card bd-slap" style={{ "--tilt": "-0.6deg" }}>
        <div className="bd-rows">
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

      <section className="bd-sticker bd-card bd-slap" style={{ "--tilt": "0.5deg", "--delay": "60ms" }}>
        <LinkRow icon={<BookOpen size={19} strokeWidth={2.4} />} bg="#E1F2E9" fg="#2A6E4F" label="How to play" onClick={onHelp} />
      </section>

      <section className="bd-sticker bd-card bd-slap" style={{ "--tilt": "-0.4deg", "--delay": "120ms" }}>
        <LinkRow icon={<ArrowLeftRight size={19} strokeWidth={2.4} />} bg="#ECE8FA" fg="#5B49A8" label="Switch version" href="/" />
        <LinkRow icon={<History size={19} strokeWidth={2.4} />} bg="#FBF1DC" fg="#8A5A0E" label="Today's version" href="/classic" />
      </section>
    </main>
  );
}
