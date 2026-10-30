import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";

// Physics for the lab's jumps. A jump is simulated once (crouch, push, a ballistic flight
// with hang near the apex, impact, settle), then sampled into Web Animations keyframes,
// one track per rig part. The body's path is the only thing that's scripted: the arms,
// antenna, face, skirt and feet are damped springs pushed around by the body's
// acceleration, so they lag on takeoff, float at the top and flop on landing by
// themselves. That follow-through is what keeps the buddy from moving as one block.
//
// Mood changes (which swap arm poses) happen at the moments the motion asks for. Each
// swap measures the arms before and after and adds a spring that swings them from the
// old pose to the new one, so a pose never snaps.

const TAU = Math.PI * 2;
const DT = 1 / 240; // simulation step, s
const SAMPLE = 4; // a keyframe every 4 steps: 60 per second

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const easeInOut = (t) => {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};
const r2 = (v) => Math.round(v * 100) / 100;

// A damped spring at frequency f (Hz) and damping ratio z.
function spring(f, z) {
  const w = TAU * f;
  return {
    x: 0,
    v: 0,
    step(target, force = 0) {
      this.v += (-w * w * (this.x - target) - 2 * z * w * this.v + force) * DT;
      this.x += this.v * DT;
      return this.x;
    },
  };
}

// One hop. Heights, gravity and sway are px for a 112px buddy and scale with its size;
// squash is a fraction; angles are degrees.
const HOP = {
  h: 44, // apex height
  crouch: 0.15, // anticipation, s
  depth: 0.11, // squash at the bottom of the crouch
  push: 0.06, // legs pushing off, s
  g: 1500, // gravity, px/s²
  hang: 0.35, // 0–0.8: how much gravity eases off around the apex
  float: 0, // 0–1: a buoyant fall, with less gravity and air drag
  sway: 0, // px of side-to-side drift on the way down (with float)
  spin: 0, // in-plane spin about the middle over the flight (a flip)
  twirl: 0, // turn about the vertical axis, like a paper sticker turning
  tilt: 0, // lean held through the air
  tuck: 0, // 0–1: curl up mid-flight (arms in, body round), open before landing
  star: 0, // 0–1: arms and feet flung wide at the apex
  stretch: 0.09, // stretch at full speed
  arms: [-14, -18], // arm raise in the crouch and in the air, on top of the mood's pose (cheer's is up: open it to a V)
  mood: ["happy", "cheer", "happy"], // crouch, air, landing; null keeps the current one
  fx: [null, null], // fx() arguments at takeoff and at landing
};

// Gravity eases off while the vertical speed is low, so the buddy hangs at the top.
const gravity = (p, vy, v0) => p.g * (1 - p.hang * Math.exp(-((vy / (0.42 * v0)) ** 2)));

// Acceleration in the air: on a buoyant fall, gravity is weaker and drag sets a slow
// terminal speed.
function airAccel(p, vy, v0) {
  let a = -gravity(p, vy, v0);
  if (p.float > 0 && vy < 0) {
    const gf = p.g * (1 - 0.45 * p.float);
    const vt = v0 * (1.6 - 1.15 * p.float);
    a = -gravity({ ...p, g: gf }, vy, v0) + (gf / (vt * vt)) * vy * vy;
  }
  return a;
}

// Flight from takeoff speed v0: apex height (including the push) and time in the air.
function flight(p, v0) {
  let y = (v0 * p.push) / 2;
  let vy = v0;
  let apex = y;
  let t = 0;
  while (t < 4 && !(y <= 0 && vy < 0)) {
    vy += airAccel(p, vy, v0) * DT;
    y += vy * DT;
    apex = Math.max(apex, y);
    t += DT;
  }
  return { apex, T: t };
}

