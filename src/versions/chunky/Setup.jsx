import React, { useRef } from "react";
import {
  ChevronLeft,
  CircleHelp,
  Play,
  Trophy,
  Timer,
  SlidersHorizontal,
  Grid3x3,
  Hash,
  Layers,
  TrendingUp,
  Gauge,
  Repeat,
} from "lucide-react";
import { MODES, modeByKey, levelsFor, previewFor, presetDetail, countOf, formatSpeed } from "../../engine/catalog.js";
import { challengeParams, CHALLENGE_DISPLAY_TIME_MIN, CHALLENGE_DISPLAY_TIME_MAX } from "../../challenges.js";
import { practiceLevelMax } from "../../engine/useMemoryGame.js";
import { recordFor, practiceKey } from "../../storage.js";
import { PreviewBoard, Stepper, Switch } from "./ui.jsx";
import { THEME, modeVars } from "./theme.js";

const round2 = (v) => +v.toFixed(2);

function Row({ icon, bg, fg, label, children }) {
  return (
    <div className="ck-row">
      <span className="ck-row-icon" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <span className="ck-row-label">{label}</span>
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

  // Swiping the preview flips between exercises, like the dots.
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
  // Fine steps below a second, coarse above; going down from exactly 1s takes a fine step.
  const slowerBy = (v) => (v < 1 ? 0.1 : 0.25);
  const fasterBy = (v) => (v <= 1 ? 0.1 : 0.25);
  const timeUp = (v) => (v < 1 ? 0.1 : 0.5);
  const timeDown = (v) => (v <= 1 ? 0.1 : 0.5);

  const tint = { bg: t.tint, fg: t.ink };
  const gold = { bg: "#FBEFD5", fg: "#B9821A" };

  return (
    <main className="ck-page" style={modeVars(mode)}>
      <div className="ck-topbar">
        <button type="button" className="ck-key ck-icon-key" onClick={onBack} aria-label="Back">
          <ChevronLeft size={24} strokeWidth={2.8} />
        </button>
        <span className="ck-topbar-title">{modeByKey(mode).name}</span>
        <button type="button" className="ck-key ck-icon-key" onClick={onHelp} aria-label="How to play">
          <CircleHelp size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="ck-dots" role="tablist" aria-label="Exercise">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === mode}
            aria-label={m.name}
            className={`ck-dot${m.key === mode ? " on" : ""}`}
            onClick={() => switchMode(m.key)}
          >
            <span />
          </button>
        ))}
      </div>

      <section className="ck-card ck-preview" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <PreviewBoard mode={mode} n={preview.n} cells={preview.cells} />
        <span className="ck-detail">{g.isChallenge ? presetDetail(g.challenge) : customSummary()}</span>
      </section>

      <div className="ck-levels" role="radiogroup" aria-label="Level">
        {levels.map((l) => {
          const on = g.isChallenge && g.challengeId === l.id;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${l.endless ? "Endless " + l.challenge.title : l.label}${l.best ? `, record ${l.best}` : ""}`}
              className={`ck-key ck-level${on ? " on" : " outline"}`}
              onClick={() => {
                g.emit("tap");
                g.selectChallenge(l.id);
              }}
            >
              <span className="ck-level-label">{l.label}</span>
              <span className="ck-level-rec">
                {l.best > 0 ? (
                  <>
                    <Trophy size={12} strokeWidth={2.8} />
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
          className={`ck-key ck-level${!g.isChallenge ? " on" : " outline"}`}
          onClick={() => {
            g.emit("tap");
            g.selectPractice(mode);
          }}
        >
          <SlidersHorizontal size={22} strokeWidth={2.6} />
        </button>
      </div>

      {g.isChallenge ? (
        <section className="ck-card ck-rows">
          <Row icon={<Trophy size={20} strokeWidth={2.5} />} {...gold} label="Best">
            <span className="ck-row-value">{g.record.best > 0 ? countOf(g.record.best, g.recordNoun) : "—"}</span>
          </Row>
          <Row icon={<Timer size={20} strokeWidth={2.5} />} {...tint} label="Show time">
            <Stepper
              label="show time"
              value={formatSpeed(speed)}
              canDec={speed > CHALLENGE_DISPLAY_TIME_MIN}
              canInc={speed < CHALLENGE_DISPLAY_TIME_MAX}
              onDec={() => g.setChallengeSpeed(g.challengeId, Math.max(CHALLENGE_DISPLAY_TIME_MIN, round2(speed - fasterBy(speed))))}
              onInc={() => g.setChallengeSpeed(g.challengeId, Math.min(CHALLENGE_DISPLAY_TIME_MAX, round2(speed + slowerBy(speed))))}
            />
          </Row>
        </section>
      ) : (
        <section className="ck-card ck-rows">
          <Row icon={<Grid3x3 size={20} strokeWidth={2.5} />} {...tint} label="Board">
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
            <Row icon={<Hash size={20} strokeWidth={2.5} />} {...tint} label={mode === "sequence" ? "Steps" : "Cells"}>
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
            <Row icon={<Layers size={20} strokeWidth={2.5} />} {...tint} label="Queue">
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
              <Row icon={<Hash size={20} strokeWidth={2.5} />} {...tint} label="Start">
                <Stepper
                  label="starting length"
                  value={cfg.startLength}
                  canDec={cfg.startLength > 2}
                  canInc={cfg.startLength < 20}
                  onDec={() => g.updatePractice(mode, { startLength: cfg.startLength - 1 })}
                  onInc={() => g.updatePractice(mode, { startLength: cfg.startLength + 1 })}
                />
              </Row>
              <Row icon={<TrendingUp size={20} strokeWidth={2.5} />} {...tint} label="Growth">
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
          <Row icon={<Timer size={20} strokeWidth={2.5} />} {...tint} label="Show time">
            <Stepper
              label="show time"
              value={formatSpeed(cfg.displayTime)}
              canDec={cfg.displayTime > 0.1}
              canInc={cfg.displayTime < 5}
              onDec={() => g.updatePractice(mode, { displayTime: Math.max(0.1, round2(cfg.displayTime - timeDown(cfg.displayTime))) })}
              onInc={() => g.updatePractice(mode, { displayTime: Math.min(5, round2(cfg.displayTime + timeUp(cfg.displayTime))) })}
            />
          </Row>
          {mode === "pattern" && (
            <Row icon={<Gauge size={20} strokeWidth={2.5} />} {...tint} label="Adaptive">
              <Switch checked={cfg.adaptive} onChange={(v) => g.updatePractice(mode, { adaptive: v })} label="Adaptive difficulty" />
            </Row>
          )}
          {mode === "sequence" && (
            <Row icon={<Repeat size={20} strokeWidth={2.5} />} {...tint} label="Repeats">
              <Switch checked={cfg.allowRepeat} onChange={(v) => g.updatePractice(mode, { allowRepeat: v })} label="Allow repeats" />
            </Row>
          )}
          <Row icon={<Trophy size={20} strokeWidth={2.5} />} {...gold} label="Best here">
            <span className="ck-row-value">{practiceBest.plays > 0 ? countOf(practiceBest.best, "rounds") : "—"}</span>
          </Row>
        </section>
      )}

      <div className="ck-sticky">
        <button type="button" className="ck-key ck-primary" onClick={onStart}>
          <Play size={22} fill="#fff" strokeWidth={0} />
          Start
        </button>
      </div>
    </main>
  );
}
