import React, { useRef, useState } from "react";
import "./motions.css";
import { useJump } from "./jump.js";
import {
  useTimeline,
  useLoop,
  useRunState,
  MiniBoard,
  Bubble,
  Dots,
  HeartSticker,
  StarSticker,
  TrophySticker,
  Confetti,
  Shadow,
} from "./mini.jsx";

// Motions for the lab. Each entry:
//   code, name, group ("Idle" | "Reactions" | "In the game" | "Transitions"), blurb
//   loop   — true: the stage animates by itself forever; false: it plays once per `run`
//   haptic — true if it vibrates when played (shows a small icon on the card)
//   every  — for one-shots, how often (ms) the lab replays it while it's on screen
//   Stage  — ({ Buddy, run, fx, accent }) => the animated scene
//
// Stage props:
//   Buddy  — the design picked at the top of the lab (any design from characters.jsx);
//            rig its parts by class: lb-all, lb-body, lb-top, lb-arm-l, lb-arm-r, lb-feet,
//            lb-face, lb-eyes.
//   run    — { n, tap }: n increments on every play; key one-shot animations on n so they
//            restart. tap is true when the player pressed play.
//   fx     — fx("clear") plays a game sound/vibration (tap, correct, wrong, clear, record,
//            over, start, count, reveal), or fx({ vibe: [ms…], sound: "correct" }) for a
//            custom pattern. It is silent unless this run came from a tap and the lab's
//            sound/vibration toggles are on, so call it freely at the right moments.
//
// Whole-body moves animate an HTML wrapper (.mo-fig) so they can pick their own pivot;
// part moves (antenna lag, arm wave, jelly body) animate the design's rig groups, which
// carry their own pivots.

// ---------- Shared layout ----------

// The buddy in a wrapper the motion can move. Key it on run.n to restart a one-shot.
function Fig({ Buddy, size = 112, mood = "idle", look, accent, className = "", style, children }) {
  return (
    <div className={`mo-fig ${className}`} style={{ width: size, height: size, ...style }}>
      <Buddy mood={mood} size={size} look={look} accent={accent} />
      {children}
    </div>
  );
}

// The buddy standing on the stage floor, with a ground shadow that stays put.
function Stand({ children, shadow = 70, shadowClass = "", lift = 24, runKey }) {
  return (
    <div className="mo-ground" style={{ paddingBottom: lift }}>
      <div className="mo-stand">
        <Shadow key={`shadow-${runKey}`} className={shadowClass} width={shadow} />
        {children}
      </div>
    </div>
  );
}

// Sticker-cell look-at helper: a unit vector from the buddy's face to a point, stretched
// vertically so up/down glances read on a face that is mostly looking sideways.
const lookAt = (from, to, r = 3.4) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const d = Math.hypot(dx, dy) || 1;
  return [(dx / d) * r, Math.max(-3, Math.min(3, (dy / d) * r * 2.4))];
};

// ---------- Idle ----------

function Breathe({ Buddy, accent }) {
  return (
    <div className="mo-center">
      <div className="mo-breathe">
        <Buddy mood="idle" size={120} accent={accent} />
      </div>
    </div>
  );
}

function Glance({ Buddy, accent }) {
  const [look, setLook] = useState([0, 0]);
  useLoop(6400, () => [
    [0, () => setLook([0, 0])],
    [1300, () => setLook([-3.2, 0.3])],
    [2300, () => setLook([0, 0])],
    [3400, () => setLook([3.2, -1.6])],
    [4200, () => setLook([3, 1.2])],
    [5000, () => setLook([0, 0])],
  ]);
  return (
    <Stand>
      <Fig Buddy={Buddy} accent={accent} look={look} className="mo-tilt" style={{ "--tilt": `${look[0] * 1.1}deg` }} />
    </Stand>
  );
}

function Sway({ Buddy, accent }) {
  return (
    <Stand>
      <Fig Buddy={Buddy} accent={accent} className="mo-sway" />
    </Stand>
  );
}

function Float({ Buddy, accent }) {
  return (
    <Stand shadowClass="mo-float-shadow" lift={30}>
      <Fig Buddy={Buddy} accent={accent} className="mo-float" />
    </Stand>
  );
}

