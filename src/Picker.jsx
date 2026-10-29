import React from "react";
import "@fontsource-variable/bricolage-grotesque";

export const VERSIONS = [
  {
    path: "/a",
    letter: "A",
    name: "Glossy",
    blurb: "Soft glass cards, shiny 3D blocks, confetti.",
    colors: ["#8CA0DB", "#7FBF9E", "#E0AA3E", "#E0778C"],
    load: () => import("./versions/glossy/App.jsx"),
  },
  {
    path: "/b",
    letter: "B",
    name: "Chunky",
    blurb: "Big pressable buttons and bouncy tiles.",
    colors: ["#6F86D6", "#5DB38A", "#E3A52F", "#E2667F"],
    load: () => import("./versions/chunky/App.jsx"),
  },
  {
    path: "/c",
    letter: "C",
    name: "Sticker",
    blurb: "Flat sticker shapes, doodles and wiggles.",
    colors: ["#8CA0DB", "#7FBF9E", "#E0AA3E", "#E0778C"],
    load: () => import("./versions/sticker/App.jsx"),
  },
];

export default function Picker() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#EEF0F6",
        fontFamily: "'Bricolage Grotesque Variable', system-ui, sans-serif",
        color: "#3B3F51",
        display: "flex",
        justifyContent: "center",
        padding: "32px 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 750, letterSpacing: -0.6 }}>Pick a version</h1>
        <p style={{ margin: "0 0 10px", fontSize: 15, color: "#5F6478" }}>
          Same game and records in each. Try them all.
        </p>
        {VERSIONS.map((v) => (
          <a
            key={v.path}
            href={v.path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 18,
              borderRadius: 26,
              background: "#FFFFFF",
              color: "inherit",
              textDecoration: "none",
              boxShadow: "0 2px 14px rgba(59,63,81,0.07)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 64,
                height: 64,
                flexShrink: 0,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 4,
              }}
            >
              {v.colors.map((c) => (
                <span key={c} style={{ borderRadius: 9, background: c }} />
              ))}
            </span>
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 22, fontWeight: 750, letterSpacing: -0.4 }}>
                {v.letter} · {v.name}
              </span>
              <span style={{ fontSize: 14, color: "#5F6478", lineHeight: 1.35 }}>{v.blurb}</span>
            </span>
          </a>
        ))}
        <a
          href="/classic"
          style={{ alignSelf: "center", marginTop: 8, padding: 12, color: "#5F6478", fontSize: 15, fontWeight: 600 }}
        >
          Today's version
        </a>
      </div>
    </div>
  );
}
