/* Shared mutable game state + a tiny event bus that decouples
   game logic from rendering, audio and FX. */
export const S = {
  state: 'idle',      // idle | pickSpot | aim | flight | resolve | npcwait | over
  control: 'you',     // who is setting shots
  phase: 'set',       // set | copy
  shooter: 'you',     // who is shooting right now
  copySpot: null,
  spotX: 330,
  diffKey: 'pro',
  diff: 1,
  letters: { you: 0, npc: 0 },
  streak: { you: 0, npc: 0 },   // consecutive makes (hot hand at 3)
  hot: { you: false, npc: false },
  ball: null,
  drag: null,         // {sx,sy,cx,cy} in world coords
  shotsTaken: 0,
  playerShots: 0,
  mod: null,          // 'bank' | 'moon' | 'nopreview' | null
  gamePoint: false,   // current flight could end the game
  timeScale: 1,
  lastResult: null,
};

export const bus = {
  m: new Map(),
  on(type, fn) {
    if (!this.m.has(type)) this.m.set(type, []);
    this.m.get(type).push(fn);
  },
  emit(type, payload) {
    const list = this.m.get(type);
    if (list) for (const fn of list) fn(payload);
  },
};

export const other = (p) => (p === 'you' ? 'npc' : 'you');
