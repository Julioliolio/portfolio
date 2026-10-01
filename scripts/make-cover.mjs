/**
 * LocalPal's cover: the clip its print plays on the landing (the hover
 * sheet, packages/lab/src/prints.tsx). One phone, tall in a light card,
 * the screen one continuous take of someone using the app (the `course`
 * master from scripts/record-media.mjs, 60 fps), and a camera that
 * pushes in on each interaction and pulls back between them, the way
 * Convertr's print does: the slide to RSVP and who's on their way, the
 * map gathering its pins, a venue pin opening, a search typed and its
 * results, a plan joined, a message sent. 3:4, 900×1200 at 60 fps.
 *
 * The camera is aimed at the take's marks (localpal-course.marks.json,
 * seconds into the master) and eased by a critically damped spring, so
 * every move starts and settles softly. The phone is composited at 2×
 * and each frame is cut from that, so a push-in stays sharp.
 *
 *   node scripts/record-media.mjs localpal/course   # the take + marks
 *   node scripts/make-cover.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { BT709 } from "./lib/record.mjs";
import { kb, loopClip } from "./lib/media.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const MASTER = `${ROOT}source-assets/recordings/localpal-course.mp4`;
const MARKS = JSON.parse(readFileSync(`${ROOT}source-assets/recordings/localpal-course.marks.json`, "utf8"));
const OUT = `${ROOT}apps/web/public/media/localpal/cover.mp4`;

const W = 900, H = 1200, FPS = 60;
/** The composite's scale over the output: room to push in. */
const K = 2;
const CW = W * K, CH = H * K;
const GROUND = "#f3f2ef";
// The phone, as Bento.tsx draws it: a bezel 3.2% of its width, outer
// corners 15%, screen corners 12%; the screen 390:844 CSS px.
const SA = 390 / 844;
const PH = Math.round(CH * 0.88);
const PW = Math.round(PH / (0.936 / SA + 0.064));
const PAD = Math.round(PW * 0.032);
const SW = (PW - 2 * PAD) & ~1;
const SCR_H = (PH - 2 * PAD) & ~1;
const X = Math.round((CW - PW) / 2), Y = Math.round((CH - PH) / 2);

const START = 0.1;
/** The camera moves the whole frame, which costs bits: a little softer
 *  than the other clips to keep the hover's download near 2–3 MB. */
const CRF = 29;
/** Where the poster sits: the RSVP's list, people on their way. */
const POSTER = MARKS.rsvp + 2;

/**
 * The shots: from `at` (a mark, plus `d` seconds) the camera heads for
 * zoom `z` centred on `f`, a point on the screen in its CSS px. Without
 * `f`, the whole phone. Marks are when the action starts, so a push-in
 * leads it a little.
 */
const SHOTS = [
  { t: 0, z: 1 },
  { at: "rsvp", d: -0.5, z: 1.9, f: [200, 335] },
  { at: "rsvp", d: 1.25, z: 1.45, f: [195, 430] },
  { at: "dismiss", d: -0.3, z: 1 },
  { at: "mapzoom", d: 0.1, z: 1.12, f: [195, 400] },
  { at: "pin", d: -0.5, z: 1.9, f: [95, 345] },
  { at: "pin", d: 0.55, z: 1.4, f: [195, 590] },
  { at: "event", d: 0.15, z: 1.4, f: [195, 610] },
  { at: "back", d: 0.1, z: 1 },
  { at: "search", d: -0.4, z: 1.6, f: [175, 720] },
  { at: "type", d: -0.25, z: 2, f: [195, 210] },
  { at: "think", d: 0.2, z: 1.45, f: [195, 400] },
  { at: "result", d: -0.45, z: 1.85, f: [197, 345] },
  { at: "result", d: 0.5, z: 1.4, f: [195, 610] },
  { at: "join", d: -0.2, z: 1.65, f: [195, 715] },
  { at: "joined", d: 0.3, z: 1.45, f: [195, 715] },
  { at: "chat", d: -0.1, z: 1.2, f: [195, 420] },
  { at: "message", d: -0.3, z: 1.85, f: [235, 660] },
  { at: "sent", d: 1.1, z: 1 },
];

function ff(args) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed");
}
function duration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(String(r.stdout).trim());
}

/** The camera for every frame: [zoom, centre x, centre y] in the
 *  composite's px, each shot's target followed by a spring. */
function camera(frames) {
  const target = (t) => {
    let s = SHOTS[0];
    for (const shot of SHOTS) if ((shot.at ? MARKS[shot.at] + shot.d : shot.t) - START <= t) s = shot;
    const [fx, fy] = s.f ?? [195, 422];
    const cx = s.f ? X + PAD + (fx / 390) * SW : CW / 2;
    const cy = s.f ? Y + PAD + (fy / 844) * SCR_H : CH / 2;
    return [Math.log(s.z), cx, cy];
  };
  // Critically damped: ω sets the pace (≈ 0.8 s to settle).
  const w = 6.5, dt = 1 / FPS;
  let x = target(0), v = [0, 0, 0];
  const out = [];
  for (let n = 0; n < frames; n++) {
    const g = target(n * dt);
    for (let i = 0; i < 3; i++) {
      const a = w * w * (g[i] - x[i]) - 2 * w * v[i];
      v[i] += a * dt;
      x[i] += v[i] * dt;
    }
    const z = Math.exp(x[0]);
    // Keep the view inside the card.
    const vw = CW / z, vh = CH / z;
    const cx = Math.min(CW - vw / 2, Math.max(vw / 2, x[1]));
    const cy = Math.min(CH - vh / 2, Math.max(vh / 2, x[2]));
    out.push([z, cx, cy]);
  }
  return out;
}

