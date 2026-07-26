import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Settings,
  Play,
  RotateCcw,
  Grid3x3,
  ListOrdered,
  Eye,
  Timer,
  Repeat,
  X,
  Check,
  Flame,
  Minus,
  Plus,
  HeartCrack,
  TrendingUp,
  Layers,
  HelpCircle,
  Gauge,
} from "lucide-react";

const C = {
  bg: "#EEF0F6",
  surface: "#FFFFFF",
  ink: "#3B3F51",
  mutedInk: "#9298AC",
  accent: "#8CA0DB",
  accentSoft: "#DCE4F7",
  success: "#7FBF9E",
  successSoft: "#E1F2E9",
  wrong: "#E38585",
  wrongSoft: "#FBE7E7",
  heart: "#E0778C",
  heartEmpty: "#DEE1EA",
  gold: "#E0AA3E",
  cellIdle: "#E3E6F0",
  cellBorder: "#D3D8E6",
};

const TONE_BG = {
  idle: C.cellIdle,
  highlight: C.accent,
  success: C.success,
  wrong: C.wrong,
};
const TONE_BORDER = {
  idle: C.cellBorder,
  highlight: C.accent,
  success: C.success,
  wrong: C.wrong,
};

// Pattern memory: 6x6 board, 10 cards to find.
// Sequence memory: 3x3 board, 10 steps, repeats allowed.
// Progressive sequence: 3x3 board, starts at 3 steps, +1 each round, repeats always on.
// Queue: 3x3 board, patterns of 4 cells, 3 patterns in flight, reproduce the oldest each round.
const DEFAULT_CONFIG = {
  pattern: { boardSize: 6, level: 10, displayTime: 2, adaptive: true },
  sequence: { boardSize: 3, level: 10, allowRepeat: true, displayTime: 1 },
  progressive: { boardSize: 3, startLength: 3, increment: 1, displayTime: 1 },
  queue: { boardSize: 3, level: 4, queueSize: 3, displayTime: 2 },
};

const MODE_OPTIONS = [
  { key: "pattern", icon: <Grid3x3 size={20} />, label: "Pattern" },
  { key: "sequence", icon: <ListOrdered size={20} />, label: "Sequence" },
  { key: "progressive", icon: <TrendingUp size={20} />, label: "Progressive" },
  { key: "queue", icon: <Layers size={20} />, label: "Queue" },
];

const MODE_BLURB = {
  pattern: "Memorize the highlighted cells, then tap them all.",
  sequence: "Memorize the order, then repeat it back.",
  progressive: "The sequence grows every round — how far can you go?",
  queue: "A queue of patterns keeps growing — reproduce the oldest one while a new one joins the back.",
};

const SUCCESS_HOLD = 480; // how long the success glow lingers before reset
const RESET_ANIM = 700; // how long the flip-down reset wave takes
const RESIZE_HOLD = 900; // how long the board-size-change transition holds, cells already blank

// Adaptive difficulty (pattern mode): level cap per board size, floor(totalCells^(2/3)),
// except at the max board (8x8) where there's no bigger board to grow into, so the cap
// switches to half the board instead (matches the fixed-level mode's own cap formula).
const ADAPTIVE_MIN_BOARD = 3;
const ADAPTIVE_MAX_BOARD = 8;
const ADAPTIVE_MIN_LEVEL = 2;

const levelCapForBoard = (boardSize) => {
  const t = boardSize * boardSize;
  if (boardSize >= ADAPTIVE_MAX_BOARD) return Math.floor(t / 2);
  return Math.floor(Math.pow(t, 2 / 3));
};

// Two clears in a row bump the level by one; if that overflows the current board's cap,
// grow the board instead (the level carries over, since a bigger board has more headroom).
const computeAdaptiveClear = (a) => {
  const clearStreak = a.clearStreak + 1;
  if (clearStreak < 2) return { ...a, clearStreak, failStreak: 0 };
  let { level, boardSize } = a;
  level += 1;
  if (level > levelCapForBoard(boardSize) && boardSize < ADAPTIVE_MAX_BOARD) {
    boardSize += 1;
  }
  return { level, boardSize, clearStreak: 0, failStreak: 0 };
};

// Two fails in a row drop the level by one; if that goes below the floor, shrink the
// board instead and jump back up to that smaller board's own cap.
const computeAdaptiveFail = (a) => {
  const failStreak = a.failStreak + 1;
  if (failStreak < 2) return { ...a, failStreak, clearStreak: 0 };
  let { level, boardSize } = a;
  level -= 1;
  if (level < ADAPTIVE_MIN_LEVEL && boardSize > ADAPTIVE_MIN_BOARD) {
    boardSize -= 1;
    level = levelCapForBoard(boardSize);
  } else {
    level = Math.max(ADAPTIVE_MIN_LEVEL, level);
  }
  return { level, boardSize, clearStreak: 0, failStreak: 0 };
};

