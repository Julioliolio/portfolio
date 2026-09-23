import type { WindowLayout } from "@portfolio/lab/window";

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
