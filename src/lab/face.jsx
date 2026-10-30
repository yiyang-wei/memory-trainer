import React from "react";

// Faces and mood props shared by every buddy design in the lab. A design draws its own
// body and decides where the face sits; the face itself (eyes, mouth, brows, cheeks) and
// the mood extras (sweat, sparkles, zzz) come from here, so every design can show every
// mood and every face style.
//
// Coordinates are relative to the face anchor: the point midway between the eyes, with
// the eyes 20 units apart at scale 1.

export const INK = "#3B3F51";
export const CHEEK = "#F0A9B8";
export const TONGUE = "#E0778C";

export const MOODS = ["idle", "watch", "think", "happy", "cheer", "oops", "gentle", "sleep"];

// What each mood asks of a face and a body. `arms` is a pose name; a design draws the
// poses it can (down, out, up, wave, chin) and ignores the rest.
const MOOD = {
  idle: { eyes: "open", mouth: "smile", arms: "down", blink: true },
  watch: { eyes: "open", mouth: "o", arms: "down", look: [0, -2.4] },
  think: { eyes: "open", mouth: "flat", arms: "chin", look: [2, -1.6], brow: "raise" },
  happy: { eyes: "arcs", mouth: "open", arms: "out" },
  cheer: { eyes: "arcs", mouth: "big", arms: "up", extra: "sparkles" },
  oops: { eyes: "open", mouth: "wobble", arms: "down", brow: "worried", extra: "sweat" },
  gentle: { eyes: "rest", mouth: "smile", arms: "wave" },
  sleep: { eyes: "closed", mouth: "small", arms: "down", extra: "zzz" },
};

export const moodInfo = (mood) => MOOD[mood] || MOOD.idle;

// Face styles. `gap` is half the distance between the eyes.
export const FACE_STYLES = {
  dot: { gap: 10, name: "Dots" },
  spark: { gap: 10.5, name: "Sparkle eyes" },
  bead: { gap: 13, name: "Beads" },
  ring: { gap: 10.5, name: "Googly" },
  pill: { gap: 9, name: "Pills" },
  mono: { gap: 0, name: "One eye" },
};

const clampLook = ([x, y], r) => {
  const d = Math.hypot(x, y);
  return d > r ? [(x / d) * r, (y / d) * r] : [x, y];
};

function OpenEyes({ kind, gap, look }) {
  const [dx, dy] = look;
  switch (kind) {
    case "spark":
      return [-gap, gap].map((x) => (
        <g key={x}>
          <circle cx={x + dx * 0.6} cy={dy * 0.6} r="5.8" fill={INK} />
          <circle cx={x + dx * 0.6 + 1.9} cy={dy * 0.6 - 2} r="1.9" fill="#fff" />
        </g>
      ));
    case "bead":
      return [-gap, gap].map((x) => <circle key={x} cx={x + dx * 0.6} cy={dy * 0.6} r="3.1" fill={INK} />);
    case "ring": {
      const [px, py] = clampLook([dx * 1.3, dy * 1.3], 3);
      return [-gap, gap].map((x) => (
        <g key={x}>
          <circle cx={x} cy="0" r="6.8" fill="#fff" stroke={INK} strokeWidth="2.2" />
          <circle cx={x + px} cy={py} r="3.2" fill={INK} />
        </g>
      ));
    }
    case "pill":
      return [-gap, gap].map((x) => (
        <rect key={x} x={x - 2.8 + dx * 0.6} y={-5.8 + dy * 0.6} width="5.6" height="11.6" rx="2.8" fill={INK} />
      ));
    case "mono": {
      const [px, py] = clampLook([dx * 1.6, dy * 1.6], 5);
      return (
        <g>
          <circle cx="0" cy="-1" r="11" fill="#fff" stroke={INK} strokeWidth="2.6" />
          <circle cx={px} cy={py - 1} r="5.4" fill={INK} />
          <circle cx={px + 2} cy={py - 3.2} r="1.7" fill="#fff" />
        </g>
      );
    }
    default:
      return [-gap, gap].map((x) => <ellipse key={x} cx={x + dx} cy={dy} rx="4.3" ry="4.8" fill={INK} />);
  }
}

// Eyes that aren't open: happy arcs, resting curves, sleeping lines. One-eyed faces get a
// single wide one.
function ShutEyes({ kind, gap, shape }) {
  const xs = gap === 0 ? [0] : [-gap, gap];
  const w = gap === 0 ? 9 : 5;
  const d = (x) =>
    shape === "arcs" ? `M${x - w} 2 q${w} -7 ${w * 2} 0` : shape === "rest" ? `M${x - w} -1 q${w} 5 ${w * 2} 0` : `M${x - w} 1 h${w * 2}`;
  return (
    <g fill="none" stroke={INK} strokeWidth="3.3" strokeLinecap="round">
      {xs.map((x) => (
        <path key={x} d={d(x)} />
      ))}
    </g>
  );
}

