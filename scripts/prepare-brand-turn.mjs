/**
 * Prepares the brand plate's other faces and its turn — "Back" while a
 * project is open, "About me" under the pointer, and the photos the
 * plate cuts through as it flips from one to the other
 * (packages/lab/src/pieces/brand-sign). The plate itself, and its lit
 * photo, are scripts/prepare-brand.mjs's.
 *
 * Input, in source-assets/brand (.png or .webp, any size; cut out, or
 * on white, which is then flooded away from the canvas's edges):
 *   back, back-lit, about-lit — the faces front on, at rest and
 *         switched on ("About me" is only ever seen lit);
 *   turn/julio, turn/back, turn/about — each face from below, the
 *         angle it leaves and comes round on;
 *   turn/rear-a, turn/rear-b — the box's rear, at an angle and
 *         straight on.
 * Output, in apps/web/public/brand:
 *   back.webp, back-lit.webp, about.webp — trimmed and stretched to
 *         front.webp's exact size, as lit.webp is;
 *   turn/<name>.webp — trimmed, brought to one width and stood on the
 *         foot of one canvas, 400 tall, so they stay in register.
 * A photo that is not there is skipped, and said.
 *
 * Prints the turn's box's aspect (w / h) — paste it into TURN_ASPECT in
 * packages/lab/src/brand.tsx.
 *
 * Usage: node scripts/prepare-brand-turn.mjs
 * Sources are not committed (source-assets is gitignored); the output is.
 */
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inDir = join(root, "source-assets/brand");
const outDir = join(root, "apps/web/public/brand");

/** Source stem to output name. */
const FLAT = { back: "back", "back-lit": "back-lit", "about-lit": "about" };
const TURN = ["julio", "back", "about", "rear-a", "rear-b"];

/** A pixel this light on every channel, reached from the edge, is the
 *  backdrop. The box's metal is darker than this all the way round. */
const WHITE = 238;
/** The cut is pulled in by this much, px of the source, so no white
 *  rim is left on the metal. */
const RIM = 1.2;
const HEIGHT = 400;

const kb = (path) => `${(statSync(path).size / 1024).toFixed(0)}KB`;

function find(stem) {
  for (const ext of ["png", "webp"]) {
    const path = join(inDir, `${stem}.${ext}`);
    if (existsSync(path)) return path;
  }
  console.log(`(no source-assets/brand/${stem}, skipped)`);
  return null;
}

/** A backdrop's alpha: 0 over the white, flooded in from the edges. */
function flood(data, width, height) {
  const light = (i) =>
    data[i * 4] >= WHITE &&
    data[i * 4 + 1] >= WHITE &&
    data[i * 4 + 2] >= WHITE;
  const alpha = Buffer.alloc(width * height, 255);
  const stack = [];
  const visit = (i) => {
    if (alpha[i] === 255 && light(i)) {
      alpha[i] = 0;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    if (x > 0) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i < width * (height - 1)) visit(i + width);
  }
  return alpha;
}

/** The photo as RGBA, cut out: as it came if it came cut out, else
 *  with its white flooded away. */
async function cutOut(path) {
  const { hasAlpha } = await sharp(path).metadata();
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  if (!hasAlpha) {
    // Blurred, then the threshold raised: the edge moves in by about
    // RIM and comes out soft.
    const alpha = await sharp(flood(data, width, height), {
      raw: { width, height, channels: 1 },
    })
      .blur(RIM)
      .linear(2, -255)
      .toColourspace("b-w")
      .raw()
      .toBuffer();
    for (let i = 0; i < width * height; i++) data[i * 4 + 3] = alpha[i];
  }
  let box = { l: width, t: height, r: 0, b: 0 };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] > 8)
        box = {
          l: Math.min(box.l, x),
          t: Math.min(box.t, y),
          r: Math.max(box.r, x + 1),
          b: Math.max(box.b, y + 1),
        };
  return { data, width, height, box };
}

const crop = ({ data, width, height }, box) =>
  sharp(data, { raw: { width, height, channels: 4 } }).extract({
    left: box.l,
    top: box.t,
    width: box.r - box.l,
    height: box.b - box.t,
  });

mkdirSync(join(outDir, "turn"), { recursive: true });

// The faces, front on: the plate's own size.
const plate = await sharp(join(outDir, "front.webp")).metadata();
for (const [stem, name] of Object.entries(FLAT)) {
  const path = find(stem);
  if (!path) continue;
  const cut = await cutOut(path);
  const outPath = join(outDir, `${name}.webp`);
  const info = await crop(cut, cut.box)
    .resize({ width: plate.width, height: plate.height, fit: "fill" })
    .webp({ quality: 80 })
    .toFile(outPath);
  console.log(
    `brand/${name}.webp  ${info.width}x${info.height}  ${kb(outPath)}`,
  );
}

// The turn: the photos come on canvases of their own (some trimmed,
// some not), so each is trimmed, brought to one width — the box is as
// wide in all of them, within a hair — and stood on the foot of one
// canvas as tall as the tallest, where they sat as they were shot.
const cuts = [];
for (const name of TURN) {
  const path = find(`turn/${name}`);
  if (path) cuts.push({ name, ...(await cutOut(path)) });
}
const tall = Math.max(
  ...cuts.map(({ box }) => (box.b - box.t) / (box.r - box.l)),
);
const width = Math.round(HEIGHT / tall);
for (const cut of cuts) {
  const outPath = join(outDir, "turn", `${cut.name}.webp`);
  const photo = await crop(cut, cut.box).resize({ width }).png().toBuffer();
  const { height } = await sharp(photo).metadata();
  const info = await sharp({
    create: {
      width,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: photo, left: 0, top: Math.max(0, HEIGHT - height) }])
    .webp({ quality: 80 })
    .toFile(outPath);
  console.log(
    `brand/turn/${cut.name}.webp  ${info.width}x${info.height}  ${kb(outPath)}`,
  );
}
if (cuts.length) console.log(`aspect ${(width / HEIGHT).toFixed(3)}`);
