"use client";

import { createTuningStore } from "./tuning-store";

/**
 * The brand plate: the small horizontal "Julio(liolio)" lightbox, the
 * site's home mark, fixed in the upper-left of the projects screen and
 * of every project page. It is what the hello screen's tall sign
 * becomes when the page scrolls down to the projects (sign-travel.tsx);
 * a project page has it stamp in on its own. The piece is pieces/brand-sign; /lab/brand-sign is
 * its bench. Where it sits and how big are the knobs here — a tuning
 * store like the hello one, regenerated into a stylesheet by
 * <BrandStyles> — and the window's rail reads the plate's foot
 * (--brand-foot) so a page's contents start under it.
 *
 * Read off Julio's mockup (2026-09-28, a 1764 x 984 frame): the plate
 * about 7vh tall, 1.7vw in and 1.8vh down; its left is set on the
 * window rail's inset (WINDOW_LAYOUT.inset, 2.4vw) so the rail's things
 * line up under it.
 */

/** The plate's width over its height, printed by
 *  scripts/prepare-brand.mjs — sizes the box before the photo
 *  decodes. */
export const BRAND_ASPECT = 2.703;

export type BrandTuning = {
  /** The plate's height, vh. */
  height: number;
  /** Its top-left corner: vh down, vw in. */
  top: number;
  left: number;
  /** The room under it before the rail's contents, px. */
  gap: number;
  /** Its drop shadow, in % of its height, and its darkness. */
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowAlpha: number;
};

const BRAND_DEFAULTS: Readonly<BrandTuning> = Object.freeze({
  height: 7.1,
  top: 2,
  left: 2.4,
  gap: 22,
  // Julio's slider values (2026-09-28).
  shadowX: 11.5,
  shadowY: 15,
  shadowBlur: 3.5,
  shadowAlpha: 0.34,
});

const store = createTuningStore("brand-tuning", BRAND_DEFAULTS);

export const setBrandTuning = store.set;
export const resetBrandTuning = store.reset;
export const getBrandTuning = store.get;
/** The live tuning, re-rendering the caller on every change. */
export const useBrandTuning = store.useTuning;

const n = (v: number) => Number(v.toFixed(3)).toString();

/** The plate's shadow for a box `h` tall (a CSS length), as a filter:
 *  the travel paints the same shadow under the frames on their way. */
export function brandShadow(h: string, t: BrandTuning): string {
  if (t.shadowAlpha <= 0) return "none";
  const len = (v: number) => `calc((${h}) * ${n(v / 100)})`;
  return `drop-shadow(${len(t.shadowX)} ${len(t.shadowY)} ${len(t.shadowBlur)} rgba(0, 0, 0, ${n(t.shadowAlpha)}))`;
}

/**
 * The plate's stylesheet: its place and size as variables on the root
 * (the window reads --brand-foot), the fixed box, and its entrance —
 * the site's sm-drop stamp (packages/lab/src/motion.tsx), so
 * /lab/motion tunes it too. Above the window (z-index 80) and the
 * signs over it (90); the travelling sign goes over this (96).
 */
function brandCss(t: BrandTuning): string {
  return `
:root { --brand-h: ${n(t.height)}vh; --brand-top: ${n(t.top)}vh; --brand-left: ${n(t.left)}vw; --brand-foot: calc(${n(t.top + t.height)}vh + ${n(t.gap)}px); }
.brand-sign { position: fixed; top: var(--brand-top); left: var(--brand-left); z-index: 95; display: block; height: var(--brand-h); width: calc(var(--brand-h) * ${BRAND_ASPECT}); filter: ${brandShadow("var(--brand-h)", t)}; outline: none; }
.brand-sign:focus-visible { outline: 2px solid #fff; outline-offset: 6px; }
.brand-sign img { display: block; width: 100%; height: 100%; user-select: none; }
.brand-sign.is-hidden { visibility: hidden; }
.brand-sign.brand-enter { animation: sm-drop var(--sm-duration, .38s) steps(1, end) backwards; transform-origin: 50% 60%; }
@media (prefers-reduced-motion: reduce) { .brand-sign.brand-enter { animation-duration: .01ms; } }
`;
}

/** Keeps the plate's stylesheet in the document, regenerated on every
 *  change. The piece mounts it; a page only needs the piece. */
export function BrandStyles() {
  return <style data-brand="">{brandCss(useBrandTuning())}</style>;
}
