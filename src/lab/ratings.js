import { useCallback, useEffect, useRef, useState } from "react";

// Star ratings for the lab, keyed by item code: { stars: 0–5, note, t }. Kept in
// localStorage and mirrored to the dev server (vite.config.js → .lab/ratings.json), so a
// phone and the laptop see the same ratings and Claude can read them from disk. The
// newer entry for a code wins on either side.

const KEY = "memory-trainer.lab.v1";
const URL = "/__lab/ratings";

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

const saveLocal = (all) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private mode or blocked storage: the server copy still has it.
  }
};

const newer = (a, b) => (!a ? b : !b ? a : (b.t || 0) > (a.t || 0) ? b : a);

const merge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = newer(out[k], v);
  return out;
};

export function useRatings() {
  const [all, setAll] = useState(loadLocal);
  // "local" until the server answers, then "saved" or "offline".
  const [sync, setSync] = useState("local");
  const allRef = useRef(all);
  allRef.current = all;

  const push = useCallback(async (patch) => {
    try {
      const res = await fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error(res.statusText);
      const server = await res.json();
      setAll((cur) => {
        const m = merge(cur, server);
        saveLocal(m);
        return m;
      });
      setSync("saved");
    } catch {
      setSync("offline");
    }
  }, []);

  // Pull the server copy once, and send back anything this device has that is newer.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(URL);
        if (!res.ok) throw new Error(res.statusText);
        const server = await res.json();
        if (!live) return;
        const local = allRef.current;
        const ahead = Object.fromEntries(Object.entries(local).filter(([k, v]) => newer(server[k], v) === v && v !== server[k]));
        const m = merge(local, server);
        saveLocal(m);
        setAll(m);
        setSync("saved");
        if (Object.keys(ahead).length) push(ahead);
      } catch {
        if (live) setSync("offline");
      }
    })();
    return () => {
      live = false;
    };
  }, [push]);

  const rate = useCallback(
    (code, patch) => {
      const entry = { stars: 0, note: "", ...allRef.current[code], ...patch, t: Date.now() };
      setAll((cur) => {
        const m = { ...cur, [code]: entry };
        saveLocal(m);
        return m;
      });
      push({ [code]: entry });
    },
    [push]
  );

  return { all, rate, sync };
}
