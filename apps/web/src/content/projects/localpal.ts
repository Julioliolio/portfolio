import type { Project } from "./types";

/**
 * LocalPal — the master's thesis, cut down to the product: the problem,
 * the three findings that changed it, how it works, the brand and the
 * app, then the prototype to try. The research lives in the thesis PDF,
 * linked at the bottom. Source: JULIO_ROMERO_MEMORIA_TFM (UDIT, 2026);
 * the figures the placeholders ask for are its figures, or the
 * prototype's screens.
 */
export const localpal: Project = {
  slug: "localpal",
  title: "LocalPal",
  tagline: "Finding and organising the plans a city doesn't show you.",
  summary:
    "A map app where young adults in European cities find the small, niche things to do and the people to do them with. Concept, brand, design system and a working prototype, built solo.",
  meta: [
    {
      label: "Fields",
      value:
        "Product design, interaction design, design system, service design",
    },
    { label: "Year", value: "2026" },
    {
      label: "Role",
      value: "Everything: research, concept, brand, UI, prototype",
    },
    { label: "Live", value: "localpal.co", href: "https://localpal.co" },
  ],
  hero: {
    kind: "placeholder",
    aspect: 16 / 9,
    need: "The onboarding sticker collage on one phone, large, on the LocalPal blue. One screen, not a montage.",
  },
  contents: true,
  sections: [
    {
      id: "overview",
      label: "Overview",
      heading: "One map for the plans a city doesn't show you",
      blocks: [
        {
          type: "lede",
          text: "LocalPal is an app where young adults in European cities find the niche things to do and the people to do them with, on one map.",
        },
        {
          type: "p",
          text: "It is my master's thesis at UDIT: four months of research, design and build, done solo, with everything overlapping toward the end. This page shows the product. The full research is linked at the bottom.",
        },
        {
          type: "quote",
          text: "A city is much more than its obvious plans. The best ones don't exist until someone makes them happen. LocalPal is where they happen.",
          source: "The brand claim",
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
          note: "Four months from the first interview to a working prototype. The last interviews were still being analysed when the first screens were drawn.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "video",
            aspect: 16 / 9,
            need: "A 30-second reel of the prototype in use: a sentence search, a pin opening into a plan, the confirm slider, the onboarding bubbles. Screen recording, cut to music.",
            caption: "The product in thirty seconds.",
          },
        },
      ],
    },
    {
      id: "problem",
      label: "Problem",
      heading: "Nightlife is shrinking and the climbing gyms are full",
      blocks: [
        {
          type: "p",
          text: "Young adults in European cities are going out less and doing more. Nightlife is shrinking, climbing gyms and running clubs are full, and 35% of Europeans say they feel lonely at least some of the time. Part of this is money and it varies a lot by country, but the direction is clear: there are more and more things to do, and no good way to find them.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Figure: the 'cultural moment' board (fig2_momento_cultural.svg).",
          },
        },
        {
          type: "p",
          text: "For a concert or a bar, you find the plan and then you find company. For climbing, hiking or padel there is no plan to find: it doesn't exist until someone proposes it and others join. Finding the plan and finding the people are the same step, and no app treats them that way. Friends, Instagram and Google Maps already cover the popular bars and the big concerts. What's left uncovered is everything small.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 10,
            need: "Figure: the competitive landscape, the gap where LocalPal sits marked top-right (fig4_panorama_competitivo.svg).",
          },
        },
        {
          type: "subhead",
          text: "What six people who had just moved to a new city told me",
        },
        {
          type: "p",
          text: "Five Erasmus students in four countries and one volunteer from a buddy programme, each asked about the last time they did something. Three things came out that changed the product.",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              title:
                "When a plan falls apart, people blame the plan, not the coordination.",
              body: "A badminton session in fifteen centimetres of snow where nobody could find the entrance. Seven people in Segovia with every good restaurant full. Nobody comes out of that thinking \"I needed a coordination tool\"; they think badminton was a bad idea. So the app can't sell itself as the fix for a problem nobody sees. It has to be useful for something else first: knowing what's on.",
            },
            {
              title: "Meeting strangers worries people in three specific ways.",
              body: "Will they actually show up. How exposed do I look posting alone. Is this going to turn into a dating app, a bigger worry for women. All three are answered by the same shape: every plan is for a group, it needs a minimum number of people to happen, and everyone in it is verified.",
            },
            {
              title: "Nobody needs this app in their first week.",
              body: "Welcome weeks and flatmate dinners fill the first month. The wish for a climbing partner or a small gallery show comes later, around week six, when the novelty runs out and the friend group has settled. So LocalPal has to be on the phone before it's needed, and the onboarding has to be worth opening on its own.",
            },
          ],
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Figure: the relevance curve, LocalPal's window shaded at the crossing (fig1_curva_relevancia.svg).",
          },
        },
      ],
    },
    {
      id: "how",
      label: "Concept",
      heading:
        "Venues post events, people post plans, and every plan is a group",
      blocks: [
        {
          type: "list",
          style: "bulleted",
          items: [
            {
              title: "Two kinds of plans.",
              body: "Venues and organisations (a climbing gym, a student association, a museum) post their events. People post their own plans. The venues make the app useful from day one; the people's plans are the reason to keep it.",
            },
            {
              title: "Anyone can post a plan.",
              body: "No hosts, no approval, no group to join first. You propose, others come. That's Meetup's biggest barrier, removed.",
            },
            {
              title: "Every plan is a group.",
              body: "No one-to-one meetings. A plan needs a minimum number of people to happen, and that is what stops no-shows, the awkwardness of posting alone, and the slide into a dating app that sank Nomadtable.",
            },
            {
              title: "You verify to join.",
              body: "A university email or a QR check-in at a partner event unlocks the social side. Wanting to verify already says something about you.",
            },
            {
              title: "Money only on the venue side.",
              body: "Posting and joining are always free. Revenue comes where paying is already normal: a ticket, a gym session. Every app that charged between people ended up professional and cold.",
            },
          ],
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "Figure: the service blueprint drawn as a cycle, a finished plan feeding the next one.",
            },
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "Three frames of the storyboard: Marco on the map, the open plan, the three of them at the gym.",
            },
          ],
        },
      ],
    },
    {
      id: "brand",
      label: "Brand",
      heading: "A blue that means connection, shapes that put you at ease",
      blocks: [
        {
          type: "p",
          text: "The brand is a connector: it puts people in touch with their city and with each other, and it talks like a friend with good judgement. The blue is the web link blue, the colour of connection (and quietly the European blue). The typeface is PP Neue Montreal, a neo-grotesque with the same European nod. The first moodboard was more angular, but on a phone hard shapes read cold, so the language became soft shapes, stickers and slightly tilted elements.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "The moodboard (figure 9), including the angular first direction that got dropped.",
            },
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "The brand sample (figure 11): logo, the blue, PP Neue Montreal set large.",
            },
          ],
        },
        {
          type: "p",
          text: "The design system is a set of rules more than a set of screens. Every visual property lives in one place and every component reads from it. Hierarchy is done with depth of blue, and white is kept for buttons so the thing you can tap always stands out. On the map the colours flip: light map, blue pins. Corners are squircles with twenty-one named roles. Motion has one personality (about 250 ms, a small bounce) and one rule: animate what you touch, not what the system reports. A button bounces; a progress bar never does, because a bouncing progress bar would be lying.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "The colour scheme (figure 12): the blue ramp, lavender, white as accent, the inverted map palette.",
            },
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "A grid of the squircle roles, or the superellipse diagram (figure 13).",
            },
          ],
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "video",
            aspect: 16 / 9,
            need: "A few components pressed, morphing and settling, to show the motion personality.",
          },
        },
      ],
    },
    {
      id: "app",
      label: "The app",
      heading: "Everything happens on the map",
      blocks: [
        {
          type: "p",
          text: "The map is the only real screen. Cards, sheets and plan details sit on top of it and turn into each other when touched: the search pill becomes the search, the search becomes a venue, the venue becomes a plan, and back. Going deeper zooms in from the point you touched; going back zooms out. From any depth, closing is one gesture.",
        },
        {
          type: "p",
          text: 'From far away the city is one badge ("50+ activities"); at mid distance only the best pins survive; up close everything shows and stacks. Search takes whole sentences ("I want something chill tonight"), because when you\'re looking for a plan you have a mood and a moment, not a keyword, and each result says why it fits.',
        },
        {
          type: "carousel",
          hint: "Drag through the states",
          figures: [
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Map at minimum detail, the '50+ activities' badge (figure 20).",
              caption: "Far away, the city is one number.",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Map at maximum detail, pins stacking (figure 22).",
              caption: "Up close, everything shows.",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Search results for a sentence, with the 'why it fits' lines and the chips (figure 23.5).",
              caption: "Search in a sentence, corrected with chips.",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "The map pins (figure 12b): venue tile with category icon vs peer plan with the proposer's photo.",
              caption: "Venues get a tile, people get a face.",
            },
          ],
        },
        {
          type: "p",
          lead: "You join people, not events.",
          text: "The plan card shows the organiser first, with their face, because you join a plan as much for the people as for the plan. A venue event has a second level, \"going together\": the plans of the people who are going, so you never join an anonymous event of 62 people, you join someone's plan to go. On the day, the bottom of the plan turns into a slider. Drag it to the end and you're confirmed, and you see who else is. Only the confirmed ones show, which is the nudge.",
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
              aspect: 9 / 19.5,
              need: "My plans on the day of the activity, the slider mid-drag (figure 37).",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "The own profile with the QR as the main action and the 'certified food hunter' headline (figure 29).",
            },
          ],
        },
        {
          type: "p",
          lead: "A profile you build by playing.",
          text: "Interests are bubbles that jump from the centre with real physics. They bump into each other, you push them, they light up when picked, and every answer sticks to the stage as a sticker, so your profile is built in front of you as a collage. On the last step the camera flies through the illustrated city and the real one appears on the other side, already full. A short guided tour then walks you into your first plan, because joining the first one is the hardest step in any social app, and the app takes it with you before leaving you on your own.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Onboarding: the interest bubbles mid-bounce (figure 54).",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Onboarding: the sticker collage with name, interests and area (figure 55).",
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
              need: "The camera flying through the illustrated city into the real map.",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "The first-plan tour on the real map (figure 60 or 61).",
            },
          ],
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      heading: "What I'd do differently",
      blocks: [
        {
          type: "p",
          text: "The prototype has not been tested with users. Six interviews are enough to find patterns and not enough to prove them, and the Erasmus launch is a bet on a channel, not a proven market. With more time, testing comes first.",
        },
        {
          type: "p",
          text: "What I keep: treating finding the plan and finding the people as one step holds up everything designed after it, and the habit of saying, in every sentence, what is proven, what is a pattern and what is a bet.",
        },
      ],
    },
    {
      id: "try",
      label: "Try it",
      heading: "Everything above is real. Try it.",
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
              "Tap a pin, search in a full sentence, join a plan. Then try dragging the right edge of the screen.",
          },
        },
        {
          type: "p",
          text: "The prototype is a React build made with Claude Code on top of the Figma design system, because confirmations, small interactions and transitions only make sense when you use them. A still image sells them short.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            awaits: "link",
            aspect: 6,
            need: "The thesis PDF, for readers who want the full research.",
          },
        },
      ],
    },
  ],
};
