"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { WindowLayout } from "./window";
import {
  FADE_EASE,
  moveMs,
  returnMs,
  reverseEase,
  windowEase,
  type WindowTuning,
} from "./window-tuning";

/**
 * Where the road signs, the prints and the project window sit on the
 * site — the landing's numbers, shared with a project's own page
 * (ProjectPage), which parks the same stack in the same place, and
 * with the paper bench (/lab/paper), which puts the whole flow on a
 * lab page at the site's sizes.
 */

/** The mockup frame; what the server render and the first client
 *  render assume until the real viewport is measured. */
const FRAME = { w: 1512, h: 982 };

/** The viewport, in px, re-read on resize. `measured` is false until
 *  the first read, for a page that would rather wait than guess. */
export function useViewport() {
  const [size, setSize] = useState({ ...FRAME, measured: false });
  useEffect(() => {
    const read = () =>
      setSize({ w: innerWidth, h: innerHeight, measured: true });
    read();
    addEventListener("resize", read);
    return () => removeEventListener("resize", read);
  }, []);
  return size;
}

/**
 * The road signs tuned to the mockup: each sign 8.8vh tall, and the
 * walk's spacing (the gaps and the nudges, tuned at 64px) scaled with
 * it, so the walk feels the same at any size. A wide print is 57.9vw
 * across, the column's right edge on the screen's, and its centre line
 * 26.1vh above the stack's middle — about the screen's middle. The
 * stage reaches the screen's right edge.
 * The places are shares of the screen off the front spot: the pile at
 * rest at the bottom right, and for each hover, where each sheet goes:
 * the front one about the column's centre line at its own lean, the
 * other two peeking in — one hanging in from the top, one showing at
 * the bottom right — each hover its own. All of it placed by hand on
 * /lab/paper by Julio, 2026-09-26, at a 1710x961 window (Copy values
 * writes this block).
 */
export function signsTuning(vw: number, vh: number) {
  const height = 0.088 * vh;
  const k = height / 64;
  // The stage runs from the stack's left edge to the screen's right
  // edge: 100vw - (7.2vw - padX), with padX = 0.6 * height. cardSpan is
  // what the stage adds past the stack's padded box (widest sign * 3.563
  // + 2 padX).
  const stackW = 3.563 * height + 1.2 * height;
  const cardSpan = 0.928 * vw + 0.6 * height - stackW;
  return {
    height,
    gap: 12 * k,
    dimGap: 8 * k,
    hoverNudge: 6 * k,
    nudgePush: 16 * k,
    printW: 0.579 * vw,
    columnRight: 0,
    cardSpan,
    cardY: -0.261 * vh,
    places: {
      pile: {
        localpal: { x: 0.356 * vw, y: 0.775 * vh, tilt: -3 },
        camper: { x: 0.412 * vw, y: 0.83 * vh, tilt: 4.5 },
        convertr: { x: 0.451 * vw, y: 0.895 * vh, tilt: 12 },
      },
      hover: {
        localpal: {
          localpal: { x: 0, y: 0, tilt: -1.6 },
          camper: { x: 0.591 * vw, y: -0.707 * vh, tilt: 9 },
          convertr: { x: 0.555 * vw, y: 0.774 * vh, tilt: 4.5 },
        },
        camper: {
          camper: { x: 0, y: 0, tilt: 1.2 },
          localpal: { x: 0.243 * vw, y: -0.922 * vh, tilt: -10 },
          convertr: { x: 0.537 * vw, y: 0.903 * vh, tilt: 4.5 },
        },
        convertr: {
          convertr: { x: 0, y: 0, tilt: -0.8 },
          localpal: { x: 0.308 * vw, y: -0.926 * vh, tilt: -10 },
          camper: { x: 0.518 * vw, y: 0.911 * vh, tilt: 13.5 },
        },
      },
    },
  };
}

/**
 * The road signs while a project is open, and the project window's rail
 * around them — on the landing and on a project's own page alike.
 *
 * At rest the signs are parked by the landing's mockup numbers: left
 * edge 7.2vw, foot 9.5vh up, each 8.8vh tall, the widest (Camper) 3.563
 * times that. Open, they step back to be the way between projects
 * rather than the piece on the wall (Julio's mockup, 2026-09-21): the
 * whole stack at 0.72, tucked into the corner — left edge 2.4vw, foot
 * 4vh — which is SIGNS_OPEN, a transform from the stack's bottom-left
 * corner. Everything below follows from those numbers, as CSS, and
 * needs no measuring:
 *
 *   rail   where the signs end: 25.6vh along the stack — the widest
 *          sign is 0.72 x 3.563 x 8.8 = 22.6vh, and the open one grows
 *          to 1.2x about its middle (+2.3vh past its end) and nudges
 *          right a little. The box starts the window's `overhang`
 *          back from here, so the open sign reaches slightly over its
 *          edge and the dimmed ones stay clear (Julio's reference,
 *          2026-09-22)
 *   inset  the rail's text starts on the signs' left edge
 *   foot   the stack with the open sign grown: 4 + 0.72 x (3 x 8.8 +
 *          two gaps + the growth), vh
 */
