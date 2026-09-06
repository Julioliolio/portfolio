# Polaroid card — shelved design (2026-09-06)

A design for the project card the road-sign rope leads to, tried in a
side-by-side trial page (since deleted) and briefly wired into this piece,
then rolled back so the piece returned to its pre-trial state. Kept here
so it can be picked up again.

## The idea

Only the signs are photographs; the card is real UI on the bare wall, no
frosted panel, no card template. A polaroid print (white frame, hairline,
thick bottom band with the project name and year pencilled on it, tilted
about 2.5°) holds the project's **still or video** — never the live demo.
Beside it, bottom-aligned to the print, sit just the blurb (17px regular,
body grey) and the tags as small blue mono "stamps", each at its own slight
rotation. Phone projects get a portrait print (200 × 240 picture), desktop
projects a landscape one (260 × 190).

Motion suggestion (not built): the print drops in on the rope and settles
in two hard cuts; the stamps land one per cut after the blurb, like being
pressed on. The trial kept the site's tweened spring pop.

## Wiring into the piece (what the rollback undid)

- `CardSpec` became `{ print: "tall" | "wide"; blurb; tags }` (LocalPal
  tall, Camper and Convertr wide).
- Tuning: `cardWide` / `cardTall` were replaced by `cardWidth` (620),
  `printWidth` (200) and `printTilt` (-2.5), fed to the stylesheet as
  `--rs-card-w`, `--rs-print-w`, `--rs-print-tilt`, with matching sliders
  in the Card section of the panel.
- `geometry()`: `cardW = t.cardWidth; cardH = t.printWidth * 1.2 + 46`.
- The card `<a>` got `className={`rs-card is-${sign.card.print}`}`.
- The rope needed no change: it measures the card's left edge, which is
  the print's edge.

## Stylesheet (replaces the `.rs-card` … `.rs-tag` rules in CARD_CSS)

```css
.rs-card { position: absolute; right: 0; z-index: 3; display: grid; grid-template-columns: auto 1fr; align-items: end; column-gap: 34px; width: var(--rs-card-w, 620px); opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-46%) scale(.965) rotate(.35deg); transform-origin: 8% 50%; transition: opacity var(--rs-fade, .18s), visibility linear calc(var(--rs-fade, .18s) + .06s), transform var(--rs-pop, .58s) cubic-bezier(.16, 1.08, .28, 1); will-change: transform, opacity; color: ${INK}; text-decoration: none; font-family: inherit; }
.rs-card.is-active { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(-50%) scale(1) rotate(0deg); transition-delay: 0s; }
/* The polaroid: a white frame with a hairline, a thick bottom band and a
   pencilled note. No tape, no curl — a frame, not a prop. */
.rs-print { position: relative; box-sizing: border-box; padding: 10px 10px 36px; background: #fff; box-shadow: 0 0 0 1px rgba(43, 39, 34, .22), 0 10px 18px rgba(0, 0, 0, .12), 0 2px 4px rgba(0, 0, 0, .08); transform: rotate(var(--rs-print-tilt, -2.5deg)); transform-origin: 50% 40%; }
.rs-still { display: grid; place-items: center; width: var(--rs-print-w, 200px); aspect-ratio: 1 / 1.2; background: linear-gradient(160deg, #e9e5de, #d6d0c6); color: rgba(43, 39, 34, .55); font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; }
.is-wide .rs-still { width: calc(var(--rs-print-w, 200px) * 1.3); aspect-ratio: 1.37 / 1; }
.rs-print-note { position: absolute; left: 12px; right: 12px; bottom: 10px; display: flex; justify-content: space-between; font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: rgba(43, 39, 34, .55); }
/* The caption: the blurb and the stamps, sat on the print's bottom edge. */
.rs-copy { min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 30px; padding-bottom: 4px; }
.rs-desc { margin: 0; max-width: 360px; color: #57514a; font-weight: 400; font-size: 17px; line-height: 1.38; letter-spacing: -.01em; }
.rs-tags { display: flex; flex-wrap: wrap; gap: 10px; }
.rs-tag { display: inline-block; padding: 3px 7px; border: 1px solid ${ROPE}; color: ${ROPE}; font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; font-size: 11px; line-height: 1.3; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; transform: rotate(-2deg); }
.rs-tag:nth-child(2) { transform: rotate(1.5deg) translateY(1px); }
.rs-tag:nth-child(3) { transform: rotate(-1deg); }
/* Stop-motion (cardFps > 0): no transitions at all — the card and rope
   snap on and off — and the pop is a stamp in three hard cuts: arrives
   small and low, lands past its mark wide and short, settles a hair
   narrow, rests. */
.is-cut .rs-rope, .is-cut .rs-card { transition: none; }
.is-cut .rs-card.is-active { animation: rs-card-stamp var(--rs-pop, .3s) steps(1, end) both; }
@keyframes rs-card-stamp {
  0% { transform: translate(-14px, -44%) scale(.88) rotate(1.2deg); }
  34% { transform: translate(4px, -51%) scale(1.04, .97) rotate(-.5deg); }
  68% { transform: translate(-1px, -50%) scale(.985, 1.01) rotate(.2deg); }
  100% { transform: translate(0, -50%) scale(1) rotate(0deg); }
}
```

