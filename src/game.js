/* HORSE rules and turn flow — same state machine as the original
   (set → opponent copies → miss a copy = letter), with trick shot
   modifiers, hot hand streaks and stats layered on top. */
import { S, bus, other } from './state.js';
import { DIFFS, HORSE, MODS, MOON_Y } from './constants.js';
import { releaseOf, createBall } from './physics.js';
import { planNpcShot, npcPickSpot, npcMaybeCallMod } from './npc.js';
import { T, pick } from './talk.js';
import * as hud from './ui/hud.js';
import * as overlays from './ui/overlays.js';
import { stats } from './stats.js';
import { unlock as unlockAudio } from './audio.js';
import { SPOTS, FLOOR } from './constants.js';

let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

/* player calls (or clears) a trick shot modifier while setting */
bus.on('callmod', (k) => {
  if (!(S.shooter === 'you' && S.phase === 'set' && (S.state === 'pickSpot' || S.state === 'aim'))) return;
  S.mod = k;
  hud.say(k ? pick(T.youCallMod[k]) : 'Straight up. No gimmicks.');
  hud.refresh();
});

export function startGame(diffKey) {
  clearTimers();
  S.diffKey = diffKey; S.diff = DIFFS[diffKey].d;
  S.letters = { you: 0, npc: 0 };
  S.streak = { you: 0, npc: 0 };
  S.hot = { you: false, npc: false };
  S.control = 'you'; S.phase = 'set'; S.copySpot = null;
  S.shotsTaken = 0; S.playerShots = 0;
  S.mod = null; S.ball = null; S.drag = null; S.gamePoint = false;
  hud.paintLetters();
  overlays.hideAll();
  hud.say('Your ball first. Call your shot.', 'TIP-OFF');
  bus.emit('gamestart', { diffKey });
  beginTurn();
}

function beginTurn() {
  S.ball = null; S.drag = null;
  S.shooter = (S.phase === 'copy') ? other(S.control) : S.control;
  bus.emit('turnstart');
  if (S.shooter === 'you') {
    if (S.phase === 'copy') {
      S.spotX = S.copySpot;
      S.state = 'aim';
      const modTxt = S.mod ? ` — ${MODS[S.mod].label.toLowerCase()} rules` : '';
      hud.hint(`Match his shot${modTxt} — drag back from the ball, release to shoot`);
      if (S.letters.you === 4) hud.say(pick(T.gamePointYou));
    } else {
      S.state = 'pickSpot';
      hud.hint('Tap a chalk X to pick your spot');
    }
  } else {
    S.state = 'npcwait'; hud.hint('');
    if (S.phase === 'set') {
      S.spotX = npcPickSpot();
      S.mod = npcMaybeCallMod(DIFFS[S.diffKey].modChance);
      hud.say(S.mod ? pick(T.npcCallMod[S.mod]) : pick(T.npcCall), 'BUCKETS');
    } else {
      S.spotX = S.copySpot;
      hud.say(S.letters.npc === 4 ? pick(T.npcGamePoint) : "He's gotta match you...");
    }
    later(npcShoot, 1400);
  }
  hud.refresh();
}

function npcShoot() {
  if (S.state !== 'npcwait') return;
  const v = planNpcShot({
    spotX: S.spotX, phase: S.phase, mod: S.mod,
    diff: S.diff, hot: S.hot.npc,
  });
  launch(releaseOf(S.spotX), v);
}

function launch(from, v) {
  unlockAudio();
  S.ball = createBall(from, v);
  S.shotsTaken++;
  if (S.shooter === 'you') S.playerShots++;
  S.gamePoint = (S.phase === 'copy' && S.letters[S.shooter] === 4);
  S.state = 'flight';
  bus.emit('launch', { shooter: S.shooter, hot: S.hot[S.shooter] });
  hud.refresh();
}

export function playerLaunch(v) {
  if (S.state !== 'aim') return;
  hud.hint('');
  launch(releaseOf(S.spotX), v);
}

/* tap handling for spot markers (original behavior: pick in pickSpot state,
   or re-pick while aiming a set shot before dragging) */
