/**
 * Records the project pages' clips from the live demos
 * (docs/media-plan.md). Needs the web dev server (`pnpm dev`, which
 * builds the demos into public/demos first).
 *
 *   node scripts/record-media.mjs [job-name ...]     (all jobs if none)
 *   BASE=http://localhost:3000/portfolio node scripts/record-media.mjs
 *
 * Each job opens a page, does its thing while the screen is recorded at
 * 2×, and writes a master to source-assets/recordings/<name>.mp4; the
 * loop that ships is cut from it into apps/web/public/media/<project>/.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { kb, loopClip, poster } from "./lib/media.mjs";
import { TOUCH_DOT, clayCursor, encode, screencast } from "./lib/record.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000/portfolio";
const ROOT = new URL("../", import.meta.url).pathname;
const MASTERS = `${ROOT}source-assets/recordings/`;
const MEDIA = `${ROOT}apps/web/public/media/`;
const DPR = 2;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A LocalPal capture stage (…?capture=<id>), on its own auto loop. The
 * stage box is the shot: its size is the shell's own sum (the largest
 * box of the aspect above a 64px control strip, 16px margins). The
 * stages scale their content with the box, so a small component is
 * cropped in on (`zoom`) from a capture at a high device scale.
 */
function stage(id, { aspect, bg, seconds, start = 0.6, fade = 0.4, width = 900, boxH = 760, dpr = DPR, zoom = 1, cx = 0.5, cy = 0.5 }) {
  const ratio = { "4x5": 4 / 5, "9x16": 9 / 16, "1x1": 1 }[aspect];
  return {
    name: `localpal/${id}`,
    async run(browser) {
      const boxW = Math.round(boxH * ratio);
      const vw = boxW + 32;
      const vh = boxH + 64 + 32;
      const page = await open(browser, { width: vw, height: vh }, TOUCH_DOT, dpr);
      await page.goto(`${BASE}/demos/localpal/index.html?capture=${id}&bg=${bg}&aspect=${aspect}&auto=1`);
      await page.waitForTimeout(1500);
      const rec = await screencast(page, () => wait(seconds * 1000));
      await page.close();
      const top = (vh - boxH - 64) / 2;
      // The stages scale with their box: zoom crops in on the subject,
      // centred at (cx, cy) of the box.
      const cw = boxW / zoom;
      const ch = boxH / zoom;
      const crop = [cw, ch, 16 + Math.min(boxW - cw, Math.max(0, cx * boxW - cw / 2)), top + Math.min(boxH - ch, Math.max(0, cy * boxH - ch / 2))];
      const master = await encode(rec, { out: `${MASTERS}localpal-${id}.mp4`, crop });
      return loopClip({
        src: master,
        start,
        dur: seconds - start - 0.2,
        fade,
        width,
        out: `${MEDIA}localpal/${id}.mp4`,
      });
    },
  };
}

/**
 * A LocalPal screen, whole (…?embed=<intent>), at an iPhone's 390×844 —
 * the clip that goes in a drawn phone. `prep` walks to the starting
 * point unrecorded; `act` is the take. Taps go through the mouse so the
 * touch dot shows them.
 */
function phone(name, intent, { prep, act, start = 0.2, tail = 0.3, fade = 0, width = 600, posterAt = 0 }) {
  return {
    name: `localpal/${name}`,
    async run(browser) {
      const page = await open(browser, { width: 390, height: 844 }, TOUCH_DOT, 3);
      await page.goto(`${BASE}/demos/localpal/index.html?embed=${intent}`);
      await page.waitForTimeout(2500);
      const f = fingers(page);
      if (prep) await prep(f);
      const rec = await screencast(page, () => act(f));
      await page.close();
      const master = await encode(rec, { out: `${MASTERS}localpal-${name}.mp4`, crop: [390, 844, 0, 0] });
      return loopClip({
        src: master,
        start,
        dur: rec.t1 - rec.t0 - start - tail,
        fade,
        width,
        posterAt,
        out: `${MEDIA}localpal/${name}.mp4`,
      });
    },
  };
}

