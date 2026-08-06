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

// Each mode climbs the axes that define what it actually tests. Growing a single axis
// forever stops biting — a 30-step sequence on a 3x3 board is tedious rather than hard —
// so every ladder widens the board alongside the axis it is really measuring.
export const CHALLENGE_AXIS = {
  pattern: "cells to recall, on a growing board",
  sequence: "sequence length, on a growing board",
  progressive: "sequence length, on a growing board",
  queue: "queue depth, pattern size and board",
};

// How long a sequence a board can carry before the board itself should grow. Past these
// the limit stops being memory and starts being the tedium of tapping out a long run of
// cells in a cramped grid.
const SEQUENCE_CAPACITY = { 3: 6, 4: 9, 5: 12, 6: 15, 7: 18, 8: 22 };

const boardForSequenceLength = (len) => {
  for (let b = ADAPTIVE_MIN_BOARD; b < ADAPTIVE_MAX_BOARD; b++) {
    if (len <= SEQUENCE_CAPACITY[b]) return b;
  }
  return ADAPTIVE_MAX_BOARD;
};

// Queue is the one mode with three axes worth climbing, so its ladder is written out
// rather than computed: each rung bumps exactly one of depth / pattern size / board, and
// they rotate so no single axis runs ahead of the others.
const QUEUE_LADDER = [
  { boardSize: 3, level: 3, queueSize: 2 },
  { boardSize: 3, level: 3, queueSize: 3 },
  { boardSize: 3, level: 4, queueSize: 3 },
  { boardSize: 4, level: 4, queueSize: 3 },
  { boardSize: 4, level: 4, queueSize: 4 },
  { boardSize: 4, level: 5, queueSize: 4 },
  { boardSize: 5, level: 5, queueSize: 4 },
  { boardSize: 5, level: 5, queueSize: 5 },
  { boardSize: 5, level: 6, queueSize: 5 },
  { boardSize: 6, level: 6, queueSize: 5 },
  { boardSize: 6, level: 6, queueSize: 6 },
  { boardSize: 6, level: 7, queueSize: 6 },
  { boardSize: 7, level: 7, queueSize: 6 },
  { boardSize: 7, level: 7, queueSize: 7 },
  { boardSize: 7, level: 8, queueSize: 7 },
  { boardSize: 8, level: 8, queueSize: 7 },
  { boardSize: 8, level: 8, queueSize: 8 },
];

// Beyond these the ramp would stop biting (a full board, an unreadable queue), so the
// rung clamps. All of them sit far past any realistic human span.
export const MAX_RUNG = {
  pattern: levelCapForBoard(ADAPTIVE_MAX_BOARD) - 1, // level 2..32
  sequence: SEQUENCE_CAPACITY[ADAPTIVE_MAX_BOARD] - 1, // length 2..22
  progressive: SEQUENCE_CAPACITY[ADAPTIVE_MAX_BOARD] - 1,
  queue: QUEUE_LADDER.length,
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
    case "sequence": {
      // Fresh sequence each round — immediate span, not rehearsal.
      const level = n + 1;
      return { boardSize: boardForSequenceLength(level), level };
    }
    case "progressive": {
      // The same sequence grows in place, so the round length follows from the rung. The
      // board can still widen underneath it: the whole sequence replays every round, so
      // the player immediately re-learns it at the new size (see remapIndex in the view).
      const level = n + 1;
      return { boardSize: boardForSequenceLength(level), level, startLength: 2, increment: 1 };
    }
    case "queue":
      return { ...QUEUE_LADDER[n - 1] };
    default:
      return { boardSize: 3, level: 2 };
  }
};

// One-line description of what a rung actually asks for, for the run summary.
export const rungDescription = (mode, rung) => {
  if (rung < 1) return null;
  const p = rungParams(mode, rung);
  const board = `${p.boardSize}×${p.boardSize}`;
  if (mode === "queue") return `${p.queueSize} patterns of ${p.level} cells on ${board}`;
  if (mode === "pattern") return `${p.level} cells on ${board}`;
  return `${p.level} steps on ${board}`;
};

// Growing the board mid-run has to keep already-memorized cells where the player left
// them, so a cell keeps its row and column and the grid simply gets wider around it.
export const remapIndex = (i, fromBoard, toBoard) =>
  Math.floor(i / fromBoard) * toBoard + (i % fromBoard);
