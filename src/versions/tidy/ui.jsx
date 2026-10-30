import React, { useMemo } from "react";
import { Check, X, Heart, Minus, Plus, House, ChartColumn, Settings } from "lucide-react";
import { THEME, PALETTE, modeVars } from "./theme.js";

// ---------- Doodles (hand-drawn accents) ----------

// A wobbly underline. Width in px; the wave repeats every 16px.
export function Squiggle({ width = 120, color = "currentColor", stroke = 4, className = "td-squiggle" }) {
  const steps = Math.max(2, Math.round((width - 4) / 16));
  let d = "M2 7";
  for (let i = 0; i < steps; i++) d += ` q 4 -6 8 0 t 8 0`;
  return (
    <svg className={className} width={width} height={12} viewBox={`0 0 ${width} 12`} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- Sticker illustrations ----------
// Flat shapes with a white stroke painted underneath (paint-order: stroke), which reads
// as a die-cut sticker edge; the drop-shadow lifts the whole sticker off the page.

const LIFT = { filter: "drop-shadow(0 3px 4px rgba(59,63,81,0.18))", overflow: "visible" };
const OUTLINE = { stroke: "#fff", strokeWidth: 6, paintOrder: "stroke", strokeLinejoin: "round" };

export function PatternArt({ size = 96, tilt = -4 }) {
  const t = THEME.pattern;
  const lit = [1, 4, 6, 9, 11, 14];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={LIFT} aria-hidden="true">
      <g transform={`rotate(${tilt} 50 50)`}>
        <rect x="8" y="8" width="84" height="84" rx="18" fill="#fff" {...OUTLINE} />
        {Array.from({ length: 16 }, (_, i) => (
          <rect
            key={i}
            x={15 + (i % 4) * 18}
            y={15 + Math.floor(i / 4) * 18}
            width="15"
            height="15"
            rx="4.5"
            fill={lit.includes(i) ? t.main : "#E9ECF4"}
          />
        ))}
      </g>
    </svg>
  );
}

export function SequenceArt({ size = 96 }) {
  const t = THEME.sequence;
  const spots = [
    [10, 56],
    [38, 36],
    [66, 14],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={LIFT} aria-hidden="true">
      <path d="M22 70 C 34 64, 34 52, 50 50 S 66 36, 78 28" fill="none" stroke={t.ink} strokeWidth="3" strokeDasharray="5 6" strokeLinecap="round" />
      {spots.map(([x, y], i) => (
        <g key={i} transform={`rotate(${-8 + i * 7} ${x + 13} ${y + 13})`}>
          <rect x={x} y={y} width="28" height="28" rx="9" fill={t.main} {...OUTLINE} />
          <text x={x + 14} y={y + 20} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff" fontFamily="inherit">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ProgressiveArt({ size = 96 }) {
  const t = THEME.progressive;
  const bars = [18, 34, 50, 66];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={LIFT} aria-hidden="true">
      <g transform="rotate(-4 50 60)">
        {bars.map((h, i) => (
          <rect key={i} x={10 + i * 21} y={90 - h} width="17" height={h} rx="5" fill={i === 3 ? t.light : t.main} {...OUTLINE} />
        ))}
      </g>
      <path d="M10 40 C 30 22, 52 16, 80 10" fill="none" stroke={t.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M73 5 L81 10 L75 17" fill="none" stroke={t.ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QueueArt({ size = 96 }) {
  const t = THEME.queue;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={LIFT} aria-hidden="true">
      {[3, 2, 1, 0].map((i) => {
        const x = 12 + i * 15;
        const front = i === 0;
        return (
          <g key={i} transform={`rotate(${-14 + i * 9} ${x + 17} 62)`}>
            <rect x={x} y="34" width="34" height="46" rx="9" fill={front ? t.main : i === 1 ? t.light : t.tint} {...OUTLINE} />
            <text x={x + 17} y="63" textAnchor="middle" fontSize="18" fontWeight="800" fill={front ? "#fff" : t.ink} fontFamily="inherit">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function FreeArt({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={LIFT} aria-hidden="true">
      <circle cx="68" cy="34" r="20" fill="#8CA0DB" {...OUTLINE} />
      <path d="M18 86 L40 46 L62 86 Z" fill="#E0778C" {...OUTLINE} />
      <path
        d="M30 12l5.2 10.6 11.7 1.7-8.5 8.2 2 11.6L30 38.6l-10.4 5.5 2-11.6-8.5-8.2 11.7-1.7z"
        fill="#E0AA3E"
        {...OUTLINE}
        transform="rotate(-10 30 28)"
      />
      <rect x="64" y="62" width="26" height="26" rx="7" fill="#7FBF9E" transform="rotate(12 77 75)" {...OUTLINE} />
    </svg>
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

const IDLE = { faceUp: false, tone: "idle", mark: null, badge: null, shake: false };

// `blank` shows an empty board, e.g. during the countdown before "Play again", while the
// engine still holds the previous run's answer.
export function Board({ g, interactive = true, blank = false }) {
  const n = g.boardSize;
  return (
    <div className="td-board" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gap: cellGap(n) }}>
      {Array.from({ length: n * n }, (_, i) => {
        const v = blank ? IDLE : g.cellVisual(i);
        const row = Math.floor(i / n);
        const col = i % n;
        const delay = g.phase === "resetting" ? Math.min((row + col) * 28, 240) : 0;
        const icon = n >= 7 ? 15 : n >= 5 ? 20 : 24;
        return (
          <button
            key={`${n}-${i}`}
            type="button"
            className={`td-cell t-${v.tone}${v.faceUp ? " up" : ""}${v.shake ? " shake" : ""}`}
            style={{ "--d": `${delay}ms` }}
            disabled={!interactive || !g.clickable}
            onClick={() => g.handleCellClick(i)}
            aria-label={`Row ${row + 1}, column ${col + 1}`}
          >
            <span className="td-cell-face">
              {v.mark === "check" && <Check size={icon} strokeWidth={3.4} />}
              {v.mark === "x" && <X size={icon} strokeWidth={3.4} />}
              {v.badge && <span className="td-badge-num">{v.badge}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// A static board drawn from catalog.previewCells.
export function PreviewBoard({ mode, n, cells }) {
  const t = THEME[mode];
  return (
    <div
      className="td-preview-board"
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gap: cellGap(n) }}
      aria-hidden="true"
    >
      {cells.map((c, i) => (
        <div
          key={`${n}-${i}`}
          style={{
            borderRadius: "26%",
            background: c.role === "lit" ? t.main : c.role === "next" ? t.light : "#E9ECF4",
            boxShadow: c.role ? "inset 0 0 0 3px rgba(255,255,255,0.85)" : "none",
            color: c.role === "next" ? t.ink : "#fff",
            fontSize: n >= 6 ? 11 : 16,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // A crossfade only: cells never change shape, even in previews.
            animation: c.role ? `td-fade 260ms ease ${(i % 7) * 22}ms both` : "none",
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

// ---------- Album ----------

// Small fixed tilts, so a page of stickers looks hand-placed without ever reshuffling.
export const SLOT_TILTS = [-4, 3, -2.5, 4.5];

// One album slot: a dashed outline with the level's name until a record is held, then a
// die-cut sticker in the mode colour with the number on it. `fresh` slaps it into place.
export function AlbumSlot({ label, value, name, noun, tilt = 0, delay = 0, fresh = false, big = false }) {
  const cls = `td-slot${big ? " big" : ""}`;
  if (!value) {
    return (
      <div className={`${cls} empty`} role="img" aria-label={`${name || label}: no record yet`}>
        <span className="td-slot-label">{label}</span>
      </div>
    );
  }
  return (
    <div
      className={`${cls} filled${fresh ? " fresh" : ""}`}
      role="img"
      aria-label={`${name || label}: ${value}${noun ? " " + noun : ""}`}
      style={{ "--tilt": `${tilt}deg`, "--delay": `${delay}ms` }}
    >
      <span className="td-slot-num">{value}</span>
      <span className="td-slot-label">{label}</span>
    </div>
  );
}

// ---------- Small controls ----------

export function Hearts({ count, size = 25 }) {
  return (
    <div className="td-hearts" role="img" aria-label={`${count} of 3 hearts left`}>
      {[0, 1, 2].map((i) => (
        <Heart
          key={i}
          size={size}
          className={i === count ? "lost" : ""}
          color={i < count ? "#fff" : "#CDD2DF"}
          fill={i < count ? "#E0778C" : "none"}
          strokeWidth={i < count ? 2.2 : 2.2}
          style={{ filter: i < count ? "drop-shadow(0 2px 3px rgba(224,119,140,0.35))" : "none" }}
        />
      ))}
    </div>
  );
}

export function Stepper({ label, value, onDec, onInc, canDec = true, canInc = true }) {
  return (
    <div className="td-stepper" role="group" aria-label={label}>
      <button type="button" className="td-step-btn" onClick={onDec} disabled={!canDec} aria-label={`Decrease ${label}`}>
        <Minus size={18} strokeWidth={2.8} />
      </button>
      <span className="td-step-value">{value}</span>
      <button type="button" className="td-step-btn" onClick={onInc} disabled={!canInc} aria-label={`Increase ${label}`}>
        <Plus size={18} strokeWidth={2.8} />
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="td-switch" onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

// Little bar doodle of recent scores (oldest first), padded on the left with empties.
export function Bars({ values, color, count = 8 }) {
  const shown = values.slice(-count);
  const top = Math.max(1, ...shown);
  const padded = [...Array(Math.max(0, count - shown.length)).fill(0), ...shown];
  return (
    <div className="td-bars" aria-hidden="true">
      {padded.map((v, i) => (
        <span
          key={i}
          style={{
            height: `${Math.max(10, (v / top) * 100)}%`,
            background: v ? color : "rgba(59,63,81,0.1)",
            boxShadow: v ? "0 0 0 2px #fff" : "none",
            animationDelay: `${i * 45}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Celebration ----------

function Wiggle({ color }) {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true">
      <path d="M2 6 q 3 -5 6 0 t 6 0 t 6 0" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Paper confetti: rectangles, dots and little squiggles drifting down.
export function Confetti({ count = 56 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${((i * 53) % 90) / 100}s`,
        dur: `${2.2 + ((i * 29) % 15) / 10}s`,
        dx: `${((i * 41) % 120) - 60}px`,
        rot: `${360 + ((i * 67) % 540)}deg`,
        c: PALETTE[i % PALETTE.length],
        kind: i % 5 === 0 ? "wiggle" : i % 4 === 0 ? "dot" : "rect",
      })),
    [count]
  );
  return (
    <div className="td-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="piece" style={{ left: p.left, "--delay": p.delay, "--dur": p.dur, "--dx": p.dx, "--rot": p.rot }}>
          {p.kind === "wiggle" ? (
            <Wiggle color={p.c} />
          ) : (
            <span
              style={{
                display: "block",
                width: p.kind === "dot" ? 10 : 9,
                height: p.kind === "dot" ? 10 : 15,
                borderRadius: p.kind === "dot" ? "50%" : 2,
                background: p.c,
                boxShadow: "0 0 0 2px #fff",
              }}
            />
          )}
        </span>
      ))}
    </div>
  );
}

// A small radial pop of paper bits around the board when a round is cleared.
export function Burst({ seed }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + (seed % 5) * 0.25;
        const r = 120 + ((i * 31 + seed) % 50);
        return { x: `${Math.cos(a) * r}px`, y: `${Math.sin(a) * r}px`, c: PALETTE[(i + seed) % PALETTE.length], dot: i % 3 === 0 };
      }),
    [seed]
  );
  return (
    <div className="td-burst" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="bit"
          style={{
            "--x": b.x,
            "--y": b.y,
            width: b.dot ? 10 : 8,
            height: b.dot ? 10 : 14,
            borderRadius: b.dot ? "50%" : 2,
            background: b.c,
            boxShadow: "0 0 0 2px #fff",
          }}
        />
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
    <nav className="td-tabs" aria-label="Main">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`td-tab${current === key ? " on" : ""}`}
          aria-current={current === key ? "page" : undefined}
          onClick={() => onChange(key)}
        >
          <Icon size={23} strokeWidth={current === key ? 2.6 : 2.1} />
          {label}
        </button>
      ))}
    </nav>
  );
}

export { modeVars };
