// Every finished run, newest last. Records only keep the best per level; this is what
// lets the Records screen show trends ("last 7 days", recent scores per exercise).

const HISTORY_KEY = "memory-trainer.history.v1";
const MAX_RUNS = 600;

export const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const appendRun = (history, run) => {
  const next = [...history, run].slice(-MAX_RUNS);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Blocked or full — the run still counts for this session.
  }
  return next;
};

const DAY = 24 * 60 * 60 * 1000;

// Best ranked score per Challenge preset among runs newer than `days`.
export const recentChallengeBests = (history, days, now = Date.now()) => {
  const since = now - days * DAY;
  const best = {};
  for (const run of history) {
    if (run.intent !== "challenge" || run.t < since) continue;
    best[run.challengeId] = Math.max(best[run.challengeId] || 0, run.score);
  }
  return best;
};

// The last `n` scores for one exercise, oldest first — drives the small bar charts.
export const recentScores = (history, mode, n = 8) =>
  history
    .filter((r) => r.mode === mode)
    .slice(-n)
    .map((r) => r.score);

// Distinct calendar days (local time) with at least one run, counting back from today —
// a gentle streak, broken by a day with no play.
export const dayStreak = (history, now = new Date()) => {
  const days = new Set(history.map((r) => new Date(r.t).toDateString()));
  let streak = 0;
  const d = new Date(now);
  // Today not played yet doesn't break a streak that ran through yesterday.
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};