// A varied idle: look around, stretch, doze off, wake with a start.
function Fidget({ Buddy, accent }) {
  const [s, set] = useState({ mood: "idle", look: [0, 0], pose: "" });
  useLoop(10400, () => [
    [0, () => set({ mood: "idle", look: [0, 0], pose: "" })],
    [1500, () => set({ mood: "idle", look: [-3.2, 0], pose: "" })],
    [2300, () => set({ mood: "idle", look: [3.2, 0], pose: "" })],
    [3100, () => set({ mood: "idle", look: [0, 0], pose: "" })],
    [4000, () => set({ mood: "happy", look: [0, 0], pose: "stretch" })],
    [5300, () => set({ mood: "idle", look: [0, 0], pose: "" })],
    [6600, () => set({ mood: "sleep", look: [0, 0], pose: "doze" })],
    [8500, () => set({ mood: "watch", look: [0, 0], pose: "jolt" })],
    [9300, () => set({ mood: "idle", look: [0, 0], pose: "" })],
  ]);
  return (
    <Stand>
      <Fig Buddy={Buddy} accent={accent} mood={s.mood} look={s.look} className={`mo-fidget ${s.pose}`} />
    </Stand>
  );
}

// ---------- Reactions ----------

// The same jump with and without squash, so the two can be compared.
function makeHop(squash) {
  return function Hop({ Buddy, run, fx, accent }) {
    const [mood, setMood] = useRunState(run.n, run.n ? "happy" : "idle");
    useTimeline(run.n, () => [
      [80, () => fx({ sound: "correct" })],
      [470, () => fx({ vibe: 14 })],
      [950, () => setMood("idle")],
    ]);
    return (
      <Stand runKey={run.n} shadowClass={run.n ? "mo-hop-shadow" : ""}>
        <Fig key={run.n} Buddy={Buddy} accent={accent} mood={mood} className={run.n ? (squash ? "mo-hop" : "mo-hop-flat") : ""} />
      </Stand>
    );
  };
}

function Wiggle({ Buddy, run, fx, accent }) {
  const [mood, setMood] = useRunState(run.n, run.n ? "happy" : "idle");
  useTimeline(run.n, () => [
    [0, () => fx("correct")],
    [900, () => setMood("idle")],
  ]);
  return (
    <Stand>
      <Fig key={run.n} Buddy={Buddy} accent={accent} mood={mood} className={run.n ? "mo-wiggle" : ""} />
    </Stand>
  );
}

// A nod for every correct tap: three cells go green, one nod each.
function Nod({ Buddy, run, fx, accent }) {
  const [done, setDone] = useRunState(run.n, 0);
  useTimeline(run.n, () => [
    ...[0, 1, 2].map((i) => [250 + i * 480, () => (setDone(i + 1), fx({ vibe: 8, sound: "correct" }))]),
    [2700, () => setDone(0)],
  ]);
  const targets = [1, 4, 6];
  const cells = Array.from({ length: 9 }, (_, i) => (targets.slice(0, done).includes(i) ? "ok" : "idle"));
  return (
    <div className="mo-box">
      <MiniBoard cells={cells} className="mo-box-board" />
      <div className="mo-box-buddy">
        <Fig key={`${run.n}-${done}`} Buddy={Buddy} accent={accent} mood={done ? "happy" : "watch"} look={[-3, 0]} className={done ? "mo-nod" : ""} />
      </div>
    </div>
  );
}

function Flip({ Buddy, run, fx, accent }) {
  const [mood, setMood] = useRunState(run.n, run.n ? "cheer" : "idle");
  useTimeline(run.n, () => [
    [0, () => fx("clear")],
    [760, () => fx({ vibe: 14 })],
    [1300, () => setMood("idle")],
  ]);
  return (
    <Stand runKey={run.n} shadowClass={run.n ? "mo-flip-shadow" : ""}>
      <Fig key={run.n} Buddy={Buddy} accent={accent} mood={mood} className={run.n ? "mo-flip" : ""} />
    </Stand>
  );
}

function Shake({ Buddy, run, fx, accent }) {
  const [mood, setMood] = useRunState(run.n, run.n ? "oops" : "idle");
  useTimeline(run.n, () => [
    [0, () => fx("wrong")],
    [1400, () => setMood("idle")],
  ]);
  return (
    <Stand>
      <Fig key={run.n} Buddy={Buddy} accent={accent} mood={mood} className={run.n ? "mo-shake" : ""} />
      <MiniBoard n={1} cell={34} cells={[mood === "oops" ? "bad" : "idle"]} className="mo-side" />
    </Stand>
  );
}

function Jelly({ Buddy, run, fx, accent }) {
  const [mood, setMood] = useRunState(run.n, run.n ? "oops" : "idle");
  useTimeline(run.n, () => [
    [0, () => fx("wrong")],
    [1300, () => setMood("idle")],
  ]);
  return (
    <Stand>
      <Fig key={run.n} Buddy={Buddy} accent={accent} mood={mood} className={run.n ? "mo-jelly" : ""} />
    </Stand>
  );
}

