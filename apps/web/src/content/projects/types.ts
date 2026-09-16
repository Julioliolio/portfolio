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
      /** Caption under the box once the real image is in; optional
       *  while it is a placeholder. */
      caption?: string;
    }
  | {
      kind: "image";
      src: string;
      alt: string;
      aspect: number;
      caption?: string;
    }
  | {
      kind: "video";
      src: string;
      poster?: string;
      aspect: number;
      /** Autoplaying loops are muted and controls-free; a film has
       *  controls and sound. */
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
  | { type: "p"; text: string }
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
  /** Several figures side by side (two or three), wrapping on phones. */
  | { type: "figures"; figures: Figure[] };

export type Section = {
  /** Anchor id, used by the table of contents. */
  id: string;
  /** Sentence-style, the way a heading reads in conversation. */
  heading: string;
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
  hero: Figure;
  /** Long case studies get a table of contents; short ones do not. */
  contents: boolean;
  sections: Section[];
};