/** Human-paced input: a finger glides to a spot, presses, lifts. */
function fingers(page) {
  let at = [195, 600];
  const glide = async (x, y, ms = 260) => {
    if (ms <= 10) return void (await page.mouse.move(x, y), (at = [x, y]));
    await page.mouse.move(x, y, { steps: Math.max(2, Math.round(ms / 16)) });
    at = [x, y];
  };
  return {
    page,
    wait: (ms) => page.waitForTimeout(ms),
    async tap(x, y, hold = 110) {
      await glide(x, y);
      await page.mouse.down();
      await page.waitForTimeout(hold);
      await page.mouse.up();
    },
    async drag(x0, y0, x1, y1, ms = 600) {
      await glide(x0, y0);
      await page.mouse.down();
      await page.mouse.move(x1, y1, { steps: Math.round(ms / 16) });
      await page.mouse.up();
    },
    async type(text, delay = 65) {
      await page.keyboard.type(text, { delay });
    },
    key: (k) => page.keyboard.press(k),
    async text(t) {
      const box = await page.getByText(t, { exact: false }).first().boundingBox();
      if (!box) throw new Error(`no "${t}" on screen`);
      return [box.x + box.width / 2, box.y + box.height / 2];
    },
    /** Pinch-zoom stand-in: the wheel, a notch at a time. */
    async zoom(dy, ms = 1200, x = 195, y = 420) {
      await page.mouse.move(x, y);
      const n = Math.round(ms / 40);
      for (let i = 0; i < n; i++) {
        await page.mouse.wheel(0, dy / n);
        await page.waitForTimeout(40);
      }
    },
    glide,
    get at() {
      return at;
    },
  };
}

/** Onboarding, unrecorded, up to the step `until` (interests | location). */
async function walkOnboarding(f, until) {
  const tapText = async (t, w = 900) => f.tap(...(await f.text(t))).then(() => f.wait(w));
  await tapText("Get started");
  await tapText("Continue with email");
  await tapText("Here for a semester");
  await f.tap(195, 765); // name is prefilled: Next
  await f.wait(900);
  await tapText("skip for now");
  if (until === "interests") return;
  for (const [x, y] of [[82, 365], [232, 395], [267, 473]]) {
    await f.tap(x, y);
    await f.wait(300);
  }
  await f.tap(195, 765);
  await f.wait(4200);
  await f.tap(195, 765); // verify: skip for now
  await f.wait(1600);
}

/**
 * A box on LocalPal's design-system page (…?ds), recorded while it is
 * played with. `find` returns the crop (CSS px, viewport) once the box
 * is on screen; `act` plays it.
 */
function ds(name, { find, act, width = 720, start = 0.2, tail = 0.2 }) {
  return {
    name: `localpal/${name}`,
    async run(browser) {
      const page = await open(browser, { width: 1440, height: 900 }, TOUCH_DOT, 3);
      await page.goto(`${BASE}/demos/localpal/index.html?ds`);
      await page.waitForTimeout(2000);
      const crop = await find(page);
      await page.waitForTimeout(800);
      const f = fingers(page);
      const rec = await screencast(page, () => act(f, crop));
      await page.close();
      const master = await encode(rec, { out: `${MASTERS}localpal-${name}.mp4`, crop });
      return loopClip({ src: master, start, dur: rec.t1 - rec.t0 - start - tail, fade: 0, width, out: `${MEDIA}localpal/${name}.mp4` });
    },
  };
}

/** A motion tile's stage (the part above its caption), on screen. */
async function motionTile(page, title) {
  const tile = page.locator("article.dsw-motion-tile", { has: page.getByText(title, { exact: true }) }).first();
  await tile.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const t = await tile.boundingBox();
  const m = await tile.locator(".dsw-motion-tile-meta").boundingBox();
  // Its middle, 4:3: the tile is wide and the shape small.
  const h = m.y - t.y - 2;
  const w = Math.min(t.width - 2, (h * 4) / 3);
  return [w, h, t.x + (t.width - w) / 2, t.y + 1].map(Math.round);
}

