/**
 * Recording a demo for the project pages (docs/media-plan.md): Chrome's
 * own screencast, at the page's device scale, re-timed to a steady frame
 * rate by ffmpeg from each frame's timestamp. Playwright's recordVideo
 * is a low-bitrate VP8 at 1×; this keeps the pixels.
 *
 * The touch dot and the clay cursor are drawn into the page, so they are
 * in the footage exactly where the events land.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import sharp from "sharp";

/** Tagged BT.709, so a browser decodes the colours ffmpeg encoded — a
 *  clip fitted on a ground of its own background then shows no box. */
export const BT709 = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];

/**
 * Run `act` while the page is screencast; returns the frames.
 * @param {import("playwright").Page} page
 * @param {() => Promise<void>} act
 */
export async function screencast(page, act) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", (f) => {
    frames.push({ data: f.data, ts: f.metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const vp = page.viewportSize();
  const dpr = await page.evaluate(() => devicePixelRatio);
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 95,
    everyNthFrame: 1,
    maxWidth: vp.width * dpr,
    maxHeight: vp.height * dpr,
  });
  const t0 = Date.now() / 1000;
  await act();
  const t1 = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await cdp.detach();
  return { frames, t0, t1, cssWidth: vp.width };
}

/**
 * Frames → a constant-rate, high-quality mp4 (the master a loop is cut
 * from). `crop` is [w, h, x, y] in CSS pixels, scaled to the frames'.
 */
