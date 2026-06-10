/* Canvas colors resolved from the CSS custom properties, so the dusk
   blacktop palette has a single source of truth in styles.css. */
export const C = {};

export function initPalette() {
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  Object.assign(C, {
    chalk: css('--chalk'),
    dim: css('--chalk-dim'),
    ball: css('--ball'),
    teal: css('--teal'),
    duskTop: css('--dusk-top'),
    duskMid: css('--dusk-mid'),
    duskGlow: css('--dusk-glow'),
    asphalt: css('--asphalt'),
  });
}