// The takeoff speed that reaches height h.
function launchSpeed(p) {
  let lo = 20;
  let hi = 4000;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (flight(p, mid).apex < p.h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Simulates a motion: { hops: [hop…], settle: s, end: mood, endAfter: s, delay: s }.
// Returns numeric frames per track and the events (crouch, takeoff, apex, land, end).
export function simulate(motion, size = 112, reduced = false) {
  const k = size / 112;
  const hops = motion.hops.map((h) => {
    const p = { ...HOP, ...h };
    p.h *= k;
    p.g *= k;
    p.sway *= k;
    if (reduced) Object.assign(p, { h: 4 * k, depth: p.depth * 0.3, stretch: 0.02, spin: 0, twirl: 0, sway: 0, tilt: 0, tuck: 0, star: 0, hang: 0 });
    return p;
  });

  // Rig springs. Arms are light and floppy; the antenna boings; the face and feet are
  // firmer. Each is driven by the body's vertical acceleration (inertia).
  const sq = spring(4.2, 0.36); // squash (+) / stretch (−)
  const arm = spring(2.9, 0.3); // arm raise, deg
  const topY = spring(4.6, 0.24); // antenna drop, viewBox units
  const topR = spring(3.1, 0.2); // antenna bend, deg
  const face = spring(5.5, 0.42); // face drop, units
  const tailS = spring(3, 0.3); // skirt length (scale − 1)
  const tailR = spring(2.4, 0.28); // skirt swing, deg
  const feet = spring(6, 0.55); // feet drop (− = tucked), units
  const spread = spring(4, 0.5); // feet spread (scale − 1)
  const lean = spring(2.3, 0.36); // whole-body lean, deg

  const F = { x: [], y: [], lean: [], spin: [], twirl: [], sx: [], sy: [], arm: [], topY: [], topR: [], face: [], tailS: [], tailR: [], feet: [], spread: [], shadow: [], shadowO: [] };
  const events = [];
  let t = motion.delay || 0;
  let step = 0;
  let y = 0;
  let vy = 0;
  let vyPrev = 0;
  let x = 0;
  let spinBase = 0;
  let twirlBase = 0;
  let kickSign = 1;
  const sizeRef = 64 * k;

  const tick = (g) => {
    const ay = (vy - vyPrev) / DT;
    vyPrev = vy;
    // Inertia: a kick of Δv to the body moves a part by about gain·Δv/ω.
    sq.step(g.sq);
    arm.step(g.arm, -0.9 * ay);
    topY.step(0, 0.19 * ay);
    topR.step(0, 0.5 * ay);
    face.step(g.face || 0, 0.17 * ay);
    tailS.step(g.tail || 0, 0.0045 * ay);
    tailR.step(g.tailR || 0);
    feet.step(g.feet || 0);
    spread.step(g.spread || 0);
    lean.step(g.lean || 0);
    if (step % SAMPLE === 0) {
      const c = clamp(sq.x, -0.13, 0.15);
      const sy = 1 - c;
      const hy = clamp(y / sizeRef, 0, 1);
      F.x.push(x);
      F.y.push(y);
      F.lean.push(lean.x);
      F.spin.push(g.spin ?? spinBase);
      F.twirl.push(g.twirl ?? twirlBase);
      F.sx.push(1 / sy);
      F.sy.push(sy);
      F.arm.push(arm.x);
      F.topY.push(topY.x);
      F.topR.push(topR.x);
      F.face.push(face.x);
      F.tailS.push(clamp(tailS.x, -0.15, 0.2));
      F.tailR.push(clamp(tailR.x, -12, 12));
      F.feet.push(feet.x);
      F.spread.push(spread.x);
      F.shadow.push((1 - 0.5 * hy) * (1 + 0.7 * Math.max(0, c)));
      F.shadowO.push(1 - 0.6 * hy);
    }
    step++;
    t += DT;
  };

  hops.forEach((p, i) => {
    const v0 = launchSpeed(p);
    const { T } = flight(p, v0);

    // Anticipation: squash down, arms swing back, the face lifts toward the sky.
    events.push({ t, type: "crouch", i });
    const crouchEnd = t + p.crouch;
    const crouchStart = t;
    while (t < crouchEnd) {
      const u = (t - crouchStart) / p.crouch;
      tick({ sq: p.depth, arm: p.arms[0], face: u > 0.45 ? -2.2 : 0.8, lean: -p.tilt * 0.25 });
    }

    // Push off: the legs extend and the body leaves the ground stretched.
    events.push({ t, type: "takeoff", i });
    sq.v -= 2.2;
    const pushEnd = t + p.push;
    while (t < pushEnd) {
      vy += (v0 / p.push) * DT;
      y += vy * DT;
      tick({ sq: -p.stretch, arm: p.arms[1], face: -1.5, lean: p.tilt * 0.4 });
    }
    vy = v0;

    // Flight.
    const airStart = t;
    let apexed = false;
    let fallStart = 0;
    while (!(y <= 0 && vy < 0) && t - airStart < 4) {
      const tau = t - airStart;
      const u = tau / T;
      vy += airAccel(p, vy, v0) * DT;
      y += vy * DT;
      if (!apexed && vy <= 0) {
        apexed = true;
        fallStart = tau;
        events.push({ t, type: "apex", i });
      }
      // Side-to-side drift on a buoyant fall, tapering to nothing at touchdown.
      const xPrev = x;
      x = apexed && p.sway ? p.sway * Math.sin(TAU * 1.25 * (tau - fallStart)) * (1 - Math.exp(-(tau - fallStart) / 0.12)) * clamp(y / (0.4 * p.h), 0, 1) : x * 0.9;
      const vx = (x - xPrev) / DT;

      const speed = clamp(Math.abs(vy) / v0, 0, 1);
      let gSq = -p.stretch * speed;
      let gArm = p.arms[1] + 6 * (1 - speed);
      if (p.float && apexed) gArm += 8 * Math.sin(TAU * 4.2 * (tau - fallStart));
      if (p.tuck) {
        const w = smooth((u - 0.08) / 0.14) * (1 - smooth((u - 0.6) / 0.14));
        gSq = gSq * (1 - w) + 0.07 * p.tuck * w;
        gArm = gArm * (1 - w) + -48 * p.tuck * w;
        if (u > 0.68) {
          gArm += 22 * p.tuck;
          gSq -= 0.04 * p.tuck;
        }
      }
      let gSpread = 0;
      if (p.star) {
        // Flung wide: arms snap out, the body spreads round, feet apart.
        const w = Math.exp(-(((u - 0.5) / 0.2) ** 2));
        gArm += 12 * p.star * w;
        gSpread = 0.4 * p.star * w;
        gSq += 0.08 * p.star * w;
      }
      // Feet tuck up in the air and reach down just before touchdown.
      const gFeet = vy < 0 && y < -vy * 0.09 ? 1.2 : -3.2;
      const spinE = easeInOut((u - 0.06) / 0.76);
      tick({
        sq: gSq,
        arm: gArm,
        face: -0.8 * speed,
        tail: 0.12 * clamp(vy / v0, -1, 1),
        tailR: clamp(-vx * 0.05, -10, 10),
        feet: gFeet,
        spread: gSpread,
        lean: p.tilt * Math.sin(Math.PI * clamp(u, 0, 1)) + clamp(vx * 0.06, -8, 8),
        spin: spinBase + p.spin * spinE,
        twirl: twirlBase + p.twirl * spinE,
      });
    }
    spinBase += p.spin;
    twirlBase += p.twirl;

    // Impact: the speed goes to zero in one step, which the springs feel as a kick.
    // It's measured against an ordinary 44px hop, so small bounces squash less.
    const impact = clamp(-vy / (363 * k), 0, 1.4);
    events.push({ t, type: "land", i, impact });
    sq.v += 3 * impact;
    tailR.v += 70 * kickSign * impact;
    kickSign = -kickSign;
    y = 0;
    vy = 0;
  });

  // Settle: every spring rings down to rest.
  const lastLand = t;
  const end = t + (motion.settle ?? 0.8);
  while (t < end) tick({ sq: 0, arm: 0 });
  if (motion.end !== null) events.push({ t: lastLand + (motion.endAfter ?? 0.45), type: "end" });
  return { frames: F, events, delay: motion.delay || 0, dur: t - (motion.delay || 0) };
}

// ---------- Playing a simulation on a rigged buddy ----------

const parseOrigin = (el) => {
  const m = /(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(el.style.transformOrigin || "");
  return m ? [Number(m[1]), Number(m[2])] : null;
};

// The direction (deg) from an arm's shoulder pivot to its hand, from the arm's geometry.
function armAngle(g) {
  if (!g) return null;
  const o = parseOrigin(g);
  const shapes = g.querySelectorAll("path, line, ellipse, circle, rect");
  const el = shapes[shapes.length - 1];
  if (!o || !el) return null;
  let pts;
  try {
    if (el.getTotalLength && el.tagName === "path") {
      const len = el.getTotalLength();
      pts = [el.getPointAtLength(0), el.getPointAtLength(len)];
    } else {
      const b = el.getBBox();
      pts = [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }];
    }
  } catch {
    return null;
  }
  const far = pts.reduce((a, b) => (Math.hypot(b.x - o[0], b.y - o[1]) > Math.hypot(a.x - o[0], a.y - o[1]) ? b : a));
  return (Math.atan2(far.y - o[1], far.x - o[0]) * 180) / Math.PI;
}

// A swing from `d` degrees back to 0, overshooting a little, as additive keyframes.
function swing(d) {
  const s = spring(3.1, 0.42);
  s.x = d;
  const out = [];
  for (let i = 0; i <= 168; i++) {
    if (i % SAMPLE === 0) out.push({ transform: `rotate(${r2(s.x)}deg)` });
    s.step(0);
  }
  out.push({ transform: "rotate(0deg)" });
  return out;
}

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Plays `motion` on the buddy inside `fig` (a .mo-fig wrapper). `on.mood(m)` changes the
// buddy's mood (it must render synchronously under flushSync); `on.fx(arg)` plays feedback;
// `on.event(e)` hears every event. Returns a function that stops everything.
export function playJump(fig, motion, on) {
  const reduced = reducedMotion();
  const size = fig.offsetWidth || 112;
  const sim = simulate(motion, size, reduced);
  const F = sim.frames;
  const anims = [];
  const timers = [];
  const opts = { duration: sim.dur * 1000, delay: sim.delay * 1000, easing: "linear" };
  const q = (sel) => fig.querySelector(sel);
  const run = (el, frames) => {
    if (el && frames.length) anims.push(el.animate(frames, opts));
  };
  const n = F.y.length;
  const map = (fn) => Array.from({ length: n }, (_, i) => fn(i));

  const twirls = F.twirl.some((v) => v !== 0);
  // A flat sticker turned edge-on in 3D vanishes into a sliver for a few frames. Cheat
  // the turn the way cartoons do: squeeze the width, then cut straight to the mirrored
  // side before it gets much thinner than half. The cut is a pair of keyframes at the
  // same offset, so the blend between samples never passes through zero width.
  const facing = (i) => Math.cos((F.twirl[i] * Math.PI) / 180);
  const squeeze = (i, sign = Math.sign(facing(i) || 1)) => `scaleX(${(sign * Math.max(0.42, Math.abs(facing(i)))).toFixed(3)}) `;
  const hb = size * 0.38; // centre to the ground pivot
  const body = (i) =>
    `translate(${r2(F.x[i])}px, ${r2(-F.y[i])}px) translate(0px, ${r2(hb)}px) rotate(${r2(F.lean[i])}deg) translate(0px, ${r2(-hb)}px) rotate(${r2(F.spin[i])}deg)`;
  const figFrames = [];
  for (let i = 0; i < n; i++) {
    const offset = n > 1 ? i / (n - 1) : 0;
    if (twirls && i > 0 && Math.sign(facing(i) || 1) !== Math.sign(facing(i - 1) || 1)) {
      figFrames.push({ offset, transform: `${squeeze(i, Math.sign(facing(i - 1) || 1))}${body(i)}` });
    }
    figFrames.push({ offset, transform: `${twirls ? squeeze(i) : ""}${body(i)}` });
  }
  run(fig, figFrames);
  run(q(".lb-all"), map((i) => ({ transform: `scale(${r2(F.sx[i] * 1000) / 1000}, ${r2(F.sy[i] * 1000) / 1000})` })));
  run(q(".lb-arm-l"), map((i) => ({ transform: `rotate(${r2(F.arm[i])}deg)` })));
  run(q(".lb-arm-r"), map((i) => ({ transform: `rotate(${r2(-F.arm[i])}deg)` })));
  run(q(".lb-top"), map((i) => ({ transform: `translate(0px, ${r2(F.topY[i])}px) rotate(${r2(F.topR[i])}deg)` })));
  run(q(".lb-face"), map((i) => ({ translate: `0px ${r2(F.face[i])}px` })));
  run(q(".lb-tail"), map((i) => ({ transform: `rotate(${r2(F.tailR[i])}deg) scale(${r2((1 - 0.6 * F.tailS[i]) * 100) / 100}, ${r2((1 + F.tailS[i]) * 100) / 100})` })));
  const feetEl = q(".lb-feet");
  if (feetEl && feetEl.childNodes.length) {
    let b = { x: 40, y: 98, width: 40, height: 10 };
    try {
      b = feetEl.getBBox();
    } catch {
      // keep the default box
    }
    const cx = r2(b.x + b.width / 2);
    const cy = r2(b.y + b.height);
    run(feetEl, map((i) => ({ transform: `translate(0px, ${r2(F.feet[i])}px) translate(${cx}px, ${cy}px) scale(${r2(1 + F.spread[i])}, 1) translate(${-cx}px, ${-cy}px)` })));
  }
  const shadow = fig.parentElement && fig.parentElement.querySelector(":scope > .mo-shadow");
  run(shadow, map((i) => ({ transform: `scale(${r2(F.shadow[i])})`, opacity: r2(F.shadowO[i]) })));

  // Mood swaps with a swing from the old arm pose to the new one.
  const arms = [q(".lb-arm-l"), q(".lb-arm-r")];
  const setMood = (mood) => {
    if (!mood) return;
    const before = arms.map(armAngle);
    flushSync(() => on.mood(mood));
    arms.forEach((g, i) => {
      const after = armAngle(g);
      if (before[i] == null || after == null) return;
      const d = ((before[i] - after + 540) % 360) - 180;
      if (Math.abs(d) > 2 && Math.abs(d) < 170) {
        try {
          anims.push(g.animate(swing(d), { duration: 700, composite: "add" }));
        } catch {
          // No additive animation: the pose just changes.
        }
      }
    });
  };

  const hopOf = (e) => motion.hops[e.i] || {};
  const at = (s, fn) => timers.push(setTimeout(fn, Math.max(0, s * 1000)));
  sim.events.forEach((e) => {
    at(e.t, () => {
      const h = { ...HOP, ...hopOf(e) };
      if (e.type === "crouch") setMood(h.mood[0]);
      if (e.type === "takeoff") {
        setMood(h.mood[1]);
        if (h.fx[0]) on.fx(h.fx[0]);
      }
      if (e.type === "land") {
        setMood(h.mood[2]);
        if (h.fx[1]) on.fx(h.fx[1]);
      }
      if (e.type === "end") setMood(motion.end || "idle");
      if (on.event) on.event(e);
    });
  });
  // Extra mood cues: [[s, mood]…], from the motion's start (before its delay).
  (motion.cues || []).forEach(([s, mood]) => at(s, () => setMood(mood)));

  return () => {
    timers.forEach(clearTimeout);
    anims.forEach((a) => a.cancel());
  };
}

// Plays `motion` on the buddy in `ref` whenever `n` changes (not at rest, n = 0).
export function useJump(n, ref, motion, { setMood, fx, onEvent }) {
  const latest = useRef(null);
  latest.current = { setMood, fx, onEvent, motion };
  useEffect(() => {
    if (!n || !ref.current) return undefined;
    const l = latest.current;
    return playJump(ref.current, l.motion, {
      mood: (m) => latest.current.setMood(m),
      fx: (a) => latest.current.fx(a),
      event: (e) => latest.current.onEvent && latest.current.onEvent(e),
    });
  }, [n, ref]);
}
