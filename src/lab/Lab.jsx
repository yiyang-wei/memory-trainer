import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@fontsource-variable/bricolage-grotesque";
import { Star, Volume2, VolumeX, Vibrate, VibrateOff, Play, MessageSquare, Copy, Check, ArrowLeft, Repeat } from "lucide-react";
import "./lab.css";
import { useRatings } from "./ratings.js";
import { DESIGNS, designByCode } from "./characters.jsx";
import { FACE_STYLES } from "./face.jsx";
import { MOTIONS } from "./motions.jsx";
import { playFeedback } from "../engine/feedback.js";

// Buddy Lab: every candidate buddy design, face and motion on one page, each with a code
// and a 1–5 star rating. Ratings save to this device and to the dev server.

const PREFS_KEY = "memory-trainer.lab.prefs.v1";
const FACE_CODES = Object.keys(FACE_STYLES).map((k, i) => ({ code: `F${String(i + 1).padStart(2, "0")}`, key: k }));
const STRIP = ["happy", "cheer", "oops", "sleep"];
const ALL_MOODS = ["idle", "watch", "think", "happy", "cheer", "oops", "gentle", "sleep"];

function usePrefs() {
  const [prefs, setPrefs] = useState(() => {
    const base = { sound: true, haptics: true, auto: true, design: "B03", unrated: false, r2: true };
    try {
      const saved = { ...base, ...JSON.parse(localStorage.getItem(PREFS_KEY)) };
      // Round 2's motions are tuned on Mallow, so show them on it once; after that the
      // pick sticks.
      return saved.r2 ? saved : { ...saved, design: "B03", r2: true };
    } catch {
      return base;
    }
  });
  const update = (patch) =>
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // Fine: prefs just won't stick.
      }
      return next;
    });
  return [prefs, update];
}

