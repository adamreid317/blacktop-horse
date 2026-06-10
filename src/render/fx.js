/* Juice layer: particles (chalk dust, rim sparks, net splash), ball trail,
   screen shake and net wobble. Pure visuals — never touches game state. */
import { C } from '../palette.js';
import { RIM, FLOOR, BALL_R } from '../constants.js';

const parts = [];
const trail = [];
const TRAIL_AGE = 0.4;
let shakeT = 0, shakeMag = 0, netW = 0;

export function addShake(mag, t) {
  shakeMag = Math.max(shakeMag, mag);
  shakeT = Math.max(shakeT, t);
}

export function shakeOffset() {
  if (shakeT <= 0) return { x: 0, y: 0 };
  const m = shakeMag * Math.min(1, shakeT * 4);
  return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m };
}

export function getNetWobble() { return netW; }

function spawn(o) { if (parts.length < 260) parts.push(o); }

export function chalkPuff(x, y, impact) {
  const n = Math.min(10, 3 + impact / 180);
  for (let i = 0; i < n; i++) {
    spawn({
      x: x + (Math.random() * 16 - 8), y: FLOOR - 2,
      vx: (Math.random() * 2 - 1) * 60, vy: -Math.random() * 55 - 15, g: 60,
      r: 2.5 + Math.random() * 3.5, life: 0.55 + Math.random() * 0.3, t: 0,
      col: '236,231,218', a: 0.32, grow: 18,
    });
  }
}

export function sparks(x, y, impact) {
  const n = Math.min(9, 2 + impact / 140);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * impact * 0.45;
    spawn({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 500,
      r: 1.6, life: 0.22 + Math.random() * 0.16, t: 0,
      col: '255,200,120', a: 0.9, streak: true,
    });
  }
}

export function netSplash() {
  netW = 1;
  const cx = (RIM.x1 + RIM.x2) / 2;
  for (let i = 0; i < 14; i++) {
    spawn({
      x: cx + (Math.random() * 30 - 15), y: RIM.y + 10 + Math.random() * 24,
      vx: (Math.random() * 2 - 1) * 45, vy: 60 + Math.random() * 120, g: 300,
      r: 1.4, life: 0.3 + Math.random() * 0.2, t: 0,
      col: '236,231,218', a: 0.8, streak: true,
    });
  }
}

export function bigBurst(x, y) {
  for (let i = 0; i < 36; i++) {
    const a = Math.random() * Math.PI * 2, s = 90 + Math.random() * 330;
    spawn({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, g: 380,
      r: 2 + Math.random() * 2.5, life: 0.7 + Math.random() * 0.5, t: 0,
      col: Math.random() < .5 ? '127,209,192' : '236,231,218', a: 0.85,
    });
  }
  addShake(5, 0.3);
}

function ember(x, y) {
  spawn({
    x, y, vx: (Math.random() * 2 - 1) * 30, vy: -40 - Math.random() * 40, g: -30,
    r: 2 + Math.random() * 2, life: 0.4, t: 0, col: '255,170,60', a: 0.7,
  });
}

export function trailPush(x, y, hot) {
  trail.push({ x, y, t: 0, hot });
  if (trail.length > 400) trail.shift();
  if (hot && Math.random() < 0.3) ember(x, y);
}

export function clearTrail() { trail.length = 0; }

export function update(dt) {
  shakeT -= dt;
  if (shakeT <= 0) shakeMag = 0;
  netW = Math.max(0, netW - dt * 2.2);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].t += dt;
    if (trail[i].t > TRAIL_AGE) trail.splice(i, 1);
  }
}

export function drawTrail(ctx) {
  for (const p of trail) {
    const k = 1 - p.t / TRAIL_AGE;
    ctx.globalAlpha = k * (p.hot ? 0.5 : 0.28);
    ctx.fillStyle = p.hot ? '#ffb347' : C.ball;
    ctx.beginPath(); ctx.arc(p.x, p.y, BALL_R * k * (p.hot ? 1 : 0.8), 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawParticles(ctx) {
  for (const p of parts) {
    const k = 1 - p.t / p.life;
    ctx.globalAlpha = p.a * k;
    if (p.streak) {
      ctx.strokeStyle = `rgb(${p.col})`; ctx.lineWidth = p.r; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke();
    } else {
      ctx.fillStyle = `rgb(${p.col})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + (p.grow ? p.grow * p.t : 0), 0, 7); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