export const SIGNS_OPEN = "translate(-4.8vw, 5.5vh) scale(0.72)";
/** The signs parked at rest, as CSS declarations: the stack's
 *  bottom-left corner on the mockup's numbers, and the corner
 *  SIGNS_OPEN steps back from. */
export const SIGNS_PARKED =
  "left: 7.2vw; bottom: 9.5vh; transform-origin: 0 100%";

export const WINDOW_LAYOUT: WindowLayout = {
  rail: "calc(2.4vw + 25.6vh)",
  inset: "2.4vw",
  foot: "31vh",
};

/** A click with a modifier key: the browser's (a new tab, a window). */
export const modified = (e: MouseEvent) =>
  e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

/** The project a plain left click on a link to one asks for, or null:
 *  anything modified, or any other link, is the browser's. */
export function clickedProject(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || modified(e)) return null;
  const a = (e.target as Element).closest("a[href]");
  return a?.getAttribute("href")?.match(/\/work\/([^/?#]+)/)?.[1] ?? null;
}

/**
 * The road signs beside the project window, on the way in and on the
 * way back — the landing's and the paper bench's alike. The way back is
 * the way in played backwards (Julio, 2026-09-26), so everything the
 * signs did as the box was picked up is undone in reverse order, on
 * the same clocks, the curves turned end for end (reverseEase):
 *
 *   in                               back (T = the whole way back)
 *   0     the print handed over      T      the print handed back
 *   0     the column fades out       T-fade the column fades in
 *   0     the stack steps back,      reveal the stack steps home, the
 *         over the move              move reversed, as the box shrinks
 *   0     the stack over the window  T      under it again
 *
 * `open` is the open project; the result is what to give the signs:
 * `selected` (the open one, held until the column comes back), `handed`
 * (the print the box is, held until the box is back on it), `over`
 * (the stack above the window while the box is up or on its way back),
 * `opened` (the stack stepped back) and `style` (the clocks and curves
 * for the stack's own transition and the column's fade).
 */
export function useSignsBeside(open: string | null, t: WindowTuning) {
  // The project on its way back, and whether its column is back yet.
  const [back, setBack] = useState<{ slug: string; column: boolean } | null>(
    null,
  );
  const [prev, setPrev] = useState(open);
  if (open !== prev) {
    setPrev(open);
    setBack(
      open === null && prev !== null ? { slug: prev, column: false } : null,
    );
  }
  const backSlug = back?.slug ?? null;
  useEffect(() => {
    if (backSlug === null) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = still ? 2 : returnMs(t);
    // From the way back's first frame, as the window times it.
    let column = 0;
    let done = 0;
    const start = requestAnimationFrame(() => {
      column = window.setTimeout(
        () => setBack((b) => b && { ...b, column: true }),
        Math.max(0, total - (still ? 1 : t.fade)),
      );
      done = window.setTimeout(() => setBack(null), total);
    });
    return () => {
      cancelAnimationFrame(start);
      window.clearTimeout(column);
      window.clearTimeout(done);
    };
    // One way back per close; the clocks are read as it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backSlug]);

  const returning = back !== null;
  const held = open ?? backSlug;
  return {
    selected: open ?? (back && !back.column ? back.slug : null),
    handed: held,
    over: held !== null,
    opened: open !== null,
    /** For the column's own timer, once it is back: out again when the
     *  box has landed on the print, unless the pointer is there. */
    returnDelay: t.fade,
    style: {
      "--signs-move": `${moveMs(t)}ms`,
      "--signs-ease": returning ? reverseEase(windowEase(t)) : windowEase(t),
      "--signs-wait": `${returning ? t.reveal : 0}ms`,
      "--rs-hand": `${t.fade}ms`,
      "--rs-hand-ease": returning ? reverseEase(FADE_EASE) : FADE_EASE,
    } as CSSProperties,
  };
}
