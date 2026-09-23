# Type and spacing

The rules the project pages are set by. The code is `packages/lab/src/type.tsx` (the `ty-` classes) and `apps/web/src/components/work/CaseStudy.tsx` (the `cs-` ones); the specimen is `/lab/type`. If a rule here and the code disagree, fix one of them the same day.

## The idea

One family, three sizes, one weight under the title, one unit of space, one blue. Hierarchy comes from size, ink against grey, and where a thing sits — never from rules, eyebrows, capitals, numbering or a second weight. Before adding a device, take one away.

## Type

| Role | Class | Size | Line | Tracking | Weight |
| --- | --- | --- | --- | --- | --- |
| Title | `.ty-title` | fitted to the width (cap 34% of it), or `clamp(64px, 12cqw, 168px)` | 0.86 | −0.055em | Medium 500 |
| Reading | `.ty-read` | `clamp(19px, 2.1cqw, 23px)` | 1.22 | −0.018em | Regular 400 |
| Small | `.ty-small` | 13px | 1.38 | −0.003em | Regular 400 |

- **Three sizes and no more.** A heading is the reading size in ink; body is the reading size in grey (`.ty-dim`). A lede is body in ink. A margin note, a fact, a caption, a hint is the small size.
- **One weight below the title.** Medium is only the title (and the next-project name, which is a title). `<b>` inside text is told by ink, not weight. Anything set at 500 must name `--font-neue-montreal-extra` or the browser fakes it.
- **Mono is for numbers only** (`.ty-num`): list numbers, caption numbers, years, months, timecodes. Never a word.
- **No uppercase, no letter-spaced labels, no hairlines, no eyebrows, no section numbers.** The rail's contents already name and order the sections.
- **Paragraphs are indented, not spaced.** `p + p` in a reading run gets a 2.2em indent and no gap. A gap means a new run (a picture came between).
- **Title measure:** the fitted title is one line, ink pulled left by the capital's bearing so it starts on the margin. Long names get smaller, never wrap.
- **Sizes are container-relative** (cqw), measured against `.ty`, so the same rules hold in the sheet and on a phone.

## Colour

| Token | Paper | Blue ground | Ink ground |
| --- | --- | --- | --- |
| `--ty-bg` | `#fff` | `#2f6df6` | `#171513` |
| `--ty-fg` (ink) | `#2b2722` | `#fff` | `#fff` |
| `--ty-dim` (grey) | `#77716a` | white 64% | white 56% |

- **One blue, the rope's `#2f6df6`, for every project.** Project colour lives only in its media and opening.
- **Blue is a ground, not an ink.** Text is ink or grey. Blue text appears only as the title on paper (a project with an opening) and as links in reading text on paper. On a coloured ground links are underlined in the text's colour.
- A ground (`.ty-ground[data-ground]`) flips the three tokens; everything on it follows. Don't set colours on children.

## Space

Everything is in the unit **`--ty-u = clamp(20px, 2.5cqw, 28px)`** — about a line of reading text — in steps of ½, 1, 2, 4, 8 (`.ty-gap-1/2/4/8`). No other values.

| Between | Units |
| --- | --- |
| Caption and its picture; list items; a cite and its quote | ½ |
| Grid columns; figures in a row; a list or quote and the text around it | 1 |
| A run of text and the next picture (anything inside a section) | 2 |
| The header's foot and the first section | 4 |
| One section and the next | 8 |
| The last section and the foot | 8 |
| A ground's inner padding | 2 top/bottom, 1½ sides |
| The header's foot (clears the blur) | 5 |

- **Two left edges, no more.** The sheet's (title, margin note, edge-to-edge media) and the text's, three of twelve columns in (`.cs-main`, cols 4–12). Text keeps a column free on its right; media may take it.
- **The grid is twelve columns, a unit apart** (`.ty-grid`). Header: intro cols 1–7, facts cols 9–12. Sections: note cols 1–3, everything else cols 4–12. Under 700px everything is full width and the note sits above its text.
- **Media is square-cornered and frameless**, edge to edge when it's the hero, on the text's edge inside a section. A demo or a film keeps the page's padding because it has a frame of its own.

## Page anatomy

1. **Header** — one screen tall (the scroller's height, `--cs-vh`), blue ground: title at the top; tagline (ink) + summary (grey) at the foot, cols 1–7; facts as a plain two-column list, cols 9–12. A project with its own opening (Camper's film) opens on that, and the header follows on paper with the title in blue.
2. **Hero** — edge to edge under the header.
3. **Sections** — margin note (dropped if it equals the heading) + one reading run whose first line is the heading; consecutive text blocks are one run; a picture ends a run.
4. **Foot** — blue ground: "Next" in small grey, then the next project's name at title size with an arrow.
5. **Bottom blur** — last child of the scroller.

## Motion

- **Nothing on a project page cuts.** Stop-motion (`<Enter>`, `steps()`) belongs to the landing, the signs and the window chrome, not to anything inside the sheet.
- **Things arrive once, softly:** `<Reveal>` — 0.8s fade + 12px rise, `cubic-bezier(.2, .65, .2, 1)`. One reveal per text run or per picture, never per paragraph. Neighbours arriving together are 70ms apart, at most a few of them. Header pieces play at mount; everything else when it scrolls in.
- **The page goes out of focus at the bottom edge:** `<BottomBlur>` — four stacked backdrop blurs (1/2/4/6px) over a band of 4 units, masked so focus falls off, not stops. Whatever sits at the foot of a screen needs 5 units of room to clear it.
- `prefers-reduced-motion`: things simply appear.

## Don'ts

- No rules, borders, hairlines, pills, cards, rounded corners, or tints per project.
- No uppercase labels, no letter-spacing above 0, no second weight in text.
- No spacing value that isn't a multiple of ½ unit.
- No third colour of text.
- No stop-motion inside a project page.
