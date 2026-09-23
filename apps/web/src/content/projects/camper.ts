import type { Project } from "./types";

/**
 * Camper — a sixty-second proposal film, made with generative AI at
 * 2894 Studio (August 2026). Video-first: the film carries the page,
 * the text is short. The clip in public/media is the 1080p master
 * transcoded to 720p (scripts: ffmpeg, crf 27, faststart).
 */
export const camper: Project = {
  slug: "camper",
  title: "Camper",
  tagline: "Everyone is equal in their feet.",
  summary:
    "A sixty-second proposal film for Camper, made end to end with generative AI at 2894 Studio: concept, storyboard, every still and every shot.",
  meta: [
    { label: "Type", value: "Proposal film · 2894 Studio, 2026" },
    {
      label: "Fields",
      value: "Concept, storyboard, AI image and video generation, edit",
    },
    { label: "Role", value: "All of it" },
    { label: "Length", value: "60 seconds" },
  ],
  hero: {
    kind: "video",
    src: "/media/camper.mp4",
    poster: "/media/camper-poster.webp",
    aspect: 16 / 9,
    mode: "film",
    caption: "The film. Sound on.",
  },
  contents: false,
  sections: [
    {
      id: "idea",
      label: "The idea",
      heading: "One brand, every kind of feet",
      blocks: [
        {
          type: "lede",
          text: "A proposal for Camper made at my last job, 2894 Studio, where I did all of it: the concept, the storyboard, every generated still and every generated shot, and the edit.",
        },
        {
          type: "p",
          text: "The idea is simple and it is the whole film: Camper is a brand that everyone can wear and everyone does wear. A kid, a grandmother, a chef, a skater, someone on their way to a wedding — the faces, the places and the lives could not be more different, and the shoes are the same. Whatever else separates people, they are equal in their feet. So the film keeps cutting between people who would never share a frame, and the one thing that stays constant, shot after shot, is what they are standing in.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 16 / 9,
              need: "Still from the film: one of the 'unexpected' wearers, feet in frame.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 9,
              need: "Still from the film: a contrasting wearer, same shoe, same framing — so the pair reads as the idea.",
            },
          ],
        },
      ],
    },
    {
      id: "process",
      label: "Process",
      heading: "From a storyboard to sixty seconds",
      blocks: [
        {
          type: "p",
          text: "It started on paper. I storyboarded the full minute first — who appears, in what order, where the cuts land on the music — so that generating anything had a target. Then each frame became a still: prompts written and rewritten across a mix of image models until the person, the light and the shoe matched the board, laid out on one big canvas so I could see the whole cast at once and keep them consistent. The stills that held up were pushed through video models to become the shots, and the shots were cut against the board in the edit.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Photo of the canvas where the stills were generated: the grid of images with their prompts visible.",
          },
        },
        {
          type: "p",
          text: "Working this way, the design work is in the choosing. A model will give you a hundred plausible people; the film only works if every one of them feels like a real person you'd pass on the street, and if the shoe is unmistakably a Camper in every single frame. Most of the time went on the discarding.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "One frame of the storyboard, ideally the sketch next to its final still.",
            },
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "A prompt → still → video-frame triptych for one shot.",
            },
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "What it taught me",
      blocks: [
        {
          type: "p",
          text: "That a concept has to be one sentence before it is a hundred prompts. Every time a shot drifted, it was because I had lost the sentence, not because the model was wrong. And that generative tools reward the same thing a shoot does: knowing exactly what you want before the camera rolls, and being ruthless with everything that isn't it.",
        },
      ],
    },
  ],
};
