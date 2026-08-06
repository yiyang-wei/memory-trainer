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

Each mode climbs the one axis that defines what it actually tests:

| Mode | Rung 1 | Climbs | Top rung |
| --- | --- | --- | --- |
| **Pattern** | 2 cells on 3×3 | cells to recall, board grows underneath | 31 (32 cells on 8×8) |
| **Sequence** | 2 steps on 3×3 | sequence length, fresh sequence each round | 29 (30 steps) |
| **Progressive** | 2 steps on 3×3 | sequence length, same sequence grown | 29 (30 steps) |
| **Queue** | 2 patterns on 3×3 | queue depth — patterns held at once | 9 (10 patterns) |

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

## Development

```sh
npm install
npm run dev        # dev server on :5173, --host so phones on the LAN can reach it
npm run build      # production build into dist/
npm run preview    # serve dist/ locally — needed to exercise the service worker
```

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
