# Project copy

Everything the case-study pages say, pulled from apps/web/src/content/projects/*.ts. Media is shown in brackets where it sits.

# LocalPal

Kicker (not rendered on the page now): Master's thesis · UDIT · 2026
Tagline: Finding and organising the plans a city doesn't show you.
Summary: A map app where young adults in European cities find the small, niche things to do and the people to do them with. Concept, brand, design system and a working prototype, built solo.

Facts:
- Fields: Product design, interaction design, design system, service design
- Year: 2026
- Role: Everything: research, concept, brand, UI, prototype
- Live: localpal.co (https://localpal.co)

Hero: [photo needed — The onboarding sticker collage on one phone, large, on the LocalPal blue. One screen, not a montage.]

## Overview

**One map for the plans a city doesn't show you**

*Lede:* LocalPal is an app where young adults in European cities find the niche things to do and the people to do them with, on one map.

It is my master's thesis at UDIT: four months of research, design and build, done solo, with everything overlapping toward the end. This page shows the product. The full research is linked at the bottom.

> A city is much more than its obvious plans. The best ones don't exist until someone makes them happen. LocalPal is where they happen.
> — The brand claim

Timeline (Mar, Apr, May, Jun):
- Interviews and analysis: Mar → Apr
- Concept and decisions: Apr
- Brand and design system: Apr → May
- Screens and flows: May → Jun
- React prototype: May → Jun
Note: Four months from the first interview to a working prototype. The last interviews were still being analysed when the first screens were drawn.

[video — A 30-second reel of the prototype in use: a sentence search, a pin opening into a plan, the confirm slider, the onboarding bubbles. Screen recording, cut to music.]
  Caption: The product in thirty seconds.

## The problem

**Nightlife is shrinking and the climbing gyms are full**

Young adults in European cities are going out less and doing more. Nightlife is shrinking, climbing gyms and running clubs are full, and 35% of Europeans say they feel lonely at least some of the time. Part of this is money and it varies a lot by country, but the direction is clear: there are more and more things to do, and no good way to find them.

[photo needed — Figure: the 'cultural moment' board (fig2_momento_cultural.svg).]

For a concert or a bar, you find the plan and then you find company. For climbing, hiking or padel there is no plan to find: it doesn't exist until someone proposes it and others join. Finding the plan and finding the people are the same step, and no app treats them that way. Friends, Instagram and Google Maps already cover the popular bars and the big concerts. What's left uncovered is everything small.

[photo needed — Figure: the competitive landscape, the gap where LocalPal sits marked top-right (fig4_panorama_competitivo.svg).]

**What six people who had just moved to a new city told me**

Five Erasmus students in four countries and one volunteer from a buddy programme, each asked about the last time they did something. Three things came out that changed the product.

1. **When a plan falls apart, people blame the plan, not the coordination.** A badminton session in fifteen centimetres of snow where nobody could find the entrance. Seven people in Segovia with every good restaurant full. Nobody comes out of that thinking "I needed a coordination tool"; they think badminton was a bad idea. So the app can't sell itself as the fix for a problem nobody sees. It has to be useful for something else first: knowing what's on.

2. **Meeting strangers worries people in three specific ways.** Will they actually show up. How exposed do I look posting alone. Is this going to turn into a dating app, a bigger worry for women. All three are answered by the same shape: every plan is for a group, it needs a minimum number of people to happen, and everyone in it is verified.

3. **Nobody needs this app in their first week.** Welcome weeks and flatmate dinners fill the first month. The wish for a climbing partner or a small gallery show comes later, around week six, when the novelty runs out and the friend group has settled. So LocalPal has to be on the phone before it's needed, and the onboarding has to be worth opening on its own.

[photo needed — Figure: the relevance curve, LocalPal's window shaded at the crossing (fig1_curva_relevancia.svg).]

## How it works

**Venues post events, people post plans, and every plan is a group**

- **Two kinds of plans.** Venues and organisations (a climbing gym, a student association, a museum) post their events. People post their own plans. The venues make the app useful from day one; the people's plans are the reason to keep it.
- **Anyone can post a plan.** No hosts, no approval, no group to join first. You propose, others come. That's Meetup's biggest barrier, removed.
- **Every plan is a group.** No one-to-one meetings. A plan needs a minimum number of people to happen, and that is what stops no-shows, the awkwardness of posting alone, and the slide into a dating app that sank Nomadtable.
- **You verify to join.** A university email or a QR check-in at a partner event unlocks the social side. Wanting to verify already says something about you.
- **Money only on the venue side.** Posting and joining are always free. Revenue comes where paying is already normal: a ticket, a gym session. Every app that charged between people ended up professional and cold.

[photo needed — Figure: the service blueprint drawn as a cycle, a finished plan feeding the next one.]
[photo needed — Three frames of the storyboard: Marco on the map, the open plan, the three of them at the gym.]

## Brand and design system

**A blue that means connection, shapes that put you at ease**

The brand is a connector: it puts people in touch with their city and with each other, and it talks like a friend with good judgement. The blue is the web link blue, the colour of connection (and quietly the European blue). The typeface is PP Neue Montreal, a neo-grotesque with the same European nod. The first moodboard was more angular, but on a phone hard shapes read cold, so the language became soft shapes, stickers and slightly tilted elements.

[photo needed — The moodboard (figure 9), including the angular first direction that got dropped.]
[photo needed — The brand sample (figure 11): logo, the blue, PP Neue Montreal set large.]

The design system is a set of rules more than a set of screens. Every visual property lives in one place and every component reads from it. Hierarchy is done with depth of blue, and white is kept for buttons so the thing you can tap always stands out. On the map the colours flip: light map, blue pins. Corners are squircles with twenty-one named roles. Motion has one personality (about 250 ms, a small bounce) and one rule: animate what you touch, not what the system reports. A button bounces; a progress bar never does, because a bouncing progress bar would be lying.

[photo needed — The colour scheme (figure 12): the blue ramp, lavender, white as accent, the inverted map palette.]
[photo needed — A grid of the squircle roles, or the superellipse diagram (figure 13).]
[video — A few components pressed, morphing and settling, to show the motion personality.]

## The app

**Everything happens on the map**

The map is the only real screen. Cards, sheets and plan details sit on top of it and turn into each other when touched: the search pill becomes the search, the search becomes a venue, the venue becomes a plan, and back. Going deeper zooms in from the point you touched; going back zooms out. From any depth, closing is one gesture.

From far away the city is one badge ("50+ activities"); at mid distance only the best pins survive; up close everything shows and stacks. Search takes whole sentences ("I want something chill tonight"), because when you're looking for a plan you have a mood and a moment, not a keyword, and each result says why it fits.

Carousel (hint: Drag through the states):
[photo needed — Map at minimum detail, the '50+ activities' badge (figure 20).]
  Caption: Far away, the city is one number.
[photo needed — Map at maximum detail, pins stacking (figure 22).]
  Caption: Up close, everything shows.
[photo needed — Search results for a sentence, with the 'why it fits' lines and the chips (figure 23.5).]
  Caption: Search in a sentence, corrected with chips.
[photo needed — The map pins (figure 12b): venue tile with category icon vs peer plan with the proposer's photo.]
  Caption: Venues get a tile, people get a face.

**You join people, not events.** The plan card shows the organiser first, with their face, because you join a plan as much for the people as for the plan. A venue event has a second level, "going together": the plans of the people who are going, so you never join an anonymous event of 62 people, you join someone's plan to go. On the day, the bottom of the plan turns into a slider. Drag it to the end and you're confirmed, and you see who else is. Only the confirmed ones show, which is the nudge.

[photo needed — A venue event card with the 'going together' list (figures 25 and 27).]
[photo needed — My plans on the day of the activity, the slider mid-drag (figure 37).]
[photo needed — The own profile with the QR as the main action and the 'certified food hunter' headline (figure 29).]

**A profile you build by playing.** Interests are bubbles that jump from the centre with real physics. They bump into each other, you push them, they light up when picked, and every answer sticks to the stage as a sticker, so your profile is built in front of you as a collage. On the last step the camera flies through the illustrated city and the real one appears on the other side, already full. A short guided tour then walks you into your first plan, because joining the first one is the hardest step in any social app, and the app takes it with you before leaving you on your own.

[photo needed — Onboarding: the interest bubbles mid-bounce (figure 54).]
[photo needed — Onboarding: the sticker collage with name, interests and area (figure 55).]
[video — The camera flying through the illustrated city into the real map.]
[photo needed — The first-plan tour on the real map (figure 60 or 61).]

## Learnings

**What I'd do differently**

The prototype has not been tested with users. Six interviews are enough to find patterns and not enough to prove them, and the Erasmus launch is a bet on a channel, not a proven market. With more time, testing comes first.

What I keep: treating finding the plan and finding the people as one step holds up everything designed after it, and the habit of saying, in every sentence, what is proven, what is a pattern and what is a bet.

## Try it

**Everything above is real. Try it.**

[demo — live demo: LocalPal prototype]
  Caption: Tap a pin, search in a full sentence, join a plan. Then try dragging the right edge of the screen.

The prototype is a React build made with Claude Code on top of the Figma design system, because confirmations, small interactions and transitions only make sense when you use them. A still image sells them short.

[link needed — the thesis PDF, for readers who want the full research.]


---

# Camper

Kicker (not rendered on the page now): Spec film · 2894 Studio · 2026
Tagline: Everyone is equal in their feet.
Summary: A sixty-second spec film for Camper, made end to end with generative AI at 2894 Studio: concept, storyboard, every still, every shot and the edit.

Facts:
- Type: Spec film · 2894 Studio, 2026
- Fields: Concept, art direction, AI image and video generation, edit
- Role: All of it
- Length: 60 seconds

Hero: [video — /media/camper.mp4]
  Caption: The film. Sound on.

## The idea

**One brand, every kind of feet**

*Lede:* A spec film for Camper, made at 2894 Studio, my last job. I did all of it: the concept, the storyboard, every generated still and shot, and the edit.

The idea is one sentence and it is the whole film. Camper is a brand everyone can wear and everyone does wear: a kid, a grandmother, a chef, a skater, someone on their way to a wedding. The faces, the places and the lives could not be more different, and the shoes are the same. So the film keeps cutting between people who would never share a frame, and the one thing that stays constant, shot after shot, is what they are standing in.

[photo needed — Still from the film: one of the unexpected wearers, feet in frame.]
[photo needed — Still from the film: a contrasting wearer, same shoe, same framing, so the pair reads as the idea.]
[photo needed — A grid of eight or nine stills, the whole cast at once. This is the page's second hero.]

## How it's made

**A storyboard first, then a hundred prompts, then the choosing**

Everything starts on paper: the full minute storyboarded first, who appears, in what order, where the cuts land on the music, so every generation has a target. Each frame then becomes a still, prompted and re-prompted across several image models on a Flora canvas until the person, the light and the shoe match the board. The stills that hold up go through video models to become shots, and the shots are cut against the board.

[photo needed — The Flora canvas: the grid of stills with their prompts and connections visible. Zoomed out enough to show the scale of it.]
[photo needed — One storyboard frame next to its final still.]

The design work is in the choosing. A model gives you a hundred plausible people; the film only works if every one of them feels like someone you'd pass on the street, and if the shoe is unmistakably a Camper in every frame. Most of the time goes on throwing things away.

[photo needed — Process photos: the storyboard on the desk, the canvas on screen, whatever shows the hands-on part.]

## Learnings

**A concept has to be one sentence before it is a hundred prompts**

Every time a shot drifted, it was because I had lost the sentence, not because the model was wrong. Generative tools reward the same thing a shoot does: knowing exactly what you want before anything is generated, and being ruthless with everything that isn't it.


---

# Convertr

Kicker (not rendered on the page now): Side project · Desktop app · 2026
Tagline: A video converter where the box is the whole interface.
Summary: A desktop app that turns any video into a GIF, MP4, WebM, MOV, AVI, MKV or MP3. Drop it, trim it, drag the result out. Designed and built solo, and the real interface runs on this page.

Facts:
- Type: Side project · 2026
- Fields: Product design, interaction design, desktop, build
- Role: Design and build, solo
- Stack: Solid.js, Electron, FFmpeg, yt-dlp

Hero: [demo — live demo: Convertr]
  Caption: The real interface. Drop a video or a GIF on it, trim, convert, drag the result out. On this page the engine is simulated, so the flow is real and the file that comes out is a stand-in.

## Overview

**A desktop app I designed and built alone**

*Lede:* Convertr takes any video, dropped in or pasted as a link, and gives you back a GIF, an MP4, a WebM, whatever you need, trimmed to the bit you wanted.

I made it because I was doing this by hand every week. Moodboards need a lot of motion, and most of it has to become a GIF or a smaller MP4 before it's useful. Online tools give no control over size, frame rate or the exact cut; Premiere gives all the control and turns a ten-second job into a project. Convertr is the thing in between: paste the video, convert, drag the result onto the desktop, done. [fill in — one line of use: how many files you've run through it since June.]

It is also my first app built with AI, and the test was whether the interface could keep an idea that a normal handoff would have simplified away.

Timeline (Mar, Apr, May, Jun):
- Design: Mar → Apr
- Build: Apr → May
- Web demo: Jun
Note: A side project over a spring.

## The box

**The video decides the shape of the app, not the other way round**

The whole design is one box. Idle, it sits in the middle of the window, drawn by four guide lines and corner crosshairs, cycling through the shapes a video can be: widescreen, vertical, four-by-three, square. Drop a file and the box becomes a loading bar. Then it becomes the video, at the video's own proportions. Open the settings and the box gives up one side to make room, cropping the video instead of shrinking it, so it stays big. Press convert and it collapses into a bar again, with a row of bricks carrying the progress. When the result lands, the box steps outward, a dotted grid appears around it, and three chips hang off the corners: the output size, how much smaller it got, and download, which you drag.

Carousel (hint: Drag through the states):
[photo needed — Idle: the box drawn by guide lines and crosshairs, the 'DROP A FILE OR PASTE A URL' hint.]
  Caption: Idle: four lines, cycling through the shapes.
[photo needed — The editor with a vertical video loaded, the box narrow and tall, the format dropdown open.]
  Caption: Loaded: the box takes the video's own shape.
[photo needed — Converting: the box collapsed into a bar with the bricks mid-run.]
  Caption: Converting: a bar again, bricks carrying the progress.
[photo needed — The result: the box stepped out, the dotted grid visible, size, delta and DOWNLOAD chips on the corners.]
  Caption: Done: stepped out, chips on the corners.

Every state is the same four lines moving, so you always know where the thing you're looking at came from and what it will become. Nothing appears from nowhere and no panel slides over another. A portrait video and a landscape one get different apps: the settings sit to the right of one and under the other. Everything else follows the box: one accent, a hot pink on warm grey, a dotted paper grid, mono labels that scramble into place, and a spring on anything you touch.

[photo needed — Side by side: the same vertical video loaded in a typical converter (fixed panels, the video shrunk into a preview corner) and in Convertr (the box takes the video's shape). No product names needed.]
  Caption: Same file, two ideas of what a converter is.
[video — The box morphing through all six states: idle, bar, video, settings open, converting, result. One continuous screen recording.]

## Details

**The small things it does**

- **Three ways in.** Drop a file, paste a link, or paste a video from the clipboard. Links go through yt-dlp, so a YouTube or X link works like a file.
- **Trim on the timeline.** A scrubbable timeline with in and out handles, because the bit you want is almost never the whole clip.
- **Seven formats, one picker.** GIF, MP4, WebM, MOV, AVI, MKV and MP3. Picking MP3 keeps the sound and drops the video. GIF exposes width and frame rate, and the estimated output size updates as you change them.
- **FFmpeg underneath.** The desktop app wraps FFmpeg through a local server and ships as an Electron build for Windows and Mac. The version on this page swaps that engine for a simulation, so the whole flow runs in the browser with nothing to install.

[photo needed — The timeline with in and out handles set.]
[photo needed — The GIF settings with width, frame rate and the size estimate.]

## Learnings

**The box only exists because the designer was the developer**

Holding the code meant the box never got flattened into a normal layout, which is what happens to this kind of idea in a handoff. It also showed me where the design actually lives: half of the feel is in numbers tuned by watching it move (spring stiffness, stagger delays, how far the result steps out), and none of that was in the design file.

If I did it again I'd build the simulated engine first. Having the whole flow run without FFmpeg, which I only did to put it on this page, would have made every iteration on the interface ten times faster from the start.
