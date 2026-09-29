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

type LabPiece = {
  slug: string;
  title: string;
  description?: string;
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
  },
  {
    slug: "greeting",
    title: "Greeting",
    description:
      "The greeting's words under the pointer — the letters' stamp, tilt, hairline, swing, clock and wave, tuned live. Exactly the home page's hover.",
  },
  {
    slug: "boil",
    title: "Boil",
    description:
      "The boil under one set of knobs — the hero's lit letters wobbling in held frames: rate, shove, wave and grain, tuned live.",
  },
  {
    slug: "sound",
    title: "Sound",
    description:
      "The site's sounds under one set of knobs — the greeting's felt-piano letters to hover, every one-shot to preview, and the bed that can play under the landing, switchable to hear the letters with and without it.",
  },
  {
    slug: "brand-sign",
    title: "Brand plate",
    description:
      "The small Julio(liolio) lightbox, the site's home mark, fixed in the upper-left of the projects screen and the project pages — its size, its place and its shadow, tuned live.",
  },
  {
    slug: "sign-travel",
    title: "Sign travel",
    description:
      "The home page cut down to the sign's travel: the two screens, snapped, the sign in its row and the brand plate in its corner — scroll, and the sign leaves for the corner and becomes the plate, seven poses on a spring, on the beat, or squashed by the scroll itself; the feel, the path, each pose's size and place, tuned live.",
  },
  {
    slug: "road-signs",
    title: "Road signs",
    description:
      "The projects stack — three photographed road signs. Hovering one lifts it and steps the others back, cut at 12fps.",
  },
  {
    slug: "paper",
    title: "Paper",
    description:
      "The projects screen on the mat, whole: the signs, the prints' column they bring out, and the sheet a print is picked up into — the move, the paper, the page's look on it, the column's sizes and clocks, tuned live.",
  },
  {
    slug: "sheet",
    title: "Sheet",
    description:
      "The sheet at the site's size — paper with the scan as its texture, lying on the mat at a lean under its shadows and its light, its edges cut rather than drawn, the cut lit, one corner off the mat; its size, its lean, its cut, its paper, tuned live.",
  },
  {
    slug: "ink",
    title: "Ink",
    description:
      "Parked: the type treated as printed on the sheet — the grain thinning the strokes, the edges bleeding, the hand bearing down, the ink soaking in, the impression — each a switch, and whether the photos, films and demos are printed too. Only this page puts it on; the site's sheet is paper alone.",
  },
  {
    slug: "window",
    title: "Project window",
    description:
      "The case study's window beside the signs — the box growing out of a card's clip, the margin round it, the hairline on its edge — tuned live.",
  },
  {
    slug: "ransom-note",
    title: "Ransom note",
    description:
      "Type set in cut-out letters — every character a scrap off a seeded roll, landed in stop-motion cuts, pulled about by the pointer in held frames, boiling at rest. After Arlan's study; the chaos, the layout and the pointer, tuned live.",
  },
  {
    slug: "type",
    title: "Type",
    description:
      "The project pages' type, set on Camper's words at full size — the title as the image, labels and hairlines, big reading text, one blue. The title fitted to the width or at a fixed scale, to pick by eye.",
  },
  {
    slug: "contents",
    title: "Contents",
    description:
      "A page's contents as a text selection, after Julio's Framer site: the chapters as words on the paper, the ones read so far selected — a blue box sweeping across each word, ragged and overlapping like lines dragged over — and the row under the pointer selected on its own, a little askew. The selection's shape, the sweep and its spring, tuned live; Column brings back the goo column it replaced, @drawsgood's pill nav stood on end.",
  },
  {
    slug: "cue",
    title: "Scroll cue",
    description:
      "The landing's scroll cue — the arrow between its parens, parting for the words under the pointer. At size on stand-in screens and three times over; the glyph, the words and the held cuts, tuned live. A switch at the top flips to the pill sketch — the arrow in a squircle that turns blue and opens on a spring — with its own knobs.",
  },
  {
    slug: "tape-arrow",
    title: "Tape arrow",
    description:
      "The landing's scroll cue as a strip of paper tape stuck to the mat — peeling off toward the camera under the pointer, its shadow falling on the words that appear under its tip, nudging while it waits. At size on stand-in screens and three times over; the peel, the shadows, the words, the idle and the entrance, tuned live.",
  },
] as const satisfies readonly LabPiece[];

/** Every registered piece, in lab-index order. */
export const registry: readonly LabPiece[] = pieces;

/** The registered slugs as a literal union — what loaders.ts is keyed by. */
export type LabSlug = (typeof pieces)[number]["slug"];
