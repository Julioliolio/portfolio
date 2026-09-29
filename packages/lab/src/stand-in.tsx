"use client";

import { asset } from "./asset";
import { Reveal } from "./type";

/**
 * A stand-in case study for the benches that show the sheet (/lab/sheet,
 * /lab/ink): the title in the blue, a run of reading text at the
 * measure, a heading, a list, the facts, a photo with its caption, a
 * placeholder, a film, a demo in its iframe, and a ground — a block of
 * blue with the words knocked out — all in the type's own classes
 * (type.tsx), so a bench sees every kind of thing a page puts on the
 * paper. Put STAND_IN_CSS in the bench's stylesheet and <TypeStyles>
 * on the page.
 */

export const STAND_IN_CSS = `
.si-page { padding: 6vh clamp(24px, 6cqw, 96px) 24vh; }
.si-page .ty-title { color: var(--ty-blue); }
.si-page h2 { margin: 0 0 .4em; font-size: clamp(28px, 3.4cqw, 44px); line-height: 1.02; letter-spacing: -.03em; font-weight: 400; }
.si-page ul { margin: 0; padding-left: 1.2em; }
.si-page li + li { margin-top: .25em; }
.si-page figure { margin: 0; }
.si-page figcaption { margin-top: .6em; }
.si-ph { display: grid; place-items: center; aspect-ratio: 16 / 9; background: #ecebe8; outline: 1px dashed rgba(43, 39, 34, .28); outline-offset: -1px; color: #77716a; font-size: 14px; }
.si-photo { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.si-film { display: block; width: 100%; aspect-ratio: 16 / 9; background: #000; object-fit: cover; }
.si-demo { display: grid; place-items: center; width: 100%; aspect-ratio: 16 / 10; border: 0; background: #1b1b1f; color: #fff; font-size: 14px; }
`;

const FILM = asset("/media/camper.mp4");
/** A still for the photo: the cartel's front frame, the one photo the
 *  site always has. */
const PHOTO = asset("/cartel/julio/front.webp");

export function StandIn() {
  return (
    <article className="ty si-page">
      <Reveal as="h1" gate="mount" className="ty-title">
        Camper
      </Reveal>
      <Reveal className="ty-read ty-gap-2" gate="mount" delay={80}>
        <p>
          A stand-in for a case study, on the sheet: the title in the blue, a
          run of reading text at the measure, a heading, a list, the facts, a
          photo with its caption, a film, a demo, and a block of blue with the
          words knocked out of it — every kind of thing a page puts on the
          paper, so the paper can be judged with a page on it.
        </p>
        <p>
          The film keeps cutting between people who would never share a frame,
          and the one thing that stays constant, shot after shot, is what they
          are standing in. The shoes are never the subject; they are the ground
          the subject stands on, and the film is patient enough to let that be
          enough. <a href="#top">A link in the blue.</a>
        </p>
        <p className="ty-dim">
          A dim line, the summary&rsquo;s grey, for the lighter type on the
          paper.
        </p>
      </Reveal>
      <dl className="ty-facts ty-small ty-gap-2">
        <dt>Role</dt>
        <dd>Direction, edit, grade</dd>
        <dt>Year</dt>
        <dd className="ty-num">2024</dd>
        <dt>With</dt>
        <dd>A crew of three, one camera</dd>
      </dl>
      <h2 className="ty-gap-4">The ground they stand on</h2>
      <div className="ty-read">
        <p>
          Nobody in the film is introduced. A pair of feet comes into a shot
          already walking, stays as long as it takes to cross it, and is
          replaced by another pair somewhere else — a kitchen, a kerb, the foot
          of a bed — and the cutting never lets one pair become the story.
        </p>
        <ul>
          <li>A list, for the bullets a page sometimes has.</li>
          <li>Short lines, one under the other.</li>
          <li>Three of them, so the spacing shows.</li>
        </ul>
      </div>
      <figure className="ty-gap-4">
        <img className="si-photo" src={PHOTO} alt="" />
        <figcaption className="ty-small ty-dim">
          1. A photo, edge to edge of the measure.
        </figcaption>
      </figure>
      <figure className="ty-gap-4">
        <div className="si-ph">Photo needed: a still from the film.</div>
        <figcaption className="ty-small ty-dim">
          2. A placeholder, the page&rsquo;s grey box, for the edge of a flat
          tone on the paper.
        </figcaption>
      </figure>
      <figure className="ty-gap-4">
        <video className="si-film" src={FILM} muted loop autoPlay playsInline />
        <figcaption className="ty-small ty-dim">3. The film.</figcaption>
      </figure>
      <figure className="ty-gap-4">
        <iframe
          className="si-demo"
          title="A demo's box"
          srcDoc="<body style='margin:0;display:grid;place-items:center;height:100vh;background:#1b1b1f;color:#fff;font:14px system-ui'>A demo's box: the iframe.</body>"
        />
        <figcaption className="ty-small ty-dim">
          4. A demo in its iframe.
        </figcaption>
      </figure>
      <div className="ty-ground ty-gap-4" data-ground="blue">
        <div className="ty-read">
          <p>
            A ground: a block of blue with these words knocked out of it, the
            way a page's closing block is set.
          </p>
        </div>
      </div>
      <div className="ty-read ty-gap-4">
        <p>
          More of the page, so there is something to scroll: the paper scrolls
          with the page, one long sheet.
        </p>
      </div>
    </article>
  );
}
