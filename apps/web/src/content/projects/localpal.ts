import type { Cell, Project, Shot } from "./types";

/**
 * LocalPal — the master's thesis, told as the project it was: what it
 * is, the scope, the problem, the research and the relevance curve it
 * produced, the concept, the brand, the app, then the prototype to try.
 * The full research lives in the thesis PDF, linked at the bottom.
 * Source: JULIO_ROMERO_MEMORIA_TFM (UDIT, 2026) — its data, quotes and
 * personas are in source-assets/localpal-tfm/REPORT.md.
 *
 * Media (docs/media-plan.md): the clips are recorded from the prototype
 * itself (scripts/record-media.mjs) — bare components on the ground
 * they were recorded on, whole screens in a drawn phone; the figures are
 * the thesis's, redrawn in English (scripts/make-figures.mjs).
 */

const M = "/media/localpal";

/** A clip or still from public/media/localpal. */
function lp(
  name: string,
  frame: Shot["frame"],
  alt: string,
  more: Partial<Shot> & { aspect: number; still?: boolean },
): Shot {
  const { still, ...rest } = more;
  return still
    ? { src: `${M}/${name}.webp`, frame, alt, ...rest }
    : { src: `${M}/${name}.mp4`, poster: `${M}/${name}.webp`, frame, alt, ...rest };
}

/** A bento cell holding a shot. */
const cell = (w: number, h: number, shot: Shot, ground?: string): Cell => ({
  kind: "shot",
  w,
  h,
  ground,
  ...shot,
});

/** A whole screen of the app, in a phone, straight on the paper. */
const phone = (w: number, h: number, name: string, alt: string): Cell =>
  cell(w, h, lp(name, "phone", alt, { aspect: 600 / 1298 }));

/** A component alone, filling its cell: the cell crops only the flat
 *  background it was recorded on, so the cell's shape is free as long
 *  as the component fits. */
const bare = (
  w: number,
  h: number,
  name: string,
  aspect: number,
  ground: string,
  alt: string,
): Cell => cell(w, h, lp(name, "bare", alt, { aspect }), ground);

/** A picture with its own edge (on transparency): no cell, on the paper. */
const drawing = (w: number, h: number, name: string, aspect: number, alt: string): Cell => ({
  ...cell(w, h, lp(name, "bare", alt, { aspect, still: true, fit: "contain" })),
  plain: true,
});

/** One of the drawn figures, or a picture from the thesis. */
const pic = (w: number, h: number, name: string, aspect: number, alt: string, ground?: string): Cell =>
  cell(w, h, lp(name, "bare", alt, { aspect, still: true, ...(ground ? { fit: "contain" as const } : {}) }), ground);