const HEARTS = [
  { x: -46, y: -96, d: 0, s: 26 },
  { x: 40, y: -112, d: 130, s: 22 },
  { x: -8, y: -128, d: 260, s: 30 },
  { x: 58, y: -70, d: 390, s: 18 },
];

function Hearts({ Buddy, run, fx, accent }) {
  const [mood, setMood] = useRunState(run.n, run.n ? "happy" : "idle");
  useTimeline(run.n, () => [
    [0, () => fx({ vibe: [8, 70, 8], sound: "correct" })],
    [1500, () => setMood("idle")],
  ]);
  return (
    <Stand>
      <Fig key={run.n} Buddy={Buddy} accent={accent} mood={mood} className={run.n ? "mo-bounce" : ""}>
        {run.n > 0 &&
          HEARTS.map((h, i) => (
            <span key={i} className="mo-heart" style={{ "--x": `${h.x}px`, "--y": `${h.y}px`, animationDelay: `${h.d}ms` }}>
              <HeartSticker size={h.s} />
            </span>
          ))}
      </Fig>
    </Stand>
  );
}

// Down to the last heart: a nervous tremble now and then, and a beating heart beside.
function Tremble({ Buddy, run, fx, accent }) {
  useTimeline(run.n, () => [[0, () => fx({ vibe: [16, 110, 22] })]]);
  return (
    <Stand>
      <Fig Buddy={Buddy} accent={accent} mood="oops" className="mo-tremble" />
      <span className="mo-side mo-lastheart">
        <HeartSticker size={34} />
      </span>
    </Stand>
  );
}

// Tapping the buddy gets one of four giggles in turn.
const TICKLES = [
  { cls: "mo-wiggle", mood: "happy" },
  { cls: "mo-hop-flat", mood: "cheer" },
  { cls: "mo-flip", mood: "happy" },
  { cls: "mo-bounce", mood: "happy", hearts: true },
];

function Tickle({ Buddy, run, fx, accent }) {
  const t = TICKLES[(run.n - 1 + TICKLES.length) % TICKLES.length];
  const [mood, setMood] = useRunState(run.n, run.n ? t.mood : "idle");
  useTimeline(run.n, () => [
    [0, () => fx({ vibe: [8, 40, 8], sound: "tap" })],
    [1200, () => setMood("idle")],
  ]);
  return (
    <Stand>
      <Fig key={run.n} Buddy={Buddy} accent={accent} mood={mood} className={run.n ? t.cls : ""}>
        {run.n > 0 &&
          t.hearts &&
          HEARTS.slice(0, 3).map((h, i) => (
            <span key={i} className="mo-heart" style={{ "--x": `${h.x}px`, "--y": `${h.y}px`, animationDelay: `${h.d}ms` }}>
              <HeartSticker size={h.s} />
            </span>
          ))}
      </Fig>
    </Stand>
  );
}

// ---------- In the game ----------

// Scene geometry for the board-and-buddy stages (see .mo-box in motions.css).
const BOX = { board: [11, 48], cell: 30, gap: 7, face: [196, 109] };
const cellCentre = (i) => [
  BOX.board[0] + (i % 3) * (BOX.cell + BOX.gap) + BOX.cell / 2,
  BOX.board[1] + Math.floor(i / 3) * (BOX.cell + BOX.gap) + BOX.cell / 2,
];
const SEQS = [
  [0, 4, 8, 5],
  [2, 4, 6, 1],
  [6, 3, 0, 1],
  [8, 7, 4, 2],
];

// The buddy's eyes follow each cell as a sequence lights up, then it's your turn.
function Track({ Buddy, run, fx, accent }) {
  const seq = SEQS[(run.n + 3) % SEQS.length];
  const [s, set] = useRunState(run.n, { lit: -1, step: -1, mood: "idle", look: [-2.4, 0], turn: false });
  const STEP = 560;
  useTimeline(run.n, () => [
    [0, () => set({ lit: -1, step: -1, mood: "watch", look: lookAt(BOX.face, cellCentre(4)), turn: false })],
    ...seq.flatMap((cell, i) => [
      [300 + i * STEP, () => (set({ lit: cell, step: i, mood: "watch", look: lookAt(BOX.face, cellCentre(cell)), turn: false }), fx({ vibe: 6, sound: "reveal" }))],
      [300 + i * STEP + 400, () => set((p) => ({ ...p, lit: -1 }))],
    ]),
    [300 + seq.length * STEP, () => set({ lit: -1, step: -1, mood: "think", look: [0, 0], turn: true })],
    [300 + seq.length * STEP + 1500, () => set({ lit: -1, step: -1, mood: "idle", look: [-2.4, 0], turn: false })],
  ]);
  const cells = Array.from({ length: 9 }, (_, i) => (i === s.lit ? { tone: "seq", label: String(s.step + 1) } : "idle"));
  return (
    <div className="mo-box">
      <MiniBoard cells={cells} className="mo-box-board" />
      <div className="mo-box-buddy">
        <Fig Buddy={Buddy} accent={accent} mood={s.mood} look={s.look} className="mo-tilt" style={{ "--tilt": `${s.look[1] * 2.2}deg` }} />
      </div>
      {s.turn && (
        <Bubble tail="down" className="mo-box-bubble">
          Your turn
        </Bubble>
      )}
    </div>
  );
}

