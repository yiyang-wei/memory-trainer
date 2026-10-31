import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useJump } from "../../engine/jump.js";

// The buddy: a little ghost sticker. The player picks its shape (Puff or Sheet, see
// Settings); it wears a nightcap at night and earns a halo on a run of perfect rounds.
// Each mood swaps the face and the arms:
//   idle   — blinks now and then          watch — eyes on the board
//   think  — your turn                    happy — closed-eye grin
//   cheer  — arms up, sparkles            oops  — worried brows, sweat drop
//   gentle — soft eyes and a wave, for "next time"
//
// It's rigged like the lab's buddies (lb-all, lb-body, lb-top, lb-arm-l/r, lb-tail,
// lb-face), so the shared jump engine in src/engine/jump.js can play on it.

const INK = "#3B3F51";
const CHEEK = "#F0A9B8";
const TONGUE = "#E0778C";
const EDGE = { stroke: "#fff", strokeWidth: 8, paintOrder: "stroke", strokeLinejoin: "round" };

// A hem band from `top` (tucked inside the body) down to `y`, ending in n round scallops.
const hem = (x0, x1, top, y, n, depth) => {
  const w = (x1 - x0) / n;
  const bumps = Array.from({ length: n }, () => `a${w / 2} ${depth} 0 0 1 ${-w} 0`).join(" ");
  return `M${x0} ${top} H${x1} V${y} ${bumps} Z`;
};

// Shapes. Each gives its body and hem, where the face and shoulders sit, how Dozy's
// nightcap is fitted onto its head, and where the halo floats (higher over the cap).
export const SHAPES = {
  puff: {
    name: "Puff",
    body: "#DCD5F7",
    deep: "#B4A7EB",
    d: "M28 66 C 28 44, 42 30, 60 30 C 78 30, 92 44, 92 66 L 92 88 L 28 88 Z",
    tail: hem(28, 92, 78, 95, 3, 7),
    face: [60, 61],
    width: 10,
    shoulders: ["31px 71px", "89px 71px"],
    arms: {
      down: ["M30 74 L24 82", "M90 74 L96 82"],
      out: ["M30 70 L19 67", "M90 70 L101 67"],
      up: ["M31 64 L24 52", "M89 64 L96 52"],
      wave: "M90 66 L100 55",
      chin: "M89 79 L80 83",
    },
    box: [28, 30, 92, 102],
    cap: "translate(60 30) scale(1.06) translate(-60 -35)",
    halo: { cy: 16, rx: 15, capCy: 3 },
  },
  sheet: {
    name: "Sheet",
    body: "#E1E6F8",
    deep: "#B1BDEA",
    d: "M37 60 C 37 41, 47 30, 60 30 C 73 30, 83 41, 83 60 C 83 72, 86 80, 89 88 L 31 88 C 34 80, 37 72, 37 60 Z",
    tail: "M36 78 H84 L89 88 L92 96 Q 85 105, 76 98 Q 68 103, 61 98.5 Q 52 105, 44 98 Q 36 103, 28 96 L31 88 Z",
    folds: ["M46 90 q -1 4 -2.5 7", "M75 90 q 1 4 2 7"],
    face: [60, 59],
    width: 9,
    shoulders: ["39px 67px", "81px 67px"],
    arms: {
      down: ["M38 70 L31 79", "M82 70 L89 79"],
      out: ["M38 66 L27 63", "M82 66 L93 63"],
      up: ["M39 60 L32 48", "M81 60 L88 48"],
      wave: "M82 62 L92 51",
      chin: "M81 76 L72 80",
    },
    box: [31, 30, 89, 104],
    cap: "translate(60 30) scale(0.84) translate(-60 -35)",
    halo: { cy: 16, rx: 13, capCy: 6 },
  },
};

export const SHAPE_KEYS = Object.keys(SHAPES);

