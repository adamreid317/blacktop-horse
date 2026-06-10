/* Start (difficulty + records) and end (result + stats + share) overlays. */
import { S } from '../state.js';
import { DIFFS } from '../constants.js';
import { T, pick } from '../talk.js';
import { stats } from '../stats.js';
import { shareResult } from '../share.js';
import * as hud from './hud.js';
import * as aud from '../audio.js';

const $ = (id) => document.getElementById(id);
let cbs = {};

export function init(c) {
  cbs = c;
  document.querySelectorAll('#startOv button[data-k]').forEach((b) => {
    b.addEventListener('click', () => { aud.unlock(); cbs.onStart(b.dataset.k); });
  });
  $('rematch').addEventListener('click', () => cbs.onRematch());
  $('switchDiff').addEventListener('click', () => {
    $('endOv').classList.add('hidden');
    showStart();
  });
  $('shareBtn').addEventListener('click', async () => {
    if (!S.lastResult) return;
    const res = await shareResult(S.lastResult);
    if (res === 'copied') hud.say('Image saved + text copied. Paste it anywhere.');
    else if (res === 'saved') hud.say('Share image downloaded.');
  });
  showStart();
}

export async function showStart() {
  const d = await stats.load();
  const fill = (k, id) => {
    const s = d[k];
    $(id).textContent = (s.w + s.l)
      ? `${s.w}W–${s.l}L${s.best > 1 ? ` · best streak ${s.best}` : ''}`
      : '';
  };
  fill('rookie', 'recRookie'); fill('pro', 'recPro'); fill('hof', 'recHof');
  $('startOv').classList.remove('hidden');
}

export function hideAll() {
  $('startOv').classList.add('hidden');
  $('endOv').classList.add('hidden');
}

export function showEnd(r) {
  S.lastResult = r;
  $('endTitle').innerHTML = r.win ? 'YOU <span>WIN</span>' : 'GAME <span>OVER</span>';
  $('endText').textContent = pick(r.win ? T.winText : T.loseText);
  const s = r.stats, label = DIFFS[r.diffKey].label;
  let line = `${label}: ${s.w}W–${s.l}L · streak ${s.streak} · best ${s.best}`;
  if (r.win) line += ` · this game: ${r.shots} shots`;
  $('endStats').textContent = line;
  $('endOv').classList.remove('hidden');
}
