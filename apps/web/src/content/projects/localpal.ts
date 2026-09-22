import type { Project } from "./types";

/**
 * LocalPal — the master's thesis, told the way the memoir tells it but
 * in a quarter of the words. Source: JULIO_ROMERO_MEMORIA_TFM (UDIT,
 * 2025/26). Every number here is from the memoir; the figures the
 * placeholders ask for are its figures, or the prototype's screens.
 */
export const localpal: Project = {
  slug: "localpal",
  title: "LocalPal",
  kicker: "Master’s thesis · UDIT · 2025–2026",
  accent: "#3121ff",
  tagline: "Finding and organising the plans a city doesn't show you.",
  summary:
    "A map-first app where young adults in European cities discover the niche things to do and find the people to do them with. Master's thesis: research, service concept, brand, design system and a working prototype.",
  meta: [
    { label: "Type", value: "Master's thesis · UDIT, 2025–2026" },
    {
      label: "Fields",
      value: "Service design, UX research, product design, design system",
    },
    {
      label: "Role",
      value: "Everything — research, concept, brand, UI, prototype",
    },
    { label: "Tutor", value: "Nicola Vittori" },
    { label: "Live", value: "localpal.co", href: "https://localpal.co" },
  ],
  hero: {
    kind: "placeholder",
    aspect: 16 / 9,
    need: "Hero: three or four phone screens of the prototype side by side on the blue — the map home in the middle, a venue sheet and an activity card either side. The frame from the defence slides works.",
  },
  contents: true,
  sections: [
    {
      id: "overview",
      label: "Overview",
      chapter: "Overview",
      heading: "Overview",
      blocks: [
        {
          type: "lede",
          text: "LocalPal is the organising layer for the new urban activity: an app where young adults in European cities discover the niche things to do and coordinate with other people to do them, in one place.",
        },
        {
          type: "p",
          text: "It was my final project for the master's in UX at UDIT, so it is two things at once: a piece of service design research (a theoretical framework, a netnography, six long interviews, an analysis of every platform that tried this before) and the product that came out of it — a service concept, a brand, a design system and a high-fidelity prototype you can play with at the bottom of this page.",
        },
        {
          type: "quote",
          text: "A city is much more than its obvious plans. The best ones don't exist until someone makes them happen. LocalPal is where they happen.",
          source: "The brand claim",
        },
        {
          // The phases as the memoir orders them; the months are a first
          // guess off its dates (research through March 2026) — confirm
          // against the plan.
          type: "timeline",
          months: [
            "Oct",
            "Nov",
            "Dec",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
          ],
          phases: [
            { label: "Framework and netnography", from: 0, to: 3 },
            { label: "Interviews and analysis", from: 3, to: 6 },
            { label: "Concept and requirements", from: 4, to: 6 },
            { label: "Brand and design system", from: 5, to: 7 },
            { label: "Prototype", from: 6, to: 9 },
            { label: "Memoir and defence", from: 7, to: 9 },
          ],
          note: "Nine months, from the theoretical framework to the defence.",
        },
      ],
    },
    {
      id: "moment",
      label: "The moment",
      heading: "Nights out are shrinking and the climbing gyms are full",
      blocks: [
        {
          type: "p",
          text: "The way young adults socialise in European cities is changing, and it leaves a gap. Nightlife is contracting at a measurable rate: in the ESPAD survey, lifetime alcohol use among 15 and 16 year olds fell from 88% in 1995 to 74% in 2024, the UK has lost about 37% of its nightclubs in four years, and Berlin's Watergate closed at the end of 2024. At the same time another way of meeting grows in its place: European fitness hit a record 71.6 million users, Strava saw running clubs grow 59% in a year, and its young users said they were four times more likely to want to meet people exercising than in a bar. Underneath it all, the JRC's loneliness survey found 35% of Europeans feel lonely at least some of the time, with young adults hit hardest.",
        },
        {
          type: "p",
          text: "I was careful not to overclaim. A whole generation has not swapped the bar for the bouldering wall — a lot of the shift is economic, and the variation between countries is huge. What can be said is that the offer for socialising by consuming is shrinking, and the offer for socialising by doing things is expanding. And that second kind of activity is exactly what today's tools serve badly: part of it exists and almost nobody sees it (a design show in a small gallery), and part of it doesn't exist until someone proposes it (a climbing session, a padel partner for Tuesday).",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Figure: the 'cultural moment' board — ESPAD alcohol 1995–2024 line, EU loneliness stacked bar, fitness 2024 figure, Strava year-on-year (fig2_momento_cultural.svg from the thesis figures).",
          },
        },
      ],
    },
    {
      id: "problem",
      label: "The problem",
      heading: "Discovery and coordination are the same operation",
      blocks: [
        {
          type: "p",
          text: "Two behaviours define the problem. Discovery: what can I do today, this week, in this city? The offer exists but it is scattered. Coordination: who do I do it with if I don't want to go alone? Today that happens in WhatsApp groups, Telegram and Reddit threads. People usually see them as a sequence — first you find out what exists, then you find company — and for a concert or a bar that's true. But for climbing, hiking or padel there is no event to discover: the activity does not exist until someone proposes it and others join. There, coordination is the discovery.",
        },
        {
          type: "p",
          text: 'My hypothesis was that the mainstream is already covered. For the popular bars, the big concerts and the mass events, your friends, Instagram and Google Maps solve "what do I do this weekend" without a new product adding anything. The gap is in the long tail: many niche activities, each with little demand, that together weigh more than the mass offer — and that the new infrastructure produces faster than channels appear to cover it.',
        },
      ],
    },
    {
      id: "research",
      label: "Research",
      chapter: "Research",
      heading: "Reddit first, then six long conversations",
      blocks: [
        {
          type: "p",
          text: "I started from the outside in. In March 2026 I scraped 3,993 Reddit posts across fifteen subreddits — profile communities like r/erasmus and r/expats, and city subreddits from Prague to Lisbon — and coded them by social relevance, type of demand, time signal and how locals responded. Filtering for Europe and social relevance left 526 posts. The method is blind to anything a regex can't see, so I only kept the two patterns that produced good interview questions: the platform ecosystem is fragmented and people compare it in frustration, and demand shows up as open invitations (\"I'm in Madrid this weekend, anyone want to climb?\") concentrated in city subreddits, where a place is already in the room.",
        },
        {
          type: "p",
          text: "Then the primary research: five semi-structured interviews with Erasmus students in four countries (Madrid, Lahti, Poznań, Levanger) and one with a volunteer from a Local Buddy programme. I sat as a learner, not an evaluator, and used the critical incident technique — tell me about the last time you did something — so people described real episodes instead of opinions. Erasmus students were the population because they are concentrated, reachable and predictable; the product is for any young adult who lives in a European city.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 2,
            need: "Figure: the channel stack matrix — one row per channel, five dots per row (one per interviewee), filled where they mentioned it, and the bottom row of five empty circles for the specialised platforms (fig5_pila_canales.svg).",
          },
        },
      ],
    },
    {
      id: "findings",
      label: "Findings",
      heading: "What people actually told me",
      blocks: [
        {
          type: "p",
          text: "Five themes came out of the interviews, and each one moved the design.",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              title: "The mainstream is covered, the niche is not.",
              body: "Everyone found the clubs, the popular bars and the big promoters' events without friction, through a small redundant set of channels. The friction was all in the niche and in anything that needs coordinating. \"I study design and nobody tells me to go to Matadero if I don't look for it. But I knew about every party.\"",
            },
            {
              title: "The coordination failure isn't obvious.",
              body: "Nobody said \"I needed a coordination tool\". They told stories: a badminton session in fifteen centimetres of snow where nobody could find the entrance, a nine-hour solo train to Zakopane with two rescue Ubers, seven people in Segovia with every good restaurant full. When coordination fails, people blame the activity. It is a real need they can't formulate, so the product can't sell itself as the solution to a problem nobody sees.",
            },
            {
              title: "Channels stack, they aren't chosen.",
              body: 'Friends and classmates first, ESN second, generic search (Maps, TikTok, ChatGPT) third, Instagram throughout. And a total absence of specialised platforms — Meetup, Couchsurfing Hangouts, Timeleft, Bumble BFF — even when I asked. The positioning question became "how do I enter the generic stack", not "why us instead of Meetup".',
            },
            {
              title: "Bonds come from being in the same place, repeatedly.",
              body: "The closest friendships came from flats, classes, corridors — not shared interests. And interests brought from home died without a bridge: one participant climbed in Milan and never climbed in Madrid. \"I'll wait to be invited, I'm not going to play alone.\" A product that competes with the flat as the context for friendship goes against the current; one that extends the existing group toward an activity goes with it.",
            },
            {
              title:
                "Meeting strangers worries people, in three specific ways.",
              body: 'Reliability ("people say they go and then they don\'t"), the exposure of posting alone ("if it\'s five people going to this party, does anyone want to join? Yes"), and the drift toward a dating app — worse if you\'re a woman. All three point to the same architecture: group format, a minimum viable size, verified identity.',
            },
          ],
        },
      ],
    },
    {
      id: "curve",
      label: "Timing",
      heading: "The window opens somewhere between week six and twelve",
      blocks: [
        {
          type: "p",
          text: "This was the finding I didn't expect. My first version of the project aimed the launch at the first month, the moment of maximum motivation. The interviews and the adaptation literature corrected it: the first month is saturated with dense, very social mainstream offer — welcome week, ESN trips, dinners with the new flatmates — and it is exactly where LocalPal adds nothing. Later, two things happen at once: the mainstream runs out as novelty, and the social network settles enough for specific interests to appear that the generic offer doesn't cover. The curves cross somewhere in the second half of the first semester.",
        },
        {
          type: "p",
          text: "The consequence is uncomfortable: the product has to be installed before the inflection, but its differential value only shows after. Acquisition is won in the first weeks through concentrated channels; the design has to survive on the phone through a period in which it is barely useful. That delay shaped the onboarding, the entity layer and the first-plan tour more than anything else in the project.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "Figure: the relevance curve — mainstream, institutional and long-tail curves over the 16 weeks of a stay, with LocalPal's window shaded at the crossing (fig1_curva_relevancia.svg).",
          },
        },
      ],
    },
    {
      id: "precedents",
      label: "Precedents",
      heading: "Nobody had heard of the competition",
      blocks: [
        {
          type: "p",
          text: 'Since no specialised platform lived in anyone\'s head, the competitive analysis became an examination of precedents: what was tried, how it failed. Nomadtable is the closest cousin — a map of nearby travellers and open meetups — and its most useful lesson is how it fails: optional verification, weak moderation, and a striking share of reviews, disproportionately from women, calling it a dating app. Timeleft is the commercial success (Wednesday dinners with six algorithm-matched strangers) and shows that a choreographed ritual with staggered reveals lowers first-meeting anxiety without any history, at the cost of all spontaneity. Couchsurfing Hangouts is the historical precedent for "meet someone nearby now", and the clearest case of a platform destroying the inherited trust that was its strongest asset with a mandatory paywall in 2020.',
        },
        {
          type: "p",
          text: 'The real competition is the generic stack: Google Maps solves "where to get a drink" better, Instagram solves visual discovery better, and ChatGPT is absorbing the open questions. None of them surface the long tail, and none of them let you propose a plan to verified strangers with a reasonable expectation of an answer. A new tool doesn\'t enter that stack by being better; it enters when the stack is being rebuilt — which is exactly what happens when you arrive in a new city. That is the structural logic of the Erasmus launch segment.',
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 10,
            need: "Figure: the competitive landscape — eleven platforms on two axes (peer-to-peer openness × effective coordination), status coded in the dot fill, and the gap where LocalPal sits marked top-right (fig4_panorama_competitivo.svg).",
          },
        },
      ],
    },
    {
      id: "requirements",
      label: "Requirements",
      chapter: "Development",
      heading: "Five requirements, each with a reason attached",
      blocks: [
        {
          type: "p",
          text: "Every requirement comes from a finding, a failure pattern, or both. Together they are the contract the rest of the design had to keep.",
        },
        {
          type: "list",
          style: "numbered",
          items: [
            {
              title: "Layered offer as the launch architecture.",
              body: "Two layers by who proposes: peers (a person proposes an informal plan) and entities (a bar, a climbing gym, ESN, a museum proposes its own event). Entities give utility from day one and the density a cold start needs; peers are the differential and the reason to stay.",
            },
            {
              title: "Democratised peer publishing.",
              body: "Anyone proposes a plan directly. Whoever proposes is the proposer of that plan, not a permanent host with approval power over a group. That removes, by construction, Meetup's approval barrier and its drift into semi-professional organising.",
            },
            {
              title: "Group format with a minimum viable size.",
              body: "The peer layer does not admit pure one-to-one meetings. The basic unit of the product is an activity proposed to several people, not contact between two. That is the structural defence against the no-show, the exposure of posting alone and the dating-app drift.",
            },
            {
              title: "Verification as proof of commitment.",
              body: "Not a legal identity check but a signal that ties an account to a continuous identity: an institutional email, a QR check-in at a partner event, or a document. Passing one opens the social layer. Wanting to verify is already a signal.",
            },
            {
              title: "Money only in the entity layer, never between peers.",
              body: "Publishing a plan and joining one are always free. Revenue comes where payment is already expected — a museum ticket, a gym session. The precedents are unanimous: a commission between peers makes the professional drift deterministic. The money line and the authenticity line are the same line.",
            },
          ],
        },
      ],
    },
    {
      id: "concept",
      label: "Concept",
      heading: "Three people to design for, and a map that never goes away",
      blocks: [
        {
          type: "p",
          text: "From the research I built three behavioural personas rather than demographic ones. The initiator, who arrives when the channel is concentrated and easy to reach but nothing in the app is useful to her yet — she is the timing problem, and the onboarding and early utility are designed for her. The enthusiast, motivated but never quite starting: he knows climbing exists, he doesn't know which gym or how to walk in alone — LocalPal is his on-ramp. And the cautious one, who anticipates everything that could go wrong before trying: she is the trust case, and she is why the defences are structural instead of reactive.",
        },
        {
          type: "carousel",
          hint: "Drag through the three",
          figures: [
            {
              kind: "placeholder",
              aspect: 3 / 4,
              need: "Persona card: the initiator (figure 3 in the thesis).",
              caption: "The initiator — the timing problem.",
            },
            {
              kind: "placeholder",
              aspect: 3 / 4,
              need: "Persona card: the enthusiast (figure 4).",
              caption: "The enthusiast — the on-ramp.",
            },
            {
              kind: "placeholder",
              aspect: 3 / 4,
              need: "Persona card: the cautious one (figure 5).",
              caption: "The cautious one — the trust case.",
            },
          ],
        },
        {
          type: "p",
          text: "The as-is journey starts with enthusiasm — discovery even feeds it — and collapses in the logistics and the coordination, where the plan lives in scattered chats and dissolves because nobody commits. The to-be journey keeps the logistics dip on purpose (LocalPal doesn't remove the friction of finding out what you need, it concentrates it into one sheet) and fixes the coordination: finding and organising on the same surface, joining in two taps, a chat tied to the event. Then a storyboard about Marco, six weeks into Madrid, who has never climbed and ends up at Sputnik on a Saturday with two strangers who haven't either, and a service blueprint that reads as a cycle: a finished activity feeds the next one.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 16 / 9,
              need: "The to-be user journey map (figure 7), the bottom row turned from pain points into design decisions.",
            },
            {
              kind: "placeholder",
              aspect: 16 / 9,
              need: "Two or three frames of the storyboard — Marco on the map, the open plan from the French girl, the three of them at the gym.",
            },
          ],
        },
      ],
    },
    {
      id: "brand",
      label: "Brand",
      heading: "Blue like a hyperlink, soft like a sticker",
      blocks: [
        {
          type: "p",
          text: "The brand idea is the connector: we put people in touch with their city and with each other. The positioning is the friend with good judgement — enthusiastic, for whoever wants to get more out of the city. Two elements came first. The colour is blue, taken from the web hyperlink: it gives the product a native-to-the-internet look and it is the colour of connection, which is what the product does. It is also, quietly, the European blue. The typeface is PP Neue Montreal, a contemporary neo-grotesque that nods to Helvetica and that shared European identity the Erasmus exchange celebrates. Nobody needs to decode the wink for the brand to work, but it is built on it.",
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
          text: 'The moodboard pointed somewhere more angular and technical: rigid grids, system type, hard rectangles, the brat aesthetic. On a phone, in fast use, hard shapes read cold and create distance, so the direction moved toward something friendlier. Soft shapes, stickers and slightly tilted elements do a concrete job: they hold the voice, which speaks to you as a friend and wants to say "you can be at ease here".',
        },
        {
          type: "p",
          text: "The design system is a set of rules more than a catalogue of screens. Every visual property — a corner radius, an animation's timing, a pin's size — lives once, in a central registry, and every component references it. Hierarchy is built from depth of blue: an electric #3121FF as the main surface, deeper variants for nested rows, lavender for secondary text, and white reserved for actions so the tappable thing always stands out. On the map the scheme inverts: the map is light and the blue markers are the information. Corners are Piet Hein superellipses — squircles — with twenty-one named roles, each keeping its radius under the point where the smoothing would collapse into a pill. And motion comes from one personality, defined perceptually (about 250 ms, a bounce of about 0.23) and modified per element by a speed and a bounce multiplier. The rule that orders it: animate the interaction, not the information. A press or a morph gets the elastic base; a progress bar never overshoots, because a bouncing progress would lie about the system.",
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "The colour scheme (figure 12): the blue ramp, lavender, white as accent, and the inverted map palette.",
            },
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "The map pins (figure 12b): venue tile with category icon vs peer plan with the proposer's photo and glyph badge.",
            },
            {
              kind: "placeholder",
              aspect: 4 / 3,
              need: "A grid of the squircle roles from the ?ds showcase, or the superellipse diagram (figure 13).",
            },
          ],
        },
      ],
    },
    {
      id: "prototype",
      label: "Prototype",
      chapter: "Final screens",
      heading: "The map is the feed",
      blocks: [
        {
          type: "p",
          text: "The map is practically the only real screen. Everything else — cards, sheets, the detail of a plan — is a component that lives on top of the map and transforms when touched, without ever leaving that base. In most apps the content is a list and the map a secondary view; here the relationship is inverted. Nothing appears from nowhere: the search pill becomes the search, the search becomes a venue sheet, the sheet becomes an activity card, and back. Going deeper zooms in from the exact point you touched; going back zooms out. Because there is no stack of cards, closing to the map is one gesture from any depth.",
        },
        {
          type: "figure",
          figure: {
            kind: "demo",
            demo: "localpal",
            title: "LocalPal prototype",
            variant: "phone",
            query: "?embed",
            caption:
              "The prototype, live. Tap a pin, search in a full sentence, join a plan — and try dragging the right edge of the screen.",
          },
        },
        {
          type: "p",
          text: 'A social map has dozens of plans at once, so the map manages density by distance. From far away a single badge over the city name sums it up ("50+ activities"); at mid distance only the most interesting pins survive and the rest shrink to dots; up close everything shows and stacks when it collides. Search accepts keywords, but also whole sentences — "I want something chill tonight" — because someone looking for a plan has a mood and a moment, not a keyword. The system shows its reading in stages ("Reading your vibe…") and returns results with a line each on why they fit, plus chips you can remove to correct it.',
        },
        {
          type: "figures",
          figures: [
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Map at minimum detail — the '50+ activities' badge (figure 20).",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Map at maximum detail, pins stacking (figure 22).",
            },
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "Search results for a sentence, with the 'why it fits' lines and the chips (figure 23.5).",
            },
          ],
        },
        {
          type: "p",
          text: "The activity card puts the who before the what: the organiser appears with their face and opens their profile, because you join a plan as much for the people as for the plan. Venue events have a second level, \"going together\" — the plans of people inside that event — so you never join an anonymous event of 62 people, you join someone's plan to go. On the day, the bottom row of a plan in My plans turns into a slider; dragging it to the end confirms you're going and reveals who else has, with names and times. Only those who confirmed, never those who didn't, so the list works as an incentive.",
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
          text: "Onboarding asks what any sign-up form asks, but nothing is answered by filling a field. Interests are bubbles that jump from the centre with real physics — they bump into each other, you push them, they light up when picked — and every answer sticks to the stage as a sticker, so the profile is born in front of you as a collage. When you confirm the last step the camera flies through the decorative city and the real one appears on the other side, already populated. Then a short guided tour walks you into your first plan, because joining the first plan is the highest psychological barrier in a social app and knocking it down in a guided, risk-free context is the promise of the app kept before leaving you alone.",
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
            {
              kind: "placeholder",
              aspect: 9 / 19.5,
              need: "The first-plan tour on the real map (figure 60 or 61).",
            },
          ],
        },
        {
          type: "p",
          text: "The prototype was built twice: wireframes of the main screens to fix the structure, then the design system as Figma components with every flow recomposed on that base until the final screens, and from there a React build with Claude Code — the one embedded above — because confirmation states, microinteractions and transitions live in use, and a still image sells them short.",
        },
        {
          type: "figure",
          figure: {
            kind: "placeholder",
            aspect: 16 / 9,
            need: "The Figma working file zoomed out (figure 15): wireframes on top, the successive iterations down to the final screens below.",
          },
        },
      ],
    },
    {
      id: "learnings",
      label: "Learnings",
      chapter: "Post mortem",
      heading: "What I'd do differently, and what I'm keeping",
      blocks: [
        {
          type: "p",
          text: "Three results I'm proud of. Reframing discovery and coordination as one operation turned out to be productive — it holds up everything designed after it. The layered offer gives a concrete answer to the cold start without giving up the differential. And the time dimension, the relevance curve, appeared during the research as a design finding that was not obvious when I started.",
        },
        {
          type: "p",
          text: "Things I would change: starting the primary research earlier would have left room for a second round, or for validation, which is the phase that closes the double diamond and is still pending. The sample could have been bigger. And a chunk of the time spent on methodological frameworks I later discarded would have been saved by defining the scope sooner.",
        },
        {
          type: "p",
          text: "What stays with me beyond the document: how to integrate research and product without one swallowing the other, the discipline of not answering with design what is structural, and handling levels of evidence — being forced, in every sentence, to say what is demonstrated, what is a pattern and what is a bet. Thank you, Nicola, for keeping me honest on that last one.",
        },
      ],
    },
  ],
};