// Tutorial demos run on a fixed illustrative 4x4 grid, independent of real settings.
// Each frame: which cells are lit (highlight/success), a caption, and how long to hold it.
const TUTORIAL_SCRIPTS = {
  pattern: [
    { highlight: [1, 6, 11], caption: "Memorize the glowing cells", duration: 1300 },
    { caption: "Now find them from memory", duration: 450 },
    { success: [1], caption: "Now find them from memory", duration: 450 },
    { success: [1, 6], caption: "Now find them from memory", duration: 450 },
    { success: [1, 6, 11], caption: "Nice! Found them all", duration: 1000 },
    { caption: "", duration: 450 },
  ],
  sequence: [
    { highlight: [2], caption: "Watch the order light up...", duration: 650 },
    { caption: "Watch the order light up...", duration: 320 },
    { highlight: [9], caption: "Watch the order light up...", duration: 650 },
    { caption: "Watch the order light up...", duration: 320 },
    { highlight: [7], caption: "Watch the order light up...", duration: 650 },
    { caption: "Repeat it back, in order", duration: 400 },
    { success: [2], caption: "Repeat it back, in order", duration: 450 },
    { success: [2, 9], caption: "Repeat it back, in order", duration: 450 },
    { success: [2, 9, 7], caption: "Perfect sequence!", duration: 1000 },
    { caption: "", duration: 450 },
  ],
  progressive: [
    { highlight: [5], caption: "A short sequence to start...", duration: 600 },
    { caption: "A short sequence to start...", duration: 320 },
    { highlight: [10], caption: "A short sequence to start...", duration: 600 },
    { caption: "Repeat it back", duration: 450 },
    { success: [5], caption: "Repeat it back", duration: 400 },
    { success: [5, 10], caption: "Repeat it back", duration: 500 },
    { caption: "Get it right and it grows by one", duration: 550 },
    { highlight: [5], caption: "Same sequence, from the top...", duration: 550 },
    { caption: "Same sequence, from the top...", duration: 320 },
    { highlight: [10], caption: "Same sequence, from the top...", duration: 550 },
    { caption: "...plus one new step", duration: 320 },
    { highlight: [2], caption: "...plus one new step", duration: 600 },
    { caption: "Repeat all three", duration: 350 },
    { success: [5], caption: "Repeat all three", duration: 350 },
    { success: [5, 10], caption: "Repeat all three", duration: 350 },
    { success: [5, 10, 2], caption: "It keeps growing — how far can you go?", duration: 1100 },
    { caption: "", duration: 500 },
  ],
  queue: [
    { highlight: [0, 13], caption: "Patterns flash, one after another...", duration: 650 },
    { caption: "Patterns flash, one after another...", duration: 320 },
    { highlight: [6, 11], caption: "Patterns flash, one after another...", duration: 650 },
    { caption: "Patterns flash, one after another...", duration: 320 },
    { highlight: [2, 9], caption: "Patterns flash, one after another...", duration: 650 },
    { caption: "Reproduce the OLDEST one first", duration: 450 },
    { success: [0], caption: "Reproduce the oldest one first", duration: 400 },
    { success: [0, 13], caption: "Got it! A new one joins the back...", duration: 800 },
    { caption: "A new one joins the back...", duration: 450 },
    { highlight: [4, 15], caption: "...and flashes once", duration: 650 },
    { caption: "Now reproduce the next oldest", duration: 500 },
    { success: [6], caption: "Now reproduce the next oldest", duration: 400 },
    { success: [6, 11], caption: "Keep the queue moving!", duration: 1000 },
    { caption: "", duration: 500 },
  ],
};

function Stepper({ icon, value, onChange, min, max, step = 1, format }) {
  const s = typeof step === "function" ? step(value) : step;
  const dec = () => onChange(Math.max(min, +(value - s).toFixed(2)));
  const inc = () => onChange(Math.min(max, +(value + s).toFixed(2)));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: C.bg,
        borderRadius: 16,
        padding: "10px 14px",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: C.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.accent,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={dec}
          disabled={value <= min}
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            border: "none",
            background: C.surface,
            boxShadow: "0 1px 2px rgba(59,63,81,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: value <= min ? C.mutedInk : C.ink,
            cursor: value <= min ? "default" : "pointer",
            opacity: value <= min ? 0.5 : 1,
          }}
        >
          <Minus size={14} />
        </button>
        <div
          style={{
            minWidth: 44,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            color: C.ink,
            fontSize: 15,
          }}
        >
          {format ? format(value) : value}
        </div>
        <button
          onClick={inc}
          disabled={value >= max}
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            border: "none",
            background: C.surface,
            boxShadow: "0 1px 2px rgba(59,63,81,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: value >= max ? C.mutedInk : C.ink,
            cursor: value >= max ? "default" : "pointer",
            opacity: value >= max ? 0.5 : 1,
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ icon, checked, onChange, label = "Toggle" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: C.bg,
        borderRadius: 16,
        padding: "10px 14px",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: checked ? C.accentSoft : "#E7E9F1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: checked ? C.accent : C.mutedInk,
        }}
      >
        {icon}
      </div>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={label}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          border: "none",
          background: checked ? C.accent : "#D5D9E5",
          position: "relative",
          cursor: "pointer",
          transition: "background 150ms ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 150ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