/** Tap the middle of a crop, `n` times, `gap` ms apart. */
async function tapCrop(f, [w, h, x, y], n = 3, gap = 1700) {
  for (let i = 0; i < n; i++) {
    await f.tap(x + w / 2, y + h / 2);
    await f.wait(gap);
  }
}

/**
 * Convertr, the whole window (…/demos/convertr/), at 1280×800 with the
 * clay cursor. The X clips Julio picked are served to the page from
 * source-assets/convertr-footage/ under /__footage/, so a "file" can be
 * dropped on the box for real.
 */
const FOOTAGE = `${ROOT}source-assets/convertr-footage/`;
const PORTRAIT = "1781307652368117760.mp4"; // 576×1024
const LANDSCAPE = "2072712084895199232.mp4"; // 1280×720
const WIDE = "2000815677498687494.mp4"; // 720×504

function desk(name, { prep, act, crop, start = 0.2, tail = 0.3, fade = 0, width = 1280, posterAt = 0 }) {
  return {
    name: `convertr/${name}`,
    async run(browser) {
      const page = await open(browser, { width: 1280, height: 800 }, clayCursor(BASE), 2);
      await page.route("**/__footage/*", (route) =>
        route.fulfill({ path: FOOTAGE + route.request().url().split("/").pop(), contentType: "video/mp4" }),
      );
      await page.goto(`${BASE}/demos/convertr/index.html`);
      await page.waitForTimeout(2000);
      const f = fingers(page);
      await f.glide(900, 640, 10);
      if (prep) await prep(f);
      const rec = await screencast(page, () => act(f));
      const box = crop ? await crop(page) : [1280, 800, 0, 0];
      await page.close();
      const master = await encode(rec, { out: `${MASTERS}convertr-${name}.mp4`, crop: box });
      return loopClip({ src: master, start, dur: rec.t1 - rec.t0 - start - tail, fade, width, posterAt, out: `${MEDIA}convertr/${name}.mp4` });
    },
  };
}

/** Carry a footage file in from off the box and drop it in the middle. */
async function dropFile(f, file, label) {
  const { page } = f;
  await page.evaluate((n) => window.__carry?.(n), label);
  await f.glide(1180, 720, 10);
  await f.glide(660, 420, 900);
  await page.evaluate(async ([file, x, y]) => {
    const blob = await (await fetch(`/__footage/${file}`)).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], file, { type: "video/mp4" }));
    const el = document.elementFromPoint(x, y);
    for (const type of ["dragenter", "dragover"])
      el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
    await new Promise((r) => setTimeout(r, 450));
    el.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
    window.__carry?.("");
  }, [file, 660, 420]);
}

/** Click something by its title or text, gliding there first. */
async function press(f, sel, hold = 120) {
  const box = await f.page.locator(sel).first().boundingBox();
  if (!box) throw new Error(`nothing at ${sel}`);
  await f.tap(box.x + box.width / 2, box.y + box.height / 2, hold);
}

async function open(browser, viewport, init, dpr = DPR) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  if (init) await page.addInitScript(init);
  return page;
}

