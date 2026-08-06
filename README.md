# Memory Trainer

A mobile-first memory training game. React + Vite, deployed as static assets on
Cloudflare Workers.

## Modes

| Mode | Board | Task |
| --- | --- | --- |
| **Pattern** | 6×6 | Memorize the highlighted cells, then tap them all. Adaptive difficulty on by default. |
| **Sequence** | 3×3 | Memorize the order the cells light up, then repeat it back. |
| **Progressive** | 3×3 | Same as Sequence, but one sequence grows by a step every round. |
| **Queue** | 3×3 | Several patterns are in flight; reproduce the oldest while a new one joins the back. |

Every round grants 3 hearts. Losing them all ends the run — except in adaptive Pattern
practice, which never hard-stops and instead retunes the difficulty (use the stop button
in the header to end that run and bank the result).

## Challenge vs Training

Every mode can be played two ways, and this split is the reason records mean anything.

**Challenge** is ranked. Each mode offers several named presets, defined in
`src/challenges.js`, and each preset keeps its own record. Two shapes:

- **fixed** — difficulty never moves; the score is rounds cleared in a row. Measures
  consistency at a known difficulty.
- **endless** — one parameter ramps by one every cleared round; the score is the value it
  reached. Measures your ceiling.

| Mode | Presets | Endless variant |
| --- | --- | --- |
| **Pattern** | 6×6/10, 7×7/13, 8×8/14 cells | 8×8, 14 → 31 cells |
| **Sequence** | 3×3, 4×4, 5×5 at 12 steps | 5×5, 3 → 30 steps |
| **Progressive** | 3×3, 4×4, 5×5 | all three (it grows one sequence in place) |
| **Queue** | 3×3/3-of-3, 4×4/4-of-4, 5×5/5-of-5 | 5×5, 3 → 10 deep |

Every preset holds its **board size constant**, so nothing already memorized is ever moved
out from under the player mid-run.

### Display time

The one Challenge setting the player controls. It starts at 2s and can only be turned
*down*, which is what lets a preset keep a single record honestly: a record can never be
inflated by slowing the game, only earned at that pace or faster. The speed a record was
set at is stored alongside it and shown in Records, so the extra information isn't lost.

**Training** is everything in Settings: any board, level, display time you like. Bests are
kept per exact configuration (so 6×6/10-cells and 7×7/10-cells are separate entries) and
never touch the ranked records.

### The adaptive practice ladder

`src/ladder.js` now serves only adaptive Pattern practice. Each board size has a level cap
(`floor(cells^(2/3))`, or half the board at 8×8) and a floor one above the previous board's
cap, making every `(board, level)` pair a single rung on one monotonic sequence. Two clears
move up, two fails move down, and because the descent retraces the ascent exactly a fail
can never land the player somewhere harder.

Adaptive practice is the only thing that changes board size mid-run, and Pattern redraws
its pattern every round, so nothing needs carrying across a resize.

## Screens

`MemoryGridTrainer` routes on a `screen` state rather than stacking overlays:

```
menu ─┬─ Challenge ── challenges (one row per mode, presets easiest-first) ─ game
      ├─ Training ─── modes (mode list + best per mode) ───────────────────── game
      ├─ records
      └─ tutorial            (also reachable from the game's help button,
                              which returns to the game rather than the menu)
```

Leaving the game for any other screen tears the run down through `resetToIdle`, which
banks whatever it was worth rather than silently dropping it.

## Development

```sh
npm install
npm run dev        # dev server on :5173, --host so phones on the LAN can reach it
npm run lint       # see below — this is not optional
npm run build      # lint, then production build into dist/
npm run preview    # serve dist/ locally — needed to exercise the service worker
```

`npm run build` runs ESLint first, and that ordering is deliberate. Vite resolves JSX
identifiers at runtime, not build time, so a component that is referenced but never
defined builds perfectly and then throws a `ReferenceError` the moment that screen
renders. A green build is not evidence the app runs; `no-undef` is what catches it.

(`eslint-plugin-react` has no ESLint 10 build yet, so `no-unused-vars` is relaxed for
capitalised names — JSX references read as unused without that plugin.)

The service worker is only active in production builds, so `npm run dev` never serves
stale cached assets.

## Deploying

```sh
npm run deploy     # build, then wrangler deploy
```

`wrangler.jsonc` serves `dist/` with SPA fallback. The service worker uses Workbox's
`autoUpdate` (skipWaiting + clientsClaim), so a deploy reaches installed users on their
next launch rather than stranding them on a cached build.

## Icons

`public/icon.svg` is the design source. The PNGs the manifest and iOS need are generated
from it:

```sh
npm run icons      # requires python3 + Pillow
```

This writes `apple-touch-icon.png` (opaque — iOS composites transparency onto black),
`icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` (full-bleed, mark shrunk into
the central safe zone). Commit the regenerated PNGs alongside any change to the SVG.

## Persistence

Settings and records live in `localStorage` under `memory-trainer.settings.v2` and
`memory-trainer.stats.v3`. Saved payloads are merged over the current defaults on load, so
adding a setting doesn't break existing users. All storage access degrades gracefully when
`localStorage` is unavailable (Safari private mode, blocked site data) — the game stays
playable, it just won't remember anything.

Challenge records are keyed by preset id. Training records are keyed by `practiceKey()`, a sorted serialization of the mode's own
settings object. A setting added later automatically becomes part of that identity, so two
genuinely different difficulties can never collapse into one record.
