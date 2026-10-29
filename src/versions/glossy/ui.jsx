import React, { useMemo } from "react";
import { Check, X, Heart, Minus, Plus, Star, House, ChartColumn, Settings } from "lucide-react";
import { THEME, blockVars, modeVars } from "./theme.js";

// ---------- Decoration ----------

export function Sparkle({ size = 18, style, className = "gl-spark" }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0c.6 5.6 2.9 9.8 12 12-9.1 2.2-11.4 6.4-12 12-.6-5.6-2.9-9.8-12-12C9.1 9.8 11.4 5.6 12 0z"
      />
    </svg>
  );
}

const BITS = [
  { left: "8%", top: "14%", c: "#8CA0DB", r: "20deg", d: "0s" },
  { left: "88%", top: "9%", c: "#E0AA3E", r: "-30deg", d: "1.2s" },
  { left: "93%", top: "46%", c: "#7FBF9E", r: "45deg", d: "0.6s" },
  { left: "4%", top: "62%", c: "#E0778C", r: "-15deg", d: "2s" },
  { left: "72%", top: "86%", c: "#A898E0", r: "60deg", d: "1.6s" },
];

export function Background({ quiet = false }) {
  return (
    <div className="gl-bg" aria-hidden="true">
      <div className="gl-blob" style={{ width: 280, height: 280, left: -90, top: -60, background: "#D8DFF7" }} />
      <div className="gl-blob" style={{ width: 240, height: 240, right: -80, top: 160, background: "#F6DCE3" }} />
      <div className="gl-blob" style={{ width: 300, height: 300, left: -60, bottom: -80, background: "#D7EFE3" }} />
      <div className="gl-blob" style={{ width: 220, height: 220, right: -60, bottom: 60, background: "#F8EBCB" }} />
      {!quiet &&
        BITS.map((b, i) => (
          <i
            key={i}
            className="gl-bit"
            style={{ left: b.left, top: b.top, width: 8, height: 13, background: b.c, "--r": b.r, animationDelay: b.d }}
          />
        ))}
    </div>
  );
}

// ---------- Glossy illustrations ----------

function Block({ mode, lit = true, size, style, children }) {
  return (
    <div className="gl-block" style={{ width: size, height: size, fontSize: size * 0.45, ...blockVars(mode, lit), ...style }}>
      {children}
    </div>
  );
}

const PATTERN_LIT = [1, 4, 6, 9, 11, 14];

export function PatternArt({ size = 120 }) {
  const cell = size / 4.6;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: cell * 0.18,
          transform: "perspective(420px) rotateX(32deg) rotateZ(-16deg)",
        }}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <Block key={i} mode="pattern" lit={PATTERN_LIT.includes(i)} size={cell} />
        ))}
      </div>
      <Sparkle size={size * 0.2} style={{ position: "absolute", right: -4, top: -6 }} />
      <Sparkle size={size * 0.13} style={{ position: "absolute", left: -2, bottom: 4, animationDelay: "1s" }} />
    </div>
  );
}

export function SequenceArt({ size = 96 }) {
  const b = size * 0.38;
  return (
    <div style={{ position: "relative", width: size * 1.25, height: size * 0.85 }}>
      {[0, 1, 2].map((i) => (
        <Block
          key={i}
          mode="sequence"
          size={b}
          style={{ position: "absolute", left: i * b * 0.98, bottom: i * b * 0.32, transform: `rotate(${-8 + i * 6}deg)` }}
        >
          {i + 1}
        </Block>
      ))}
    </div>
  );
}

