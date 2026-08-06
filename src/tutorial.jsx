import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

// Tutorial demos. Each mode is a loop of frames: which cells are lit on the demo board,
// an optional queue strip, a caption, and how long to hold.
//
// Queue gets the strip because the mode's whole difficulty is *where a pattern sits in
// line*, and a board on its own cannot show that — the earlier version flashed patterns
// and asked the player to infer a data structure. The strip makes the order literal: you
// watch a pattern join the back, the front one leave as you reproduce it, and the rest
// shift forward.

const DEMO_BOARD = 3;

export const MODE_RULES = {
  pattern: [
    "Some cells light up together. Memorize them.",
    "Tap every one of them once the board clears.",
    "Three wrong taps in a round ends the run.",
  ],
  sequence: [
    "Cells light up one at a time. The order matters.",
    "Tap them back in the same order.",
    "A fresh sequence is drawn every round.",
  ],
  progressive: [
    "One sequence, replayed from the start every round.",
    "Each round appends one new step to the end.",
    "Same sequence throughout — it only ever gets longer.",
  ],
  queue: [
    "Patterns line up in a queue as they flash.",
    "You always reproduce the one at the FRONT — the oldest.",
    "It leaves, a new one joins the back, everything shifts forward.",
  ],
};

// cells are indices into a 3x3 demo board
const P1 = [0, 4];
const P2 = [2, 7];
const P3 = [3, 5];
const P4 = [1, 8];

const q = (cells, state) => ({ cells, state });

export const TUTORIAL_SCRIPTS = {
  pattern: [
    { highlight: [0, 4, 8], caption: "Three cells light up together", duration: 1500 },
    { caption: "Now tap them from memory", duration: 600 },
    { success: [0], caption: "Now tap them from memory", duration: 500 },
    { success: [0, 4], caption: "Now tap them from memory", duration: 500 },
    { success: [0, 4, 8], caption: "All three — round cleared", duration: 1300 },
    { caption: "", duration: 500 },
  ],
  sequence: [
    { highlight: [1], caption: "Watch the order: first…", duration: 700 },
    { caption: "", duration: 260 },
    { highlight: [5], caption: "…second…", duration: 700 },
    { caption: "", duration: 260 },
    { highlight: [6], caption: "…third", duration: 700 },
    { caption: "Now tap them back in that order", duration: 600 },
    { success: [1], caption: "1st", duration: 480 },
    { success: [1, 5], caption: "2nd", duration: 480 },
    { success: [1, 5, 6], caption: "3rd — order matters", duration: 1200 },
    { caption: "", duration: 500 },
  ],
  progressive: [
    { highlight: [4], caption: "It starts short: two steps", duration: 650 },
    { caption: "", duration: 240 },
    { highlight: [8], caption: "It starts short: two steps", duration: 650 },
    { caption: "Tap them back", duration: 500 },
    { success: [4], caption: "Tap them back", duration: 420 },
    { success: [4, 8], caption: "Cleared — so it grows", duration: 900 },
    { highlight: [4], caption: "Same sequence, from the top…", duration: 620 },
    { caption: "", duration: 240 },
    { highlight: [8], caption: "…same second step…", duration: 620 },
    { caption: "", duration: 240 },
    { highlight: [2], caption: "…and one new step on the end", duration: 700 },
    { caption: "Now all three", duration: 480 },
    { success: [4], caption: "Now all three", duration: 400 },
    { success: [4, 8], caption: "Now all three", duration: 400 },
    { success: [4, 8, 2], caption: "One longer every round", duration: 1300 },
    { caption: "", duration: 500 },
  ],
  queue: [
    {
      caption: "Patterns flash one by one and line up in a queue",
      queue: [],
      duration: 900,
    },
    {
      highlight: P1,
      caption: "This one flashes first, so it goes to the front",
      queue: [q(P1, "entering")],
      duration: 1250,
    },
    {
      highlight: P2,
      caption: "The next one lines up behind it",
      queue: [q(P1, "front"), q(P2, "entering")],
      duration: 1250,
    },
    {
      highlight: P3,
      caption: "And the next behind that",
      queue: [q(P1, "front"), q(P2, "waiting"), q(P3, "entering")],
      duration: 1250,
    },
    {
      caption: "Your turn — reproduce the one at the FRONT",
      queue: [q(P1, "front"), q(P2, "waiting"), q(P3, "waiting")],
      duration: 1400,
    },
    {
      success: [P1[0]],
      caption: "That's the oldest one, not the newest",
      queue: [q(P1, "front"), q(P2, "waiting"), q(P3, "waiting")],
      duration: 600,
    },
    {
      success: P1,
      caption: "Correct — it leaves the queue",
      queue: [q(P1, "leaving"), q(P2, "waiting"), q(P3, "waiting")],
      duration: 1300,
    },
    {
      caption: "Everything shifts forward…",
      queue: [q(P2, "front"), q(P3, "waiting")],
      duration: 1100,
    },
    {
      highlight: P4,
      caption: "…and a new pattern joins the back",
      queue: [q(P2, "front"), q(P3, "waiting"), q(P4, "entering")],
      duration: 1250,
    },
    {
      caption: "So now the front is the one that flashed second",
      queue: [q(P2, "front"), q(P3, "waiting"), q(P4, "waiting")],
      duration: 1400,
    },
    {
      success: P2,
      caption: "Always the front. Always the oldest.",
      queue: [q(P2, "leaving"), q(P3, "waiting"), q(P4, "waiting")],
      duration: 1500,
    },
    { caption: "", queue: [], duration: 600 },
  ],
};

