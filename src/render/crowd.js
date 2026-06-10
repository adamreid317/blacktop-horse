/* Crowd silhouettes hanging out behind the fence. They bob idly, jump and
   throw arms up on makes, slump on misses, and stir when the rim rattles. */
import { bus } from '../state.js';
import { FLOOR } from '../constants.js';

const figs = [];
let time = 0;

export function init() {
  for (let i = 0; i < 10; i++) {
    figs.push({
      x: 36 + i * 68 + Math.random() * 26,
      s: 0.75 + Math.random() * 0.4,
      ph: Math.random() * 7,
      mood: 'idle', next: null, t: 0, delay: 0, dur: 0,
    });
  }
  bus.on('made', (e) => react('cheer', e.gamePoint));
  bus.on('missed', (e) => react('groan', e.gamePoint));
  bus.on('rim', (e) => { if (e.impact > 520) react('murmur', false); });
  bus.on('gameover', (e) => react(e.win ? 'cheer' : 'groan', true));
}

function react(mood, big) {
  for (const f of figs) {
    if (Math.random() < (big ? 1 : 0.8)) {
      f.next = mood;
      f.delay = Math.random() * 0.3;
      f.dur = (big ? 1.8 : 1.1) + Math.random() * 0.5;
    }
  }
}

export function update(dt) {
  time += dt;
  for (const f of figs) {
    if (f.next) {
      f.delay -= dt;
      if (f.delay <= 0) { f.mood = f.next; f.next = null; f.t = 0; }
    } else if (f.mood !== 'idle') {
      f.t += dt;
      if (f.t > f.dur) f.mood = 'idle';
    }
  }
}

export function draw(ctx) {
  ctx.fillStyle = 'rgba(16,17,24,.62)';
  ctx.strokeStyle = 'rgba(16,17,24,.62)';
  for (const f of figs) {
    const bob = Math.sin(time * 1.8 + f.ph) * 2;
    let jump = 0, headDrop = 0, arms = false;
    if (f.mood === 'cheer') { jump = Math.abs(Math.sin(f.t * 7 + f.ph)) * 9 * f.s; arms = true; }
    else if (f.mood === 'groan') headDrop = 6 * f.s;
    else if (f.mood === 'murmur') jump = Math.abs(Math.sin(f.t * 5)) * 3;
    const baseY = FLOOR - 2;
    const headY = baseY - 92 * f.s + bob - jump + headDrop;
    // body
    ctx.lineWidth = 15 * f.s; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.x, headY + 14 * f.s); ctx.lineTo(f.x, baseY - 14 * f.s - jump * 0.4);
    ctx.stroke();
    // head
    ctx.beginPath(); ctx.arc(f.x, headY, 7.5 * f.s, 0, 7); ctx.fill();
    // arms up when cheering
    if (arms) {
      ctx.lineWidth = 4.5 * f.s;
      ctx.beginPath();
      ctx.moveTo(f.x - 2, headY + 16 * f.s); ctx.lineTo(f.x - 14 * f.s, headY - 8 * f.s);
      ctx.moveTo(f.x + 2, headY + 16 * f.s); ctx.lineTo(f.x + 14 * f.s, headY - 8 * f.s);
      ctx.stroke();
    }
  }
}