const MOODS = {
  idle: { eyes: "open", mouth: "smile", arms: "down", blink: true },
  watch: { eyes: "open", mouth: "o", arms: "down", look: [0, -2.4] },
  think: { eyes: "open", mouth: "flat", arms: "chin", look: [2, -1.6], brow: "raise" },
  happy: { eyes: "arcs", mouth: "open", arms: "out" },
  cheer: { eyes: "arcs", mouth: "big", arms: "up", extra: "sparkles" },
  oops: { eyes: "open", mouth: "wobble", arms: "down", brow: "worried", extra: "sweat" },
  gentle: { eyes: "rest", mouth: "smile", arms: "wave" },
};

// ---------- Shape and night, shared by every buddy on screen ----------

const isNight = () => {
  const h = new Date().getHours();
  return h >= 21 || h < 6;
};

// `?night=1` or `?night=0` in the address forces the nightcap on or off, for a look in
// daylight.
const forcedNight = () => {
  try {
    const v = new URLSearchParams(window.location.search).get("night");
    return v === "1" ? true : v === "0" ? false : null;
  } catch {
    return null;
  }
};

const Look = createContext({ shape: "puff", night: false });

export function BuddyLook({ shape, children }) {
  const [night, setNight] = useState(() => forcedNight() ?? isNight());
  useEffect(() => {
    if (forcedNight() != null) return undefined;
    const id = setInterval(() => setNight(isNight()), 60000);
    return () => clearInterval(id);
  }, []);
  return <Look.Provider value={{ shape: SHAPES[shape] ? shape : "puff", night }}>{children}</Look.Provider>;
}

// ---------- Drawing ----------

