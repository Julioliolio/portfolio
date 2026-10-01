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
          type: "p",
          text: "LocalPal is the app for young adults in European cities who want to do things, not just go out. The small climbing session, the running club, the gallery opening nobody posts about. It puts all of that on one map, and it puts the people going on the same map, so finding the plan and finding the company happen in one place.",
        },
        {
          type: "lede",
          text: "The research found the moment: around week nine in a new city, the welcome runs out and people start wanting specific things. Nothing serves that moment. LocalPal is built for it.",
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
            aspect: 4 / 3,
            alt: "Five platforms that tried, scored 0 to 5 on niche plans, anyone can propose, and trust and safety. Each gets one or two of the three; none gets all of them.",
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
          text: "The first month in a new city is covered. Welcome weeks, flatmate dinners, the big bars; everyone is new and everyone is available, and an app for niche plans has nothing to add. Somewhere between week six and week twelve that runs out. The novelty wears off, the friend group has settled, and people start wanting the specific things: a climbing partner, a small gallery show, a run on Sunday. That is the moment nothing serves.",
        },
        {
          type: "lede",
          text: "Around week nine, what everyone does stops being enough, and what you'd specifically like to do takes over. That's where LocalPal lives.",
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
          text: "I call it the relevance curve. It's a model, not a measurement, and it decided more than any other finding. It ruled out competing at arrival, when the app would lose to the welcome week. And it created the product's hardest problem: LocalPal has to be signed up for in week one, through the universities and student networks, and still be on the phone in week nine. Most of the decisions that follow come from that.",
        },
      ],
    },
    {
      id: "concept",
      label: "Concept",
      heading: "Plans and people on the same map",
      blocks: [
        {
          type: "p",
          text: "An app where the plans and the people are on the same map. Venues and organisations post their events, so there's something to do from day one; people post their own plans, which is why you stay. Five decisions, each answering a way the apps before it failed, each with its cost:",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              title: "Venues fill the map from day one.",
              body: "A new map starts empty, and an empty map is uninstalled. The cost: the first map is commercial, and people's own plans have to outgrow it.",
            },
            {
              title: "Anyone can propose a plan.",
              body: "Meetup and Luma turned semi-professional once organisers approved who came. The cost: no gatekeeper, so trust has to come from somewhere else.",
            },
            {
              title: "Groups, never one-to-one.",
              body: "Every interviewee worried it would turn into a dating app, and Nomadtable did. Every plan has a minimum size. The cost: a plan for two isn't possible.",
            },
            {
              title: "Verifying is a sign you'll show up.",
              body: "“People say they go and then they don't.” A university email or a QR scanned at an event, never a bank-style ID check, which young users abandon. The cost: weaker proof, so it's offered, not forced.",
            },
            {
              title: "Free between people.",
              body: "Couchsurfing's 2020 paywall and Timeleft's subscription lost their people. Money comes only where paying is already normal, a ticket or a gym. The cost: the business depends on venues and universities.",
            },
          ],
        },
        {
          type: "p",
          text: "The storyboard follows Marco, six weeks into an Erasmus in Madrid, from wanting to do something to doing it.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            { ...pic(4, 4, "storyboard-1", 1400 / 1233, "Marco dancing alone to music in his room.", "#ffffff"), label: "Wants to do something" },
            { ...pic(4, 4, "storyboard-4", 1400 / 1287, "A shrug under a cloud of question marks.", "#ffffff"), label: "Can't pin it down" },
            { ...pic(4, 4, "storyboard-5", 1400 / 782, "Three people sitting together with drinks: the plan happened.", "#ffffff"), label: "With LocalPal, he goes" },
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
            pic(5, 8, "brand-sample", 972 / 1501, "The brand sample: a portrait with the LocalPal sticker and the line, map stickers, the mark on blue, the type."),
            pic(7, 5, "fig-brand-type", 4 / 3, "“Stop scrolling. Start showing up.” set in PP Neue Montreal on the blue."),
            { ...pic(7, 3, "moodboard", 1600 / 886, "The first moodboard, darker and more angular than where the brand ended up.", "#fefefe"), label: "First direction, dropped" },
          ],
        },
        {
          type: "p",
          text: "The design system is a set of rules more than screens: depth of blue for hierarchy, white for what you can tap, squircle corners, and one motion personality with one rule: animate what you touch, never what the system reports. A pin springs when you press it; a progress bar never bounces, because a bounce would lie about where it is.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            pic(12, 6, "fig-brand-colours", 16 / 9, "The colours: the brand blue, its deep and pressed shades, lavender and ink; and the map, inverted: land, water, park, road.", "#f4f2ee"),
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
          text: "How the decisions show up in the app, each as it works in the prototype. The answer to week nine lives in the service design more than in one screen: in the blueprint, every plan ends with a check-in (“did you go?”, then “want to go again?”) that tunes what the map shows you next, so the app earns a reason to be opened before you need it.",
        },
        { type: "subhead", text: "01 · The map is the feed (decision 1: venues fill it)" },
        {
          type: "p",
          text: "The map is never gone. Lists are sheets laid over it that pull down to it, and pins and cards turn into each other when you touch them, so you never lose where you are. Zoom out and the city gathers into a count; zoom in and the pins come apart.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            phone(7, 8, "map-zoom", "Zooming out of Madrid until the pins gather into one count, then back in as they come apart."),
            bare(5, 4, "venue-pin", 720 / 902, "#eee8df", "A venue pin grows into a labelled pill, then floats over its shadow."),
            bare(5, 4, "locate", 1, "#ecf0f1", "The locate button twists when pressed and the blue dot answers with a pulse."),
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
            phone(5, 8, "search", "Typing “I want something chill tonight” on the map."),
            cell(7, 8, lp("search-sheet", "bare", "The sentence becomes Chill and Today filters, and each best match says why it fits: “Zero pressure, all mellow”.", { aspect: 716 / 700 })),
          ],
        },
        { type: "subhead", text: "03 · Going together (decision 3: groups, never one-to-one)" },
        {
          type: "p",
          text: "Big venue events show the plans of people going, so you join someone's plan rather than an anonymous event of 62 people.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            phone(5, 8, "venue", "Opening Rita's, then its live music night, then the plans of the people going together."),
            cell(7, 8, lp("going-together", "bare", "Going together: four small plans inside one big event, each with its host and how many are going.", { aspect: 716 / 900 })),
          ],
        },
        { type: "subhead", text: "04 · The confirm slider (decision 4: a sign you'll show up)" },
        {
          type: "p",
          text: "On the day, drag to confirm and you see who else has. Only the confirmed ones show, which is the answer to “people say they go and then they don't”.",
        },
        {
          type: "bento",
          row: 1,
          cells: [
            bare(7, 8, "rsvp", 900 / 1126, "#eee8df", "Dragging the knob across: the chevron turns into a check, the countdown lands, and the list of people on their way opens."),
            phone(5, 8, "dayof", "The day of a plan: sliding to RSVP on the plans sheet, in the app."),
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
            phone(6, 7, "edge", "A thumb at the right edge pulls a black goo out of it and slides up and down to zoom the map."),
            phone(6, 7, "profile", "The own profile: the tag card, friends, plans, and the QR that opens to add someone."),
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
          text: "The prototype has never been in a stranger's hands, and the riskiest bet is the one everything rests on: that seeing who has confirmed makes people show up. Six interviews found the pattern; they can't prove it. The first test I'd run is the slider with real plans: of the people who say they'll go, how many confirm on the day, and how many of those arrive.",
        },
        {
          type: "p",
          text: "What I'm most proud of is that the app doesn't feel like a research project. It feels like something you'd want on your phone.",
        },
        {
          type: "p",
          text: "Any questions? Write me, I love talking about this one.",
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
