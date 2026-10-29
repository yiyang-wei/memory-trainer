import React, { useRef } from "react";
import { ChevronLeft, CircleHelp, Play, Trophy, Timer, SlidersHorizontal, Grid3x3, Hash, Layers, TrendingUp, Gauge, Repeat } from "lucide-react";
import { MODES, levelsFor, previewFor, presetDetail, countOf, formatSpeed } from "../../engine/catalog.js";
import { challengeParams, CHALLENGE_DISPLAY_TIME_MIN, CHALLENGE_DISPLAY_TIME_MAX } from "../../challenges.js";
import { practiceLevelMax } from "../../engine/useMemoryGame.js";
import { recordFor, practiceKey } from "../../storage.js";
import { PreviewBoard, Stepper, Switch } from "./ui.jsx";
import { THEME, modeVars } from "./theme.js";

const round1 = (v) => +v.toFixed(2);

function Row({ icon, tint, label, children }) {
  return (
    <div className="gl-row">
      <span className="gl-row-icon" style={{ background: tint.bg, color: tint.fg }}>
        {icon}
      </span>
      <span className="gl-row-label">{label}</span>
      {children}
    </div>
  );
}

export default function Setup({ g, onBack, onStart, onSwitchMode, onHelp }) {
  const mode = g.mode;
  const t = THEME[mode];
  const tint = { bg: t.soft, fg: t.ink };
  const gold = { bg: "#FBF1DC", fg: "#B07B17" };
  const levels = levelsFor(g.stats, mode);
  const cfg = g.config[mode];
  const swipe = useRef(null);

  const preview = g.isChallenge ? previewFor(mode, challengeParams(g.challenge, 0), 3) : previewFor(mode, cfg, 3);

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

  const onTouchStart = (e) => (swipe.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (swipe.current == null) return;
    const dx = e.changedTouches[0].clientX - swipe.current;
    swipe.current = null;
    if (Math.abs(dx) < 50) return;
    const idx = MODES.findIndex((m) => m.key === mode);
    const next = MODES[(idx + (dx < 0 ? 1 : -1) + MODES.length) % MODES.length];
    switchMode(next.key);
  };

  const speed = g.speedFor(g.challengeId);
  const speedStep = (v) => (v <= 1 ? 0.1 : 0.25);
  const practiceBest = recordFor(g.stats, { mode, intent: "practice", configKey: practiceKey(cfg) });
  const levelMax = practiceLevelMax(mode, cfg);
  // Fine steps below a second, coarse above; going down from exactly 1s takes a fine step.
  const timeStep = (v, dir) => (dir < 0 ? (v <= 1 ? 0.1 : 0.5) : v < 1 ? 0.1 : 0.5);

  return (
    <main className="gl-page gl-screen-in" style={modeVars(mode)}>
      <div className="gl-topbar">
        <button type="button" className="gl-icon-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={22} strokeWidth={2.6} />
        </button>
        <span className="gl-topbar-title">{MODES.find((m) => m.key === mode).name}</span>
        <button type="button" className="gl-icon-btn" onClick={onHelp} aria-label="How to play">
          <CircleHelp size={21} strokeWidth={2.4} />
        </button>
      </div>

      <div className="gl-dots" role="tablist" aria-label="Exercise">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === mode}
            aria-label={m.name}
            className={`gl-dot-btn${m.key === mode ? " on" : ""}`}
            onClick={() => switchMode(m.key)}
          >
            <span />
          </button>
        ))}
      </div>

      <section className="gl-card gl-preview" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <PreviewBoard mode={mode} n={preview.n} cells={preview.cells} />
        <span className="gl-pill" style={{ background: t.soft, color: t.ink, boxShadow: "none" }}>
          {g.isChallenge ? presetDetail(g.challenge) : customSummary()}
        </span>
      </section>

      <div className="gl-chips" role="radiogroup" aria-label="Level">
        {levels.map((l) => {
          const on = g.isChallenge && g.challengeId === l.id;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${l.endless ? "Endless " + l.challenge.title : l.label}${l.best ? `, record ${l.best}` : ""}`}
              className={`gl-chip${on ? " on" : ""}`}
              onClick={() => {
                g.emit("tap");
                g.selectChallenge(l.id);
              }}
            >
              <span className="gl-chip-label">{l.label}</span>
              <span className="gl-chip-rec">
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
          className={`gl-chip${!g.isChallenge ? " on" : ""}`}
          onClick={() => {
            g.emit("tap");
            g.selectPractice(mode);
          }}
        >
          <SlidersHorizontal size={20} strokeWidth={2.4} />
        </button>
      </div>

      {g.isChallenge ? (
        <section className="gl-card gl-rows">
          <Row icon={<Trophy size={18} strokeWidth={2.4} />} tint={gold} label="Best">
            <span className="gl-row-value">
              {g.record.best > 0 ? countOf(g.record.best, g.recordNoun) : "—"}
            </span>
          </Row>
          <Row icon={<Timer size={18} strokeWidth={2.4} />} tint={tint} label="Show time">
            <Stepper
              label="show time"
              value={formatSpeed(speed)}
              canDec={speed > CHALLENGE_DISPLAY_TIME_MIN}
              canInc={speed < CHALLENGE_DISPLAY_TIME_MAX}
              onDec={() => g.setChallengeSpeed(g.challengeId, Math.max(CHALLENGE_DISPLAY_TIME_MIN, round1(speed - speedStep(speed - 0.01))))}
              onInc={() => g.setChallengeSpeed(g.challengeId, Math.min(CHALLENGE_DISPLAY_TIME_MAX, round1(speed + (speed < 1 ? 0.1 : 0.25))))}
            />
          </Row>
        </section>
      ) : (
        <section className="gl-card gl-rows">
          <Row icon={<Grid3x3 size={18} strokeWidth={2.4} />} tint={tint} label="Board">
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
            <Row icon={<Hash size={18} strokeWidth={2.4} />} tint={tint} label={mode === "sequence" ? "Steps" : "Cells"}>
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
            <Row icon={<Layers size={18} strokeWidth={2.4} />} tint={tint} label="Queue">
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
              <Row icon={<Hash size={18} strokeWidth={2.4} />} tint={tint} label="Start">
                <Stepper
                  label="starting length"
                  value={cfg.startLength}
                  canDec={cfg.startLength > 2}
                  canInc={cfg.startLength < 20}
                  onDec={() => g.updatePractice(mode, { startLength: cfg.startLength - 1 })}
                  onInc={() => g.updatePractice(mode, { startLength: cfg.startLength + 1 })}
                />
              </Row>
              <Row icon={<TrendingUp size={18} strokeWidth={2.4} />} tint={tint} label="Growth">
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
          <Row icon={<Timer size={18} strokeWidth={2.4} />} tint={tint} label="Show time">
            <Stepper
              label="show time"
              value={formatSpeed(cfg.displayTime)}
              canDec={cfg.displayTime > 0.1}
              canInc={cfg.displayTime < 5}
              onDec={() => g.updatePractice(mode, { displayTime: Math.max(0.1, round1(cfg.displayTime - timeStep(cfg.displayTime - 0.01, -1))) })}
              onInc={() => g.updatePractice(mode, { displayTime: Math.min(5, round1(cfg.displayTime + timeStep(cfg.displayTime, 1))) })}
            />
          </Row>
          {mode === "pattern" && (
            <Row icon={<Gauge size={18} strokeWidth={2.4} />} tint={tint} label="Adaptive">
              <Switch checked={cfg.adaptive} onChange={(v) => g.updatePractice(mode, { adaptive: v })} label="Adaptive difficulty" />
            </Row>
          )}
          {mode === "sequence" && (
            <Row icon={<Repeat size={18} strokeWidth={2.4} />} tint={tint} label="Repeats">
              <Switch checked={cfg.allowRepeat} onChange={(v) => g.updatePractice(mode, { allowRepeat: v })} label="Allow repeats" />
            </Row>
          )}
          <Row icon={<Trophy size={18} strokeWidth={2.4} />} tint={gold} label="Best here">
            <span className="gl-row-value">{practiceBest.plays > 0 ? countOf(practiceBest.best, "rounds") : "—"}</span>
          </Row>
        </section>
      )}

      <div className="gl-sticky-cta">
        <button type="button" className="gl-primary" onClick={onStart}>
          <Play size={20} fill="#fff" strokeWidth={0} />
          Start Game
        </button>
      </div>
    </main>
  );
}