const JOBS = [
  stage("venue-pin", { aspect: "4x5", bg: "EFE9E1", seconds: 9.4, boxH: 400, dpr: 5, zoom: 2.6, width: 720 }),
  stage("bubbles", { aspect: "4x5", bg: "F4EFE7", seconds: 9, boxH: 560, dpr: 3 }),
  stage("bottom-bar", { aspect: "9x16", bg: "ECEEF2", seconds: 12.6 }),
  stage("search-morph", { aspect: "1x1", bg: "EFE9E1", seconds: 7, boxH: 200, dpr: 4, width: 720 }),
  stage("cta-morph", { aspect: "1x1", bg: "F4EFE7", seconds: 9, boxH: 260, dpr: 4, width: 720 }),
  stage("venue-flow", { aspect: "9x16", bg: "ECEEF2", seconds: 14 }),
  stage("rsvp", { aspect: "4x5", bg: "EFE9E1", seconds: 9, boxH: 460, dpr: 3 }),
  stage("locate", { aspect: "1x1", bg: "ECEEF2", seconds: 6, boxH: 360, dpr: 5, zoom: 2.2, cy: 0.52, width: 640 }),
  phone("onboarding-interests", "onboarding", {
    posterAt: 5.5,
    prep: (f) => walkOnboarding(f, "interests"),
    act: async (f) => {
      await f.wait(500);
      for (const [x, y] of [[82, 365], [232, 395], [267, 473], [228, 313]]) {
        await f.tap(x, y);
        await f.wait(650);
      }
      await f.tap(195, 765);
      await f.wait(4200);
    },
  }),
  phone("onboarding-flythrough", "onboarding", {
    posterAt: 4.5,
    prep: (f) => walkOnboarding(f, "location"),
    act: async (f) => {
      await f.wait(500);
      await f.tap(...(await f.text("Allow location")));
      await f.wait(6500);
    },
  }),
  phone("search", "map", {
    posterAt: 6.5,
    act: async (f) => {
      await f.wait(600);
      await f.tap(156, 761);
      await f.wait(900);
      await f.type("I want something chill tonight");
      await f.wait(350);
      await f.key("Enter");
      await f.wait(4200);
    },
  }),
  phone("map-zoom", "map", {
    posterAt: 2.2,
    act: async (f) => {
      await f.wait(500);
      await f.zoom(2600, 2200);
      await f.wait(1300);
      await f.zoom(-2600, 2200);
      await f.wait(1200);
    },
  }),
  phone("venue", "map", {
    posterAt: 5.5,
    act: async (f) => {
      await f.wait(500);
      await f.tap(74, 342);
      await f.wait(1600);
      await f.tap(187, 687);
      await f.wait(1600);
      await f.tap(...(await f.text("Going together")));
      await f.wait(2600);
    },
  }),
  // The day of a plan: drag the slider on the plans sheet to confirm.
  phone("dayof", "dayOfPlan", {
    posterAt: 3,
    act: async (f) => {
      await f.wait(1200);
      await f.drag(75, 354, 342, 354, 1000);
      await f.wait(3000);
    },
  }),
  phone("profile", "profile", {
    posterAt: 2.5,
    act: async (f) => {
      await f.wait(1600);
      await f.tap(195, 770);
      await f.wait(2600);
    },
  }),
  ds("ds-press", { find: (p) => motionTile(p, "Press"), act: (f, c) => tapCrop(f, c) }),
  ds("ds-pop", { find: (p) => motionTile(p, "Pop"), act: (f, c) => tapCrop(f, c) }),
  ds("ds-snap", { find: (p) => motionTile(p, "Snap"), act: (f, c) => tapCrop(f, c) }),
  ds("ds-inform", { find: (p) => motionTile(p, "Inform"), act: (f, c) => tapCrop(f, c, 2, 2600) }),
  ds("ds-squircle", {
    // The squircle demo: the shape left of its two sliders.
    find: async (p) => {
      const ctl = p.locator(".dsw-sq-controls").first();
      await ctl.scrollIntoViewIfNeeded();
      await p.waitForTimeout(600);
      const c = await ctl.boundingBox();
      const box = await ctl.evaluate((el) => {
        const r = el.parentElement.getBoundingClientRect();
        return { x: r.x, y: r.y, h: r.height };
      });
      return [c.x - box.x - 24, box.h - 2, box.x + 1, box.y + 1].map(Math.round);
    },
    act: async (f) => {
      const sliders = f.page.locator(".dsw-sq-controls input[type=range]");
      const smooth = await sliders.nth(1).boundingBox();
      const radius = await sliders.nth(0).boundingBox();
      const y = smooth.y + smooth.height / 2;
      const ry = radius.y + radius.height / 2;
      await f.wait(400);
      await f.drag(smooth.x + smooth.width - 4, y, smooth.x + 4, y, 1400);
      await f.wait(500);
      await f.drag(smooth.x + 4, y, smooth.x + smooth.width - 4, y, 1400);
      await f.wait(500);
      await f.drag(radius.x + radius.width * 0.5, ry, radius.x + radius.width * 0.95, ry, 900);
      await f.wait(300);
      await f.drag(radius.x + radius.width * 0.95, ry, radius.x + radius.width * 0.5, ry, 900);
      await f.wait(600);
    },
  }),
  stage("edge-zoom", { aspect: "9x16", bg: "101014", seconds: 9, width: 640 }),
];

