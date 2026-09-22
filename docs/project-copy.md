# Project copy

Everything the case-study pages say, pulled from apps/web/src/content/projects/*.ts. Media is shown in brackets where it sits.

# LocalPal

Kicker (not rendered on the page now): Master’s thesis · UDIT · 2025–2026
Tagline: Finding and organising the plans a city doesn't show you.
Summary: A map-first app where young adults in European cities discover the niche things to do and find the people to do them with. Master's thesis: research, service concept, brand, design system and a working prototype.

Facts:
- Type: Master's thesis · UDIT, 2025–2026
- Fields: Service design, UX research, product design, design system
- Role: Everything — research, concept, brand, UI, prototype
- Tutor: Nicola Vittori
- Live: localpal.co (https://localpal.co)

Hero: [photo needed — Hero: three or four phone screens of the prototype side by side on the blue — the map home in the middle, a venue sheet and an activity card either side. The frame from the defence slides works.]

## Overview (chapter: Overview)

**Overview**

*Lede:* LocalPal is the organising layer for the new urban activity: an app where young adults in European cities discover the niche things to do and coordinate with other people to do them, in one place.

It was my final project for the master's in UX at UDIT, so it is two things at once: a piece of service design research (a theoretical framework, a netnography, six long interviews, an analysis of every platform that tried this before) and the product that came out of it — a service concept, a brand, a design system and a high-fidelity prototype you can play with at the bottom of this page.

> A city is much more than its obvious plans. The best ones don't exist until someone makes them happen. LocalPal is where they happen.
> — The brand claim

Timeline (Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun):
- Framework and netnography: Oct → Dec
- Interviews and analysis: Jan → Mar
- Concept and requirements: Feb → Mar
- Brand and design system: Mar → Apr
- Prototype: Apr → Jun
- Memoir and defence: May → Jun
Note: Nine months, from the theoretical framework to the defence.

## The moment

**Nights out are shrinking and the climbing gyms are full**

The way young adults socialise in European cities is changing, and it leaves a gap. Nightlife is contracting at a measurable rate: in the ESPAD survey, lifetime alcohol use among 15 and 16 year olds fell from 88% in 1995 to 74% in 2024, the UK has lost about 37% of its nightclubs in four years, and Berlin's Watergate closed at the end of 2024. At the same time another way of meeting grows in its place: European fitness hit a record 71.6 million users, Strava saw running clubs grow 59% in a year, and its young users said they were four times more likely to want to meet people exercising than in a bar. Underneath it all, the JRC's loneliness survey found 35% of Europeans feel lonely at least some of the time, with young adults hit hardest.

I was careful not to overclaim. A whole generation has not swapped the bar for the bouldering wall — a lot of the shift is economic, and the variation between countries is huge. What can be said is that the offer for socialising by consuming is shrinking, and the offer for socialising by doing things is expanding. And that second kind of activity is exactly what today's tools serve badly: part of it exists and almost nobody sees it (a design show in a small gallery), and part of it doesn't exist until someone proposes it (a climbing session, a padel partner for Tuesday).

[photo needed — Figure: the 'cultural moment' board — ESPAD alcohol 1995–2024 line, EU loneliness stacked bar, fitness 2024 figure, Strava year-on-year (fig2_momento_cultural.svg from the thesis figures).]

## The problem

**Discovery and coordination are the same operation**

Two behaviours define the problem. Discovery: what can I do today, this week, in this city? The offer exists but it is scattered. Coordination: who do I do it with if I don't want to go alone? Today that happens in WhatsApp groups, Telegram and Reddit threads. People usually see them as a sequence — first you find out what exists, then you find company — and for a concert or a bar that's true. But for climbing, hiking or padel there is no event to discover: the activity does not exist until someone proposes it and others join. There, coordination is the discovery.

My hypothesis was that the mainstream is already covered. For the popular bars, the big concerts and the mass events, your friends, Instagram and Google Maps solve "what do I do this weekend" without a new product adding anything. The gap is in the long tail: many niche activities, each with little demand, that together weigh more than the mass offer — and that the new infrastructure produces faster than channels appear to cover it.

## Research (chapter: Research)

**Reddit first, then six long conversations**

I started from the outside in. In March 2026 I scraped 3,993 Reddit posts across fifteen subreddits — profile communities like r/erasmus and r/expats, and city subreddits from Prague to Lisbon — and coded them by social relevance, type of demand, time signal and how locals responded. Filtering for Europe and social relevance left 526 posts. The method is blind to anything a regex can't see, so I only kept the two patterns that produced good interview questions: the platform ecosystem is fragmented and people compare it in frustration, and demand shows up as open invitations ("I'm in Madrid this weekend, anyone want to climb?") concentrated in city subreddits, where a place is already in the room.

Then the primary research: five semi-structured interviews with Erasmus students in four countries (Madrid, Lahti, Poznań, Levanger) and one with a volunteer from a Local Buddy programme. I sat as a learner, not an evaluator, and used the critical incident technique — tell me about the last time you did something — so people described real episodes instead of opinions. Erasmus students were the population because they are concentrated, reachable and predictable; the product is for any young adult who lives in a European city.

[photo needed — Figure: the channel stack matrix — one row per channel, five dots per row (one per interviewee), filled where they mentioned it, and the bottom row of five empty circles for the specialised platforms (fig5_pila_canales.svg).]

## Findings

**What people actually told me**

Five themes came out of the interviews, and each one moved the design.

1. **The mainstream is covered, the niche is not.** Everyone found the clubs, the popular bars and the big promoters' events without friction, through a small redundant set of channels. The friction was all in the niche and in anything that needs coordinating. "I study design and nobody tells me to go to Matadero if I don't look for it. But I knew about every party."
2. **The coordination failure isn't obvious.** Nobody said "I needed a coordination tool". They told stories: a badminton session in fifteen centimetres of snow where nobody could find the entrance, a nine-hour solo train to Zakopane with two rescue Ubers, seven people in Segovia with every good restaurant full. When coordination fails, people blame the activity. It is a real need they can't formulate, so the product can't sell itself as the solution to a problem nobody sees.
3. **Channels stack, they aren't chosen.** Friends and classmates first, ESN second, generic search (Maps, TikTok, ChatGPT) third, Instagram throughout. And a total absence of specialised platforms — Meetup, Couchsurfing Hangouts, Timeleft, Bumble BFF — even when I asked. The positioning question became "how do I enter the generic stack", not "why us instead of Meetup".
4. **Bonds come from being in the same place, repeatedly.** The closest friendships came from flats, classes, corridors — not shared interests. And interests brought from home died without a bridge: one participant climbed in Milan and never climbed in Madrid. "I'll wait to be invited, I'm not going to play alone." A product that competes with the flat as the context for friendship goes against the current; one that extends the existing group toward an activity goes with it.
5. **Meeting strangers worries people, in three specific ways.** Reliability ("people say they go and then they don't"), the exposure of posting alone ("if it's five people going to this party, does anyone want to join? Yes"), and the drift toward a dating app — worse if you're a woman. All three point to the same architecture: group format, a minimum viable size, verified identity.

## Timing

**The window opens somewhere between week six and twelve**

This was the finding I didn't expect. My first version of the project aimed the launch at the first month, the moment of maximum motivation. The interviews and the adaptation literature corrected it: the first month is saturated with dense, very social mainstream offer — welcome week, ESN trips, dinners with the new flatmates — and it is exactly where LocalPal adds nothing. Later, two things happen at once: the mainstream runs out as novelty, and the social network settles enough for specific interests to appear that the generic offer doesn't cover. The curves cross somewhere in the second half of the first semester.

The consequence is uncomfortable: the product has to be installed before the inflection, but its differential value only shows after. Acquisition is won in the first weeks through concentrated channels; the design has to survive on the phone through a period in which it is barely useful. That delay shaped the onboarding, the entity layer and the first-plan tour more than anything else in the project.

[photo needed — Figure: the relevance curve — mainstream, institutional and long-tail curves over the 16 weeks of a stay, with LocalPal's window shaded at the crossing (fig1_curva_relevancia.svg).]

## Precedents

**Nobody had heard of the competition**

Since no specialised platform lived in anyone's head, the competitive analysis became an examination of precedents: what was tried, how it failed. Nomadtable is the closest cousin — a map of nearby travellers and open meetups — and its most useful lesson is how it fails: optional verification, weak moderation, and a striking share of reviews, disproportionately from women, calling it a dating app. Timeleft is the commercial success (Wednesday dinners with six algorithm-matched strangers) and shows that a choreographed ritual with staggered reveals lowers first-meeting anxiety without any history, at the cost of all spontaneity. Couchsurfing Hangouts is the historical precedent for "meet someone nearby now", and the clearest case of a platform destroying the inherited trust that was its strongest asset with a mandatory paywall in 2020.

The real competition is the generic stack: Google Maps solves "where to get a drink" better, Instagram solves visual discovery better, and ChatGPT is absorbing the open questions. None of them surface the long tail, and none of them let you propose a plan to verified strangers with a reasonable expectation of an answer. A new tool doesn't enter that stack by being better; it enters when the stack is being rebuilt — which is exactly what happens when you arrive in a new city. That is the structural logic of the Erasmus launch segment.

[photo needed — Figure: the competitive landscape — eleven platforms on two axes (peer-to-peer openness × effective coordination), status coded in the dot fill, and the gap where LocalPal sits marked top-right (fig4_panorama_competitivo.svg).]

## Requirements (chapter: Development)

**Five requirements, each with a reason attached**

Every requirement comes from a finding, a failure pattern, or both. Together they are the contract the rest of the design had to keep.

1. **Layered offer as the launch architecture.** Two layers by who proposes: peers (a person proposes an informal plan) and entities (a bar, a climbing gym, ESN, a museum proposes its own event). Entities give utility from day one and the density a cold start needs; peers are the differential and the reason to stay.
2. **Democratised peer publishing.** Anyone proposes a plan directly. Whoever proposes is the proposer of that plan, not a permanent host with approval power over a group. That removes, by construction, Meetup's approval barrier and its drift into semi-professional organising.
3. **Group format with a minimum viable size.** The peer layer does not admit pure one-to-one meetings. The basic unit of the product is an activity proposed to several people, not contact between two. That is the structural defence against the no-show, the exposure of posting alone and the dating-app drift.
4. **Verification as proof of commitment.** Not a legal identity check but a signal that ties an account to a continuous identity: an institutional email, a QR check-in at a partner event, or a document. Passing one opens the social layer. Wanting to verify is already a signal.
5. **Money only in the entity layer, never between peers.** Publishing a plan and joining one are always free. Revenue comes where payment is already expected — a museum ticket, a gym session. The precedents are unanimous: a commission between peers makes the professional drift deterministic. The money line and the authenticity line are the same line.

## Concept

**Three people to design for, and a map that never goes away**

From the research I built three behavioural personas rather than demographic ones. The initiator, who arrives when the channel is concentrated and easy to reach but nothing in the app is useful to her yet — she is the timing problem, and the onboarding and early utility are designed for her. The enthusiast, motivated but never quite starting: he knows climbing exists, he doesn't know which gym or how to walk in alone — LocalPal is his on-ramp. And the cautious one, who anticipates everything that could go wrong before trying: she is the trust case, and she is why the defences are structural instead of reactive.

Carousel (hint: Drag through the three):
[photo needed — Persona card: the initiator (figure 3 in the thesis).]
  Caption: The initiator — the timing problem.
[photo needed — Persona card: the enthusiast (figure 4).]
  Caption: The enthusiast — the on-ramp.
[photo needed — Persona card: the cautious one (figure 5).]
  Caption: The cautious one — the trust case.

The as-is journey starts with enthusiasm — discovery even feeds it — and collapses in the logistics and the coordination, where the plan lives in scattered chats and dissolves because nobody commits. The to-be journey keeps the logistics dip on purpose (LocalPal doesn't remove the friction of finding out what you need, it concentrates it into one sheet) and fixes the coordination: finding and organising on the same surface, joining in two taps, a chat tied to the event. Then a storyboard about Marco, six weeks into Madrid, who has never climbed and ends up at Sputnik on a Saturday with two strangers who haven't either, and a service blueprint that reads as a cycle: a finished activity feeds the next one.

[photo needed — The to-be user journey map (figure 7), the bottom row turned from pain points into design decisions.]
[photo needed — Two or three frames of the storyboard — Marco on the map, the open plan from the French girl, the three of them at the gym.]

## Brand

**Blue like a hyperlink, soft like a sticker**

The brand idea is the connector: we put people in touch with their city and with each other. The positioning is the friend with good judgement — enthusiastic, for whoever wants to get more out of the city. Two elements came first. The colour is blue, taken from the web hyperlink: it gives the product a native-to-the-internet look and it is the colour of connection, which is what the product does. It is also, quietly, the European blue. The typeface is PP Neue Montreal, a contemporary neo-grotesque that nods to Helvetica and that shared European identity the Erasmus exchange celebrates. Nobody needs to decode the wink for the brand to work, but it is built on it.

[photo needed — The moodboard (figure 9), including the angular first direction that got dropped.]
[photo needed — The brand sample (figure 11): logo, the blue, PP Neue Montreal set large.]

The moodboard pointed somewhere more angular and technical: rigid grids, system type, hard rectangles, the brat aesthetic. On a phone, in fast use, hard shapes read cold and create distance, so the direction moved toward something friendlier. Soft shapes, stickers and slightly tilted elements do a concrete job: they hold the voice, which speaks to you as a friend and wants to say "you can be at ease here".

The design system is a set of rules more than a catalogue of screens. Every visual property — a corner radius, an animation's timing, a pin's size — lives once, in a central registry, and every component references it. Hierarchy is built from depth of blue: an electric #3121FF as the main surface, deeper variants for nested rows, lavender for secondary text, and white reserved for actions so the tappable thing always stands out. On the map the scheme inverts: the map is light and the blue markers are the information. Corners are Piet Hein superellipses — squircles — with twenty-one named roles, each keeping its radius under the point where the smoothing would collapse into a pill. And motion comes from one personality, defined perceptually (about 250 ms, a bounce of about 0.23) and modified per element by a speed and a bounce multiplier. The rule that orders it: animate the interaction, not the information. A press or a morph gets the elastic base; a progress bar never overshoots, because a bouncing progress would lie about the system.

[photo needed — The colour scheme (figure 12): the blue ramp, lavender, white as accent, and the inverted map palette.]
[photo needed — The map pins (figure 12b): venue tile with category icon vs peer plan with the proposer's photo and glyph badge.]
[photo needed — A grid of the squircle roles from the ?ds showcase, or the superellipse diagram (figure 13).]

## Prototype (chapter: Final screens)

**The map is the feed**

The map is practically the only real screen. Everything else — cards, sheets, the detail of a plan — is a component that lives on top of the map and transforms when touched, without ever leaving that base. In most apps the content is a list and the map a secondary view; here the relationship is inverted. Nothing appears from nowhere: the search pill becomes the search, the search becomes a venue sheet, the sheet becomes an activity card, and back. Going deeper zooms in from the exact point you touched; going back zooms out. Because there is no stack of cards, closing to the map is one gesture from any depth.

[demo — live demo: LocalPal prototype]
  Caption: The prototype, live. Tap a pin, search in a full sentence, join a plan — and try dragging the right edge of the screen.

A social map has dozens of plans at once, so the map manages density by distance. From far away a single badge over the city name sums it up ("50+ activities"); at mid distance only the most interesting pins survive and the rest shrink to dots; up close everything shows and stacks when it collides. Search accepts keywords, but also whole sentences — "I want something chill tonight" — because someone looking for a plan has a mood and a moment, not a keyword. The system shows its reading in stages ("Reading your vibe…") and returns results with a line each on why they fit, plus chips you can remove to correct it.

[photo needed — Map at minimum detail — the '50+ activities' badge (figure 20).]
[photo needed — Map at maximum detail, pins stacking (figure 22).]
[photo needed — Search results for a sentence, with the 'why it fits' lines and the chips (figure 23.5).]

The activity card puts the who before the what: the organiser appears with their face and opens their profile, because you join a plan as much for the people as for the plan. Venue events have a second level, "going together" — the plans of people inside that event — so you never join an anonymous event of 62 people, you join someone's plan to go. On the day, the bottom row of a plan in My plans turns into a slider; dragging it to the end confirms you're going and reveals who else has, with names and times. Only those who confirmed, never those who didn't, so the list works as an incentive.

[photo needed — A venue event card with the 'going together' list (figures 25 and 27).]
[photo needed — My plans on the day of the activity, the slider mid-drag (figure 37).]
[photo needed — The own profile with the QR as the main action and the 'certified food hunter' headline (figure 29).]

Onboarding asks what any sign-up form asks, but nothing is answered by filling a field. Interests are bubbles that jump from the centre with real physics — they bump into each other, you push them, they light up when picked — and every answer sticks to the stage as a sticker, so the profile is born in front of you as a collage. When you confirm the last step the camera flies through the decorative city and the real one appears on the other side, already populated. Then a short guided tour walks you into your first plan, because joining the first plan is the highest psychological barrier in a social app and knocking it down in a guided, risk-free context is the promise of the app kept before leaving you alone.

[photo needed — Onboarding: the interest bubbles mid-bounce (figure 54).]
[photo needed — Onboarding: the sticker collage with name, interests and area (figure 55).]
[photo needed — The first-plan tour on the real map (figure 60 or 61).]

The prototype was built twice: wireframes of the main screens to fix the structure, then the design system as Figma components with every flow recomposed on that base until the final screens, and from there a React build with Claude Code — the one embedded above — because confirmation states, microinteractions and transitions live in use, and a still image sells them short.

[photo needed — The Figma working file zoomed out (figure 15): wireframes on top, the successive iterations down to the final screens below.]

## Learnings (chapter: Post mortem)

**What I'd do differently, and what I'm keeping**

Three results I'm proud of. Reframing discovery and coordination as one operation turned out to be productive — it holds up everything designed after it. The layered offer gives a concrete answer to the cold start without giving up the differential. And the time dimension, the relevance curve, appeared during the research as a design finding that was not obvious when I started.

Things I would change: starting the primary research earlier would have left room for a second round, or for validation, which is the phase that closes the double diamond and is still pending. The sample could have been bigger. And a chunk of the time spent on methodological frameworks I later discarded would have been saved by defining the scope sooner.

What stays with me beyond the document: how to integrate research and product without one swallowing the other, the discipline of not answering with design what is structural, and handling levels of evidence — being forced, in every sentence, to say what is demonstrated, what is a pattern and what is a bet. Thank you, Nicola, for keeping me honest on that last one.


---

# Camper

Kicker (not rendered on the page now): Proposal film · 2894 Studio · 2026
Tagline: Everyone is equal in their feet.
Summary: A sixty-second proposal film for Camper, made end to end with generative AI at 2894 Studio: concept, storyboard, every still and every shot.

Facts:
- Type: Proposal film · 2894 Studio, 2026
- Fields: Concept, storyboard, AI image and video generation, edit
- Role: All of it
- Length: 60 seconds

Hero: [video — /media/camper.mp4]
  Caption: The film. Sound on.

## The idea

**One brand, every kind of feet**

*Lede:* A proposal for Camper made at my last job, 2894 Studio, where I did all of it: the concept, the storyboard, every generated still and every generated shot, and the edit.

The idea is simple and it is the whole film: Camper is a brand that everyone can wear and everyone does wear. A kid, a grandmother, a chef, a skater, someone on their way to a wedding — the faces, the places and the lives could not be more different, and the shoes are the same. Whatever else separates people, they are equal in their feet. So the film keeps cutting between people who would never share a frame, and the one thing that stays constant, shot after shot, is what they are standing in.

[photo needed — Still from the film: one of the 'unexpected' wearers, feet in frame.]
[photo needed — Still from the film: a contrasting wearer, same shoe, same framing — so the pair reads as the idea.]

## Process

**From a storyboard to sixty seconds**

It started on paper. I storyboarded the full minute first — who appears, in what order, where the cuts land on the music — so that generating anything had a target. Then each frame became a still: prompts written and rewritten across a mix of image models until the person, the light and the shoe matched the board, laid out on one big canvas so I could see the whole cast at once and keep them consistent. The stills that held up were pushed through video models to become the shots, and the shots were cut against the board in the edit.

[photo needed — Photo of the canvas where the stills were generated: the grid of images with their prompts visible.]

Working this way, the design work is in the choosing. A model will give you a hundred plausible people; the film only works if every one of them feels like a real person you'd pass on the street, and if the shoe is unmistakably a Camper in every single frame. Most of the time went on the discarding.

[photo needed — One frame of the storyboard, ideally the sketch next to its final still.]
[photo needed — A prompt → still → video-frame triptych for one shot.]

## Learnings

**What it taught me**

That a concept has to be one sentence before it is a hundred prompts. Every time a shot drifted, it was because I had lost the sentence, not because the model was wrong. And that generative tools reward the same thing a shoot does: knowing exactly what you want before the camera rolls, and being ruthless with everything that isn't it.


---

# Convertr

Kicker (not rendered on the page now): Side project · Desktop app · 2026
Tagline: A video converter where the box is the whole interface.
Summary: A desktop app that turns any video into a GIF, MP4, WebM, MOV, AVI, MKV or MP3 — drop it, trim it, drag the result out. Designed and built solo; the real UI runs live on this page.

Facts:
- Type: Side project · 2026
- Fields: Product design, interaction design, desktop
- Role: Design and build, solo
- Stack: Solid.js, Electron, FFmpeg, yt-dlp

Hero: [demo — live demo: Convertr]
  Caption: The real interface, live. Drop a video or a GIF onto it; the conversion engine is simulated in the browser, everything else is the app.

## Why

**I convert a lot of videos for moodboards**

*Lede:* Convertr is a desktop app that takes any video — dropped in or fetched from a URL — and gives you back a GIF, an MP4, a WebM, whatever you need, trimmed to the bit you wanted.

Timeline (Mar, Apr, May, Jun):
- Design: Mar → Apr
- Build: Apr → May
- Mocked engine for the web: Jun → Jun
Note: A side project over a spring.

I made it because I was doing this by hand every week. Building moodboards means collecting a lot of motion, and most of it needs to become a GIF or a smaller MP4 before it is useful. The online tools gave me no control over size, frame rate or the exact cut; the tool that gave me control, Premiere, turned a ten-second job into a project. I wanted something in between that felt like nothing at all: paste the video, convert, drag the result out onto the desktop, done.

It was also an exercise. It is my first vibecoded app, and I wanted to see how far the design could be pushed when I was the one holding the code — whether I could make the interface do the thing I would have specced and then watched get simplified away.

## The box

**One bounding box, morphing through everything**

The whole design is one box. When the app is idle, the box sits in the middle of the window drawn by four guide lines and corner crosshairs, cycling through the shapes a video can be — widescreen, vertical, four-by-three, square — one step per spin of the cross. Drop a file on it and the box becomes a loading bar. Then it becomes the video, sized to the video's own aspect. Open the settings and the box gives up one dimension to make room, cropping the video instead of shrinking it, so it stays big. Press convert and it collapses into a bar again with a row of bricks carrying the progress. And when the result lands, the box steps outward, the dotted grid shows around the media, and three chips hang off the corners: the output size, the delta against the original, and download — which you drag.

Carousel (hint: Drag through the states):
[photo needed — Screen: the idle state — the box drawn by guide lines and crosshairs, the 'DROP A FILE OR PASTE A URL' hint.]
  Caption: Idle: four guide lines, cycling through the shapes.
[photo needed — Screen: the editor with a vertical video loaded, the box narrow and tall, the format dropdown open.]
  Caption: Loaded: the box takes the video's own aspect.
[photo needed — Screen: converting — the box collapsed into a bar with the carrier bricks mid-run.]
  Caption: Converting: a bar again, bricks carrying the progress.
[photo needed — Screen: the result — the box stepped out, the dotted grid visible, OUTPUT SIZE, delta and DOWNLOAD chips on the corners.]
  Caption: The result: stepped out, chips on the corners.

That is the part I care about. Every state is the same four lines moving, so you always know where the thing you're looking at came from and what it will become. Nothing appears from nowhere, no panel slides over another. The content decides the shape of the interface, not the other way round — a portrait video and a landscape one get different apps, and the settings panel sits to the right of one and under the other. The rest of the language follows the box: one accent, a hot pink on warm grey, a dotted paper grid, mono labels that scramble into place, and springs on anything you touch.

[photo needed — A strip of five or six frames of the box morphing: idle → bar → video → settings open → converting → result. Screen recordings stitched, or the Paper design file's frames.]

## Details

**The small things it does**

- **Three ways in.** Drop a file, paste a URL, or paste a video from the clipboard. The URL path runs through yt-dlp, so a YouTube or X link is as good as a file.
- **Trim on the timeline.** A scrubbable timeline with in and out handles, because the bit you want is almost never the whole clip.
- **Seven formats, one picker.** GIF, MP4, WebM, MOV, AVI, MKV and MP3 — picking MP3 strips the video and keeps the sound. GIF exposes width and frame rate; the estimate of the output size updates as you change them.
- **FFmpeg underneath.** The desktop app wraps FFmpeg through a local server and ships as an Electron build for Windows and Mac. The version on this page replaces that engine with a simulation so the full flow runs in the browser with nothing to install.

## Learnings

**What building it myself changed**

Holding the code meant the box never got simplified into a normal layout, which would have happened in any handoff — it is the kind of idea that survives only if the person who wants it is the person implementing it. It also meant learning where the design actually lives: half of the feel is in numbers I tuned by watching it move, spring stiffness and stagger delays and how far the result steps out, and none of that was in the design file.

If I did it again I would build the mocked engine first. Having the whole flow run without FFmpeg, which I only did to embed it here, would have made every iteration on the interface ten times faster from the start.


---
