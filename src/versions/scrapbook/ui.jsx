import React, { useId, useMemo } from "react";
import { Check, X, Heart, Minus, Plus, House, ChartColumn, Settings } from "lucide-react";
import { THEME, PALETTE, modeVars } from "./theme.js";

// ---------- Paper craft ----------

// A strip of washi tape. Position it with `style` (top/left/right); the jagged ends and
// translucency come from CSS. pattern: "stripe" | "dots" | "plain".
export function Tape({ color = THEME.pattern.main, pattern = "stripe", width = 62, angle = -6, style, className = "" }) {
  return (
    <span
      className={`sb-tape sb-tape-${pattern} ${className}`}
      style={{ "--tape": color, width, "--angle": `${angle}deg`, ...style }}
      aria-hidden="true"
    />
  );
}

// A small rectangular rubber stamp: "BEST 12". Ink colour comes from `color`.
export function MiniStamp({ children, color = "#B07B17", tilt = -3, className = "", style }) {
  return (
    <span className={`sb-mini-stamp ${className}`} style={{ color, "--tilt": `${tilt}deg`, ...style }}>
      {children}
    </span>
  );
}

// A round rubber stamp with its label running around the rim and an icon in the middle.
export function RoundStamp({ label, Icon, color, size = 104, tilt = -10, className = "", style }) {
  const id = `rim${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // Repeat short labels so the rim reads as a continuous band.
  const text = label.length < 11 ? `${label} · ${label} · ` : `${label} · `;
  // Shrink long rims so the letters never crowd into each other.
  const fontSize = Math.min(12.5, 216 / (text.length * 0.8));
  return (
    <svg
      className={`sb-round-stamp ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ color, "--tilt": `${tilt}deg`, ...style }}
      role="img"
      aria-label={label}
    >
      <defs>
        <path id={id} d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" />
      </defs>
      <circle cx="50" cy="50" r="46.5" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
      <text fontSize={fontSize} fontWeight="800" letterSpacing="1.2" fill="currentColor" fontFamily="inherit">
        <textPath href={`#${id}`} textLength="216" lengthAdjust="spacing">
          {text.toUpperCase()}
        </textPath>
      </text>
      <Icon x={36} y={36} width={28} height={28} strokeWidth={2.6} color="currentColor" />
    </svg>
  );
}

// A marker highlight swiped behind a word.
export function Marker({ children, color = THEME.pattern.main, className = "" }) {
  return (
    <span className={`sb-marker ${className}`} style={{ "--mk": color }}>
      {children}
    </span>
  );
}

