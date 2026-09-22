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
 * so the walk feels the same at any size. The card is 44vw wide, its
 * right edge lands at 89vw, and it sits with its middle 26.6vh above
 * the stack's — up beside the signs rather than level with them.
 */
export function signsTuning(vw: number, vh: number) {
  const height = 0.088 * vh;
  const k = height / 64;
  const cardWide = 0.44 * vw;
  // The stage runs from the stack's left edge to the card's right edge:
  // 89vw - (7.2vw - padX), with padX = 0.6 * height. cardSpan is what the
  // stage adds past the stack's padded box (widest sign * 3.563 + 2 padX).
  const stackW = 3.563 * height + 1.2 * height;
  const cardSpan = 0.818 * vw + 0.6 * height - stackW;
  return {
    height,
    gap: 12 * k,
    dimGap: 8 * k,
    hoverNudge: 6 * k,
    nudgePush: 16 * k,
    cardWide,
    cardTall: (cardWide * 300) / 640,
    cardSpan,
    cardY: -0.266 * vh,
    ropeInset: 24 * k,
    sagRest: 44 * k,
    sagNudge: 8 * k,
  };
}