function Countdown({ Buddy, run, fx, accent }) {
  const [s, set] = useRunState(run.n, { sign: null, mood: "idle", hop: false });
  useTimeline(run.n, () => [
    ...["3", "2", "1"].map((v, i) => [i * 560, () => (set({ sign: v, mood: "watch", hop: false }), fx("count"))]),
    [1680, () => (set({ sign: "Go!", mood: "happy", hop: true }), fx("start"))],
    [2700, () => set({ sign: null, mood: "idle", hop: false })],
  ]);
  return (
    <Stand lift={18}>
      {s.sign && (
        <span key={s.sign} className={`mo-sign${s.sign === "Go!" ? " go" : ""}`}>
          {s.sign}
        </span>
      )}
      <Fig key={s.hop ? `hop-${run.n}` : "still"} Buddy={Buddy} size={104} accent={accent} mood={s.mood} className={s.hop ? "mo-hop-flat" : ""} />
    </Stand>
  );
}

function RoundClear({ Buddy, run, fx, accent }) {
  const [s, set] = useRunState(run.n, { last: false, clear: false, mood: "idle" });
  useTimeline(run.n, () => [
    [0, () => set({ last: false, clear: false, mood: "watch" })],
    [220, () => (set({ last: true, clear: false, mood: "happy" }), fx({ vibe: 8, sound: "correct" }))],
    [480, () => (set({ last: true, clear: true, mood: "cheer" }), fx("clear"))],
    [2200, () => set({ last: false, clear: false, mood: "idle" })],
  ]);
  const pattern = [0, 4, 5, 7];
  const shown = run.n ? (s.last ? pattern : pattern.slice(0, 3)) : [];
  const cells = Array.from({ length: 9 }, (_, i) => (shown.includes(i) ? "ok" : "idle"));
  return (
    <div className="mo-box">
      <div className="mo-box-board">
        <MiniBoard cells={cells} />
        {s.clear && <span key={run.n} className="mo-board-ring" />}
        {s.clear && (
          <span key={`star-${run.n}`} className="mo-stamp">
            <StarSticker size={42} />
          </span>
        )}
      </div>
      <div className="mo-box-buddy">
        <Fig key={s.clear ? `c-${run.n}` : "still"} Buddy={Buddy} accent={accent} mood={s.mood} look={s.clear ? undefined : [-3, 0]} className={s.clear ? "mo-hop-flat" : ""} />
      </div>
    </div>
  );
}

function NewRecord({ Buddy, run, fx, accent }) {
  const [on, setOn] = useRunState(run.n, run.n > 0);
  useTimeline(run.n, () => [
    [0, () => fx("record")],
    [2600, () => setOn(false)],
  ]);
  return (
    <>
      {on && <Confetti key={run.n} seed={run.n} />}
      <Stand lift={16}>
        {on && (
          <span key={`t-${run.n}`} className="mo-trophy">
            <TrophySticker size={50} />
          </span>
        )}
        <Fig key={run.n} Buddy={Buddy} size={104} accent={accent} mood={on ? "cheer" : "idle"} className={on ? "mo-hop-flat" : ""} />
      </Stand>
      {on && (
        <Bubble key={`b-${run.n}`} gold tail="down" className="mo-record-bubble">
          New best!
        </Bubble>
      )}
    </>
  );
}

function GameOver({ Buddy, run, fx, accent }) {
  const [s, set] = useRunState(run.n, { lost: false, mood: "idle", say: false });
  useTimeline(run.n, () => [
    [0, () => set({ lost: false, mood: "oops", say: false })],
    [260, () => (set({ lost: true, mood: "oops", say: false }), fx("over"))],
    [900, () => set({ lost: true, mood: "gentle", say: true })],
    [3000, () => set({ lost: false, mood: "idle", say: false })],
  ]);
  return (
    <>
      <div className="mo-hearts-row" aria-hidden="true">
        <span className="mo-heart-slot">
          <HeartSticker size={26} color="#DCE0EA" />
        </span>
        <span className="mo-heart-slot">
          <HeartSticker size={26} color="#DCE0EA" />
        </span>
        <span className="mo-heart-slot">
          <HeartSticker size={26} color="#DCE0EA" />
          <span className={`mo-heart-fill${s.lost ? " gone" : ""}`}>
            <HeartSticker size={26} />
          </span>
        </span>
      </div>
      <div className="mo-over-row">
        <Fig Buddy={Buddy} size={104} accent={accent} mood={s.mood} className={s.mood === "gentle" ? "mo-wave" : ""} />
        <Bubble tail="left" className={`mo-over-bubble${s.say ? " on" : ""}`}>
          Next time!
        </Bubble>
      </div>
    </>
  );
}

