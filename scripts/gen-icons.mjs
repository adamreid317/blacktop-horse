/* Generates the PWA icons (basketball on dusk gradient) without any image deps:
   pixels are rasterized by hand and encoded as PNG via zlib. Run: npm run icons */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 255];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const cov = (d, soft = 1.5) => Math.max(0, Math.min(1, d / soft + 0.5)); // signed-distance coverage

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const duskTop = [43, 45, 74], duskMid = [110, 74, 107], duskGlow = [201, 111, 74];
  const asphalt = [29, 30, 37], ball = [232, 118, 45], seam = [25, 26, 33], chalk = [236, 231, 218];

  const floorY = size * 0.74;
  const cx = size / 2, cy = size * 0.5, r = size * 0.33;
  const seamW = Math.max(1.6, size * 0.014);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // background: dusk gradient sky over asphalt
      let c;
      if (y < floorY) {
        const t = y / floorY;
        c = t < 0.62 ? lerp3(duskTop, duskMid, t / 0.62) : lerp3(duskMid, duskGlow, (t - 0.62) / 0.38);
      } else {
        c = asphalt;
      }
      // chalk baseline
      const lineA = 1 - cov(Math.abs(y - floorY) - size * 0.004, 1.2);
      if (lineA > 0) c = lerp3(c, chalk, lineA * 0.45);

      // ball
      const d = Math.hypot(x - cx, y - cy);
      const inBall = 1 - cov(d - r);
      if (inBall > 0) {
        let bc = ball;
        // seams: horizontal line + arc above (matches the in-game ball)
        const dh = Math.abs(y - cy);
        const arcD = Math.abs(Math.hypot(x - cx, y - (cy - r * 1.15)) - r * 1.05);
        const s = Math.max(1 - cov(dh - seamW), 1 - cov(arcD - seamW));
        if (s > 0) bc = lerp3(bc, seam, s * 0.8);
        // outline
        const o = 1 - cov(Math.abs(d - r) - seamW * 0.9);
        if (o > 0) bc = lerp3(bc, seam, o * 0.6);
        c = lerp3(c, bc, inBall);
      }

      const i = (y * size + x) * 4;
      px[i] = Math.round(c[0]);
      px[i + 1] = Math.round(c[1]);
      px[i + 2] = Math.round(c[2]);
      px[i + 3] = 255;
    }
  }
  return encodePNG(size, size, px);
}

writeFileSync(join(OUT, 'icon-192.png'), drawIcon(192));
writeFileSync(join(OUT, 'icon-512.png'), drawIcon(512));
writeFileSync(join(OUT, 'apple-touch-icon.png'), drawIcon(180));
console.log('icons written to', OUT);
