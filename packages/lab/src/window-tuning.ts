import { asset } from "./asset";
import { SETTLE_EASE } from "./style";
import { createTuningStore } from "./tuning-store";

/**
 * The project window's knobs, on their own so the landing can read
 * them without the window's chunk: the signs step back on the same
 * clock and curve as the box grows (Julio, 2026-09-22: coordinated,
 * nothing popping into place). The window (window.tsx) and its benches
 * (/lab/paper for the box and its clocks, /lab/sheet for the paper,
 * /lab/paper for the whole flow) share this store; the benches' knobs
 * write it.
 *
 * The paper: the sheet is white paper with Julio's scan as its texture
 * (`ground`, `grain`), lying on the mat at a lean under a hairline, a
 * tight contact shadow, a soft one and a lip along its bottom edge,
 * its edges cut rather than drawn, its corner a little off the mat
 * (Julio, 2026-09-26: "realistic, with its contact shadow and all").
 * Nothing of the ink is here: the type treated as printed is parked in
 * ink.tsx, with a store of its own, and only /lab/ink puts it on.
 */

export type LiftCorner = "none" | "br" | "bl" | "tr" | "tl";

export type WindowTuning = {
  /** How the box comes to its place. "lift": picked up — the print
   *  grows to the sheet in one eased move, its lean straightening, its
   *  frame closing, its shadow lifting and settling (Julio,
   *  2026-09-25). "grow": Convertr's box — one axis, then the other. */
  move: "lift" | "grow";
  /** The lift, ms: the whole move, and the whole way back. */
  lift: number;
  /** One axis's move, ms (Convertr's box: 350). The shrink's axes take
   *  the same. */
  duration: number;
  /** The second axis starts this long after the first, ms: equal to
   *  `duration` is strictly one then the other (Convertr), less
   *  overlaps them and reads smoother. */
  lag: number;
  /** The hand-off, ms: once the box has landed, the page dissolves in
   *  over the clip and its entrances (title, intro, facts) rise on it,
   *  held until now so they are seen arriving. */
  reveal: number;
  /** The quick fades, ms: the page and the rail out before the way
   *  back, the rail in, and the prints' column leaving as the box lifts. */
  fade: number;
  /** The wall around the box: its top, right and bottom margin, px. */
  margin: number;
  /** How far the open sign reaches over the box's left edge, vh: the
   *  box starts this far back under the end of the grown sign (Julio's
   *  reference: slightly over). 0 butts the box against it. */
  overhang: number;
  /** The box's corner radius, px — the prints' too. */
  corner: number;
  /** The sheet's lean on the mat, degrees: a real sheet is never quite
   *  square to the table. The lift ends on it. */
  tilt: number;
  /** The sheet's size, as shares of the room it has (right of the rail
   *  and inside the margins): 1 fills it; less is a smaller sheet,
   *  centred top to bottom, its left edge at the rail. */
  sheetW: number;
  sheetH: number;
  /** The sheet moved from that place (Julio, 2026-09-29: "let me
   *  customize the main sheet location"): across, in vw, positive to
   *  the right; down, in vh, positive downward. 0 and 0 is the place
   *  above. Shares of the screen, so a place set on one screen holds on
   *  another. The pick-up grows to wherever it is; not on a phone,
   *  where the box is the screen. */
  sheetX: number;
  sheetY: number;
  /** The edges as cut, not drawn: `wobble` is how far, px, the edge
   *  wanders in from a straight line — in `waves` swells along each
   *  edge — and `rough` a finer jitter, px, from point to point, the
   *  deckle of a torn or worn edge; `seed` picks which wander. 0 and 0
   *  is a straight edge, and none of the cutting is done. */
  wobble: number;
  waves: number;
  rough: number;
  seed: number;

  // ------------------------------------------------------ the paper
  /** The sheet's paper: which of Julio's scans (public/paper/) gives
   *  it its texture. plain, or one of the two with a crease. */
  sheet: "plain" | "crease-1" | "crease-2";
  /** The paper's own white, hex: what the scan is laid on. */
  ground: string;
  /** How much of the scan shows on it, 0 to 1: 0 is the bare ground,
   *  1 the scan itself. The prints wear the same. */
  grain: number;
  /** The hairline round the sheet, its alpha. */
  hairline: number;
  /** Which way the sheet's shadows are thrown, degrees off straight
   *  down: 0 is straight down, negative a little to the left, positive
   *  to the right — the light from the other side. The contact and
   *  the soft shadow both follow it, each by its own drop. */
  shadowAngle: number;
  /** The contact shadow: tight, right under the edge, where the sheet
   *  meets the mat. Its drop and blur, px, and its alpha. */
  contactY: number;
  contactBlur: number;
  contactAlpha: number;
  /** The soft shadow: the sheet's shade on the mat around it. */
  softY: number;
  softBlur: number;
  softAlpha: number;
  /** The sheet's thickness: a lip along its bottom edge (alpha), and
   *  its cut edge lit from above-left — light along the top and left
   *  (alpha), shade along the bottom and right (alpha). */
  lip: number;
  cutLight: number;
  edgeShade: number;
  /** The light across the sheet: where it comes from, degrees as a CSS
   *  gradient angle (180 is from the top), and how strong, 0 to .4 —
   *  brighter toward it, darker away, soft-lit onto the page. */
  lightAngle: number;
  light: number;
  /** The sheet's edges curling down to the mat: how far in they darken,
   *  px, and how much, alpha. */
  curl: number;
  curlShade: number;
  /** The corner not quite flat on the mat, or none. */
  liftCorner: LiftCorner;
  /** How far off the mat that corner is, px: its shadow is thrown this
   *  far out and softened (`liftBlur`, px) at `liftShade` alpha, and
   *  the corner itself catches the light at `liftLight` alpha. */
  liftAmount: number;
  liftBlur: number;
  liftShade: number;
  liftLight: number;
};

