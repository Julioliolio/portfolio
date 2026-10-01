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

/** The ground a phone sits on: the paper, a shade warmer. */
const FIELD = "#e7e3dc";

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

/** A whole screen of the app, in a phone. */
const phone = (w: number, h: number, name: string, alt: string): Cell =>
  cell(w, h, lp(name, "phone", alt, { aspect: 600 / 1298 }), FIELD);

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

/** One of the drawn figures, or a picture from the thesis. */
const pic = (w: number, h: number, name: string, aspect: number, alt: string, ground?: string): Cell =>
  cell(w, h, lp(name, "bare", alt, { aspect, still: true, ...(ground ? { fit: "contain" as const } : {}) }), ground);

export const localpal: Project = {
  slug: "localpal",
  title: "LocalPal",
  tagline: "Finding and organising the plans a city doesn't show you.",
  summary:
    "A map app for young adults in European cities, to find the small, niche things to do and the people to do them with. Research, concept, brand, design system and a working prototype, all done on my own.",
  meta: [
    {
      label: "Fields",
      value: "UX research, product design, interaction design, brand design",
    },
    { label: "Year", value: "2026" },
    { label: "Role", value: "Research, concept, brand, UI and prototype" },
    // Draft, a guess; Julio to correct.
    { label: "Tools", value: "Figma, Claude" },
    { label: "Live", value: "localpal.co", href: "https://localpal.co" },
  ],
  hero: {
    type: "field",
    aspect: 16 / 9,
    device: "phone",
    need: "the onboarding sticker collage on one phone, large, on the LocalPal blue.",
    screens: [
      lp("onboarding-interests", "phone", "Picking interests in the onboarding: bubbles fill blue and stickers land on the profile", {
        aspect: 600 / 1298,
      }),
    ],
  },
  contents: true,
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading:
        "LocalPal. Finding the plans a city doesn't show you, and the people to do them with",
      blocks: [
        {
          type: "p",
          text: "LocalPal is the app for young adults in European cities who want to do things, not just go out. The small climbing session, the running club, the gallery opening nobody posts about. It puts all of that on one map, and it puts the people going on the same map, so finding the plan and finding the company happen in one place.",
        },
        {
          type: "quote",
          text: "A city is much more than its obvious plans. The best ones don't exist until someone makes them happen. LocalPal is where they happen.",
          source: "The brand claim",
        },
      ],
    },
    {
      id: "scope",
      label: "Scope",
      heading: "Timeline and phases of the project",
      blocks: [
        {
          type: "p",
          text: "The project was my master's thesis at UDIT, so the research, the writing and the defence ran alongside the design work, and toward the end everything was happening at once.",
        },
        {
          type: "timeline",
          months: ["Mar", "Apr", "May", "Jun"],
          phases: [
            { label: "Interviews and analysis", from: 0, to: 2 },
            { label: "Concept and decisions", from: 1, to: 2 },
            { label: "Brand and design system", from: 1, to: 3 },
            { label: "Screens and flows", from: 2, to: 4 },
            { label: "React prototype", from: 2, to: 4 },
          ],
        },
        {
          // The reel: the prototype in use, recorded from it, silent.
          type: "bento",
          row: 1,
          cells: [
            phone(12, 7, "reel", "Thirty seconds of the prototype: picking interests, flying into the map, searching in a sentence, joining a plan, the profile"),
          ],
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
          text: "Young adults in European cities are going out differently. Clubs are closing (the UK lost over a third of its nightclubs in four years), gyms and running clubs have never been fuller, and 35% of Europeans feel lonely at least some of the time. A new kind of going out has grown from this: small, niche activities, each with a handful of people, that together weigh more than the mass offer.",
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-moment.webp`,
            aspect: 16 / 9,
            alt: "Four numbers: 35% of Europeans feel lonely at least some of the time; UK nightclubs down 37% in four years; 71.6 million gym members in Europe in 2024, a record; running clubs on Strava up 59% in 2024.",
          },
        },
        {
          type: "p",
          text: "The catch is that there is no concrete place to find any of it. Friends, Instagram and Google Maps cover the popular bars and the big concerts; the climbing session on Thursday lives in a WhatsApp group you're not in. The platforms that tried to fix it either turned into dating apps, turned semi-professional, or started charging and lost their people. In the interviews, nobody named a single one of them.",
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-platforms.webp`,
            aspect: 16 / 9,
            alt: "LocalPal and five platforms scored 0 to 5 on ten factors, from mainstream plans to whether your account lasts. LocalPal scores high on everything except people nearby, where a new map starts empty.",
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
          text: "Before talking to anyone I went through 3,993 Reddit posts from people in fifteen city and hobby communities, and coded the 526 that mattered, to know what to ask. Then six long interviews: five Erasmus students in four countries and a volunteer from a local buddy programme, each asked about the last time they did something, so I'd get stories rather than opinions.",
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
          type: "p",
          text: "Three things came out that changed the project. People never think they have a coordination problem, they think the plan was bad. Meeting strangers worries them in very specific ways: whether people show up, how exposed you feel posting alone, and whether it turns into a dating app. And the one that changed it most: nobody needs this in their first weeks.",
        },
        {
          type: "p",
          text: "The first month in a new city is covered. Welcome weeks, flatmate dinners, the big bars; everyone is new and everyone is available, and an app for niche plans has nothing to add. Somewhere between week six and week twelve that runs out. The novelty wears off, the friend group has settled, and people start wanting the specific things: a climbing partner, a small gallery show, a run on Sunday. That is the moment nothing serves, and it's where LocalPal lives.",
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-relevance-curve.webp`,
            aspect: 16 / 9,
            alt: "The relevance curve: over sixteen weeks after arriving, the obvious plans fall and the specific ones rise; they cross at week nine, inside LocalPal's window from week six to twelve. Sign-ups happen in the first five weeks, through universities and ESN.",
          },
        },
        {
          type: "p",
          text: "I call it the relevance curve, and it decided more than any other finding. It ruled out competing at arrival, when the app would lose to the welcome week. And it created the product's hardest problem: LocalPal has to be signed up for in week one, through the universities and student networks, and still be on the phone in week nine. Most of the decisions that follow come from that.",
        },
      ],
    },
    {
      id: "concept",
      label: "Concept",
      heading: "The proposed solution",
      blocks: [
        {
          type: "p",
          text: "An app where the plans and the people are on the same map. Venues and organisations post their events, so there's something to do from day one; people post their own plans, which is why you stay. Each decision answers a way the apps before it failed:",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            pic(6, 4, "fig-decision-1", 4 / 3, "01. Venues fill the map from day one. People's own plans are why you stay."),
            pic(6, 4, "fig-decision-2", 4 / 3, "02. Anyone can propose a plan. No organiser who approves who comes."),
            pic(4, 3, "fig-decision-3", 4 / 3, "03. Groups, never one-to-one. Every plan has a minimum size. It's not a dating app."),
            pic(4, 3, "fig-decision-4", 4 / 3, "04. Verifying is a sign you'll show up. A uni email or a QR at an event, never a bank-style check."),
            pic(4, 3, "fig-decision-5", 4 / 3, "05. Free between people. Money only where paying is already normal: a ticket, a gym."),
          ],
        },
        {
          type: "p",
          text: "Three people to design for, each standing for one of the problems: someone with plenty of plans who keeps doing the same ones, someone who wants to try something and doesn't know where to start, and someone who doesn't feel safe joining.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            pic(4, 5, "fig-persona-1", 0.8, "Giovanna, 22, product design, from Bologna. The initiator: three weeks in and never a free night, but she hasn't touched a football since she arrived; she's waiting for an invite."),
            pic(4, 5, "fig-persona-2", 0.8, "Martim, 21, maths, from Porto. The enthusiast: a bouldering video hooked him, and he doesn't know where to start."),
            pic(4, 5, "fig-persona-3", 0.8, "Beatrice, 23, game design, from Belfast. The cautious one: left out of her host university's group, she never joins plans."),
          ],
        },
        {
          type: "p",
          text: "Today, the urge to do something dies somewhere between finding it and pinning it down with other people. The storyboard follows Marco, six weeks into an Erasmus in Madrid, through the same evening with and without LocalPal.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            pic(4, 4, "storyboard-1", 1400 / 1233, "Storyboard, one: Marco dancing alone to music in his room.", "#ffffff"),
            pic(4, 4, "storyboard-2", 1400 / 1843, "Two: his phone lights up with something.", "#ffffff"),
            pic(4, 4, "storyboard-3", 1400 / 1108, "Three: scrolling on a cushion, looking for something to do.", "#ffffff"),
            pic(5, 4, "storyboard-4", 1400 / 1287, "Four: a shrug under a cloud of question marks.", "#ffffff"),
            pic(7, 4, "storyboard-5", 1400 / 782, "Five: three people sitting together with drinks, the plan happened.", "#ffffff"),
          ],
        },
        {
          type: "figure",
          figure: {
            kind: "image",
            src: `${M}/fig-journey.webp`,
            aspect: 16 / 9,
            alt: "The same six steps, from feeling like doing something to going: today the line ends at its lowest, the plan dies in the chat; with LocalPal it ends at the top, they go.",
          },
        },
      ],
    },
    {
      id: "brand",
      label: "Brand",
      heading:
        "A blue that means connection, and shapes that make you feel at ease",
      blocks: [
        {
          type: "p",
          text: "The brand idea is the connector: LocalPal puts people in touch with their city and with each other, and it talks like a friend with good judgement. Its line is “Stop scrolling. Start showing up.” The blue comes from the web link, the colour of connection (and quietly, the European blue). The first moodboard was much more angular, but on a phone hard shapes read cold, so it moved toward soft shapes, stickers and things that are slightly tilted.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            pic(4, 3, "fig-brand-logo", 4 / 3, "The LocalPal mark, white on the blue."),
            pic(4, 3, "fig-brand-type", 4 / 3, "“Stop scrolling. Start showing up.” set in PP Neue Montreal on the blue."),
            pic(4, 6, "brand-sample", 972 / 1501, "The brand sample: a portrait with the LocalPal sticker and the line, map stickers, the mark on blue, the type."),
            pic(8, 3, "moodboard", 1600 / 886, "The first moodboard, darker and more angular than where the brand ended up.", "#fefefe"),
          ],
        },
        {
          type: "p",
          text: "The design system is a set of rules more than screens: depth of blue for hierarchy, white for what you can tap, squircle corners, and one motion personality with one rule. Animate what you touch, never what the system reports.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            pic(8, 5, "fig-brand-colours", 16 / 9, "The colours: the brand blue, its deep and pressed shades, lavender and ink; and the map, inverted: land, water, park, road."),
            bare(4, 5, "ds-squircle", 720 / 342, "#4031fc", "A squircle's corner radius dragged up and down: every surface in the app is the same superellipse."),
          ],
        },
        {
          type: "bento",
          row: 1,
          cells: [
            bare(3, 3, "ds-press", 4 / 3, "#f0f3fd", "Press: a tile squishes on touch and springs back."),
            bare(3, 3, "ds-pop", 4 / 3, "#f0f3fd", "Pop: a circle bumps when tapped."),
            bare(3, 3, "ds-snap", 4 / 3, "#f0f3fd", "Snap: a tile clicks into its new place with a small overshoot."),
            bare(3, 3, "ds-inform", 4 / 3, "#f0f3fd", "Inform: a progress line fills with no bounce at all."),
          ],
        },
      ],
    },
    {
      id: "solution",
      label: "Solution",
      heading: "Everything happens on the map",
      blocks: [
        {
          type: "p",
          text: "Some of the things that make LocalPal different from the apps that came before it, each as it works in the prototype.",
        },
        { type: "subhead", text: "01 · The map is the feed" },
        {
          type: "p",
          text: "There is no list. Cards and sheets sit on top of the map and turn into each other when you touch them, so you never lose where you are. Zoom out and the city gathers into a count; zoom in and the pins come apart.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            phone(4, 7, "map-zoom", "Zooming out of Madrid until the pins gather into one count, then back in as they come apart."),
            bare(4, 7, "bottom-bar", 900 / 1598, "#ecf0f1", "The search pill grows into the full sheet and back; its magnifier bends into a cross."),
            bare(4, 4, "venue-pin", 720 / 902, "#eee8df", "A venue pin grows into a labelled pill, then floats over its shadow."),
            bare(4, 3, "locate", 1, "#ecf0f1", "The locate button twists when pressed and the blue dot answers with a pulse."),
          ],
        },
        { type: "subhead", text: "02 · Search in a sentence" },
        {
          type: "p",
          text: "“I want something chill tonight” works, because you have a mood and a moment, not a keyword. The sentence turns into filters you can see, and every result says why it fits.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            phone(7, 7, "search", "Typing “I want something chill tonight”: it becomes Chill, Music and Today filters, and the best matches each say why they fit."),
            bare(5, 3, "search-morph", 1, "#eee8df", "The magnifier bends into a cross, point by point, with no crossfade."),
            bare(5, 4, "cta-morph", 1, "#f3f0e6", "The card's button scrambles its label and swaps its glyph through every state."),
          ],
        },
        { type: "subhead", text: "03 · Going together" },
        {
          type: "p",
          text: "Big venue events show the plans of people going, so you join someone's plan rather than an anonymous event of 62 people.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            bare(5, 8, "venue-flow", 900 / 1598, "#ecf0f1", "The whole chain: the pin grows into the venue, a party card rises out of it, Join, confirm, joined."),
            phone(7, 8, "venue", "Opening Rita's, then its live music night, then the plans of the people going together."),
          ],
        },
        { type: "subhead", text: "04 · The confirm slider" },
        {
          type: "p",
          text: "On the day, drag to confirm and you see who else has. Only the confirmed ones show, which is the answer to “people say they go and then they don't”.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            bare(6, 7, "rsvp", 900 / 1126, "#eee8df", "Dragging the knob across: the chevron turns into a check, and the list of people on their way opens."),
            phone(6, 7, "dayof", "The day of a plan: sliding to RSVP on the plans sheet, in the app."),
          ],
        },
        { type: "subhead", text: "05 · Onboarding you play" },
        {
          type: "p",
          text: "Interests are bubbles you pick and stickers that build your profile as a collage, and then the camera flies out of the illustrated city into the real map, onto your first plan.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            bare(5, 6, "bubbles", 900 / 1126, "#f2efe5", "Interest bubbles popping out, pushing each other apart and jostling on every tap."),
            phone(4, 6, "onboarding-interests", "Picking four interests: each one drops a sticker on the profile."),
            phone(3, 6, "onboarding-flythrough", "Allowing location: the camera flies from the toy city into the real map and the tour starts."),
          ],
        },
        {
          type: "p",
          text: "And the small things nobody asks for: the edge of the screen you can pull to zoom with one thumb, the profile that leads with a QR to add people you've just met.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            bare(4, 7, "edge-zoom", 640 / 1136, "#0e1011", "A black goo pulled out of the screen's edge rides the thumb and zooms the map."),
            phone(4, 7, "profile", "The own profile: the tag card, friends, plans, and the QR that opens to add someone."),
            {
              kind: "slot",
              w: 4,
              h: 7,
              awaits: "photo",
              need: "Pere's profile tag card, close up: the route map it opens.",
            },
          ],
        },
        {
          type: "field",
          aspect: 16 / 9,
          device: "phone",
          need: "three phones on a soft neutral: the map, a search, the profile with its QR.",
          screens: [
            lp("map-zoom", "phone", "The map", { aspect: 600 / 1298 }),
            lp("search", "phone", "A search", { aspect: 600 / 1298 }),
            lp("profile", "phone", "The profile", { aspect: 600 / 1298 }),
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "What doing the whole thing by yourself really means",
      blocks: [
        {
          type: "p",
          text: "When I started I thought the product would be the easy part and the thesis the hard one. It was the other way round: the research gave me the decisions, but the product only became real when I stopped writing about it and built it, and most of what I'm proud of, the map, the slider, the onboarding, only exists because I could code it myself.",
        },
        {
          type: "p",
          text: "Had I had more time, I would have tested it. Six interviews are enough to find patterns but not to prove them, and the prototype has never been in a stranger's hands. That would be the first thing.",
        },
        {
          type: "p",
          text: "What I'm most proud of is that the app doesn't feel like a research project. It feels like something you'd want on your phone.",
        },
        {
          type: "p",
          text: "Any questions? Write me, I love talking about this one.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            {
              kind: "slot",
              w: 12,
              h: 7,
              awaits: "photo",
              need: "A photo from the defence, or of the project on screen at UDIT.",
            },
          ],
        },
      ],
    },
    {
      id: "try",
      label: "Try it",
      heading: "Everything you've seen is real, go try it",
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
