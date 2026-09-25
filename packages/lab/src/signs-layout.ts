"use client";

import { useEffect, useState } from "react";
import type { WindowLayout } from "./window";

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
 * The road signs tuned to the mockup: each sign 8.8vh tall, and every
 * pixel value of the defaults (which were tuned at 64px) scaled with it,
 * so the walk feels the same at any size. A wide print is 62vw across
 * (Julio's mockup, 2026-09-25), the column's right edge 2.6vw in from
 * the screen's, and its centre line 26.6vh above the stack's middle —
 * about the screen's middle. The stage reaches the screen's right edge,
 * so the column can slide in from off it.
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
    printW: 0.62 * vw,
    columnRight: 0.026 * vw,
    peekGap: 0.035 * vh,
    cardSpan,
    cardY: -0.266 * vh,
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

export const WINDOW_LAYOUT: WindowLayout = {
  rail: "calc(2.4vw + 25.6vh)",
  inset: "2.4vw",
  foot: "31vh",
};
