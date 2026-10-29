import { useState, useEffect, useRef } from "react";

// Screen navigation backed by the browser history, so Android's back gesture steps back
// through screens instead of leaving the app. Each version keeps its own screen names;
// this only stores them in history.state.
//
// A reload always lands on `initial`: restoring straight into a game screen would show a
// board with no run behind it.
export function useNavigation(initial = "home") {
  const [screen, setScreen] = useState(initial);
  const [params, setParams] = useState({});
  const depth = useRef(0);

  useEffect(() => {
    window.history.replaceState({ screen: initial, params: {}, depth: 0 }, "");
    const onPop = (e) => {
      const s = e.state;
      depth.current = s?.depth ?? 0;
      setScreen(s?.screen || initial);
      setParams(s?.params || {});
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initial]);

  // replace: swap the current entry (tabs, game → result) so back doesn't revisit it.
  const go = (next, nextParams = {}, { replace = false } = {}) => {
    if (replace) {
      window.history.replaceState({ screen: next, params: nextParams, depth: depth.current }, "");
    } else {
      depth.current += 1;
      window.history.pushState({ screen: next, params: nextParams, depth: depth.current }, "");
    }
    setScreen(next);
    setParams(nextParams);
  };

  // Back within the app; at the root there's nothing of ours to pop, so go home instead
  // of letting the browser leave the page.
  const back = (fallback = initial) => {
    if (depth.current > 0) window.history.back();
    else go(fallback, {}, { replace: true });
  };

  return { screen, params, go, back };
}
