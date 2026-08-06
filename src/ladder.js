// The difficulty ladder, shared by adaptive practice and by ranked Challenges.
//
// Everything here is pure so the ramp can be reasoned about (and tested) without a board
// on screen. The core idea: difficulty is a single ordered sequence of rungs, so "how far
// did you get" is one number that means the same thing for every player.

export const ADAPTIVE_MIN_BOARD = 3;
export const ADAPTIVE_MAX_BOARD = 8;
export const ADAPTIVE_MIN_LEVEL = 2;

// Level cap per board size, floor(totalCells^(2/3)), except at the max board where there
// is no bigger board to grow into, so the cap switches to half the board instead.
export const levelCapForBoard = (boardSize) => {
  const t = boardSize * boardSize;
  if (boardSize >= ADAPTIVE_MAX_BOARD) return Math.floor(t / 2);
  return Math.floor(Math.pow(t, 2 / 3));
};

// The lowest level that belongs on a given board: one above the previous board's cap.
// Cap and floor together make every (board, level) pair a single rung on one monotonic
// ladder, so descending retraces exactly the rungs that ascending climbed.
export const levelFloorForBoard = (boardSize) =>
  boardSize <= ADAPTIVE_MIN_BOARD ? ADAPTIVE_MIN_LEVEL : levelCapForBoard(boardSize - 1) + 1;

// The smallest board that can hold this many cells without exceeding its cap — the
// inverse of the cap table, which is what turns a rung number back into a board size.
export const boardForLevel = (level) => {
  for (let b = ADAPTIVE_MIN_BOARD; b < ADAPTIVE_MAX_BOARD; b++) {
    if (level <= levelCapForBoard(b)) return b;
  }
  return ADAPTIVE_MAX_BOARD;
};

// Two clears in a row bump the level by one; if that overflows the current board's cap,
// grow the board instead (the level carries over, since a bigger board has more headroom).
// At the largest board there's nowhere left to grow, so the cap becomes a hard ceiling —
// without it the level would keep climbing until the whole board lights up.
export const computeAdaptiveClear = (a) => {
  const clearStreak = a.clearStreak + 1;
  if (clearStreak < 2) return { ...a, clearStreak, failStreak: 0 };
  let { level, boardSize } = a;
  level += 1;
  if (level > levelCapForBoard(boardSize)) {
    if (boardSize < ADAPTIVE_MAX_BOARD) boardSize += 1;
    else level = levelCapForBoard(boardSize);
  }
  return { level, boardSize, clearStreak: 0, failStreak: 0 };
};

// Two fails in a row drop the level by one; if that falls below the board's floor, step
// down a board and land on the rung directly below — the exact inverse of a clear that
// grew the board. Math.min also walks an off-ladder starting level (one the player picked
// in Settings) down a board at a time until it sits on the ladder.
export const computeAdaptiveFail = (a) => {
  const failStreak = a.failStreak + 1;
  if (failStreak < 2) return { ...a, failStreak, clearStreak: 0 };
  let { level, boardSize } = a;
  level -= 1;
  if (level < levelFloorForBoard(boardSize) && boardSize > ADAPTIVE_MIN_BOARD) {
    boardSize -= 1;
    level = Math.min(level, levelCapForBoard(boardSize));
  }
  level = Math.max(ADAPTIVE_MIN_LEVEL, level);
  return { level, boardSize, clearStreak: 0, failStreak: 0 };
};

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------
//
// A Challenge locks every setting and climbs exactly one rung per cleared round, ending
// the run on the first failed round. That makes the score — rungs cleared — comparable
// between players and across sessions, which a streak at a self-chosen difficulty is not.
//
// Display time is fixed too: it is the single strongest difficulty lever, so leaving it
// configurable would undo the whole point.

export const CHALLENGE_DISPLAY_TIME = {
  pattern: 2,
  sequence: 1,
  progressive: 1,
  queue: 1.5,
};

// Each mode climbs one axis, the one that defines what that mode actually tests.
export const CHALLENGE_AXIS = {
  pattern: "cells to recall",
  sequence: "sequence length",
  progressive: "sequence length",
  queue: "patterns held at once",
};

// Beyond these the ramp would stop biting (a full board, an unreadable queue), so the
// rung clamps. All of them sit far past any realistic human span.
export const MAX_RUNG = {
  pattern: levelCapForBoard(ADAPTIVE_MAX_BOARD) - 1, // level 2..32
  sequence: 29, // length 2..30
  progressive: 29,
  queue: 9, // depth 2..10
};

// Rung 1 is the gentlest round of a Challenge; every mode starts at its own floor and
// each cleared round steps up by one. Returns the concrete round parameters for a rung.
export const rungParams = (mode, rung) => {
  const n = Math.max(1, Math.min(rung, MAX_RUNG[mode]));
  switch (mode) {
    case "pattern": {
      // Walk the same (board, level) ladder adaptive practice uses: the level rises, and
      // the board grows underneath it whenever the level outgrows the current cap.
      const level = n + 1;
      return { boardSize: boardForLevel(level), level };
    }
    case "sequence":
      // Fresh sequence each round on a fixed board — immediate span, not rehearsal.
      return { boardSize: 3, level: n + 1 };
    case "progressive":
      // The same sequence grows, so the round length follows from the rung.
      return { boardSize: 3, level: n + 1, startLength: 2, increment: 1 };
    case "queue":
      // Pattern size stays put; the queue itself deepens.
      return { boardSize: 3, level: 4, queueSize: n + 1 };
    default:
      return { boardSize: 3, level: 2 };
  }
};

// One-line description of what a rung actually asks for, for the run summary.
export const rungDescription = (mode, rung) => {
  if (rung < 1) return null;
  const p = rungParams(mode, rung);
  if (mode === "queue") return `${p.queueSize} patterns on ${p.boardSize}×${p.boardSize}`;
  if (mode === "pattern") return `${p.level} cells on ${p.boardSize}×${p.boardSize}`;
  return `${p.level} steps on ${p.boardSize}×${p.boardSize}`;
};
