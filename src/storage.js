// Settings, ranked Challenge records, and unranked Practice bests.
//
// localStorage throws in Safari private mode and wherever site data is blocked, and it
// can throw on write when the quota is full. The game has to stay fully playable in that
// case, so every accessor here degrades to in-memory defaults rather than propagating.

const SETTINGS_KEY = "memory-trainer.settings.v2";
// v3: challenge records are keyed by preset rather than by mode, and the score changed
// meaning (rungs on a shared ladder -> rounds cleared, or the level an endless preset
// reached). v2 numbers cannot be mapped onto that, so this starts clean.
const STATS_KEY = "memory-trainer.stats.v3";

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
  const base = { config: defaultConfig, mode: defaultMode, intent: "challenge", challengeDisplayTime: {} };
  if (!saved) return base;

  const config = {};
  for (const key of Object.keys(defaultConfig)) {
    config[key] = { ...defaultConfig[key], ...(saved.config?.[key] || {}) };
  }
  return {
    config,
    mode: defaultConfig[saved.mode] ? saved.mode : defaultMode,
    intent: saved.intent === "practice" ? "practice" : "challenge",
    // Per preset, so a fast Pattern setting doesn't drag Sequence down with it.
    challengeDisplayTime: saved.challengeDisplayTime || {},
  };
};

export const saveSettings = (settings) => safeWrite(SETTINGS_KEY, settings);

// Identifies one exact Practice configuration. Derived from the mode's own settings
// object, so a setting added later automatically becomes part of the identity instead of
// silently merging two different difficulties into one record.
export const practiceKey = (modeConfig) =>
  Object.keys(modeConfig)
    .sort()
    .map((k) => `${k}=${modeConfig[k]}`)
    .join(",");

export const EMPTY_RECORD = { plays: 0, best: 0, bestDisplayTime: null };

export const loadStats = (modeKeys, challengeIds) => {
  const saved = safeRead(STATS_KEY) || {};
  const challenge = {};
  const practice = {};
  for (const id of challengeIds) challenge[id] = { ...EMPTY_RECORD, ...(saved.challenge?.[id] || {}) };
  for (const key of modeKeys) practice[key] = saved.practice?.[key] || {};
  return { challenge, practice };
};

export const saveStats = (stats) => safeWrite(STATS_KEY, stats);

// Folds one finished run into the stats. Pure — the caller decides when a run is over, so
// this never double-counts a play.
//
// Display time deliberately does not key the record: one preset, one number. It can only
// ever be turned down from the default, so a record cannot be inflated by slowing the
// game — but the speed it was set at is worth keeping, so it rides along with the best.
export const mergeRun = (stats, { mode, intent, challengeId, configKey, score, displayTime }) => {
  if (intent === "challenge") {
    const prev = stats.challenge[challengeId] || EMPTY_RECORD;
    const improved = score > prev.best;
    return {
      ...stats,
      challenge: {
        ...stats.challenge,
        [challengeId]: {
          plays: prev.plays + 1,
          best: Math.max(prev.best, score),
          bestDisplayTime: improved ? displayTime : prev.bestDisplayTime,
        },
      },
    };
  }
  const modePractice = stats.practice[mode] || {};
  const prev = modePractice[configKey] || EMPTY_RECORD;
  return {
    ...stats,
    practice: {
      ...stats.practice,
      [mode]: {
        ...modePractice,
        [configKey]: { plays: prev.plays + 1, best: Math.max(prev.best, score) },
      },
    },
  };
};

export const recordFor = (stats, { mode, intent, challengeId, configKey }) =>
  intent === "challenge"
    ? stats.challenge[challengeId] || EMPTY_RECORD
    : stats.practice[mode]?.[configKey] || EMPTY_RECORD;
