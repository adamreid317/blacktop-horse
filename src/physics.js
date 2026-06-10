/* Ball physics — ported verbatim from the original (gravity, restitution,
   substeps, score plane, bounce thresholds). The only additions:
   - collision events are reported to the caller for FX/audio
   - bank/moon tracking (hitBoard, apexY) for trick shot rules
   - a subtle hot-hand rim forgiveness, active only while a player is hot */
import { W, FLOOR, RIM, BOARD, BALL_R, G } from './constants.js';

export const releaseOf = (x) => ({ x: x + 14, y: 332 });

export function makeProb(x, diff) {
  const dist = ((RIM.x1 + RIM.x2) / 2) - x;
  const p = (0.92 - dist / 1050) * diff;
  return Math.min(0.93, Math.max(0.38, p));
}

export function solveTo(from, target) {
  const dx = target.x - from.x, dy = target.y - from.y;
  const T = 0.85 + Math.abs(dx) / 950;
  return { vx: dx / T, vy: (dy - 0.5 * G * T * T) / T };
}

export function solveToT(from, target, T) {
  const dx = target.x - from.x, dy = target.y - from.y;
  return { vx: dx / T, vy: (dy - 0.5 * G * T * T) / T };
}

export function createBall(from, v) {
  return {
    x: from.x, y: from.y, vx: v.vx, vy: v.vy, spin: 0, prevY: from.y,
    scored: false, scoredWithBank: false, hitBoard: false,
    bounces: 0, rimHits: 0, apexY: from.y, done: false,
  };
}

export function stepBall(b, dt, opts = {}, events = null) {
  const sub = 3, h = dt / sub;
  for (let i = 0; i < sub; i++) {
    b.prevY = b.y;
    b.vy += G * h; b.x += b.vx * h; b.y += b.vy * h; b.spin += b.vx * h * 0.02;
    if (b.y < b.apexY) b.apexY = b.y;
    // score plane
    if (!b.scored && b.prevY <= RIM.y && b.y > RIM.y && b.vy > 0 && b.x > RIM.x1 + 8 && b.x < RIM.x2 - 8) {
      b.scored = true;
      b.scoredWithBank = b.hitBoard;
      if (events) events.push({ t: 'score', x: (RIM.x1 + RIM.x2) / 2, y: RIM.y });
    }
    // rim nodes
    for (const nx of [RIM.x1, RIM.x2]) {
      const dx = b.x - nx, dy = b.y - RIM.y, d = Math.hypot(dx, dy);
      const rr = BALL_R + (opts.hot ? 3 : 4); // hot hand: ball slips past the iron a touch easier
      if (d < rr && d > 0) {
        const ux = dx / d, uy = dy / d;
        b.x = nx + ux * rr; b.y = RIM.y + uy * rr;
        const dot = b.vx * ux + b.vy * uy;
        if (dot < 0) {
          b.vx -= 1.55 * dot * ux; b.vy -= 1.55 * dot * uy; b.vx *= .92; b.vy *= .92;
          if (opts.hot) b.vx += (((RIM.x1 + RIM.x2) / 2) - b.x) * 0.8; // friendly roll toward center
          b.rimHits++;
          if (events) events.push({ t: 'rim', x: b.x, y: b.y, impact: Math.abs(dot) });
        }
      }
    }
    // backboard
    if (b.x + BALL_R > BOARD.x && b.y > BOARD.y1 && b.y < BOARD.y2 && b.vx > 0) {
      b.x = BOARD.x - BALL_R;
      if (events) events.push({ t: 'board', x: b.x, y: b.y, impact: Math.abs(b.vx) });
      b.vx *= -0.62; b.hitBoard = true;
    }
    // floor
    if (b.y + BALL_R >= FLOOR) {
      b.y = FLOOR - BALL_R;
      if (Math.abs(b.vy) > 120) {
        if (events) events.push({ t: 'floor', x: b.x, y: b.y, impact: Math.abs(b.vy) });
        b.vy *= -0.55; b.vx *= 0.7; b.bounces++;
      } else { b.vy = 0; b.vx *= 0.92; }
      if (b.bounces > 2 || Math.abs(b.vx) < 25) { b.done = true; return; }
    }
    if (b.x < -50 || b.x > W + 60) { b.done = true; return; }
  }
}

/* Run a full shot offline (no events) — used by Buckets to plan trick shots. */
export function simulateShot(from, v, opts = {}) {
  const b = createBall(from, v);
  const dt = 1 / 60;
  let t = 0;
  while (!b.done && t < 7) { stepBall(b, dt, opts); t += dt; }
  return b;
}
