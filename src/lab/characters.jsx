import React from "react";
import { Face, MoodExtras, moodInfo, INK } from "./face.jsx";
import "./characters.css";

// Buddy designs for the lab. Every design is one component with the same props:
//   mood   — one of face.MOODS            face   — a face.FACE_STYLES key (overrides the default)
//   size   — rendered width in px         look   — [dx, dy] pupil nudge
//   accent — the current exercise's colour, for whatever small part takes it
//
// Drawing rules, so motions can rig any design the same way:
// - viewBox is 0 0 120 120; the character stands on y ≈ 110, centred on x = 60.
// - Parts sit in groups with these classes, and none of them carries a transform
//   attribute (a CSS transform would replace it): lb-all (everything), lb-body,
//   lb-top (antenna, ears, hair — whatever should lag behind), lb-arm-l, lb-arm-r,
//   lb-feet. Each sets its transform-origin in viewBox px (transform-box: view-box).
// - lb-tail (optional, inside lb-body): a ghost's hem, a wisp's tail, a cloud's underside
//   puffs. Its origin is the line where it hangs from the body, and it is tucked far enough
//   inside the body that rotating it ±12° or scaling it 0.85–1.2 never opens a gap.
// - The die-cut edge is a fatter white copy of each part drawn behind its colour.

export const BODY = "#8CA0DB";
export const BODY_DEEP = "#6F86D6";

const EDGE = { stroke: "#fff", strokeWidth: 8, paintOrder: "stroke", strokeLinejoin: "round" };

export function Sticker({ size = 120, label, children }) {
  return (
    <svg
      className="lb-buddy"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <g className="lb-all" style={{ transformOrigin: "60px 110px" }}>
        {children}
      </g>
    </svg>
  );
}

