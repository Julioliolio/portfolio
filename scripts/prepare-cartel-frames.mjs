/**
 * Prepares the "cartel" street-sign frames for the web app.
 *
 * Input: a directory with two subdirs of source PNGs (transparent,
 * arbitrary sizes), one per sign face:
 *   julio/ — the full angle grid + spin exposures (Julio Romero text)
 *   about/ — the "About me" face: front + return (the ~325° returning
 *            angle shown while a transition spin lands)
 * Output: apps/web/public/cartel/{julio,about}/<name>.webp — each frame
 * trimmed to its alpha bounding box, scaled to a common height, and
 * centered on ONE shared transparent canvas across both faces, so the
 * stacked <img>s line up whichever face is showing. Frames are
 * intentionally NOT feature-registered: the slight frame-to-frame wobble
 * is part of the stop-motion feel.
 *
 * Also emits julio/front-blur.webp, a tiny blurred poster shown while the
 * frames decode.
 *
 * Usage: node scripts/prepare-cartel-frames.mjs <input-dir>
 *   e.g. node scripts/prepare-cartel-frames.mjs ~/portfolio-assets/cartel
 *
 * Sources are not committed (originals live in ~/portfolio-assets/cartel);
 * outputs are. Frames are served with default public/ caching (ETag). If
 * frames are regenerated after the sign graduates to the homepage hero,
 * move to a versioned dir (/cartel/v2/) before adding immutable headers.
 */
import { mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const JULIO_FRAMES = [
  "front",
  "left",
  "right",
  "up",
  "down",
  "left-up",
  "left-down",
  "right-up",
  "right-down",
  // Half-step in-betweens ("h" = half). {col}-h{row} = half-row on a full
  // column; h{col}-{row} = half-column on a full row. The grid is irregular:
  // top and bottom rows and outer columns have 5 stops, the eye-level row
  // and center column have 3.
  "left-hup",
  "left-hdown",
  "right-hup",
  "right-hdown",
  "hleft-up",
  "hleft-down",
  "hright-up",
  "hright-down",
  // Spin-only exposures for the 360 flourish (see the cartel piece's
  // SPIN_KEYS). Not grid cells — the walker must never route through them.
  "spin-a", // back of sign, ~160 deg of the spin
  "spin-b", // near edge-on from behind, ~255 deg
  "spin-c", // face returning, ~310 deg
];

// The About me face only needs the poses a transition spin can land
// through: the sign holds front (with the idle bob) while hovered, so
// there is no About angle grid. The back/edge spin frames are shared with
// the julio set — the text isn't visible there.
const ABOUT_FRAMES = [
  "front", // resting pose while hovered
  "return", // face returning, ~325 deg — covers the spin-c and left stops
];

const FACES = [
  { dir: "julio", frames: JULIO_FRAMES },
  { dir: "about", frames: ABOUT_FRAMES },
];

const TARGET_HEIGHT = 1600; // canvas height; retina-ready for ~600-800px display
const WEBP_QUALITY = 80;

// Per-frame size correction (sqrt of target/measured alpha area). The raw
// photos, height-normalized, differ in apparent sign size by up to 12%
// between walk neighbors, which reads as a size pulse at 12fps. Targets
// smooth the area progression around the ring (center spokes 1412k px,
// h-corners 1295k, column-halves 1247k, full turns symmetric at 1200k).
// Frames are scaled to BASE_HEIGHT x tweak, all fitting inside the canvas.
// About frames keep 1.0: about/front is the same photo as julio/front with
// the text swapped, and about/return only ever shows for a spin tick or
// two between spin-c and the landing.
const SIZE_TWEAK = {
  "julio/front": 1.0,
  "julio/left": 0.9752,
  "julio/right": 1.0323,
  "julio/up": 1.0,
  "julio/down": 1.0,
  "julio/left-up": 1.0,
  "julio/left-down": 1.0,
  "julio/right-up": 1.0,
  "julio/right-down": 1.0,
  "julio/left-hup": 1.0418,
  "julio/left-hdown": 0.9952,
  "julio/right-hup": 1.0328,
  "julio/right-hdown": 1.0509,
  "julio/hleft-up": 0.9935,
  "julio/hleft-down": 1.0,
  "julio/hright-up": 1.0051,
  "julio/hright-down": 1.0015,
  "julio/spin-a": 1.0,
  "julio/spin-b": 1.0,
  "julio/spin-c": 1.0,
  "about/front": 1.0,
  "about/return": 1.0,
};
const MAX_TWEAK = Math.max(...Object.values(SIZE_TWEAK));
const BASE_HEIGHT = TARGET_HEIGHT / MAX_TWEAK;

const inputDir = process.argv[2];
if (!inputDir) {
  console.error("Usage: node scripts/prepare-cartel-frames.mjs <input-dir>");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "apps/web/public/cartel");
for (const { dir } of FACES) {
  mkdirSync(join(outDir, dir), { recursive: true });
}

// Pass 1: trim each frame to its alpha bounding box and scale to its
// size-corrected height. Widths come out different per frame — that wobble
// is kept.
const scaled = await Promise.all(
  FACES.flatMap(({ dir, frames }) =>
    frames.map(async (name) => {
      const id = `${dir}/${name}`;
      const height = Math.round(BASE_HEIGHT * (SIZE_TWEAK[id] ?? 1));
      const buf = await sharp(join(inputDir, dir, `${name}.png`))
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize({ height })
        .png()
        .toBuffer();
      const { width } = await sharp(buf).metadata();
      return { id, buf, width };
    }),
  ),
);

// Pass 2: center every frame on one shared canvas sized to the widest frame
// (across BOTH faces), so the stacked <img>s in the component line up
// without layout math.
const canvasWidth = Math.ceil(Math.max(...scaled.map((f) => f.width)) * 1.02);

let total = 0;
for (const { id, buf } of scaled) {
  const outPath = join(outDir, `${id}.webp`);
  await sharp({
    create: {
      width: canvasWidth,
      height: TARGET_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: buf, gravity: "centre" }])
    .webp({ quality: WEBP_QUALITY })
    .toFile(outPath);
  const size = statSync(outPath).size;
  total += size;
  console.log(`${id}.webp  ${(size / 1024).toFixed(0)}KB`);
}

await sharp(join(outDir, "julio/front.webp"))
  .resize({ height: 32 })
  .blur(2)
  .webp({ quality: 50 })
  .toFile(join(outDir, "julio/front-blur.webp"));

console.log(`\ncanvas: ${canvasWidth}x${TARGET_HEIGHT}`);
console.log(`  -> FRAME_ASPECT = "${canvasWidth} / ${TARGET_HEIGHT}"`);
console.log(
  `total: ${(total / 1024 / 1024).toFixed(2)}MB for ${scaled.length} frames`,
);