// A queue slot: a miniature of the board with that pattern's cells filled in, so the
// player can see at a glance which pattern is where in line.
function QueueThumb({ cells, state, C, label }) {
  const filled = new Set(cells);
  const tone = {
    front: { border: C.accent, bg: C.accentSoft, dot: C.accent },
    entering: { border: C.gold, bg: "#FBF1DC", dot: C.gold },
    leaving: { border: C.success, bg: C.successSoft, dot: C.success },
    waiting: { border: C.cellBorder, bg: C.surface, dot: C.mutedInk },
  }[state];

  return (
    <div
      className={state === "entering" ? "queue-thumb-enter" : state === "leaving" ? "queue-thumb-leave" : ""}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${DEMO_BOARD}, 1fr)`,
          gap: 2,
          padding: 4,
          borderRadius: 8,
          background: tone.bg,
          border: `1.5px solid ${tone.border}`,
        }}
      >
        {Array.from({ length: DEMO_BOARD * DEMO_BOARD }, (_, i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 2,
              background: filled.has(i) ? tone.dot : "rgba(0,0,0,0.07)",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: tone.border, letterSpacing: 0.2 }}>{label}</span>
    </div>
  );
}

function QueueStrip({ frame, C }) {
  const slots = frame.queue || [];
  return (
    <div style={{ minHeight: 64, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      {slots.length === 0 ? (
        <span style={{ fontSize: 11, color: C.mutedInk }}>queue is empty</span>
      ) : (
        slots.map((slot, i) => (
          <React.Fragment key={`${i}-${slot.cells.join()}`}>
            <QueueThumb
              cells={slot.cells}
              state={slot.state}
              C={C}
              label={i === 0 ? "front" : i === slots.length - 1 ? "back" : ""}
            />
            {i < slots.length - 1 && (
              <span style={{ color: C.cellBorder, fontSize: 13, marginBottom: 12 }}>‹</span>
            )}
          </React.Fragment>
        ))
      )}
    </div>
  );
}

export function TutorialPlayer({ mode, script, C, Card }) {
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
  const total = DEMO_BOARD * DEMO_BOARD;
  const highlightSet = new Set(frame.highlight || []);
  const successSet = new Set(frame.success || []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ width: 150, aspectRatio: "1 / 1" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${DEMO_BOARD}, 1fr)`,
            gridTemplateRows: `repeat(${DEMO_BOARD}, 1fr)`,
            gap: 6,
            width: "100%",
            height: "100%",
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const isSuccess = successSet.has(i);
            const isHighlight = highlightSet.has(i);
            return (
              <Card
                key={i}
                faceUp={isSuccess || isHighlight}
                tone={isSuccess ? "success" : isHighlight ? "highlight" : "idle"}
                content={isSuccess ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                badge={null}
                clickable={false}
                label="demo cell"
                onClick={() => {}}
                transitionDelay="0ms"
                shake={false}
              />
            );
          })}
        </div>
      </div>

      {mode === "queue" && <QueueStrip frame={frame} C={C} />}

      <div
        style={{
          minHeight: 36,
          textAlign: "center",
          color: C.ink,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.4,
          padding: "0 8px",
        }}
      >
        {frame.caption}
      </div>
    </div>
  );
}
