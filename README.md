# Memory Trainer

A mobile-first memory training game. React + Vite, deployed as static assets on
Cloudflare Workers.

## Modes

| Mode | Board | Task |
| --- | --- | --- |
| **Pattern** | 6×6 | Memorize the highlighted cells, then tap them all. Adaptive difficulty on by default. |
| **Sequence** | 3×3 | Memorize the order the cells light up, then repeat it back. |
| **Progressive** | 3×3 | Same as Sequence, but the sequence grows by one every round. |
| **Queue** | 3×3 | Several patterns are in flight; reproduce the oldest while a new one joins the back. |

Every round grants 3 hearts. Losing them all ends the run — except in adaptive Pattern
practice, which never hard-stops and instead retunes the difficulty (use the stop button
in the header to end that run and bank the result).

## Challenge vs Practice

Every mode can be played two ways, and this split is the reason records mean anything.

**Challenge** is ranked. Every setting is locked — including display time, which is the
single strongest difficulty lever — and the run climbs exactly one rung per cleared round,
ending on the first failed round. The score is rungs cleared, so it is directly comparable
between players and across sessions.

Each mode climbs the axes that define what it actually tests:

| Mode | Rung 1 | Climbs | Top rung |
| --- | --- | --- | --- |
| **Pattern** | 2 cells on 3×3 | cells to recall, board widening underneath | 31 (32 cells on 8×8) |
| **Sequence** | 2 steps on 3×3 | length, board widening at 6 / 9 / 12 / 15 / 18 steps | 21 (22 steps on 8×8) |
| **Progressive** | 2 steps on 3×3 | same, but one sequence grown in place | 21 (22 steps on 8×8) |
| **Queue** | 2 patterns of 3 cells on 3×3 | depth, pattern size and board, rotating | 17 (8 patterns of 8 cells on 8×8) |

Every ladder widens the board alongside the axis it is really measuring, because a single
axis stops biting on its own — a 30-step sequence on a 3×3 board is tedious rather than
hard. Queue is the one mode with three axes worth climbing, so its ladder is written out
explicitly in `src/ladder.js`: each rung bumps exactly one of depth / pattern size / board,
rotating so no axis runs ahead.

Growing the board mid-run has to keep already-memorized cells where the player left them,
so `remapIndex` preserves a cell's row and column and the grid simply widens around it.
The two modes need different handling:

- **Progressive** replays its whole sequence every round, so the player re-learns the
  carried steps at the new size immediately. Remapping alone is enough.
- **Queue** never re-shows a queued pattern, so remapping alone would be unfair — the
  player memorized those at a different size. On a resize the entire queue flashes again
  on the new board instead of just the new arrivals.

**Practice** is everything in Settings: any board, level, display time you like. Bests are
kept per exact configuration (so 6×6/10-cells and 7×7/10-cells are separate entries) and
never touch the ranked record.

A single best per mode was the earlier design and it was wrong: a streak at 3×3 with 2
cells and one at 8×8 with 32 wrote to the same slot, which made the number meaningless.
That is why storage moved to `v2` rather than migrating.

### The difficulty ladder

Both adaptive practice and the Pattern Challenge walk one shared ladder (`src/ladder.js`).
Each board size has a level cap (`floor(cells^(2/3))`, or half the board at 8×8) and a
floor one above the previous board's cap. Together those make every `(board, level)` pair a
single rung on one monotonic sequence, so overflowing the cap grows the board and dropping
below the floor shrinks it back to exactly the rung below.

Adaptive practice moves two clears up / two fails down along that ladder. A Challenge
walks the same rungs one per cleared round and never descends.

## Screens

`MemoryGridTrainer` routes on a `screen` state rather than stacking overlays:

```
menu ─┬─ Challenge ─┐
      ├─ Training ──┴─ modes (mode list + record per mode) ─ game
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

Settings and records live in `localStorage` under `memory-trainer.settings.v1` and
`memory-trainer.stats.v2`. Saved payloads are merged over the current defaults on load, so
adding a setting doesn't break existing users. All storage access degrades gracefully when
`localStorage` is unavailable (Safari private mode, blocked site data) — the game stays
playable, it just won't remember anything.

Practice records are keyed by `practiceKey()`, a sorted serialization of the mode's own
settings object. A setting added later automatically becomes part of that identity, so two
genuinely different difficulties can never collapse into one record.
