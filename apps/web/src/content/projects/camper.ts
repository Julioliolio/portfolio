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
    "An unofficial one-minute ad for Camper, made with AI. The work was in the choosing.",
  meta: [
    { label: "Type", value: "Unofficial ad, made on my own while at 2894 Studio · 2026" },
    {
      label: "Fields",
      value: "Concept, art direction, AI image and video generation, edit",
    },
      // Draft: only Flora is from the copy; Julio to correct.
    { label: "Tools", value: "Flora (AI image and video), After Effects, Premiere" },
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
      heading: "Different people, same shoes",
      blocks: [
        {
          type: "p",
          text: "In the film, everyone wears Camper. It cuts between people who'd never share a frame. Only the shoes stay the same. Three rules:",
        },
        {
          type: "list",
          style: "bulleted",
          items: [
            { title: "Shin height.", body: "Always, so the shoes lead." },
            { title: "No faces.", body: "So no one is the star." },
            { title: "One afternoon.", body: "One warm light, like a single roll of old film." },
          ],
        },
        {
          type: "p",
          text: "It ends with the shoes off: the one frame where everyone really is equal. Below that, every shot in order, to check the rules against.",
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
          type: "bento",
          row: 1,
          cells: [
            {
              kind: "shot",
              w: 12,
              h: 7,
              plain: true,
              frame: "bare",
              fit: "contain",
              src: "/media/camper/every-shot.webp",
              aspect: 1962 / 1122,
              alt: "Every shot of the film, one frame each, in order: sixteen frames, all at shin height, no faces, the same warm afternoon light and grain.",
            },
          ],
        },
      ],
    },
    {
      id: "made",
      label: "How it's made",
      heading: "The work is in the choosing",
      blocks: [
        {
          type: "p",
          text: "I drew a storyboard first, so every AI image had a target. Here's one moment, from board to still to shot:",
        },
        {
          type: "bento",
          cells: [
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
              need: "The storyboard frame for the velcro.",
            },
            {
              kind: "shot",
              w: 4,
              h: 1,
              frame: "bare",
              src: "/media/camper/still-velcro.webp",
              aspect: 16 / 9,
              alt: "The still: a kid's hand reaching down to a white sneaker with coloured velcro straps",
            },
            {
              kind: "shot",
              w: 4,
              h: 1,
              frame: "bare",
              src: "/media/camper/shot-velcro.mp4",
              poster: "/media/camper/shot-velcro.webp",
              aspect: 16 / 9,
              alt: "The shot: the same moment moving, the hand at the strap and the socked foot swinging beside the shoes",
            },
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
          type: "p",
          text: "AI gives you a hundred believable people. The job is picking the one who looks like a stranger on your street, in a shoe that's unmistakably Camper. The rejects for one of them, and the one I kept:",
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
              need: "Eight to twelve generations of the man on the ledge that didn't make it, each with a word on why: too model-like, the shoe's wrong, the light's off.",
            },
            {
              kind: "shot",
              w: 4,
              h: 2,
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
          text: "When a shot felt off, it was never the AI. I'd lost sight of “everyone is equal in their feet.”",
        },
        {
          type: "p",
          text: "[fill in — roughly how many generations the 16 shots took, and what came of the film.]",
        },
      ],
    },
  ],
};
