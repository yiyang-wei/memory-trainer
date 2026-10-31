import { lazy } from "react";
import { VERSIONS } from "./Picker.jsx";

// Paths only the dev server serves: the other redesign candidates, the picker that
// compares them and the Buddy Lab. A build swaps this module for an empty table (see
// devOnlyApps in vite.config.js), so none of their code or fonts reach dist.
export default {
  "/versions": lazy(() => import("./Picker.jsx")),
  "/lab": lazy(() => import("./lab/Lab.jsx")),
  ...Object.fromEntries(VERSIONS.map((v) => [v.path, lazy(v.load)])),
};
