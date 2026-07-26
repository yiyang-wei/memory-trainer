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

function Stepper({ icon, value, onChange, min, max, step = 1, format }) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => onChange(Math.min(max, +(value + step).toFixed(2)));
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

function ModeSwitch({ mode, onChange }) {
  const opt = (key, icon, label) => (
    <button
      onClick={() => onChange(key)}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 0",
        borderRadius: 12,
        border: "none",
        background: mode === key ? C.accent : "transparent",
        color: mode === key ? "#fff" : C.mutedInk,
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        transition: "background 150ms ease, color 150ms ease",
      }}
    >
      {icon}
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: 4, background: C.bg, borderRadius: 16, padding: 4 }}>
      {opt("pattern", <Grid3x3 size={15} />, "Pattern")}
      {opt("sequence", <ListOrdered size={15} />, "Sequence")}
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

function SegmentBar({ count, filled, color }) {
  const segs = Array.from({ length: count }, (_, i) => i);
  return (
    <div style={{ display: "flex", gap: 4, height: 8 }}>
      {segs.map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: 6,
            background: i < filled ? color : C.accentSoft,
            transition: "background 150ms ease",
          }}
        />
      ))}
    </div>
  );
}

export default function MemoryGridTrainer() {
  const [mode, setMode] = useState("pattern"); // 'pattern' | 'sequence'
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [boardSize, setBoardSize] = useState(4);
  const [level, setLevel] = useState(4);
  const [displayTime, setDisplayTime] = useState(2);
  const [showSettings, setShowSettings] = useState(false);

  const [phase, setPhase] = useState("idle"); // idle, memorize, recall, success, gameover
  const [pattern, setPattern] = useState(new Set());
  const [found, setFound] = useState(new Set());
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [activeStepPos, setActiveStepPos] = useState(-1);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [wrongCell, setWrongCell] = useState(null);
  const [flashCorrect, setFlashCorrect] = useState(null);

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

  const total = boardSize * boardSize;
  const maxLevel = mode === "sequence" && allowRepeat ? 15 : Math.min(total - 1, 12);

  useEffect(() => {
    setLevel((l) => Math.min(Math.max(l, 2), maxLevel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardSize, mode, allowRepeat]);

  const generatePattern = () => {
    const idxs = Array.from({ length: total }, (_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return new Set(idxs.slice(0, level));
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

  const startRound = () => {
    clearTimers();
    setWrongCell(null);
    setFlashCorrect(null);

    if (mode === "pattern") {
      const p = generatePattern();
      setPattern(p);
      setFound(new Set());
      setPhase("memorize");
      setBarKey((k) => k + 1);
      addTimer(() => setPhase("recall"), displayTime * 1000);
    } else {
      const seq = generateSequence();
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
    setHearts(3);
    setStrikes(0);
    setStreak(0);
    startRound();
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

    if (mode === "pattern") {
      if (found.has(i)) return;
      if (pattern.has(i)) {
        const nf = new Set(found);
        nf.add(i);
        setFound(nf);
        if (nf.size === pattern.size) {
          setPhase("success");
          setStreak((s) => s + 1);
          addTimer(() => startRound(), 550);
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
          addTimer(() => startRound(), 550);
        }
      } else {
        registerWrong(i);
      }
    }
  };

  const applySettingsAndRestart = () => {
    setShowSettings(false);
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
  };

  const cellGap = 8;
  const boardMax = 380;

  const getCellStyle = (i) => {
    let bg = C.cellIdle;
    let border = C.cellBorder;
    let content = null;
    let badge = null;

    if (phase === "memorize" && mode === "pattern" && pattern.has(i)) {
      bg = C.accent;
      border = C.accent;
    }
    if (phase === "memorize" && mode === "sequence" && activeStepPos >= 0 && sequence[activeStepPos] === i) {
      bg = C.accent;
      border = C.accent;
    }
    if (phase === "recall" || phase === "success") {
      if (mode === "pattern" && found.has(i)) {
        bg = C.success;
        border = C.success;
        content = <Check size={18} color="#fff" strokeWidth={3} />;
      }
      if (mode === "sequence" && flashCorrect === i) {
        bg = C.success;
        border = C.success;
        content = <Check size={18} color="#fff" strokeWidth={3} />;
      }
    }
    if (phase === "gameover") {
      if (mode === "pattern" && pattern.has(i)) {
        const isFound = found.has(i);
        bg = isFound ? C.success : C.accent;
        border = bg;
        content = isFound ? <Check size={16} color="#fff" strokeWidth={3} /> : null;
      }
      if (mode === "sequence") {
        const positions = sequence.reduce((acc, c, p) => (c === i ? [...acc, p] : acc), []);
        if (positions.length > 0) {
          const pending = positions.some((p) => p >= inputIndex);
          bg = pending ? C.accent : C.success;
          border = bg;
          badge = positions.map((p) => p + 1).join(",");
        }
      }
    }
    if (wrongCell === i) {
      bg = C.wrong;
      border = C.wrong;
      content = <X size={18} color="#fff" strokeWidth={3} />;
    }

    return { bg, border, content, badge };
  };

  let barNode = null;
  if (phase === "memorize" && mode === "pattern") {
    barNode = <DrainBar duration={displayTime} active barKey={barKey} />;
  } else if (phase === "recall" && mode === "pattern") {
    barNode = <SegmentBar count={Math.max(pattern.size, 1)} filled={found.size} color={C.success} />;
  } else if (phase === "memorize" && mode === "sequence") {
    barNode = <SegmentBar count={Math.max(sequence.length, 1)} filled={revealedSteps} color={C.accent} />;
  } else if ((phase === "recall" || phase === "success") && mode === "sequence") {
    barNode = <SegmentBar count={Math.max(sequence.length, 1)} filled={inputIndex} color={C.success} />;
  } else if (phase === "success" && mode === "pattern") {
    barNode = <SegmentBar count={Math.max(pattern.size, 1)} filled={pattern.size} color={C.success} />;
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
          <div style={{ display: "flex", gap: 5 }}>
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
              <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{streak}</span>
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
                const { bg, border, content, badge } = getCellStyle(i);
                const clickable = phase === "recall";
                const isWrong = wrongCell === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleCellClick(i)}
                    disabled={!clickable}
                    style={{
                      position: "relative",
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 12,
                      cursor: clickable ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 120ms ease, transform 120ms ease",
                      transform: isWrong ? "scale(0.94)" : "scale(1)",
                      padding: 0,
                    }}
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
                  </button>
                );
              })}
            </div>

            {phase === "idle" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.72)",
                  borderRadius: 12,
                }}
              >
                <button
                  onClick={startGame}
                  aria-label="Start"
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
            {phase === "gameover" && "Here's the answer"}
          </div>
        </div>

        {phase === "gameover" && (
          <div
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
            </div>
            <button
              onClick={startGame}
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
              aria-label="Restart"
            >
              <RotateCcw size={22} />
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div
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

            <ModeSwitch mode={mode} onChange={setMode} />

            {mode === "sequence" && (
              <ToggleRow icon={<Repeat size={16} />} checked={allowRepeat} onChange={setAllowRepeat} />
            )}

            <Stepper
              icon={<Grid3x3 size={16} />}
              value={boardSize}
              onChange={setBoardSize}
              min={3}
              max={8}
              format={(v) => `${v}\u00d7${v}`}
            />
            <Stepper
              icon={mode === "pattern" ? <Eye size={16} /> : <ListOrdered size={16} />}
              value={level}
              onChange={setLevel}
              min={2}
              max={maxLevel}
            />
            <Stepper
              icon={<Timer size={16} />}
              value={displayTime}
              onChange={setDisplayTime}
              min={1}
              max={5}
              step={0.5}
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
