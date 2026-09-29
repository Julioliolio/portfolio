# Project copy

Everything the case-study pages say, pulled from apps/web/src/content/projects/*.ts. Media is shown in brackets where it sits.

# LocalPal

Kicker (not rendered on the page now): Master's thesis · UDIT · 2026
Tagline: Finding and organising the plans a city doesn't show you.
Summary: A map app for young adults in European cities, to find the small, niche things to do and the people to do them with. Research, concept, brand, design system and a working prototype, all done on my own.

Facts:
- Fields: UX research, product design, interaction design, brand design
- Year: 2026
- Role: Research, concept, brand, UI and prototype
- Tools: Figma, Claude
- Live: localpal.co (https://localpal.co)

Hero: [photo needed — The onboarding sticker collage on one phone, large, on the LocalPal blue.]

## Overview

**LocalPal. Finding the plans a city doesn't show you, and the people to do them with**

LocalPal is the app for young adults who have just landed in a European city and want to do things, not just go out. The small climbing session, the running club, the gallery opening nobody posts about. It puts all of that on one map, and it puts the people going on the same map, so finding the plan and finding the company happen in one place.

> A city is much more than its obvious plans. The best ones don't exist until someone makes them happen. LocalPal is where they happen.
> — The brand claim

## Scope

**Timeline and phases of the project**

*The project was my master's thesis at UDIT, so the research, the writing and the defence ran alongside the design work, and toward the end everything was happening at once.*

Timeline (Mar, Apr, May, Jun):
- Interviews and analysis: Mar → Apr
- Concept and decisions: Apr
- Brand and design system: Apr → May
- Screens and flows: May → Jun
- React prototype: May → Jun

[video — A 30-second reel of the prototype in use. Cut to music.]
  Label: The product in thirty seconds. Sound on!

## Problem

**A whole new way of going out, and no door into it**

Young adults in European cities are going out less and doing more. Nightlife has been shrinking for a decade, climbing gyms and running clubs are full, and 35% of Europeans say they feel lonely at least some of the time. A new industry has grown around this: small, niche activities, each with a handful of people, that together weigh more than the mass offer.

[photo needed — Figure: the 'cultural moment' board (fig2_momento_cultural.svg).]
  Label: Nightlife down, sports and loneliness up

The catch is that there is no concrete place to find any of it. Friends, Instagram and Google Maps cover the popular bars and the big concerts; the climbing session on Thursday lives in a WhatsApp group you're not in. And the platforms that tried to fix it either turned into dating apps or into something semi-professional.

[photo needed — Figure: the competitive landscape (fig4_panorama_competitivo.svg).]
  Label: Eleven platforms, none in the gap

## Research

**Talking to people who had just moved**

To understand it from the inside I did six long interviews with Erasmus students in four countries, asking each of them about the last time they did something, so I'd get stories rather than opinions. Before that, a quick pass through a few hundred Reddit threads from people who had just moved, to know what to ask.

[photo needed — NEW: one image with three quote cards from the interviews, in the interviewees' words.]
  Label: Six interviews, four countries

Three things came out. People never think they have a coordination problem, they think the plan was bad. Meeting strangers worries them in very specific ways: whether people show up, how exposed you feel posting alone, and whether it turns into a dating app. And the one that changed the project the most: nobody needs this in their first week.

The first month in a new city is covered. Welcome weeks, flatmate dinners, the big bars; everyone is new and everyone is available, and an app for niche plans has nothing to add. Around week six that runs out. The novelty wears off, the friend group has settled, and people start wanting the specific things: a climbing partner, a small gallery show, a run on Sunday. That is the moment nothing serves, and it's where LocalPal lives.

[photo needed — Figure: the relevance curve (fig1_curva_relevancia.svg): the mainstream falling, the long tail rising, LocalPal's window shaded where they cross.]
  Label: The relevance curve

I call it the relevance curve, and it decided more than any other finding. It ruled out launching at arrival, when the app would lose to the welcome week. And it created the product's hardest problem: LocalPal has to be on the phone before it's needed, so it needs a reason to be opened in week one to still be there in week six. Most of the decisions that follow come from that.

## Concept

**The proposed solution**

An app where the plans and the people are on the same map. Venues and organisations post their events, so there's something to do from day one; people post their own plans, which is why you stay. Every plan is a group with a minimum size, you verify to join, and it's always free between people. Money only comes in where paying is already normal, like a ticket or a gym session.

[photo needed — NEW: five small cards in a row, one per decision, icon plus one line.]
  Label: The five decisions
[photo needed — The three persona cards (figures 3, 4, 5).]
  Label: Three people to design for
[photo needed — Three frames of the storyboard.]
  Label: Storyboard

## Brand

**A blue that means connection, and shapes that make you feel at ease**

The brand idea is the connector: LocalPal puts people in touch with their city and with each other, and it talks like a friend with good judgement. The blue comes from the web link, the colour of connection (and quietly, the European blue). The first moodboard was much more angular, but on a phone hard shapes read cold, so it moved toward soft shapes, stickers and things that are slightly tilted.

[photo needed — The brand sample (figure 11): logo, the blue, PP Neue Montreal set large.]
[photo needed — The moodboard (figure 9).]

The design system is a set of rules more than screens: depth of blue for hierarchy, white only for what you can tap, squircle corners, and one motion personality with one rule. Animate what you touch, never what the system reports.

[photo needed — One design-system sheet: the blue ramp, the inverted map palette, the squircle corners.]
  Label: The system
[video — Components pressed and settling, next to a progress bar filling with no bounce.]
  Label: Bounce on touch, none on progress

## Solution

**Everything happens on the map**

Some of the things that make LocalPal different from the apps that came before it:

1. **The map is the feed.** There is no list. Cards and sheets sit on top of the map and turn into each other when you touch them, so you never lose where you are.
2. **Search in a sentence.** "I want something chill tonight" works, because you have a mood and a moment, not a keyword.
3. **Going together.** Big venue events show the plans of people going, so you join someone's plan rather than an anonymous event of 62 people.
4. **The confirm slider.** On the day, drag to confirm and you see who else has. Only the confirmed ones show.
5. **Onboarding you play.** Interests are bubbles you pick and stickers that build your profile as a collage, and a short tour takes you into your first plan.

[photo needed — Map at minimum detail, the '50+ activities' badge (figure 20).]
[photo needed — Map at maximum detail, pins stacking (figure 22).]
[photo needed — Search results for a sentence, with the 'why it fits' lines (figure 23.5).]
[photo needed — A venue event card with the 'going together' list (figures 25 and 27).]
[video — The confirm slider being dragged, the list of confirmed people appearing.]
[photo needed — The own profile with the QR as the main action (figure 29).]
[video — The interest bubbles being picked and the stickers landing.]
[video — The camera flying through the illustrated city into the real map, ending on the first-plan tour.]

## Learnings

**What doing the whole thing by yourself really means**

When I started I thought the product would be the easy part and the thesis the hard one. It was the other way round: the research gave me the decisions, but the product only became real when I stopped writing about it and built it, and most of what I'm proud of, the map, the slider, the onboarding, only exists because I could code it myself.

Had I had more time, I would have tested it. Six interviews are enough to find patterns but not to prove them, and the prototype has never been in a stranger's hands. That would be the first thing.

What I'm most proud of is that the app doesn't feel like a research project. It feels like something you'd want on your phone.

Any questions? Write me, I love talking about this one.

[photo needed — A photo from the defence, or of the project on screen at UDIT.]
  Label: Presenting LocalPal at UDIT

## Try it

**Everything you've seen is real, go try it**

[demo — live demo: LocalPal prototype]
  Label: Tap a pin, search in a full sentence, join a plan. And try dragging the right edge of the screen.

[link needed — the thesis PDF.]


---

# Camper

Kicker (not rendered on the page now): Spec film · 2894 Studio · 2026
Tagline: Everyone is equal in their feet.
Summary: A sixty-second spec film for Camper, made end to end with generative AI at 2894 Studio: concept, storyboard, every still, every shot and the edit.

Facts:
- Type: Spec film · 2894 Studio, 2026
- Fields: Concept, art direction, AI image and video generation, edit
- Role: All of it
- Tools: Flora, After Effects, Premiere
- Length: 60 seconds

Hero: [video — /media/camper.mp4]
  Label: The film. Sound on!

## The idea

**One brand, every kind of feet**

A spec film for Camper, made at 2894 Studio, my last job. Camper is a brand that everyone can wear and everyone does wear: a kid, a grandmother, a chef, a skater, someone on their way to a wedding. The film keeps cutting between people who would never share a frame, and the one thing that stays constant is what they're standing in.

[photo needed — A grid of eight or nine stills, the whole cast at once.]
  Label: The cast

## How it's made

**A storyboard, then a lot of prompts, then a lot of choosing**

The full minute was storyboarded first, so every generation had a target. Each frame became a still, prompted across a few image models on a Flora canvas until the person, the light and the shoe matched the drawing. The stills that held up went through video models to become shots.

[photo needed — One storyboard frame next to its final still.]
  Label: Board to still
[photo needed — The Flora canvas, zoomed out enough to show the scale.]
  Label: The canvas

The design work is in the choosing. A model gives you a hundred plausible people; the film only works if each one feels like someone you'd pass on the street, and if the shoe is unmistakably a Camper in every frame.

[photo needed — Process photos: the storyboard on the desk, the canvas on screen.]

## Learnings

**One sentence before a hundred prompts**

Every time a shot drifted, it was because I had lost the sentence, not because the model was wrong. Generative tools reward the same thing a real shoot does: knowing what you want before anything is generated, and being ruthless with everything that isn't it.


---

# Convertr

Kicker (not rendered on the page now): Side project · Desktop app · 2026
Tagline: A video converter where the box is the whole interface.
Summary: A desktop app that turns any video into a GIF, MP4, WebM, MOV, AVI, MKV or MP3. Drop it, trim it, drag the result out. Designed and built on my own, and the real interface runs on this page.

Facts:
- Type: Side project · 2026
- Fields: Product design, interaction design, desktop, build
- Role: Design and build
- Stack: Solid.js, Electron, FFmpeg, yt-dlp
- Tools: Figma, Claude

Hero: [demo — live demo: Convertr]
  Label: The real interface. Drop a video or a GIF on it, trim, convert, drag the result out. The conversion is simulated on this page, so the file you get is a stand-in; everything you see and touch is the app.

## Overview

**A little desktop app I designed and built on my own**

Convertr takes any video, dropped in or pasted as a link, and gives you back a GIF, an MP4, a WebM or whatever you need, trimmed to the bit you wanted. I made it because I was doing this by hand every week for moodboards: online tools gave no control over size, frame rate or the exact cut, and Premiere turned a ten-second job into a project. [fill in — one line of use: how many files you've run through it since June.] It's also the first app I built with AI, and a bit of an experiment: could the interface keep an idea that would normally get simplified away in a handoff?

Timeline (Mar, Apr, May, Jun):
- Design: Mar → Apr
- Build: Apr → May
- Web demo: Jun
Note: A side project over a spring.

## The box

**The video decides the shape of the app, not the other way round**

The whole design is one box. Empty, it sits in the middle of the window drawn by four guide lines, cycling through the shapes a video can have. Drop a file and it becomes the video, at the video's own proportions. Open the settings and the box gives up one side to make room, cropping the video instead of shrinking it.

[photo needed — Two screens side by side: a vertical video loaded with settings under it, a landscape one with settings to the right.]
  Label: Portrait and landscape get different apps

Press convert and it collapses into a bar with a row of little bricks carrying the progress. When the result is ready the box steps outward and three chips hang off the corners: output size, how much smaller it got, and download, which you drag.

Carousel (hint: Drag through the states):
[photo needed — Converting: the box collapsed into a bar with the bricks mid-run.]
  Label: Converting
[photo needed — The result: the box stepped out, the dotted grid visible, the three chips on the corners.]
  Label: Done

Every state is the same four lines moving, so you always know where what you're looking at came from and what it's about to become. Nothing appears out of nowhere and no panel slides over another. Everything else follows the box: one accent colour, a dotted paper grid, mono labels that scramble into place, and a little spring on anything you touch.

[video — The box morphing through all its states in one continuous recording.]
  Label: One box, every state
[photo needed — Side by side: the same vertical video in a typical converter (fixed panels, the video shrunk into a preview corner) and in Convertr. No product names needed.]
  Label: Same file, two ideas of what a converter is

## Details

**The small things it does**

- **Three ways in.** Drop a file, paste a link, or paste a video from the clipboard. Links go through yt-dlp, so a YouTube or X link works like a file.
- **Trim on the timeline.** In and out handles, because the bit you want is almost never the whole clip.
- **Seven formats, one picker.** MP3 keeps the sound and drops the video. GIF lets you set width and frame rate, and the estimated size updates as you change them.
- **FFmpeg underneath.** Wrapped through a local server, shipped as an Electron build for Windows and Mac. This page swaps the engine for a simulation so it runs with nothing to install.

[photo needed — The timeline with in and out handles set, the GIF settings open.]
  Label: Trimming

## Learnings

**The box only survived because I was also the one building it**

Holding the code meant the box never got flattened into a normal layout. It also taught me where the design actually lives: half of the feel is in numbers tuned by watching it move, like spring stiffness and how far the result steps out, and none of that was in the design file. If I did it again I'd build the simulated engine first; it would have made every iteration much faster. Any questions? Write me, I'm always up for talking about this one.
