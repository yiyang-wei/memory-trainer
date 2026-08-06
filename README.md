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
mode, which never hard-stops and instead retunes the difficulty (use the stop button in
the header to end that session and bank the result).

### Adaptive difficulty

Two clears in a row raise the level; two fails in a row lower it. Each board size has a
level cap (`floor(cells^(2/3))`, or half the board at 8×8) and a floor one above the
previous board's cap. Together those make every `(board, level)` pair a single rung on one
monotonic ladder, so overflowing the cap grows the board and dropping below the floor
shrinks it back to exactly the rung below.

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

Settings and personal bests live in `localStorage` under `memory-trainer.settings.v1` and
`memory-trainer.stats.v1`. Saved payloads are merged over the current defaults on load, so
adding a setting doesn't break existing users. All storage access degrades gracefully when
`localStorage` is unavailable (Safari private mode, blocked site data) — the game stays
playable, it just won't remember anything.
