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
  /** The sign's height, vh. */
  signHeight: number;
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
   *  window still fits the row. */
  wordSize: number;
  wordCap: number;
  /** The words' drop from the row's top, vh — lines up their caps with
   *  the sign's top. */
  wordsTop: number;
};

// Julio's numbers off the bench, 2026-09-15: the sign a touch bigger
// and lifted, the words closer in.
const HELLO_DEFAULTS: Readonly<HelloTuning> = Object.freeze({
  signHeight: 31.5,
  signX: 0,
  signY: -3.5,
  rowX: 0,
  rowY: 0,
  gap: 1.2,
  wordSize: 7.2,
  wordCap: 5.2,
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
 * stack, centred.
 */
function helloCss(t: HelloTuning): string {
  // The slot's width, vh: its height by the frames' aspect.
  const w = (t.signHeight * SIGN_FRAME.w) / SIGN_FRAME.h;
  return `
.hello-row { display: flex; align-items: flex-start; justify-content: center; gap: ${n(t.gap)}vw; font-size: min(${n(t.wordSize)}vh, ${n(t.wordCap)}vw); line-height: 1.1; letter-spacing: -.02em; color: #171717; transform: translate(${n(t.rowX)}vw, ${n(t.rowY)}vh); }
.hello-words { text-align: right; padding-top: ${n(t.wordsTop)}vh; white-space: nowrap; }
.hello-sign { flex: none; height: ${n(t.signHeight)}vh; aspect-ratio: ${SIGN_FRAME.w} / ${SIGN_FRAME.h}; margin: 0 ${n(-SIGN_INSET.right * w)}vh 0 ${n(-SIGN_INSET.left * w)}vh; transform: translate(${n(t.signX)}vw, ${n(t.signY)}vh); }
.hello-sign.is-waiting, .hello-line-slot.is-waiting { visibility: hidden; }
@media (max-width: 700px) {
  .hello-row { flex-direction: column; align-items: center; gap: 3vh; font-size: 4.4vh; transform: none; }
  .hello-words { text-align: center; }
  .hello-sign { margin: 0; transform: none; }
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