// A limb drawn as a round-capped stroke with its own white edge.
export function Limb({ d, color = BODY, width = 9, edge = 8 }) {
  return (
    <>
      <path d={d} fill="none" stroke="#fff" strokeWidth={width + edge} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

// Left and right arm paths for a mood, from a table of poses (down, out, up, wave, chin).
// Wave and chin only move the right arm; the left one stays down.
const pose = (table, mood) => {
  const p = moodInfo(mood).arms;
  if (p === "wave" || p === "chin") return [table.down[0], table[p]];
  return table[p] || table.down;
};

function Arms({ table, mood, color, width, left, right }) {
  const [l, r] = pose(table, mood);
  return (
    <>
      <g className="lb-arm-l" style={{ transformOrigin: left }}>
        <Limb d={l} color={color} width={width} />
      </g>
      <g className="lb-arm-r" style={{ transformOrigin: right }}>
        <Limb d={r} color={color} width={width} />
      </g>
    </>
  );
}

function Feet({ at, color, rx = 8, ry = 5 }) {
  return (
    <g className="lb-feet">
      {at.map(([x, y]) => (
        <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} fill={color} {...EDGE} />
      ))}
    </g>
  );
}

// ---------- B01 · Bot (the buddy in /c3 today) ----------

const BOT_ARMS = {
  down: ["M34 78 L26 91", "M86 78 L94 91"],
  out: ["M34 75 L21 72", "M86 75 L99 72"],
  up: ["M35 69 L23 51", "M85 69 L97 51"],
  wave: ["M34 78 L26 91", "M86 70 L99 55"],
  chin: ["M34 78 L26 91", "M86 82 L78 88"],
};

function Bot({ mood = "idle", size, look, accent = "#E0AA3E", face = "dot", label }) {
  const arms = BOT_ARMS[moodInfo(mood).arms] || BOT_ARMS.down;
  return (
    <Sticker size={size} label={label}>
      <g className="lb-arm-l" style={{ transformOrigin: "36px 75px" }}>
        <Limb d={arms[0]} />
      </g>
      <g className="lb-arm-r" style={{ transformOrigin: "84px 75px" }}>
        <Limb d={arms[1]} />
      </g>
      <g className="lb-feet">
        <g fill={BODY_DEEP} stroke="#fff" strokeWidth="8" paintOrder="stroke">
          <ellipse cx="47" cy="103" rx="8.5" ry="5.5" />
          <ellipse cx="73" cy="103" rx="8.5" ry="5.5" />
        </g>
      </g>
      <g className="lb-body" style={{ transformOrigin: "60px 104px" }}>
        <g className="lb-top" style={{ transformOrigin: "60px 48px" }}>
          <path d="M60 49 Q 57 37 66 30" fill="none" stroke="#fff" strokeWidth="11.5" strokeLinecap="round" />
          <circle cx="67" cy="28" r="6.5" fill="#fff" stroke="#fff" strokeWidth="8" />
          <path d="M60 49 Q 57 37 66 30" fill="none" stroke={BODY_DEEP} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="67" cy="28" r="6.5" fill={accent} />
        </g>
        <rect x="31" y="47" width="58" height="56" rx="22" fill={BODY} stroke="#fff" strokeWidth="8" paintOrder="stroke" />
        <Face kind={face} mood={mood} x={60} y={70} look={look} />
      </g>
      <MoodExtras mood={mood} box={[31, 47, 89, 103]} />
    </Sticker>
  );
}

// ---------- B02 · Bean ----------

const BEAN = { body: "#EE9DAE", deep: "#D97A90", leaf: "#7FBF9E" };
const BEAN_ARMS = {
  down: ["M38 80 L32 89", "M84 80 L90 89"],
  out: ["M37 76 L27 73", "M85 76 L95 73"],
  up: ["M38 70 L30 57", "M84 70 L92 57"],
  wave: "M84 72 L95 60",
  chin: "M84 84 L77 89",
};

function Bean({ mood = "idle", size, look, face = "bead", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={BEAN_ARMS} mood={mood} color={BEAN.deep} width={7} left="38px 76px" right="84px 76px" />
      <Feet at={[[50, 106], [70, 106]]} color={BEAN.deep} rx={6.5} ry={4.2} />
      <g className="lb-body" style={{ transformOrigin: "60px 106px" }}>
        <g className="lb-top" style={{ transformOrigin: "60px 38px" }}>
          <path d="M60 38 Q 58 31 61 25" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
          <g fill={BEAN.leaf} {...EDGE} strokeWidth="6">
            <path d="M61 26 C 52 17, 45 23, 49 28 C 53 32, 59 30, 61 26 Z" />
            <path d="M61 25 C 66 15, 75 17, 73 23 C 71 28, 64 28, 61 25 Z" />
          </g>
          <path d="M60 38 Q 58 31 61 25" fill="none" stroke="#5DAA84" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path
          d="M60 36 C 80 36, 86 50, 85 66 C 84 82, 88 92, 82 101 C 76 109, 44 110, 38 100 C 32 90, 37 80, 36 70 C 35 52, 40 36, 60 36 Z"
          fill={BEAN.body}
          {...EDGE}
        />
        <Face kind={face} mood={mood} x={60} y={64} look={look} cheek="#F6C4CF" />
      </g>
      <MoodExtras mood={mood} box={[36, 36, 86, 106]} />
    </Sticker>
  );
}

// ---------- B03 · Mallow ----------

const MALLOW = { body: "#DAD3F6", deep: "#B3A6EA" };
const MALLOW_ARMS = {
  down: ["M32 74 L25 83", "M88 74 L95 83"],
  out: ["M32 71 L21 67", "M88 71 L99 67"],
  up: ["M33 65 L25 52", "M87 65 L95 52"],
  wave: "M88 67 L98 55",
  chin: "M87 80 L79 85",
};

function Mallow({ mood = "idle", size, look, face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={MALLOW_ARMS} mood={mood} color={MALLOW.body} width={9} left="33px 72px" right="87px 72px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
        <g className="lb-top" style={{ transformOrigin: "60px 35px" }}>
          <path d="M59 36 q -3 -9 5 -10 q 5 0 2 5" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
          <path d="M59 36 q -3 -9 5 -10 q 5 0 2 5" fill="none" stroke={MALLOW.deep} strokeWidth="3.2" strokeLinecap="round" />
        </g>
        <path
          d="M30 68 C 30 46, 43 34, 60 34 C 77 34, 90 46, 90 68 L 90 95 Q 82.5 106, 75 95 Q 67.5 106, 60 95 Q 52.5 106, 45 95 Q 37.5 106, 30 95 Z"
          fill={MALLOW.body}
          {...EDGE}
        />
        <Face kind={face} mood={mood} x={60} y={63} look={look} />
      </g>
      <MoodExtras mood={mood} box={[30, 34, 90, 100]} />
    </Sticker>
  );
}

// ---------- B04 · Cell ----------

const CELL_ARMS = {
  down: ["M32 72 L25 84", "M88 72 L95 84"],
  out: ["M32 67 L19 63", "M88 67 L101 63"],
  up: ["M33 58 L24 44", "M87 58 L96 44"],
  wave: "M88 60 L99 47",
  chin: "M86 78 L78 84",
};

function Cell({ mood = "idle", size, look, face = "pill", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={CELL_ARMS} mood={mood} color={BODY_DEEP} width={6} left="33px 68px" right="87px 68px" />
      <g className="lb-feet">
        <Limb d="M50 92 L49 106" color={BODY_DEEP} width={6} />
        <Limb d="M70 92 L71 106" color={BODY_DEEP} width={6} />
        <g fill={BODY_DEEP} {...EDGE} strokeWidth="6">
          <ellipse cx="47" cy="107" rx="6" ry="3.6" />
          <ellipse cx="73" cy="107" rx="6" ry="3.6" />
        </g>
      </g>
      <g className="lb-body" style={{ transformOrigin: "60px 96px" }}>
        <rect x="31" y="36" width="58" height="58" rx="15" fill={BODY} {...EDGE} />
        {/* The board's lit-cell inset ring. */}
        <rect x="35" y="40" width="50" height="50" rx="11.5" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" />
        <Face kind={face} mood={mood} x={60} y={62} look={look} />
      </g>
      <MoodExtras mood={mood} box={[31, 36, 89, 94]} />
    </Sticker>
  );
}

// ---------- B05 · Brainy ----------

const BRAIN = { body: "#F4BFCA", line: "#E0778C", deep: "#E79AAA" };
const BRAIN_ARMS = {
  down: ["M31 77 L24 88", "M89 77 L96 88"],
  out: ["M30 72 L18 68", "M90 72 L102 68"],
  up: ["M31 66 L22 52", "M89 66 L98 52"],
  wave: "M89 68 L100 55",
  chin: "M88 83 L80 88",
};

function Brainy({ mood = "idle", size, look, face = "spark", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={BRAIN_ARMS} mood={mood} color={BRAIN.deep} width={6.5} left="31px 74px" right="89px 74px" />
      <Feet at={[[50, 102], [70, 102]]} color={BRAIN.deep} rx={7} ry={4.5} />
      <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
        <g className="lb-top" />
        <path
          d="M34 78 C 26 74, 27 62, 34 58 C 32 48, 42 42, 50 45 C 54 39, 66 39, 70 45 C 78 42, 88 48, 86 58 C 93 62, 94 74, 86 78 C 88 88, 78 95, 70 92 C 66 98, 54 98, 50 92 C 42 95, 32 88, 34 78 Z"
          fill={BRAIN.body}
          {...EDGE}
        />
        <g fill="none" stroke={BRAIN.line} strokeWidth="2.4" strokeLinecap="round" opacity="0.8">
          <path d="M60 44 C 56 49, 64 53, 60 58" />
          <path d="M37 60 C 43 57, 46 63, 51 60" />
          <path d="M83 60 C 77 57, 74 63, 69 60" />
          <path d="M40 87 C 44 84, 47 89, 51 87" />
          <path d="M80 87 C 76 84, 73 89, 69 87" />
        </g>
        <Face kind={face} mood={mood} x={60} y={70} s={0.95} look={look} cheek="#EE9DAE" />
      </g>
      <MoodExtras mood={mood} box={[27, 41, 93, 97]} />
    </Sticker>
  );
}

// ---------- B06 · Owl ----------

const OWL = { body: "#7FBF9E", deep: "#5DAA84", tint: "#E1F2E9", beak: "#E0AA3E" };
const OWL_WINGS = {
  down: ["M33 72 L29 87", "M87 72 L91 87"],
  out: ["M32 70 L19 69", "M88 70 L101 69"],
  up: ["M33 64 L23 50", "M87 64 L97 50"],
  wave: "M87 66 L98 53",
  chin: "M86 80 L78 85",
};

function Beak({ open }) {
  return open ? (
    <g fill={OWL.beak} stroke="#fff" strokeWidth="2.4" paintOrder="stroke" strokeLinejoin="round">
      <path d="M55 70 L65 70 L60 74.5 Z" />
      <path d="M56 77 L64 77 L60 80.5 Z" />
    </g>
  ) : (
    <path d="M55 70 L65 70 L60 77 Z" fill={OWL.beak} stroke="#fff" strokeWidth="2.4" paintOrder="stroke" strokeLinejoin="round" />
  );
}

function Owl({ mood = "idle", size, look, face = "ring", label }) {
  const open = ["happy", "cheer", "oops"].includes(mood);
  return (
    <Sticker size={size} label={label}>
      <Arms table={OWL_WINGS} mood={mood} color={OWL.deep} width={11} left="34px 70px" right="86px 70px" />
      <g className="lb-feet">
        <g fill={OWL.beak} {...EDGE} strokeWidth="6">
          <ellipse cx="52" cy="105" rx="6" ry="3.6" />
          <ellipse cx="68" cy="105" rx="6" ry="3.6" />
        </g>
      </g>
      <g className="lb-body" style={{ transformOrigin: "60px 104px" }}>
        <g className="lb-top" style={{ transformOrigin: "60px 44px" }}>
          <g fill={OWL.body} {...EDGE}>
            <path d="M40 50 L35 30 L52 41 Z" />
            <path d="M80 50 L85 30 L68 41 Z" />
          </g>
        </g>
        <path d="M60 36 C 82 36, 90 56, 90 74 C 90 94, 78 104, 60 104 C 42 104, 30 94, 30 74 C 30 56, 38 36, 60 36 Z" fill={OWL.body} {...EDGE} />
        <ellipse cx="60" cy="89" rx="17" ry="12" fill={OWL.tint} />
        <g fill="none" stroke={OWL.body} strokeWidth="2.2" strokeLinecap="round">
          <path d="M53 86 q3 3 6 0" />
          <path d="M61 86 q3 3 6 0" />
          <path d="M57 92 q3 3 6 0" />
        </g>
        <circle cx="49.5" cy="62" r="11.5" fill={OWL.tint} />
        <circle cx="70.5" cy="62" r="11.5" fill={OWL.tint} />
        <Face kind={face} mood={mood} x={60} y={62} look={look} mouth={false} cheeks={false} />
        <Beak open={open} />
      </g>
      <MoodExtras mood={mood} box={[30, 32, 90, 104]} />
    </Sticker>
  );
}

// ---------- B07 · Ellie ----------

const ELLIE = { body: "#A898E0", deep: "#8F7DD6", trunk: "#9886DA", ear: "#F1B7C3" };
// The trunk stays inside the body, so it needs no white edge of its own.
const TRUNK = {
  hang: "M60 65 C 60 73, 60 79, 62 84 C 63 87, 66 88, 68 86",
  up: "M60 65 C 63 75, 74 78, 79 71 C 81 67, 80 63, 77 63",
  droop: "M60 65 C 60 74, 59 81, 57 88",
  wave: "M60 65 C 60 74, 55 80, 49 78 C 46 77, 45 73, 48 72",
};

function Ellie({ mood = "idle", size, look, face = "dot", label }) {
  const trunk =
    mood === "happy" || mood === "cheer" ? TRUNK.up : mood === "oops" ? TRUNK.droop : mood === "gentle" ? TRUNK.wave : TRUNK.hang;
  const grin = mood === "happy" || mood === "cheer";
  return (
    <Sticker size={size} label={label}>
      <g className="lb-arm-l" />
      <g className="lb-arm-r" />
      <Feet at={[[47, 104], [73, 104]]} color={ELLIE.deep} rx={9} ry={5.5} />
      <g className="lb-body" style={{ transformOrigin: "60px 104px" }}>
        <g className="lb-top" style={{ transformOrigin: "60px 62px" }}>
          <g fill={ELLIE.body} {...EDGE}>
            <path d="M37 55 C 19 44, 9 63, 15 76 C 19 86, 32 87, 37 80 Z" />
            <path d="M83 55 C 101 44, 111 63, 105 76 C 101 86, 88 87, 83 80 Z" />
          </g>
          <g fill={ELLIE.ear}>
            <path d="M34 59 C 23 53, 17 64, 20 72 C 23 79, 30 80, 33 76 Z" />
            <path d="M86 59 C 97 53, 103 64, 100 72 C 97 79, 90 80, 87 76 Z" />
          </g>
        </g>
        <path d="M60 38 C 80 38, 90 52, 90 70 C 90 90, 78 102, 60 102 C 42 102, 30 90, 30 70 C 30 52, 40 38, 60 38 Z" fill={ELLIE.body} {...EDGE} />
        <Face kind={face} mood={mood} x={60} y={57} look={look} mouth={false} />
        {grin && <path d="M47 71 q5 7 10 0 z" fill={INK} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />}
        <path d={trunk} fill="none" stroke={ELLIE.trunk} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <MoodExtras mood={mood} box={[30, 38, 90, 102]} />
    </Sticker>
  );
}

// ---------- B08 · Kitty ----------

const KITTY = { body: "#A4B2DE", deep: "#8394CF", ear: "#F1B7C3" };
const KITTY_ARMS = {
  down: ["M34 82 L28 93", "M86 82 L92 93"],
  out: ["M33 78 L20 75", "M87 78 L100 75"],
  up: ["M34 72 L25 58", "M86 72 L95 58"],
  wave: "M86 74 L98 61",
  chin: "M86 86 L78 92",
};

function Kitty({ mood = "idle", size, look, face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={KITTY_ARMS} mood={mood} color={KITTY.body} width={9} left="35px 78px" right="85px 78px" />
      <Feet at={[[48, 105], [72, 105]]} color={KITTY.deep} rx={8} ry={5} />
      <g className="lb-body" style={{ transformOrigin: "60px 105px" }}>
        <g className="lb-top" style={{ transformOrigin: "60px 48px" }}>
          <g fill={KITTY.body} {...EDGE}>
            <path d="M34 58 C 32 47, 33 37, 37 30 C 45 34, 51 40, 55 47 Z" />
            <path d="M86 58 C 88 47, 87 37, 83 30 C 75 34, 69 40, 65 47 Z" />
          </g>
          <g fill={KITTY.ear}>
            <path d="M38 50 C 37 44, 38 39, 40 36 C 44 39, 47 42, 49 46 Z" />
            <path d="M82 50 C 83 44, 82 39, 80 36 C 76 39, 73 42, 71 46 Z" />
          </g>
        </g>
        <path d="M60 44 C 80 44, 90 56, 90 74 C 90 92, 80 104, 60 104 C 40 104, 30 92, 30 74 C 30 56, 40 44, 60 44 Z" fill={KITTY.body} {...EDGE} />
        <g stroke="#fff" strokeWidth="6" strokeLinecap="round">
          <path d="M31 76 L21 73.5" />
          <path d="M31 82 L21 83" />
          <path d="M89 76 L99 73.5" />
          <path d="M89 82 L99 83" />
        </g>
        <g stroke={INK} strokeWidth="2" strokeLinecap="round">
          <path d="M31 76 L21 73.5" />
          <path d="M31 82 L21 83" />
          <path d="M89 76 L99 73.5" />
          <path d="M89 82 L99 83" />
        </g>
        <Face kind={face} mood={mood} x={60} y={70} look={look} mouthStyle="cat" />
      </g>
      <MoodExtras mood={mood} box={[30, 32, 90, 104]} />
    </Sticker>
  );
}

// ---------- B09 · Star ----------

const STAR = { body: "#E0AA3E", cheek: "#F0A08A" };
const deg = (d) => (d * Math.PI) / 180;
const pt = (a, r) => [60 + r * Math.cos(deg(a)), 66 + r * Math.sin(deg(a))];
const poly = (pts) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z`;
// Top point and two legs; the side points are separate arms so they can move.
const STAR_BODY = poly([
  pt(-90, 42),
  pt(-54, 24),
  pt(-18, 27),
  pt(18, 24),
  pt(54, 42),
  pt(90, 24),
  pt(126, 42),
  pt(162, 24),
  pt(198, 27),
  pt(234, 24),
]);
// An arm point pointing straight out to the right from its shoulder, before rotation.
const STAR_SHOULDER_R = pt(-18, 17);
const STAR_SHOULDER_L = pt(198, 17);
const starArm = (side, angle) => {
  const [sx, sy] = side === "r" ? STAR_SHOULDER_R : STAR_SHOULDER_L;
  const dir = side === "r" ? -18 + angle : 198 - angle;
  const tip = [sx + 27 * Math.cos(deg(dir)), sy + 27 * Math.sin(deg(dir))];
  const b1 = [sx + 11 * Math.cos(deg(dir + 90)), sy + 11 * Math.sin(deg(dir + 90))];
  const b2 = [sx + 11 * Math.cos(deg(dir - 90)), sy + 11 * Math.sin(deg(dir - 90))];
  return poly([b1, tip, b2]);
};
// Rotation of each arm (degrees, positive = downwards) per pose.
const STAR_POSE = { down: [28, 28], out: [0, 0], up: [-40, -40], wave: [28, -58], chin: [28, -78] };

function StarArm({ d }) {
  return (
    <>
      <path d={d} fill="#fff" stroke="#fff" strokeWidth="19" strokeLinejoin="round" />
      <path d={d} fill={STAR.body} stroke={STAR.body} strokeWidth="11" strokeLinejoin="round" />
    </>
  );
}

function Star({ mood = "idle", size, look, face = "dot", label }) {
  const [la, ra] = STAR_POSE[moodInfo(mood).arms] || STAR_POSE.down;
  return (
    <Sticker size={size} label={label}>
      <g className="lb-arm-l" style={{ transformOrigin: `${STAR_SHOULDER_L[0].toFixed(1)}px ${STAR_SHOULDER_L[1].toFixed(1)}px` }}>
        <StarArm d={starArm("l", la)} />
      </g>
      <g className="lb-arm-r" style={{ transformOrigin: `${STAR_SHOULDER_R[0].toFixed(1)}px ${STAR_SHOULDER_R[1].toFixed(1)}px` }}>
        <StarArm d={starArm("r", ra)} />
      </g>
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 104px" }}>
        <g className="lb-top" />
        <path d={STAR_BODY} fill="#fff" stroke="#fff" strokeWidth="19" strokeLinejoin="round" />
        <path d={STAR_BODY} fill={STAR.body} stroke={STAR.body} strokeWidth="11" strokeLinejoin="round" />
        <Face kind={face} mood={mood} x={60} y={64} s={0.92} look={look} cheek={STAR.cheek} />
      </g>
      <MoodExtras mood={mood} box={[24, 26, 96, 104]} />
    </Sticker>
  );
}

// ---------- B10 · Cloud ----------

const CLOUD = { body: "#C3CEEE", deep: "#9FB0E4" };
// Floating puff hands: each pose is a dot (a zero-length round-capped line).
const dot = (x, y) => `M${x} ${y} L${x + 0.1} ${y}`;
const CLOUD_HANDS = {
  down: [dot(22, 96), dot(98, 96)],
  out: [dot(13, 82), dot(107, 82)],
  up: [dot(20, 62), dot(100, 62)],
  wave: dot(104, 64),
  chin: dot(82, 96),
};

function Cloud({ mood = "idle", size, look, face = "bead", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={CLOUD_HANDS} mood={mood} color={CLOUD.deep} width={12} left="30px 84px" right="90px 84px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 102px" }}>
        <g className="lb-top" />
        <path
          d="M32 102 C 20 102, 18 84, 30 80 C 28 66, 42 58, 52 64 C 56 50, 76 48, 82 62 C 94 60, 102 72, 94 82 C 104 86, 100 102, 88 102 Z"
          fill={CLOUD.body}
          {...EDGE}
        />
        <Face kind={face} mood={mood} x={60} y={82} look={look} />
      </g>
      <MoodExtras mood={mood} box={[20, 52, 100, 102]} />
    </Sticker>
  );
}

// ---------- B11 · Octo ----------

const OCTO = { body: "#EA8A9C", deep: "#D56C82", spot: "#F6C6D0" };
const OCTO_ARMS = {
  down: ["M34 72 C 25 76, 21 84, 26 90", "M86 72 C 95 76, 99 84, 94 90"],
  out: ["M33 69 C 24 67, 17 66, 12 70", "M87 69 C 96 67, 103 66, 108 70"],
  up: ["M34 62 C 26 55, 22 46, 27 40", "M86 62 C 94 55, 98 46, 93 40"],
  wave: "M86 62 C 96 58, 102 48, 96 41",
  chin: "M85 74 C 92 80, 88 86, 79 85",
};

function Octo({ mood = "idle", size, look, face = "spark", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={OCTO_ARMS} mood={mood} color={OCTO.body} width={8} left="34px 68px" right="86px 68px" />
      <g className="lb-feet" style={{ transformOrigin: "60px 84px" }}>
        <Limb d="M42 82 C 38 92, 32 96, 36 104" color={OCTO.body} width={8} />
        <Limb d="M53 85 C 51 94, 49 100, 53 106" color={OCTO.body} width={8} />
        <Limb d="M67 85 C 69 94, 71 100, 67 106" color={OCTO.body} width={8} />
        <Limb d="M78 82 C 82 92, 88 96, 84 104" color={OCTO.body} width={8} />
      </g>
      <g className="lb-body" style={{ transformOrigin: "60px 86px" }}>
        <g className="lb-top" />
        <path d="M60 30 C 82 30, 92 48, 90 66 C 89 78, 82 87, 60 87 C 38 87, 31 78, 30 66 C 28 48, 38 30, 60 30 Z" fill={OCTO.body} {...EDGE} />
        <g fill={OCTO.spot}>
          <circle cx="44" cy="42" r="3.2" />
          <circle cx="76" cy="40" r="2.4" />
          <circle cx="82" cy="50" r="1.8" />
        </g>
        <Face kind={face} mood={mood} x={60} y={60} look={look} cheek="#F6B3C1" />
      </g>
      <MoodExtras mood={mood} box={[30, 30, 90, 87]} />
    </Sticker>
  );
}

// ---------- B12 · Chameleon ----------

// Mode colours and their deeper shades. With no accent the body cycles through all four
// (see characters.css), which is how the lab shows that it changes with the exercise.
const SHADES = {
  "#8CA0DB": "#6F86D6",
  "#7FBF9E": "#5DAA84",
  "#E0AA3E": "#C98A1A",
  "#E0778C": "#C95C72",
};
const CHAM_ARMS = {
  down: ["M31 80 L23 91", "M85 80 L93 91"],
  out: ["M30 76 L17 72", "M86 76 L99 72"],
  up: ["M31 68 L22 54", "M85 68 L94 54"],
  wave: "M85 70 L96 57",
  chin: "M84 86 L76 91",
};

function Chameleon({ mood = "idle", size, look, accent, face = "ring", label }) {
  const body = accent || "#7FBF9E";
  const deep = SHADES[body] || "#5DAA84";
  const cyc = accent ? "" : "ch-cyc";
  const cycDeep = accent ? "" : "ch-cyc-deep";
  const [l, r] = pose(CHAM_ARMS, mood);
  return (
    <Sticker size={size} label={label}>
      <g className="lb-arm-l" style={{ transformOrigin: "32px 76px" }}>
        <path d={l} fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" />
        <path className={cyc} d={l} fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
      </g>
      <g className="lb-arm-r" style={{ transformOrigin: "84px 76px" }}>
        <path d={r} fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" />
        <path className={cyc} d={r} fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
      </g>
      <g className="lb-feet">
        <g {...EDGE}>
          <ellipse className={cycDeep} cx="47" cy="104" rx="8" ry="5" fill={deep} />
          <ellipse className={cycDeep} cx="69" cy="104" rx="8" ry="5" fill={deep} />
        </g>
      </g>
      <g className="lb-body" style={{ transformOrigin: "58px 104px" }}>
        <path d="M82 92 C 98 98, 108 84, 101 74 C 96 68, 88 72, 92 78" fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" />
        <path className={cyc} d="M82 92 C 98 98, 108 84, 101 74 C 96 68, 88 72, 92 78" fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
        <g className="lb-top" style={{ transformOrigin: "58px 46px" }}>
          <g {...EDGE}>
            <circle className={cycDeep} cx="44" cy="47" r="6.5" fill={deep} />
            <circle className={cycDeep} cx="57" cy="42" r="7" fill={deep} />
            <circle className={cycDeep} cx="70" cy="46" r="6.5" fill={deep} />
          </g>
        </g>
        <circle className={cyc} cx="58" cy="73" r="30" fill={body} {...EDGE} />
        <Face kind={face} mood={mood} x={58} y={68} look={look} />
      </g>
      <MoodExtras mood={mood} box={[28, 40, 88, 103]} />
    </Sticker>
  );
}

// ---------- Round 2: ghosts and clouds ----------
//
// More in the direction of B03 Mallow and B10 Cloud. A ghost's hem is its own part
// (lb-tail) so motions can let it flutter. To join a part to the body without a seam,
// draw the body with its edge, then the part with its own edge, then the body's fill once
// more on top (<Refill>): that hides the part's edge wherever it is tucked inside the body.

const Refill = ({ d, color, className }) => <path className={className} d={d} fill={color} />;

function Tail({ d, color, origin, className, children }) {
  return (
    <g className="lb-tail" style={{ transformOrigin: origin }}>
      <path className={className} d={d} fill={color} {...EDGE} />
      {children}
    </g>
  );
}

// A hem band from `top` (tucked inside the body) down to `y`, ending in n round scallops
// `depth` deep, drawn right to left.
const hem = (x0, x1, top, y, n, depth) => {
  const w = (x1 - x0) / n;
  const bumps = Array.from({ length: n }, () => `a${w / 2} ${depth} 0 0 1 ${-w} 0`).join(" ");
  return `M${x0} ${top} H${x1} V${y} ${bumps} Z`;
};

// Puffy bodies made of circles and rounded rects ([x, y, r] or [x, y, w, h, rx]): every
// white edge first, then every fill, so the puffs merge into one sticker.
const shape = (s, props) =>
  s.length === 3 ? <circle cx={s[0]} cy={s[1]} r={s[2]} {...props} /> : <rect x={s[0]} y={s[1]} width={s[2]} height={s[3]} rx={s[4]} {...props} />;

function Puffs({ shapes, color, edge = true, className }) {
  return (
    <>
      {edge && shapes.map((s, i) => <React.Fragment key={`e${i}`}>{shape(s, { fill: "#fff", stroke: "#fff", strokeWidth: 8 })}</React.Fragment>)}
      {shapes.map((s, i) => (
        <React.Fragment key={`f${i}`}>{shape(s, { fill: color, className })}</React.Fragment>
      ))}
    </>
  );
}

// ---------- B13 · Puff (Mallow, rounder) ----------

const PUFF = { body: "#DCD5F7", deep: "#B4A7EB" };
const PUFF_D = "M28 66 C 28 44, 42 30, 60 30 C 78 30, 92 44, 92 66 L 92 88 L 28 88 Z";
const PUFF_ARMS = {
  down: ["M30 74 L24 82", "M90 74 L96 82"],
  out: ["M30 70 L19 67", "M90 70 L101 67"],
  up: ["M31 64 L24 52", "M89 64 L96 52"],
  wave: "M90 66 L100 55",
  chin: "M89 79 L80 83",
};

function Puff({ mood = "idle", size, look, face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={PUFF_ARMS} mood={mood} color={PUFF.body} width={10} left="31px 71px" right="89px 71px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
        <g className="lb-top" style={{ transformOrigin: "60px 32px" }}>
          <path d="M60 33 q -3 -8 4 -9.5 q 4.5 -0.5 2.5 4" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
          <path d="M60 33 q -3 -8 4 -9.5 q 4.5 -0.5 2.5 4" fill="none" stroke={PUFF.deep} strokeWidth="3.2" strokeLinecap="round" />
        </g>
        <path d={PUFF_D} fill={PUFF.body} {...EDGE} />
        <Tail d={hem(28, 92, 78, 95, 3, 7)} color={PUFF.body} origin="60px 88px" />
        <Refill d={PUFF_D} color={PUFF.body} />
        <Face kind={face} mood={mood} x={60} y={61} look={look} />
      </g>
      <MoodExtras mood={mood} box={[28, 30, 92, 102]} />
    </Sticker>
  );
}

// ---------- B14 · Wisp (teardrop, tail curls to one side) ----------

const WISP = { body: "#CDEBDB", deep: "#8DCBAC" };
const WISP_D = "M31 56 C 31 39, 44 27, 60 27 C 76 27, 89 39, 89 56 C 89 70, 81 80, 72 86 L 50 86 C 39 80, 31 70, 31 56 Z";
const WISP_TAIL =
  "M42 74 L80 74 L72 86 C 69 92, 72 97, 78 97 C 83 97, 87 93, 89 88 C 91 98, 83 106, 71 106 C 57 106, 48 98, 50 86 Z";
const WISP_ARMS = {
  down: ["M33 64 L27 72", "M87 64 L93 72"],
  out: ["M33 60 L22 57", "M87 60 L98 57"],
  up: ["M34 54 L27 43", "M86 54 L93 43"],
  wave: "M87 56 L97 46",
  chin: "M85 70 L77 74",
};

function Wisp({ mood = "idle", size, look, face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={WISP_ARMS} mood={mood} color={WISP.body} width={9} left="34px 61px" right="86px 61px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
        <g className="lb-top" />
        <path d={WISP_D} fill={WISP.body} {...EDGE} />
        <Tail d={WISP_TAIL} color={WISP.body} origin="61px 84px" />
        <Refill d={WISP_D} color={WISP.body} />
        <Face kind={face} mood={mood} x={60} y={55} look={look} />
      </g>
      <MoodExtras mood={mood} box={[31, 27, 89, 104]} />
    </Sticker>
  );
}

// ---------- B15 · Sheet (a little sheet ghost with a bow) ----------

const SHEET = { body: "#E1E6F8", deep: "#B1BDEA" };
const SHEET_D = "M37 60 C 37 41, 47 30, 60 30 C 73 30, 83 41, 83 60 C 83 72, 86 80, 89 88 L 31 88 C 34 80, 37 72, 37 60 Z";
const SHEET_TAIL = "M36 78 H84 L89 88 L92 96 Q 85 105, 76 98 Q 68 103, 61 98.5 Q 52 105, 44 98 Q 36 103, 28 96 L31 88 Z";
const SHEET_ARMS = {
  down: ["M38 70 L31 79", "M82 70 L89 79"],
  out: ["M38 66 L27 63", "M82 66 L93 63"],
  up: ["M39 60 L32 48", "M81 60 L88 48"],
  wave: "M82 62 L92 51",
  chin: "M81 76 L72 80",
};

function Sheet({ mood = "idle", size, look, accent = "#E0778C", face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={SHEET_ARMS} mood={mood} color={SHEET.body} width={9} left="39px 67px" right="81px 67px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
        <path d={SHEET_D} fill={SHEET.body} {...EDGE} />
        <Tail d={SHEET_TAIL} color={SHEET.body} origin="60px 88px">
          <g fill="none" stroke={SHEET.deep} strokeWidth="2.2" strokeLinecap="round">
            <path d="M46 90 q -1 4 -2.5 7" />
            <path d="M75 90 q 1 4 2 7" />
          </g>
        </Tail>
        <Refill d={SHEET_D} color={SHEET.body} />
        <g className="lb-top" style={{ transformOrigin: "71px 35px" }}>
          <g transform="translate(72 33) rotate(18) scale(1.25)">
            <g fill="#fff" stroke="#fff" strokeWidth="6" strokeLinejoin="round">
              <path d="M0 0 C -4 -7, -11 -6, -10 0 C -9 5, -4 4, 0 0 Z" />
              <path d="M0 0 C 4 -7, 11 -6, 10 0 C 9 5, 4 4, 0 0 Z" />
            </g>
            <g fill={accent}>
              <path d="M0 0 C -4 -7, -11 -6, -10 0 C -9 5, -4 4, 0 0 Z" />
              <path d="M0 0 C 4 -7, 11 -6, 10 0 C 9 5, 4 4, 0 0 Z" />
              <circle r="3.3" />
            </g>
            <circle r="3.3" fill="rgba(59, 63, 81, 0.16)" />
          </g>
        </g>
        <Face kind={face} mood={mood} x={60} y={59} look={look} />
      </g>
      <MoodExtras mood={mood} box={[31, 30, 89, 104]} />
    </Sticker>
  );
}

// ---------- B16 · Mochi (wide and low, with a sakura leaf) ----------

const MOCHI = { body: "#F7D6DF", deep: "#EBA4B6", leaf: "#93CDAE", vein: "#6FB18F" };
const MOCHI_D = "M22 80 C 22 59, 38 47, 60 47 C 82 47, 98 59, 98 80 L 98 92 L 22 92 Z";
const MOCHI_ARMS = {
  down: ["M24 84 L18 91", "M96 84 L102 91"],
  out: ["M23 79 L12 76", "M97 79 L108 76"],
  up: ["M25 72 L17 61", "M95 72 L103 61"],
  wave: "M96 74 L106 63",
  chin: "M93 86 L84 89",
};

function Mochi({ mood = "idle", size, look, face = "bead", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={MOCHI_ARMS} mood={mood} color={MOCHI.body} width={9} left="25px 80px" right="95px 80px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 101px" }}>
        <path d={MOCHI_D} fill={MOCHI.body} {...EDGE} />
        <Tail d={hem(22, 98, 84, 96, 5, 6)} color={MOCHI.body} origin="60px 92px" />
        <Refill d={MOCHI_D} color={MOCHI.body} />
        <g className="lb-top" style={{ transformOrigin: "58px 48px" }}>
          <g transform="translate(49 50) rotate(-16)">
            <path d="M0 0 C 6 -9, 20 -9, 26 -2 C 19 4, 7 5, 0 0 Z" fill={MOCHI.leaf} {...EDGE} />
            <path d="M3 -0.5 C 10 -3, 17 -3.5, 22 -2.5" fill="none" stroke={MOCHI.vein} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
        <Face kind={face} mood={mood} x={60} y={73} look={look} />
      </g>
      <MoodExtras mood={mood} box={[22, 44, 98, 101]} />
    </Sticker>
  );
}

// ---------- B17 · Dozy (nightcap with a pompom) ----------

const DOZY = { body: "#C6D0F1", deep: "#91A3E0", cap: "#B6A8EA", brim: "#EEEAFB" };
const DOZY_D = "M30 68 C 30 46, 43 35, 60 35 C 77 35, 90 46, 90 68 L 90 90 L 30 90 Z";
const DOZY_ARMS = {
  down: ["M32 77 L25 86", "M88 77 L95 86"],
  out: ["M32 74 L21 70", "M88 74 L99 70"],
  up: ["M33 68 L25 55", "M87 68 L95 55"],
  wave: "M88 70 L98 58",
  chin: "M87 83 L79 88",
};

function Dozy({ mood = "idle", size, look, accent = "#E0AA3E", face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={DOZY_ARMS} mood={mood} color={DOZY.body} width={9} left="33px 75px" right="87px 75px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 101px" }}>
        <path d={DOZY_D} fill={DOZY.body} {...EDGE} />
        <Tail d={hem(30, 90, 80, 96, 4, 6)} color={DOZY.body} origin="60px 90px" />
        <Refill d={DOZY_D} color={DOZY.body} />
        <g className="lb-top" style={{ transformOrigin: "60px 40px" }}>
          <path d="M41 42 C 40 28, 50 18, 62 18 C 74 18, 85 25, 92 36 C 94 40, 96 44, 96 48 C 92 44, 86 41, 80 42 Q 60 32, 41 42 Z" fill={DOZY.cap} {...EDGE} />
          <Limb d="M41 43 Q 60 33, 80 43" color={DOZY.brim} width={8} />
          <circle cx="97" cy="51" r="6" fill={accent} {...EDGE} />
        </g>
        <Face kind={face} mood={mood} x={60} y={68} look={look} />
      </g>
      <MoodExtras mood={mood} box={[30, 30, 90, 102]} />
    </Sticker>
  );
}

// ---------- B18 · Tint (takes a pale tint of the exercise colour) ----------

// Pale and deep tints of each mode colour. With no accent the body walks through all
// four (see characters.css), the way the lab shows B12 Chameleon.
const TINTS = {
  "#8CA0DB": ["#D3DBF3", "#A6B5E8"],
  "#7FBF9E": ["#CDE9DA", "#92CDB0"],
  "#E0AA3E": ["#F5E0B5", "#E6BE70"],
  "#E0778C": ["#F6D2DA", "#EAA0B1"],
};
const toWhite = (hex, w) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * w));
  return `rgb(${c.join(",")})`;
};
const tintOf = (accent) => TINTS[accent?.toUpperCase?.()] || [toWhite(accent, 0.66), toWhite(accent, 0.36)];

const TINT_D = "M30 70 C 30 50, 43 37, 60 37 C 77 37, 90 50, 90 70 L 90 90 L 30 90 Z";
const TINT_TIP = "M50 44 C 52 36, 57 30, 62 24 C 64 21.5, 66 20.5, 68.5 21 C 68 27, 69.5 33, 71 39 C 72 42, 71 44, 70 45 Z";
const TINT_TAIL =
  "M30 82 H90 V95 C 88 99, 85 103, 82.5 105 C 80 103, 77 99, 75 96 C 73 99, 70 103, 67.5 105 C 65 103, 62 99, 60 96 C 58 99, 55 103, 52.5 105 C 50 103, 47 99, 45 96 C 43 99, 40 103, 37.5 105 C 35 103, 32 99, 30 95 Z";
const TINT_ARMS = {
  down: ["M32 78 L25 87", "M88 78 L95 87"],
  out: ["M32 75 L21 71", "M88 75 L99 71"],
  up: ["M33 69 L25 56", "M87 69 L95 56"],
  wave: "M88 71 L98 59",
  chin: "M87 84 L79 89",
};

function Tint({ mood = "idle", size, look, accent, face = "dot", label }) {
  const [body] = accent ? tintOf(accent) : TINTS["#7FBF9E"];
  const cyc = accent ? undefined : "ch-tint";
  const [l, r] = pose(TINT_ARMS, mood);
  return (
    <Sticker size={size} label={label}>
      {[
        ["lb-arm-l", "33px 76px", l],
        ["lb-arm-r", "87px 76px", r],
      ].map(([cls, origin, d]) => (
        <g key={cls} className={cls} style={{ transformOrigin: origin }}>
          <path d={d} fill="none" stroke="#fff" strokeWidth="17" strokeLinecap="round" />
          <path className={accent ? undefined : "ch-tint-s"} d={d} fill="none" stroke={body} strokeWidth="9" strokeLinecap="round" />
        </g>
      ))}
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 102px" }}>
        <path className={cyc} d={TINT_D} fill={body} {...EDGE} />
        <g className="lb-top" style={{ transformOrigin: "61px 40px" }}>
          <path className={cyc} d={TINT_TIP} fill={body} {...EDGE} />
        </g>
        <Tail className={cyc} d={TINT_TAIL} color={body} origin="60px 90px" />
        <Refill className={cyc} d={TINT_D} color={body} />
        <Face kind={face} mood={mood} x={60} y={67} look={look} />
      </g>
      <MoodExtras mood={mood} box={[30, 22, 90, 104]} />
    </Sticker>
  );
}

// ---------- B19 · Halo ----------

const HALO = { body: "#F7E0C6", deep: "#E8BC8D", ring: "#E0AA3E" };
const HALO_D = "M32 66 C 32 47, 44 36, 60 36 C 76 36, 88 47, 88 66 L 88 88 L 32 88 Z";
const HALO_ARMS = {
  down: ["M34 74 L28 82", "M86 74 L92 82"],
  out: ["M34 70 L23 67", "M86 70 L97 67"],
  up: ["M35 64 L28 52", "M85 64 L92 52"],
  wave: "M86 66 L96 55",
  chin: "M85 79 L77 83",
};

function Halo({ mood = "idle", size, look, face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={HALO_ARMS} mood={mood} color={HALO.body} width={9} left="35px 71px" right="85px 71px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
        <path d={HALO_D} fill={HALO.body} {...EDGE} />
        <Tail d={hem(32, 88, 78, 95, 3, 6.5)} color={HALO.body} origin="60px 88px" />
        <Refill d={HALO_D} color={HALO.body} />
        <g className="lb-top" style={{ transformOrigin: "60px 36px" }}>
          <ellipse cx="60" cy="22" rx="15" ry="4.6" fill="none" stroke="#fff" strokeWidth="11" />
          <ellipse cx="60" cy="22" rx="15" ry="4.6" fill="none" stroke={HALO.ring} strokeWidth="3.8" />
        </g>
        <Face kind={face} mood={mood} x={60} y={63} look={look} />
      </g>
      <MoodExtras mood={mood} box={[32, 30, 88, 102]} />
    </Sticker>
  );
}

// ---------- B20 · Fluff (a puffier cloud) ----------

const FLUFF = { body: "#F2DBE8", deep: "#DDAAC6" };
const FLUFF_BODY = [[38, 74, 16], [59, 60, 21], [81, 71, 17], [26, 68, 68, 28, 14]];
const FLUFF_UNDER = [[41, 94, 9], [60, 97, 10], [79, 94, 9]];
const FLUFF_HANDS = {
  down: [dot(20, 94), dot(100, 94)],
  out: [dot(11, 80), dot(109, 80)],
  up: [dot(17, 58), dot(103, 58)],
  wave: dot(105, 60),
  chin: dot(79, 92),
};

function Fluff({ mood = "idle", size, look, face = "bead", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={FLUFF_HANDS} mood={mood} color={FLUFF.deep} width={12} left="30px 84px" right="90px 84px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 104px" }}>
        <g className="lb-top" />
        <Puffs shapes={FLUFF_BODY} color={FLUFF.body} />
        <g className="lb-tail" style={{ transformOrigin: "60px 92px" }}>
          <Puffs shapes={FLUFF_UNDER} color={FLUFF.body} />
        </g>
        <Puffs shapes={FLUFF_BODY} color={FLUFF.body} edge={false} />
        <Face kind={face} mood={mood} x={60} y={77} look={look} />
      </g>
      <MoodExtras mood={mood} box={[22, 40, 98, 104]} />
    </Sticker>
  );
}

// ---------- B21 · Sky (its weather follows its mood) ----------

const SKY = { body: "#D3DEF6", deep: "#A2B5E7", sun: "#E0AA3E", drop: "#8CA0DB", moon: "#F2D69A" };
const SKY_BODY = [[31, 80, 12], [45, 64, 17], [75, 64, 17], [89, 80, 12], [22, 66, 76, 32, 16]];
const SKY_HANDS = {
  down: [dot(15, 96), dot(105, 96)],
  out: [dot(8, 80), dot(112, 80)],
  up: [dot(14, 56), dot(106, 56)],
  wave: dot(108, 58),
  chin: dot(80, 94),
};
const STICK_EDGE = { stroke: "#fff", strokeWidth: 7, paintOrder: "stroke", strokeLinejoin: "round" };

// Weather drawn behind the cloud (sun, rainbow, moon) or below it (rain).
function SkyWeather({ mood }) {
  if (mood === "happy") {
    return (
      <g>
        <g stroke="#fff" strokeWidth="9" strokeLinecap="round">
          {[-70, -35, 0, 35].map((a) => (
            <path key={a} d="M0 -17 V-23" transform={`translate(92 44) rotate(${a})`} />
          ))}
        </g>
        <g stroke={SKY.sun} strokeWidth="3.6" strokeLinecap="round">
          {[-70, -35, 0, 35].map((a) => (
            <path key={a} d="M0 -17 V-23" transform={`translate(92 44) rotate(${a})`} />
          ))}
        </g>
        <circle cx="92" cy="44" r="12" fill={SKY.sun} {...STICK_EDGE} />
      </g>
    );
  }
  if (mood === "cheer") {
    const bands = [
      [21, "#E0778C"],
      [15.5, "#E0AA3E"],
      [10, "#7FBF9E"],
    ];
    const arc = (r) => `M${60 - r} 56 A ${r} ${r} 0 0 1 ${60 + r} 56`;
    return (
      <g fill="none">
        <path d={arc(15.5)} stroke="#fff" strokeWidth="25" />
        {bands.map(([r, c]) => (
          <path key={r} d={arc(r)} stroke={c} strokeWidth="5.6" />
        ))}
      </g>
    );
  }
  if (mood === "sleep") {
    return <path d="M26 30 A 11 11 0 1 0 38 44 A 9 9 0 1 1 26 30 Z" fill={SKY.moon} {...STICK_EDGE} />;
  }
  return null;
}

function SkyRain() {
  const drop = (x, y, s) => `M${x} ${y} C ${x + 3 * s} ${y + 5 * s}, ${x + 4 * s} ${y + 8 * s}, ${x} ${y + 10 * s} C ${x - 4 * s} ${y + 8 * s}, ${x - 3 * s} ${y + 5 * s}, ${x} ${y} Z`;
  return (
    <g className="ch-rain" fill={SKY.drop} {...STICK_EDGE}>
      <path d={drop(42, 102, 1.05)} />
      <path d={drop(62, 105, 1.2)} />
      <path d={drop(80, 101, 0.95)} />
    </g>
  );
}

function Sky({ mood = "idle", size, look, face = "dot", label }) {
  // Its own weather stands in for the usual sparkles (cheer) and sweat (oops).
  const extras = mood === "cheer" || mood === "oops" ? null : <MoodExtras mood={mood} box={[20, 46, 100, 98]} />;
  return (
    <Sticker size={size} label={label}>
      <Arms table={SKY_HANDS} mood={mood} color={SKY.deep} width={12} left="28px 84px" right="92px 84px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 100px" }}>
        <g className="lb-top">
          <SkyWeather mood={mood} />
        </g>
        <Puffs shapes={SKY_BODY} color={SKY.body} />
        {mood === "oops" && <SkyRain />}
        <Face kind={face} mood={mood} x={60} y={79} look={look} />
      </g>
      {extras}
    </Sticker>
  );
}

// ---------- B22 · Mist (cloud on top, ghost below) ----------

const MIST = { body: "#D4EAEC", deep: "#98C9CE" };
const MIST_BODY = [[38, 53, 13], [60, 43, 16], [82, 53, 13], [30, 54, 60, 38, 8]];
const MIST_ARMS = {
  down: ["M31 74 L24 83", "M89 74 L96 83"],
  out: ["M31 71 L20 67", "M89 71 L100 67"],
  up: ["M32 65 L24 52", "M88 65 L96 52"],
  wave: "M89 67 L99 55",
  chin: "M88 80 L80 85",
};

function Mist({ mood = "idle", size, look, face = "dot", label }) {
  return (
    <Sticker size={size} label={label}>
      <Arms table={MIST_ARMS} mood={mood} color={MIST.body} width={9} left="32px 72px" right="88px 72px" />
      <g className="lb-feet" />
      <g className="lb-body" style={{ transformOrigin: "60px 101px" }}>
        <g className="lb-top" />
        <Puffs shapes={MIST_BODY} color={MIST.body} />
        <Tail d={hem(30, 90, 82, 95, 4, 6)} color={MIST.body} origin="60px 92px" />
        <Puffs shapes={MIST_BODY} color={MIST.body} edge={false} />
        <Face kind={face} mood={mood} x={60} y={66} look={look} />
      </g>
      <MoodExtras mood={mood} box={[25, 27, 95, 101]} />
    </Sticker>
  );
}

export const DESIGNS = [
  { code: "B01", name: "Bot", blurb: "Today's buddy, for reference", face: "dot", Buddy: Bot },
  { code: "B02", name: "Bean", blurb: "A jellybean with a sprout", face: "bead", Buddy: Bean },
  { code: "B03", name: "Mallow", blurb: "Floaty marshmallow ghost", face: "dot", Buddy: Mallow },
  { code: "B04", name: "Cell", blurb: "A lit game cell come alive", face: "pill", Buddy: Cell },
  { code: "B05", name: "Brainy", blurb: "Memory theme: a happy brain", face: "spark", Buddy: Brainy },
  { code: "B06", name: "Owl", blurb: "Wise owl with googly eyes", face: "ring", Buddy: Owl },
  { code: "B07", name: "Ellie", blurb: "An elephant never forgets", face: "dot", Buddy: Ellie },
  { code: "B08", name: "Kitty", blurb: "Round cat with whiskers", face: "dot", Buddy: Kitty },
  { code: "B09", name: "Star", blurb: "Gold star, points for arms", face: "dot", Buddy: Star },
  { code: "B10", name: "Cloud", blurb: "Soft cloud with floating hands", face: "bead", Buddy: Cloud },
  { code: "B11", name: "Octo", blurb: "A clever octopus", face: "spark", Buddy: Octo },
  { code: "B12", name: "Chameleon", blurb: "Takes each exercise's colour", face: "ring", Buddy: Chameleon },
  { code: "B13", name: "Puff", blurb: "Mallow, rounder and softer", face: "dot", fresh: true, Buddy: Puff },
  { code: "B14", name: "Wisp", blurb: "Teardrop with a curly tail", face: "dot", fresh: true, Buddy: Wisp },
  { code: "B15", name: "Sheet", blurb: "Little sheet ghost with a bow", face: "dot", fresh: true, Buddy: Sheet },
  { code: "B16", name: "Mochi", blurb: "Wide, squishy, sakura leaf", face: "bead", fresh: true, Buddy: Mochi },
  { code: "B17", name: "Dozy", blurb: "Sleepy ghost in a nightcap", face: "dot", fresh: true, Buddy: Dozy },
  { code: "B18", name: "Tint", blurb: "Takes a tint of each exercise", face: "dot", fresh: true, Buddy: Tint },
  { code: "B19", name: "Halo", blurb: "A ghost with a little halo", face: "dot", fresh: true, Buddy: Halo },
  { code: "B20", name: "Fluff", blurb: "Puffier cotton-candy cloud", face: "bead", fresh: true, Buddy: Fluff },
  { code: "B21", name: "Sky", blurb: "Its weather follows its mood", face: "dot", fresh: true, Buddy: Sky },
  { code: "B22", name: "Mist", blurb: "Cloud on top, ghost below", face: "dot", fresh: true, Buddy: Mist },
];

export const designByCode = (code) => DESIGNS.find((d) => d.code === code) || DESIGNS[0];
