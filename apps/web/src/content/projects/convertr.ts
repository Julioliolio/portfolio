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
    "A desktop app that turns any video into a GIF, MP4, WebM, MOV, AVI, MKV or MP3 — drop it, trim it, drag the result out. Designed and built solo; the real UI runs live on this page.",
  meta: [
    { label: "Type", value: "Side project · 2026" },
    { label: "Fields", value: "Product design, interaction design, desktop" },
    { label: "Role", value: "Design and build, solo" },
    { label: "Stack", value: "Solid.js, Electron, FFmpeg, yt-dlp" },
  ],
  hero: {
    kind: "demo",
    demo: "convertr",
    title: "Convertr",
    variant: "desktop",
    caption:
      "The real interface, live. Drop a video or a GIF onto it; the conversion engine is simulated in the browser, everything else is the app.",
  },
  contents: false,
  sections: [
    {
      id: "why",
      label: "Why",
      heading: "I convert a lot of videos for moodboards",
      blocks: [
        {
          type: "lede",
          text: "Convertr is a desktop app that takes any video — dropped in or fetched from a URL — and gives you back a GIF, an MP4, a WebM, whatever you need, trimmed to the bit you wanted.",
        },
        {
          // Spring 2026, roughly, as the copy tells it — the design, the
          // build, then the mocked engine that runs it on this page. The
          // months are a first guess; confirm.
          type: "timeline",
          months: ["Mar", "Apr", "May", "Jun"],
          phases: [
            { label: "Design", from: 0, to: 1.5 },
            { label: "Build", from: 1, to: 3 },
            { label: "Mocked engine for the web", from: 3, to: 4 },
          ],
          note: "A side project over a spring.",
        },
        {
          type: "p",
          text: "I made it because I was doing this by hand every week. Building moodboards means collecting a lot of motion, and most of it needs to become a GIF or a smaller MP4 before it is useful. The online tools gave me no control over size, frame rate or the exact cut; the tool that gave me control, Premiere, turned a ten-second job into a project. I wanted something in between that felt like nothing at all: paste the video, convert, drag the result out onto the desktop, done.",
        },
        {
          type: "p",
          text: "It was also an exercise. It is my first vibecoded app, and I wanted to see how far the design could be pushed when I was the one holding the code — whether I could make the interface do the thing I would have specced and then watched get simplified away.",
        },
      ],
    },
    {
      id: "box",
      label: "The box",
      heading: "One bounding box, morphing through everything",
      blocks: [
        {
          type: "p",
          text: "The whole design is one box. When the app is idle, the box sits in the middle of the window drawn by four guide lines and corner crosshairs, cycling through the shapes a video can be — widescreen, vertical, four-by-three, square — one step per spin of the cross. Drop a file on it and the box becomes a loading bar. Then it becomes the video, sized to the video's own aspect. Open the settings and the box gives up one dimension to make room, cropping the video instead of shrinking it, so it stays big. Press convert and it collapses into a bar again with a row of bricks carrying the progress. And when the result lands, the box steps outward, the dotted grid shows around the media, and three chips hang off the corners: the output size, the delta against the original, and download — which you drag.",
        },
        {
          type: "carousel",
          hint: "Drag through the states",
          figures: [
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "Screen: the idle state — the box drawn by guide lines and crosshairs, the 'DROP A FILE OR PASTE A URL' hint.",
              caption: "Idle: four guide lines, cycling through the shapes.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "Screen: the editor with a vertical video loaded, the box narrow and tall, the format dropdown open.",
              caption: "Loaded: the box takes the video's own aspect.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "Screen: converting — the box collapsed into a bar with the carrier bricks mid-run.",
              caption: "Converting: a bar again, bricks carrying the progress.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 10,
              need: "Screen: the result — the box stepped out, the dotted grid visible, OUTPUT SIZE, delta and DOWNLOAD chips on the corners.",
              caption: "The result: stepped out, chips on the corners.",
            },
          ],
        },
        {
          type: "p",
          text: "That is the part I care about. Every state is the same four lines moving, so you always know where the thing you're looking at came from and what it will become. Nothing appears from nowhere, no panel slides over another. The content decides the shape of the interface, not the other way round — a portrait video and a landscape one get different apps, and the settings panel sits to the right of one and under the other. The rest of the language follows the box: one accent, a hot pink on warm grey, a dotted paper grid, mono labels that scramble into place, and springs on anything you touch.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "A strip of five or six frames of the box morphing: idle → bar → video → settings open → converting → result. Screen recordings stitched, or the Paper design file's frames.",
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
              body: "Drop a file, paste a URL, or paste a video from the clipboard. The URL path runs through yt-dlp, so a YouTube or X link is as good as a file.",
            },
            {
              title: "Trim on the timeline.",
              body: "A scrubbable timeline with in and out handles, because the bit you want is almost never the whole clip.",
            },
            {
              title: "Seven formats, one picker.",
              body: "GIF, MP4, WebM, MOV, AVI, MKV and MP3 — picking MP3 strips the video and keeps the sound. GIF exposes width and frame rate; the estimate of the output size updates as you change them.",
            },
            {
              title: "FFmpeg underneath.",
              body: "The desktop app wraps FFmpeg through a local server and ships as an Electron build for Windows and Mac. The version on this page replaces that engine with a simulation so the full flow runs in the browser with nothing to install.",
            },
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "What building it myself changed",
      blocks: [
        {
          type: "p",
          text: "Holding the code meant the box never got simplified into a normal layout, which would have happened in any handoff — it is the kind of idea that survives only if the person who wants it is the person implementing it. It also meant learning where the design actually lives: half of the feel is in numbers I tuned by watching it move, spring stiffness and stagger delays and how far the result steps out, and none of that was in the design file.",
        },
        {
          type: "p",
          text: "If I did it again I would build the mocked engine first. Having the whole flow run without FFmpeg, which I only did to embed it here, would have made every iteration on the interface ten times faster from the start.",
        },
      ],
    },
  ],
};
