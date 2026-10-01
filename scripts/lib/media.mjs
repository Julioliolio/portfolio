/**
 * Shared ffmpeg steps for the project pages' media (docs/media-plan.md):
 * every clip on a page is a short muted mp4 that loops, with a webp
 * poster of its first frame. Used by scripts/prepare-camper-media.mjs and
 * scripts/record-media.mjs.
 *
 * A loop is made seamless by folding its last `fade` seconds over its
 * first: the clip runs from `fade` to the end, then dissolves into the
 * frames it skipped, so the last frame is the one before the first.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";
import sharp from "sharp";

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], {
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
}

/** H.264, no sound, small: what a muted loop in a bento needs. */
const X264 = [
  "-an",
  "-c:v", "libx264",
  "-preset", "slow",
  "-crf", "25",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  // Tagged BT.709 (and converted to it below), so the browser decodes
  // the colours that were encoded: a ground sampled from the poster
  // then matches the clip.
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
];

/**
 * Cut, crop, scale and loop one clip, and write its poster.
 *
 * @param {object} o
 * @param {string} o.src     source video
 * @param {number} [o.start] seconds into the source
 * @param {number} [o.dur]   seconds to take (before the fold)
 * @param {string} [o.crop]  ffmpeg crop "w:h:x:y", in source pixels
 * @param {number} o.width   output width; height follows (even)
 * @param {number} [o.fade]  seconds folded over the start; 0 = a plain cut
 * @param {number} [o.fps]
 * @param {string} o.out     .mp4 path; the poster is the same path, .webp
 * @param {number} [o.posterAt] seconds into the clip for the poster (a
 *   take that starts empty shows what it's about instead)
 */
export async function loopClip({ src, start = 0, dur, crop, width, fade = 0.4, fps = 30, out, posterAt = 0 }) {
  mkdirSync(dirname(out), { recursive: true });
  const look = [crop && `crop=${crop}`, `scale=${width}:-2:flags=lanczos:in_color_matrix=bt709:in_range=tv:out_color_matrix=bt709:out_range=tv`, `fps=${fps}`, "setsar=1"]
    .filter(Boolean)
    .join(",");
  const input = ["-ss", String(start), ...(dur ? ["-t", String(dur)] : []), "-i", src];
  if (!fade || !dur) {
    ffmpeg([...input, "-vf", look, ...X264, out]);
  } else {
    const body = dur - fade;
    ffmpeg([
      ...input,
      "-filter_complex",
      `[0:v]${look},split[a][b];` +
        `[a]trim=start=${fade},setpts=PTS-STARTPTS[main];` +
        `[b]trim=end=${fade},setpts=PTS-STARTPTS[head];` +
        `[main][head]xfade=transition=fade:duration=${fade}:offset=${body - fade}[v]`,
      "-map", "[v]",
      ...X264,
      out,
    ]);
  }
  await poster(out, posterAt);
  return out;
}

/**
 * One frame as a sharp image, decoded as BT.709 limited range — what a
 * browser does with these clips. ffmpeg's own RGB output ignores the
 * matrix and decodes BT.601 (a few levels greener), so the frame comes
 * out as raw YUV 4:4:4 (y4m, for its size) and is converted here.
 */
function frame(args, look = "") {
  const vf = [look, "format=yuv444p"].filter(Boolean).join(",");
  const r = spawnSync("ffmpeg", ["-v", "error", ...args, "-vf", vf, "-frames:v", "1", "-f", "yuv4mpegpipe", "-strict", "-1", "-"], {
    maxBuffer: 256 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`ffmpeg frame failed: ${args.join(" ")}`);
  const buf = r.stdout;
  const head = buf.subarray(0, buf.indexOf(10)).toString();
  const width = Number(/ W(\d+)/.exec(head)[1]);
  const height = Number(/ H(\d+)/.exec(head)[1]);
  const start = buf.indexOf(10, buf.indexOf("FRAME", head.length)) + 1;
  const n = width * height;
  const Y = buf.subarray(start, start + n);
  const U = buf.subarray(start + n, start + 2 * n);
  const V = buf.subarray(start + 2 * n, start + 3 * n);
  const rgb = Buffer.alloc(n * 3);
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
  for (let i = 0; i < n; i++) {
    const y = 1.164384 * (Y[i] - 16);
    const u = U[i] - 128;
    const v = V[i] - 128;
    rgb[i * 3] = clamp(y + 1.792741 * v);
    rgb[i * 3 + 1] = clamp(y - 0.213249 * u - 0.532909 * v);
    rgb[i * 3 + 2] = clamp(y + 2.112402 * u);
  }
  return sharp(rgb, { raw: { width, height, channels: 3 } });
}

/** A frame of the clip (its first, by default) as a webp next to it. */
export async function poster(mp4, at = 0) {
  await frame([...(at ? ["-ss", String(at)] : []), "-i", mp4]).webp({ quality: 78 }).toFile(mp4.replace(/\.mp4$/, ".webp"));
}

/** A single frame as a webp still. */
export async function still({ src, at, crop, width, out }) {
  mkdirSync(dirname(out), { recursive: true });
  const look = [crop && `crop=${crop}`, `scale=${width}:-2:flags=lanczos`].filter(Boolean).join(",");
  await frame(["-ss", String(at), "-i", src], look).webp({ quality: 82 }).toFile(out);
  return out;
}

export const kb = (p) => Math.round(statSync(p).size / 1024);

// `node scripts/lib/media.mjs posters <dir>`: rewrite every clip's poster.
if (process.argv[2] === "posters") {
  const { readdirSync } = await import("node:fs");
  for (const dir of process.argv.slice(3))
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".mp4"))) await poster(`${dir}/${f}`);
}
