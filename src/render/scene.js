/* Court rendering — sky, skyline, fence, hoop, chalk markings, ball and aim
   preview. The drawing is the original art, with net wobble, hot-ball glow
   and trick shot indicators layered on. */
import { S } from '../state.js';
import { W, FLOOR, RIM, RIM_CX, BOARD, POLE, BALL_R, SPOTS, G, MOON_Y, MODS } from '../constants.js';
import { C } from '../palette.js';
import { releaseOf } from '../physics.js';
import { getNetWobble } from './fx.js';

export function drawSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
  sky.addColorStop(0, C.duskTop); sky.addColorStop(.62, C.duskMid); sky.addColorStop(1, C.duskGlow);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, FLOOR);
  // sun
  ctx.fillStyle = 'rgba(255,205,150,.5)';
  ctx.beginPath(); ctx.arc(180, FLOOR - 46, 40, Math.PI, 0); ctx.fill();
  // skyline
  ctx.fillStyle = 'rgba(21,22,28,.55)';
  const bl = [[0, 70, 90], [70, 55, 120], [125, 80, 70], [205, 40, 150], [245, 65, 95], [310, 90, 60], [370, 50, 130], [420, 70, 85], [490, 60, 110], [550, 85, 65], [615, 45, 140], [660, 75, 80], [735, 60, 100]];
  bl.forEach(([x, w, h]) => ctx.fillRect(x, FLOOR - h, w, h));
}

export function drawCourt(ctx, time) {
  // fence (drawn over the crowd, so they read as behind it)
  ctx.strokeStyle = 'rgba(236,231,218,.07)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 34) {
    ctx.beginPath(); ctx.moveTo(x, FLOOR - 118); ctx.lineTo(x + 24, FLOOR); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 24, FLOOR - 118); ctx.lineTo(x, FLOOR); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(236,231,218,.12)';
  ctx.beginPath(); ctx.moveTo(0, FLOOR - 118); ctx.lineTo(W, FLOOR - 118); ctx.stroke();
  // asphalt
  ctx.fillStyle = C.asphalt; ctx.fillRect(0, FLOOR, W, 520 - FLOOR);
  ctx.strokeStyle = 'rgba(236,231,218,.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke();
  // chalk arc + key
  ctx.strokeStyle = 'rgba(236,231,218,.18)'; ctx.lineWidth = 2; ctx.setLineDash([7, 7]);
  ctx.beginPath(); ctx.ellipse(782, FLOOR + 30, 330, 26, 0, Math.PI, Math.PI * 1.97); ctx.stroke();
  ctx.setLineDash([]);
  // hoop: pole, board, rim
  ctx.strokeStyle = '#3a3c46'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(POLE.x, FLOOR); ctx.lineTo(POLE.x, BOARD.y1 + 18); ctx.lineTo(BOARD.x + 2, BOARD.y1 + 30); ctx.stroke();
  ctx.fillStyle = 'rgba(236,231,218,.85)'; ctx.fillRect(BOARD.x, BOARD.y1, 7, BOARD.y2 - BOARD.y1);
  ctx.fillStyle = 'rgba(21,22,28,.25)'; ctx.fillRect(BOARD.x + 1, RIM.y - 34, 5, 30);
  ctx.strokeStyle = C.ball; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(RIM.x1, RIM.y); ctx.lineTo(RIM.x2, RIM.y); ctx.stroke();
  ctx.fillStyle = C.ball;
  ctx.beginPath(); ctx.arc(RIM.x1, RIM.y, 4, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(RIM.x2, RIM.y, 4, 0, 7); ctx.fill();
  // net (wobbles after a make)
  const wob = getNetWobble();
  ctx.strokeStyle = 'rgba(236,231,218,.5)'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const t = i / 4, x0 = RIM.x1 + t * (RIM.x2 - RIM.x1);
    const sway = Math.sin(time * 26 + i) * 6 * wob;
    ctx.beginPath(); ctx.moveTo(x0, RIM.y + 2);
    ctx.quadraticCurveTo(
      RIM.x1 + 22 + (t - 0.5) * 16 + sway, RIM.y + 24,
      RIM.x1 + 16 + t * 14 + 4 + sway * 0.6, RIM.y + 40 + wob * 4
    );
    ctx.stroke();
  }
  drawModIndicators(ctx, time);
  drawSpotMarkers(ctx);
}

