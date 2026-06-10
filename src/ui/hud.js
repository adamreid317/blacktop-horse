/* DOM HUD: letter slots, chalk-talk message line, hint line, trick shot
   chips, hot-hand flags and the mute toggle. */
import { S, bus } from '../state.js';
import { HORSE } from '../constants.js';
import * as aud from '../audio.js';

const $ = (id) => document.getElementById(id);
let msgEl, hintEl, modsEl, lastKey = '';

export function init() {
  msgEl = $('msg'); hintEl = $('hint'); modsEl = $('mods');
  buildLetters();
  paintLetters();

  modsEl.querySelectorAll('.chip').forEach((ch) => {
    ch.addEventListener('click', () => {
      if (!modsEl.classList.contains('show')) return;
      aud.unlock(); aud.ui();
      bus.emit('callmod', ch.dataset.mod || null);
    });
  });

  const mb = $('muteBtn');
  const paintMute = (m) => {
    mb.textContent = m ? '🔇' : '🔊';
    mb.classList.toggle('muted', m);
  };
  paintMute(aud.isMuted());
  mb.addEventListener('click', () => { aud.unlock(); paintMute(aud.toggleMute()); });
}

export function say(text, tag) {
  msgEl.innerHTML = (tag ? `<span class="tag">${tag}</span>` : '') + text;
  msgEl.style.opacity = 1;
}

export function hint(t) { hintEl.textContent = t || ' '; }

function buildLetters() {
  for (const id of ['lettersYou', 'lettersNpc']) {
    const el = $(id);
    el.innerHTML = '';
    HORSE.forEach((l) => {
      const s = document.createElement('div');
      s.className = 'slot';
      s.textContent = l;
      el.appendChild(s);
    });
  }
}

export function paintLetters() {
  [['lettersYou', S.letters.you], ['lettersNpc', S.letters.npc]].forEach(([id, n]) => {
    [...$(id).children].forEach((s, i) => s.classList.toggle('earned', i < n));
  });
}

export function refresh() {
  const show = S.shooter === 'you' && S.phase === 'set' && (S.state === 'pickSpot' || S.state === 'aim');
  modsEl.classList.toggle('show', show);
  modsEl.querySelectorAll('.chip').forEach((ch) => {
    ch.classList.toggle('sel', (ch.dataset.mod || null) === (S.mod || null));
  });
  $('hotYou').classList.toggle('hidden', !S.hot.you);
  $('hotNpc').classList.toggle('hidden', !S.hot.npc);
}

/* cheap per-frame check so the chips track state without manual calls everywhere */
export function tick() {
  const k = `${S.state}|${S.phase}|${S.shooter}|${S.mod}|${S.hot.you}|${S.hot.npc}`;
  if (k !== lastKey) { lastKey = k; refresh(); }
}
