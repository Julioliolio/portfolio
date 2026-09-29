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
          text: "A spec film for Camper, made at 2894 Studio, my last job. I did all of it: the concept, the storyboard, every generated still and shot, and the edit.",
        },
        {
          type: "p",
          text: "The idea is one sentence and it is the whole film. Camper is a brand everyone can wear and everyone does wear: a kid, a grandmother, a chef, a skater, someone on their way to a wedding. The faces, the places and the lives could not be more different, and the shoes are the same. So the film keeps cutting between people who would never share a frame, and the one thing that stays constant, shot after shot, is what they are standing in.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 16 / 9,
              need: "Still from the film: one of the unexpected wearers, feet in frame.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 9,
              need: "Still from the film: a contrasting wearer, same shoe, same framing, so the pair reads as the idea.",
            },
          ],
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 3 / 2,
            need: "A grid of eight or nine stills, the whole cast at once. This is the page's second hero.",
          },
        },
      ],
    },
    {
      id: "made",
      label: "How it's made",
      heading: "A storyboard first, then a hundred prompts, then the choosing",
      blocks: [
        {
          type: "p",
          text: "Everything starts on paper: the full minute storyboarded first, who appears, in what order, where the cuts land on the music, so every generation has a target. Each frame then becomes a still, prompted and re-prompted across several image models on a Flora canvas until the person, the light and the shoe match the board. The stills that hold up go through video models to become shots, and the shots are cut against the board.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "The Flora canvas: the grid of stills with their prompts and connections visible. Zoomed out enough to show the scale of it.",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "One storyboard frame next to its final still.",
          },
        },
        {
          type: "p",
          text: "The design work is in the choosing. A model gives you a hundred plausible people; the film only works if every one of them feels like someone you'd pass on the street, and if the shoe is unmistakably a Camper in every frame. Most of the time goes on throwing things away.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Process photos: the storyboard on the desk, the canvas on screen, whatever shows the hands-on part.",
          },
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading:
        "A concept has to be one sentence before it is a hundred prompts",
      blocks: [
        {
          type: "p",
          text: "Every time a shot drifted, it was because I had lost the sentence, not because the model was wrong. Generative tools reward the same thing a shoot does: knowing exactly what you want before anything is generated, and being ruthless with everything that isn't it.",
        },
      ],
    },
  ],
};