export const localpal: Project = {
  slug: "localpal",
  title: "LocalPal",
  tagline: "Finding and organising the plans a city doesn't show you.",
  summary:
    "Research, brand, design and a working prototype, all on my own.",
  meta: [
    {
      label: "Fields",
      value: "UX research, product design, interaction design, brand design",
    },
    { label: "When", value: "Mar–Jun 2026, solo" },
    { label: "Role", value: "Research, concept, brand, UI and prototype" },
    // Draft from the repo (React + MapLibre, a CLAUDE.md in the
    // prototype); Julio to confirm the wording.
    { label: "Tools", value: "Figma; React and MapLibre, built with Claude Code" },
    { label: "Live", value: "localpal.co", href: "https://localpal.co" },
  ],
  hero: {
    type: "field",
    aspect: 16 / 9,
    device: "phone",
    need: "one phone in hand on a Madrid street, the map on screen.",
    screens: [
      lp("map-zoom", "phone", "LocalPal's map of Madrid, venues and people as pins", { aspect: 600 / 1298, still: true }),
    ],
  },
  contents: true,
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "For when the welcome weeks are over",
      blocks: [
        {
          type: "lede",
          text: "Around week nine in a new city, the welcome runs out and people want something specific. LocalPal is a map of the small plans — a climbing session, a running club, the gallery opening nobody posts about — and the people going.",
        },
      ],
    },
    {
      id: "problem",
      label: "Problem",
      heading: "A whole new way of going out, and no door into it",
      blocks: [
        {
          type: "p",
          text: "People are swapping nightclubs for running clubs, and a third of Europe feels lonely:",
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-moment.webp`,
            plain: true,
            aspect: 16 / 9,
            alt: "Four numbers: 35% of Europeans feel lonely at least some of the time; UK nightclubs down 37% in four years; 71.6 million gym members in Europe in 2024, a record; running clubs on Strava up 59% in 2024.",
          },
        },
        {
          type: "p",
          text: "The catch: these small plans are hard to find. Instagram and Google Maps cover the big bars; the climbing session on Thursday lives in a WhatsApp group you're not in. In the interviews, nobody named a single app for it.",
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-platforms.webp`,
            plain: true,
            aspect: 1200 / 960,
            narrow: { src: `${M}/fig-platforms-narrow.webp`, aspect: 900 / 1240 },
            alt: "Five platforms that tried, scored 0 to 5 on niche plans, anyone can propose, and trust and safety. Each gets one or two of the three; none gets all of them. LocalPal's row, dashed, is what it's designed for, untested.",
          },
        },
      ],
    },
    {
      id: "research",
      label: "Research",
      heading: "Talking to people who had just moved",
      blocks: [
        {
          type: "p",
          text: "First I read hundreds of Reddit posts from people who had just moved, to learn what to ask. Then six long interviews about the last plan they actually went to.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            pic(4, 5, "fig-quote-1", 0.8, "“What I find hardest is finding something, or someone, to do things that aren't the standard ones. Nobody tells me to go to Matadero. But I knew everything about every party.” An Erasmus student in Madrid."),
            pic(4, 5, "fig-quote-2", 0.8, "“People say they go and then they don't. If I say I go, then I will go.” An Erasmus student in Finland."),
            pic(4, 5, "fig-quote-3", 0.8, "“I'll wait to be invited. I'm not going to play alone.” An Erasmus student in Madrid, on football."),
          ],
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-relevance-curve.webp`,
            plain: true,
            aspect: 16 / 9,
            narrow: { src: `${M}/fig-relevance-curve-narrow.webp`, aspect: 900 / 1000 },
            alt: "The relevance curve: over sixteen weeks after arriving, the obvious plans fall and the specific ones rise; they cross at week nine, inside LocalPal's window from week six to twelve. Sign-ups happen in the first five weeks, through universities and ESN.",
          },
        },
        {
          type: "p",
          text: "I call it the relevance curve: people sign up in week one but need it most in week nine. LocalPal has to catch them early and still matter later.",
        },
      ],
    },
    {
      id: "concept",
      label: "Concept",
      heading: "Five rules from apps that failed",
      blocks: [
        {
          type: "list",
          style: "numbered",
          items: [
            { title: "Venues fill the map.", body: "So it's never empty on day one." },
            { title: "Anyone can propose a plan.", body: "No organiser deciding who gets in." },
            { title: "Groups, never one-to-one.", body: "So it can't turn into a dating app." },
            { title: "Verified means you'll show up.", body: "A uni email or a QR at an event, never a bank-style check." },
            { title: "Free between people.", body: "Money only where it's already normal: a ticket, a gym." },
          ],
        },
        {
          type: "p",
          text: "The storyboard follows Marco, six weeks into an Erasmus in Madrid: he wants to do something, can't pin it down, and with LocalPal, goes.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            drawing(4, 4, "storyboard-1", 1400 / 1233, "Marco dancing alone to music in his room."),
            drawing(4, 4, "storyboard-4", 1400 / 1287, "A shrug under a cloud of question marks."),
            drawing(4, 4, "storyboard-5", 1400 / 782, "Three people sitting together with drinks: the plan happened."),
          ],
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-journey.webp`,
            plain: true,
            aspect: 16 / 9,
            alt: "The same six steps, from feeling like doing something to going: today the line ends at its lowest, the plan dies in the chat; the LocalPal line, dashed because it's designed for and untested, ends at the top.",
          },
        },
      ],
    },
    {
      id: "brand",
      label: "Brand",
      heading:
        "Friendly, playful, link blue",
      blocks: [
        {
          type: "p",
          text: "It talks like a friend with good judgement. The blue is the colour of a web link: connection. The first moodboard, darker and angular, was dropped.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            drawing(5, 8, "brand-sample", 972 / 1501, "The brand sample: a portrait with the LocalPal sticker and the line, map stickers, the mark on blue, the type."),
            pic(7, 5, "fig-brand-type", 4 / 3, "“Stop scrolling. Start showing up.” set in PP Neue Montreal on the blue."),
            drawing(7, 3, "moodboard", 1600 / 886, "The first moodboard, darker and more angular than where the brand ended up."),
          ],
        },
        {
          type: "p",
          text: "Things you tap bounce, like the tile on the left. Things that load never do, like the bar on the right: a bouncy loading bar would lie.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            bare(6, 4, "ds-press", 4 / 3, "#f0f3fd", "A tile pressed: it squishes and springs back."),
            bare(6, 4, "ds-inform", 4 / 3, "#f0f3fd", "A progress line filling, calm, with no bounce at all."),
            drawing(12, 5, "fig-brand-colours", 16 / 9, "The colours: the brand blue, its deep and pressed shades, lavender and ink; and the map, inverted: land, water, park, road."),
          ],
        },
      ],
    },
    {
      id: "solution",
      label: "Solution",
      heading: "Everything happens on the map",
      blocks: [
        { type: "subhead", text: "01 · The map is the feed" },
        {
          type: "p",
          text: "No feed to scroll. Everything opens on top of the map.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            phone(4, 8, "map-zoom", "Zooming out of Madrid until the pins gather into one count, then back in as they come apart."),
            bare(8, 4, "venue-pin", 720 / 902, "#eee8df", "A venue pin grows into a labelled pill, then floats over its shadow."),
            bare(8, 4, "locate", 1, "#ecf0f1", "The locate button twists when pressed and the blue dot answers with a pulse."),
          ],
        },
        { type: "subhead", text: "02 · Search in a sentence" },
        {
          type: "p",
          text: "“I want something chill tonight” works, because you have a mood, not a keyword. Every result says why it fits.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            phone(4, 8, "search", "Typing “I want something chill tonight” on the map."),
            cell(8, 8, lp("search-sheet", "bare", "The sentence becomes Chill and Today filters, and each best match says why it fits: “Zero pressure, all mellow”.", { aspect: 716 / 700 })),
          ],
        },
        { type: "subhead", text: "03 · Going together" },
        {
          type: "p",
          text: "Every big event shows the small groups going. You join a few people, not a crowd of 62.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            { ...phone(4, 8, "venue", "Opening Rita's, then its live music night, then the plans of the people going together."), start: 5 },
          ],
        },
        { type: "subhead", text: "04 · Showing up" },
        {
          type: "p",
          text: "Verify with a uni email to join plans. On the day, slide to confirm and see who else did.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            phone(4, 8, "verify", "Verifying with a university email: the address typed, the code filled in, “You're verified”."),
            cell(8, 8, lp("rsvp", "bare", "Dragging the knob across: the chevron turns into a check, the countdown lands, and the list of people on their way opens.", { aspect: 900 / 1126, fit: "contain" }), "#eee8df"),
          ],
        },
        { type: "subhead", text: "05 · Sign-up as a game" },
        {
          type: "p",
          text: "Pick interests as bubbles; each drops a sticker on your profile. Then the camera flies out of the cartoon city into the real map.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            { ...phone(4, 8, "onboarding-interests", "Picking four interests: each one drops a sticker on the profile."), start: 3 },
            phone(4, 8, "onboarding-flythrough", "Allowing location: the camera flies from the cartoon city into the real map and the tour starts."),
          ],
        },
        { type: "subhead", text: "06 · The loop" },
        {
          type: "p",
          text: "Designed, not built yet: after every plan, a check-in that tunes the map.",
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            plain: true,
            src: `${M}/fig-loop.webp`,
            aspect: 16 / 9,
            alt: "The loop: week one, sign up through the university or ESN; the map, venues from day one; join a plan, a group; go, confirm on the day; check in, did you go; again, want to go again tunes the map. In the middle: week nine, the map already knows what you like. From the service blueprint, not built in the prototype.",
          },
        },
        { type: "subhead", text: "07 · Small things" },
        {
          type: "p",
          text: "Pull the screen's edge to zoom with one thumb. Your profile leads with a QR, for the people you just met.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            { ...phone(4, 8, "edge", "A thumb at the right edge pulls a black goo out of it and slides up and down to zoom the map."), start: 3 },
            phone(4, 8, "profile", "The own profile: the tag card, friends, plans, and the QR that opens to add someone."),
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "The thesis wasn't the hard part",
      blocks: [
        {
          type: "p",
          text: "The product was, and it only became real when I stopped writing about it and built it. It's never been in a stranger's hands. The riskiest bet: do people who say yes actually turn up? What I'm proudest of: it doesn't feel like a research project. It feels like something you'd want on your phone.",
        },
      ],
    },
    {
      id: "try",
      label: "Try it",
      heading: "It's live. Go try it",
      blocks: [
        {
          type: "figure",
          figure: {
            kind: "demo",
            demo: "localpal",
            title: "LocalPal prototype",
            variant: "phone",
            query: "?embed",
            caption:
              "Tap a pin, search in a full sentence, join a plan. And try dragging the right edge of the screen.",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "link",
            aspect: 6,
            need: "The thesis PDF.",
          },
        },
      ],
    },
  ],
};
