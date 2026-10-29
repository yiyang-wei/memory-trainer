import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Picker, { VERSIONS } from "./Picker.jsx";

// Three redesign candidates live side by side, one path each, so they can be compared
// on a phone without rebuilding. "/" is the picker; "/classic" is the original screen.
const Classic = lazy(() => import("./MemoryGridTrainer.jsx"));
const APPS = {
  "/classic": Classic,
  ...Object.fromEntries(VERSIONS.map((v) => [v.path, lazy(v.load)])),
};

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const App = APPS[path] || Picker;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Same background as every version, so the first chunk load doesn't flash white. */}
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#EEF0F6" }} />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
