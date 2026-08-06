// Settings, ranked Challenge records, and unranked Practice bests.
//
// localStorage throws in Safari private mode and wherever site data is blocked, and it
// can throw on write when the quota is full. The game has to stay fully playable in that
// case, so every accessor here degrades to in-memory defaults rather than propagating.

const SETTINGS_KEY = "memory-trainer.settings.v1";
// v2: v1 kept a single best per mode, which pooled every difficulty into one slot — a
// streak at 3x3/2-cells and one at 8x8/32-cells wrote to the same record. Those numbers
// are not comparable to anything, so v2 starts clean rather than importing them.
const STATS_KEY = "memory-trainer.stats.v2";

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
  if (!saved) return { config: defaultConfig, mode: defaultMode, intent: "challenge" };

  const config = {};
  for (const key of Object.keys(defaultConfig)) {
    config[key] = { ...defaultConfig[key], ...(saved.config?.[key] || {}) };
  }
  return {
    config,
    mode: defaultConfig[saved.mode] ? saved.mode : defaultMode,
    intent: saved.intent === "practice" ? "practice" : "challenge",
  };
};

export const saveSettings = (config, mode, intent) => safeWrite(SETTINGS_KEY, { config, mode, intent });

// Identifies one exact Practice configuration. Derived from the mode's own settings
// object, so a setting added later automatically becomes part of the identity instead of
// silently merging two different difficulties into one record.
export const practiceKey = (modeConfig) =>
  Object.keys(modeConfig)
    .sort()
    .map((k) => `${k}=${modeConfig[k]}`)
    .join(",");

const EMPTY_RECORD = { plays: 0, best: 0 };

export const loadStats = (modeKeys) => {
  const saved = safeRead(STATS_KEY) || {};
  const challenge = {};
  const practice = {};
  for (const key of modeKeys) {
    challenge[key] = { ...EMPTY_RECORD, ...(saved.challenge?.[key] || {}) };
    practice[key] = saved.practice?.[key] || {};
  }
  return { challenge, practice };
};

export const saveStats = (stats) => safeWrite(STATS_KEY, stats);

// Folds one finished run into the stats. Pure — the caller decides when a run is over, so
// this never double-counts a play. `score` is rounds cleared, which in a Challenge is
// exactly the rung reached.
export const mergeRun = (stats, { mode, intent, configKey, score }) => {
  if (intent === "challenge") {
    const prev = stats.challenge[mode] || EMPTY_RECORD;
    return {
      ...stats,
      challenge: {
        ...stats.challenge,
        [mode]: { plays: prev.plays + 1, best: Math.max(prev.best, score) },
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

export const recordFor = (stats, { mode, intent, configKey }) =>
  intent === "challenge"
    ? stats.challenge[mode] || EMPTY_RECORD
    : stats.practice[mode]?.[configKey] || EMPTY_RECORD;
