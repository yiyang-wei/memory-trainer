// Per-exercise colours for the Sticker version: flat fills from the original palette.
//   main — sticker fill / lit cells      tint — tile and page wash
//   ink  — small text on the tint        deep — fill behind white button text

export const THEME = {
  pattern: { main: "#8CA0DB", tint: "#DCE4F7", ink: "#44589F", deep: "#5E74C4", light: "#C3CEEE" },
  sequence: { main: "#7FBF9E", tint: "#E1F2E9", ink: "#2A6E4F", deep: "#3B8A64", light: "#B9DFCB" },
  progressive: { main: "#E0AA3E", tint: "#FBF1DC", ink: "#8A5A0E", deep: "#B07B17", light: "#F2D69A" },
  queue: { main: "#E0778C", tint: "#FBE5EA", ink: "#A8435B", deep: "#C2506A", light: "#F1B7C3" },
  free: { main: "#A898E0", tint: "#ECE8FA", ink: "#5B49A8", deep: "#7562BE", light: "#D3CAF2" },
};

export const PALETTE = ["#8CA0DB", "#7FBF9E", "#E0AA3E", "#E0778C", "#A898E0"];

// CSS custom properties read by cells, chips and buttons inside a mode's screens.
export const modeVars = (key) => {
  const t = THEME[key] || THEME.pattern;
  return {
    "--m": t.main,
    "--m-tint": t.tint,
    "--m-ink": t.ink,
    "--m-deep": t.deep,
    "--m-light": t.light,
  };
};