function Speech({ Buddy, run, fx, accent }) {
  const [s, set] = useRunState(run.n, { phase: "none", mood: "idle" });
  useTimeline(run.n, () => [
    [0, () => set({ phase: "typing", mood: "think" })],
    [950, () => (set({ phase: "text", mood: "happy" }), fx({ vibe: 8, sound: "tap" }))],
    [2700, () => set({ phase: "none", mood: "idle" })],
  ]);
  return (
    <div className="mo-speech">
      <Fig Buddy={Buddy} size={100} accent={accent} mood={s.mood} />
      <div className="mo-speech-slot">
        {s.phase !== "none" && (
          <Bubble key={`${run.n}-${s.phase}`} tail="left">
            {s.phase === "typing" ? <Dots /> : "Your turn!"}
          </Bubble>
        )}
      </div>
    </div>
  );
}

// ---------- Transitions ----------

function PeekIn({ Buddy, run, fx, accent }) {
  const [s, set] = useRunState(run.n, { mood: run.n ? "watch" : "idle", look: [0, 0] });
  useTimeline(run.n, () => [
    [480, () => set({ mood: "watch", look: [-3.2, 0] })],
    [820, () => set({ mood: "watch", look: [3.2, 0] })],
    [1120, () => (set({ mood: "happy", look: [0, 0] }), fx({ vibe: 10, sound: "tap" }))],
    [2300, () => set({ mood: "idle", look: [0, 0] })],
  ]);
  return (
    <div className="mo-ground" style={{ paddingBottom: 0 }}>
      <Fig key={run.n} Buddy={Buddy} size={120} accent={accent} mood={s.mood} look={s.look} className={run.n ? "mo-peek" : ""} />
    </div>
  );
}

function WalkIn({ Buddy, run, fx, accent }) {
  const [mood, setMood] = useRunState(run.n, "idle");
  useTimeline(run.n, () => [
    [0, () => fx({ vibe: [5, 300, 5, 300, 5, 300, 5] })],
    [1350, () => setMood("gentle")],
    [2600, () => setMood("idle")],
  ]);
  return (
    <div className="mo-ground" style={{ paddingBottom: 24 }}>
      <div key={run.n} className={`mo-stand${run.n ? " mo-walk" : ""}`}>
        <Shadow width={70} />
        <Fig Buddy={Buddy} accent={accent} mood={mood} className={run.n ? "mo-step" : ""} />
      </div>
    </div>
  );
}

function Slap({ Buddy, run, fx, accent }) {
  useTimeline(run.n, () => [[620, () => fx({ vibe: 16, sound: "tap" })]]);
  return (
    <Stand runKey={run.n} shadowClass={run.n ? "mo-slap-shadow" : ""}>
      <Fig key={run.n} Buddy={Buddy} accent={accent} mood="happy" className={run.n ? "mo-slap" : ""}>
        {run.n > 0 && (
          <span className="mo-puffs" aria-hidden="true">
            {[160, 192, 348, 20].map((a) => (
              <i key={a} style={{ "--a": `${a}deg` }} />
            ))}
          </span>
        )}
      </Fig>
    </Stand>
  );
}

// ---------- Physics jumps (round 2) ----------

// These use the jump engine in jump.js: the body follows a simulated path and every rig
// part (arms, antenna, face, skirt, feet) follows it on its own spring. The engine owns
// the buddy's mood while it plays, so pose changes swing instead of snapping.

// The buddy in a wrapper the engine can rig.
function RigFig({ Buddy, figRef, size = 112, mood, look, accent, children }) {
  return (
    <div ref={figRef} className="mo-fig" style={{ width: size, height: size }}>
      <Buddy mood={mood} size={size} look={look} accent={accent} />
      {children}
    </div>
  );
}

// Dust that puffs out along the ground at touchdown, bigger for a harder landing.
const PUFF = [
  [-1, 0],
  [-1, 1],
  [1, 0],
  [1, 1],
];