function Mouth({ kind, small, cat }) {
  const s = small ? 0.75 : 1;
  const g = (el) => <g transform={`translate(0 ${small ? 10 : 12}) scale(${s})`}>{el}</g>;
  // A cat's resting mouth is an ω under a little nose.
  if (cat && (kind === "smile" || kind === "small")) {
    return g(
      <g>
        <path d="M-2.6 -6.2 h5.2 l-2.6 3 z" fill={TONGUE} stroke={TONGUE} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M-6 -1.5 q3 4 6 0 q3 4 6 0" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  switch (kind) {
    case "o":
      return g(<ellipse cx="0" cy="0" rx="2.8" ry="3.2" fill={INK} />);
    case "flat":
      return g(<path d="M-5 0 q5 -1.6 10 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />);
    case "open":
      return g(
        <g>
          <path d="M-8 -4 q8 11 16 0 z" fill={INK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <ellipse cx="0" cy="1.4" rx="3.6" ry="1.8" fill={TONGUE} />
        </g>
      );
    case "big":
      return g(
        <g>
          <path d="M-10 -5 q10 15 20 0 z" fill={INK} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <ellipse cx="0" cy="2.5" rx="4.6" ry="2.3" fill={TONGUE} />
        </g>
      );
    case "wobble":
      return g(
        <path d="M-8 1 q2 -3 4 0 t4 0 t4 0 t4 0" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      );
    case "small":
      return g(<path d="M-3 0 q3 2.5 6 0" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />);
    default:
      return g(<path d="M-6 -2 q6 5.5 12 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />);
  }
}

// The face, drawn around (x, y). `look` nudges the pupils. `mouth={false}` leaves the
// mouth to the design (a beak, a trunk); `mouthStyle="cat"` swaps the resting smile for ω.
export function Face({ kind = "dot", mood = "idle", x = 60, y = 60, s = 1, look, cheeks = true, cheek = CHEEK, mouth = true, mouthStyle }) {
  const m = moodInfo(mood);
  const style = FACE_STYLES[kind] || FACE_STYLES.dot;
  const gap = style.gap;
  const eyeLook = look || m.look || [0, 0];
  const cheekX = gap === 0 ? 15 : gap + (kind === "bead" ? 7 : 9);
  return (
    <g className="lb-face" transform={`translate(${x} ${y}) scale(${s})`}>
      {cheeks && (
        <g fill={cheek}>
          <ellipse cx={-cheekX} cy={kind === "bead" ? 7 : 9} rx={kind === "bead" ? 5.4 : 4.6} ry={kind === "bead" ? 3.6 : 3} />
          <ellipse cx={cheekX} cy={kind === "bead" ? 7 : 9} rx={kind === "bead" ? 5.4 : 4.6} ry={kind === "bead" ? 3.6 : 3} />
        </g>
      )}
      {m.brow === "worried" && (
        <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          {gap === 0 ? (
            <path d="M-9 -15 L9 -15" />
          ) : (
            <>
              <path d={`M${-gap - 6} -8.5 L${-gap + 3} -11.5`} />
              <path d={`M${gap - 3} -11.5 L${gap + 6} -8.5`} />
            </>
          )}
        </g>
      )}
      {m.brow === "raise" && (
        <path d={`M${gap - 4} -11 q5 -3.5 10 -0.5`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      )}
      {m.eyes === "open" ? (
        <g className={`lb-eyes${m.blink ? " lb-blink" : ""}`}>
          <OpenEyes kind={kind} gap={gap} look={eyeLook} />
        </g>
      ) : (
        <g className="lb-eyes">
          <ShutEyes kind={kind} gap={gap} shape={m.eyes} />
        </g>
      )}
      {mouth && <Mouth kind={m.mouth} small={kind === "bead" || kind === "mono"} cat={mouthStyle === "cat"} />}
    </g>
  );
}

const SPARK = "M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z";
const STICK = { stroke: "#fff", paintOrder: "stroke", strokeLinejoin: "round" };

// Sweat, sparkles or zzz around a body whose bounds are [x0, y0, x1, y1].
export function MoodExtras({ mood, box }) {
  const { extra } = moodInfo(mood);
  const [x0, y0, x1, y1] = box;
  if (extra === "sweat") {
    const x = x1 + 3;
    const y = y0 + 4;
    return (
      <path
        className="lb-sweat"
        d={`M${x} ${y} C ${x + 4} ${y + 6}, ${x + 5} ${y + 10}, ${x} ${y + 12} C ${x - 5} ${y + 10}, ${x - 4} ${y + 6}, ${x} ${y} Z`}
        fill="#BCD0F2"
        strokeWidth="3"
        {...STICK}
      />
    );
  }
  if (extra === "sparkles") {
    return (
      <g className="lb-sparkles" strokeWidth="2.6" {...STICK}>
        <path d={SPARK} transform={`translate(${x0 - 8} ${y0 + 2}) scale(1.1)`} fill="#E0AA3E" />
        <path d={SPARK} transform={`translate(${x1 + 8} ${y0 - 2}) scale(0.9)`} fill="#E0778C" />
        <path d={SPARK} transform={`translate(${x1 + 11} ${(y0 + y1) / 2 + 8}) scale(0.75)`} fill="#7FBF9E" />
      </g>
    );
  }
  if (extra === "zzz") {
    return (
      <g className="lb-zzz" fill={INK} fontFamily="'Bricolage Grotesque Variable', system-ui, sans-serif" fontWeight="800" {...STICK} strokeWidth="3">
        <text x={x1 - 2} y={y0 + 6} fontSize="11">
          z
        </text>
        <text x={x1 + 6} y={y0 - 4} fontSize="14">
          z
        </text>
      </g>
    );
  }
  return null;
}