// A loose hand-drawn arrow, for handwritten notes.
export function DoodleArrow({ width = 34, color = "currentColor", flip = false, style }) {
  return (
    <svg
      style={{ transform: flip ? "scaleX(-1)" : undefined, flexShrink: 0, ...style }}
      width={width}
      height={width * 0.55}
      viewBox="0 0 40 22"
      aria-hidden="true"
    >
      <path d="M3 17 C 12 4, 24 4, 33 11" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M27 6 L34 11 L27 15" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DoodleStar({ size = 22, color = "#E0AA3E", className, style }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 16.4l-5.6 3.3 1.5-6.3L3 9.1l6.4-.6z"
        fill={color}
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

// ---------- Sticker illustrations ----------
// Flat shapes with a white stroke painted underneath (paint-order: stroke), which reads
// as a die-cut sticker stuck into the book; the drop-shadow lifts it off the page.

const LIFT = { filter: "drop-shadow(0 2px 3px rgba(59,63,81,0.16))", overflow: "visible" };
const OUTLINE = { stroke: "#fff", strokeWidth: 6, paintOrder: "stroke", strokeLinejoin: "round" };

export function PatternArt({ size = 96, tilt = -6 }) {
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
            fill={lit.includes(i) ? t.main : "#ECEAE4"}
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

// Hand-cut paper squares: each corner rounds a little differently. Fixed per cell, so a
// cell's shape never changes during play.
const CUTS = ["17% 21% 18% 20%", "21% 16% 20% 17%", "18% 19% 16% 22%", "20% 17% 21% 16%", "16% 20% 19% 18%"];
const cut = (i) => CUTS[(i * 7 + Math.floor(i / 3)) % CUTS.length];

const IDLE = { faceUp: false, tone: "idle", mark: null, badge: null, shake: false };

// `blank` shows an empty board, e.g. during the countdown before "Play again", while the
// engine still holds the previous run's answer.
export function Board({ g, interactive = true, blank = false }) {
  const n = g.boardSize;
  return (
    <div className="sb-board" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gap: cellGap(n) }}>
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
            className={`sb-cell t-${v.tone}${v.faceUp ? " up" : ""}${v.shake ? " shake" : ""}`}
            style={{ "--d": `${delay}ms`, borderRadius: cut(i) }}
            disabled={!interactive || !g.clickable}
            onClick={() => g.handleCellClick(i)}
            aria-label={`Row ${row + 1}, column ${col + 1}`}
          >
            <span className="sb-cell-face">
              {v.mark === "check" && <Check size={icon} strokeWidth={3.4} />}
              {v.mark === "x" && <X size={icon} strokeWidth={3.4} />}
              {v.badge && <span className="sb-badge-num">{v.badge}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// A static board drawn from catalog.previewCells. Lit cells fade in one after another
// when the level changes.
export function PreviewBoard({ mode, n, cells }) {
  const t = THEME[mode];
  return (
    <div className="sb-preview-board" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gap: cellGap(n) }} aria-hidden="true">
      {cells.map((c, i) => (
        <div
          key={`${n}-${i}`}
          className={c.role ? "lit" : ""}
          style={{
            borderRadius: cut(i),
            background: c.role === "lit" ? t.main : c.role === "next" ? t.light : "var(--slot)",
            color: c.role === "next" ? t.ink : "#fff",
            fontSize: n >= 6 ? 11 : 16,
            animationDelay: `${(i % 7) * 30}ms`,
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

// ---------- Small controls ----------

export function Hearts({ count, size = 25 }) {
  return (
    <div className="sb-hearts" role="img" aria-label={`${count} of 3 hearts left`}>
      {[0, 1, 2].map((i) => (
        <Heart
          key={i}
          size={size}
          className={i === count ? "lost" : ""}
          color={i < count ? "#fff" : "#D3D0C8"}
          fill={i < count ? "#E0778C" : "none"}
          strokeWidth={2.2}
          style={{ filter: i < count ? "drop-shadow(0 2px 2px rgba(224,119,140,0.3))" : "none" }}
        />
      ))}
    </div>
  );
}

export function Stepper({ label, value, onDec, onInc, canDec = true, canInc = true }) {
  return (
    <div className="sb-stepper" role="group" aria-label={label}>
      <button type="button" className="sb-step-btn" onClick={onDec} disabled={!canDec} aria-label={`Decrease ${label}`}>
        <Minus size={18} strokeWidth={2.8} />
      </button>
      <span className="sb-step-value">{value}</span>
      <button type="button" className="sb-step-btn" onClick={onInc} disabled={!canInc} aria-label={`Increase ${label}`}>
        <Plus size={18} strokeWidth={2.8} />
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="sb-switch" onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

// Recent scores (oldest first) as little paper strips, padded on the left with empties.
export function Bars({ values, color, count = 8 }) {
  const shown = values.slice(-count);
  const top = Math.max(1, ...shown);
  const padded = [...Array(Math.max(0, count - shown.length)).fill(0), ...shown];
  return (
    <div className="sb-bars" aria-hidden="true">
      {padded.map((v, i) => (
        <span
          key={i}
          style={{
            height: `${Math.max(10, (v / top) * 100)}%`,
            background: v ? color : "rgba(59,63,81,0.1)",
            animationDelay: `${i * 45}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Celebration ----------

// Paper confetti: snippets of tape, paper rectangles and dots drifting down.
export function Confetti({ count = 52 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${((i * 53) % 90) / 100}s`,
        dur: `${2.3 + ((i * 29) % 15) / 10}s`,
        dx: `${((i * 41) % 120) - 60}px`,
        rot: `${360 + ((i * 67) % 540)}deg`,
        c: PALETTE[i % PALETTE.length],
        kind: i % 5 === 0 ? "tape" : i % 4 === 0 ? "dot" : "rect",
      })),
    [count]
  );
  return (
    <div className="sb-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="piece" style={{ left: p.left, "--delay": p.delay, "--dur": p.dur, "--dx": p.dx, "--rot": p.rot }}>
          <span
            className={p.kind === "tape" ? "sb-confetti-tape" : undefined}
            style={{
              display: "block",
              width: p.kind === "dot" ? 10 : p.kind === "tape" ? 26 : 9,
              height: p.kind === "dot" ? 10 : p.kind === "tape" ? 11 : 14,
              borderRadius: p.kind === "dot" ? "50%" : 1,
              background: p.c,
              opacity: p.kind === "tape" ? 0.75 : 1,
            }}
          />
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
    <div className="sb-burst" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="bit"
          style={{
            "--x": b.x,
            "--y": b.y,
            width: b.dot ? 10 : 8,
            height: b.dot ? 10 : 14,
            borderRadius: b.dot ? "50%" : 1,
            background: b.c,
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
    <nav className="sb-tabs" aria-label="Main">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`sb-tab${current === key ? " on" : ""}`}
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
