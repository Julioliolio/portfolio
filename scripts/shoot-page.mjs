/**
 * Screenshots of a page for review — what the judge loop looks at
 * (docs/media-plan.md). Scrolls the page through once so every
 * <Reveal> has played and every loop has started, then takes the whole
 * page plus one frame per screen.
 *
 *   node scripts/shoot-page.mjs <url> <outdir> [--width 1440] [--phone]
 *
 * Writes <outdir>/screen-NN.png, and <outdir>/full.png: the scrolling
 * sheet stitched from the screens.
 */
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const [url, outdir] = args;
const phone = args.includes("--phone");
const wi = args.indexOf("--width");
const width = wi > -1 ? Number(args[wi + 1]) : 1440;
if (!url || !outdir) {
  console.error("usage: node scripts/shoot-page.mjs <url> <outdir> [--width N] [--phone]");
  process.exit(1);
}
mkdirSync(outdir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext(
  phone
    ? { ...devices["iPhone 13"] }
    : { viewport: { width, height: 900 }, deviceScaleFactor: 1 },
);
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// The work pages scroll inside the project window, not the document:
// find the element that scrolls the most and walk that.
await page.evaluate(() => {
  let best = document.scrollingElement;
  for (const el of document.querySelectorAll("*")) {
    const o = getComputedStyle(el).overflowY;
    if ((o === "auto" || o === "scroll") && el.scrollHeight - el.clientHeight > best.scrollHeight - best.clientHeight)
      best = el;
  }
  best.setAttribute("data-shoot-scroller", "");
});
const scroller = page.locator("[data-shoot-scroller]");
// The document itself (on a phone the sheet is the page): the viewport.
const isDoc = await scroller.evaluate((el) => el === document.scrollingElement);
const vp = page.viewportSize();
const box = isDoc ? { x: 0, y: 0, width: vp.width, height: vp.height } : await scroller.boundingBox();
const { sh, ch } = await scroller.evaluate((el) => ({
  sh: el.scrollHeight,
  ch: el === document.scrollingElement ? innerHeight : el.clientHeight,
}));

// Walk down a screen at a time, so things arrive and loops start; keep
// the scroller's part of each screen to stitch the sheet.
const parts = [];
let shots = 0;
for (let y = 0; ; y += ch) {
  const top = Math.min(y, sh - ch);
  await scroller.evaluate((el, t) => (el.scrollTop = t), top);
  await page.waitForTimeout(1100);
  const file = `${outdir}/screen-${String(shots++).padStart(2, "0")}.png`;
  await page.screenshot({ path: file });
  parts.push({ file, top });
  if (top + ch >= sh || shots > 60) break;
}

// Stitch: each screen's scroller rectangle, placed at its scroll offset.
const scale = phone ? 3 : 1;
const W = Math.round(box.width * scale);
const crops = await Promise.all(
  parts.map(async ({ file, top }) => {
    // Clamped to the screenshot: rounding at 3× can step a pixel past it.
    const img = sharp(file);
    const { width: iw, height: ih } = await img.metadata();
    const left = Math.max(0, Math.min(Math.round(box.x * scale), iw - 1));
    const y = Math.max(0, Math.min(Math.round(box.y * scale), ih - 1));
    const width = Math.min(W, iw - left);
    const height = Math.min(Math.round(ch * scale), ih - y);
    return { input: await img.extract({ left, top: y, width, height }).toBuffer(), top: Math.round(top * scale), left: 0 };
  }),
);
await sharp({ create: { width: W, height: Math.round(sh * scale), channels: 3, background: "#fff" } })
  .composite(crops)
  .png()
  .toFile(`${outdir}/full.png`);
await browser.close();
console.log(`${shots} screens + full page → ${outdir}`);
