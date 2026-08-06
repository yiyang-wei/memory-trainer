// The difficulty ladder behind adaptive practice.
//
// Everything here is pure so the ramp can be reasoned about (and tested) without a board
// on screen. Ranked difficulty lives in challenges.js instead — those presets hold their
// board fixed, so only practice ever moves a player between board sizes mid-run.

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