function Limb({ d, color, width }) {
  return (
    <>
      <path d={d} fill="none" stroke="#fff" strokeWidth={width + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

const poseFor = (table, key) => (key === "wave" || key === "chin" ? [table.down[0], table[key]] : table[key] || table.down);

// The face, drawn around (x, y): the point midway between the eyes.
function Face({ mood, x, y, look }) {
  const m = MOODS[mood] || MOODS.idle;
  const [dx, dy] = look || m.look || [0, 0];
  const shut = (cx) => (m.eyes === "arcs" ? `M${cx - 5} 2 q5 -7 10 0` : `M${cx - 5} -1 q5 5 10 0`);
  return (
    <g className="lb-face" transform={`translate(${x} ${y})`}>
      <g fill={CHEEK}>
        <ellipse cx="-19" cy="9" rx="4.6" ry="3" />
        <ellipse cx="19" cy="9" rx="4.6" ry="3" />
      </g>
      {m.brow === "worried" && (
        <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          <path d="M-16 -8.5 L-7 -11.5" />
          <path d="M7 -11.5 L16 -8.5" />
        </g>
      )}
      {m.brow === "raise" && <path d="M6 -11 q5 -3.5 10 -0.5" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />}
      {m.eyes === "open" ? (
        <g className={m.blink ? "bd-blink" : undefined} fill={INK}>
          <ellipse cx={-10 + dx} cy={dy} rx="4.3" ry="4.8" />
          <ellipse cx={10 + dx} cy={dy} rx="4.3" ry="4.8" />
        </g>
      ) : (
        <g fill="none" stroke={INK} strokeWidth="3.3" strokeLinecap="round">
          <path d={shut(-10)} />
          <path d={shut(10)} />
        </g>
      )}
      <g transform="translate(0 12)">
        <Mouth kind={m.mouth} />
      </g>
    </g>
  );
}

function Mouth({ kind }) {
  switch (kind) {
    case "o":
      return <ellipse cx="0" cy="0" rx="2.8" ry="3.2" fill={INK} />;
    case "flat":
      return <path d="M-5 0 q5 -1.6 10 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />;
    case "open":
      return (
        <g>
          <path d="M-8 -4 q8 11 16 0 z" fill={INK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <ellipse cx="0" cy="1.4" rx="3.6" ry="1.8" fill={TONGUE} />
        </g>
      );
    case "big":
      return (
        <g>
          <path d="M-10 -5 q10 15 20 0 z" fill={INK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <ellipse cx="0" cy="2.5" rx="4.6" ry="2.3" fill={TONGUE} />
        </g>
      );
    case "wobble":
      return <path d="M-8 1 q2 -3 4 0 t4 0 t4 0 t4 0" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return <path d="M-6 -2 q6 5.5 12 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />;
  }
}

const SPARK = "M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z";
const STICK = { stroke: "#fff", paintOrder: "stroke", strokeLinejoin: "round" };

// Sweat or sparkles around a body whose bounds are [x0, y0, x1, y1].
function Extras({ mood, box }) {
  const { extra } = MOODS[mood] || MOODS.idle;
  const [x0, y0, x1, y1] = box;
  if (extra === "sweat") {
    const x = x1 + 3;
    const y = y0 + 4;
    return (
      <path
        className="bd-sweat"
        d={`M${x} ${y} C ${x + 4} ${y + 6}, ${x + 5} ${y + 10}, ${x} ${y + 12} C ${x - 5} ${y + 10}, ${x - 4} ${y + 6}, ${x} ${y} Z`}
        fill="#BCD0F2"
        strokeWidth="3"
        {...STICK}
      />
    );
  }
  if (extra === "sparkles") {
    return (
      <g className="bd-sparkles" strokeWidth="2.6" {...STICK}>
        <path d={SPARK} transform={`translate(${x0 - 8} ${y0 + 2}) scale(1.1)`} fill="#E0AA3E" />
        <path d={SPARK} transform={`translate(${x1 + 8} ${y0 - 2}) scale(0.9)`} fill="#E0778C" />
        <path d={SPARK} transform={`translate(${x1 + 11} ${(y0 + y1) / 2 + 8}) scale(0.75)`} fill="#7FBF9E" />
      </g>
    );
  }
  return null;
}

// Puff's curl: a little wisp of a ghost on top of its head.
function Curl({ color }) {
  const d = "M60 33 q -3 -8 4 -9.5 q 4.5 -0.5 2.5 4";
  return (
    <>
      <path d={d} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
    </>
  );
}

// Sheet's bow, in the exercise's colour.
function Bow({ color }) {
  const wings = (
    <>
      <path d="M0 0 C -4 -7, -11 -6, -10 0 C -9 5, -4 4, 0 0 Z" />
      <path d="M0 0 C 4 -7, 11 -6, 10 0 C 9 5, 4 4, 0 0 Z" />
    </>
  );
  return (
    <g transform="translate(72 33) rotate(18) scale(1.25)">
      <g fill="#fff" stroke="#fff" strokeWidth="6" strokeLinejoin="round">
        {wings}
      </g>
      <g fill={color}>
        {wings}
        <circle r="3.3" />
      </g>
      <circle r="3.3" fill="rgba(59, 63, 81, 0.16)" />
    </g>
  );
}

// Dozy's nightcap (lab B17), drawn for a head whose top is at y = 35 and fitted per shape.
function Nightcap({ fit, pompom }) {
  return (
    <g transform={fit}>
      <path
        d="M41 42 C 40 28, 50 18, 62 18 C 74 18, 85 25, 92 36 C 94 40, 96 44, 96 48 C 92 44, 86 41, 80 42 Q 60 32, 41 42 Z"
        fill="#B6A8EA"
        {...EDGE}
      />
      <Limb d="M41 43 Q 60 33, 80 43" color="#EEEAFB" width={8} />
      <circle cx="97" cy="51" r="6" fill={pompom} {...EDGE} />
    </g>
  );
}

function Halo({ cy, rx, falling }) {
  return (
    <g className={`bd-halo${falling ? " falling" : ""}`}>
      <ellipse cx="60" cy={cy} rx={rx} ry={rx * 0.31} fill="none" stroke="#fff" strokeWidth="11" />
      <ellipse cx="60" cy={cy} rx={rx} ry={rx * 0.31} fill="none" stroke="#E0AA3E" strokeWidth="3.8" />
    </g>
  );
}

// The ghost. `halo` is false, true, or "falling" (knocked off by a miss). `shape` and
// `night` default to the player's pick and the clock.
export default function Buddy({ mood = "idle", size, look, accent, arms, halo = false, shape, night, label, className = "", style }) {
  const look0 = useContext(Look);
  const S = SHAPES[shape || look0.shape] || SHAPES.puff;
  const capped = night ?? look0.night;
  const m = MOODS[mood] || MOODS.idle;
  const pose = arms === "none" ? null : poseFor(S.arms, arms || m.arms);
  const dims = size ? { width: size, height: (size * 100) / 112 } : {};
  // Puff's curl tucks behind its head; a bow, a cap or a halo sits in front.
  const curl = S === SHAPES.puff && !capped;
  const top = (
    <g className="lb-top" style={{ transformOrigin: curl ? "60px 32px" : S === SHAPES.sheet && !capped ? "71px 35px" : "60px 33px" }}>
      {curl && <Curl color={S.deep} />}
      {S === SHAPES.sheet && !capped && <Bow color={accent || "#E0778C"} />}
      {capped && <Nightcap fit={S.cap} pompom={accent || "#E0AA3E"} />}
      {halo && <Halo cy={capped ? S.halo.capCy : S.halo.cy} rx={S.halo.rx} falling={halo === "falling"} />}
    </g>
  );
  return (
    <svg
      className={`bd-buddy-svg ${className}`}
      style={style}
      viewBox="4 6 112 100"
      {...dims}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <g className="lb-all" style={{ transformOrigin: "60px 102px" }}>
        {pose && (
          <>
            <g className="lb-arm-l" style={{ transformOrigin: S.shoulders[0] }}>
              <Limb d={pose[0]} color={S.body} width={S.width} />
            </g>
            <g className="lb-arm-r" style={{ transformOrigin: S.shoulders[1] }}>
              <Limb d={pose[1]} color={S.body} width={S.width} />
            </g>
          </>
        )}
        <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
          {curl && top}
          <path d={S.d} fill={S.body} {...EDGE} />
          <g className="lb-tail" style={{ transformOrigin: "60px 88px" }}>
            <path d={S.tail} fill={S.body} {...EDGE} />
            {S.folds && (
              <g fill="none" stroke={S.deep} strokeWidth="2.2" strokeLinecap="round">
                {S.folds.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
            )}
          </g>
          {/* The body's fill again hides the hem's white edge where it tucks inside. */}
          <path d={S.d} fill={S.body} />
          {!curl && top}
          <Face mood={mood} x={S.face[0]} y={S.face[1]} look={look} />
        </g>
        <Extras mood={mood} box={S.box} />
      </g>
    </svg>
  );
}

// ---------- A buddy that can jump ----------

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const PUFFS = [
  [-1, 0],
  [-1, 1],
  [1, 0],
  [1, 1],
];

// Dust along the ground at touchdown, bigger for a harder landing.
function Dust({ impact }) {
  const s = Math.max(0.55, Math.min(1.15, impact));
  return (
    <span className="bd-dust" aria-hidden="true">
      {PUFFS.map(([side, up]) => (
        <i key={`${side}${up}`} style={{ "--dx": `${side * (30 + up * 9) * s}px`, "--dy": `${-(2 + up * 7) * s}px`, "--s": s, "--d": `${up * 50}ms` }} />
      ))}
    </span>
  );
}

const BURST = [
  [-160, "#E0AA3E"],
  [-110, "#E0778C"],
  [-70, "#7FBF9E"],
  [-20, "#8CA0DB"],
  [200, "#A898E0"],
  [20, "#E0AA3E"],
];

// Sparkles flung out at the top of a star jump.
function Burst() {
  return (
    <span className="bd-sparks" aria-hidden="true">
      {BURST.map(([a, c]) => (
        <svg key={a} viewBox="-8 -8 16 16" width="16" height="16" style={{ "--a": `${a}deg` }}>
          <path d={SPARK} fill={c} stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" paintOrder="stroke" />
        </svg>
      ))}
    </span>
  );
}

// The buddy on a little patch of ground, ready to jump. Every change of `jump.n` plays
// `jump.motion` (see jumps.js); while it plays, the jump owns the mood, then hands it back.
// Outside a jump, a change of mood gets a small pop. `fx(arg)` plays the jump's feedback.
export function LiveBuddy({ mood = "idle", accent, look, label, halo, shape, jump, fx, onSettle, className = "" }) {
  const fig = useRef(null);
  const [own, setOwn] = useState(null);
  const [dust, setDust] = useState({ n: 0, impact: 1 });
  const [burst, setBurst] = useState(0);
  const busy = useRef(false);
  const n = jump?.n || 0;

  useJump(n, fig, jump?.motion, {
    // Marked busy before the mood renders, so the swap swings instead of popping.
    setMood: (m) => {
      if (m) busy.current = true;
      setOwn(m);
    },
    fx: (a) => fx && fx(a),
    onEvent: (e) => {
      if (e.type === "land" && e.impact > 0.5) setDust((d) => ({ n: d.n + 1, impact: e.impact }));
      if (e.type === "apex" && jump?.motion?.burst) setBurst((b) => b + 1);
    },
    onDone: () => {
      busy.current = false;
      setOwn(null);
      if (onSettle) onSettle();
    },
  });

  const shown = own || mood;
  const last = useRef(shown);
  useEffect(() => {
    if (last.current === shown) return;
    last.current = shown;
    const svg = fig.current && fig.current.querySelector("svg");
    if (busy.current || !svg || reducedMotion() || !svg.animate) return;
    svg.animate(
      [{ transform: "scale(0.94, 1.04)" }, { transform: "scale(1.04, 0.97) translateY(-2px)", offset: 0.45 }, { transform: "none" }],
      { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
    );
  }, [shown]);

  return (
    <span className={`bd-live ${className}`}>
      <span className="jump-shadow" aria-hidden="true" />
      {dust.n > 0 && <Dust key={dust.n} impact={dust.impact} />}
      <span ref={fig} className="bd-fig">
        <Buddy mood={shown} accent={accent} look={look} label={label} halo={halo} shape={shape} />
        {burst > 0 && <Burst key={burst} />}
      </span>
    </span>
  );
}

// The buddy peeking over a card's top edge: the body sits behind the card (z-index 0) and
// two little hands grip the edge in front of it (z-index 3). The wrapper must not create
// a stacking context of its own, so it carries no transform, filter or opacity.
export function Peek({ mood = "watch", size = 64, look, accent, className = "" }) {
  const { shape } = useContext(Look);
  const S = SHAPES[shape] || SHAPES.puff;
  return (
    <span className={`bd-peek ${className}`} style={{ "--peek": `${size}px` }} aria-hidden="true">
      <span className="bd-peek-body">
        <Buddy mood={mood} size={size} look={look} accent={accent} arms="none" />
      </span>
      <svg className="bd-peek-hands" viewBox="0 0 64 14" width={size} height={size * (14 / 64)}>
        <ellipse cx="17" cy="7" rx="7.5" ry="5.2" fill={S.body} stroke="#fff" strokeWidth="3" paintOrder="stroke" />
        <ellipse cx="47" cy="7" rx="7.5" ry="5.2" fill={S.body} stroke="#fff" strokeWidth="3" paintOrder="stroke" />
      </svg>
    </span>
  );
}

// A short speech bubble. `tail` says which side points at the buddy.
export function Bubble({ tail = "left", className = "", children, ...rest }) {
  return (
    <div className={`bd-bubble tail-${tail} ${className}`} {...rest}>
      {children}
    </div>
  );
}
