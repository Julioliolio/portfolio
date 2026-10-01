import type { Cell, Project, Shot } from "./types";

/**
 * Convertr — the desktop video converter, spring 2026. Medium depth: the
 * live demo (apps/demos/convertr, the real UI over a mocked engine) sits
 * at the top and the text is about the one idea in the design, the
 * bounding box that morphs through every state.
 *
 * Media (docs/media-plan.md): recorded from the demo with the clay
 * cursor (scripts/record-media.mjs); the videos dropped in are the X
 * clips Julio picked (source-assets/convertr-footage/).
 */

const M = "/media/convertr";

/** A recording of the demo (scripts/record-media.mjs). */
function cv(name: string, alt: string, aspect: number, more: Partial<Shot> = {}): Shot {
  return { src: `${M}/${name}.mp4`, poster: `${M}/${name}.webp`, frame: "screen", alt, aspect, ...more };
}
const cell = (w: number, h: number, shot: Shot, ground?: string): Cell => ({ kind: "shot", w, h, ground, ...shot });
/** An app recording with its own screen as its edge: no cell around it. */
const plain = (c: Cell): Cell => ({ ...c, plain: true });


export const convertr: Project = {
  slug: "convertr",
  title: "Convertr",
  tagline: "A video converter where the box is the whole interface.",
  summary:
    "A desktop app that turns any video into the GIF or file you need. Drop it, trim it, drag the result out. I designed and built it, and the real app runs on this page.",
  meta: [
    { label: "Type", value: "Side project · spring 2026" },
    {
      label: "Fields",
      value: "Product design, interaction design, desktop, build",
    },
    { label: "Role", value: "Design and build" },
    { label: "Stack", value: "Solid.js, Electron, FFmpeg, yt-dlp" },
    // Draft, a guess; Julio to correct.
    { label: "Tools", value: "Figma, Claude" },
  ],
  hero: {
    kind: "demo",
    demo: "convertr",
    title: "Convertr",
    variant: "desktop",
    query: "?autosample",
    label: "Live: the real app. Only the conversion is faked",
    caption:
      "The real interface. Drop a video or a GIF on it, trim, convert, drag the result out. The conversion is simulated on this page, so the file you get is a stand-in; everything you see and touch is the app.",
  },
  contents: false,
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "Ten seconds of video shouldn't need Premiere",
      blocks: [
        {
          type: "p",
          text: "Every week I turned clips into GIFs for moodboards. Online tools gave me no control, and Premiere turned a ten-second job into a project. So I built my own.",
        },
        {
          type: "p",
          text: "[fill in — how many files you've run through it since June.]",
        },
        {
          type: "p",
          text: "It was also my first app built with AI, and a test: can a design idea survive when the designer also writes the code?",
        },
      ],
    },
    {
      id: "box",
      label: "The box",
      heading:
        "The video decides the shape of the app, not the other way round",
      blocks: [
        {
          type: "p",
          text: "The whole app is one box. Empty, it cycles through the shapes a video can have. Drop a file and it becomes the video.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            plain({ ...cell(12, 6, cv("drop", "A file carried in and dropped on the empty box; a row of bricks loads it, and the box snaps to the video's own shape", 1100 / 826, { frame: "bare", fit: "contain" })), label: "Drop a file: the box takes its shape" }),
            {
              kind: "slot",
              w: 12,
              h: 4,
              awaits: "photo",
              label: "Tried first",
              need: "Two or three early layouts from the design file that didn't survive, with a line on why each one died.",
            },
          ],
        },
        {
          type: "p",
          text: "Open the settings and the video doesn't shrink. It crops, and the settings take the space.",
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-compare.webp`,
            plain: true,
            aspect: 2000 / 900,
            narrow: { src: `${M}/fig-compare-narrow.webp`, aspect: 1000 / 1500 },
            alt: "The same vertical video in a typical converter, shrunk into a preview between fixed panels, and in Convertr, where the box is the video and the settings take its other side.",
          },
        },
        {
          type: "bento",
          row: 1,
          cells: [
            { ...cell(12, 7, cv("landscape-settings", "A landscape video dropped in; the settings open below it", 1.6)), label: "Landscape: the settings go underneath" },
          ],
        },
        {
          type: "bento",
          row: 1,
          cells: [
            { ...cell(7, 6, cv("result-drag", "The last bricks land, the box steps out with chips on its corners, and the converted file is dragged out by its download chip", 1.25)), label: "Convert, then drag the file out" },
            {
              kind: "slot",
              w: 5,
              h: 6,
              need: "In the desktop app: the result chip dragged out of Convertr and dropped into a Figma canvas, where the GIF starts playing.",
            },
          ],
        },
        {
          type: "p",
          text: "Nothing pops in or slides over. Every screen is the same box changing shape.",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              title: "Crop, don't shrink.",
              body: "The video keeps its size; the settings take the leftover space.",
            },
            {
              title: "No second screen.",
              body: "No settings page, no results page. Just the box.",
            },
            {
              title: "The download is a drag.",
              body: "Pull the file straight into a folder, Figma or a chat.",
            },
          ],
        },
      ],
    },
    {
      id: "details",
      label: "Details",
      heading: "The small things it does",
      blocks: [
        {
          type: "list",
          style: "bulleted",
          items: [
            {
              title: "Three ways in.",
              body: "Drop a file, paste a video, or paste a YouTube or X link.",
            },
            {
              title: "Trim on the timeline.",
              body: "Because the bit you want is never the whole clip.",
            },
            {
              title: "Seven formats, one picker.",
              body: "For a GIF, set the size and frame rate and watch the file size update.",
            },
          ],
        },
        {
          type: "bento",
          row: 0.5,
          cells: [
            {
              kind: "slot",
              w: 6,
              h: 7,
              need: "Pasting an X link in the desktop app: yt-dlp fetches it and it lands in the box like a file.",
            },
            { ...cell(6, 7, cv("format", "The format picker opening, the cursor running down the list, GIF picked", 1200 / 660, { frame: "bare" })), label: "Seven formats, one picker" },
            { ...cell(12, 3, cv("trim", "The in handle dragged right and the out handle left on the timeline", 8, { frame: "bare" })), label: "Trim" },
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "The box only survived because I was also the one building it",
      blocks: [
        {
          type: "p",
          text: "Holding the code meant the box never got flattened into a normal layout. Half the feel is in numbers tuned by watching it move, and none of that was in the design file.",
        },
        {
          type: "p",
          text: "If I did it again I'd build the simulated engine first. It's what runs this page, and it would have made every iteration faster.",
        },
      ],
    },
  ],
};
