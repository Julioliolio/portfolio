import type { ComponentType } from "react";

/**
 * The lab is the home of standalone microinteractions. Each piece lives in
 * src/pieces/<slug>/ and is registered in two places — adding a piece is
 * one folder plus one entry in this array plus one loader in loaders.ts
 * (the type there fails the build if a slug is missing).
 *
 * Why two files: this metadata is imported by server-rendered pages (the
 * lab index, generateStaticParams). If the `import()` loaders lived here
 * too, those server imports would turn every piece into a client
 * reference of every lab page, and the bundler would ship their shared
 * code (the Motion core, the cursor tuning, the stop-motion bench) on the
 * lab pages' first load — pieces that are meant to be lazy. Keeping the
 * loaders in a module only client components import keeps the pages
 * clean; scripts/check-budget.mjs flags the regression.
 *
 * Conventions:
 * - A piece's entry module default-exports a client component.
 * - Pieces are always loaded lazily via loaders.ts — never import a piece
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
};

/** What a piece's loader resolves to: its entry module. */
export type LabPieceModule = { default: ComponentType };

const pieces = [
  {
    slug: "pointer-tilt",
    title: "Pointer tilt",
    description:
      "A card that tilts toward the pointer — the pointer-tracking baseline for future pieces.",
  },
  {
    slug: "clay-cursor",
    title: "Clay cursor",
    description:
      "Live tuning bench for the site-wide clay cursor — size, lean, and settle-wobble physics.",
  },
  {
    slug: "cartel",
    title: "Cartel",
    description:
      "A lightbox street sign that watches the pointer — nine photos walked through at 12fps.",
    background: "white",
  },
  {
    slug: "motion",
    title: "Motion",
    description:
      "The stop-motion bench — one set of knobs for every entrance on the site: beat, distance, overshoot, squash, stagger.",
  },
  {
    slug: "road-signs",
    title: "Road signs",
    description:
      "The projects stack — three photographed road signs. Hovering one lifts it and steps the others back, cut at 12fps.",
    background: "white",
  },
] as const satisfies readonly LabPiece[];

/** Every registered piece, in lab-index order. */
export const registry: readonly LabPiece[] = pieces;

/** The registered slugs as a literal union — what loaders.ts is keyed by. */
export type LabSlug = (typeof pieces)[number]["slug"];
