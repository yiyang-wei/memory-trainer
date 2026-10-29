// Per-exercise colours for the Chunky version: one solid fill plus the darker "edge" that
// gives every keycap its depth, and a soft tint for tile and card backgrounds. All of it
// is built from the original palette, pushed a notch bolder.

export const THEME = {
  pattern: { main: "#6F86D6", edge: "#4F64B8", tint: "#DFE5F8", tintEdge: "#C4CFF1", ink: "#3F52A0" },
  sequence: { main: "#5DB38A", edge: "#3F9068", tint: "#DCF1E6", tintEdge: "#BBE2CD", ink: "#2A6E4F" },
  progressive: { main: "#E3A52F", edge: "#B9821A", tint: "#FBEFD5", tintEdge: "#F2D9A2", ink: "#8A5A0E" },
  queue: { main: "#E2667F", edge: "#BC4A62", tint: "#FBE1E7", tintEdge: "#F4BFCB", ink: "#A8435B" },
  free: { main: "#9A87DB", edge: "#7562BE", tint: "#ECE7FA", tintEdge: "#D6CCF3", ink: "#5B49A8" },
};

// CSS custom properties the board, caps and tiles read.
export const modeVars = (key) => {
  const t = THEME[key] || THEME.pattern;
  return {
    "--m": t.main,
    "--me": t.edge,
    "--mt": t.tint,
    "--mte": t.tintEdge,
    "--mi": t.ink,
  };
};
