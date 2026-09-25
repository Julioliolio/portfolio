/**
 * Prepares the cutting mat and the paper scans for the web app.
 *
 * Input (gitignored, see .gitignore):
 *   source-assets/mat/*.png|jpg   — one photo of the green cutting mat,
 *     portrait, the grid straight; the first file found is used
 *   source-assets/paper/          — flatbed scans of white paper
 *     papertexture3.png  → plain     (the sheet, and the prints' tile)
 *     papertexture1.png  → crease-1  (a fold on the right)
 *     papertexture2.png  → crease-2  (a crease line on the left)
 *
 * Output (committed):
 *   apps/web/public/mat/mat-{1600,2400,3200}.webp
 *     The mat at three widths, for the page background (globals.css picks
 *     one by viewport width). Cropped top and bottom to the mat's own
 *     major grid lines, a whole number of five-cell periods apart, so the
 *     file tiles seamlessly downward (background-repeat: repeat-y) — the
 *     seam falls in the middle of a line. The photo's vertical light
 *     fall-off is flattened first so the seam has no brightness step.
 *   apps/web/public/paper/{plain,crease-1,crease-2}.webp
 *     The sheets, 1800px wide: a 600 dpi A4 scan at this size shows its
 *     fibres at about print scale on a laptop. Scanner edges trimmed, and
 *     the levels lifted so the paper's mean lands near PAPER_MEAN with the
 *     grain (the scan's spread) kept — the case-study template's greys
 *     need a sheet lighter than the raw scan.
 *   apps/web/public/paper/tile.webp
 *     A 1024px seamless tile of the plain paper at the same scale, for the
 *     prints' frames and the printed-media overlay (mirror-tiled from a
 *     512px cut, so the seams are invisible in low-contrast mottle).
 *
 * Rerun after dropping or replacing a source file:
 *   node scripts/prepare-paper.mjs
 */
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_MAT = join(ROOT, "source-assets", "mat");
const SRC_PAPER = join(ROOT, "source-assets", "paper");
const OUT_MAT = join(ROOT, "apps", "web", "public", "mat");
const OUT_PAPER = join(ROOT, "apps", "web", "public", "paper");

const MAT_WIDTHS = [1600, 2400, 3200];
const MAT_WEBP = { quality: 70, effort: 6 };
const PAPER_WIDTH = 1800;
const PAPER_WEBP = { quality: 72, effort: 6 };
/** Where the sheets' mean luminance is put (0–255). */
const PAPER_MEAN = 246;
/** The grain's gain: the downscale to PAPER_WIDTH averages the scan's
 *  spread away, this puts some of it back. */
const PAPER_GRAIN = 1.4;
/** Share of each scan edge trimmed away: the scanner's lid and glass. */
const PAPER_TRIM = 0.015;
/** Which scan is which sheet. */
const PAPERS = {
  plain: "papertexture3.png",
  "crease-1": "papertexture1.png",
  "crease-2": "papertexture2.png",
};

const kb = (path) => `${Math.round(statSync(path).size / 1024)} KB`;

// ------------------------------------------------------------------ mat

/**
 * The lines in a brightness profile: local maxima that stand above the
 * median by a share of the profile's whole rise (the mat's cells between
 * the lines are noisy, so a fixed step would catch them), with any two
 * closer than `apart` merged into the stronger.
 */
function peaks(profile, share, apart) {
  const sorted = [...profile].sort((a, b) => a - b);
  const median = sorted[sorted.length >> 1];
  const top = sorted[Math.floor(sorted.length * 0.995)];
  const floor = median + (top - median) * share;
  const out = [];
  for (let i = 1; i < profile.length - 1; i++) {
    const v = profile[i];
    if (v <= floor || v < profile[i - 1] || v < profile[i + 1]) continue;
    const prev = out[out.length - 1];
    if (prev && i - prev.at < apart) {
      if (v - median > prev.strength) out[out.length - 1] = { at: i, strength: v - median };
      continue;
    }
    out.push({ at: i, strength: v - median });
  }
  return out;
}

/** The median of a list of numbers. */
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[s.length >> 1];
};

/**
 * Finds the mat's horizontal grid: the row of every line, the cell
 * pitch, and the rows of the major lines (every fifth, drawn heavier),
 * all in the profile's own scale.
 */
