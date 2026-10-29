// Sound and haptics for game events, synthesized on the fly so there are no audio files
// to cache. Both respect the player's toggles, and both fail silently: an AudioContext
// that can't start or a browser without navigator.vibrate (iOS Safari) just stays quiet.

let ctx = null;

const audio = () => {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
};

// Browsers start audio suspended until a user gesture; every event below is triggered
// by a tap (or a timer that a tap started), so resuming here is enough.
const ready = () => {
  const a = audio();
  if (a && a.state === "suspended") a.resume().catch(() => {});
  return a;
};

const tone = (a, { freq, at = 0, dur = 0.12, type = "sine", gain = 0.12, slide = 0 }) => {
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

const SOUNDS = {
  tap: (a) => tone(a, { freq: 660, dur: 0.08, gain: 0.07, type: "triangle" }),
  correct: (a) => tone(a, { freq: 880, dur: 0.1, gain: 0.09, type: "triangle", slide: 1.25 }),
  wrong: (a) => {
    tone(a, { freq: 220, dur: 0.18, gain: 0.1, type: "square", slide: 0.7 });
  },
  reveal: (a) => tone(a, { freq: 520, dur: 0.06, gain: 0.04, type: "sine" }),
  clear: (a) => {
    [523, 659, 784].forEach((f, i) => tone(a, { freq: f, at: i * 0.07, dur: 0.14, gain: 0.08, type: "triangle" }));
  },
  record: (a) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(a, { freq: f, at: i * 0.09, dur: 0.22, gain: 0.09, type: "triangle" }));
    tone(a, { freq: 1319, at: 0.4, dur: 0.4, gain: 0.07, type: "sine" });
  },
  over: (a) => {
    [392, 330, 262].forEach((f, i) => tone(a, { freq: f, at: i * 0.11, dur: 0.18, gain: 0.08, type: "triangle" }));
  },
  start: (a) => {
    tone(a, { freq: 440, dur: 0.1, gain: 0.07, type: "triangle" });
    tone(a, { freq: 660, at: 0.1, dur: 0.14, gain: 0.08, type: "triangle" });
  },
  count: (a) => tone(a, { freq: 600, dur: 0.09, gain: 0.07, type: "sine" }),
};

const VIBES = {
  tap: 8,
  correct: 12,
  wrong: [30, 40, 30],
  clear: [14, 40, 14],
  record: [20, 60, 20, 60, 60],
  over: 80,
  start: 15,
};

export const playFeedback = (type, { sound, haptics }) => {
  if (sound && SOUNDS[type]) {
    const a = ready();
    if (a) {
      try {
        SOUNDS[type](a);
      } catch {
        // A closed or interrupted context — skip this one.
      }
    }
  }
  if (haptics && VIBES[type] && typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(VIBES[type]);
    } catch {
      // Some browsers throw when vibrating without a recent gesture.
    }
  }
};
