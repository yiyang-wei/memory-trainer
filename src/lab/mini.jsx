import React, { useEffect, useMemo, useRef, useState } from "react";

// Small shared parts for motion stages: timelines, a mini sticker board, speech bubbles,
// sticker props (heart, star, trophy) and paper confetti. Classes start with mo-.

// Runs `steps` ([ms, fn] pairs) every time `n` changes, except the resting n = 0.
// `build` is called fresh per run, so it can read the latest props.
export function useTimeline(n, build) {
  const buildRef = useRef(build);
  buildRef.current = build;
  useEffect(() => {
    if (!n) return undefined;
    const ids = buildRef.current().map(([ms, fn]) => setTimeout(fn, ms));
    return () => ids.forEach(clearTimeout);
  }, [n]);
}

// Repeats `steps` every `period` ms for as long as the stage is mounted.
export function useLoop(period, build) {
  const buildRef = useRef(build);
  buildRef.current = build;
  useEffect(() => {
    let ids = [];
    const cycle = () => {
      ids = buildRef.current().map(([ms, fn]) => setTimeout(fn, ms));
      ids.push(setTimeout(cycle, period));
    };
    cycle();
    return () => ids.forEach(clearTimeout);
  }, [period]);
}

// State that resets to `initial` whenever a new run starts.
export function useRunState(n, initial) {
  const [state, setState] = useState(initial);
  const [seen, setSeen] = useState(n);
  if (seen !== n) {
    setSeen(n);
    setState(initial);
  }
  return [state, setState];
}

// ---------- Mini board ----------

export const TONE = {
  idle: { bg: "#E9ECF4", ring: false },
  lit: { bg: "#8CA0DB", ring: true },
  seq: { bg: "#7FBF9E", ring: true },
  ok: { bg: "#7FBF9E", ring: true },
  bad: { bg: "#E38585", ring: true },
};

// A 3×3 (or n×n) board of sticker cells. Cells never move or resize; only their colour
// and mark change. `cells[i]` is a tone key or { tone, label }.
export function MiniBoard({ cells, n = 3, cell = 30, gap = 7, className = "", style }) {
  return (
    <div
      className={`mo-board ${className}`}
      style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)`, gridAutoRows: `${cell}px`, gap, ...style }}
      aria-hidden="true"
    >
      {Array.from({ length: n * n }, (_, i) => {
        const c = typeof cells[i] === "object" && cells[i] ? cells[i] : { tone: cells[i] || "idle" };
        const t = TONE[c.tone] || TONE.idle;
        return (
          <span key={i} className={`mo-cell${t.ring ? " ring" : ""}`} style={{ background: t.bg }}>
            <span className={`mo-mark${c.tone === "ok" || c.tone === "bad" || c.label ? " on" : ""}`}>
              {c.label ? c.label : c.tone === "ok" ? <Tick /> : c.tone === "bad" ? <Cross /> : null}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 24 24" width="60%" height="60%">
      <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 24 24" width="56%" height="56%">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

// ---------- Bubble ----------

// A sticker speech bubble. `tail` is the side pointing at the buddy.
export function Bubble({ children, tail = "left", gold, className = "", style }) {
  return (
    <div className={`mo-bubble tail-${tail}${gold ? " gold" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Dots() {
  return (
    <span className="mo-dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

// ---------- Sticker props ----------

const EDGE = { stroke: "#fff", strokeWidth: 5, paintOrder: "stroke", strokeLinejoin: "round" };

export function HeartSticker({ size = 26, color = "#E0778C" }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="mo-svg" aria-hidden="true">
      <path d="M16 27 C 6 20, 3 14, 6 9 C 9 4.5, 14 5.5, 16 9.5 C 18 5.5, 23 4.5, 26 9 C 29 14, 26 20, 16 27 Z" fill={color} {...EDGE} />
    </svg>
  );
}

export function StarSticker({ size = 40, color = "#E0AA3E" }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="mo-svg" aria-hidden="true">
      <path d="M20 3.5l4.6 10.2 11.1 1.2-8.3 7.5 2.4 10.9L20 27.6l-9.8 5.7 2.4-10.9-8.3-7.5 11.1-1.2z" fill={color} {...EDGE} />
    </svg>
  );
}

export function TrophySticker({ size = 46 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className="mo-svg" aria-hidden="true">
      <g {...EDGE}>
        <path d="M14 10 C 6 10, 6 22, 16 22" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
        <path d="M34 10 C 42 10, 42 22, 32 22" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
        <path d="M13 7 h22 v8 c0 7 -5 12 -11 12 s-11 -5 -11 -12 z" fill="#E0AA3E" />
        <rect x="20.5" y="26" width="7" height="8" fill="#E0AA3E" />
        <rect x="14" y="33" width="20" height="7" rx="2.5" fill="#B07B17" />
      </g>
      <path d="M14 10 C 7.5 10, 7.5 21, 16 21" fill="none" stroke="#E0AA3E" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M34 10 C 40.5 10, 40.5 21, 32 21" fill="none" stroke="#E0AA3E" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M19 11 v6" stroke="#F2D69A" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

// ---------- Paper confetti ----------

const PAPER = ["#8CA0DB", "#7FBF9E", "#E0AA3E", "#E0778C", "#A898E0"];

// Paper bits that fall through the stage once. Remount (key) to replay.
export function Confetti({ count = 26, seed = 1 }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const k = i * 37 + seed * 11;
        return {
          left: `${(k * 7) % 100}%`,
          delay: `${(k % 9) * 45}ms`,
          dur: `${1300 + ((k * 13) % 700)}ms`,
          dx: `${((k * 17) % 60) - 30}px`,
          rot: `${200 + ((k * 29) % 360)}deg`,
          c: PAPER[i % PAPER.length],
          dot: i % 4 === 0,
        };
      }),
    [count, seed]
  );
  return (
    <div className="mo-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            left: b.left,
            width: b.dot ? 8 : 7,
            height: b.dot ? 8 : 12,
            borderRadius: b.dot ? "50%" : 2,
            background: b.c,
            animationDelay: b.delay,
            animationDuration: b.dur,
            "--dx": b.dx,
            "--rot": b.rot,
          }}
        />
      ))}
    </div>
  );
}

// A soft ground shadow under a buddy; motions animate it with the jump.
export function Shadow({ className = "", width = 70 }) {
  return <span className={`mo-shadow ${className}`} style={{ width }} aria-hidden="true" />;
}
