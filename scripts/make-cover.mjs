/**
 * LocalPal's cover: the clip its print plays on the landing (the hover
 * sheet, packages/lab/src/prints.tsx) — the site's drawn phone on the
 * LocalPal blue, the screen a short montage of the prototype from the
 * recording masters (scripts/record-media.mjs): interests picked and
 * stickers landing, a search in a sentence, a venue's plans, the slide
 * to RSVP. The print is a tall one, 720:826; rendered at 800×918.
 *
 *   node scripts/make-cover.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { kb, loopClip } from "./lib/media.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const MASTERS = `${ROOT}source-assets/recordings/`;
const OUT = `${ROOT}apps/web/public/media/localpal/cover.mp4`;

const W = 800, H = 918;
const BLUE = "#3121FF";
// The phone, as Bento.tsx draws it: a bezel 3.2% of its width, outer
// corners 15%, screen corners 12%; the screen 600:1298.
const SA = 600 / 1298;
const PH = Math.round(H * 0.86);
const PW = Math.round(PH / (0.936 / SA + 0.064));
const PAD = Math.round(PW * 0.032);
// Even sizes for the encoder; the bezel's cut-out covers the pixel.
const SW = (PW - 2 * PAD) & ~1;
const SCR_H = (PH - 2 * PAD) & ~1;
const X = Math.round((W - PW) / 2), Y = Math.round((H - PH) / 2);

// [master, start, seconds]
const BEATS = [
  ["onboarding-interests", 0.8, 5.0],
  ["search", 3.2, 4.6],
  ["venue", 3.6, 3.6],
  ["dayof", 0.6, 3.4],
];
const XF = 0.35;

function ff(args) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed");
}

const dir = mkdtempSync(join(tmpdir(), "cover-"));
try {
  // The screen: the beats back to back, dissolving into each other.
  let chain = "";
  let last = "[v0]";
  let at = BEATS[0][2];
  const inputs = BEATS.flatMap(([n, s, d]) => ["-ss", String(s), "-t", String(d), "-i", `${MASTERS}localpal-${n}.mp4`]);
  BEATS.forEach((_, i) => {
    chain += `[${i}:v]scale=${SW}:${SCR_H}:flags=lanczos:in_color_matrix=bt709:in_range=tv:out_color_matrix=bt709:out_range=tv,fps=30,setsar=1[v${i}];`;
  });
  for (let i = 1; i < BEATS.length; i++) {
    const out = `[x${i}]`;
    chain += `${last}[v${i}]xfade=transition=fade:duration=${XF}:offset=${(at - XF).toFixed(3)}${out};`;
    at += BEATS[i][2] - XF;
    last = out;
  }
  const screen = join(dir, "screen.mp4");
  ff([...inputs, "-filter_complex", chain.slice(0, -1).replace(new RegExp(`\\${last}$`), "[s]"), "-map", "[s]", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", screen]);

  // The phone's parts as PNGs: shadow, bezel (with the screen cut out),
  // and the screen's rounded mask.
  const r = (x) => Math.round(x);
  const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><filter id="b"><feGaussianBlur stdDeviation="18"/></filter></defs>
    <rect x="${X + 8}" y="${Y + 26}" width="${PW - 16}" height="${PH - 10}" rx="${r(PW * 0.15)}" fill="#0d0a40" opacity=".45" filter="url(#b)"/></svg>`);
  const bezel = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <path fill-rule="evenodd" fill="#16130f" d="
      M${X + r(PW * 0.15)},${Y} h${PW - 2 * r(PW * 0.15)} a${r(PW * 0.15)},${r(PW * 0.15)} 0 0 1 ${r(PW * 0.15)},${r(PW * 0.15)} v${PH - 2 * r(PW * 0.15)} a${r(PW * 0.15)},${r(PW * 0.15)} 0 0 1 -${r(PW * 0.15)},${r(PW * 0.15)} h-${PW - 2 * r(PW * 0.15)} a${r(PW * 0.15)},${r(PW * 0.15)} 0 0 1 -${r(PW * 0.15)},-${r(PW * 0.15)} v-${PH - 2 * r(PW * 0.15)} a${r(PW * 0.15)},${r(PW * 0.15)} 0 0 1 ${r(PW * 0.15)},-${r(PW * 0.15)} z
      M${X + PAD + r(PW * 0.12)},${Y + PAD} h${SW - 2 * r(PW * 0.12)} a${r(PW * 0.12)},${r(PW * 0.12)} 0 0 1 ${r(PW * 0.12)},${r(PW * 0.12)} v${SCR_H - 2 * r(PW * 0.12)} a${r(PW * 0.12)},${r(PW * 0.12)} 0 0 1 -${r(PW * 0.12)},${r(PW * 0.12)} h-${SW - 2 * r(PW * 0.12)} a${r(PW * 0.12)},${r(PW * 0.12)} 0 0 1 -${r(PW * 0.12)},-${r(PW * 0.12)} v-${SCR_H - 2 * r(PW * 0.12)} a${r(PW * 0.12)},${r(PW * 0.12)} 0 0 1 ${r(PW * 0.12)},-${r(PW * 0.12)} z"/></svg>`);
  const shadowPng = join(dir, "shadow.png");
  const bezelPng = join(dir, "bezel.png");
  await sharp(shadow).png().toFile(shadowPng);
  await sharp(bezel).png().toFile(bezelPng);

  // Blue ground, shadow, the screen, the bezel on top (it hides the
  // screen's square corners under its rounded cut-out).
  const comp = join(dir, "comp.mp4");
  ff([
    "-f", "lavfi", "-i", `color=c=${BLUE}:s=${W}x${H}:r=30:d=${at.toFixed(3)}`,
    "-i", shadowPng, "-i", screen, "-i", bezelPng,
    "-filter_complex",
    `[0:v][1:v]overlay=0:0[a];[a][2:v]overlay=${X + PAD}:${Y + PAD}:shortest=1[b];[b][3:v]overlay=0:0,format=yuv420p[v]`,
    "-map", "[v]", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    comp,
  ]);

  // A loop, folded at the seam, and its poster on the stickers landing.
  await loopClip({ src: comp, start: 0, dur: at, fade: 0.5, width: W, posterAt: 3.4, out: OUT });
  console.log(`${kb(OUT)} KB  cover.mp4  (${at.toFixed(1)} s, ${W}×${H})`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
