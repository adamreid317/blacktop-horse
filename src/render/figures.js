/* The two players, still chalk-silhouette style but with poses: idle bounce,
   aim crouch scaled by drag power, shooting release, celebration jumps and
   the head-drop of shame. The non-shooter waits courtside and reacts. */
import { S, bus, other } from '../state.js';
import { FLOOR } from '../constants.js';
import { C } from '../palette.js';

const F = { you: { pose: 'idle', t: 0 }, npc: { pose: 'idle', t: 0 } };
let time = 0;

export function init() {
  bus.on('launch', (e) => setPose(e.shooter, 'shoot'));
  bus.on('made', (e) => {
    setPose(e.shooter, 'celebrate');
    setPose(other(e.shooter), e.phase === 'copy' ? 'dejected' : 'idle');
  });
  bus.on('missed', (e) => {
    setPose(e.shooter, 'dejected');
    setPose(other(e.shooter), e.phase === 'copy' ? 'celebrate' : 'idle');
  });
  bus.on('turnstart', () => { setPose('you', 'idle'); setPose('npc', 'idle'); });
}

function setPose(p, pose) {
  const f = F[p];
  if (f.pose !== pose) { f.pose = pose; f.t = 0; }
}

export function update(dt) {
  F.you.t += dt; F.npc.t += dt; time += dt;
}

function params(f, isShooter) {
  const t = f.t;
  let crouch = 0, armUp = 0, jump = 0, head = 0;
  switch (f.pose) {
    case 'idle':
      crouch = 0.05 + 0.05 * Math.sin(time * 2.3 + (f === F.npc ? 1.7 : 0));
      break;
    case 'shoot': {
      const k = Math.min(1, t / 0.16);
      armUp = k; crouch = (1 - k) * 0.45;
      jump = Math.sin(Math.min(1, t / 0.38) * Math.PI) * 7;
      break;
    }
    case 'celebrate':
      armUp = 1; jump = Math.abs(Math.sin(t * 6.5)) * 11; head = -0.3;
      break;
    case 'dejected':
      crouch = 0.2; head = 1;
      break;
  }
  // live aim: crouch with drag power, arms loaded (original held arms up while aiming)
  if (isShooter && S.state === 'aim') {
    armUp = 0.9;
    if (S.drag) {
      const sp = Math.min(1, Math.hypot(S.drag.sx - S.drag.cx, S.drag.sy - S.drag.cy) * 5 / 1450);
      crouch = 0.12 + sp * 0.5;
    }
  }
  if (isShooter && S.state === 'npcwait') { armUp = 0.9; crouch = 0.15 + 0.04 * Math.sin(time * 4); }
  return { crouch, armUp, jump, head };
}

export function draw(ctx) {
  if (S.state === 'idle' || S.state === 'over') return;
  const shooter = S.shooter, waiter = other(shooter);
  drawFigure(ctx, S.spotX, shooter === 'you' ? C.chalk : C.teal, params(F[shooter], true));
  drawFigure(ctx, 52, waiter === 'you' ? C.chalk : C.teal, params(F[waiter], false));
  if (S.hot[shooter] && (S.state === 'pickSpot' || S.state === 'aim' || S.state === 'npcwait')) {
    ctx.fillStyle = C.ball;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 5);
    ctx.font = "700 20px Caveat, cursive"; ctx.textAlign = 'center';
    ctx.fillText('heating up', S.spotX + 4, FLOOR - 138);
    ctx.globalAlpha = 1;
  }
}

/* Original figure proportions, with pose parameters layered on:
   crouch lowers the hips, armUp lerps arms between resting and release,
   jump lifts the whole silhouette, head>0 hangs the head. */
function drawFigure(ctx, x, col, P) {
  const j = P.jump, c = P.crouch;
  const hipY = FLOOR - 52 + c * 14 - j;
  const shY = FLOOR - 96 + c * 11 - j;   // top of body
  const armY = FLOOR - 88 + c * 11 - j;  // shoulder pivot
  const footY = FLOOR - j * 0.85;
  const u = Math.max(0, Math.min(1, P.armUp));
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  // legs
  ctx.beginPath();
  ctx.moveTo(x, hipY); ctx.lineTo(x - 11, footY);
  ctx.moveTo(x, hipY); ctx.lineTo(x + 11, footY);
  ctx.stroke();
  // body
  ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x + 4, shY); ctx.stroke();
  // arms: lerp between down (x+18/x-12, FLOOR-66) and up (x+16/x-4, FLOOR-118/116)
  const h1x = x + 18 - 2 * u, h1y = FLOOR - 66 - 52 * u + c * 11 - j;
  const h2x = x - 12 + 8 * u, h2y = FLOOR - 66 - 50 * u + c * 11 - j;
  ctx.beginPath();
  ctx.moveTo(x + 4, armY); ctx.lineTo(h1x, h1y);
  ctx.moveTo(x + 4, armY); ctx.lineTo(h2x, h2y);
  ctx.stroke();
  // head
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x + 5 + P.head * 5, FLOOR - 108 + c * 11 + P.head * 9 - j, 9, 0, 7);
  ctx.fill();
}
