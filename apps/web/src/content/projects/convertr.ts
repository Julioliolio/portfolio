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
    "A desktop app that turns any video into a GIF, MP4, WebM, MOV, AVI, MKV or MP3. Drop it, trim it, drag the result out. Designed and built solo, and the real interface runs on this page.",
  meta: [
    { label: "Type", value: "Side project · 2026" },
    {
      label: "Fields",
      value: "Product design, interaction design, desktop, build",
    },
    { label: "Role", value: "Design and build, solo" },
    { label: "Stack", value: "Solid.js, Electron, FFmpeg, yt-dlp" },
  ],
  hero: {
    kind: "demo",
    demo: "convertr",
    title: "Convertr",
    variant: "desktop",
    caption:
      "The real interface. Drop a video or a GIF on it, trim, convert, drag the result out. On this page the engine is simulated, so the flow is real and the file that comes out is a stand-in.",
  },
  contents: false,
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "A desktop app I designed and built alone",
      blocks: [
        {
          type: "lede",
          text: "Convertr takes any video, dropped in or pasted as a link, and gives you back a GIF, an MP4, a WebM, whatever you need, trimmed to the bit you wanted.",
        },
        {
          type: "p",
          text: "I made it because I was doing this by hand every week. Moodboards need a lot of motion, and most of it has to become a GIF or a smaller MP4 before it's useful. Online tools give no control over size, frame rate or the exact cut; Premiere gives all the control and turns a ten-second job into a project. Convertr is the thing in between: paste the video, convert, drag the result onto the desktop, done. [fill in — one line of use: how many files you've run through it since June.]",
        },
        {
          type: "p",
          text: "It is also my first app built with AI, and the test was whether the interface could keep an idea that a normal handoff would have simplified away.",
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
          text: "The whole design is one box. Idle, it sits in the middle of the window, drawn by four guide lines and corner crosshairs, cycling through the shapes a video can be: widescreen, vertical, four-by-three, square. Drop a file and the box becomes a loading bar. Then it becomes the video, at the video's own proportions. Open the settings and the box gives up one side to make room, cropping the video instead of shrinking it, so it stays big. Press convert and it collapses into a bar again, with a row of bricks carrying the progress. When the result lands, the box steps outward, a dotted grid appears around it, and three chips hang off the corners: the output size, how much smaller it got, and download, which you drag.",
        },
        {
          type: "carousel",
          hint: "Drag through the states",
          figures: [
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "Idle: the box drawn by guide lines and crosshairs, the 'DROP A FILE OR PASTE A URL' hint.",
              caption: "Idle: four lines, cycling through the shapes.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "The editor with a vertical video loaded, the box narrow and tall, the format dropdown open.",
              caption: "Loaded: the box takes the video's own shape.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "Converting: the box collapsed into a bar with the bricks mid-run.",
              caption: "Converting: a bar again, bricks carrying the progress.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "The result: the box stepped out, the dotted grid visible, size, delta and DOWNLOAD chips on the corners.",
              caption: "Done: stepped out, chips on the corners.",
            },
          ],
        },
        {
          type: "p",
          text: "Every state is the same four lines moving, so you always know where the thing you're looking at came from and what it will become. Nothing appears from nowhere and no panel slides over another. A portrait video and a landscape one get different apps: the settings sit to the right of one and under the other. Everything else follows the box: one accent, a hot pink on warm grey, a dotted paper grid, mono labels that scramble into place, and a spring on anything you touch.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "Side by side: the same vertical video loaded in a typical converter (fixed panels, the video shrunk into a preview corner) and in Convertr (the box takes the video's shape). No product names needed.",
            caption: "Same file, two ideas of what a converter is.",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "video",
            aspect: 16 / 10,
            need: "The box morphing through all six states: idle, bar, video, settings open, converting, result. One continuous screen recording.",
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
              body: "A scrubbable timeline with in and out handles, because the bit you want is almost never the whole clip.",
            },
            {
              title: "Seven formats, one picker.",
              body: "GIF, MP4, WebM, MOV, AVI, MKV and MP3. Picking MP3 keeps the sound and drops the video. GIF exposes width and frame rate, and the estimated output size updates as you change them.",
            },
            {
              title: "FFmpeg underneath.",
              body: "The desktop app wraps FFmpeg through a local server and ships as an Electron build for Windows and Mac. The version on this page swaps that engine for a simulation, so the whole flow runs in the browser with nothing to install.",
            },
          ],
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "The timeline with in and out handles set.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "The GIF settings with width, frame rate and the size estimate.",
            },
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "The box only exists because the designer was the developer",
      blocks: [
        {
          type: "p",
          text: "Holding the code meant the box never got flattened into a normal layout, which is what happens to this kind of idea in a handoff. It also showed me where the design actually lives: half of the feel is in numbers tuned by watching it move (spring stiffness, stagger delays, how far the result steps out), and none of that was in the design file.",
        },
        {
          type: "p",
          text: "If I did it again I'd build the simulated engine first. Having the whole flow run without FFmpeg, which I only did to put it on this page, would have made every iteration on the interface ten times faster from the start.",
        },
      ],
    },
  ],
};
