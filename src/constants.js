/* Court geometry & physics tuning — these values define the game's feel.
   They are carried over verbatim from the original horse.html. Don't retune. */
export const W = 900, H = 520, FLOOR = 458;
export const RIM = { x1: 758, x2: 804, y: 228 };
export const BOARD = { x: 808, y1: 138, y2: 250 };
export const POLE = { x: 836 };
export const BALL_R = 11, G = 1500;
export const SPOTS = [140, 235, 330, 425, 520, 618];
export const HORSE = ['H', 'O', 'R', 'S', 'E'];

export const RIM_CX = (RIM.x1 + RIM.x2) / 2;

/* moon ball: the ball's apex must clear this line for the shot to count */
export const MOON_Y = RIM.y - 110;

export const DIFFS = {
  rookie: { d: 0.85, label: 'Rookie', modChance: 0.10 },
  pro:    { d: 1.00, label: 'Pro', modChance: 0.25 },
  hof:    { d: 1.15, label: 'Hall of Fame', modChance: 0.45 },
};

export const MODS = {
  bank:      { label: 'Bank Shot', desc: 'glass first or it doesn\'t count' },
  moon:      { label: 'Moon Ball', desc: 'clear the high line' },
  nopreview: { label: 'No Preview', desc: 'no aim dots, pure feel' },
};
