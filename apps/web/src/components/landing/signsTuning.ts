"use client";

import { useEffect, useState } from "react";

/**
 * The road signs at the landing's sizes — shared with a project's own
 * page (ProjectPage), which parks the same stack in the same place.
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
