import React, { useMemo } from "react";
import { Check, X, Heart, Minus, Plus, Star, House, ChartColumn, Settings } from "lucide-react";
import { THEME, modeVars } from "./theme.js";

// ---------- Illustrations, built from the same solid caps as the board ----------

const capStyle = (mode, lit = true, extra = {}) => {
  const t = THEME[mode] || THEME.pattern;
  return lit ? { "--c": t.main, "--ce": t.edge, ...extra } : { "--c": "#FFFFFF", "--ce": "#D3D8E5", ...extra };
};

function Cap({ mode, lit = true, size, style, children, color }) {
  return (
    <div
      className="ck-cap"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.48,
        "--cd": `${Math.max(2, Math.round(size / 11))}px`,
        ...capStyle(mode, lit),
        ...(color ? { color } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PatternArt({ size = 96 }) {
  const c = size / 3.5;
  const lit = [0, 4, 5, 7];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: c * 0.22, width: size, paddingBottom: 3 }}>
      {Array.from({ length: 9 }, (_, i) => (
        <Cap key={i} mode="pattern" lit={lit.includes(i)} size={c} />
      ))}
    </div>
  );
}

export function SequenceArt({ size = 96 }) {
  const c = size * 0.36;
  return (
    <div style={{ position: "relative", width: size, height: size * 0.82 }}>
      {[0, 1, 2].map((i) => (
        <Cap
          key={i}
          mode="sequence"
          size={c}
          style={{ position: "absolute", left: i * c * 0.92, bottom: i * c * 0.42 + 3, transform: `rotate(${i === 1 ? 0 : i === 0 ? -6 : 6}deg)` }}
        >
          {i + 1}
        </Cap>
      ))}
    </div>
  );
}

export function ProgressiveArt({ size = 96 }) {
  const c = size * 0.2;
  const t = THEME.progressive;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: c * 0.28, height: size * 0.86, paddingBottom: 3 }}>
      {[1, 2, 3, 4].map((h) => (
        <div key={h} style={{ display: "flex", flexDirection: "column", gap: c * 0.24 }}>
          {Array.from({ length: h }, (_, j) => (
            <Cap
              key={j}
              mode="progressive"
              size={c}
              style={h === 4 && j === 0 ? { "--c": t.tint, "--ce": t.tintEdge, color: t.ink } : undefined}
            >
              {h === 4 && j === 0 ? "+" : null}
            </Cap>
          ))}
        </div>
      ))}
    </div>
  );
}

export function QueueArt({ size = 96 }) {
  const c = size * 0.38;
  const t = THEME.queue;
  return (
    <div style={{ position: "relative", width: size * 1.05, height: c + 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <Cap
          key={i}
          mode="queue"
          lit={i === 0}
          size={c}
          color={i === 0 ? "#fff" : t.ink}
          style={{ position: "absolute", left: i * c * 0.6, top: i === 0 ? 0 : 6, zIndex: 4 - i }}
        >
          {i + 1}
        </Cap>
      ))}
    </div>
  );
}

export function FreeArt({ size = 96 }) {
  const c = size * 0.36;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: c * 0.18, paddingBottom: 3 }}>
      <Cap mode="free" size={c} style={{ transform: "rotate(-8deg)" }}>
        <Star size={c * 0.5} fill="#fff" strokeWidth={0} />
      </Cap>
      <Cap mode="pattern" size={c * 0.86} style={{ borderRadius: "50%", marginBottom: c * 0.3 }} />
      <Cap mode="progressive" size={c} style={{ transform: "rotate(10deg)" }}>
        <Plus size={c * 0.5} strokeWidth={3.4} />
      </Cap>
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

const gapFor = (n) => (n >= 8 ? 5 : n >= 6 ? 6 : n >= 5 ? 8 : 10);
const depthFor = (n) => (n >= 7 ? 3 : 4);