function drawModIndicators(ctx, time) {
  if (!S.mod || S.state === 'idle' || S.state === 'over') return;
  const m = MODS[S.mod];
  ctx.fillStyle = 'rgba(236,231,218,.75)';
  ctx.font = "700 24px Caveat, cursive"; ctx.textAlign = 'left';
  ctx.fillText(`${m.label} called — ${m.desc}`, 16, 34);
  if (S.mod === 'bank') {
    ctx.strokeStyle = `rgba(127,209,192,${0.35 + 0.2 * Math.sin(time * 5)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(BOARD.x - 2, BOARD.y1 - 2, 11, BOARD.y2 - BOARD.y1 + 4);
  }
  if (S.mod === 'moon') {
    ctx.strokeStyle = 'rgba(236,231,218,.3)'; ctx.setLineDash([10, 10]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40, MOON_Y); ctx.lineTo(W - 150, MOON_Y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(236,231,218,.5)'; ctx.font = "700 18px Caveat, cursive";
    ctx.fillText('over this line ☾', 44, MOON_Y - 8);
  }
}

function drawSpotMarkers(ctx) {
  if (S.shooter === 'you' && (S.state === 'pickSpot' || S.state === 'aim') && S.phase === 'set') {
    SPOTS.forEach((sx) => drawX(ctx, sx, sx === S.spotX && S.state === 'aim'));
  } else if (S.state === 'aim' && S.phase === 'copy') {
    drawX(ctx, S.spotX, true);
  } else if ((S.state === 'npcwait' || S.state === 'flight') && S.phase === 'copy') {
    drawX(ctx, S.copySpot, false);
  }
}

function drawX(ctx, x, active) {
  ctx.strokeStyle = active ? C.ball : 'rgba(236,231,218,.4)';
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9, FLOOR + 12); ctx.lineTo(x + 9, FLOOR + 28);
  ctx.moveTo(x + 9, FLOOR + 12); ctx.lineTo(x - 9, FLOOR + 28);
  ctx.stroke();
}

export function drawBall(ctx, b, glow) {
  if (glow) {
    const g = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, BALL_R * 2.6);
    g.addColorStop(0, 'rgba(255,190,90,.55)'); g.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R * 2.6, 0, 7); ctx.fill();
  }
  ctx.fillStyle = C.ball;
  ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(21,22,28,.55)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, 7); ctx.stroke();
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin || 0);
  ctx.beginPath(); ctx.moveTo(-BALL_R, 0); ctx.lineTo(BALL_R, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -BALL_R * 1.15, BALL_R * 1.05, Math.PI * 0.28, Math.PI * 0.72); ctx.stroke();
  ctx.restore();
}

export function drawAim(ctx) {
  const from = releaseOf(S.spotX);
  drawBall(ctx, { x: from.x, y: from.y, spin: 0 }, S.hot.you);
  const d = S.drag;
  if (!d) return;
  const vx = (d.sx - d.cx) * 5, vy = (d.sy - d.cy) * 5;
  const sp = Math.hypot(vx, vy);
  if (sp < 10) return;
  let fvx = vx, fvy = vy;
  if (sp > 1450) { fvx *= 1450 / sp; fvy *= 1450 / sp; }
  if (S.mod !== 'nopreview') {
    ctx.fillStyle = 'rgba(236,231,218,.55)';
    let px = from.x, py = from.y, pvx = fvx, pvy = fvy;
    for (let i = 0; i < 16; i++) {
      const h = 0.035; pvy += G * h; px += pvx * h; py += pvy * h;
      if (py > FLOOR) break;
      ctx.globalAlpha = 1 - i / 17;
      ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // power bar
  const pw = Math.min(1, sp / 1450);
  ctx.fillStyle = 'rgba(236,231,218,.18)'; ctx.fillRect(from.x - 32, from.y - 46, 64, 7);
  ctx.fillStyle = pw > 0.94 ? C.teal : C.ball; ctx.fillRect(from.x - 32, from.y - 46, 64 * pw, 7);
}
