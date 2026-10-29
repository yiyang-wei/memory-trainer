// Per-exercise colours for the Glossy version, built from the original palette. Each mode
// gets a gradient pair for its tile and a hi/main/lo/edge set for glossy blocks.

export const THEME = {
  pattern: {
    g1: "#F0F3FD",
    g2: "#D6DFF7",
    hi: "#B9C7F0",
    main: "#8CA0DB",
    lo: "#6F86D0",
    edge: "#5E74C4",
    soft: "#DCE4F7",
    ink: "#44589F",
  },
  sequence: {
    g1: "#EFF8F3",
    g2: "#D3ECDF",
    hi: "#AEDCC4",
    main: "#7FBF9E",
    lo: "#62A783",
    edge: "#4E8F6F",
    soft: "#E1F2E9",
    ink: "#2A6E4F",
  },
  progressive: {
    g1: "#FDF8EC",
    g2: "#F8E6BF",
    hi: "#F3CF83",
    main: "#E0AA3E",
    lo: "#CD9425",
    edge: "#B07B17",
    soft: "#FBF1DC",
    ink: "#8A5A0E",
  },
  queue: {
    g1: "#FDF1F4",
    g2: "#F8D8E0",
    hi: "#F0A9B8",
    main: "#E0778C",
    lo: "#CC5F75",
    edge: "#B44C61",
    soft: "#FBE5EA",
    ink: "#A8435B",
  },
  free: {
    g1: "#F5F2FD",
    g2: "#E2DBF7",
    hi: "#CBBFF1",
    main: "#A898E0",
    lo: "#8C7AD2",
    edge: "#7562BE",
    soft: "#ECE8FA",
    ink: "#5B49A8",
  },
};

// CSS custom properties the board and blocks read.
export const modeVars = (key) => {
  const t = THEME[key] || THEME.pattern;
  return {
    "--g1": t.g1,
    "--g2": t.g2,
    "--m-hi": t.hi,
    "--m": t.main,
    "--m-lo": t.lo,
    "--m-edge": t.edge,
    "--m-soft": t.soft,
    "--m-ink": t.ink,
    "--mi": t.ink,
    "--md": t.edge,
  };
};

export const blockVars = (key, lit = true) => {
  const t = THEME[key] || THEME.pattern;
  return lit
    ? { "--hi": t.hi, "--c": t.main, "--lo": t.lo, "--edge": t.edge }
    : { "--hi": "#FFFFFF", "--c": "#F2F4F9", "--lo": "#E4E8F1", "--edge": "#D3D8E6" };
};