function ModeCarousel({ mode, onChange, options }) {
  const cardRefs = useRef({});
  useEffect(() => {
    const el = cardRefs.current[mode];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [mode]);

  return (
    <div className="mode-carousel">
      {options.map((o) => (
        <button
          key={o.key}
          ref={(el) => {
            cardRefs.current[o.key] = el;
          }}
          onClick={() => onChange(o.key)}
          className="mode-card"
          style={{
            background: mode === o.key ? C.accent : C.bg,
            color: mode === o.key ? "#fff" : C.mutedInk,
          }}
        >
          {o.icon}
          <span style={{ fontWeight: 700, fontSize: 12 }}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function TutorialPlayer({ script }) {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    setFrameIdx(0);
    let idx = 0;
    let cancelled = false;
    let id;
    const step = () => {
      if (cancelled) return;
      setFrameIdx(idx);
      id = setTimeout(() => {
        idx = (idx + 1) % script.length;
        step();
      }, script[idx].duration);
    };
    step();
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [script]);

  const frame = script[frameIdx] || script[0];
  const size = 4;
  const total = size * size;
  const highlightSet = new Set(frame.highlight || []);
  const successSet = new Set(frame.success || []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: 168, aspectRatio: "1 / 1" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
            gap: 6,
            width: "100%",
            height: "100%",
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const isSuccess = successSet.has(i);
            const isHighlight = highlightSet.has(i);
            const faceUp = isSuccess || isHighlight;
            const tone = isSuccess ? "success" : isHighlight ? "highlight" : "idle";
            return (
              <Card
                key={i}
                faceUp={faceUp}
                tone={tone}
                content={isSuccess ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
                badge={null}
                clickable={false}
                onClick={() => {}}
                transitionDelay="0ms"
                shake={false}
              />
            );
          })}
        </div>
      </div>
      <div
        style={{
          minHeight: 34,
          textAlign: "center",
          color: C.ink,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.35,
          padding: "0 8px",
        }}
      >
        {frame.caption}
      </div>
    </div>
  );
}

function TutorialModal({ mode, onModeChange, onClose }) {
  return (
    <div
      className="settings-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(59,63,81,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="settings-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface,
          borderRadius: 24,
          padding: 20,
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 12px 40px rgba(59,63,81,0.25)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.ink, fontWeight: 700, fontSize: 16 }}>
            <HelpCircle size={18} />
            How to Play
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              border: "none",
              background: C.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.mutedInk,
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <ModeCarousel mode={mode} onChange={onModeChange} options={MODE_OPTIONS} />

        <div style={{ textAlign: "center", color: C.mutedInk, fontSize: 12, lineHeight: 1.4 }}>{MODE_BLURB[mode]}</div>

        <div style={{ background: C.bg, borderRadius: 18, padding: "18px 12px" }}>
          <TutorialPlayer script={TUTORIAL_SCRIPTS[mode]} />
        </div>
      </div>
    </div>
  );
}

function DrainBar({ duration, active, barKey }) {
  const [width, setWidth] = useState("100%");
  useEffect(() => {
    if (!active) return;
    setWidth("100%");
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setWidth("0%"));
    });
    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barKey, active]);
  return (
    <div style={{ height: 8, borderRadius: 6, background: C.accentSoft, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width,
          background: C.accent,
          transition: active ? `width ${duration}s linear` : "none",
        }}
      />
    </div>
  );
}

function SegmentBar({ count, filled, current, color, currentColor }) {
  const segs = Array.from({ length: count }, (_, i) => i);
  return (
    <div style={{ display: "flex", gap: 4, height: 8, flexWrap: "wrap" }}>
      {segs.map((i) => {
        let bg = C.accentSoft;
        if (currentColor !== undefined && i === current) bg = currentColor;
        else if (i < filled) bg = color;
        return (
          <div
            key={i}
            style={{
              flex: "1 0 6px",
              minWidth: 6,
              borderRadius: 6,
              background: bg,
              transition: "background 150ms ease",
            }}
          />
        );
      })}
    </div>
  );
}