JOBS.push(
  // The whole idea in one take: the empty box, a file dropped, the
  // settings, a format, convert, the bricks, the result stepping out.
  desk("every-state", {
    posterAt: 19,
    act: async (f) => {
      await f.wait(2600);
      await dropFile(f, PORTRAIT, "clouds.mp4");
      await f.wait(5200);
      await press(f, "[title=Settings]");
      await f.wait(1600);
      await press(f, "[title='Output format']");
      await f.wait(900);
      await press(f, "text=GIF");
      await f.wait(1400);
      await press(f, "text=PROCESS");
      await f.wait(5200);
      await f.glide(700, 600, 600);
      await f.wait(1200);
    },
  }),
  // The two shapes a video can give the app: portrait opens its
  // settings beside it, landscape below.
  desk("landscape-settings", {
    posterAt: 3,
    prep: async (f) => {
      await dropFile(f, LANDSCAPE, "city.mp4");
      await f.wait(7000);
    },
    act: async (f) => {
      await f.wait(400);
      await press(f, "[title=Settings]");
      await f.wait(3200);
    },
  }),
  desk("portrait-settings", {
    posterAt: 3,
    prep: async (f) => {
      await dropFile(f, PORTRAIT, "clouds.mp4");
      await f.wait(7000);
    },
    act: async (f) => {
      await f.wait(400);
      await press(f, "[title=Settings]");
      await f.wait(3200);
    },
  }),
  // The empty box, cycling through the shapes a video can have.
  desk("idle", {
    act: (f) => f.wait(7600),
    crop: async () => [880, 520, 200, 140],
    width: 1100,
  }),
  // A file carried in and dropped: the box takes it, the bricks load it.
  desk("drop", {
    act: async (f) => {
      await f.wait(500);
      await dropFile(f, PORTRAIT, "clouds.mp4");
      await f.wait(4600);
    },
    crop: async () => [880, 520, 200, 140],
    width: 1100,
    posterAt: 1.2,
  }),
  // Converting: the box collapsed to a bar, the bricks carrying it.
  desk("converting", {
    start: 0.6,
    posterAt: 1.6,
    prep: async (f) => {
      await dropFile(f, PORTRAIT, "clouds.mp4");
      await f.wait(7000);
    },
    act: async (f) => {
      await press(f, "text=PROCESS");
      await f.glide(900, 640, 500);
      await f.wait(4200);
    },
    crop: async () => [860, 240, 210, 280],
    width: 1100,
  }),
  // The result: the box steps out, chips on the corners; the download
  // dragged out of the window, the way the desktop app hands it over.
  desk("result-drag", {
    posterAt: 1.5,
    prep: async (f) => {
      await dropFile(f, PORTRAIT, "clouds.mp4");
      await f.wait(7000);
      await press(f, "text=PROCESS");
      await f.glide(900, 640, 400);
      await f.wait(3000);
    },
    act: async (f) => {
      await f.wait(2400);
      const b = await f.page.locator("[title=Download]").first().boundingBox();
      await f.glide(b.x + b.width / 2, b.y + b.height / 2, 700);
      await f.wait(300);
      await f.page.mouse.down();
      await f.page.evaluate(() => window.__carry?.("clouds.gif"));
      await f.glide(b.x + 260, b.y + 120, 900);
      await f.page.mouse.up();
      await f.page.evaluate(() => window.__carry?.(""));
      await f.wait(900);
    },
    crop: async () => [800, 800, 240, 0],
    width: 900,
  }),
  // Trimming: the in and out handles on the timeline under the video.
  desk("trim", {
    prep: async (f) => {
      await dropFile(f, LANDSCAPE, "city.mp4");
      await f.wait(7000);
    },
    act: async (f) => {
      const hs = await f.page.evaluate(() =>
        [...document.querySelectorAll("*")]
          .filter((e) => e.style?.cursor === "ew-resize")
          .map((e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }),
      );
      const [a, z] = hs;
      await f.wait(300);
      await f.drag(a[0], a[1], a[0] + 150, a[1], 900);
      await f.wait(500);
      await f.drag(z[0], z[1], z[0] - 170, z[1], 900);
      await f.wait(1400);
    },
    crop: async () => [800, 300, 240, 480],
    width: 1100,
  }),
  // Picking a format, then the GIF's width with the estimate following.
  desk("format-gif", {
    posterAt: 4,
    prep: async (f) => {
      await dropFile(f, PORTRAIT, "clouds.mp4");
      await f.wait(7000);
      await press(f, "[title=Settings]");
      await f.wait(1800);
    },
    act: async (f) => {
      await press(f, "[title='Output format']");
      await f.wait(700);
      for (const t of ["text=WEBM", "text=MOV", "text=AVI"]) {
        const b = await f.page.locator(t).first().boundingBox();
        await f.glide(b.x + b.width / 2, b.y + b.height / 2, 260);
        await f.wait(220);
      }
      await press(f, "text=GIF");
      await f.wait(1200);
      // The width slider: the first wide pointer-cursor track (DesignSlider).
      const range = await f.page.evaluate(() => {
        const t = [...document.querySelectorAll("*")].find((e) => e.style?.cursor === "pointer" && e.getBoundingClientRect().width > 300);
        const r = t?.getBoundingClientRect();
        return r && { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      if (range) {
        const y = range.y + range.height / 2;
        await f.drag(range.x + range.width * 0.2, y, range.x + range.width * 0.62, y, 1300);
      }
      await f.wait(1600);
    },
  }),
);

// The reel: the phone takes back to back, a short dissolve between
// each (silent for now — Julio, 2026-10-01). Run after the takes.
JOBS.push({
  name: "localpal/reel",
  async run() {
    const parts = ["onboarding-interests", "onboarding-flythrough", "search", "venue", "profile"].map((n) => `${MEDIA}localpal/${n}.mp4`);
    const durs = parts.map((p) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).stdout));
    const X = 0.35;
    let chain = "";
    let acc = durs[0];
    let last = "[0:v]";
    for (let i = 1; i < parts.length; i++) {
      const out = i === parts.length - 1 ? "[v]" : `[x${i}]`;
      chain += `${last}[${i}:v]xfade=transition=fade:duration=${X}:offset=${(acc - X).toFixed(3)}${out};`;
      acc += durs[i] - X;
      last = out;
    }
    const out = `${MEDIA}localpal/reel.mp4`;
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...parts.flatMap((p) => ["-i", p]), "-filter_complex", chain.slice(0, -1), "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: "inherit" });
    if (r.status) throw new Error("reel failed");
    await poster(out, 7);
    return out;
  },
});

const want = process.argv.slice(2);
const jobs = want.length ? JOBS.filter((j) => want.some((w) => j.name.includes(w))) : JOBS;
mkdirSync(MASTERS, { recursive: true });
// Headed: Chrome's screencast only sends device-scale frames from a real
// window (headless sends 1×). The window is parked off-screen, and kept
// in sRGB — a real window renders in the display's profile otherwise,
// and every colour drifts.
const browser = await chromium.launch({
  headless: false,
  args: ["--window-position=4000,4000", "--force-color-profile=srgb"],
});
for (const job of jobs) {
  const out = await job.run(browser);
  console.log(`${String(kb(out)).padStart(5)} KB  ${job.name}`);
}
await browser.close();
