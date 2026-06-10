/* Buckets' brain. Spot picking and make probability are the original logic;
   trick shots are planned by simulating candidate shots with the real
   physics until one satisfies the modifier (bank/moon) and the intended
   make/miss outcome. */
import { RIM, RIM_CX, BOARD, BALL_R, SPOTS, MOON_Y } from './constants.js';
import { releaseOf, makeProb, solveTo, solveToT, simulateShot } from './physics.js';

export function npcPickSpot() {
  const idx = [1, 2, 2, 3, 3, 4, 4, 5][Math.floor(Math.random() * 8)];
  return SPOTS[Math.min(idx, SPOTS.length - 1)];
}

export function npcMaybeCallMod(modChance) {
  if (Math.random() >= modChance) return null;
  return ['bank', 'moon', 'nopreview'][Math.floor(Math.random() * 3)];
}

export function planNpcShot({ spotX, phase, mod, diff, hot }) {
  const from = releaseOf(spotX);
  let p = makeProb(spotX, diff) * (phase === 'copy' ? 0.96 : 1);
  if (mod === 'bank') p *= 0.93;
  if (mod === 'moon') p *= 0.95;
  if (mod === 'nopreview') p *= 0.97;
  if (hot) p = Math.min(0.95, p + 0.06);
  const make = Math.random() < p;

  if (mod === 'bank' || mod === 'moon') {
    const v = searchShot(from, make, mod, hot);
    if (v) return v;
  }
  return directShot(from, make);
}

/* original aiming: straight at the rim with a make/miss offset */
function directShot(from, make) {
  const target = make
    ? { x: RIM_CX + (Math.random() * 6 - 3), y: RIM.y - 2 }
    : { x: RIM_CX + (Math.random() < .5 ? -1 : 1) * (19 + Math.random() * 16), y: RIM.y - 2 };
  return solveTo(from, target);
}

/* sample candidate trajectories and keep the first one whose simulated
   outcome matches (make/miss) while obeying the called modifier */
function searchShot(from, make, mod, hot) {
  for (let i = 0; i < 140; i++) {
    let v;
    if (mod === 'bank') {
      const ty = RIM.y - 6 - Math.random() * 44;
      const T = 0.8 + Math.random() * 0.55;
      v = solveToT(from, { x: BOARD.x - BALL_R - 1, y: ty }, T);
    } else { // moon: same targets as a direct shot, much floatier flight time
      const tx = RIM_CX + (make
        ? (Math.random() * 6 - 3)
        : (Math.random() < .5 ? -1 : 1) * (19 + Math.random() * 16));
      const T = (0.85 + Math.abs(tx - from.x) / 950) * (1.18 + Math.random() * 0.45);
      v = solveToT(from, { x: tx, y: RIM.y - 2 }, T);
    }
    const sim = simulateShot(from, v, { hot });
    const valid = mod === 'bank'
      ? (sim.scored ? sim.scoredWithBank : sim.hitBoard)
      : sim.apexY <= MOON_Y;
    if (sim.scored === make && valid) return v;
  }
  return null;
}
