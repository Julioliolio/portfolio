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


export const convertr: Project = {
  slug: "convertr",
  title: "Convertr",
  tagline: "A video converter that takes the shape of your video.",
  summary:
    "A desktop app that turns any video into the GIF or file you need. Drop it, trim it, drag the result out. I designed and built it, and the real app runs at the top of this page; only the conversion is pretend.",
  meta: [
    { label: "Type", value: "Side project · spring 2026" },
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
          text: "Every week I turned clips into GIFs for moodboards. Online tools gave me no control, and Adobe Premiere turned a ten-second job into a project. So I built my own. [fill in — I've run N files through it since June.]",
        },
        {
          type: "p",
          text: "It was also my first app built with AI, and a test: if the designer writes the code, can an app with no screens, just one box that changes shape, survive?",
        },
      ],
    },
    {
      id: "box",
      label: "The box",
      heading:
        "One box, every shape",
      blocks: [
        {
          type: "p",
          text: "The whole app is one box. No settings page, no results page. Empty, it cycles through every shape a video can take. Drop a file and it becomes yours.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            cell(12, 6, cv("drop", "A file carried in and dropped on the empty box; a row of bricks loads it, and the box snaps to the video's own shape", 1100 / 826, { fit: "contain" })),
            {
              kind: "slot",
              w: 12,
              h: 4,
              awaits: "photo",
              need: "Two or three early layouts from the design file that didn't survive, with a line on why each one died.",
            },
          ],
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
          type: "p",
          text: "Open the settings and the video doesn't shrink: it crops, and the settings take the space. A landscape video gets them underneath.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            cell(12, 7, cv("landscape-settings", "A landscape video dropped in; the settings open below it", 1.6)),
          ],
        },
        {
          type: "p",
          text: "Convert, and the box steps out with the result. The download is a drag: pull the file straight into a folder, Figma or a chat.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            cell(7, 6, cv("result-drag", "The last bricks land, the box steps out with chips on its corners, and the converted file is dragged out by its download chip", 1.25)),
            {
              kind: "slot",
              w: 5,
              h: 6,
              need: "In the desktop app: the result chip dragged out of Convertr and dropped into a Figma canvas, where the GIF starts playing.",
            },
          ],
        },
      ],
    },
    {
      id: "details",
      label: "Details",
      heading: "The small things",
      blocks: [
        {
          type: "p",
          text: "Three ways in: drop a file, paste a video, or paste a link. Seven formats in one picker. And a trim, because the bit you want is never the whole clip.",
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
            cell(6, 7, cv("format", "The format picker opening, the cursor running down the list, GIF picked", 1200 / 660)),
            cell(12, 3, cv("trim", "The in handle dragged right and the out handle left on the timeline", 8)),
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "Writing the code kept the idea alive",
      blocks: [
        {
          type: "p",
          text: "No handoff, so nobody could quietly swap the box for a standard layout. Half the feel came from tweaking timings while watching it move, and none of that was in the design file.",
        },
        {
          type: "p",
          text: "Next time I'd build a fake engine first, like the one running this page, so I could try every idea in seconds.",
        },
      ],
    },
  ],
};
