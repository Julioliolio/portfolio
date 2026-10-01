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
    "A desktop app that turns any video into a GIF, MP4, WebM, MOV, AVI, MKV or MP3. Drop it, trim it, drag the result out. Designed and built on my own, and the real interface runs on this page.",
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
    label: "Live: the real app. It loads a sample; drop your own",
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
            plain(cell(12, 6, cv("drop", "A file carried in and dropped on the empty box; a row of bricks loads it, and the box snaps to the video's own shape", 1100 / 826, { frame: "bare", fit: "contain" }))),
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
          text: "Open the settings and the box gives up a side to make room, cropping the video instead of shrinking it: a portrait video keeps its height and hands over its right, a landscape one hands over its bottom. The small frame inside the settings is the output preview: the file at the size, frame rate and dithering it will have, before you convert.",
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
            cell(12, 7, cv("landscape-settings", "A landscape video dropped in; the settings open below it", 1.6)),
          ],
        },
        {
          type: "p",
          text: "Press convert and it collapses into a bar with a row of little bricks carrying the progress. When the result is ready the box steps outward and three chips hang off the corners: output size, how much it changed against the original, and download, which you drag.",
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
              title: "FFmpeg underneath,",
              body: "in an Electron app for Windows and Mac; this page runs a simulation instead.",
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
            cell(6, 7, cv("format", "The format picker opening, the cursor running down the list, GIF picked", 1200 / 660, { frame: "bare" })),
            cell(12, 3, cv("trim", "The in handle dragged right and the out handle left on the timeline", 8, { frame: "bare" })),
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