function Dust({ impact = 1 }) {
  const s = Math.max(0.55, Math.min(1.15, impact));
  return (
    <span className="mo-dust" aria-hidden="true">
      {PUFF.map(([side, up]) => (
        <i
          key={`${side}${up}`}
          style={{ "--dx": `${side * (36 + up * 10) * s}px`, "--dy": `${-(2 + up * 8) * s}px`, "--s": s, "--d": `${up * 50}ms` }}
        />
      ))}
    </span>
  );
}

// Sparkles flung out from the buddy at the top of a star jump.
const BURST = [
  [-160, "#E0AA3E"],
  [-110, "#E0778C"],
  [-70, "#7FBF9E"],
  [-20, "#8CA0DB"],
  [200, "#A898E0"],
  [20, "#E0AA3E"],
];

function Burst() {
  return (
    <span className="mo-burst" aria-hidden="true">
      {BURST.map(([a, c]) => (
        <svg key={a} viewBox="-8 -8 16 16" width="16" height="16" style={{ "--a": `${a}deg` }}>
          <path d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" fill={c} stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" paintOrder="stroke" />
        </svg>
      ))}
    </span>
  );
}

// Landing dust and apex sparkles for a stage: call `onEvent` from useJump.
function useJumpFx(n) {
  const [s, set] = useRunState(n, { land: 0, impact: 1, apex: 0 });
  const onEvent = (e) => {
    if (e.type === "land" && e.impact > 0.5) set((v) => ({ ...v, land: v.land + 1, impact: e.impact }));
    if (e.type === "apex") set((v) => ({ ...v, apex: v.apex + 1 }));
  };
  return [s, onEvent];
}

// A jump on the stage floor. `burst` adds sparkles at each apex.
function makeJump(motion, { burst = false } = {}) {
  return function Jump({ Buddy, run, fx, accent }) {
    const ref = useRef(null);
    const [mood, setMood] = useRunState(run.n, "idle");
    const [jf, onEvent] = useJumpFx(run.n);
    useJump(run.n, ref, motion, { setMood, fx, onEvent });
    return (
      <Stand runKey={run.n}>
        {jf.land > 0 && <Dust key={`d-${run.n}-${jf.land}`} impact={jf.impact} />}
        <RigFig key={run.n} figRef={ref} Buddy={Buddy} accent={accent} mood={mood}>
          {burst && jf.apex > 0 && <Burst key={`b-${run.n}-${jf.apex}`} />}
        </RigFig>
      </Stand>
    );
  };
}

const quiet = [null, null, null];

const BOING = {
  hops: [{ h: 46, g: 1750, hang: 0.22, fx: [{ sound: "correct", vibe: 8 }, { vibe: 14 }] }],
  settle: 0.9,
  endAfter: 0.5,
};

const DOUBLE = {
  hops: [
    { h: 26, crouch: 0.13, g: 2300, hang: 0.1, arms: [-12, 18], mood: ["happy", "happy", null], fx: [{ sound: "correct", vibe: 8 }, { vibe: 10 }] },
    { h: 54, crouch: 0.07, depth: 0.04, g: 1900, hang: 0.4, twirl: 360, mood: [null, "cheer", "happy"], fx: [{ sound: "correct", vibe: 8 }, { vibe: 16 }] },
  ],
  settle: 0.9,
  endAfter: 0.55,
};

const FLOATY = {
  hops: [
    {
      h: 58,
      crouch: 0.2,
      depth: 0.08,
      g: 1300,
      hang: 0.5,
      float: 1,
      sway: 12,
      stretch: 0.06,
      arms: [-10, 22],
      mood: ["happy", "happy", "happy"],
      fx: [{ sound: "correct", vibe: 8 }, { vibe: 8 }],
    },
  ],
  settle: 1,
  endAfter: 0.6,
};

const TUCK = {
  hops: [{ h: 64, crouch: 0.18, depth: 0.13, g: 1700, hang: 0.2, spin: -360, tuck: 1, mood: ["happy", "happy", "cheer"], fx: ["clear", { vibe: 16 }] }],
  settle: 0.9,
  endAfter: 0.8,
};

const STAR = {
  hops: [{ h: 50, star: 1, hang: 0.5, arms: [-26, 4], mood: ["happy", "happy", "happy"], fx: [{ sound: "correct", vibe: 8 }, { vibe: 14 }] }],
  settle: 0.9,
  endAfter: 0.5,
};

const BOUNCY = {
  hops: [
    { h: 36, crouch: 0.12, depth: 0.1, g: 2000, hang: 0.15, mood: ["happy", "cheer", null], fx: [{ sound: "correct", vibe: 8 }, { vibe: 12 }] },
    { h: 21, crouch: 0.05, depth: 0.03, g: 2400, hang: 0, mood: quiet, fx: [null, { vibe: 9 }] },
    { h: 10, crouch: 0.04, depth: 0.02, g: 2400, hang: 0, mood: [null, null, "happy"], fx: [null, { vibe: 6 }] },
  ],
  settle: 0.9,
  endAfter: 0.5,
};

