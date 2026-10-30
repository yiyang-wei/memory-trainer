// The buddy's jumps: the Buddy Lab's M25–M32, played by the engine in
// src/engine/jump.js. Every one hands the mood back when it ends (`release`), so the
// screen's own mood takes over again. Feedback is a light buzz on landing; the game
// already plays its own sounds for the moments that trigger a jump.

const quiet = [null, null, null];

// M25 · Boing hop: crouch, spring, settle.
export const BOING = {
  hops: [{ h: 46, g: 1750, hang: 0.22, fx: [null, { vibe: 10 }] }],
  settle: 0.9,
  endAfter: 0.5,
  release: true,
};

// M26 · Double hop: yay-yay! The second one twirls.
export const DOUBLE = {
  hops: [
    { h: 26, crouch: 0.13, g: 2300, hang: 0.1, arms: [-12, 18], mood: ["happy", "happy", null], fx: [null, { vibe: 8 }] },
    { h: 54, crouch: 0.07, depth: 0.04, g: 1900, hang: 0.4, twirl: 360, mood: [null, "cheer", "happy"], fx: [null, { vibe: 12 }] },
  ],
  settle: 0.9,
  endAfter: 0.55,
  release: true,
};

// M27 · Floaty hop: hangs up top, drifts down like a feather.
export const FLOATY = {
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
      fx: [null, { vibe: 8 }],
    },
  ],
  settle: 1,
  endAfter: 0.6,
  release: true,
};

// M28 · Tuck flip: curls up, flips, lands ta-da.
export const TUCK = {
  hops: [{ h: 64, crouch: 0.18, depth: 0.13, g: 1700, hang: 0.2, spin: -360, tuck: 1, mood: ["happy", "happy", "cheer"], fx: [null, { vibe: 14 }] }],
  settle: 0.9,
  endAfter: 0.8,
  release: true,
};

// M29 · Star jump: flings wide at the top, with a burst of sparkles.
export const STAR = {
  hops: [{ h: 50, star: 1, hang: 0.5, arms: [-26, 4], mood: ["happy", "happy", "happy"], fx: [null, { vibe: 12 }] }],
  settle: 0.9,
  endAfter: 0.5,
  release: true,
  burst: true,
};

// M30 · Bouncy: three happy bounces, like a spring.
export const BOUNCY = {
  hops: [
    { h: 36, crouch: 0.12, depth: 0.1, g: 2000, hang: 0.15, mood: ["happy", "cheer", null], fx: [null, { vibe: 10 }] },
    { h: 21, crouch: 0.05, depth: 0.03, g: 2400, hang: 0, mood: quiet, fx: [null, { vibe: 8 }] },
    { h: 10, crouch: 0.04, depth: 0.02, g: 2400, hang: 0, mood: [null, null, "happy"], fx: [null, { vibe: 6 }] },
  ],
  settle: 0.9,
  endAfter: 0.5,
  release: true,
};

// M31 · Round clear: a jump and a little bounce. It's short enough to land before the
// next pattern shows.
export const CLEAR = {
  hops: [
    { h: 42, mood: ["happy", "cheer", "happy"], fx: [null, { vibe: 10 }] },
    { h: 13, crouch: 0.05, depth: 0.03, mood: quiet, fx: [null, null] },
  ],
  settle: 0.9,
  endAfter: 0.5,
  release: true,
};

// M32 · New record: a big floaty leap.
export const RECORD = {
  hops: [
    { h: 62, crouch: 0.2, depth: 0.13, g: 1400, hang: 0.6, arms: [-16, -4], mood: ["happy", "cheer", "cheer"], fx: [null, { vibe: [18, 40, 12] }] },
    { h: 13, crouch: 0.05, depth: 0.03, mood: quiet, fx: [null, { vibe: 8 }] },
  ],
  settle: 1,
  endAfter: 1.3,
  release: true,
};

// The same motion, starting a little later (for a screen that has only just appeared).
export const after = (motion, delay) => ({ ...motion, delay });

// The same motion with every hop k times as high.
export const lower = (motion, k) => ({ ...motion, hops: motion.hops.map((h) => ({ ...h, h: (h.h ?? 44) * k, sway: (h.sway || 0) * k })) });

// What a poke on Home plays, in turn. Home's buddy sits near the top of the screen, so
// these jump a little lower.
export const POKES = [BOING, DOUBLE, FLOATY, TUCK, STAR, BOUNCY].map((m) => lower(m, 0.7));

// The jumps' feedback, under the player's vibration setting.
export const jumpFx = (prefs) => (arg) => {
  if (!arg || !arg.vibe || !prefs.haptics || typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(arg.vibe);
  } catch {
    // No recent gesture: stay quiet.
  }
};
