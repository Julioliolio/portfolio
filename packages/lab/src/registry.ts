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
 * - Animation: use `motion` (`motion/react`), inside the piece, so nothing
 *   heavy lands in the shared bundle.
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
    slug: "hello",
    title: "Hello screen",
    description:
      "The home page's first screen, full size — where the sign sits and how big, the row and the words, tuned live.",
    background: "white",
  },
  {
    slug: "greeting",
    title: "Greeting",
    description:
      "The greeting's words under the pointer — the letters' stamp, tilt, hairline, swing, clock and wave, tuned live. Exactly the home page's hover.",
    background: "white",
  },
  {
    slug: "boil",
    title: "Boil",
    description:
      "Every boil on the site under one set of knobs — the scroll cue's words and the hero's lit letters, wobbling in held frames: rate, wait, shove, wave and grain, tuned live.",
  },
  {
    slug: "sound",
    title: "Sound",
    description:
      "The site's sounds under one set of knobs — the greeting's felt-piano letters to hover, every one-shot to preview, and the bed that can play under the landing, switchable to hear the letters with and without it.",
    background: "white",
  },
  {
    slug: "road-signs",
    title: "Road signs",
    description:
      "The projects stack — three photographed road signs. Hovering one lifts it and steps the others back, cut at 12fps.",
    background: "white",
  },
  {
    slug: "window",
    title: "Project window",
    description:
      "The case study's window beside the signs — the sheet's cuts in from the right, the rail's width, the hairline on its edge — tuned live.",
    background: "white",
  },
  {
    slug: "ransom-note",
    title: "Ransom note",
    description:
      "Type set in cut-out letters — every character a scrap off a seeded roll, landed in stop-motion cuts, pulled about by the pointer in held frames, boiling at rest. After Arlan's study; the chaos, the layout and the pointer, tuned live.",
    background: "white",
  },
  {
    slug: "type",
    title: "Type",
    description:
      "The project pages' type, set on Camper's words at full size — the title as the image, labels and hairlines, big reading text, one blue. The title fitted to the width or at a fixed scale, to pick by eye.",
    background: "white",
  },
  {
    slug: "contents",
    title: "Contents",
    description:
      "A page's contents as a column of stops on a capsule of the ink, the chapter being read broken out of it in blue — @drawsgood's gooey pill nav stood on end for the window's rail. The blue runs through the column as the page is read, or to the stop under the pointer; eased, not cut. The rows' proportions, the gap, the goo and the speeds, tuned live.",
    background: "white",
  },
] as const satisfies readonly LabPiece[];

/** Every registered piece, in lab-index order. */
export const registry: readonly LabPiece[] = pieces;

/** The registered slugs as a literal union — what loaders.ts is keyed by. */
export type LabSlug = (typeof pieces)[number]["slug"];
