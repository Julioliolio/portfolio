import type { ComponentType } from "react";

/**
 * The lab is the home of standalone microinteractions. Each piece lives in
 * src/pieces/<slug>/ and is registered here — adding a piece is one folder
 * plus one entry in this array.
 *
 * Conventions:
 * - A piece's entry module default-exports a client component.
 * - Pieces are always loaded lazily via `load()` — never import a piece
 *   directly from the portfolio.
 * - Animation: use `motion` (`motion/react`). If a piece needs gsap, load it
 *   inside the piece with `await import("gsap")` so it never lands in the
 *   shared bundle.
 */

export type LabPiece = {
  slug: string;
  title: string;
  description?: string;
  /** Stage background for the piece's lab page; default follows the site
   *  theme. "white" is the studio wall — for pieces whose read depends on
   *  it (e.g. a cast shadow). */
  background?: "white";
  load: () => Promise<{ default: ComponentType }>;
};

export const registry: LabPiece[] = [
  {
    slug: "pointer-tilt",
    title: "Pointer tilt",
    description:
      "A card that tilts toward the pointer — the pointer-tracking baseline for future pieces.",
    load: () => import("./pieces/pointer-tilt"),
  },
  {
    slug: "clay-cursor",
    title: "Clay cursor",
    description:
      "Live tuning bench for the site-wide clay cursor — size, lean, and settle-wobble physics.",
    load: () => import("./pieces/clay-cursor"),
  },
  {
    slug: "cartel",
    title: "Cartel",
    description:
      "A lightbox street sign that watches the pointer — nine photos walked through at 12fps.",
    background: "white",
    load: () => import("./pieces/cartel"),
  },
  {
    slug: "motion",
    title: "Motion",
    description:
      "The stop-motion bench — one set of knobs for every entrance on the site: beat, distance, overshoot, squash, stagger.",
    load: () => import("./pieces/motion"),
  },
  {
    slug: "road-signs",
    title: "Road signs",
    description:
      "The projects stack — three photographed road signs. Hovering one lifts it and steps the others back, cut at 12fps.",
    background: "white",
    load: () => import("./pieces/road-signs"),
  },
];