export function ProgressiveArt({ size = 96 }) {
  const w = size * 0.24;
  return (
    <div style={{ position: "relative", width: size * 1.2, height: size * 0.85, display: "flex", alignItems: "flex-end", gap: w * 0.22 }}>
      {[1, 2, 3, 4].map((h) => (
        <div key={h} style={{ display: "flex", flexDirection: "column", gap: w * 0.14 }}>
          {Array.from({ length: h }, (_, j) => (
            <Block key={j} mode="progressive" size={w} lit={j === 0 || h > 1} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function QueueArt({ size = 96 }) {
  const b = size * 0.42;
  return (
    <div style={{ position: "relative", width: size * 1.25, height: size * 0.8 }}>
      {[0, 1, 2, 3].map((i) => (
        <Block
          key={i}
          mode="queue"
          size={b}
          lit={i === 0}
          style={{
            position: "absolute",
            left: i * b * 0.62,
            bottom: 0,
            transform: `rotate(${-12 + i * 8}deg)`,
            color: i === 0 ? "#fff" : THEME.queue.ink,
            zIndex: 4 - i,
          }}
        >
          {i + 1}
        </Block>
      ))}
    </div>
  );
}

export function FreeArt({ size = 96 }) {
  const b = size * 0.44;
  return (
    <div style={{ position: "relative", width: size * 1.2, height: size * 0.82 }}>
      <Block mode="free" size={b} style={{ position: "absolute", left: 0, bottom: 0, transform: "rotate(-10deg)" }}>
        <Star size={b * 0.5} fill="#fff" strokeWidth={0} />
      </Block>
      <div
        className="gl-block"
        style={{ position: "absolute", left: b * 0.95, bottom: b * 0.55, width: b * 0.85, height: b * 0.85, borderRadius: "50%", ...blockVars("pattern") }}
      />
      <Block mode="progressive" size={b * 0.85} style={{ position: "absolute", left: b * 1.55, bottom: 0, transform: "rotate(14deg)" }} />
      <Sparkle size={b * 0.4} style={{ position: "absolute", right: -6, top: -4, color: "#A898E0" }} />
    </div>
  );
}

export const ART = {
  pattern: PatternArt,
  sequence: SequenceArt,
  progressive: ProgressiveArt,
  queue: QueueArt,
  free: FreeArt,
};

// ---------- Board ----------

const cellGap = (n) => (n >= 8 ? 5 : n >= 6 ? 6 : n >= 5 ? 8 : 10);

export function Board({ g, mode }) {
  const n = g.boardSize;
  return (
    <div className="gl-board" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gap: cellGap(n), ...modeVars(mode) }}>
      {Array.from({ length: n * n }, (_, i) => {
        const v = g.cellVisual(i);
        const row = Math.floor(i / n);
        const col = i % n;
        const delay = g.phase === "resetting" ? Math.min((row + col) * 28, 240) : 0;
        return (
          <button
            key={`${n}-${i}`}
            type="button"
            className={`gl-cell t-${v.tone}${v.faceUp ? " up" : ""}${v.shake ? " shake" : ""}`}
            style={{ "--d": `${delay}ms` }}
            disabled={!g.clickable}
            onClick={() => g.handleCellClick(i)}
            aria-label={`Row ${row + 1}, column ${col + 1}`}
          >
            <span className="gl-cell-face">
              {v.mark === "check" && <Check size={n >= 7 ? 16 : 22} strokeWidth={3.4} />}
              {v.mark === "x" && <X size={n >= 7 ? 16 : 22} strokeWidth={3.4} />}
              {v.badge && <span className="gl-badge">{v.badge}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// A static board for previews: cells from catalog.previewCells.
export function PreviewBoard({ mode, n, cells, width }) {
  const t = THEME[mode];
  return (
    <div
      className="gl-preview-board"
      style={{ width, gridTemplateColumns: `repeat(${n}, 1fr)`, gap: cellGap(n), ...modeVars(mode) }}
      aria-hidden="true"
    >
      {cells.map((c, i) => (
        <div
          key={`${n}-${i}`}
          className="gl-block"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "24%",
            fontSize: n >= 6 ? 11 : 15,
            ...(c.role === "lit"
              ? blockVars(mode)
              : c.role === "next"
                ? { "--hi": t.soft, "--c": t.hi, "--lo": t.hi, "--edge": t.main }
                : blockVars(mode, false)),
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

// ---------- Small controls ----------

export function Hearts({ count, size = 24 }) {
  return (
    <div className="gl-hearts" role="img" aria-label={`${count} of 3 hearts left`}>
      {[0, 1, 2].map((i) => (
        <Heart
          key={i}
          size={size}
          className={i === count ? "lost" : ""}
          color={i < count ? "#E0778C" : "#CDD2DF"}
          fill={i < count ? "#E0778C" : "none"}
          strokeWidth={i < count ? 0 : 2.2}
        />
      ))}
    </div>
  );
}

export function Stepper({ label, value, onDec, onInc, canDec = true, canInc = true }) {
  return (
    <div className="gl-stepper" role="group" aria-label={label}>
      <button type="button" className="gl-step-btn" onClick={onDec} disabled={!canDec} aria-label={`Decrease ${label}`}>
        <Minus size={18} strokeWidth={2.6} />
      </button>
      <span className="gl-step-value">{value}</span>
      <button type="button" className="gl-step-btn" onClick={onInc} disabled={!canInc} aria-label={`Increase ${label}`}>
        <Plus size={18} strokeWidth={2.6} />
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="gl-switch" onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function MiniBars({ values, color, max, count = 8 }) {
  const top = Math.max(1, max ?? Math.max(...values, 1));
  const padded = [...Array(Math.max(0, count - values.length)).fill(0), ...values.slice(-count)];
  return (
    <div className="gl-bars" aria-hidden="true">
      {padded.map((v, i) => (
        <span
          key={i}
          style={{
            height: `${Math.max(10, (v / top) * 100)}%`,
            "--bar": v ? color : "rgba(59,63,81,0.1)",
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Celebration ----------

const CONFETTI_COLORS = ["#8CA0DB", "#7FBF9E", "#E0AA3E", "#E0778C", "#A898E0", "#F5C84B"];

export function Confetti({ count = 60 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${((i * 53) % 90) / 100}s`,
        dur: `${2 + ((i * 29) % 15) / 10}s`,
        dx: `${((i * 41) % 120) - 60}px`,
        rot: `${360 + ((i * 67) % 540)}deg`,
        c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 4 === 0,
      })),
    [count]
  );
  return (
    <div className="gl-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: p.left,
            background: p.c,
            borderRadius: p.round ? "50%" : 3,
            width: p.round ? 9 : 8,
            height: p.round ? 9 : 14,
            "--delay": p.delay,
            "--dur": p.dur,
            "--dx": p.dx,
            "--rot": p.rot,
          }}
        />
      ))}
    </div>
  );
}

// A small radial pop of bits, e.g. when a round is cleared.
export function Burst({ seed }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + (seed % 7) * 0.2;
        const r = 90 + ((i * 31 + seed) % 60);
        return { x: `${Math.cos(a) * r}px`, y: `${Math.sin(a) * r}px`, c: CONFETTI_COLORS[(i + seed) % CONFETTI_COLORS.length] };
      }),
    [seed]
  );
  return (
    <div className="gl-burst" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ background: b.c, "--x": b.x, "--y": b.y }} />
      ))}
    </div>
  );
}

export function Trophy({ size = 150, silver = false }) {
  const [a, b, c] = silver ? ["#F1F3F8", "#C9CEDC", "#9AA1B5"] : ["#FFE08A", "#F2B940", "#C98A1A"];
  return (
    <svg className="gl-trophy" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={`cup-${silver}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <linearGradient id={`base-${silver}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <path d="M30 22 C10 22 10 52 34 56" fill="none" stroke={`url(#cup-${silver})`} strokeWidth="9" strokeLinecap="round" />
      <path d="M90 22 C110 22 110 52 86 56" fill="none" stroke={`url(#cup-${silver})`} strokeWidth="9" strokeLinecap="round" />
      <path d="M28 14 H92 V40 C92 62 78 74 60 74 C42 74 28 62 28 40 Z" fill={`url(#cup-${silver})`} />
      <path d="M38 20 H50 V44 C50 54 44 60 40 62 C36 58 34 52 34 44 Z" fill="#fff" opacity="0.35" />
      <rect x="52" y="72" width="16" height="16" rx="3" fill={`url(#base-${silver})`} />
      <rect x="36" y="86" width="48" height="16" rx="7" fill={`url(#base-${silver})`} />
      <rect x="30" y="98" width="60" height="10" rx="5" fill={c} />
      <path
        d="M60 28 l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L60 51.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z"
        fill="#fff"
        opacity="0.95"
      />
    </svg>
  );
}

// ---------- Tab bar ----------

const TABS = [
  { key: "home", label: "Home", Icon: House },
  { key: "records", label: "Records", Icon: ChartColumn },
  { key: "settings", label: "Settings", Icon: Settings },
];

export function TabBar({ current, onChange }) {
  return (
    <nav className="gl-tabs" aria-label="Main">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`gl-tab${current === key ? " on" : ""}`}
          aria-current={current === key ? "page" : undefined}
          onClick={() => onChange(key)}
        >
          <Icon size={22} strokeWidth={current === key ? 2.6 : 2.1} />
          {label}
        </button>
      ))}
    </nav>
  );
}
