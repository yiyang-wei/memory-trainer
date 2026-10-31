import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import DEV_APPS from "./devApps.js";

// "/" is the Buddy version, the one that ships, and "/classic" keeps the original screen.
// Under `npm run dev` the other redesign candidates and the Buddy Lab have paths too.
const Buddy = lazy(() => import("./versions/buddy/App.jsx"));
const APPS = {
  "/classic": lazy(() => import("./MemoryGridTrainer.jsx")),
  ...DEV_APPS,
};

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const App = APPS[path] || Buddy;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Same background as every version, so the first chunk load doesn't flash white. */}
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#EEF0F6" }} />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
