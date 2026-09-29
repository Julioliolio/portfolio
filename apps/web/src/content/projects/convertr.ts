import type { Project } from "./types";

/**
 * Convertr — the desktop video converter, spring 2026. Medium depth: the
 * live demo (apps/demos/convertr, the real UI over a mocked engine) sits
 * at the top and the text is about the one idea in the design, the
 * bounding box that morphs through every state.
 */
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
    caption:
      "The real interface. Drop a video or a GIF on it, trim, convert, drag the result out. The conversion is simulated on this page, so the file you get is a stand-in; everything you see and touch is the app.",
  },
  contents: false,
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "A little desktop app I designed and built on my own",
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
          text: "The whole design is one box. Empty, it sits in the middle of the window drawn by four guide lines, cycling through the shapes a video can have. Drop a file and it becomes the video, at the video's own proportions. Open the settings and the box gives up one side to make room, cropping the video instead of shrinking it.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "Two screens side by side: a vertical video loaded with settings under it, a landscape one with settings to the right.",
            caption: "Portrait and landscape get different apps",
          },
        },
        {
          type: "p",
          text: "Press convert and it collapses into a bar with a row of little bricks carrying the progress. When the result is ready the box steps outward and three chips hang off the corners: output size, how much smaller it got, and download, which you drag.",
        },
        {
          type: "carousel",
          hint: "Drag through the states",
          figures: [
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "Converting: the box collapsed into a bar with the bricks mid-run.",
              caption: "Converting",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "The result: the box stepped out, the dotted grid visible, the three chips on the corners.",
              caption: "Done",
            },
          ],
        },
        {
          type: "p",
          text: "Every state is the same four lines moving, so you always know where what you're looking at came from and what it's about to become. Nothing appears out of nowhere and no panel slides over another. Everything else follows the box: one accent colour, a dotted paper grid, mono labels that scramble into place, and a little spring on anything you touch.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "video",
            aspect: 16 / 10,
            need: "The box morphing through all its states in one continuous recording.",
            caption: "One box, every state",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "Side by side: the same vertical video in a typical converter (fixed panels, the video shrunk into a preview corner) and in Convertr. No product names needed.",
            caption: "Same file, two ideas of what a converter is",
          },
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
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 10,
            need: "The timeline with in and out handles set, the GIF settings open.",
            caption: "Trimming",
          },
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
          text: "Holding the code meant the box never got flattened into a normal layout. It also taught me where the design actually lives: half of the feel is in numbers tuned by watching it move, like spring stiffness and how far the result steps out, and none of that was in the design file. If I did it again I'd build the simulated engine first; it would have made every iteration much faster. Any questions? Write me, I'm always up for talking about this one.",
        },
      ],
    },
  ],
};