export const WINDOW_DEFAULTS: Readonly<WindowTuning> = Object.freeze({
  // Julio's pick off /lab/paper, 2026-09-26: the grow.
  move: "grow",
  lift: 520,
  duration: 300,
  lag: 180,
  reveal: 520,
  fade: 220,
  margin: 24,
  overhang: 3.5,
  corner: 5.5,
  tilt: 0.05,
  sheetW: 1,
  sheetH: 1,
  sheetX: 0,
  sheetY: 0,
  wobble: 0.9,
  waves: 3,
  rough: 0.3,
  seed: 24,

  // Julio's values off /lab/sheet, 2026-09-26, second pass: a near-white
  // ground with only a trace of the scan, no hairline and no lit edge,
  // the shade along the bottom and right, the shadows thrown a little
  // to the left, the light from the top-left with the edges curling
  // in, every corner flat on the mat.
  sheet: "plain",
  ground: "#f8f6f1",
  grain: 0.08,
  hairline: 0,
  shadowAngle: -10,
  contactY: 4,
  contactBlur: 6,
  contactAlpha: 0.27,
  softY: 8,
  softBlur: 6,
  softAlpha: 0.22,
  lip: 0.19,
  cutLight: 0,
  edgeShade: 0.17,
  lightAngle: 140,
  light: 0.26,
  curl: 76,
  curlShade: 0.3,
  liftCorner: "none",
  liftAmount: 0,
  liftBlur: 18,
  liftShade: 0.16,
  liftLight: 0.1,
});

/** Convertr's curve for its box: a wind-up, then past the mark and
 *  back. The box, the signs and the shrink all move on it (grow). */
export const WINDOW_EASE = "cubic-bezier(1, -.35, .22, 1.15)";
/** The lift's curve: quick off the mat, a long settle — the site's
 *  settle curve. */
