/* Share flow: renders a story-sized result card on an offscreen canvas, then
   tries the Web Share API (image + text), falling back to download + clipboard. */
import { DIFFS, HORSE } from './constants.js';
import { C } from './palette.js';

export async function shareResult(r) {
  const label = DIFFS[r.diffKey].label;
  const url = location.origin.startsWith('http') ? location.origin + location.pathname : '';
  const text = r.win
    ? `🏀 I beat Buckets on ${label} in ${r.shots} shots — Blacktop H.O.R.S.E. ${url}`.trim()
    : `🏀 Buckets got me on ${label}. Running it back — Blacktop H.O.R.S.E. ${url}`.trim();

  let blob = null;
  try { blob = await buildCard(r, label); } catch (e) {}

  try {
    if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'x.png', { type: 'image/png' })] })) {
      await navigator.share({ files: [new File([blob], 'blacktop-horse.png', { type: 'image/png' })], text });
      return 'shared';
    }
    if (navigator.share) { await navigator.share({ text }); return 'shared'; }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
  }

  if (blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'blacktop-horse.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) { return 'saved'; }
}

async function buildCard(r, label) {
  try { await document.fonts.ready; } catch (e) {}
  const W2 = 1080, H2 = 1920;
  const cv = document.createElement('canvas');
  cv.width = W2; cv.height = H2;
  const g = cv.getContext('2d');
  const horizon = H2 * 0.74;

  // dusk sky
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, C.duskTop); sky.addColorStop(.62, C.duskMid); sky.addColorStop(1, C.duskGlow);
  g.fillStyle = sky; g.fillRect(0, 0, W2, horizon);
  // sun
  g.fillStyle = 'rgba(255,205,150,.5)';
  g.beginPath(); g.arc(W2 * 0.22, horizon - 8, 90, Math.PI, 0); g.fill();
  // skyline
  g.fillStyle = 'rgba(21,22,28,.55)';
  const bl = [[0, 90, 150], [95, 70, 220], [170, 110, 120], [290, 60, 260], [360, 90, 170], [460, 120, 110], [590, 70, 230], [670, 95, 150], [775, 80, 200], [865, 115, 115], [985, 95, 175]];
  bl.forEach(([x, w, h]) => g.fillRect(x, horizon - h, w, h));
  // fence
  g.strokeStyle = 'rgba(236,231,218,.08)'; g.lineWidth = 2;
  for (let x = 0; x < W2; x += 46) {
    g.beginPath(); g.moveTo(x, horizon - 160); g.lineTo(x + 32, horizon); g.stroke();
    g.beginPath(); g.moveTo(x + 32, horizon - 160); g.lineTo(x, horizon); g.stroke();
  }
  // asphalt
  g.fillStyle = C.asphalt; g.fillRect(0, horizon, W2, H2 - horizon);
  g.strokeStyle = 'rgba(236,231,218,.3)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(0, horizon); g.lineTo(W2, horizon); g.stroke();

  // title
  g.textAlign = 'center';
  g.fillStyle = C.duskGlow; g.font = "700 58px Caveat, cursive";
  g.fillText('five letters and you walk home', W2 / 2, 200);
  g.fillStyle = C.chalk; g.font = "800 110px 'Barlow Condensed', sans-serif";
  g.fillText('BLACKTOP H.O.R.S.E.', W2 / 2, 320);

  // result
  if (r.win) {
    g.fillStyle = C.teal; g.font = "800 170px 'Barlow Condensed', sans-serif";
    g.fillText('BUCKETS', W2 / 2, 640);
    g.fillText('GOT SPELLED', W2 / 2, 800);
    g.fillStyle = C.chalk; g.font = "700 72px Caveat, cursive";
    g.fillText(`${label} · beat him in ${r.shots} shots`, W2 / 2, 920);
  } else {
    g.fillStyle = C.ball; g.font = "800 190px 'Barlow Condensed', sans-serif";
    g.fillText('BUCKETS WINS', W2 / 2, 700);
    g.fillStyle = C.chalk; g.font = "700 72px Caveat, cursive";
    g.fillText(`${label} · he spelled me out`, W2 / 2, 850);
  }

  // letter rows
  const row = (who, n, y, col) => {
    g.fillStyle = C.dim; g.font = "800 40px 'Barlow Condensed', sans-serif";
    g.textAlign = 'left'; g.fillText(who, 150, y - 30);
    for (let i = 0; i < 5; i++) {
      const x = 150 + i * 130;
      g.strokeStyle = i < n ? col : 'rgba(236,231,218,.25)';
      g.lineWidth = 4;
      g.setLineDash(i < n ? [] : [10, 10]);
      g.strokeRect(x, y, 100, 120);
      g.setLineDash([]);
      if (i < n) {
        g.fillStyle = col; g.font = "700 100px Caveat, cursive";
        g.textAlign = 'center';
        g.fillText(HORSE[i], x + 50, y + 92);
        g.textAlign = 'left';
      }
    }
    g.textAlign = 'center';
  };
  row('YOU', r.letters.you, 1080, C.chalk);
  row('BUCKETS', r.letters.npc, 1320, C.teal);

  // hoop + ball doodle on the asphalt
  g.strokeStyle = '#3a3c46'; g.lineWidth = 14;
  g.beginPath(); g.moveTo(W2 - 160, horizon); g.lineTo(W2 - 160, horizon - 300); g.stroke();
  g.fillStyle = 'rgba(236,231,218,.85)'; g.fillRect(W2 - 175, horizon - 420, 12, 150);
  g.strokeStyle = C.ball; g.lineWidth = 8;
  g.beginPath(); g.moveTo(W2 - 255, horizon - 290); g.lineTo(W2 - 175, horizon - 290); g.stroke();
  g.fillStyle = C.ball;
  g.beginPath(); g.arc(W2 - 350, horizon - 60, 36, 0, 7); g.fill();
  g.strokeStyle = 'rgba(21,22,28,.55)'; g.lineWidth = 4;
  g.beginPath(); g.arc(W2 - 350, horizon - 60, 36, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(W2 - 386, horizon - 60); g.lineTo(W2 - 314, horizon - 60); g.stroke();

  // footer
  g.fillStyle = C.chalk; g.font = "700 56px Caveat, cursive";
  g.fillText('can you beat Buckets?', W2 / 2, H2 - 220);
  if (location.host) {
    g.fillStyle = C.dim; g.font = "600 38px 'Barlow Condensed', sans-serif";
    g.fillText(location.host + location.pathname, W2 / 2, H2 - 150);
  }

  return new Promise((res) => cv.toBlob(res, 'image/png'));
}
