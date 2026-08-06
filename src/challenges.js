// Challenge presets.
//
// A Challenge is a named, fixed configuration with its own record. Two shapes:
//
//   fixed    — difficulty never moves; the score is rounds cleared in a row.
//              Measures consistency at a known difficulty.
//   endless  — one parameter ramps by one every cleared round; the score is the value
//              it reached. Measures your ceiling.
//
// Every preset holds its board size constant, so nothing the player has already
// memorized is ever moved out from under them mid-run.

// Display time is the strongest difficulty lever, so a Challenge starts at the slowest
// setting and can only be turned *down*. That keeps one record per preset honest: a
// record can never be inflated by slowing the game, only earned at this speed or faster.
export const CHALLENGE_DISPLAY_TIME_MAX = 2;
export const CHALLENGE_DISPLAY_TIME_MIN = 0.2;
export const DEFAULT_CHALLENGE_DISPLAY_TIME = CHALLENGE_DISPLAY_TIME_MAX;

const fixed = (o) => ({ kind: "fixed", ...o });
const endless = (o) => ({ kind: "endless", ...o });

// Ordered easiest to hardest within each mode — that ordering is what the Challenge
// screen renders left to right.
export const CHALLENGES = [
  fixed({ id: "pattern-6-10", mode: "pattern", title: "6×6", detail: "10 cells", boardSize: 6, level: 10 }),
  fixed({ id: "pattern-7-13", mode: "pattern", title: "7×7", detail: "13 cells", boardSize: 7, level: 13 }),
  fixed({ id: "pattern-8-14", mode: "pattern", title: "8×8", detail: "14 cells", boardSize: 8, level: 14 }),
  endless({
    id: "pattern-8-endless",
    mode: "pattern",
    title: "8×8",
    detail: "14 → 31 cells",
    boardSize: 8,
    ramp: "level",
    rampStart: 14,
    rampMax: 31,
    noun: "cells",
  }),

  fixed({ id: "sequence-3-12", mode: "sequence", title: "3×3", detail: "12 steps", boardSize: 3, level: 12 }),
  fixed({ id: "sequence-4-12", mode: "sequence", title: "4×4", detail: "12 steps", boardSize: 4, level: 12 }),
  fixed({ id: "sequence-5-12", mode: "sequence", title: "5×5", detail: "12 steps", boardSize: 5, level: 12 }),
  endless({
    id: "sequence-5-endless",
    mode: "sequence",
    title: "5×5",
    detail: "3 → 30 steps",
    boardSize: 5,
    ramp: "level",
    rampStart: 3,
    rampMax: 30,
    noun: "steps",
  }),

  // Progressive grows one sequence in place, so every preset is endless by nature —
  // there is no fixed-difficulty version of it.
  endless({
    id: "progressive-3",
    mode: "progressive",
    title: "3×3",
    detail: "grows from 2",
    boardSize: 3,
    ramp: "level",
    rampStart: 2,
    rampMax: 40,
    noun: "steps",
  }),
  endless({
    id: "progressive-4",
    mode: "progressive",
    title: "4×4",
    detail: "grows from 2",
    boardSize: 4,
    ramp: "level",
    rampStart: 2,
    rampMax: 40,
    noun: "steps",
  }),
  endless({
    id: "progressive-5",
    mode: "progressive",
    title: "5×5",
    detail: "grows from 2",
    boardSize: 5,
    ramp: "level",
    rampStart: 2,
    rampMax: 40,
    noun: "steps",
  }),

  // Depth and pattern size scale together with the board.
  fixed({ id: "queue-3", mode: "queue", title: "3×3", detail: "3 × 3 cells", boardSize: 3, level: 3, queueSize: 3 }),
  fixed({ id: "queue-4", mode: "queue", title: "4×4", detail: "4 × 4 cells", boardSize: 4, level: 4, queueSize: 4 }),
  fixed({ id: "queue-5", mode: "queue", title: "5×5", detail: "5 × 5 cells", boardSize: 5, level: 5, queueSize: 5 }),
  endless({
    id: "queue-5-endless",
    mode: "queue",
    title: "5×5",
    detail: "3 → 10 deep",
    boardSize: 5,
    level: 5,
    ramp: "queueSize",
    rampStart: 3,
    rampMax: 10,
    noun: "patterns",
  }),
];

export const challengeById = (id) => CHALLENGES.find((c) => c.id === id) || CHALLENGES[0];
export const challengesForMode = (mode) => CHALLENGES.filter((c) => c.mode === mode);

// The round parameters after `roundsCleared` cleared rounds. Fixed presets ignore the
// count entirely; endless presets advance their one ramping parameter.
export const challengeParams = (challenge, roundsCleared = 0) => {
  const base = {
    boardSize: challenge.boardSize,
    level: challenge.level,
    queueSize: challenge.queueSize,
    startLength: challenge.rampStart,
    increment: 1,
  };
  if (challenge.kind !== "endless") return base;
  return { ...base, [challenge.ramp]: Math.min(challenge.rampStart + roundsCleared, challenge.rampMax) };
};

// What a finished run scored. Fixed presets count rounds; endless presets report the
// value the ramp actually reached, which is the number the player is chasing.
export const runScore = (challenge, roundsCleared) => {
  if (challenge.kind !== "endless") return roundsCleared;
  if (roundsCleared <= 0) return 0;
  return Math.min(challenge.rampStart + roundsCleared - 1, challenge.rampMax);
};

// Unit for the score, so "14" always arrives with what it counts.
export const scoreNoun = (challenge) => (challenge.kind === "endless" ? challenge.noun : "rounds");

export const challengeSummary = (challenge) =>
  `${challenge.title} · ${challenge.detail} · ${challenge.kind === "endless" ? "endless" : "fixed"}`;