function findGrid(rows) {
  // A first pass finds the pitch from the strong lines alone; the second
  // takes every line, no two closer than half a cell.
  const strong = peaks(rows, 0.35, 4);
  const rough = median(strong.slice(1).map((l, i) => l.at - strong[i].at));
  const lines = peaks(rows, 0.12, rough * 0.5);
  const diffs = lines.slice(1).map((l, i) => l.at - lines[i].at);
  const pitch = median(diffs.filter((d) => d > rough * 0.7 && d < rough * 1.3));
  // The major lines are every fifth: of the five phases the lines can
  // sit on, the one whose lines are the strongest in total is theirs
  // (each major is only a third or so stronger than a minor, so no
  // single line tells on its own).
  const period = pitch * 5;
  const phaseOf = (at) => Math.round((at % period) / pitch) % 5;
  const votes = [0, 0, 0, 0, 0];
  for (const l of lines) votes[phaseOf(l.at)] += l.strength;
  const best = votes.indexOf(Math.max(...votes));
  const majors = lines.filter((l) => phaseOf(l.at) === best).map((l) => l.at);
  if (process.env.DEBUG) console.log({ pitch, lines: lines.length, votes: votes.map((v) => v.toFixed(0)), majors });
  return { pitch, period, majors };
}

async function prepareMat() {
  if (!existsSync(SRC_MAT)) {
    console.warn(`mat: no ${SRC_MAT}, skipping`);
    return;
  }
  const file = readdirSync(SRC_MAT).find((f) => /\.(png|jpe?g|tiff?)$/i.test(f));
  if (!file) {
    console.warn("mat: no photo in source-assets/mat, skipping");
    return;
  }
  const src = join(SRC_MAT, file);
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;

  // The grid, off a half-scale greyscale copy.
  const scale = 0.5;
  const { data, info } = await sharp(src)
    .resize({ width: Math.round(W * scale) })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = new Float64Array(info.height);
  for (let y = 0; y < info.height; y++) {
    let s = 0;
    for (let x = 0; x < info.width; x++) s += data[y * info.width + x];
    rows[y] = s / info.width;
  }
  const grid = findGrid(rows);
  if (grid.majors.length < 2) {
    throw new Error("mat: could not find two major grid lines");
  }
  // Crop between the first and the last major line found: the number of
  // periods between them is whole by construction (same phase), so the
  // bottom edge meets the top edge on the same line.
  const first = grid.majors[0];
  const last = grid.majors[grid.majors.length - 1];
  const periods = Math.round((last - first) / grid.period);
  const top = Math.round(first / scale);
  const height = Math.round((periods * grid.period) / scale);
  console.log(
    `mat: ${W}x${H}, cell ${(grid.pitch / scale).toFixed(1)}px, ` +
      `${grid.majors.length} major lines, crop rows ${top}–${top + height} ` +
      `(${periods} periods)`,
  );

  // The light falls off down the photo, and its colour drifts with it
  // (the top is paler): fit each channel's row means within the crop
  // with a line and flatten them, so top and bottom match at the seam.
  // Lines are in every row alike, so the plain means serve.
  const y0 = first;
  const y1 = first + Math.round(periods * grid.period);
  const { data: rgb, info: ri } = await sharp(src)
    .resize({ width: Math.round(W * scale) })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const fits = [0, 1, 2].map((c) => {
    let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
    for (let y = y0; y < y1; y++) {
      let sum = 0;
      for (let x = 0; x < ri.width; x++) sum += rgb[(y * ri.width + x) * 3 + c];
      const v = sum / ri.width;
      const t = (y - y0) / (y1 - y0);
      sx += t; sy += v; sxx += t * t; sxy += t * v; n++;
    }
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const intercept = (sy - slope * sx) / n;
    return { slope, intercept, mid: intercept + slope * 0.5 };
  });
  console.log(
    "mat: brightness top → bottom per channel " +
      fits.map((f) => `${f.intercept.toFixed(0)}→${(f.intercept + f.slope).toFixed(0)}`).join(", ") +
      ", flattened to " + fits.map((f) => f.mid.toFixed(0)).join("/"),
  );

  mkdirSync(OUT_MAT, { recursive: true });
  let meanHex = "";
  for (const width of MAT_WIDTHS) {
    const cropped = sharp(src)
      .extract({ left: 0, top, width: W, height })
      .resize({ width });
    const { data: px, info: oi } = await cropped
      .raw()
      .toBuffer({ resolveWithObject: true });
    const ch = oi.channels;
    for (let y = 0; y < oi.height; y++) {
      const t = y / oi.height;
      const g = fits.map((f) => f.mid / (f.intercept + f.slope * t));
      const row = y * oi.width * ch;
      for (let x = 0; x < oi.width; x++) {
        const i = row + x * ch;
        px[i] = Math.min(255, px[i] * g[0]);
        px[i + 1] = Math.min(255, px[i + 1] * g[1]);
        px[i + 2] = Math.min(255, px[i + 2] * g[2]);
      }
    }
    const out = join(OUT_MAT, `mat-${width}.webp`);
    const flat = sharp(px, {
      raw: { width: oi.width, height: oi.height, channels: ch },
    });
    await flat.clone().webp(MAT_WEBP).toFile(out);
    if (!meanHex) {
      const st = await flat.clone().stats();
      meanHex =
        "#" +
        st.channels
          .slice(0, 3)
          .map((c) => Math.round(c.mean).toString(16).padStart(2, "0"))
          .join("");
    }
    console.log(`  ${out.replace(ROOT + "/", "")}: ${oi.width}x${oi.height}, ${kb(out)}`);
  }
  console.log(`mat: mean colour ${meanHex} (for the first paint)`);
}

