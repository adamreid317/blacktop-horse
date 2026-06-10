/* All sound is synthesized with WebAudio — no assets to load.
   The context unlocks on first user gesture; mute persists in localStorage. */
let ctx = null, master = null, ambientStarted = false;
let muted = false;
try { muted = localStorage.getItem('bh-muted') === '1'; } catch (e) { /* private mode */ }

export function unlock() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
    } catch (e) { return; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  if (!ambientStarted) { ambientStarted = true; startAmbient(); }
}

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('bh-muted', muted ? '1' : '0'); } catch (e) {}
  if (master) master.gain.value = muted ? 0 : 1;
  return muted;
}

function noiseBuf(dur, shape = 2) {
  const b = ctx.createBuffer(1, Math.max(1, ctx.sampleRate * dur), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, shape);
  return b;
}

/* original net sound */
export function swish() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf(0.25);
  f.type = 'bandpass'; f.frequency.value = 2600;
  g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .25);
  s.connect(f); f.connect(g); g.connect(master); s.start();
}

/* original rim sound, loudness now scales with impact */
export function clank(impact = 300) {
  if (!ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  const amp = Math.min(.3, .12 + impact / 4000);
  o.type = 'square'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(150, t + .09);
  g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + .13);
}

export function board(impact = 300) {
  if (!ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'square'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(85, t + .1);
  g.gain.setValueAtTime(Math.min(.25, .1 + impact / 5000), t);
  g.gain.exponentialRampToValueAtTime(.001, t + .14);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + .15);
}

export function bounce(impact = 400) {
  if (!ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(55, t + .1);
  g.gain.setValueAtTime(Math.min(.32, impact / 2800), t);
  g.gain.exponentialRampToValueAtTime(.001, t + .13);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + .14);
  // skin-on-asphalt slap
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain();
  s.buffer = noiseBuf(0.04, 3); f.type = 'lowpass'; f.frequency.value = 900;
  ng.gain.value = Math.min(.12, impact / 8000);
  s.connect(f); f.connect(ng); ng.connect(master); s.start();
}

export function cheer(big = false) {
  if (!ctx) return;
  const t = ctx.currentTime, dur = big ? 1.5 : 0.9;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf(dur, 1.2);
  f.type = 'bandpass'; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(1400, t + dur * 0.4);
  f.Q.value = 0.8;
  g.gain.setValueAtTime(.001, t);
  g.gain.exponentialRampToValueAtTime(big ? .4 : .22, t + .12);
  g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start();
  // a couple of "wooo" voices
  const n = big ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    const f0 = 380 + Math.random() * 160;
    o.type = 'triangle';
    o.frequency.setValueAtTime(f0, t + i * 0.07);
    o.frequency.linearRampToValueAtTime(f0 * 1.7, t + i * 0.07 + 0.32);
    og.gain.setValueAtTime(.001, t + i * 0.07);
    og.gain.exponentialRampToValueAtTime(.06, t + i * 0.07 + .06);
    og.gain.exponentialRampToValueAtTime(.001, t + i * 0.07 + .5);
    o.connect(og); og.connect(master);
    o.start(t + i * 0.07); o.stop(t + i * 0.07 + .55);
  }
}

export function groan(big = false) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const n = big ? 4 : 2;
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const f0 = 300 + Math.random() * 90;
    o.type = 'triangle';
    o.frequency.setValueAtTime(f0, t + i * 0.05);
    o.frequency.linearRampToValueAtTime(f0 * 0.55, t + i * 0.05 + 0.5);
    g.gain.setValueAtTime(.001, t + i * 0.05);
    g.gain.exponentialRampToValueAtTime(big ? .07 : .045, t + i * 0.05 + .08);
    g.gain.exponentialRampToValueAtTime(.001, t + i * 0.05 + .6);
    o.connect(g); g.connect(master);
    o.start(t + i * 0.05); o.stop(t + i * 0.05 + .65);
  }
}

export function murmur() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf(0.35, 1.5);
  f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 1;
  g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + .35);
  s.connect(f); f.connect(g); g.connect(master); s.start();
}

export function hotwhoosh() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf(0.45, 1);
  f.type = 'highpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(4000, t + .4);
  g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.18, t + .1);
  g.gain.exponentialRampToValueAtTime(.001, t + .45);
  s.connect(f); f.connect(g); g.connect(master); s.start();
}

export function ui() {
  if (!ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.value = 660;
  g.gain.setValueAtTime(.07, t); g.gain.exponentialRampToValueAtTime(.001, t + .06);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + .07);
}

/* very low playground bed: filtered noise + the occasional far-off dribble */
function startAmbient() {
  if (!ctx) return;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  s.buffer = b; s.loop = true;
  f.type = 'lowpass'; f.frequency.value = 280;
  g.gain.value = .014;
  s.connect(f); f.connect(g); g.connect(master); s.start();

  const distant = () => {
    if (ctx.state === 'running') {
      const t = ctx.currentTime, o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(75, t); o.frequency.exponentialRampToValueAtTime(50, t + .1);
      og.gain.setValueAtTime(.025, t); og.gain.exponentialRampToValueAtTime(.001, t + .15);
      o.connect(og); og.connect(master); o.start(t); o.stop(t + .16);
    }
    setTimeout(distant, 6000 + Math.random() * 12000);
  };
  setTimeout(distant, 5000);
}