// Round clear, with the last cell going green just before the takeoff.
const CLEAR_JUMP = {
  delay: 0.3,
  cues: [
    [0.01, "watch"],
    [0.22, "happy"],
  ],
  hops: [
    { h: 42, mood: ["happy", "cheer", "happy"], fx: [null, { vibe: 14 }] },
    { h: 13, crouch: 0.05, depth: 0.03, mood: quiet, fx: [null, { vibe: 8 }] },
  ],
  settle: 0.9,
  endAfter: 0.7,
};

function RoundClear2({ Buddy, run, fx, accent }) {
  const ref = useRef(null);
  const [mood, setMood] = useRunState(run.n, "idle");
  const [s, set] = useRunState(run.n, { last: false, clear: false });
  const [jf, onEvent] = useJumpFx(run.n);
  useTimeline(run.n, () => [
    [220, () => (set({ last: true, clear: false }), fx({ vibe: 8, sound: "correct" }))],
    [470, () => (set({ last: true, clear: true }), fx("clear"))],
    [2400, () => set({ last: false, clear: false })],
  ]);
  useJump(run.n, ref, CLEAR_JUMP, { setMood, fx, onEvent });
  const pattern = [0, 4, 5, 7];
  const shown = run.n ? (s.last ? pattern : pattern.slice(0, 3)) : [];
  const cells = Array.from({ length: 9 }, (_, i) => (shown.includes(i) ? "ok" : "idle"));
  return (
    <div className="mo-box">
      <div className="mo-box-board">
        <MiniBoard cells={cells} />
        {s.clear && <span key={run.n} className="mo-board-ring" />}
        {s.clear && (
          <span key={`star-${run.n}`} className="mo-stamp">
            <StarSticker size={42} />
          </span>
        )}
      </div>
      <div className="mo-box-buddy">
        <div className="mo-stand">
          <Shadow key={`shadow-${run.n}`} width={64} />
          {jf.land > 0 && <Dust key={`d-${run.n}-${jf.land}`} impact={jf.impact} />}
          <RigFig key={run.n} figRef={ref} Buddy={Buddy} accent={accent} mood={mood} look={s.clear ? undefined : [-3, 0]} />
        </div>
      </div>
    </div>
  );
}

const RECORD_JUMP = {
  hops: [
    { h: 62, crouch: 0.2, depth: 0.13, g: 1400, hang: 0.6, arms: [-16, -4], mood: ["happy", "cheer", "cheer"], fx: [null, { vibe: [18, 40, 12] }] },
    { h: 13, crouch: 0.05, depth: 0.03, mood: quiet, fx: [null, { vibe: 8 }] },
  ],
  settle: 1,
  endAfter: 1.3,
};

function NewRecord2({ Buddy, run, fx, accent }) {
  const ref = useRef(null);
  const [mood, setMood] = useRunState(run.n, "idle");
  const [on, setOn] = useRunState(run.n, run.n > 0);
  const [jf, onEvent] = useJumpFx(run.n);
  useTimeline(run.n, () => [
    [0, () => fx("record")],
    [2800, () => setOn(false)],
  ]);
  useJump(run.n, ref, RECORD_JUMP, { setMood, fx, onEvent });
  return (
    <>
      {on && <Confetti key={run.n} seed={run.n} />}
      <Stand runKey={run.n} lift={16}>
        {jf.land > 0 && <Dust key={`d-${run.n}-${jf.land}`} impact={jf.impact} />}
        <RigFig key={run.n} figRef={ref} Buddy={Buddy} size={104} accent={accent} mood={mood}>
          {on && (
            <span key={`t-${run.n}`} className="mo-trophy">
              <TrophySticker size={50} />
            </span>
          )}
        </RigFig>
      </Stand>
      {on && (
        <Bubble key={`b-${run.n}`} gold tail="down" className="mo-record-bubble">
          New best!
        </Bubble>
      )}
    </>
  );
}

