import js from "@eslint/js";
import globals from "globals";

// The point of this config is `no-undef`. Vite resolves JSX identifiers at runtime, not
// build time, so a component that is referenced but never defined builds perfectly and
// then throws a ReferenceError the moment that screen renders. A passing build is not
// evidence the app runs; this is.
export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}", "*.config.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // JSX identifiers read as unused to core ESLint (that check lives in
      // eslint-plugin-react, which has no ESLint 10 build yet), so this would be all
      // false positives. Unused imports are cheap to spot by eye; undefined ones are not.
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z]", args: "none" }],
    },
  },
];
