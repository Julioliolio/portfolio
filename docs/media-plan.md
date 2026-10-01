# Media plan — the three project sheets

After estrellagracia.com/work/wavn2: bentos of clips (some with several
cells, some with one), screens on a colour field, straight on the paper
(no tray). Drafted 2026-10-01 for Julio's approval; once approved, built and
put through the judge loop (below) without stopping.

Legend for who makes each piece:

- **me** — I record or make it (Playwright on the demos, ffmpeg on films).
- **TFM** — I take it from the final thesis, once Julio sends it.
- **Julio** — a marked slot, saying what goes in it; Julio makes it later.
  Photo-real device mockups are all **Julio**; I still record the screen
  that goes inside each one and leave it in `source-assets/mockup-screens/`.

Cell notation: `[w×h]` is the cell's span in the bento's grid (12 columns
wide on desktop; cells reflow to 2 columns, then 1, on a phone). *bare* =
the component alone on a flat ground, no phone. *phone* = the whole screen
inside a drawn phone frame. Desktop clips show the clay cursor, smaller;
phone clips show a soft touch dot.

---

## What gets built first (once, for all three pages)

1. **`bento` block** in the template: a grid of cells, each a clip, a
   still or a marked slot, with its own ground colour (soft neutrals to
   start: paper, warm grey, ink). Clips are muted mp4 loops, played only
   while on screen, poster first.
2. **`field` block**: a wide soft-neutral panel with a marked slot for a
   photo-real mockup (Julio) — or, until it exists, the raw screen clip
   sitting on the field so the page is never empty.
3. **Recording rig**: Playwright (dev dependency) + scripts that drive the
   demos and record at 2×, then ffmpeg to trim, loop and encode. Re-runnable
   whenever a demo changes (`scripts/record-media.mjs`).
4. **Judge loop** (below).

---

## LocalPal

Source: the web demo (`apps/demos/localpal`, its `?capture` stages and the
real screens), `12.mp4` (a prototype run), `persona-renders/`, the thesis.