export const LIFT_EASE = SETTLE_EASE;

/** The whole move, ms: the lift, or the first axis to the second's
 *  end. */
export const moveMs = (t: WindowTuning) =>
  t.move === "lift" ? t.lift : t.lag + t.duration;
/** The move's curve, for whatever moves with the box. */
export const windowEase = (t: WindowTuning) =>
  t.move === "lift" ? LIFT_EASE : WINDOW_EASE;

/** The page's dissolve in once the box has landed. */
export const REVEAL_EASE = "cubic-bezier(.4, 0, .2, 1)";
/** The quick fades (the rail, the prints' column). */
export const FADE_EASE = "ease";

/** The keyword curves, as their cubic-bezier() points. */
const KEYWORD_EASE: Record<string, readonly number[]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/**
 * A curve run backwards in time: played forward on it, a move from B
 * to A retraces the move from A to B on `ease` frame for frame — the
 * wind-up and the overshoot swap ends, the settle becomes the start.
 * The way back is the way out, reversed (Julio, 2026-09-26: "that
 * transformation to happen backwards too"). A cubic-bezier's points
 * (x1, y1, x2, y2) become (1 - x2, 1 - y2, 1 - x1, 1 - y1).
 */
export function reverseEase(ease: string): string {
  const m = /cubic-bezier\(([^)]+)\)/.exec(ease);
  const p = m ? m[1]!.split(",").map(Number) : KEYWORD_EASE[ease.trim()];
  if (!p || p.length !== 4 || p.some((v) => !Number.isFinite(v))) return ease;
  const [x1, y1, x2, y2] = p as [number, number, number, number];
  return `cubic-bezier(${n(1 - x2)}, ${n(1 - y2)}, ${n(1 - x1)}, ${n(1 - y1)})`;
}

/** The whole way back, ms: the page dissolving out over the clip (the
 *  reveal, reversed), then the box shrinking onto the print (the move,
 *  reversed). */
export const returnMs = (t: WindowTuning) => t.reveal + moveMs(t);

// ------------------------------------------------------------ the paper

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** A hex colour with an alpha, as rgba(). */
function rgba(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const v = m ? parseInt(m[1]!, 16) : 0xffffff;
  return `rgba(${v >> 16}, ${(v >> 8) & 255}, ${v & 255}, ${n(alpha)})`;
}

/**
 * The paper's look, one set of layers for the sheet (window.tsx) and
 * the prints (prints.tsx), so a print and the sheet it is picked up
 * into are the same paper (Julio, 2026-09-26: "I want them to share
 * it"):
 *
 *   veil    the ground over the scan, as strong as the grain is weak
 *   sheet   Julio's scan, as wide as the paper, tiling downward — it
 *           grows with the box, so the pick-up keeps its fibres
 *   shadow  lying on the mat: hairline, contact, soft, lip, and the cut
 *           edge's light and shade (inset, last) — six layers, in the
 *           order the lift's own shadow (window.tsx) interpolates
 *   light   the light across it from `lightAngle`, and `curl`: its
 *           edges darkening as they curl down to the mat (soft-light,
 *           over everything printed on it)
 */
export const paperVeil = (t: WindowTuning) =>
  `linear-gradient(${rgba(t.ground, 1 - t.grain)} 0 0)`;
export const paperSheet = (t: WindowTuning) =>
  `url(${asset(`/paper/${t.sheet}.webp`)}) 0 0 / 100% auto repeat-y`;
/** A shadow's offset, px, for a drop of `d` thrown at the tuning's
 *  angle: straight down at 0, swung left or right of it. */