// ---------------------------------------------------------------- paper

async function preparePaper() {
  if (!existsSync(SRC_PAPER)) {
    console.warn(`paper: no ${SRC_PAPER}, skipping`);
    return;
  }
  mkdirSync(OUT_PAPER, { recursive: true });
  let plain = null;
  for (const [name, file] of Object.entries(PAPERS)) {
    const src = join(SRC_PAPER, file);
    if (!existsSync(src)) {
      console.warn(`paper: ${file} missing, skipping ${name}`);
      continue;
    }
    const meta = await sharp(src).metadata();
    const tx = Math.round(meta.width * PAPER_TRIM);
    const ty = Math.round(meta.height * PAPER_TRIM);
    const trimmed = sharp(src)
      .extract({
        left: tx,
        top: ty,
        width: meta.width - 2 * tx,
        height: meta.height - 2 * ty,
      })
      .removeAlpha()
      .resize({ width: PAPER_WIDTH });
    // Levels: per channel, the mean goes to PAPER_MEAN (which also takes
    // out the scanner's cast) and the spread about it — the grain — is
    // scaled by PAPER_GRAIN. (stats() reads the source, not the pipeline;
    // the trim and the resize barely move the mean.)
    const st = await trimmed.clone().stats();
    const offsets = st.channels
      .slice(0, 3)
      .map((c) => PAPER_MEAN - PAPER_GRAIN * c.mean);
    const lifted = trimmed
      .clone()
      .linear([PAPER_GRAIN, PAPER_GRAIN, PAPER_GRAIN], offsets);
    const out = join(OUT_PAPER, `${name}.webp`);
    await lifted.clone().webp(PAPER_WEBP).toFile(out);
    const om = await sharp(out).metadata();
    console.log(
      `paper: ${name} ← ${file}, mean ${st.channels.map((c) => c.mean.toFixed(0)).join("/")} ` +
        `(sd ${st.channels[0].stdev.toFixed(1)}), ${om.width}x${om.height}, ${kb(out)}`,
    );
    if (name === "plain") plain = lifted;
  }
  if (!plain) return;

  // The tile: a 512 cut from the middle of the plain sheet, mirrored
  // four ways into 1024, so its edges meet themselves.
  const cut = 512;
  const pm = await plain.clone().toBuffer({ resolveWithObject: true });
  const left = Math.round((pm.info.width - cut) / 2);
  const top = Math.round((pm.info.height - cut) / 2);
  const base = await plain
    .clone()
    .extract({ left, top, width: cut, height: cut })
    .png()
    .toBuffer();
  const flipX = await sharp(base).flop().png().toBuffer();
  const flipY = await sharp(base).flip().png().toBuffer();
  const flipXY = await sharp(base).flop().flip().png().toBuffer();
  const out = join(OUT_PAPER, "tile.webp");
  await sharp({
    create: { width: cut * 2, height: cut * 2, channels: 3, background: "#fff" },
  })
    .composite([
      { input: base, left: 0, top: 0 },
      { input: flipX, left: cut, top: 0 },
      { input: flipY, left: 0, top: cut },
      { input: flipXY, left: cut, top: cut },
    ])
    .webp(PAPER_WEBP)
    .toFile(out);
  console.log(`paper: tile ${cut * 2}x${cut * 2}, ${kb(out)}`);
}

await prepareMat();
await preparePaper();
