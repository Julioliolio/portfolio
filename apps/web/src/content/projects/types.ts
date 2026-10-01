/**
 * The shape of a case study. Copy lives in one module per project
 * (localpal.ts, convertr.ts, camper.ts), the page template
 * (components/work/CaseStudy.tsx) renders whatever it is given, and
 * index.ts orders the three so each page knows which one comes next.
 *
 * Media is deliberately abstract: a `placeholder` figure is a grey box
 * that names the photo it is waiting for, so the pages can be read and
 * reviewed before a single image exists. Swapping one for an `image`
 * or `video` figure is a one-line change in the content module.
 */

export type Figure =
  | {
      kind: "placeholder";
      /** width / height of the box, so the layout holds its shape. */
      aspect: number;
      /** What goes here, in plain words — shown inside the box. */
      need: string;
      /** What the box stands in for, if not a photo: a clip, or a link
       *  still to be made (the thesis PDF). */
      awaits?: "video" | "link";
      /** Caption under the box once the real image is in; optional
       *  while it is a placeholder. */
      caption?: string;
    }
  | {
      kind: "image";
      /** A public/ path; the template routes it through asset(). */
      src: `/${string}`;
      alt: string;
      aspect: number;
      caption?: string;
      /** A chart too fine to shrink: below this width (px) it keeps the
       *  width and scrolls sideways instead. */
      minWidth?: number;
      /** On transparency, with edges of its own: no box behind it. */
      plain?: boolean;
      /** A version laid out for a phone (≤700px), swapped in there. */
      narrow?: { src: `/${string}`; aspect: number };
    }
  | {
      kind: "video";
      src: `/${string}`;
      poster?: `/${string}`;
      aspect: number;
      /** Autoplaying loops are muted and controls-free; a film has
       *  sound and the site's player (components/work/FilmPlayer.tsx). */
      mode: "loop" | "film";
      caption?: string;
    }
  | {
      kind: "demo";
      demo: string;
      title: string;
      variant: "phone" | "desktop";
      query?: string;
      caption?: string;
    };

export type Block =
  /** A paragraph; `lead` is a run-in title set in ink before it. */
  | { type: "p"; text: string; lead?: string }
  /** A heading inside a section, where one part turns into the next. */
  | { type: "subhead"; text: string }
  /** A short lead paragraph, set larger than body text. */
  | { type: "lede"; text: string }
  /** Numbered or bulleted items, each with a bold title and a body. */
  | {
      type: "list";
      style: "numbered" | "bulleted";
      items: { title: string; body: string }[];
    }
  /** A pulled quote — from an interview, or the brand claim. */
  | { type: "quote"; text: string; source?: string }
  /** One figure, full width of the column. */
  | { type: "figure"; figure: Figure }
  /** Several figures side by side (two or three), each with its own
   *  caption under it, wrapping on phones. */
  | { type: "figures"; figures: Figure[] }
  /** The project's scope as a timeline: phases as bars over a row of
   *  months. `from` and `to` are month indices into `months`, `to`
   *  exclusive, so { from: 0, to: 2 } spans the first two. */
  | {
      type: "timeline";
      months: string[];
      phases: { label: string; from: number; to: number }[];
      /** A line under the bars — what the timeline stands for. */
      note?: string;
    }
  /** A row of figures wider than the column, dragged through
   *  sideways; each figure's caption sits under it. */
  | { type: "carousel"; figures: Figure[]; hint?: string }
  /** A bento, after wavn: cells of different sizes straight on the
   *  paper, each a loop, a still or a marked slot on its own ground.
   *  One cell is fine — a single clip set the same way. */
  | { type: "bento"; cells: Cell[]; row?: number }
  /** A screen on a field of colour: a marked slot for a photo-real
   *  device mockup (Julio's), with the screen standing in until then. */
  | {
      type: "field";
      aspect: number;
      ground?: string;
      need: string;
      screens: Shot[];
      device: "phone" | "laptop";
    };

/**
 * A bento cell. `w` is its width in the bento's twelve columns, `h` its
 * height in rows; a row is `row` columns tall (the bento's, default 2),
 * so the cells keep their shapes at any width. On a phone the bento is
 * two columns: cells six wide or more take both.
 */
export type Cell = {
  w: number;
  h: number;
  /** The column it starts at (1–12), to place a cell off the left edge:
   *  two phones side by side in the middle, say. Desktop only. */
  start?: number;
  /** The cell's ground, behind a bare component or a phone. Matches the
   *  background the clip was recorded on, so the two read as one. */
  ground?: string;
  /** No cell at all: the picture already has its own edge (a drawing on
   *  transparency, an app's own screen), so it sits on the paper. */
  plain?: boolean;
} & (
  | ({ kind: "shot" } & Shot)
  | { kind: "slot"; need: string; awaits?: "video" | "photo" }
);

/**
 * A recorded clip or still. `bare` fills the cell; `phone` sits a drawn
 * phone in the middle of it, the screen inside; `screen` is a
 * desktop recording, edge to edge.
 */
export type Shot = {
  src: `/${string}`;
  poster?: `/${string}`;
  /** width / height of the recording itself. */
  aspect: number;
  frame: "bare" | "phone" | "screen";
  alt: string;
  /** Where the clip's subject sits if the cell crops it (object-position). */
  focus?: string;
  /** "contain": the whole recording, on the cell's ground (set it to the
   *  recording's own background), for a cell shaped differently. */
  fit?: "contain";
};

export type Section = {
  /** Anchor id, used by the table of contents. */
  id: string;
  /** A word or two for the note in the section's margin, and for the
   *  contents on a page without chapters: "Research", "The problem". */
  label: string;
  /** Sentence-style, the way a heading reads in conversation. */
  heading: string;
  /** Set on the section a chapter starts at: the contents then list the
   *  chapters — a stop each, leading to this section — instead of every
   *  section. For the long pages; without any, each section is a stop. */
  chapter?: string;
  blocks: Block[];
};

export type Project = {
  slug: string;
  title: string;
  /** One line under the title — what it is, in a breath. */
  tagline: string;
  /** For <title> and the description meta. */
  summary: string;
  /** The label/value pairs beside the title: type, year, role… A value
   *  with an href renders as a link. */
  meta: { label: string; value: string; href?: string }[];
  /** The picture the page opens on: a figure, or a field/bento set the
   *  same way as one in a section. */
  hero: Figure | Extract<Block, { type: "bento" | "field" }>;
  /** Long case studies get a table of contents; short ones do not. */
  contents: boolean;
  sections: Section[];
};
