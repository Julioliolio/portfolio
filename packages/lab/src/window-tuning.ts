import { createTuningStore } from "./tuning-store";

/**
 * The project window's knobs, on their own so the landing can read
 * them without the window's chunk: the signs step back on the same
 * clock and curve as the box grows (Julio, 2026-09-22: coordinated,
 * nothing popping into place). The window (window.tsx) and its bench
 * (/lab/window) share this store; the bench's sliders write it.
 */
export type WindowTuning = {
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
  /** The quick fades, ms: the page and the rail out before the shrink,
   *  the rail in, and the hover card's copy leaving as the box grows. */
  fade: number;
  /** The wall around the box: its top, right and bottom margin, px. */
  margin: number;
  /** How far the open sign reaches over the box's left edge, vh: the
   *  box starts this far back under the end of the grown sign (Julio's
   *  reference: slightly over). 0 butts the box against it. */
  overhang: number;
  /** The box's corner radius, px. Square by his reference; the knob
   *  is here for the bench. */
  corner: number;
  /** The hairline round the box, 0 to 1. */
  edge: number;
  /** The rail's width, vw, when the caller does not give one. */
  rail: number;
};

export const WINDOW_DEFAULTS: Readonly<WindowTuning> = Object.freeze({
  duration: 300,
  lag: 180,
  reveal: 520,
  fade: 220,
  margin: 20,
  overhang: 3.5,
  corner: 0,
  edge: 0.14,
  rail: 27,
});

/** Convertr's curve for its box: a wind-up, then past the mark and
 *  back. The box, the signs and the shrink all move on it. */
export const WINDOW_EASE = "cubic-bezier(1, -.35, .22, 1.15)";

/** The whole move, first axis to the second's end, ms. */
export const moveMs = (t: WindowTuning) => t.lag + t.duration;

// A key of its own: the values stored under the earlier "sheet" key
// meant other things.
const store = createTuningStore("box-tuning", WINDOW_DEFAULTS);

/** Lays `patch` over the current values and tells every subscriber. */
export const setWindowTuning = store.set;
export const resetWindowTuning = store.reset;
/** The live tuning, re-rendering the caller on every change. */
export const useWindowTuning = store.useTuning;
