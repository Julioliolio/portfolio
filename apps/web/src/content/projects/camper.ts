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
          text: "Camper is a brand that everyone can wear and everyone does wear: a kid fastening their velcro, a waitress in heels, a man sweeping a terrace, someone reading on the pavement, two kids on a doorstep. The film keeps cutting between people who would never share a frame, and the one thing that stays constant is what they're standing in.",
        },
        {
          type: "p",
          text: "Three rules make that true on screen. The camera stays at shin height. It never shows a face, so no one is the star. And every shot shares one light and one grain, a sunny afternoon on 35mm, so the cuts feel like one street. Its last shots take the shoes off, bare feet in the water and then in a doorway, a pair of Campers beside them: the frames where everyone really is equal.",
        },
        {
          // The cast, one loop per person, cut from the film
          // (scripts/prepare-camper-media.mjs). A row is 2.25 columns
          // tall, so a four-wide cell is the film's 16:9.
          type: "bento",
          row: 2.25,
          cells: [
            cast("beach", 8, 2, "Bare feet at the water's edge, a pair of red Camper sandals beside them"),
            cast("reader", 4, 1, "Green suede sneakers under someone reading on the pavement"),
            cast("step", 4, 1, "Two kids' sneakers on a doorstep"),
          ],
        },
        {
          // Every shot of the cut, one frame each, in order: the rules,
          // checkable (scripts/prepare-camper-media.mjs).
          type: "figure",
          figure: {
            kind: "image",
            plain: true,
            src: "/media/camper/every-shot.webp",
            aspect: 1962 / 1122,
            alt: "Every shot of the film, one frame each, in order: sixteen frames, all at shin height, no faces, the same warm afternoon light and grain.",
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
          type: "bento",
          cells: [
            {
              kind: "slot",
              w: 12,
              h: 2,
              awaits: "photo",
              need: "The whole storyboard in two or three rows, every frame in order: the film's structure at a glance.",
            },
          ],
        },
        {
          // Board → still → shot, for one moment of the film: the velcro,
          // where the shot visibly does what the still can't.
          type: "bento",
          row: 2.25,
          cells: [
            {
              kind: "slot",
              w: 4,
              h: 1,
              awaits: "photo",
              label: "Board",
              need: "The storyboard frame for the velcro.",
            },
            {
              kind: "shot",
              w: 4,
              h: 1,
              label: "Still",
              frame: "bare",
              src: "/media/camper/still-velcro.webp",
              aspect: 16 / 9,
              alt: "The still: a kid's hand reaching down to a white sneaker with coloured velcro straps",
            },
            {
              kind: "shot",
              w: 4,
              h: 1,
              label: "Shot",
              frame: "bare",
              src: "/media/camper/shot-velcro.mp4",
              poster: "/media/camper/shot-velcro.webp",
              aspect: 16 / 9,
              alt: "The shot: the same moment moving, the hand at the strap and the socked foot swinging beside the shoes",
            },
          ],
        },
        {
          type: "p",
          text: "The design work is in the choosing. A model gives you a hundred plausible people; the film only works if each one feels like someone you'd pass on the street, and if the shoe is unmistakably a Camper in every frame.",
        },
        {
          // The choosing, made visible: the rejects for one person next
          // to the one that made the film.
          type: "bento",
          row: 3,
          cells: [
            {
              kind: "slot",
              w: 8,
              h: 2,
              awaits: "photo",
              label: "Rejected",
              need: "Eight to twelve generations of the man on the ledge that didn't make it, each with a word on why: too model-like, the shoe's wrong, the light's off.",
            },
            {
              kind: "shot",
              w: 4,
              h: 2,
              label: "Kept",
              frame: "bare",
              src: "/media/camper/still-ledge.webp",
              aspect: 16 / 9,
              alt: "The one that was kept: black trousers and polished black shoes, someone sitting on a ledge with a phone",
            },
          ],
        },
        {
          // The brand's question: how the shoe stayed a Camper. Three
          // frames wide enough to see a sole or a strap.
          type: "bento",
          row: 1.5,
          cells: [
            {
              kind: "slot",
              w: 12,
              h: 2,
              awaits: "photo",
              label: "The shoe",
              need: "Three frames side by side, a line under each: a Camper catalogue shot, the generated frame of the same shoe, and a generation where the sole or strap went wrong, with how it was fixed.",
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
          text: "The sentence was the tagline: everyone is equal in their feet. Every time a shot drifted, it was because I had lost it, not because the model was wrong. Generative tools reward the same thing a real shoot does: knowing what you want before anything is generated, and being ruthless with everything that isn't it.",
        },
      ],
    },
  ],
};
