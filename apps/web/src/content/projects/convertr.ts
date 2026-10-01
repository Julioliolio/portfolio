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

/** The app's own paper, behind a recording fitted whole into its cell. */
const PAPER = "#f6f6f4";

export const convertr: Project = {
  slug: "convertr",
  title: "Convertr",
  tagline: "A video converter where the box is the whole interface.",
  summary:
    "A desktop app that turns any video into a GIF, MP4, WebM, MOV, AVI, MKV or MP3. Drop it, trim it, drag the result out. Designed and built on my own, and the real interface runs on this page.",
  meta: [
    { label: "Type", value: "Side project · 2026" },
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
    label: "Live: the real app. Drop a video, or try the sample",
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
          text: "Convertr takes any video, dropped in or pasted as a link, and gives you back a GIF, an MP4, a WebM or whatever you need, trimmed to the bit you wanted. I made it because I was doing this by hand every week for moodboards: online tools gave no control over size, frame rate or the exact cut, and Premiere turned a ten-second job into a project. [fill in — one line of use: how many files you've run through it since June.] It's also the first app I built with AI, and a bit of an experiment: could the interface keep an idea that would normally get simplified away in a handoff?",
        },
        {
          // Spring 2026 as the copy tells it: the design, the build, then
          // the simulated engine that runs it on this page.
          type: "timeline",
          months: ["Mar", "Apr", "May", "Jun"],
          phases: [
            { label: "Design", from: 0, to: 1.5 },
            { label: "Build", from: 1, to: 3 },
            { label: "Web demo", from: 3, to: 4 },
          ],
          note: "A side project over a spring.",
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
          text: "The whole design is one box. Empty, it sits in the middle of the window drawn by four guide lines, cycling through the shapes a video can have. Drop a file and it becomes the video, at the video's own proportions.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            cell(12, 4, cv("drop", "A file carried in and dropped on the empty box; a row of bricks loads it", 1100 / 650, { frame: "bare", fit: "contain" }), PAPER),
          ],
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-compare.webp`,
            aspect: 2000 / 900,
            minWidth: 640,
            alt: "The same vertical video in a typical converter, shrunk into a preview between fixed panels, and in Convertr, where the box is the video and the settings take its other side.",
          },
        },
        {
          type: "p",
          text: "Open the settings and the box gives up a side to make room, cropping the video instead of shrinking it: a portrait video keeps its height and hands over its right, a landscape one hands over its bottom.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            cell(6, 4, cv("portrait-settings", "A vertical video dropped in; the settings open beside it", 1.6)),
            cell(6, 4, cv("landscape-settings", "A landscape video dropped in; the settings open below it", 1.6)),
          ],
        },
        {
          type: "p",
          text: "Press convert and it collapses into a bar with a row of little bricks carrying the progress. When the result is ready the box steps outward and three chips hang off the corners: output size, how much smaller it got, and download, which you drag.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            cell(12, 3, cv("converting", "Convert pressed: the video collapses into a bar and pink bricks carry the progress across", 1100 / 306, { frame: "bare" })),
            cell(12, 6, cv("result-drag", "Convert: the bricks run, the box steps out with chips on its corners, and the converted file is dragged out by its download chip", 1.25, { fit: "contain" }), PAPER),
            {
              kind: "slot",
              w: 12,
              h: 4,
              need: "In the desktop app: the result chip dragged out of Convertr and dropped into a Figma canvas, where the GIF starts playing.",
            },
          ],
        },
        {
          type: "p",
          text: "Every state is the same four lines moving, so you always know where what you're looking at came from and what it's about to become. Nothing appears out of nowhere and no panel slides over another. Three decisions hold it together:",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              title: "Crop, don't shrink.",
              body: "When the settings open, the preview gives up part of the frame rather than getting smaller, because the size you see is the decision you're making. The file itself is never cropped. The cost: with the settings open you may lose the edge you cared about; close them and it's back.",
            },
            {
              title: "No second screen.",
              body: "There is no settings page and no results page. Every feature has to be a state the four lines can move into, which is the hardest rule to keep and the reason it feels like one thing.",
            },
            {
              title: "The download is a drag.",
              body: "The result is a chip you drag to wherever it's going: a folder, a Figma file, a chat. It says DOWNLOAD on it, so it's never a mystery; dragging is just the short way.",
            },
          ],
        },
        {
          type: "p",
          text: "Everything else follows the box: one accent colour, a dotted paper grid, mono labels that scramble into place, and a little spring on anything you touch.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
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
              body: "Drop a file, paste a link, or paste a video from the clipboard. Links go through yt-dlp, so a YouTube or X link works like a file.",
            },
            {
              title: "Trim on the timeline.",
              body: "In and out handles, because the bit you want is almost never the whole clip.",
            },
            {
              title: "Seven formats, one picker.",
              body: "MP3 keeps the sound and drops the video. GIF lets you set width and frame rate, and the estimated size updates as you change them.",
            },
            {
              title: "FFmpeg underneath.",
              body: "Wrapped through a local server, shipped as an Electron build for Windows and Mac. This page swaps the engine for a simulation so it runs with nothing to install.",
            },
          ],
        },
        {
          type: "bento",
          row: 1,
          cells: [
            cell(12, 2, cv("trim", "The in handle dragged right and the out handle left on the timeline", 6, { frame: "bare" })),
            cell(6, 3, cv("format", "The format picker opening, the cursor running down the list, GIF picked", 1200 / 660, { frame: "bare" })),
            cell(6, 3, cv("gif-size", "The expected size on the video changing as the GIF's width is dragged", 600 / 330, { frame: "bare" })),
            cell(12, 1, cv("gif-width", "The GIF width slider dragged from 640 up to 1252 pixels and back", 1600 / 150, { frame: "bare" })),
          ],
        },
        {
          type: "field",
          aspect: 16 / 9,
          device: "laptop",
          need: "the Convertr window on a laptop, on a soft neutral.",
          screens: [cv("every-state", "Convertr on a laptop, going through every state: drop, settings, a format, convert, the result", 1.6)],
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
          text: "Holding the code meant the box never got flattened into a normal layout. It also taught me where the design actually lives: half of the feel is in numbers tuned by watching it move, like spring stiffness and how far the result steps out, and none of that was in the design file.",
        },
        {
          type: "p",
          text: "If I did it again I'd build the simulated engine first. It's what runs this page, and having it from day one would have made every iteration much faster.",
        },
        {
          type: "p",
          text: "Any questions? Write me, I'm always up for talking about this one.",
        },
      ],
    },
  ],
};