export async function encode({ frames, t1, cssWidth }, { out, crop, fps = 30 }) {
  if (!frames.length) throw new Error("no frames recorded");
  const { width } = await sharp(Buffer.from(frames[0].data, "base64")).metadata();
  const k = width / cssWidth;
  const cropStr = crop && crop.map((v) => Math.round(v * k)).join(":");
  mkdirSync(dirname(out), { recursive: true });
  const dir = mkdtempSync(join(tmpdir(), "rec-"));
  const lines = ["ffconcat version 1.0"];
  frames.forEach((f, i) => {
    const file = join(dir, `${String(i).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(f.data, "base64"));
    const next = frames[i + 1]?.ts ?? Math.max(t1, f.ts + 1 / fps);
    lines.push(`file '${file}'`, `duration ${Math.max(0.001, next - f.ts).toFixed(4)}`);
  });
  // The concat demuxer drops the last duration: repeat the last frame.
  lines.push(`file '${join(dir, `${String(frames.length - 1).padStart(5, "0")}.jpg`)}'`);
  writeFileSync(join(dir, "list.txt"), lines.join("\n"));
  const vf = [cropStr && `crop=${cropStr}`, `fps=${fps}`, "scale=trunc(iw/2)*2:trunc(ih/2)*2:in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv"].filter(Boolean).join(",");
  const r = spawnSync(
    "ffmpeg",
    ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"), "-vf", vf,
      "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", ...BT709, out],
    { stdio: "inherit" },
  );
  rmSync(dir, { recursive: true, force: true });
  if (r.status !== 0) throw new Error(`encode failed: ${out}`);
  return out;
}

/**
 * A soft touch dot: appears where a finger goes down, follows it, lifts
 * and fades. Listens on the window in the capture phase, so synthetic
 * presses (a stage's auto loop) show too; a synthetic event without
 * coordinates is placed on its target's centre.
 */
export const TOUCH_DOT = `(() => {
  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "fixed", left: "0", top: "0", width: "34px", height: "34px",
    margin: "-17px 0 0 -17px", borderRadius: "50%", pointerEvents: "none",
    zIndex: "2147483647", background: "rgba(255,255,255,.55)",
    boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.18)",
    backdropFilter: "blur(2px)", opacity: "0", transform: "scale(.6)",
    transition: "opacity .18s ease-out, transform .18s ease-out",
  });
  const mount = () => document.body ? document.body.appendChild(dot) : requestAnimationFrame(mount);
  mount();
  let down = false;
  const at = (e) => {
    let x = e.clientX, y = e.clientY;
    if (!x && !y && e.target && e.target.getBoundingClientRect) {
      const r = e.target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    dot.style.left = x + "px"; dot.style.top = y + "px";
  };
  addEventListener("pointerdown", (e) => { down = true; at(e); dot.style.opacity = "1"; dot.style.transform = "scale(1)"; }, true);
  addEventListener("pointermove", (e) => { if (down) at(e); }, true);
  const up = () => { down = false; dot.style.opacity = "0"; dot.style.transform = "scale(1.25)"; };
  addEventListener("pointerup", up, true);
  addEventListener("pointercancel", up, true);
})();`;

/**
 * The site's clay cursor, drawn into a recorded page — smaller than on
 * the site (Julio, 2026-10-01: the focus is on the media). The boil
 * frames are the site's own (public/cursor, scripts/prepare-cursor.mjs),
 * cycled at their 6 fps, the tip glued to the pointer at the same
 * hotspots as ClayCursor.tsx; the pointing hand over anything clickable,
 * a squash on press. `window.__carry(name)` hangs a file chip under it,
 * for dragging a file in.
 */
export const clayCursor = (base, size = 30) => `(() => {
  const SIZE = ${size};
  const ARROW = Array.from({ length: 14 }, (_, i) => "${base}/cursor/arrow-" + (i + 1) + ".webp");
  const HAND = Array.from({ length: 5 }, (_, i) => "${base}/cursor/arrow-pointer-" + (i + 1) + ".webp");
  const HOT = { arrow: [0.064, 0.01], hand: [0.39, 0.01] };
  [...ARROW, ...HAND].forEach((src) => { const i = new Image(); i.src = src; });
  const wrap = document.createElement("div");
  Object.assign(wrap.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none", willChange: "transform" });
  const img = document.createElement("img");
  Object.assign(img.style, { position: "absolute", display: "block", transformOrigin: "0 0", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.18))" });
  const chip = document.createElement("div");
  Object.assign(chip.style, { position: "absolute", left: "18px", top: "26px", display: "none", padding: "5px 9px", borderRadius: "6px", background: "#fff", color: "#2b2722", font: "500 12px/1 ui-monospace, Menlo, monospace", boxShadow: "0 6px 18px rgba(0,0,0,.18)", whiteSpace: "nowrap" });
  wrap.append(img, chip);
  const mount = () => (document.body ? document.body.appendChild(wrap) : requestAnimationFrame(mount));
  mount();
  const st = document.createElement("style");
  st.textContent = "*, *::before, *::after { cursor: none !important; }";
  const mountSt = () => (document.head ? document.head.appendChild(st) : requestAnimationFrame(mountSt));
  let x = -100, y = -100, kind = "arrow", frame = 0, press = 1, pressTarget = 1;
  const clickable = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (e.matches?.("a,button,[role=button],input,select,label,summary")) return true;
      if (["pointer", "grab", "ew-resize", "col-resize"].includes(getComputedStyle(e).cursor)) return true;
    }
    return false;
  };
  addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    st.disabled = true;
    const under = document.elementFromPoint(x, y);
    st.disabled = false;
    kind = under && clickable(under) ? "hand" : "arrow";
  }, true);
  addEventListener("mousedown", () => (pressTarget = 0.77), true);
  addEventListener("mouseup", () => (pressTarget = 1), true);
  window.__carry = (name) => { chip.textContent = name || ""; chip.style.display = name ? "block" : "none"; };
  let last = performance.now(), acc = 0;
  const tick = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    acc += dt; if (acc > 1 / 6) { acc = 0; frame++; }
    press += (pressTarget - press) * Math.min(1, dt * 22);
    const frames = kind === "hand" ? HAND : ARROW;
    const src = frames[frame % frames.length];
    if (img.getAttribute("src") !== src) img.src = src;
    const h = SIZE * (kind === "hand" ? 1.15 : 1);
    img.style.height = h + "px";
    const w = img.naturalWidth ? (img.naturalWidth / img.naturalHeight) * h : h * 0.7;
    const [hx, hy] = HOT[kind];
    img.style.left = -hx * w + "px"; img.style.top = -hy * h + "px";
    img.style.transform = "scale(" + press + ")";
    wrap.style.transform = "translate(" + x + "px," + y + "px)";
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  mountSt();
})();`;