function Stars({ value, onChange, label }) {
  return (
    <div className="lab-stars" role="radiogroup" aria-label={`Rate ${label}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={n <= value ? "on" : ""}
          onClick={() => onChange(value === n ? 0 : n)}
        >
          <Star size={26} strokeWidth={2.2} fill={n <= value ? "#E0AA3E" : "none"} />
        </button>
      ))}
    </div>
  );
}

function Note({ value, onSave }) {
  const [open, setOpen] = useState(!!value);
  const [text, setText] = useState(value || "");
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = (v) => {
    setText(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(v.slice(0, 600)), 700);
  };
  if (!open) {
    return (
      <button type="button" className="lab-note-btn" onClick={() => setOpen(true)} aria-label="Add a note">
        <MessageSquare size={19} strokeWidth={2.3} />
      </button>
    );
  }
  return (
    <textarea
      className="lab-note"
      rows={2}
      maxLength={600}
      placeholder="Note (optional)"
      value={text}
      autoFocus={!value}
      onChange={(e) => change(e.target.value)}
      onBlur={() => {
        clearTimeout(timer.current);
        if (text !== (value || "")) onSave(text.slice(0, 600));
        if (!text) setOpen(false);
      }}
    />
  );
}

function Card({ code, name, blurb, tag, fresh, entry, onRate, stage, stageProps, wide, cardRef }) {
  const stars = entry?.stars || 0;
  return (
    <article ref={cardRef} className={`lab-card${stars ? " rated" : ""}${wide ? " wide" : ""}`} id={code}>
      <header className="lab-card-head">
        <span className="lab-code">{code}</span>
        <span className="lab-card-title">
          <span className="lab-card-name">
            {name}
            {fresh && <span className="lab-new">New</span>}
          </span>
          {blurb && <span className="lab-card-blurb">{blurb}</span>}
        </span>
        {tag}
      </header>
      <div className="lab-stage" {...stageProps}>
        {stage}
      </div>
      <footer className="lab-card-foot">
        <Stars value={stars} label={code} onChange={(n) => onRate(code, { stars: n })} />
        <Note value={entry?.note} onSave={(note) => onRate(code, { note })} />
      </footer>
    </article>
  );
}

// A design: the buddy big (tap to step through every mood) and a strip of key moods.
function DesignStage({ d }) {
  const [i, setI] = useState(0);
  const mood = ALL_MOODS[i];
  return (
    <>
      <button type="button" className="lab-hero" onClick={() => setI((i + 1) % ALL_MOODS.length)} aria-label={`Show next mood (now ${mood})`}>
        <span key={mood} className="lab-hero-in">
          <d.Buddy mood={mood} size={132} face={d.face} />
        </span>
        <span className="lab-mood-tag">{mood}</span>
      </button>
      <div className="lab-strip" aria-hidden="true">
        {STRIP.map((m) => (
          <span key={m}>
            <d.Buddy mood={m} size={54} face={d.face} />
          </span>
        ))}
      </div>
    </>
  );
}

function FaceStage({ D, face }) {
  return (
    <>
      <div className="lab-hero static">
        <D.Buddy mood="idle" size={132} face={face} />
      </div>
      <div className="lab-strip" aria-hidden="true">
        {["watch", "happy", "oops", "gentle"].map((m) => (
          <span key={m}>
            <D.Buddy mood={m} size={54} face={face} />
          </span>
        ))}
      </div>
    </>
  );
}

// A motion: loops play by themselves; one-shots replay while on screen, and a tap plays
// one with sound and vibration.
function MotionCard({ m, D, entry, onRate, prefs }) {
  const [run, setRun] = useState({ n: 0, tap: false });
  const runRef = useRef(run);
  runRef.current = run;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const lastTap = useRef(0);
  const el = useRef(null);

  const fx = useCallback((what) => {
    if (!runRef.current.tap) return;
    const p = prefsRef.current;
    if (typeof what === "string") return playFeedback(what, { sound: p.sound, haptics: p.haptics });
    if (what.sound) playFeedback(what.sound, { sound: p.sound, haptics: false });
    if (what.vibe && p.haptics && navigator.vibrate) {
      try {
        navigator.vibrate(what.vibe);
      } catch {
        // No recent gesture: stay quiet.
      }
    }
  }, []);

  // One-shots play as they scroll into view; with auto-replay on, they also repeat while
  // visible (pausing after a tap so they don't cut off a played run).
  const auto = prefs.auto;
  useEffect(() => {
    if (m.loop) return;
    let visible = false;
    let id = null;
    const tick = () => {
      if (visible && Date.now() - lastTap.current > 6000) setRun((r) => ({ n: r.n + 1, tap: false }));
    };
    const io = new IntersectionObserver(
      ([e]) => {
        const entering = e.isIntersecting && !visible;
        visible = e.isIntersecting;
        if (entering) tick();
      },
      { threshold: 0.6 }
    );
    io.observe(el.current);
    if (auto) id = setInterval(tick, m.every || 3800);
    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, [m.loop, m.every, auto]);

  const play = () => {
    lastTap.current = Date.now();
    setRun((r) => ({ n: r.n + 1, tap: true }));
  };

  return (
    <Card
        cardRef={el}
        code={m.code}
        name={m.name}
        blurb={m.blurb}
        fresh={m.fresh}
        entry={entry}
        onRate={onRate}
        tag={
          <span className="lab-group">
            {m.haptic && <Vibrate size={12} strokeWidth={2.6} aria-label="Has vibration" />}
            {m.group}
          </span>
        }
        stageProps={{ onClick: play, role: "button", tabIndex: 0, "aria-label": `Play ${m.name}` }}
        stage={
          <>
            <m.Stage Buddy={D.Buddy} run={run} fx={fx} accent="#E0AA3E" />
            {!m.loop && (
              <span className="lab-play" aria-hidden="true">
                <Play size={16} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </>
        }
      />
  );
}

function DesignPicker({ value, onChange, all }) {
  const rank = (d) => {
    const stars = all[d.code]?.stars || 0;
    return stars === 5 ? 0 : d.fresh ? 1 : 2 + (5 - stars);
  };
  const order = [...DESIGNS].sort((a, b) => rank(a) - rank(b));
  return (
    <div className="lab-picker" role="radiogroup" aria-label="Buddy to show faces and motions on">
      {order.map((d) => (
        <button
          key={d.code}
          type="button"
          role="radio"
          aria-checked={value === d.code}
          className={value === d.code ? "on" : ""}
          onClick={() => onChange(d.code)}
        >
          <d.Buddy mood="idle" size={40} face={d.face} />
          <span>{d.code}</span>
        </button>
      ))}
    </div>
  );
}

// This round's new items first, then a divider, then everything from earlier rounds.
const newFirst = (items) => {
  const fresh = items.filter((x) => x.fresh);
  const old = items.filter((x) => !x.fresh);
  return fresh.length && old.length ? [...fresh, { divider: true }, ...old] : [...fresh, ...old];
};

function Earlier() {
  return (
    <h3 className="lab-earlier">
      <span>Earlier</span>
    </h3>
  );
}

const summaryText = (all) => {
  const codes = [...DESIGNS.map((d) => d.code), ...FACE_CODES.map((f) => f.code), ...MOTIONS.map((m) => m.code)];
  return codes
    .filter((c) => all[c]?.stars || all[c]?.note)
    .map((c) => `${c} ${"★".repeat(all[c].stars || 0)}${all[c].note ? ` — ${all[c].note}` : ""}`)
    .join("\n");
};

export default function Lab() {
  const { all, rate, sync } = useRatings();
  const [prefs, setPref] = usePrefs();
  const [copied, setCopied] = useState(false);
  const D = designByCode(prefs.design);

  useEffect(() => {
    document.title = "Buddy Lab";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#EEF0F6");
  }, []);

  const onRate = useCallback(
    (code, patch) => {
      if ("stars" in patch && prefs.haptics && navigator.vibrate) {
        try {
          navigator.vibrate(8);
        } catch {
          // ignore
        }
      }
      rate(code, patch);
    },
    [rate, prefs.haptics]
  );

  const sections = useMemo(
    () => [
      { key: "B", title: "Buddies", sub: "Tap a buddy to see all its moods.", codes: DESIGNS.map((d) => d.code) },
      { key: "M", title: "Motions", sub: "Tap a stage to play it with sound and vibration.", codes: MOTIONS.map((m) => m.code), picker: true },
      { key: "F", title: "Faces", sub: "On the buddy picked below.", codes: FACE_CODES.map((f) => f.code), picker: true },
    ],
    []
  );
  // The progress pill counts this round's new items while there are any.
  const freshCodes = [...DESIGNS, ...MOTIONS].filter((x) => x.fresh).map((x) => x.code);
  const counted = freshCodes.length ? freshCodes : sections.flatMap((s) => s.codes);
  const total = counted.length;
  const rated = counted.filter((c) => all[c]?.stars).length;
  // "Unrated only" hides what's rated, but keeps a card visible right after rating it so
  // it doesn't vanish under the thumb.
  const [keep, setKeep] = useState(() => new Set());
  const shown = (code) => !prefs.unrated || !all[code]?.stars || keep.has(code);
  const rateKeep = (code, patch) => {
    setKeep((k) => new Set(k).add(code));
    onRate(code, patch);
  };

  const copy = async () => {
    const text = summaryText(all) || "(no ratings yet)";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copy your ratings:", text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="lab">
      <header className="lab-top">
        <div className="lab-top-row">
          <h1>Buddy Lab</h1>
          <span className="lab-progress" aria-label={`${rated} of ${total} ${freshCodes.length ? "new items " : ""}rated`}>
            <Star size={15} fill="#E0AA3E" strokeWidth={0} />
            {rated}/{total}
          </span>
          <button
            type="button"
            className={`lab-icon${prefs.auto ? " on" : ""}`}
            aria-pressed={prefs.auto}
            aria-label="Auto-replay motions"
            title="Auto-replay motions"
            onClick={() => setPref({ auto: !prefs.auto })}
          >
            <Repeat size={19} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className={`lab-icon${prefs.sound ? " on" : ""}`}
            aria-pressed={prefs.sound}
            aria-label="Sound"
            onClick={() => setPref({ sound: !prefs.sound })}
          >
            {prefs.sound ? <Volume2 size={20} strokeWidth={2.4} /> : <VolumeX size={20} strokeWidth={2.4} />}
          </button>
          <button
            type="button"
            className={`lab-icon${prefs.haptics ? " on" : ""}`}
            aria-pressed={prefs.haptics}
            aria-label="Vibration"
            onClick={() => setPref({ haptics: !prefs.haptics })}
          >
            {prefs.haptics ? <Vibrate size={20} strokeWidth={2.4} /> : <VibrateOff size={20} strokeWidth={2.4} />}
          </button>
        </div>
        <nav className="lab-nav" aria-label="Sections">
          {sections.map((s) => (
            <a key={s.key} href={`#sec-${s.key}`}>
              {s.title}
              <span>
                {s.codes.filter((c) => all[c]?.stars).length}/{s.codes.length}
              </span>
            </a>
          ))}
          <label className="lab-filter">
            <input type="checkbox" checked={prefs.unrated} onChange={(e) => setPref({ unrated: e.target.checked })} />
            Unrated
          </label>
        </nav>
      </header>

      <main className="lab-main">
        {sections.map((s) => (
          <section key={s.key} id={`sec-${s.key}`} className="lab-section">
            <div className="lab-section-head">
              <h2>{s.title}</h2>
              <p>{s.sub}</p>
            </div>
            {s.picker && <DesignPicker value={prefs.design} all={all} onChange={(code) => setPref({ design: code })} />}
            <div className="lab-grid">
              {s.key === "B" &&
                newFirst(DESIGNS.filter((d) => shown(d.code))).map((d) =>
                  d.divider ? (
                    <Earlier key="earlier" />
                  ) : (
                    <Card
                      key={d.code}
                      code={d.code}
                      name={d.name}
                      blurb={d.blurb}
                      fresh={d.fresh}
                      entry={all[d.code]}
                      onRate={rateKeep}
                      stage={<DesignStage d={d} />}
                    />
                  )
                )}
              {s.key === "F" &&
                FACE_CODES.filter((f) => shown(f.code)).map((f) => (
                  <Card
                    key={f.code}
                    code={f.code}
                    name={FACE_STYLES[f.key].name}
                    entry={all[f.code]}
                    onRate={rateKeep}
                    stage={<FaceStage D={D} face={f.key} />}
                  />
                ))}
              {s.key === "M" &&
                newFirst(MOTIONS.filter((m) => shown(m.code))).map((m) =>
                  m.divider ? <Earlier key="earlier" /> : <MotionCard key={m.code} m={m} D={D} entry={all[m.code]} onRate={rateKeep} prefs={prefs} />
                )}
            </div>
          </section>
        ))}

        <footer className="lab-end">
          <p className={`lab-sync ${sync}`}>
            {sync === "saved" ? "Ratings save to the laptop as you go." : sync === "offline" ? "Saved on this device only." : "Connecting…"}
          </p>
          <button type="button" className="lab-copy" onClick={copy}>
            {copied ? <Check size={19} strokeWidth={2.6} /> : <Copy size={19} strokeWidth={2.4} />}
            {copied ? "Copied" : "Copy my ratings"}
          </button>
          <a href="/" className="lab-back">
            <ArrowLeft size={17} strokeWidth={2.5} />
            All versions
          </a>
        </footer>
      </main>
    </div>
  );
}
