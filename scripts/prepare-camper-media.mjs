/**
 * Camper's page media, cut from the film's 1080p master
 * (docs/media-plan.md): the cast as short loops, one per person; the
 * still and the shot for "board → still → shot", on a moment the shot
 * visibly moves (a hand reaching down to press the velcro shut); and a keeper still for the
 * choosing, of someone the cast grid doesn't show.
 * Times are the film's, between its cuts (scene changes at 4.7, 7.6,
 * 10.5, 15.0, 18.9, 23.1, 27.4, 30.2, 33.1, 35.9, 38.8, 41.6, 46.9, 50.7,
 * 54.6 s); crops are in the master's pixels.
 *
 *   node scripts/prepare-camper-media.mjs [path/to/master.mp4]
 *
 * The master is not in the repo; it defaults to where Julio keeps it.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { frameAt, kb, loopClip, still } from "./lib/media.mjs";

const SRC =
  process.argv[2] ??
  join(homedir(), "Downloads/_organized/2894_/Campers/video campers.mp4");
const OUT = new URL("../apps/web/public/media/camper/", import.meta.url).pathname;

// One person each, in the film's order: [name, start, seconds], every
// window a few frames inside its shot, so a loop never reaches the cut
// (the fold would dissolve the next shot into it).
const CAST = [
  ["reader", 23.35, 3.6],
  ["beach", 47.1, 3.35],
  ["step", 50.9, 3.5],
]


const made = [];
for (const [name, start, dur] of CAST)
  made.push(await loopClip({ src: SRC, start, dur, width: 768, out: `${OUT}cast-${name}.mp4` }));
made.push(await loopClip({ src: SRC, start: 0.3, dur: 3.6, fade: 0.4, width: 1280, posterAt: 2.6, out: `${OUT}shot-velcro.mp4` }));
made.push(await still({ src: SRC, at: 0.4, width: 1280, out: `${OUT}still-velcro.webp` }));
made.push(await still({ src: SRC, at: 28.6, width: 1280, out: `${OUT}still-ledge.webp` }));

// Every shot of the cut, in order, one frame from the middle of each:
// the three rules (shin height, no faces, one light and grain) checkable
// at a glance. On transparency, so it sits on the page's paper.
const CUTS = [0, 4.7, 7.574, 10.477, 14.982, 18.919, 23.123, 27.361, 30.23, 33.066, 35.936, 38.772, 41.575, 46.88, 50.684, 54.621, 58.792];
const FW = 480, FH = 270, GAP = 14, COLS = 4;
const frames = await Promise.all(
  CUTS.slice(0, -1).map(async (t, i) => ({
    input: await frameAt({ src: SRC, at: ((t + CUTS[i + 1]) / 2).toFixed(2), width: FW }).png().toBuffer(),
    left: (i % COLS) * (FW + GAP),
    top: Math.floor(i / COLS) * (FH + GAP),
  })),
);
const rows = Math.ceil(frames.length / COLS);
await sharp({ create: { width: COLS * FW + (COLS - 1) * GAP, height: rows * FH + (rows - 1) * GAP, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(frames)
  .webp({ quality: 84, alphaQuality: 100 })
  .toFile(`${OUT}every-shot.webp`);
made.push(`${OUT}every-shot.webp`);

for (const p of made) console.log(`${kb(p).toString().padStart(5)} KB  ${p.slice(OUT.length)}`);
