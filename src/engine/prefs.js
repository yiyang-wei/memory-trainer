// Per-device preferences the redesigned versions share: feedback toggles and the last
// level played (what "Continue" resumes). Kept apart from settings.v2 so the classic
// screen, which rewrites that key wholesale, can never drop these fields.

const PREFS_KEY = "memory-trainer.prefs.v1";

const DEFAULT_PREFS = { sound: true, haptics: true, last: null };

export const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const savePrefs = (prefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Blocked or full — preferences just won't outlive the tab.
  }
};
