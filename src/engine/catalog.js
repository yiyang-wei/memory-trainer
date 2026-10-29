// Presentation-neutral facts about the exercises that every version's screens need:
// names, short taglines, level labels, record summaries and preview boards. Colours and
// shapes belong to each version; this file only says what there is to draw.

import { challengesForMode, scoreNoun } from "../challenges.js";

export const MODES = [
  { key: "pattern", name: "Pattern", tagline: "Find the lit cells" },
  { key: "sequence", name: "Sequence", tagline: "Repeat the order" },
  { key: "progressive", name: "Progressive", tagline: "It keeps growing" },
  { key: "queue", name: "Queue", tagline: "Recall the oldest" },
];

export const modeByKey = (key) => MODES.find((m) => m.key === key) || MODES[0];

// Every score noun is a plain plural, so one rule covers singular for all of them.
export const countOf = (n, noun) => `${n} ${n === 1 ? noun.replace(/s$/, "") : noun}`;

// Short chip label for a preset: "6×6", or "∞" for the endless one when the mode also
// has fixed presets (Progressive is endless throughout, so its chips stay board sizes).
export const presetLabel = (ch) => {
  const mixed = challengesForMode(ch.mode).some((c) => c.kind !== "endless");
  return ch.kind === "endless" && mixed ? "∞" : ch.title;
};

// One line on what a preset asks for: "13 cells", "12 steps", "∞ 14 → 31 cells".
export const presetDetail = (ch) => {
  if (ch.mode === "progressive") return `grows from ${ch.rampStart} steps`;
  if (ch.mode === "queue") {
    return ch.kind === "endless"
      ? `${ch.level} cells · ${ch.rampStart} → ${ch.rampMax} deep`
      : `${ch.level} cells · ${ch.queueSize} deep`;
  }
  const noun = ch.mode === "pattern" ? "cells" : "steps";
  return ch.kind === "endless" ? `${ch.rampStart} → ${ch.rampMax} ${noun}` : `${ch.level} ${noun}`;
};

export const levelsFor = (stats, mode) =>
  challengesForMode(mode).map((ch) => {
    const rec = stats.challenge[ch.id];
    return {
      id: ch.id,
      challenge: ch,
      label: presetLabel(ch),
      detail: presetDetail(ch),
      endless: ch.kind === "endless",
      best: rec?.best || 0,
      plays: rec?.plays || 0,
      bestDisplayTime: rec?.bestDisplayTime ?? null,
      noun: scoreNoun(ch),
    };
  });

// The headline number for an exercise tile: the endless reach if there is one, otherwise
// the highest-ranked fixed level with a record.
export const modeHeadline = (stats, mode) => {
  const levels = levelsFor(stats, mode);
  const held = levels.filter((l) => l.best > 0);
  const endless = [...held].reverse().find((l) => l.endless);
  const pick = endless || held[held.length - 1];
  return {
    held: held.length,
    total: levels.length,
    levels,
    best: pick ? pick.best : 0,
    noun: pick ? pick.noun : null,
    label: pick ? pick.label : null,
  };
};

export const totalHeld = (stats) => {
  let held = 0;
  let total = 0;
  for (const m of MODES) {
    const h = modeHeadline(stats, m.key);
    held += h.held;
    total += h.total;
  }
  return { held, total };
};

// A deterministic scatter of `k` cells on an n×n board, so previews don't reshuffle on
// every render but still look random.
export const scatter = (n, k, seed = 1) => {
  const t = n * n;
  const out = [];
  let x = (seed * 7 + n * 13) % t;
  for (let guard = 0; out.length < Math.min(k, t) && guard < 4000; guard++) {
    x = (x * 17 + 11 + guard) % t;
    if (!out.includes(x)) out.push(x);
  }
  return out;
};

// What a preview board for a mode looks like: which cells are lit, in what role, and any
// step numbers. `size` and `count` describe the level being previewed.
//   role: "lit" (the pattern / a step), "next" (Queue's waiting pattern, Progressive's
//   newest step)
export const previewCells = (mode, size, count, seed = 1) => {
  const n = size;
  const cells = Array.from({ length: n * n }, () => ({ role: null, label: "" }));
  if (mode === "pattern") {
    scatter(n, count, seed).forEach((i) => (cells[i] = { role: "lit", label: "" }));
  } else if (mode === "queue") {
    // The waiting pattern is a hint, not a second full pattern — on a small board two
    // full patterns would light up most of it.
    const both = scatter(n, Math.min(count * 2, count + Math.max(1, Math.floor((n * n) / 4))), seed);
    both.forEach((i, idx) => (cells[i] = { role: idx < count ? "lit" : "next", label: "" }));
  } else {
    const steps = scatter(n, Math.min(count, 4), seed);
    steps.forEach((i, idx) => {
      const last = mode === "progressive" && idx === steps.length - 1;
      cells[i] = { role: last ? "next" : "lit", label: last ? "+" : String(idx + 1) };
    });
  }
  return cells;
};

// Preview for a Challenge preset or for the player's custom config of a mode.
export const previewFor = (mode, { boardSize, level, queueSize, startLength }, seed = 1) => {
  const count =
    mode === "pattern" ? level : mode === "queue" ? level : mode === "progressive" ? (startLength || 3) + 1 : level;
  return { n: boardSize, cells: previewCells(mode, boardSize, count, seed), queueSize };
};

// practiceKey() is a machine identity ("boardSize=6,level=10,..."); this reads it back as
// something a person can scan, for listing custom-play bests.
const CONFIG_LABELS = {
  boardSize: (v) => `${v}×${v}`,
  level: (v, mode) => `${v} ${mode === "sequence" ? "steps" : "cells"}`,
  displayTime: (v) => `${v}s`,
  queueSize: (v) => `${v} deep`,
  startLength: (v) => `from ${v}`,
  increment: (v) => `+${v}`,
  adaptive: (v) => (v === "true" ? "adaptive" : null),
  allowRepeat: (v) => (v === "true" ? null : "no repeats"),
};

export const describeConfig = (key, mode) =>
  key
    .split(",")
    .map((pair) => {
      const [k, v] = pair.split("=");
      return CONFIG_LABELS[k] ? CONFIG_LABELS[k](v, mode) : null;
    })
    .filter(Boolean)
    .join(" · ");

export const practiceBests = (stats, mode) =>
  Object.entries(stats.practice[mode] || {})
    .map(([key, rec]) => ({ key, label: describeConfig(key, mode), best: rec.best, plays: rec.plays }))
    .sort((a, b) => b.best - a.best);

export const formatDuration = (ms) => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
};

export const formatSpeed = (t) => `${Number(t).toFixed(1)}s`;
