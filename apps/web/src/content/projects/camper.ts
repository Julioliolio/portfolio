import type { Cell, Project } from "./types";

/** A person from the film, as a loop (public/media/camper/cast-*). */
const cast = (name: string, w: number, h: number, alt: string): Cell => ({
  kind: "shot",
  w,
  h,
  frame: "bare",
  src: `/media/camper/cast-${name}.mp4`,
  poster: `/media/camper/cast-${name}.webp`,
  aspect: 16 / 9,
  alt,
});

/** A shoe, close, as a loop (public/media/camper/shoe-*). */
const shoe = (name: string, alt: string): Cell => ({
  kind: "shot",
  w: 4,
  h: 1,
  frame: "bare",
  src: `/media/camper/shoe-${name}.mp4`,
  poster: `/media/camper/shoe-${name}.webp`,
  aspect: 4 / 3,
  alt,
});

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
    // Draft: only Flora is from the copy; Julio to correct.
    { label: "Tools", value: "Flora, After Effects, Premiere" },
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
          // The cast, one loop per person, cut from the film
          // (scripts/prepare-camper-media.mjs). A row is 2.25 columns
          // tall, so a four-wide cell is the film's 16:9.
          type: "bento",
          row: 2.25,
          cells: [
            cast("velcro", 4, 1, "A kid's hand pressing the velcro of a white sneaker shut"),
            cast("heels", 4, 1, "Black heels at the foot of a café bar"),
            cast("broom", 4, 1, "Green sneakers and a broom on a terrace"),
            cast("reader", 8, 2, "Green suede sneakers under someone reading on the pavement"),
            cast("sofa", 4, 1, "Black sandals, feet up on a sofa by an open window"),
            cast("market", 4, 1, "Sandals at a market stall"),
            cast("kitchen", 4, 1, "Black shoes on a tiled kitchen floor"),
            cast("arcade", 4, 1, "Someone walking through a sunlit arcade"),
            cast("step", 4, 1, "Two kids' sneakers on a doorstep"),
          ],
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
          // Board → still → shot, for one moment of the film.
          type: "bento",
          row: 2.25,
          cells: [
            {
              kind: "slot",
              w: 4,
              h: 1,
              awaits: "photo",
              need: "The storyboard frame for the beach shot.",
            },
            {
              kind: "shot",
              w: 4,
              h: 1,
              frame: "bare",
              src: "/media/camper/still-beach.webp",
              aspect: 16 / 9,
              alt: "The still: a bare foot beside a pair of red Camper sandals at the water's edge",
            },
            {
              kind: "shot",
              w: 4,
              h: 1,
              frame: "bare",
              src: "/media/camper/shot-beach.mp4",
              poster: "/media/camper/shot-beach.webp",
              aspect: 16 / 9,
              alt: "The shot: the same moment moving, a wave reaching the sandals",
            },
          ],
        },
        {
          type: "bento",
          cells: [
            {
              kind: "slot",
              w: 12,
              h: 3,
              awaits: "photo",
              need: "The Flora canvas, zoomed out enough to show the scale.",
            },
          ],
        },
        {
          type: "p",
          text: "The design work is in the choosing. A model gives you a hundred plausible people; the film only works if each one feels like someone you'd pass on the street, and if the shoe is unmistakably a Camper in every frame.",
        },
        {
          // The shoe, close, across the film. A row is three columns
          // tall: a four-wide cell is 4:3, the crops' shape.
          type: "bento",
          row: 3,
          cells: [
            shoe("velcro", "White velcro sneakers with red, blue and green straps"),
            shoe("heels", "Black block-heeled Mary Janes"),
            shoe("reader", "Green suede sneakers with gum soles"),
            shoe("sofa", "Black leather sandals, feet up on a sofa"),
            shoe("beach", "Red and blue kids' sandals in the surf"),
            shoe("step", "Pink running shoes with blue soles"),
          ],
        },
        {
          type: "bento",
          cells: [
            {
              kind: "slot",
              w: 12,
              h: 3,
              awaits: "photo",
              need: "Process photos: the storyboard on the desk, the canvas on screen.",
            },
          ],
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
