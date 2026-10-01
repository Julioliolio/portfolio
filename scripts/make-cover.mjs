/**
 * LocalPal's cover: the clip its print plays on the landing (the hover
 * sheet, packages/lab/src/prints.tsx). One phone, tall in a light card,
 * the screen one continuous take of someone using the app (the `course`
 * master from scripts/record-media.mjs): a venue on the map, its event,
 * who's going together, a search in a sentence, a plan joined, a message
 * in its group chat. No montage, no onboarding. 3:4, rendered at 900×1200.
 *
 *   node scripts/record-media.mjs localpal/course   # the take
 *   node scripts/make-cover.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { kb, loopClip } from "./lib/media.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const MASTER = `${ROOT}source-assets/recordings/localpal-course.mp4`;
const OUT = `${ROOT}apps/web/public/media/localpal/cover.mp4`;

const W = 900, H = 1200;
const GROUND = "#f3f2ef";
// The phone, as Bento.tsx draws it: a bezel 3.2% of its width, outer
// corners 15%, screen corners 12%; the screen 390:844.
const SA = 390 / 844;
const PH = Math.round(H * 0.88);
const PW = Math.round(PH / (0.936 / SA + 0.064));
const PAD = Math.round(PW * 0.032);
// Even sizes for the encoder; the bezel's cut-out covers the pixel.
const SW = (PW - 2 * PAD) & ~1;
const SCR_H = (PH - 2 * PAD) & ~1;
const X = Math.round((W - PW) / 2), Y = Math.round((H - PH) / 2);

// The take, less its last held second; the poster on the search's
// results ("Best matches", each saying why it fits).
const START = 0.1;
const POSTER = 18.4;

function ff(args) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed");
}
function duration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(String(r.stdout).trim());
}

const dir = mkdtempSync(join(tmpdir(), "cover-"));
try {
  const dur = duration(MASTER) - START - 1;

  // The phone's parts as PNGs: shadow, bezel (with the screen cut out).
  const r = (x) => Math.round(x);
  const R = r(PW * 0.15), Ri = r(PW * 0.12);
  const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
      <filter id="c" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect x="${X + 14}" y="${Y + 34}" width="${PW - 28}" height="${PH - 20}" rx="${R}" fill="#2b2722" opacity=".2" filter="url(#b)"/>
    <rect x="${X + 4}" y="${Y + 6}" width="${PW - 8}" height="${PH - 2}" rx="${R}" fill="#2b2722" opacity=".14" filter="url(#c)"/></svg>`);
  const bezel = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <path fill-rule="evenodd" fill="#16130f" d="
      M${X + R},${Y} h${PW - 2 * R} a${R},${R} 0 0 1 ${R},${R} v${PH - 2 * R} a${R},${R} 0 0 1 -${R},${R} h-${PW - 2 * R} a${R},${R} 0 0 1 -${R},-${R} v-${PH - 2 * R} a${R},${R} 0 0 1 ${R},-${R} z
      M${X + PAD + Ri},${Y + PAD} h${SW - 2 * Ri} a${Ri},${Ri} 0 0 1 ${Ri},${Ri} v${SCR_H - 2 * Ri} a${Ri},${Ri} 0 0 1 -${Ri},${Ri} h-${SW - 2 * Ri} a${Ri},${Ri} 0 0 1 -${Ri},-${Ri} v-${SCR_H - 2 * Ri} a${Ri},${Ri} 0 0 1 ${Ri},-${Ri} z"/></svg>`);
  // The screen's own rounded mask: its square corners would otherwise
  // poke out past the bezel's rounder outer corners.
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SCR_H}">
    <rect width="${SW}" height="${SCR_H}" fill="#000"/>
    <rect width="${SW}" height="${SCR_H}" rx="${Ri}" fill="#fff"/></svg>`);
  const shadowPng = join(dir, "shadow.png");
  const bezelPng = join(dir, "bezel.png");
  const maskPng = join(dir, "mask.png");
  await sharp(shadow).png().toFile(shadowPng);
  await sharp(bezel).png().toFile(bezelPng);
  await sharp(mask).grayscale().png().toFile(maskPng);

  // Ground, shadow, the screen (rounded), the bezel on top.
  const comp = join(dir, "comp.mp4");
  ff([
    "-f", "lavfi", "-i", `color=c=${GROUND}:s=${W}x${H}:r=30:d=${dur.toFixed(3)}`,
    "-i", shadowPng,
    "-ss", String(START), "-t", dur.toFixed(3), "-i", MASTER,
    "-i", bezelPng,
    "-loop", "1", "-i", maskPng,
    "-filter_complex",
    `[2:v]scale=${SW}:${SCR_H}:flags=lanczos:in_color_matrix=bt709:in_range=tv:out_color_matrix=bt709:out_range=tv,fps=30,setsar=1,format=yuva444p[raw];` +
      `[4:v]format=gray,scale=${SW}:${SCR_H}[m];[raw][m]alphamerge[s];` +
      `[0:v][1:v]overlay=0:0[a];[a][s]overlay=${X + PAD}:${Y + PAD}:shortest=1[b];[b][3:v]overlay=0:0,format=yuv420p[v]`,
    "-map", "[v]", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    comp,
  ]);

  // A loop, folded at the seam (the chat dissolves back to the map).
  await loopClip({ src: comp, start: 0, dur, fade: 0.6, width: W, posterAt: POSTER, out: OUT });
  console.log(`${kb(OUT)} KB  cover.mp4  (${dur.toFixed(1)} s, ${W}×${H})`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