## CardPanel

```tsx
/**
 * One project's card: the polaroid (a still placeholder until the real
 * still or video lands, and the project's name and year pencilled on the
 * band) and, beside it, the blurb and the stamps.
 */
function CardPanel({ sign }: { sign: Sign }) {
  const c = sign.card;
  return (
    <>
      <div className="rs-print">
        <div className="rs-still">Still / video</div>
        <div className="rs-print-note">
          <span>{sign.title}</span>
          <span>2025</span>
        </div>
      </div>
      <div className="rs-copy">
        <p className="rs-desc">{c.blurb}</p>
        <div className="rs-tags">
          {c.tags.map((tag) => (
            <span key={tag} className="rs-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
```

## The trial-page version (static mockup, for reference)

```css
/* 06 — polaroid + caption ---------------------------------------------- */
.d6 { display: grid; grid-template-columns: auto 1fr; gap: 34px; align-items: center; width: 640px; }
.d6 .polaroid { position: relative; box-sizing: border-box; padding: 10px 10px 36px; background: #fff; box-shadow: 0 0 0 1px rgba(43,39,34,.22), 0 10px 18px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.08); transform: rotate(-2.5deg); transform-origin: 50% 40%; }
.d6 .still { display: grid; place-items: center; background: linear-gradient(160deg, #e9e5de, #d6d0c6); color: rgba(43,39,34,.55); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; }
.d6 .still.tall { width: 200px; height: 240px; }
.d6 .still.wide { width: 260px; height: 190px; }
.d6 .polaroid .note { position: absolute; left: 12px; right: 12px; bottom: 10px; display: flex; justify-content: space-between; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: rgba(43,39,34,.55); }
.d6 .copy { display: grid; gap: 30px; align-content: center; }
.d6 .rule { display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid ${INK}; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: ${BODY}; }
.d6 .blurb { margin: 0; max-width: 360px; font-size: 17px; line-height: 1.38; font-weight: 400; letter-spacing: -.01em; color: ${BODY}; }
.d6 .stamps { display: flex; gap: 10px; }
.d6 .stamps span { padding: 3px 7px; border: 1px solid ${BLUE}; color: ${BLUE}; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; transform: rotate(-2deg); }
.d6 .stamps span:nth-child(2) { transform: rotate(1.5deg) translateY(1px); }
.d6 .stamps span:nth-child(3) { transform: rotate(-1deg); }
.d6 .open { font-size: 14px; text-decoration: underline; text-underline-offset: 3px; }
```

```tsx
<Scene
        n="06"
        title="Polaroid + caption"
        sub="the photo from the hang tag becomes the whole container; beside it only the blurb and the stamps"
        notes={[
          "Says: the product is a photograph pinned to the wall next to the sign, and the words are a caption. Only two things exist: the picture and the type.",
          "The polaroid is the one container and holds a still or a video, never the live demo. Phone projects get a portrait print, desktop projects a landscape one (06b).",
          "Motion: the polaroid drops in on the rope and settles in two cuts; the stamps land one per cut after the blurb, like being pressed on.",
          "Risk: the polaroid is a prop by definition. Keeping it a plain white frame with a hairline, no tape, no curl, is what keeps it UI.",
        ]}
      >
        <a className="d6" href="/work/localpal">
          <div className="polaroid">
            <div className="still tall mono">Still / video</div>
            <div className="note mono">
              <span>LocalPal</span>
              <span>2025</span>
            </div>
          </div>
          <div className="copy">
            <p className="blurb">{BLURB}</p>
            <div className="stamps mono">
              {TAGS.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </a>
      </Scene>

      <Scene
        n="06b"
        title="Polaroid + caption, desktop project"
        sub="the same pairing around Convertr: a landscape print"
        notes={[
          "The print's proportion is the only thing that changes between a phone project and a desktop one.",
        ]}
      >
        <a className="d6" href="/work/convertr">
          <div className="polaroid">
            <div className="still wide mono">Still / video</div>
            <div className="note mono">
              <span>Convertr</span>
              <span>2025</span>
            </div>
          </div>
          <div className="copy">
            <p className="blurb">{CONVERTR_BLURB}</p>
            <div className="stamps mono">
              {CONVERTR_TAGS.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </a>
      </Scene>
```
