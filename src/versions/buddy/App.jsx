import React, { useEffect } from "react";
import "@fontsource-variable/bricolage-grotesque";
import "./buddy.css";
import { useMemoryGame } from "../../engine/useMemoryGame.js";
import { useNavigation } from "../../engine/useNavigation.js";
import { challengesForMode, challengeById } from "../../challenges.js";
import { TabBar } from "./ui.jsx";
import Home from "./Home.jsx";
import Setup from "./Setup.jsx";
import Game from "./Game.jsx";
import Result from "./Result.jsx";
import Records from "./Records.jsx";
import SettingsScreen from "./Settings.jsx";
import Tutorial from "./Tutorial.jsx";
import { BuddyLook } from "./Buddy.jsx";

const TAB_SCREENS = ["home", "records", "settings"];

export default function BuddyApp() {
  const g = useMemoryGame();
  const { screen, params, go, back } = useNavigation("home");

  // Leaving the game for anything but its result tears the run down, banking whatever
  // it was worth (the Android back gesture lands here too).
  useEffect(() => {
    if (screen !== "game" && screen !== "result" && g.isPlaying) g.resetToIdle();
    // Only screen changes matter; g.isPlaying is read at that moment.
  }, [screen]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#EEF0F6");
  }, []);

  // The level an exercise opens on: whatever is already selected for it, else the most
  // recently played level of that exercise, else its first level.
  const selectExercise = (modeKey) => {
    if (g.mode === modeKey && g.isChallenge) return;
    const last = g.prefs.last;
    const id =
      last?.intent === "challenge" && last.mode === modeKey && last.challengeId
        ? last.challengeId
        : challengesForMode(modeKey)[0].id;
    g.selectChallenge(id);
  };

  const openExercise = (modeKey) => {
    selectExercise(modeKey);
    go("setup");
  };

  const openFreePlay = () => {
    const last = g.prefs.last;
    g.selectPractice(last?.mode || g.mode);
    go("setup");
  };

  // "Continue": straight back into the last level played.
  const quickPlay = () => {
    const last = g.prefs.last;
    if (last?.intent === "practice") g.selectPractice(last.mode);
    else {
      const valid = last?.challengeId && challengeById(last.challengeId).id === last.challengeId;
      g.selectChallenge(valid ? last.challengeId : challengesForMode("pattern")[0].id);
    }
    go("game");
  };

  const tab = TAB_SCREENS.includes(screen) ? screen : null;
  // Leaving Home pushes, so the back gesture returns to it; hopping between the other
  // tabs or back to Home replaces, so tabs never pile up in history.
  const switchTab = (t) => {
    if (t === tab) return;
    g.emit("tap");
    if (tab === "home") go(t);
    else go(t, {}, { replace: true });
  };

  const help = () => go("tutorial", { mode: g.mode });

  return (
    <BuddyLook shape={g.prefs.buddy}>
      <div className="bd">
        {screen === "home" && <Home g={g} onOpen={openExercise} onFree={openFreePlay} onQuickPlay={quickPlay} />}
        {screen === "setup" && (
          <Setup g={g} onBack={() => back()} onStart={() => go("game")} onSwitchMode={selectExercise} onHelp={help} />
        )}
        {screen === "game" && <Game g={g} onQuit={() => back()} onFinished={() => go("result", {}, { replace: true })} />}
        {screen === "result" && (
          <Result
            g={g}
            onAgain={() => go("game", {}, { replace: true })}
            onRecords={() => go("records", {}, { replace: true })}
            onClose={() => back()}
          />
        )}
        {screen === "records" && <Records g={g} />}
        {screen === "settings" && <SettingsScreen g={g} onHelp={help} />}
        {screen === "tutorial" && <Tutorial initialMode={params.mode || g.mode} onBack={() => back()} />}
        {tab && <TabBar current={tab} onChange={switchTab} />}
      </div>
    </BuddyLook>
  );
}