export const MOTIONS = [
  { code: "M01", name: "Breathe", group: "Idle", blurb: "A slow rise and fall while waiting", loop: true, Stage: Breathe },
  { code: "M02", name: "Glance", group: "Idle", blurb: "Looks around between blinks", loop: true, Stage: Glance },
  { code: "M03", name: "Sway", group: "Idle", blurb: "Rocks gently; antenna lags behind", loop: true, Stage: Sway },
  { code: "M04", name: "Float", group: "Idle", blurb: "Hovers over its shadow", loop: true, Stage: Float },
  { code: "M05", name: "Fidget", group: "Idle", blurb: "Looks, stretches, dozes, jolts awake", loop: true, Stage: Fidget },
  { code: "M06", name: "Hop", group: "Reactions", blurb: "Correct tap, with landing squash", haptic: true, Stage: makeHop(true) },
  { code: "M07", name: "Hop, no squash", group: "Reactions", blurb: "Same hop, body never squashes", haptic: true, Stage: makeHop(false) },
  { code: "M08", name: "Wiggle", group: "Reactions", blurb: "Happy shimmy after a good round", haptic: true, Stage: Wiggle },
  { code: "M09", name: "Nod", group: "Reactions", blurb: "One nod per correct tap", haptic: true, every: 4200, Stage: Nod },
  { code: "M10", name: "Flip", group: "Reactions", blurb: "Backflip when a round clears", haptic: true, Stage: Flip },
  { code: "M11", name: "Oops shake", group: "Reactions", blurb: "Head shake on a wrong tap", haptic: true, Stage: Shake },
  { code: "M12", name: "Jelly", group: "Reactions", blurb: "Jelly wobble on a wrong tap", haptic: true, Stage: Jelly },
  { code: "M13", name: "Hearts", group: "Reactions", blurb: "Hearts float up on a streak", haptic: true, Stage: Hearts },
  { code: "M14", name: "Tremble", group: "Reactions", blurb: "Nervous on the last heart", haptic: true, loop: true, Stage: Tremble },
  { code: "M15", name: "Tickle", group: "Reactions", blurb: "Tap the buddy for a giggle", haptic: true, every: 3000, Stage: Tickle },
  { code: "M16", name: "Eye tracking", group: "In the game", blurb: "Eyes follow each lit cell", haptic: true, every: 5600, Stage: Track },
  { code: "M17", name: "Countdown", group: "In the game", blurb: "Holds up 3-2-1 before a run", haptic: true, every: 4600, Stage: Countdown },
  { code: "M18", name: "Round clear", group: "In the game", blurb: "Last cell, star stamp, jump", haptic: true, every: 4000, Stage: RoundClear },
  { code: "M19", name: "New record", group: "In the game", blurb: "Trophy up, confetti, gold bubble", haptic: true, every: 4600, Stage: NewRecord },
  { code: "M20", name: "Game over", group: "In the game", blurb: "Last heart goes; a kind wave", haptic: true, every: 4600, Stage: GameOver },
  { code: "M21", name: "Speech bubble", group: "In the game", blurb: "Typing dots, then the cue", haptic: true, every: 4000, Stage: Speech },
  { code: "M22", name: "Peek in", group: "Transitions", blurb: "Rises into view on a new screen", haptic: true, every: 4200, Stage: PeekIn },
  { code: "M23", name: "Walk in", group: "Transitions", blurb: "Strolls in, stops, waves", haptic: true, every: 4600, Stage: WalkIn },
  { code: "M24", name: "Sticker slap", group: "Transitions", blurb: "Lifts off the page, slaps down", haptic: true, Stage: Slap },
  { code: "M25", name: "Boing hop", group: "Reactions", blurb: "Correct tap: crouch, spring, settle", haptic: true, fresh: true, every: 3200, Stage: makeJump(BOING) },
  { code: "M26", name: "Double hop", group: "Reactions", blurb: "Yay-yay! The second one twirls", haptic: true, fresh: true, every: 3600, Stage: makeJump(DOUBLE) },
  { code: "M27", name: "Floaty hop", group: "Reactions", blurb: "Hangs up top, drifts down", haptic: true, fresh: true, every: 4000, Stage: makeJump(FLOATY) },
  { code: "M28", name: "Tuck flip", group: "Reactions", blurb: "Curls up, flips, lands ta-da", haptic: true, fresh: true, every: 3800, Stage: makeJump(TUCK) },
  { code: "M29", name: "Star jump", group: "Reactions", blurb: "Flings wide at the top, sparkles", haptic: true, fresh: true, every: 3400, Stage: makeJump(STAR, { burst: true }) },
  { code: "M30", name: "Bouncy", group: "Reactions", blurb: "Three happy bounces, like a spring", haptic: true, fresh: true, every: 3600, Stage: makeJump(BOUNCY) },
  { code: "M31", name: "Round clear, new jump", group: "In the game", blurb: "Last cell, star stamp, a real jump", haptic: true, fresh: true, every: 4200, Stage: RoundClear2 },
  { code: "M32", name: "New record, new jump", group: "In the game", blurb: "Trophy up, a big floaty leap", haptic: true, fresh: true, every: 4800, Stage: NewRecord2 },
];