export function Board({ g, mode }) {
  const n = g.boardSize;
  const iconSize = n >= 7 ? 16 : n >= 5 ? 20 : 26;
  return (
    <div
      className="ck-board"
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gap: gapFor(n), "--dep": `${depthFor(n)}px`, ...modeVars(mode) }}
    >
      {Array.from({ length: n * n }, (_, i) => {
        const v = g.cellVisual(i);
        const row = Math.floor(i / n);
        const col = i % n;
        const delay = g.phase === "resetting" ? Math.min((row + col) * 28, 240) : 0;
        return (
          <button
            key={`${n}-${i}`}
            type="button"
            className={`ck-cell t-${v.tone}${v.faceUp ? " up" : ""}${v.shake ? " shake" : ""}`}
            style={{ "--d": `${delay}ms` }}
            disabled={!g.clickable}
            onClick={() => g.handleCellClick(i)}
            aria-label={`Row ${row + 1}, column ${col + 1}`}
          >
            {v.mark === "check" && <Check size={iconSize} strokeWidth={3.6} />}
            {v.mark === "x" && <X size={iconSize} strokeWidth={3.6} />}
            {v.badge && <span className="ck-badge">{v.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

// A static board from catalog.previewCells.
export function PreviewBoard({ mode, n, cells }) {
  const t = THEME[mode];
  return (
    <div
      className="ck-preview-board"
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gap: gapFor(n), ...modeVars(mode) }}
      aria-hidden="true"
    >
      {cells.map((c, i) => (
        <div
          key={`${n}-${i}`}
          className="ck-cap"
          style={{
            width: "100%",
            height: "100%",
            fontSize: n >= 6 ? 11 : 16,
            "--cd": `${depthFor(n)}px`,
            ...(c.role === "lit"
              ? { "--c": t.main, "--ce": t.edge }
              : c.role === "next"
                ? { "--c": t.tintEdge, "--ce": t.main, color: t.ink }
                : { "--c": "#FFFFFF", "--ce": "#D3D8E5" }),
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

// ---------- Small controls ----------

export function Hearts({ count, size = 22, vertical = true }) {
  return (
    <div
      className="ck-hearts"
      role="img"
      aria-label={`${count} of 3 hearts left`}
      style={vertical ? undefined : { flexDirection: "row", gap: 4 }}
    >
      {[0, 1, 2].map((i) => (
        <Heart
          key={i}
          size={size}
          className={i === count ? "lost" : ""}
          color={i < count ? "#E2667F" : "#CDD2DF"}
          fill={i < count ? "#E2667F" : "#E9ECF3"}
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

export function Stepper({ label, value, onDec, onInc, canDec = true, canInc = true }) {
  return (
    <div className="ck-stepper" role="group" aria-label={label}>
      <button type="button" className="ck-key ck-step" onClick={onDec} disabled={!canDec} aria-label={`Decrease ${label}`}>
        <Minus size={20} strokeWidth={3} />
      </button>
      <span className="ck-step-value">{value}</span>
      <button type="button" className="ck-key ck-step" onClick={onInc} disabled={!canInc} aria-label={`Increase ${label}`}>
        <Plus size={20} strokeWidth={3} />
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="ck-switch" onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function Bars({ values, color, edge, count = 8 }) {
  const top = Math.max(1, ...values);
  const padded = [...Array(Math.max(0, count - values.length)).fill(0), ...values.slice(-count)];
  return (
    <div className="ck-bars" aria-hidden="true">
      {padded.map((v, i) => (
        <span
          key={i}
          style={{
            height: `${Math.max(12, (v / top) * 100)}%`,
            "--bar": v ? color : "#E3E6EF",
            boxShadow: v && edge ? `0 3px 0 ${edge}` : "none",
            animationDelay: `${i * 45}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Celebration ----------

const DOTS = [
  ["#6F86D6", 18],
  ["#5DB38A", 14],
  ["#E3A52F", 20],
  ["#E2667F", 16],
  ["#9A87DB", 12],
];

export function Confetti({ count = 46 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const [c, s] = DOTS[i % DOTS.length];
        return {
          left: `${(i * 37) % 100}%`,
          delay: `${((i * 53) % 80) / 100}s`,
          dur: `${2.1 + ((i * 29) % 14) / 10}s`,
          dx: `${((i * 41) % 140) - 70}px`,
          c,
          s,
        };
      }),
    [count]
  );
  return (
    <div className="ck-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: p.left, width: p.s, height: p.s, background: p.c, "--delay": p.delay, "--dur": p.dur, "--dx": p.dx }} />
      ))}
    </div>
  );
}

export function Burst({ seed }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + (seed % 5) * 0.3;
        const r = 100 + ((i * 29 + seed * 7) % 50);
        return { x: `${Math.cos(a) * r}px`, y: `${Math.sin(a) * r}px`, c: DOTS[(i + seed) % DOTS.length][0] };
      }),
    [seed]
  );
  return (
    <div className="ck-burst" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ background: b.c, "--x": b.x, "--y": b.y }} />
      ))}
    </div>
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
    <nav className="ck-tabs" aria-label="Main">
      <div className="ck-tabs-inner">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`ck-tab${current === key ? " on" : ""}`}
            aria-current={current === key ? "page" : undefined}
            onClick={() => onChange(key)}
          >
            <Icon size={24} strokeWidth={current === key ? 2.7 : 2.2} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
