import React from "react";

// The buddy: a soft periwinkle block with a die-cut white edge and a bobble antenna in the
// current exercise's colour. One drawing; each mood only swaps the eyes, mouth and arms.
//   idle   — blinks now and then          watch — eyes on the board
//   think  — your turn                    happy — closed-eye grin
//   cheer  — arms up, sparkles            oops  — worried brows, sweat drop
//   gentle — soft eyes and a wave, for "next time"

const BODY = "#8CA0DB";
const BODY_DEEP = "#6F86D6";
const INK = "#3B3F51";
const CHEEK = "#F0A9B8";

const ARMS = {
  down: ["M34 66 L26 79", "M86 66 L94 79"],
  out: ["M34 63 L21 60", "M86 63 L99 60"],
  up: ["M35 57 L23 39", "M85 57 L97 39"],
  wave: ["M34 66 L26 79", "M86 58 L99 43"],
  chin: ["M34 66 L26 79", "M86 70 L78 76"],
  none: [],
};

const MOODS = {
  idle: { eyes: "dots", mouth: "smile", arms: "down", blink: true },
  watch: { eyes: "dots", mouth: "o", arms: "down", look: [0, -2.4] },
  think: { eyes: "dots", mouth: "flat", arms: "chin", look: [2, -1.6], brow: "raise" },
  happy: { eyes: "arcs", mouth: "open", arms: "out" },
  cheer: { eyes: "arcs", mouth: "big", arms: "up", sparkles: true },
  oops: { eyes: "dots", mouth: "wobble", arms: "down", brow: "worried", sweat: true },
  gentle: { eyes: "rest", mouth: "smile", arms: "wave" },
};

function Eyes({ kind, look, blink }) {
  const [dx, dy] = look;
  if (kind === "arcs") {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
        <path d="M45 60 q5 -7 10 0" />
        <path d="M65 60 q5 -7 10 0" />
      </g>
    );
  }
  if (kind === "rest") {
    return (
      <g fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round">
        <path d="M45 57 q5 5 10 0" />
        <path d="M65 57 q5 5 10 0" />
      </g>
    );
  }
  return (
    <g className={blink ? "bd-blink" : undefined} fill={INK}>
      <ellipse cx={50 + dx} cy={58 + dy} rx="4.3" ry="4.8" />
      <ellipse cx={70 + dx} cy={58 + dy} rx="4.3" ry="4.8" />
    </g>
  );
}

function Mouth({ kind }) {
  switch (kind) {
    case "o":
      return <ellipse cx="60" cy="71" rx="2.8" ry="3.2" fill={INK} />;
    case "flat":
      return <path d="M55 71 q5 -1.6 10 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />;
    case "open":
      return (
        <g>
          <path d="M52 67 q8 11 16 0 z" fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth="1.5" />
          <ellipse cx="60" cy="72.4" rx="3.6" ry="1.8" fill="#E0778C" />
        </g>
      );
    case "big":
      return (
        <g>
          <path d="M50 65.5 q10 15 20 0 z" fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth="1.5" />
          <ellipse cx="60" cy="73" rx="4.6" ry="2.3" fill="#E0778C" />
        </g>
      );
    case "wobble":
      return (
        <path d="M52 72 q2 -3 4 0 t4 0 t4 0 t4 0" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      );
    default:
      return <path d="M54 69 q6 5.5 12 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />;
  }
}

const SPARK = "M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z";

export default function Buddy({ mood = "idle", size, look, accent = "#E0AA3E", arms, className = "", style, label }) {
  const m = MOODS[mood] || MOODS.idle;
  const armPaths = ARMS[arms || m.arms];
  const eyeLook = look || m.look || [0, 0];
  const dims = size ? { width: size, height: (size * 100) / 112 } : {};
  return (
    <svg
      className={`bd-buddy-svg ${className}`}
      style={style}
      viewBox="4 2 112 100"
      {...dims}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {/* The die-cut backing: every part again, fatter and white, behind the colour. */}
      <g fill="#fff" stroke="#fff" strokeLinejoin="round" strokeLinecap="round">
        {armPaths.map((d) => (
          <path key={d} d={d} strokeWidth="17" />
        ))}
        <path d="M60 37 Q 57 25 66 18" fill="none" strokeWidth="11.5" />
        <circle cx="67" cy="16" r="6.5" strokeWidth="8" />
        <ellipse cx="47" cy="91" rx="8.5" ry="5.5" strokeWidth="8" />
        <ellipse cx="73" cy="91" rx="8.5" ry="5.5" strokeWidth="8" />
        <rect x="31" y="35" width="58" height="56" rx="22" strokeWidth="8" />
      </g>

      <g fill="none" stroke={BODY} strokeWidth="9" strokeLinecap="round">
        {armPaths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d="M60 37 Q 57 25 66 18" fill="none" stroke={BODY_DEEP} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="67" cy="16" r="6.5" fill={accent} />
      <ellipse cx="47" cy="91" rx="8.5" ry="5.5" fill={BODY_DEEP} />
      <ellipse cx="73" cy="91" rx="8.5" ry="5.5" fill={BODY_DEEP} />
      <rect x="31" y="35" width="58" height="56" rx="22" fill={BODY} />

      <ellipse cx="41" cy="67" rx="4.6" ry="3" fill={CHEEK} />
      <ellipse cx="79" cy="67" rx="4.6" ry="3" fill={CHEEK} />
      {m.brow === "worried" && (
        <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          <path d="M44 49.5 L53 46.5" />
          <path d="M67 46.5 L76 49.5" />
        </g>
      )}
      {m.brow === "raise" && <path d="M66 47 q5 -3.5 10 -0.5" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />}
      <Eyes kind={m.eyes} look={eyeLook} blink={m.blink} />
      <Mouth kind={m.mouth} />

      {m.sweat && (
        <path
          d="M97 38 C 101 44, 102 48, 97 50 C 92 48, 93 44, 97 38 Z"
          fill="#BCD0F2"
          stroke="#fff"
          strokeWidth="3"
          paintOrder="stroke"
          strokeLinejoin="round"
          className="bd-sweat"
        />
      )}
      {m.sparkles && (
        <g stroke="#fff" strokeWidth="2.6" paintOrder="stroke" strokeLinejoin="round" className="bd-sparkles">
          <path d={SPARK} transform="translate(17 22) scale(1.1)" fill="#E0AA3E" />
          <path d={SPARK} transform="translate(104 20) scale(0.9)" fill="#E0778C" />
          <path d={SPARK} transform="translate(108 66) scale(0.75)" fill="#7FBF9E" />
        </g>
      )}
    </svg>
  );
}

// The buddy peeking over a card's top edge: the body sits behind the card (z-index 0) and
// two little hands grip the edge in front of it (z-index 3). The wrapper must not create
// a stacking context of its own, so it carries no transform, filter or opacity.
export function Peek({ mood = "watch", size = 64, look, accent, className = "" }) {
  return (
    <span className={`bd-peek ${className}`} style={{ "--peek": `${size}px` }} aria-hidden="true">
      <span className="bd-peek-body">
        <Buddy mood={mood} size={size} look={look} accent={accent} arms="none" />
      </span>
      <svg className="bd-peek-hands" viewBox="0 0 64 14" width={size} height={size * (14 / 64)}>
        <ellipse cx="17" cy="7" rx="7.5" ry="5.2" fill={BODY} stroke="#fff" strokeWidth="3" paintOrder="stroke" />
        <ellipse cx="47" cy="7" rx="7.5" ry="5.2" fill={BODY} stroke="#fff" strokeWidth="3" paintOrder="stroke" />
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
