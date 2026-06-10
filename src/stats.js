/* Per-difficulty win/loss/streak tracking. Local-only for v1, but everything
   goes through this async store interface so a real backend leaderboard can
   replace LocalStatsStore without touching game code. */
const KEY = 'blacktop-horse-stats-v1';
const blank = () => ({ w: 0, l: 0, streak: 0, best: 0, fewest: null });

class LocalStatsStore {
  constructor() { this.data = null; }

  async load() {
    if (!this.data) {
      let raw = {};
      try { raw = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
      this.data = {};
      for (const k of ['rookie', 'pro', 'hof']) this.data[k] = { ...blank(), ...(raw[k] || {}) };
    }
    return this.data;
  }

  /* returns the updated record for that difficulty */
  async recordGame({ diffKey, won, shots }) {
    const d = await this.load();
    const s = d[diffKey];
    if (won) {
      s.w++; s.streak++;
      s.best = Math.max(s.best, s.streak);
      if (s.fewest == null || shots < s.fewest) s.fewest = shots;
    } else {
      s.l++; s.streak = 0;
    }
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    return s;
  }
}

export const stats = new LocalStatsStore();
