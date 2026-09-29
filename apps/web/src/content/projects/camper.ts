import type { Project } from "./types";

/**
 * Camper — a sixty-second spec film, made with generative AI at
 * 2894 Studio (August 2026). Video-first: the film carries the page,
 * the text is short. The clip in public/media is the 1080p master
 * transcoded to 720p (scripts: ffmpeg, crf 27, faststart).
 */
export const camper: Project = {
  slug: "camper",
  title: "Camper",
  tagline: "Everyone is equal in their feet.",
  summary:
    "A sixty-second spec film for Camper, made end to end with generative AI at 2894 Studio: concept, storyboard, every still, every shot and the edit.",
  meta: [
    { label: "Type", value: "Spec film · 2894 Studio, 2026" },
    {
      label: "Fields",
      value: "Concept, art direction, AI image and video generation, edit",
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
    caption: "The film. Sound on!",
  },
  contents: false,
  sections: [
    {
      id: "idea",
      label: "The idea",
      heading: "One brand, every kind of feet",
      blocks: [
        {
          type: "p",
          text: "A spec film for Camper, made at 2894 Studio, my last job. Camper is a brand that everyone can wear and everyone does wear: a kid, a grandmother, a chef, a skater, someone on their way to a wedding. The film keeps cutting between people who would never share a frame, and the one thing that stays constant is what they're standing in.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 3 / 2,
            need: "A grid of eight or nine stills, the whole cast at once.",
            caption: "The cast",
          },
        },
      ],
    },
    {
      id: "made",
      label: "How it's made",
      heading: "A storyboard, then a lot of prompts, then a lot of choosing",
      blocks: [
        {
          type: "p",
          text: "The full minute was storyboarded first, so every generation had a target. Each frame became a still, prompted across a few image models on a Flora canvas until the person, the light and the shoe matched the drawing. The stills that held up went through video models to become shots.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "One storyboard frame next to its final still.",
            caption: "Board to still",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "The Flora canvas, zoomed out enough to show the scale.",
            caption: "The canvas",
          },
        },
        {
          type: "p",
          text: "The design work is in the choosing. A model gives you a hundred plausible people; the film only works if each one feels like someone you'd pass on the street, and if the shoe is unmistakably a Camper in every frame.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Process photos: the storyboard on the desk, the canvas on screen.",
          },
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "One sentence before a hundred prompts",
      blocks: [
        {
          type: "p",
          text: "Every time a shot drifted, it was because I had lost the sentence, not because the model was wrong. Generative tools reward the same thing a real shoot does: knowing what you want before anything is generated, and being ruthless with everything that isn't it.",
        },
      ],
    },
  ],
};
