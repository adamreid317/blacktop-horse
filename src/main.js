import './styles.css';
import { S, bus } from './state.js';
import { W, H, RIM, RIM_CX } from './constants.js';
import { initPalette, C } from './palette.js';
import { stepBall } from './physics.js';
import * as game from './game.js';
import * as input from './input.js';
import * as cam from './render/camera.js';
import * as scene from './render/scene.js';
import * as figures from './render/figures.js';
import * as crowd from './render/crowd.js';
import * as fx from './render/fx.js';
import * as hud from './ui/hud.js';
import * as overlays from './ui/overlays.js';
import * as aud from './audio.js';
import { initPWA } from './pwa.js';

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const dpr = Math.min(2, window.devicePixelRatio || 1);
cv.width = W * dpr;
cv.height = H * dpr;

initPalette();
hud.init();
overlays.init({
  onStart: (k) => game.startGame(k),
  onRematch: () => game.startGame(S.diffKey),
});
input.init(cv);
figures.init();
crowd.init();
initPWA();

/* wire physics/game events to audio + FX */
let slowHold = 0;
bus.on('floor', (e) => { aud.bounce(e.impact); fx.chalkPuff(e.x, e.y, e.impact); });
bus.on('rim', (e) => {
  aud.clank(e.impact);
  fx.sparks(e.x, e.y, e.impact);
  if (e.impact > 480) fx.addShake(Math.min(9, e.impact / 110), 0.28);
});
bus.on('board', (e) => { aud.board(e.impact); fx.addShake(Math.min(5, e.impact / 160), 0.18); });
bus.on('score', () => {
  aud.swish();
  fx.netSplash();
  if (S.gamePoint) slowHold = 0.7; // hang in slow-mo as the winner drops
});
bus.on('made', (e) => {
  setTimeout(() => aud.cheer(e.gamePoint), 180);
  if (e.gamePoint) fx.bigBurst(RIM_CX, RIM.y);
});
bus.on('missed', (e) => aud.groan(e.gamePoint));
bus.on('hot', () => aud.hotwhoosh());
bus.on('letter', () => aud.murmur());
bus.on('gameover', (e) => (e.win ? aud.cheer(true) : aud.groan(true)));
bus.on('turnstart', () => fx.clearTrail());

let last = performance.now();
function loop(now) {
  const raw = Math.min(0.034, (now - last) / 1000);
  last = now;

  // slow-mo on game-deciding shots as the ball nears the rim
  let target = 1;
  if (S.state === 'flight' && S.gamePoint && S.ball) {
    const d = Math.hypot(S.ball.x - RIM_CX, S.ball.y - RIM.y);
    if (d < 180) target = 0.35;
  }
  if (slowHold > 0) { slowHold -= raw; target = Math.min(target, 0.45); }
  S.timeScale += (target - S.timeScale) * Math.min(1, raw * 9);
  const dt = raw * S.timeScale;

  if (S.state === 'flight' && S.ball) {
    const events = [];
    stepBall(S.ball, dt, { hot: S.hot[S.shooter] }, events);
    for (const e of events) bus.emit(e.t, e);
    fx.trailPush(S.ball.x, S.ball.y, S.hot[S.shooter]);
    if (S.ball.done) game.finishFlight();
  }

  cam.update(raw);
  figures.update(raw);
  crowd.update(raw);
  fx.update(raw);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  cam.apply(ctx);
  scene.drawSky(ctx);
  crowd.draw(ctx);
  scene.drawCourt(ctx, now / 1000);
  figures.draw(ctx);
  fx.drawTrail(ctx);
  if (S.state === 'aim') scene.drawAim(ctx);
  if (S.ball && (S.state === 'flight' || S.state === 'resolve')) {
    scene.drawBall(ctx, S.ball, S.hot[S.shooter]);
  }
  fx.drawParticles(ctx);
  if (S.ball && S.ball.scored && (S.state === 'flight' || S.state === 'resolve')) {
    ctx.fillStyle = C.chalk;
    ctx.font = "800 30px 'Barlow Condensed'";
    ctx.textAlign = 'center';
    ctx.fillText('BUCKET!', RIM_CX - 40, RIM.y - 58);
  }
  ctx.restore();

  hud.tick();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
