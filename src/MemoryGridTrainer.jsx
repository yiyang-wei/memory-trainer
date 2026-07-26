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
  pattern: { boardSize: 6, level: 10, displayTime: 2 },
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

function ToggleRow({ icon, checked, onChange }) {
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
        aria-label="Allow repeat"
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

function Card({ faceUp, tone, content, badge, clickable, onClick, transitionDelay, shake }) {
  return (
    <div className={`cell-wrap${shake ? " shake" : ""}`}>
      <div className="card-scene">
        <button
          onClick={onClick}
          disabled={!clickable}
          aria-label="cell"
          className={`card${faceUp ? " flipped" : ""}${clickable ? "" : " no-interact"}`}
          style={{ transitionDelay }}
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

  const [phase, setPhase] = useState("idle"); // idle, memorize, recall, success, resetting, gameover
  const [pattern, setPattern] = useState(new Set());
  const [found, setFound] = useState(new Set());
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeStepPos, setActiveStepPos] = useState(-1);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [wrongCell, setWrongCell] = useState(null);
  const [flashCorrect, setFlashCorrect] = useState(null);
  const [queueList, setQueueList] = useState([]); // queue mode: patterns waiting behind the current target
  const [revealPatterns, setRevealPatterns] = useState([]); // queue mode: pattern(s) currently rolling in memorize phase

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
  const { boardSize, displayTime } = modeConfig;
  const level = modeConfig.level;
  const allowRepeat = mode === "sequence" ? modeConfig.allowRepeat : isProgressive;
  const total = boardSize * boardSize;
  // Pattern/Queue: cap at half the board so the last few cells aren't a trivial deduction.
  // Sequence: repeats make length effectively unbounded, so just cap at a generous 60.
  const maxLevel =
    isPatternLike ? Math.floor(total / 2) : allowRepeat ? 60 : Math.min(total - 1, 60);

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

  const generatePatternOfSize = (size) => {
    const idxs = Array.from({ length: total }, (_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return new Set(idxs.slice(0, size));
  };

  const generatePattern = () => generatePatternOfSize(level);

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

  const startRound = (isFirstRound = false) => {
    clearTimers();
    setWrongCell(null);
    setFlashCorrect(null);
    setHearts(3); // hearts refresh every round

    if (mode === "pattern") {
      const p = generatePattern();
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
    startRound(true);
  };

  const advanceRound = () => {
    addTimer(() => setPhase("resetting"), SUCCESS_HOLD);
    addTimer(() => startRound(), SUCCESS_HOLD + RESET_ANIM);
  };

  const registerWrong = (i) => {
    setWrongCell(i);
    setStrikes((s) => s + 1);
    setHearts((h) => {
      const nh = h - 1;
      if (nh <= 0) {
        addTimer(() => setPhase("gameover"), 380);
      } else {
        addTimer(() => setWrongCell(null), 380);
      }
      return nh;
    });
  };

  const handleCellClick = (i) => {
    if (phase !== "recall") return;

    if (isPatternLike) {
      if (found.has(i)) return;
      if (pattern.has(i)) {
        const nf = new Set(found);
        nf.add(i);
        setFound(nf);
        if (nf.size === pattern.size) {
          setPhase("success");
          setStreak((s) => s + 1);
          advanceRound();
        }
      } else {
        registerWrong(i);
      }
    } else {
      const expected = sequence[inputIndex];
      if (i === expected) {
        setFlashCorrect(i);
        addTimer(() => setFlashCorrect(null), 220);
        const next = inputIndex + 1;
        setInputIndex(next);
        if (next === sequence.length) {
          setPhase("success");
          setStreak((s) => s + 1);
          advanceRound();
        }
      } else {
        registerWrong(i);
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
    setWrongCell(null);
    setFlashCorrect(null);
    setQueueList([]);
    setRevealPatterns([]);
  };

  const applySettingsAndRestart = () => {
    setShowSettings(false);
    resetToIdle();
  };

  const cellGap = 8;
  const boardMax = 380;

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
    if (wrongCell === i) {
      faceUp = true;
      tone = "wrong";
      content = <X size={18} color="#fff" strokeWidth={3} />;
    }
    if (phase === "resetting") {
      faceUp = false;
    }

    return { faceUp, tone, content, badge };
  };

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
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.gold }}>
              <Flame size={18} fill={C.gold} strokeWidth={0} />
              <span key={streak} className="streak-pop" style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
                {streak}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.mutedInk }}>
              <X size={16} strokeWidth={3} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{strikes}</span>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
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

        <div
          className={phase === "success" ? "board-pulse" : ""}
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
                const clickable = phase === "recall";
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
                    shake={wrongCell === i}
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
            <ModeCarousel mode={mode} onChange={setMode} options={MODE_OPTIONS} />
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
          onClick={() => setShowSettings(false)}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.ink, fontWeight: 700, fontSize: 16 }}>
                <Settings size={18} />
                Settings
              </div>
              <button
                onClick={() => setShowSettings(false)}
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

            <ModeCarousel mode={mode} onChange={setMode} options={MODE_OPTIONS} />

            {mode === "sequence" && (
              <ToggleRow icon={<Repeat size={16} />} checked={allowRepeat} onChange={updateAllowRepeat} />
            )}

            <Stepper
              icon={<Grid3x3 size={16} />}
              value={boardSize}
              onChange={updateBoardSize}
              min={3}
              max={8}
              format={(v) => `${v}×${v}`}
            />

            {!isProgressive && (
              <Stepper
                icon={mode === "sequence" ? <ListOrdered size={16} /> : <Eye size={16} />}
                value={level}
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
    </div>
  );
}