export function trySpotTap(p) {
  if (S.state === 'pickSpot' || (S.state === 'aim' && S.phase === 'set' && !S.drag)) {
    const R = (window.matchMedia && matchMedia('(pointer:coarse)').matches) ? 42 : 34;
    for (const sx of SPOTS) {
      if (Math.abs(p.x - sx) < R && p.y > FLOOR - 60) {
        S.spotX = sx;
        if (S.state === 'pickSpot') {
          S.state = 'aim';
          hud.hint('Drag back from the ball, release to shoot');
          hud.refresh();
        }
        return true;
      }
    }
  }
  return false;
}

export function finishFlight() {
  if (S.state !== 'flight') return;
  const b = S.ball;
  let made = b.scored, voided = null;
  if (S.mod === 'bank' && b.scored && !b.scoredWithBank) { made = false; voided = 'bank'; }
  if (S.mod === 'moon' && b.scored && b.apexY > MOON_Y) { made = false; voided = 'moon'; }
  S.state = 'resolve';
  bus.emit(made ? 'made' : 'missed', {
    shooter: S.shooter, phase: S.phase, gamePoint: S.gamePoint, voided,
  });
  // hot hand streaks
  if (made) {
    S.streak[S.shooter]++;
    if (!S.hot[S.shooter] && S.streak[S.shooter] >= 3) {
      S.hot[S.shooter] = true;
      bus.emit('hot', { p: S.shooter });
    }
  } else {
    S.streak[S.shooter] = 0;
    if (S.hot[S.shooter]) {
      S.hot[S.shooter] = false;
      bus.emit('hotlost', { p: S.shooter });
      hud.refresh();
    }
  }
  later(() => resolveOutcome(made, voided), 650);
}

function resolveOutcome(made, voided) {
  const sh = S.shooter, isNpc = sh === 'npc';
  // announce hot hand the moment it ignites
  const hotline = (S.hot[sh] && S.streak[sh] === 3) ? pick(isNpc ? T.npcHot : T.youHot) : null;

  if (S.phase === 'set') {
    if (made) {
      S.phase = 'copy'; S.copySpot = S.spotX;
      hud.say(hotline || (isNpc ? pick(T.npcMake) : pick(T.youMakeSet)), isNpc ? 'BUCKETS' : null);
    } else {
      if (voided) hud.say(pick(isNpc ? T.voidNpc[voided] : T.voidYou[voided]), isNpc ? 'BUCKETS' : null);
      else hud.say(isNpc ? pick(T.npcMiss) : pick(T.youMissSet), isNpc ? 'BUCKETS' : null);
      S.control = other(S.control); S.phase = 'set'; S.mod = null;
    }
  } else { // copy attempt
    if (made) {
      hud.say(hotline || (isNpc ? pick(T.npcMatched) : pick(T.youMatched)), isNpc ? 'BUCKETS' : null);
    } else {
      S.letters[sh]++;
      hud.paintLetters();
      bus.emit('letter', { p: sh, n: S.letters[sh] });
      const n = S.letters[sh];
      if (n >= 5) return gameOver(sh);
      const word = HORSE.slice(0, n).join('-');
      if (voided) {
        hud.say((isNpc ? pick(T.voidNpc[voided]) : pick(T.voidYou[voided])) + ` That's <b>${word}</b>.`, null);
      } else {
        hud.say(
          sh === 'you'
            ? `${pick(T.youLetter)} <b>${word}</b>`
            : `${pick(T.npcLetter)} He's on <b>${word}</b>.`,
          sh === 'you' ? 'BUCKETS' : null
        );
      }
    }
    S.phase = 'set'; S.mod = null;
  }
  hud.refresh();
  later(beginTurn, 1500);
}

async function gameOver(loser) {
  S.state = 'over'; S.mod = null;
  const win = loser === 'npc';
  bus.emit('gameover', { win });
  const rec = await stats.recordGame({ diffKey: S.diffKey, won: win, shots: S.playerShots });
  overlays.showEnd({
    win, diffKey: S.diffKey, shots: S.playerShots,
    letters: { ...S.letters }, stats: rec,
  });
  hud.hint('');
  hud.refresh();
}
