# Blacktop H.O.R.S.E. 🏀

Slingshot HORSE on a dusk blacktop. Beat **Buckets** before he spells you out —
five letters and you walk home.

Single-player vs an NPC with proper HORSE rules: make your shot and he has to
match it; miss a match, take a letter. Real ball physics with rim and backboard
collisions, drag-to-shoot slingshot aiming, three difficulties.

## Features

- **Trick shot modifiers** — call *Bank Shot* (glass first or it doesn't count),
  *Moon Ball* (clear the high line) or *No Preview* (aim dots off) when setting.
  Both players have to obey the call. Buckets calls them too — more often on
  Hall of Fame.
- **Hot hand** — three makes in a row and the ball glows, with a touch of rim
  forgiveness. Any miss puts the fire out. Buckets heats up too.
- **Juice** — chalk dust, rim sparks, net splash, ball trail, screen shake on
  hard bricks, slow-mo on game-deciding shots, a crowd behind the fence that
  reacts, and a camera that subtly follows the ball.
- **Sound** — fully synthesized with WebAudio (no assets): bounces, swish,
  clank, crowd, ambient playground bed. Mute toggle persists.
- **Stats & sharing** — per-difficulty win/loss/streak records in localStorage,
  plus a generated share card for stories/chats.
- **PWA** — installable to the home screen, works offline after first load.

## Develop

```sh
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run icons     # regenerate the PWA icons (committed, rarely needed)
```

## Deploy

**GitHub Pages** — push to `main`, then in the repo go to
*Settings → Pages → Source: GitHub Actions*. The included workflow
(`.github/workflows/deploy.yml`) builds and deploys on every push.

**Netlify** — connect the repo; `netlify.toml` already sets the build command
and publish directory. Or drag-and-drop the `dist/` folder.

All asset paths are relative (`base: './'`), so the build works from any
subpath.

## Project layout

```
src/
  constants.js     court geometry + physics tuning (the feel — don't retune)
  physics.js       ball simulation, shot solver, offline shot simulation
  game.js          HORSE rules & turn state machine
  npc.js           Buckets' AI (spot picks, modifier calls, shot planning)
  talk.js          trash talk pools
  audio.js         WebAudio synth engine
  stats.js         async stats store (swap LocalStatsStore for a backend later)
  share.js         share card renderer + Web Share / clipboard flow
  input.js         slingshot pointer handling
  render/          camera, scene, players, crowd, particles/FX
  ui/              HUD (letters, chips, messages) and overlays
legacy/
  horse-original.html   the original single-file game, kept for reference
```

The original single-file physics and HORSE flow were ported verbatim; every
new feature is layered around them via an event bus.
