import type { Project } from "./types";

/**
 * LocalPal — the master's thesis, told as the project it was: what it
 * is, the scope, the problem, the research and the relevance curve it
 * produced, the concept, the brand, the app, then the prototype to try.
 * The full research lives in the thesis PDF, linked at the bottom.
 * Source: JULIO_ROMERO_MEMORIA_TFM (UDIT, 2026); the figures the
 * placeholders ask for are its figures, or the prototype's screens.
 */
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
    { label: "Live", value: "localpal.co", href: "https://localpal.co" },
  ],
  hero: {
    kind: "placeholder",
    aspect: 16 / 9,
    need: "The onboarding sticker collage on one phone, large, on the LocalPal blue.",
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
          text: "LocalPal is the app for young adults who have just landed in a European city and want to do things, not just go out. The small climbing session, the running club, the gallery opening nobody posts about. It puts all of that on one map, and it puts the people going on the same map, so finding the plan and finding the company happen in one place.",
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
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "video",
            aspect: 16 / 9,
            need: "A 30-second reel of the prototype in use. Cut to music.",
            caption: "The product in thirty seconds. Sound on!",
          },
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
          text: "Young adults in European cities are going out less and doing more. Nightlife has been shrinking for a decade, climbing gyms and running clubs are full, and 35% of Europeans say they feel lonely at least some of the time. A new industry has grown around this: small, niche activities, each with a handful of people, that together weigh more than the mass offer.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Figure: the 'cultural moment' board (fig2_momento_cultural.svg).",
            caption: "Nightlife down, sports and loneliness up",
          },
        },
        {
          type: "p",
          text: "The catch is that there is no concrete place to find any of it. Friends, Instagram and Google Maps cover the popular bars and the big concerts; the climbing session on Thursday lives in a WhatsApp group you're not in. And the platforms that tried to fix it either turned into dating apps or into something semi-professional.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 10,
            need: "Figure: the competitive landscape (fig4_panorama_competitivo.svg).",
            caption: "Eleven platforms, none in the gap",
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
          text: "To understand it from the inside I did six long interviews with Erasmus students in four countries, asking each of them about the last time they did something, so I'd get stories rather than opinions. Before that, a quick pass through a few hundred Reddit threads from people who had just moved, to know what to ask.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "One image with three quote cards from the interviews, in the interviewees' words.",
            caption: "Six interviews, four countries",
          },
        },
        {
          type: "p",
          text: "Three things came out. People never think they have a coordination problem, they think the plan was bad. Meeting strangers worries them in very specific ways: whether people show up, how exposed you feel posting alone, and whether it turns into a dating app. And the one that changed the project the most: nobody needs this in their first week.",
        },
        {
          type: "p",
          text: "The first month in a new city is covered. Welcome weeks, flatmate dinners, the big bars; everyone is new and everyone is available, and an app for niche plans has nothing to add. Around week six that runs out. The novelty wears off, the friend group has settled, and people start wanting the specific things: a climbing partner, a small gallery show, a run on Sunday. That is the moment nothing serves, and it's where LocalPal lives.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Figure: the relevance curve (fig1_curva_relevancia.svg): the mainstream falling, the long tail rising, LocalPal's window shaded where they cross.",
            caption: "The relevance curve",
          },
        },
        {
          type: "p",
          text: "I call it the relevance curve, and it decided more than any other finding. It ruled out launching at arrival, when the app would lose to the welcome week. And it created the product's hardest problem: LocalPal has to be on the phone before it's needed, so it needs a reason to be opened in week one to still be there in week six. Most of the decisions that follow come from that.",
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
          text: "An app where the plans and the people are on the same map. Venues and organisations post their events, so there's something to do from day one; people post their own plans, which is why you stay. Every plan is a group with a minimum size, you verify to join, and it's always free between people. Money only comes in where paying is already normal, like a ticket or a gym session.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "Five small cards in a row, one per decision, icon plus one line.",
            caption: "The five decisions",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "The three persona cards (figures 3, 4, 5).",
            caption: "Three people to design for",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 21 / 9,
            need: "Three frames of the storyboard.",
            caption: "Storyboard",
          },
        },
      ],
    },
    {
      id: "brand",
      label: "Brand and design system",
      heading:
        "A blue that means connection, and shapes that make you feel at ease",
      blocks: [
        {
          type: "p",
          text: "The brand idea is the connector: LocalPal puts people in touch with their city and with each other, and it talks like a friend with good judgement. The blue comes from the web link, the colour of connection (and quietly, the European blue). The first moodboard was much more angular, but on a phone hard shapes read cold, so it moved toward soft shapes, stickers and things that are slightly tilted.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "The brand sample (figure 11): logo, the blue, PP Neue Montreal set large.",
            },
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "The moodboard (figure 9).",
            },
          ],
        },
        {
          type: "p",
          text: "The design system is a set of rules more than screens: depth of blue for hierarchy, white only for what you can tap, squircle corners, and one motion personality with one rule. Animate what you touch, never what the system reports.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "One design-system sheet: the blue ramp, the inverted map palette, the squircle corners.",
            caption: "The system",
          },
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "video",
            aspect: 16 / 9,
            need: "Components pressed and settling, next to a progress bar filling with no bounce.",
            caption: "Bounce on touch, none on progress",
          },
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
          text: "Some of the things that make LocalPal different from the apps that came before it:",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              title: "The map is the feed.",
              body: "There is no list. Cards and sheets sit on top of the map and turn into each other when you touch them, so you never lose where you are.",
            },
            {
              title: "Search in a sentence.",
              body: '"I want something chill tonight" works, because you have a mood and a moment, not a keyword.',
            },
            {
              title: "Going together.",
              body: "Big venue events show the plans of people going, so you join someone's plan rather than an anonymous event of 62 people.",
            },
            {
              title: "The confirm slider.",
              body: "On the day, drag to confirm and you see who else has. Only the confirmed ones show.",
            },
            {
              title: "Onboarding you play.",
              body: "Interests are bubbles you pick and stickers that build your profile as a collage, and a short tour takes you into your first plan.",
            },
          ],
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Map at minimum detail, the '50+ activities' badge (figure 20).",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Map at maximum detail, pins stacking (figure 22).",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Search results for a sentence, with the 'why it fits' lines (figure 23.5).",
            },
          ],
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "A venue event card with the 'going together' list (figures 25 and 27).",
            },
            {
              kind: "placeholder",
              awaits: "video",
              aspect: 9 / 19.5,
              need: "The confirm slider being dragged, the list of confirmed people appearing.",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "The own profile with the QR as the main action (figure 29).",
            },
          ],
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              awaits: "video",
              aspect: 9 / 19.5,
              need: "The interest bubbles being picked and the stickers landing.",
            },
            {
              kind: "placeholder",
              awaits: "video",
              aspect: 9 / 19.5,
              need: "The camera flying through the illustrated city into the real map, ending on the first-plan tour.",
            },
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
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 3 / 2,
            need: "A photo from the defence, or of the project on screen at UDIT.",
            caption: "Presenting LocalPal at UDIT",
          },
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
