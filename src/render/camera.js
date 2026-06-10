/* Subtle pan/zoom that follows the ball in flight and eases back to a
   static framing otherwise. Pointer input is mapped through the inverse
   transform, so aiming behaves identically regardless of camera position. */
import { S } from '../state.js';
import { W, H } from '../constants.js';
import { shakeOffset } from './fx.js';

const cam = { x: 0, y: 0, z: 1 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function update(dt) {
  let tx = 0, ty = 0, tz = 1;
  if ((S.state === 'flight' || S.state === 'resolve') && S.ball) {
    tx = clamp((S.ball.x - 450) * 0.14, -34, 34);
    ty = clamp((S.ball.y - 250) * 0.09, -26, 16);
    tz = (S.gamePoint && S.timeScale < 0.8) ? 1.1 : 1.045;
  }
  const k = Math.min(1, dt * 3.2);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  cam.z += (tz - cam.z) * k;
}

export function apply(ctx) {
  const s = shakeOffset();
  ctx.save();
  ctx.translate(W / 2 + s.x, H / 2 + s.y);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-W / 2 - cam.x, -H / 2 - cam.y);
}

export function screenToWorld(p) {
  return {
    x: (p.x - W / 2) / cam.z + W / 2 + cam.x,
    y: (p.y - H / 2) / cam.z + H / 2 + cam.y,
  };
}
