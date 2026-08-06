// Settings and personal bests, persisted to localStorage.
//
// localStorage throws in Safari private mode and wherever site data is blocked, and it
// can throw on write when the quota is full. The game has to stay fully playable in that
// case, so every accessor here degrades to in-memory defaults rather than propagating.

const SETTINGS_KEY = "memory-trainer.settings.v1";
const STATS_KEY = "memory-trainer.stats.v1";

const safeRead = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked or full — this session's progress just won't outlive the tab.
  }
};

// Saved payloads outlive the code that wrote them, so every field is merged over the
// current defaults: a setting added in a later version resolves to its default instead
// of coming back undefined and rendering an empty stepper.
export const loadSettings = (defaultConfig, defaultMode) => {
  const saved = safeRead(SETTINGS_KEY);
  if (!saved) return { config: defaultConfig, mode: defaultMode };

  const config = {};
  for (const key of Object.keys(defaultConfig)) {
    config[key] = { ...defaultConfig[key], ...(saved.config?.[key] || {}) };
  }
  return {
    config,
    mode: defaultConfig[saved.mode] ? saved.mode : defaultMode,
  };
};

export const saveSettings = (config, mode) => safeWrite(SETTINGS_KEY, { config, mode });

export const EMPTY_MODE_STATS = { plays: 0, bestStreak: 0, bestLevel: 0, bestLength: 0 };

export const loadStats = (modeKeys) => {
  const saved = safeRead(STATS_KEY) || {};
  const stats = {};
  for (const key of modeKeys) stats[key] = { ...EMPTY_MODE_STATS, ...(saved[key] || {}) };
  return stats;
};

export const saveStats = (stats) => safeWrite(STATS_KEY, stats);

// Folds one finished session into the stored bests. Pure — the caller decides when a
// session is over, so this never double-counts a play.
export const mergeSession = (stats, mode, session) => {
  const prev = stats[mode] || EMPTY_MODE_STATS;
  return {
    ...stats,
    [mode]: {
      plays: prev.plays + 1,
      bestStreak: Math.max(prev.bestStreak, session.streak || 0),
      bestLevel: Math.max(prev.bestLevel, session.level || 0),
      bestLength: Math.max(prev.bestLength, session.length || 0),
    },
  };
};

// Each mode is scored on the one number the player is actually pushing on, so the
// headline stat, the personal best and the "new best" test all agree.
export const headlineStatKey = (mode, adaptiveOn) => {
  if (mode === "progressive") return "bestLength";
  if (mode === "pattern" && adaptiveOn) return "bestLevel";
  return "bestStreak";
};

export const HEADLINE_LABEL = {
  bestStreak: "streak",
  bestLevel: "level",
  bestLength: "longest",
};
