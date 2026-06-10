/* Slingshot input — identical tuning to the original (×5 velocity,
   <140 cancels, 1450 speed cap). Pointer coords are mapped through the
   camera's inverse transform so aim is exact regardless of camera. */
import { S } from './state.js';
import { W } from './constants.js';
import * as cam from './render/camera.js';
import * as game from './game.js';
import { unlock } from './audio.js';

let cv;

export function init(canvas) {
  cv = canvas;
  cv.addEventListener('pointerdown', down);
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', cancel);
}

function toWorld(e) {
  const r = cv.getBoundingClientRect();
  return cam.screenToWorld({
    x: (e.clientX - r.left) * (W / r.width),
    y: (e.clientY - r.top) * (W / r.width), // canvas keeps aspect, same scale both axes
  });
}

function down(e) {
  try { unlock(); } catch (err) {}
  const p = toWorld(e);
  if (game.trySpotTap(p)) return;
  if (S.state === 'aim') {
    S.drag = { sx: p.x, sy: p.y, cx: p.x, cy: p.y };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  }
}

function move(e) {
  if (S.drag && S.state === 'aim') {
    const p = toWorld(e);
    S.drag.cx = p.x; S.drag.cy = p.y;
  }
}

function up() {
  if (S.drag && S.state === 'aim') {
    const vx = (S.drag.sx - S.drag.cx) * 5, vy = (S.drag.sy - S.drag.cy) * 5;
    const sp = Math.hypot(vx, vy);
    S.drag = null;
    if (sp < 140) return; // too soft, treat as cancel
    let fvx = vx, fvy = vy;
    if (sp > 1450) { fvx *= 1450 / sp; fvy *= 1450 / sp; }
    game.playerLaunch({ vx: fvx, vy: fvy });
  }
}

function cancel() { S.drag = null; }
