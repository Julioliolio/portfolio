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
];