const dir = mkdtempSync(join(tmpdir(), "cover-"));
try {
  const dur = duration(MASTER) - START - 0.3;
  const frames = Math.floor(dur * FPS);

  // The phone's parts as PNGs: shadow, bezel (the screen cut out), and
  // the screen's rounded mask (its square corners would otherwise poke
  // out past the bezel's rounder outer ones).
  const R = Math.round(PW * 0.15), Ri = Math.round(PW * 0.12);
  const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}">
    <defs>
      <filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${28 * K}"/></filter>
      <filter id="c" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${6 * K}"/></filter>
    </defs>
    <rect x="${X + 14 * K}" y="${Y + 34 * K}" width="${PW - 28 * K}" height="${PH - 20 * K}" rx="${R}" fill="#2b2722" opacity=".2" filter="url(#b)"/>
    <rect x="${X + 4 * K}" y="${Y + 6 * K}" width="${PW - 8 * K}" height="${PH - 2 * K}" rx="${R}" fill="#2b2722" opacity=".14" filter="url(#c)"/></svg>`);
  const bezel = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}">
    <path fill-rule="evenodd" fill="#16130f" d="
      M${X + R},${Y} h${PW - 2 * R} a${R},${R} 0 0 1 ${R},${R} v${PH - 2 * R} a${R},${R} 0 0 1 -${R},${R} h-${PW - 2 * R} a${R},${R} 0 0 1 -${R},-${R} v-${PH - 2 * R} a${R},${R} 0 0 1 ${R},-${R} z
      M${X + PAD + Ri},${Y + PAD} h${SW - 2 * Ri} a${Ri},${Ri} 0 0 1 ${Ri},${Ri} v${SCR_H - 2 * Ri} a${Ri},${Ri} 0 0 1 -${Ri},${Ri} h-${SW - 2 * Ri} a${Ri},${Ri} 0 0 1 -${Ri},-${Ri} v-${SCR_H - 2 * Ri} a${Ri},${Ri} 0 0 1 ${Ri},-${Ri} z"/></svg>`);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SCR_H}">
    <rect width="${SW}" height="${SCR_H}" fill="#000"/>
    <rect width="${SW}" height="${SCR_H}" rx="${Ri}" fill="#fff"/></svg>`);
  const shadowPng = join(dir, "shadow.png");
  const bezelPng = join(dir, "bezel.png");
  const maskPng = join(dir, "mask.png");
  await sharp(shadow).png().toFile(shadowPng);
  await sharp(bezel).png().toFile(bezelPng);
  await sharp(mask).grayscale().png().toFile(maskPng);

  // The composite at 2×, in RGB, frame by frame down a pipe: ground,
  // shadow, the screen (rounded), the bezel on top.
  const decode = spawn("ffmpeg", [
    "-v", "error",
    "-f", "lavfi", "-i", `color=c=${GROUND}:s=${CW}x${CH}:r=${FPS}:d=${dur.toFixed(3)}`,
    "-i", shadowPng,
    "-ss", String(START), "-t", dur.toFixed(3), "-i", MASTER,
    "-i", bezelPng,
    "-loop", "1", "-i", maskPng,
    "-filter_complex",
    `[0:v]format=rgb24[g];` +
      `[2:v]scale=${SW}:${SCR_H}:flags=lanczos:in_color_matrix=bt709:in_range=tv,format=rgba,fps=${FPS},setsar=1[raw];` +
      `[4:v]format=gray,scale=${SW}:${SCR_H}[m];[raw][m]alphamerge[s];` +
      `[g][1:v]overlay=0:0:format=rgb[a];[a][s]overlay=${X + PAD}:${Y + PAD}:shortest=1:format=rgb[b];[b][3:v]overlay=0:0:format=rgb,format=rgb24[v]`,
    "-map", "[v]", "-frames:v", String(frames), "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
  ], { stdio: ["ignore", "pipe", "inherit"] });

  // The camera's cut of each frame, back to an encoder.
  const comp = join(dir, "comp.mp4");
  const encode = spawn("ffmpeg", [
    "-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "14", ...BT709, comp,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  const cams = camera(frames);
  const size = CW * CH * 3;
  const frame = Buffer.allocUnsafe(size);
  let fill = 0, n = 0;
  for await (const chunk of decode.stdout) {
    let off = 0;
    while (off < chunk.length) {
      const k = Math.min(size - fill, chunk.length - off);
      chunk.copy(frame, fill, off, off + k);
      fill += k;
      off += k;
      if (fill < size) continue;
      fill = 0;
      const [z, cx, cy] = cams[Math.min(n++, cams.length - 1)];
      const w = Math.round(CW / z), h = Math.round(CH / z);
      const left = Math.max(0, Math.min(CW - w, Math.round(cx - w / 2)));
      const top = Math.max(0, Math.min(CH - h, Math.round(cy - h / 2)));
      const out = await sharp(frame, { raw: { width: CW, height: CH, channels: 3 } })
        .extract({ left, top, width: w, height: h })
        .resize(W, H, { kernel: "lanczos3", fit: "fill" })
        .raw()
        .toBuffer();
      if (!encode.stdin.write(out)) await once(encode.stdin, "drain");
    }
  }
  encode.stdin.end();
  await once(encode, "close");
  if (encode.exitCode !== 0) throw new Error("encode failed");

  // A loop, folded at the seam (the camera is back on the whole phone at
  // both ends, so only the screen dissolves).
  await loopClip({ src: comp, start: 0, dur: n / FPS, fade: 0.5, fps: FPS, width: W, posterAt: POSTER - START, out: OUT, crf: CRF });
  console.log(`${kb(OUT)} KB  cover.mp4  (${(n / FPS).toFixed(1)} s, ${W}×${H}, ${FPS} fps)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