function Card({ faceUp, tone, content, badge, clickable, onClick, transitionDelay, transitionDuration, shake }) {
  return (
    <div className={`cell-wrap${shake ? " shake" : ""}`}>
      <div className="card-scene">
        <button
          onClick={onClick}
          disabled={!clickable}
          aria-label="cell"
          className={`card${faceUp ? " flipped" : ""}${clickable ? "" : " no-interact"}`}
          style={{ transitionDelay, transitionDuration }}
        >
          <div className="card-face card-face-front" style={{ background: C.cellIdle, borderColor: C.cellBorder }} />
          <div
            className="card-face card-face-back"
            style={{ background: TONE_BG[tone], borderColor: TONE_BORDER[tone] }}
          >
            {content}
            {badge && (
              <span
                style={{
                  position: "absolute",
                  bottom: 3,
                  right: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  opacity: 0.9,
                }}
              >
                {badge}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

export default function MemoryGridTrainer() {
  const [mode, setMode] = useState("pattern"); // 'pattern' | 'sequence' | 'progressive' | 'queue'
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [phase, setPhase] = useState("idle"); // idle, memorize, recall, success, resetting, gameover
  const [pattern, setPattern] = useState(new Set());
  const [found, setFound] = useState(new Set());
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeStepPos, setActiveStepPos] = useState(-1);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [wrongCells, setWrongCells] = useState(new Set()); // cells confirmed wrong for the current round/step
  const [flashCorrect, setFlashCorrect] = useState(null);
  const [queueList, setQueueList] = useState([]); // queue mode: patterns waiting behind the current target
  const [revealPatterns, setRevealPatterns] = useState([]); // queue mode: pattern(s) currently rolling in memorize phase
  const [adaptive, setAdaptive] = useState(null); // pattern mode: { level, boardSize, clearStreak, failStreak }

  const [hearts, setHearts] = useState(3);
  const [strikes, setStrikes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [barKey, setBarKey] = useState(0);

  const timers = useRef([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };
  useEffect(() => () => clearTimers(), []);

  const isProgressive = mode === "progressive";
  const isSequenceLike = mode === "sequence" || isProgressive;
  const isPatternLike = mode === "pattern" || mode === "queue";

  const modeConfig = config[mode];
  const isAdaptivePattern = mode === "pattern" && modeConfig.adaptive;
  // configBoardSize/configLevel are the saved settings (what the Settings sheet shows and
  // edits); boardSize/level are what's actually in play, which for an active adaptive
  // session diverges from the saved config until the next fresh game re-seeds it.
  const configBoardSize = modeConfig.boardSize;
  const configLevel = modeConfig.level;
  const boardSize = isAdaptivePattern && adaptive ? adaptive.boardSize : configBoardSize;
  const displayTime = modeConfig.displayTime;
  const level = isAdaptivePattern && adaptive ? adaptive.level : configLevel;
  const allowRepeat = mode === "sequence" ? modeConfig.allowRepeat : isProgressive;
  const total = boardSize * boardSize;
  // Pattern/Queue: cap at half the board so the last few cells aren't a trivial deduction.
  // Sequence: repeats make length effectively unbounded, so just cap at a generous 60.
  const configTotal = configBoardSize * configBoardSize;
  const maxLevel =
    isPatternLike ? Math.floor(configTotal / 2) : allowRepeat ? 60 : Math.min(configTotal - 1, 60);

  const updateModeConfig = (patch) =>
    setConfig((c) => ({ ...c, [mode]: { ...c[mode], ...patch } }));

  const updateBoardSize = (v) =>
    setConfig((c) => {
      const mc = c[mode];
      if (mode === "progressive") {
        return { ...c, [mode]: { ...mc, boardSize: v } };
      }
      const t = v * v;
      const maxL = mode === "pattern" || mode === "queue" ? Math.floor(t / 2) : mc.allowRepeat ? 60 : Math.min(t - 1, 60);
      return { ...c, [mode]: { ...mc, boardSize: v, level: Math.min(mc.level, maxL) } };
    });

  const updateAllowRepeat = (val) =>
    setConfig((c) => {
      const mc = c[mode];
      const t = mc.boardSize * mc.boardSize;
      const maxL = val ? 60 : Math.min(t - 1, 60);
      return { ...c, [mode]: { ...mc, allowRepeat: val, level: Math.min(mc.level, maxL) } };
    });

  const generatePatternOfSize = (size, t = total) => {
    const idxs = Array.from({ length: t }, (_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return new Set(idxs.slice(0, size));
  };

  const generateSequence = () => {
    if (allowRepeat) {
      return Array.from({ length: level }, () => Math.floor(Math.random() * total));
    }
    const idxs = Array.from({ length: total }, (_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return idxs.slice(0, level);
  };

  const initProgressiveSequence = () =>
    Array.from({ length: modeConfig.startLength }, () => Math.floor(Math.random() * total));

  const growProgressiveSequence = (prevSeq) => {
    const appended = Array.from({ length: modeConfig.increment }, () => Math.floor(Math.random() * total));
    return [...prevSeq, ...appended];
  };

  const startRound = (isFirstRound = false, overrides = null) => {
    clearTimers();
    setWrongCells(new Set());
    setFlashCorrect(null);
    setHearts(3); // hearts refresh every round

    if (mode === "pattern") {
      const roundLevel = overrides?.level ?? level;
      const roundBoardSize = overrides?.boardSize ?? boardSize;
      const roundTotal = roundBoardSize * roundBoardSize;
      const p = generatePatternOfSize(roundLevel, roundTotal);
      setPattern(p);
      setFound(new Set());
      setPhase("memorize");
      setBarKey((k) => k + 1);
      addTimer(() => setPhase("recall"), displayTime * 1000);
    } else if (mode === "queue") {
      setFound(new Set());
      setPhase("memorize");
      setActiveStepPos(-1);
      setRevealedSteps(0);
      const stepDur = displayTime * 1000;
      const gap = 200;

      if (isFirstRound) {
        const qSize = modeConfig.queueSize;
        const initialQueue = Array.from({ length: qSize }, () => generatePatternOfSize(level));
        setQueueList(initialQueue);
        setPattern(initialQueue[0]);
        setRevealPatterns(initialQueue);
        initialQueue.forEach((_, idx) => {
          const onAt = idx * (stepDur + gap);
          addTimer(() => setActiveStepPos(idx), onAt);
          addTimer(() => {
            setActiveStepPos(-1);
            setRevealedSteps(idx + 1);
          }, onAt + stepDur);
        });
        addTimer(() => setPhase("recall"), qSize * (stepDur + gap));
      } else {
        const newPattern = generatePatternOfSize(level);
        const nextQueue = [...queueList.slice(1), newPattern];
        setQueueList(nextQueue);
        setPattern(nextQueue[0]);
        setRevealPatterns([newPattern]);
        addTimer(() => setActiveStepPos(0), 0);
        addTimer(() => {
          setActiveStepPos(-1);
          setRevealedSteps(1);
        }, stepDur);
        addTimer(() => setPhase("recall"), stepDur + gap);
      }
    } else {
      const seq = isProgressive
        ? isFirstRound
          ? initProgressiveSequence()
          : growProgressiveSequence(sequence)
        : generateSequence();
      setSequence(seq);
      setInputIndex(0);
      setRevealedSteps(0);
      setActiveStepPos(-1);
      setPhase("memorize");
      const stepDur = displayTime * 1000;
      const gap = 200;
      seq.forEach((_, idx) => {
        const onAt = idx * (stepDur + gap);
        addTimer(() => setActiveStepPos(idx), onAt);
        addTimer(() => {
          setActiveStepPos(-1);
          setRevealedSteps(idx + 1);
        }, onAt + stepDur);
      });
      addTimer(() => setPhase("recall"), seq.length * (stepDur + gap));
    }
  };

  const startGame = () => {
    clearTimers();
    setStrikes(0);
    setStreak(0);
    if (isAdaptivePattern) {
      setAdaptive({ level: modeConfig.level, boardSize: modeConfig.boardSize, clearStreak: 0, failStreak: 0 });
    }
    startRound(true);
  };

  const advanceRound = (overrides = null, holdBeforeReset = SUCCESS_HOLD) => {
    addTimer(() => setPhase("resetting"), holdBeforeReset);
    addTimer(() => startRound(false, overrides), holdBeforeReset + RESET_ANIM);
  };

  // Adaptive clear/fail transitions that also change the board size need an extra beat:
  // the reset wave hides the old pattern first, THEN the grid reshapes (still blank) with
  // its own "resizing" cue, and only after that does the next round reveal anything. This
  // avoids the grid reshaping while the old round's pattern is still visibly on screen.
  const advanceAdaptiveRound = (nextAdaptive, holdBeforeReset) => {
    const overrides = { level: nextAdaptive.level, boardSize: nextAdaptive.boardSize };
    if (adaptive.boardSize === nextAdaptive.boardSize) {
      setAdaptive(nextAdaptive);
      advanceRound(overrides, holdBeforeReset);
      return;
    }
    addTimer(() => setPhase("resetting"), holdBeforeReset);
    addTimer(() => {
      setAdaptive(nextAdaptive);
      setPhase("resizing");
    }, holdBeforeReset + RESET_ANIM);
    addTimer(() => startRound(false, overrides), holdBeforeReset + RESET_ANIM + RESIZE_HOLD);
  };

  const registerWrong = () => {
    setStrikes((s) => s + 1);
    setHearts((h) => {
      const nh = h - 1;
      if (nh <= 0) {
        if (isAdaptivePattern) {
          // Adaptive mode never hard-stops: a depleted-hearts round is a "fail" that
          // adjusts the level/board (if it's the 2nd fail in a row) and keeps going.
          const nextAdaptive = computeAdaptiveFail(adaptive);
          advanceAdaptiveRound(nextAdaptive, 380);
        } else {
          addTimer(() => setPhase("gameover"), 380);
        }
      }
      return nh;
    });
  };

  const handleCellClick = (i) => {
    if (phase !== "recall") return;

    if (isPatternLike) {
      if (found.has(i) || wrongCells.has(i)) return;
      if (pattern.has(i)) {
        const nf = new Set(found);
        nf.add(i);
        setFound(nf);
        if (nf.size === pattern.size) {
          setPhase("success");
          setStreak((s) => s + 1);
          if (isAdaptivePattern) {
            advanceAdaptiveRound(computeAdaptiveClear(adaptive), SUCCESS_HOLD);
          } else {
            advanceRound();
          }
        }
      } else {
        setWrongCells((prev) => new Set(prev).add(i));
        registerWrong();
      }
    } else {
      if (wrongCells.has(i)) return;
      const expected = sequence[inputIndex];
      if (i === expected) {
        setFlashCorrect(i);
        addTimer(() => setFlashCorrect(null), 220);
        setWrongCells(new Set()); // moving to a new step — earlier wrong guesses may be valid here
        const next = inputIndex + 1;
        setInputIndex(next);
        if (next === sequence.length) {
          setPhase("success");
          setStreak((s) => s + 1);
          advanceRound();
        }
      } else {
        setWrongCells((prev) => new Set(prev).add(i));
        registerWrong();
      }
    }
  };

  const resetToIdle = () => {
    clearTimers();
    setPhase("idle");
    setHearts(3);
    setStrikes(0);
    setStreak(0);
    setPattern(new Set());
    setFound(new Set());
    setSequence([]);
    setInputIndex(0);
    setActiveStepPos(-1);
    setRevealedSteps(0);
    setWrongCells(new Set());
    setFlashCorrect(null);
    setQueueList([]);
    setRevealPatterns([]);
    setAdaptive(null);
  };

  const applySettingsAndRestart = () => {
    setShowSettings(false);
    resetToIdle();
  };

  // Switching modes mid-round would leave stale round state rendering against the new
  // mode's board size, so any mode picker (idle screen, settings, tutorial) routes here.
  const changeMode = (key) => {
    setMode(key);
    resetToIdle();
  };

  // Settings can change board size/level live; if a round were still running underneath,
  // those edits would resize the grid out from under it. So opening Settings immediately
  // stops the game — the only way back in is Apply & Restart, then pressing Play again.
  const openSettings = () => {
    resetToIdle();
    setShowSettings(true);
  };

  // Smaller gap on bigger boards so cells stay a reasonable size; scale the flip speed
  // down for very short display times so it can complete within the reveal window.
  const cellGap = Math.max(3, 8 - (boardSize - 3));
  const boardMax = 380;
  const flipMs = Math.min(420, displayTime * 1000 * 0.6);

  const getCellVisual = (i) => {
    let tone = "idle";
    let content = null;
    let badge = null;
    let faceUp = false;

    if (phase === "memorize" && mode === "pattern" && pattern.has(i)) {
      faceUp = true;
      tone = "highlight";
    }
    if (phase === "memorize" && mode === "queue" && activeStepPos >= 0 && revealPatterns[activeStepPos]?.has(i)) {
      faceUp = true;
      tone = "highlight";
    }
    if (phase === "memorize" && isSequenceLike && activeStepPos >= 0 && sequence[activeStepPos] === i) {
      faceUp = true;
      tone = "highlight";
    }
    if (phase === "recall" || phase === "success") {
      if (isPatternLike && found.has(i)) {
        faceUp = true;
        tone = "success";
        content = <Check size={18} color="#fff" strokeWidth={3} />;
      }
      if (isSequenceLike && flashCorrect === i) {
        faceUp = true;
        tone = "success";
        content = <Check size={18} color="#fff" strokeWidth={3} />;
      }
    }
    if (phase === "gameover") {
      if (isPatternLike && pattern.has(i)) {
        faceUp = true;
        const isFound = found.has(i);
        tone = isFound ? "success" : "highlight";
        content = isFound ? <Check size={16} color="#fff" strokeWidth={3} /> : null;
      }
      if (isSequenceLike) {
        const positions = sequence.reduce((acc, c, p) => (c === i ? [...acc, p] : acc), []);
        if (positions.length > 0) {
          faceUp = true;
          const pending = positions.some((p) => p >= inputIndex);
          tone = pending ? "highlight" : "success";
          badge = positions.map((p) => p + 1).join(",");
        }
      }
    }
    if (wrongCells.has(i)) {
      faceUp = true;
      tone = "wrong";
      content = <X size={18} color="#fff" strokeWidth={3} />;
    }
    if (phase === "resetting" || phase === "resizing") {
      faceUp = false;
    }

    return { faceUp, tone, content, badge };
  };

  // Streak doesn't reflect difficulty in modes where the level itself climbs, so those
  // show the current level as the headline stat instead.
  const showsLevelStat = isProgressive || isAdaptivePattern;
  const primaryStatValue = isProgressive ? sequence.length : isAdaptivePattern ? level : streak;

  let barNode = null;
  if (phase === "memorize" && mode === "pattern") {
    barNode = <DrainBar duration={displayTime} active barKey={barKey} />;
  } else if (phase === "memorize" && mode === "queue") {
    barNode = (
      <SegmentBar
        count={Math.max(revealPatterns.length, 1)}
        filled={revealedSteps}
        current={activeStepPos}
        color={C.accent}
        currentColor={C.gold}
      />
    );
  } else if (phase === "memorize" && isSequenceLike) {
    barNode = (
      <SegmentBar
        count={Math.max(sequence.length, 1)}
        filled={revealedSteps}
        current={activeStepPos}
        color={C.accent}
        currentColor={C.gold}
      />
    );
  } else if ((phase === "recall" || phase === "success") && isSequenceLike) {
    barNode = (
      <SegmentBar
        count={Math.max(sequence.length, 1)}
        filled={inputIndex}
        current={inputIndex}
        color={C.success}
        currentColor={C.gold}
      />
    );
  } else if ((phase === "recall" || phase === "success") && isPatternLike) {
    barNode = <SegmentBar count={Math.max(pattern.size, 1)} filled={found.size} color={C.success} />;
  } else {
    barNode = <div style={{ height: 8 }} />;
  }

  return (
    <div
      style={{
        minHeight: 620,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        background: C.bg,
        fontFamily: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.surface,
            borderRadius: 20,
            padding: "12px 16px",
            boxShadow: "0 2px 10px rgba(59,63,81,0.06)",
          }}
        >
          <div key={hearts} className="hearts-row pulse">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={22}
                color={i < hearts ? C.heart : C.heartEmpty}
                fill={i < hearts ? C.heart : "none"}
                strokeWidth={i < hearts ? 0 : 2}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: showsLevelStat ? C.accent : C.gold }}>
              {showsLevelStat ? <TrendingUp size={18} /> : <Flame size={18} fill={C.gold} strokeWidth={0} />}
              <span key={primaryStatValue} className="streak-pop" style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
                {primaryStatValue}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.mutedInk }}>
              <X size={16} strokeWidth={3} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{strikes}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setShowTutorial(true)}
              aria-label="How to play"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: C.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.ink,
                cursor: "pointer",
              }}
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={openSettings}
              aria-label="Settings"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "none",
                background: C.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.ink,
                cursor: "pointer",
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div
          className={phase === "success" ? "board-pulse" : phase === "resizing" ? "board-resize-pulse" : ""}
          style={{
            position: "relative",
            background: C.surface,
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 2px 14px rgba(59,63,81,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {barNode}

          <div style={{ position: "relative", width: "100%", maxWidth: boardMax, aspectRatio: "1 / 1", margin: "0 auto" }}>
            <div
              className={phase === "resizing" ? "grid-resize-fade" : ""}
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                gridTemplateRows: `repeat(${boardSize}, 1fr)`,
                gap: cellGap,
              }}
            >
              {Array.from({ length: total }, (_, i) => {
                const { faceUp, tone, content, badge } = getCellVisual(i);
                // A cell confirmed wrong stays locked (and marked) for the rest of this
                // round/step — it can't be the answer, so don't let it cost another heart.
                // Once hearts hit 0, lock the whole board so late taps can't sneak in
                // during the brief delay before the round actually ends.
                const clickable = phase === "recall" && !wrongCells.has(i) && hearts > 0;
                const row = Math.floor(i / boardSize);
                const col = i % boardSize;
                const waveDelay = Math.min((row + col) * 30, 240);
                // Pattern/Queue's memorize reveal flips all at once; only the between-round reset uses the wave.
                const transitionDelay = phase === "resetting" ? `${waveDelay}ms` : "0ms";
                return (
                  <Card
                    key={i}
                    faceUp={faceUp}
                    tone={tone}
                    content={content}
                    badge={badge}
                    clickable={clickable}
                    onClick={() => handleCellClick(i)}
                    transitionDelay={transitionDelay}
                    transitionDuration={`${flipMs}ms`}
                    shake={wrongCells.has(i)}
                  />
                );
              })}
            </div>

            {phase === "idle" && (
              <div
                className="idle-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.88)",
                  borderRadius: 12,
                }}
              >
                <button
                  onClick={startGame}
                  aria-label="Start"
                  className="play-btn"
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    border: "none",
                    background: C.accent,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 18px rgba(140,160,219,0.5)",
                    cursor: "pointer",
                  }}
                >
                  <Play size={30} fill="#fff" style={{ marginLeft: 4 }} />
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", color: C.mutedInk, fontSize: 12, letterSpacing: 0.2 }}>
            {phase === "memorize" && "Memorize"}
            {phase === "recall" && "Your turn"}
            {phase === "idle" && "Press play to begin"}
            {phase === "success" && "Nice!"}
            {phase === "resetting" && "Next round..."}
            {phase === "resizing" && `Board resizing to ${boardSize}×${boardSize}...`}
            {phase === "gameover" && "Here's the answer"}
          </div>
        </div>

        {phase === "idle" && (
          <div
            className="idle-mode-panel"
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: "16px 0 18px",
              boxShadow: "0 2px 14px rgba(59,63,81,0.07)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <ModeCarousel mode={mode} onChange={changeMode} options={MODE_OPTIONS} />
            <div style={{ textAlign: "center", color: C.mutedInk, fontSize: 12, lineHeight: 1.4, padding: "0 20px" }}>
              {MODE_BLURB[mode]}
            </div>
          </div>
        )}

        {phase === "gameover" && (
          <div
            className="gameover-panel"
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: 18,
              boxShadow: "0 2px 14px rgba(59,63,81,0.07)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <HeartCrack size={34} color={C.heart} />
            <div style={{ display: "flex", gap: 22 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", color: C.gold }}>
                  <Flame size={16} fill={C.gold} strokeWidth={0} />
                </div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 17 }}>{streak}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", color: C.mutedInk }}>
                  <X size={15} strokeWidth={3} />
                </div>
                <div style={{ fontWeight: 700, color: C.ink, fontSize: 17 }}>{strikes}</div>
              </div>
              {isProgressive && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", color: C.accent }}>
                    <TrendingUp size={16} />
                  </div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 17 }}>{sequence.length}</div>
                </div>
              )}
            </div>
            <button
              onClick={resetToIdle}
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: "none",
                background: C.accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(140,160,219,0.5)",
              }}
              aria-label="Back to menu"
            >
              <RotateCcw size={22} />
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div
          className="settings-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(59,63,81,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            className="settings-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface,
              borderRadius: 24,
              padding: 20,
              width: "100%",
              maxWidth: 360,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 12px 40px rgba(59,63,81,0.25)",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.ink, fontWeight: 700, fontSize: 16 }}>
              <Settings size={18} />
              Settings
            </div>

            <ModeCarousel mode={mode} onChange={changeMode} options={MODE_OPTIONS} />

            {mode === "sequence" && (
              <ToggleRow icon={<Repeat size={16} />} checked={allowRepeat} onChange={updateAllowRepeat} label="Allow repeat" />
            )}

            {mode === "pattern" && (
              <ToggleRow
                icon={<Gauge size={16} />}
                checked={modeConfig.adaptive}
                onChange={(v) => updateModeConfig({ adaptive: v })}
                label="Adaptive difficulty"
              />
            )}

            <Stepper
              icon={<Grid3x3 size={16} />}
              value={configBoardSize}
              onChange={updateBoardSize}
              min={3}
              max={8}
              format={(v) => `${v}×${v}`}
            />

            {!isProgressive && (
              <Stepper
                icon={mode === "sequence" ? <ListOrdered size={16} /> : <Eye size={16} />}
                value={configLevel}
                onChange={(v) => updateModeConfig({ level: v })}
                min={2}
                max={maxLevel}
              />
            )}

            {mode === "queue" && (
              <Stepper
                icon={<Layers size={16} />}
                value={modeConfig.queueSize}
                onChange={(v) => updateModeConfig({ queueSize: v })}
                min={2}
                max={6}
              />
            )}

            {isProgressive && (
              <>
                <Stepper
                  icon={<ListOrdered size={16} />}
                  value={modeConfig.startLength}
                  onChange={(v) => updateModeConfig({ startLength: v })}
                  min={2}
                  max={20}
                />
                <Stepper
                  icon={<TrendingUp size={16} />}
                  value={modeConfig.increment}
                  onChange={(v) => updateModeConfig({ increment: v })}
                  min={1}
                  max={5}
                />
              </>
            )}

            <Stepper
              icon={<Timer size={16} />}
              value={displayTime}
              onChange={(v) => updateModeConfig({ displayTime: v })}
              min={0.1}
              max={5}
              step={(v) => (v < 1 ? 0.1 : 0.5)}
              format={(v) => `${v.toFixed(1)}s`}
            />

            <button
              onClick={applySettingsAndRestart}
              style={{
                marginTop: 6,
                border: "none",
                background: C.accent,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 14,
                padding: "12px 0",
                cursor: "pointer",
              }}
            >
              Apply & Restart
            </button>
          </div>
        </div>
      )}

      {showTutorial && (
        <TutorialModal mode={mode} onModeChange={changeMode} onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