export const thrown = (t: WindowTuning, d: number) => {
  const a = (t.shadowAngle * Math.PI) / 180;
  return { x: d * Math.sin(a), y: d * Math.cos(a) };
};
const offset = (t: WindowTuning, d: number) => {
  const { x, y } = thrown(t, d);
  return `${n(x, 1)}px ${n(y, 1)}px`;
};
export const paperShadow = (t: WindowTuning) =>
  [
    `0 0 0 1px rgba(43, 39, 34, ${n(t.hairline)})`,
    `${offset(t, t.contactY)} ${n(t.contactBlur, 1)}px rgba(0, 0, 0, ${n(t.contactAlpha)})`,
    `${offset(t, t.softY)} ${n(t.softBlur, 1)}px rgba(0, 0, 0, ${n(t.softAlpha)})`,
    `0 1px 0 0 rgba(43, 39, 34, ${n(t.lip)})`,
    // The cut edge, lit from above-left: light along the top and the
    // left, shade along the bottom and the right (Julio's photo of a
    // sheet on a dark table, 2026-09-26).
    `inset 1px 1px 0 0 rgba(255, 255, 255, ${n(t.cutLight)})`,
    `inset -1px -1px 0 0 rgba(0, 0, 0, ${n(t.edgeShade)})`,
  ].join(", ");
/** The paper lifted a little off the mat (a print under the pointer,
 *  see PRINT_CSS): the same six layers, the contact and the soft
 *  shadows thrown further and softer, no lip, the cut edge as it was. */
export const paperLifted = (t: WindowTuning) =>
  [
    `0 0 0 1px rgba(43, 39, 34, ${n(t.hairline)})`,
    `${offset(t, t.contactY * 2.5)} ${n(t.contactBlur * 2.5, 1)}px rgba(0, 0, 0, ${n(t.contactAlpha * 0.8)})`,
    `${offset(t, t.softY * 3)} ${n(t.softBlur * 2.4, 1)}px rgba(0, 0, 0, ${n(t.softAlpha * 1.15)})`,
    `0 0 0 0 rgba(43, 39, 34, 0)`,
    `inset 1px 1px 0 0 rgba(255, 255, 255, ${n(t.cutLight)})`,
    `inset -1px -1px 0 0 rgba(0, 0, 0, ${n(t.edgeShade)})`,
  ].join(", ");
export const paperLight = (t: WindowTuning) =>
  `linear-gradient(${n(t.lightAngle, 0)}deg, rgba(255, 255, 255, ${n(t.light)}), rgba(128, 128, 128, 0) 50%, rgba(0, 0, 0, ${n(t.light)}))`;
export const paperCurl = (t: WindowTuning) =>
  `inset 0 0 ${n(t.curl, 0)}px rgba(0, 0, 0, ${n(t.curlShade)})`;

/** The paper's look as page-wide variables, for the prints to read
 *  off :root (PRINT_CSS falls back to the defaults' where a page sets
 *  none). */
const paperVars = (t: WindowTuning) =>
  [
    `--paper-ground: ${t.ground}`,
    `--paper-veil: ${paperVeil(t)}`,
    `--paper-sheet: ${paperSheet(t)}`,
    `--paper-shadow: ${paperShadow(t)}`,
    `--paper-lifted: ${paperLifted(t)}`,
    `--paper-corner: ${n(t.corner, 1)}px`,
    `--paper-light: ${paperLight(t)}`,
    `--paper-curl: ${paperCurl(t)}`,
  ].join("; ");

/**
 * The paper's look on :root, so the prints wear the sheet's paper live
 * as it is tuned. Whoever shows prints puts this in a <style>: the
 * landing, a project's page, the benches.
 */
export const paperCss = (t: WindowTuning) => `:root { ${paperVars(t)}; }`;

// A key of its own: the values stored under the earlier "sheet" key
// meant other things.
const store = createTuningStore("box-tuning", WINDOW_DEFAULTS);

/** Lays `patch` over the current values and tells every subscriber. */
export const setWindowTuning = store.set;
export const resetWindowTuning = store.reset;
/** The live tuning, re-rendering the caller on every change. */
export const useWindowTuning = store.useTuning;
