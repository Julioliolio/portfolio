"use client";

import { createTuningStore } from "./tuning-store";

/**
 * The hello screen's layout: where the sign sits and how big, and the
 * row of words around it — the composition of the landing's first
 * screen (apps/web .../landing), as one set of knobs.
 *
 * Every size is a share of the viewport (vh, vw) so the screen keeps
 * its proportions at any size: the mockup (2026-09-13, a 1512 x 982
 * frame) is the origin of the defaults. /lab/hello is the bench: the
 * real screen, full size, with the knobs floating over it. The store
 * is a tuning store like the motion one — values are kept in this
 * browser until Reset, and <HelloStyles> regenerates the stylesheet on
 * every change, so the bench moves the landing too. Lock a layout in
 * by pasting the bench's values into HELLO_DEFAULTS.
 */

/** The sign's frame canvas, px — the cartel's FRAME_ASPECT (printed by
 *  scripts/prepare-cartel-frames.mjs), repeated here so the row can
 *  hold the sign's place before its chunk arrives. */
const SIGN_FRAME = { w: 929, h: 1600 };
/** The front frame's transparent margins, as shares of the canvas: the
 *  room the canvas keeps around the sign for the turned frames. The
 *  row's gap is measured from the sign itself, so the slot pulls its
 *  neighbours in by these. Measured off front.webp's alpha (2026-09-15;
 *  re-measure if the frames are regenerated): opaque from x 41 to 889
 *  of 929, y 39 to 1562 of 1600. */
const SIGN_INSET = { left: 41 / SIGN_FRAME.w, right: 1 - 889 / SIGN_FRAME.w };

export type HelloTuning = {
  /** The sign's height, in the row's unit (a vh on a wide screen). */
  signHeight: number;
  /** The sign's height standing on a portrait screen, vh — the column,
   *  where it is the page's centre and takes a real share of the
   *  height (Julio, 2026-09-26: "way bigger"). */
  signPortrait: number;
  /** The sign's offset from its slot in the row, vw right and vh down —
   *  the words stay where the slot put them. */
  signX: number;
  signY: number;
  /** The whole row's offset from the screen's centre, vw right and vh
   *  down. */
  rowX: number;
  rowY: number;
  /** The breath between the words and the sign, vw. */
  gap: number;
  /** The words' size, vh, and its cap by the width, vw, so a squarer
   *  window still fits the row. The cap is the row's: the sign and the
   *  words' drop shrink with the words under it, so the sign stays the
   *  same size against the letters on every landscape screen (Julio,
   *  2026-09-26). */
  wordSize: number;
  wordCap: number;
  /** The words' drop from the row's top, vh — lines up their caps with
   *  the sign's top. */
  wordsTop: number;
};

// Read off Julio's mockups of the screen on the mat (2026-09-26, a
// 1680 x 1076 frame): the words 8.2vh on a 1.0 line, the sign about
// five and a half caps tall — past the mockup's 4.95, as he asked for
// it bigger, twice — with its middle a touch under the screen's, a wider breath
// either side of it — 3.6vw before, 4.9 after — and the words' caps on
// the sign's top.
const HELLO_DEFAULTS: Readonly<HelloTuning> = Object.freeze({
  signHeight: 34,
  signPortrait: 38,
  signX: -0.65,
  signY: 0.6,
  rowX: 0,
  rowY: 0,
  gap: 4.25,
  wordSize: 8.2,
  wordCap: 5.25,
  wordsTop: 0.4,
});

// ------------------------------------------------------------- the store

const store = createTuningStore("hello-tuning", HELLO_DEFAULTS);

/** Lays `patch` over the current values and tells every subscriber. */
export const setHelloTuning = store.set;
export const resetHelloTuning = store.reset;
/** The live tuning, re-rendering the caller on every change. */
export const useHelloTuning = store.useTuning;

// -------------------------------------------------------- the stylesheet

const n = (v: number) => Number(v.toFixed(3)).toString();

/**
 * The row's stylesheet for a tuning. The words before, the sign, the
 * line after — one row centred on the screen; both word blocks set
 * right, so "I’m" ends at the sign and the line rags on its left. The
 * sign's slot is its size from the first layout, before the piece's
 * chunk has arrived, so the words either side land where they will
 * stay; a slot that is waiting (its turn in the dialogue not yet come)
 * holds its place out of sight. The slot's negative side margins take
 * back the canvas's transparent margins (SIGN_INSET), so the gap runs
 * from the words to the sign's own edge. Offsets are transforms, so
 * moving the sign or the row never re-lays the words. Narrow, the three
 * stack, centred. The slot says its height in --hello-sign-h, which is
 * what the cartel inside is given: it wants a length it can do
 * arithmetic on (its shadow is a share of it), and a percentage is not
 * one inside a filter.
 */
function helloCss(t: HelloTuning): string {
  // The slot's width, vh: its height by the frames' aspect.
  const w = (t.signHeight * SIGN_FRAME.w) / SIGN_FRAME.h;
  // The row's unit: a vh, capped by the width so a squarer window still
  // fits the row — and the sign, the words and the words' drop are all
  // in it, so they shrink together and keep their proportions.
  const u = "var(--hello-u)";
  const of = (v: number) => `calc(${n(v)} * ${u})`;
  return `
.hello-row { --hello-u: min(1vh, ${Number((t.wordCap / t.wordSize).toFixed(4))}vw); display: flex; align-items: flex-start; justify-content: center; gap: ${n(t.gap)}vw; font-size: ${of(t.wordSize)}; line-height: 1; letter-spacing: -.01em; color: #fff; transform: translate(${n(t.rowX)}vw, ${n(t.rowY)}vh); }
.hello-words { text-align: right; padding-top: ${of(t.wordsTop)}; white-space: nowrap; }
.hello-sign { --hello-sign-h: ${of(t.signHeight)}; flex: none; height: var(--hello-sign-h); aspect-ratio: ${SIGN_FRAME.w} / ${SIGN_FRAME.h}; margin: 0 ${of(-SIGN_INSET.right * w)} 0 ${of(-SIGN_INSET.left * w)}; transform: translate(${n(t.signX)}vw, ${of(t.signY)}); }
.hello-sign.is-waiting, .hello-line-slot.is-waiting { visibility: hidden; }
/* Standing: a narrow or a portrait screen. The three stack, centred,
   and the unit is the plain vh — the column has the room the row
   lacked — with the sign at its own, bigger, height: it is the page's
   centre here. */
@media (max-width: 700px), (orientation: portrait) {
  .hello-row { --hello-u: 1vh; flex-direction: column; align-items: center; gap: 3vh; font-size: 4.4vh; transform: none; }
  .hello-words { text-align: center; padding-top: 0; }
  .hello-sign { --hello-sign-h: ${n(t.signPortrait)}vh; margin: 0; transform: none; }
}
`;
}

/**
 * Keeps the row's stylesheet in the document, regenerated on every
 * change. Mount once wherever the row is shown; stored bench values
 * land right after hydration.
 */
export function HelloStyles() {
  return <style data-hello="">{helloCss(useHelloTuning())}</style>;
}
