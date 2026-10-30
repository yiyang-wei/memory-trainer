import React, { useRef } from "react";
import { ChevronLeft, CircleHelp, Play, Trophy, Timer, SlidersHorizontal, Grid3x3, Hash, Layers, TrendingUp, Gauge, Repeat } from "lucide-react";
import { MODES, modeByKey, levelsFor, previewFor, presetDetail, countOf, formatSpeed } from "../../engine/catalog.js";
import { challengeParams, CHALLENGE_DISPLAY_TIME_MIN, CHALLENGE_DISPLAY_TIME_MAX } from "../../challenges.js";
import { practiceLevelMax } from "../../engine/useMemoryGame.js";
import { recordFor, practiceKey } from "../../storage.js";
import { PreviewBoard, Stepper, Switch, Squiggle, modeVars } from "./ui.jsx";
import { Peek } from "./Buddy.jsx";
import { accentFor } from "./Game.jsx";
import { THEME } from "./theme.js";

const round2 = (v) => +v.toFixed(2);

function Row({ icon, bg, fg, label, children }) {
  return (
    <div className="bd-row">
      <span className="bd-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span className="bd-row-label">{label}</span>
      {children}
    </div>
  );
}

export default function Setup({ g, onBack, onStart, onSwitchMode, onHelp }) {
  const mode = g.mode;
  const t = THEME[mode];
  const levels = levelsFor(g.stats, mode);
  const cfg = g.config[mode];
  const swipe = useRef(null);

  const preview = g.isChallenge ? previewFor(mode, challengeParams(g.challenge, 0), 5) : previewFor(mode, cfg, 5);

  const customSummary = () => {
    const parts = [`${cfg.boardSize}×${cfg.boardSize}`];
    if (mode === "pattern") parts.push(`${cfg.level} cells`);
    if (mode === "sequence") parts.push(`${cfg.level} steps`);
    if (mode === "queue") parts.push(`${cfg.level} cells · ${cfg.queueSize} deep`);
    if (mode === "progressive") parts.push(`from ${cfg.startLength}, +${cfg.increment}`);
    if (mode === "pattern" && cfg.adaptive) parts.push("adaptive");
    return parts.join(" · ");
  };

  const switchMode = (key) => {
    if (key === mode) return;
    g.emit("tap");
    if (g.isChallenge) onSwitchMode(key);
    else g.selectPractice(key);
  };

  // Swipe the tinted top half sideways to flip between exercises.
  const onTouchStart = (e) => (swipe.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (swipe.current == null) return;
    const dx = e.changedTouches[0].clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(dx) < 50) return;
    const idx = MODES.findIndex((m) => m.key === mode);
    switchMode(MODES[(idx + (dx < 0 ? 1 : -1) + MODES.length) % MODES.length].key);
  };

  const speed = g.speedFor(g.challengeId);
  const practiceBest = recordFor(g.stats, { mode, intent: "practice", configKey: practiceKey(cfg) });
  const levelMax = practiceLevelMax(mode, cfg);
  const tint = { bg: t.tint, fg: t.ink };
  const gold = { bg: "#FBF1DC", fg: "#B07B17" };
  // Fine steps at or below a second, coarse above.
  const down = (v, coarse) => (v <= 1 ? 0.1 : coarse);
  const up = (v, coarse) => (v < 1 ? 0.1 : coarse);

  return (
    <main className="bd-setup bd-in" style={modeVars(mode)}>
      <section className="bd-setup-top" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="bd-topbar">
          <button type="button" className="bd-icon-btn" onClick={onBack} aria-label="Back">
            <ChevronLeft size={23} strokeWidth={2.6} />
          </button>
          <div className="bd-mode-dots" role="tablist" aria-label="Exercise">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={m.key === mode}
                aria-label={m.name}
                className={`bd-mode-dot${m.key === mode ? " on" : ""}`}
                onClick={() => switchMode(m.key)}
              >
                <span />
              </button>
            ))}
          </div>
          <button type="button" className="bd-icon-btn" onClick={onHelp} aria-label="How to play">
            <CircleHelp size={22} strokeWidth={2.4} />
          </button>
        </div>

        <div className="bd-title-wrap" style={{ marginTop: 6 }}>
          <h1 className="bd-setup-name" key={mode} style={{ animation: "bd-in 280ms ease" }}>
            {modeByKey(mode).name}
          </h1>
          <Squiggle width={120} color={t.deep} />
        </div>

        <div className="bd-preview-wrap">
          <Peek mood="watch" size={76} look={[-1.6, 2.4]} accent={accentFor(mode)} />
          <div className="bd-sticker bd-preview">
            <PreviewBoard mode={mode} n={preview.n} cells={preview.cells} />
          </div>
        </div>
        <span className="bd-pill bd-detail">{g.isChallenge ? presetDetail(g.challenge) : customSummary()}</span>
      </section>

      <section className="bd-setup-panel">
        <div className="bd-chips" role="radiogroup" aria-label="Level">
          {levels.map((l) => {
            const on = g.isChallenge && g.challengeId === l.id;
            return (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${l.endless && l.label === "∞" ? "Endless " + l.challenge.title : l.label}${l.best ? `, record ${l.best}` : ""}`}
                className={`bd-chip${on ? " on" : ""}`}
                onClick={() => {
                  g.emit("tap");
                  g.selectChallenge(l.id);
                }}
              >
                <span className="bd-chip-label">{l.label}</span>
                <span className="bd-chip-rec">
                  {l.best > 0 ? (
                    <>
                      <Trophy size={11} strokeWidth={2.8} />
                      {l.best}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={!g.isChallenge}
            aria-label="Custom settings"
            className={`bd-chip${!g.isChallenge ? " on" : ""}`}
            onClick={() => {
              g.emit("tap");
              g.selectPractice(mode);
            }}
          >
            <SlidersHorizontal size={20} strokeWidth={2.4} />
          </button>
        </div>

        {g.isChallenge ? (
          <div className="bd-rows">
            <Row icon={<Trophy size={19} strokeWidth={2.4} />} {...gold} label="Best">
              <span className="bd-row-value">{g.record.best > 0 ? countOf(g.record.best, g.recordNoun) : "—"}</span>
            </Row>
            <Row icon={<Timer size={19} strokeWidth={2.4} />} {...tint} label="Show time">
              <Stepper
                label="show time"
                value={formatSpeed(speed)}
                canDec={speed > CHALLENGE_DISPLAY_TIME_MIN}
                canInc={speed < CHALLENGE_DISPLAY_TIME_MAX}
                onDec={() => g.setChallengeSpeed(g.challengeId, Math.max(CHALLENGE_DISPLAY_TIME_MIN, round2(speed - down(speed, 0.25))))}
                onInc={() => g.setChallengeSpeed(g.challengeId, Math.min(CHALLENGE_DISPLAY_TIME_MAX, round2(speed + up(speed, 0.25))))}
              />
            </Row>
          </div>
        ) : (
          <div className="bd-rows">
            <Row icon={<Grid3x3 size={19} strokeWidth={2.4} />} {...tint} label="Board">
              <Stepper
                label="board size"
                value={`${cfg.boardSize}×${cfg.boardSize}`}
                canDec={cfg.boardSize > 3}
                canInc={cfg.boardSize < 8}
                onDec={() => g.updatePractice(mode, { boardSize: cfg.boardSize - 1 })}
                onInc={() => g.updatePractice(mode, { boardSize: cfg.boardSize + 1 })}
              />
            </Row>
            {mode !== "progressive" && (
              <Row icon={<Hash size={19} strokeWidth={2.4} />} {...tint} label={mode === "sequence" ? "Steps" : "Cells"}>
                <Stepper
                  label={mode === "sequence" ? "steps" : "cells"}
                  value={cfg.level}
                  canDec={cfg.level > 2}
                  canInc={cfg.level < levelMax}
                  onDec={() => g.updatePractice(mode, { level: cfg.level - 1 })}
                  onInc={() => g.updatePractice(mode, { level: cfg.level + 1 })}
                />
              </Row>
            )}
            {mode === "queue" && (
              <Row icon={<Layers size={19} strokeWidth={2.4} />} {...tint} label="Queue">
                <Stepper
                  label="queue depth"
                  value={cfg.queueSize}
                  canDec={cfg.queueSize > 2}
                  canInc={cfg.queueSize < 6}
                  onDec={() => g.updatePractice(mode, { queueSize: cfg.queueSize - 1 })}
                  onInc={() => g.updatePractice(mode, { queueSize: cfg.queueSize + 1 })}
                />
              </Row>
            )}
            {mode === "progressive" && (
              <>
                <Row icon={<Hash size={19} strokeWidth={2.4} />} {...tint} label="Start">
                  <Stepper
                    label="starting length"
                    value={cfg.startLength}
                    canDec={cfg.startLength > 2}
                    canInc={cfg.startLength < 20}
                    onDec={() => g.updatePractice(mode, { startLength: cfg.startLength - 1 })}
                    onInc={() => g.updatePractice(mode, { startLength: cfg.startLength + 1 })}
                  />
                </Row>
                <Row icon={<TrendingUp size={19} strokeWidth={2.4} />} {...tint} label="Growth">
                  <Stepper
                    label="steps added per round"
                    value={`+${cfg.increment}`}
                    canDec={cfg.increment > 1}
                    canInc={cfg.increment < 5}
                    onDec={() => g.updatePractice(mode, { increment: cfg.increment - 1 })}
                    onInc={() => g.updatePractice(mode, { increment: cfg.increment + 1 })}
                  />
                </Row>
              </>
            )}
            <Row icon={<Timer size={19} strokeWidth={2.4} />} {...tint} label="Show time">
              <Stepper
                label="show time"
                value={formatSpeed(cfg.displayTime)}
                canDec={cfg.displayTime > 0.1}
                canInc={cfg.displayTime < 5}
                onDec={() => g.updatePractice(mode, { displayTime: Math.max(0.1, round2(cfg.displayTime - down(cfg.displayTime, 0.5))) })}
                onInc={() => g.updatePractice(mode, { displayTime: Math.min(5, round2(cfg.displayTime + up(cfg.displayTime, 0.5))) })}
              />
            </Row>
            {mode === "pattern" && (
              <Row icon={<Gauge size={19} strokeWidth={2.4} />} {...tint} label="Adaptive">
                <Switch checked={cfg.adaptive} onChange={(v) => g.updatePractice(mode, { adaptive: v })} label="Adaptive difficulty" />
              </Row>
            )}
            {mode === "sequence" && (
              <Row icon={<Repeat size={19} strokeWidth={2.4} />} {...tint} label="Repeats">
                <Switch checked={cfg.allowRepeat} onChange={(v) => g.updatePractice(mode, { allowRepeat: v })} label="Allow repeats" />
              </Row>
            )}
            <Row icon={<Trophy size={19} strokeWidth={2.4} />} {...gold} label="Best here">
              <span className="bd-row-value">{practiceBest.plays > 0 ? countOf(practiceBest.best, "rounds") : "—"}</span>
            </Row>
          </div>
        )}

        <div className="bd-cta">
          <button type="button" className="bd-primary" onClick={onStart}>
            <Play size={21} fill="#fff" strokeWidth={0} />
            Play
          </button>
        </div>
      </section>
    </main>
  );
}