| Section | Block | What | Who |
|---|---|---|---|
| Hero | field | One phone, onboarding sticker collage, on a soft neutral | Julio (mockup) · me (screen clip) |
| Scope | single clip | The reel: 30 s of the prototype in use, cut from my recordings. No music track unless you give me one | me |
| Problem | still ×2 | The cultural-moment board and the competitive landscape, redrawn in the page's type from the thesis figures | TFM |
| Research | still | Three interview quote cards, set in the page's type, quotes from the thesis | TFM |
| Research | still | The relevance curve, redrawn as a clean SVG (animates its line in once) | TFM |
| Concept | bento 5×[1 row] | The five decisions as cards: icon + one line | me |
| Concept | bento | The three personas: render + name + one line | TFM + persona-renders |
| Concept | single | Three storyboard frames | TFM |
| Brand | bento | Logo · the blue · PP Neue Montreal set large · moodboard | me (from the demo's design system) + TFM (moodboard) |
| Brand | bento | System sheet: the blue ramp, the inverted map palette, squircle corners | me (`?ds` page) |
| Brand | bento, 2 cells | *Bounce on touch* (components pressed, bare) next to *none on progress* (the bar filling) | me |
| Solution | — | The five numbered points become five short sub-parts, each followed by its own media | — |
| 1 · The map is the feed | bento | `[8×2]` phone: venue → activity → join, the whole morph chain · `[4×1]` bare: venue pin ⇄ lozenge · `[4×1]` bare: pill ⇄ sheet | me |
| 1 · (cont.) | single clip, phone | Zooming from minimum detail ("50+ activities") to maximum (pins stacking) | me |
| 2 · Search in a sentence | bento | `[4×1]` bare: magnifier bends into × · `[8×2]` phone: typing a sentence, the thinking theatre, results with "why it fits" · `[4×1]` bare: card button morph | me |
| 3 · Going together | single, phone | A venue event card with the "going together" list | me |
| 4 · The confirm slider | bento | `[6×1]` bare: slide to RSVP · `[6×1]` phone: confirmed people appearing | me |
| 5 · Onboarding you play | bento | `[6×2]` bare: interest bubble physics · `[6×1]` phone: stickers landing on the profile collage · `[6×1]` phone: the city fly-through into the real map | me |
| Solution | microinteractions bento | The rest, as a wavn-style tray of small bare loops: locate pulse · edge-zoom goo · press squish · share/back glyph morphs | me |
| Solution | field | Three phones on a neutral field: map, search, profile with QR | Julio (mockup) · me (screens) |
| Learnings | still | A photo from the defence | Julio |
| Try it | demo + link | The live prototype; the thesis PDF as a real link | me + TFM |

## Convertr

Source: the web demo (`apps/demos/convertr`). The videos dropped into it are
cuts of your own Camper film (landscape) and a vertical crop of it
(portrait), so no third-party footage is shown.

| Section | Block | What | Who |
|---|---|---|---|
| Hero | demo | The live app stays as the hero | — |
| Overview | field | The app window on a laptop, on a soft neutral | Julio (mockup) · me (screen clip) |
| The box | single clip | **One box, every state**: empty box cycling shapes → drop → settings open → convert → bricks → result steps out, chips on the corners. One continuous take | me |
| The box | bento, 2 cells | Portrait video with settings under it · landscape with settings to the right (stills, then a slow loop each) | me |
| The box | bento, 3 cells | Converting (bar + bricks, bare, zoomed in) · done (box steps out, dotted grid) · dragging the download chip out | me |
| The box | still | Same vertical video, a typical converter vs Convertr. The "typical" side is drawn as a neutral grey wireframe (fixed panels, video shrunk to a corner), not a real product | me |
| Details | microinteractions bento | One cell per small thing: drop a file · paste a link · trim handles · format picker · GIF width/fps with the size estimate updating · mono labels scrambling · the spring on press | me |

## Camper

Source: the 1080p master (`~/Downloads/_organized/2894_/Campers/video campers.mp4`).

| Section | Block | What | Who |
|---|---|---|---|
| Hero | film | The film stays | — |
| The idea | bento, 9 cells | The cast: nine short loops (2–3 s), one person each, cut from the film | me |
| How it's made | bento, 3 cells | Board → still → shot: the storyboard frame (Julio), the still (me, a frame of the film), the moving shot (me) | me + Julio |
| How it's made | single | The Flora canvas, zoomed out | Julio |
| How it's made | bento | Close-ups of the shoe across shots: "unmistakably a Camper in every frame" | me |
| How it's made | single | Process photos | Julio |

---

## The judge loop

A separate agent, briefed as **a head of design at a top product studio
screening portfolios for a senior product designer role**. It takes its own
screenshots (desktop and phone width, the whole page, plus the clips playing)
and scores the page out of 10 with a written critique.

- Under 8 → I rework from the critique and it judges again; 3 loops max.
- It may change anything on the page, copy included.
- Marked slots (Julio's) are judged as what they say they will be.
- Each page is judged on its own; each loop is a commit on main (not pushed).
- At the end you get the scores, the critiques and what changed.

## Waiting on

- The final TFM file (LocalPal's problem, research, personas, storyboard,
  moodboard, and the thesis link). Everything else starts without it.

---

## After the judge loops (2026-10-01)

Four rounds, a fresh judge per page each time (head of design hiring a
senior product designer). Scores:

| Page | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| LocalPal | 6 | 7 | 7 | 7 |
| Convertr | 6 | 7 | 7 | 7 |
| Camper | 6 | 6.5 | 6.5 | 7 |

None reached 8. In every final critique, what holds each page back is
something only Julio can supply: real evidence (a usage number, a test,
generation counts, an outcome) and the process material in the slots.

### What changed from the plan

- No tray, no captions; cells carry a small corner label where they
  need naming (Board / Still / Shot, Rejected / Kept, Tried first).
- LocalPal: decisions as a list with "The cost:" each; personas, the
  reel, the motion-tile row, the morph tiles and the defence slot were
  cut; search and going-together appear as readable crops next to their
  phones; the competitor chart shows only the gap (no LocalPal row); the
  relevance curve and journey are labelled as a model / untested.
- Convertr: a "try a sample" button in the demo (a vertical cut of the
  Camper film, apps/demos/convertr/src/assets/sample.mp4); the timeline
  and the laptop field were cut; three decisions with a cost.
- Camper: the opening now plays at the film's own 16:9 (was 4:3, one
  number in CamperOpening.tsx and CaseStudy.tsx); the shoe grid became a
  rejected/kept slot and a shoe-fidelity slot.

### Waiting on Julio

Slots (each says what goes in it):
- LocalPal: hero mockup (one phone in hand on a Madrid street).
- Convertr: early layouts that died ("Tried first"); the result chip
  dragged into Figma (desktop app); pasting an X link (desktop app).
- Camper: the storyboard in 2–3 rows; the velcro board frame; rejected
  generations of the man on the ledge; the shoe (catalogue vs generated
  vs a failed one); one Flora branch.
- LocalPal's thesis PDF link.

Facts:
- Convertr: the "[fill in — how many files since June]" line.
- Camper: generations, days, models, how the shoe stayed accurate, what
  the film led to; Tools is still a draft.
- LocalPal: Tools now says "Figma; React and MapLibre, built with Claude
  Code" — inferred from the repo, confirm the wording.

Words I wrote that are interpretations, to check:
- Camper: the three camera rules; "its last shots take the shoes off";
  "the sentence was the tagline".
- LocalPal: the week-nine answer is from the thesis's service
  blueprint (check-in, "want to go again?"), not a built screen.

Judges' notes outside these pages (site chrome, not touched): on phone
the fixed Back sign covers text; gaps after the meta row and before the
Next band read long; grey body text is light for long reads; "Any
questions? Write me" has no link.
