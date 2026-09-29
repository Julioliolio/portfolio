"use client";

import type { MouseEvent as ReactMouseEvent, CSSProperties } from "react";
import { asset } from "./asset";
import { clipPreview, type WindowPreview } from "./window";
import { INK } from "./style";
import {
  WINDOW_DEFAULTS,
  paperCurl,
  paperLight,
  paperShadow,
  paperSheet,
  paperVeil,
} from "./window-tuning";

/**
 * A print: one project as a photo print on the mat — a paper frame round
 * the project's looping clip, and a band under the picture with the
 * blurb on the left and the tag pills on the right, the whole thing at
 * a slight tilt of its own. It is what the road signs bring out on hover
 * (the column, see pieces/road-signs), what a phone scrolls through, and
 * what the project window picks up: the window starts as the print, to
 * the pixel, and grows into the sheet (see window.tsx, `lift`).
 *
 * Wide prints (the desktop projects, the film) are landscape, the
 * picture as wide as the print's width; tall prints (the phone project)
 * are portrait and narrower, TALL_SHARE of that width. The width is the
 * caller's (`--rs-print-w`); the picture runs edge to edge and the band
 * under it is measured in shares of that width (BAND), so the window
 * takes the band as its starting inset (printPreview()).
 *
 * The paper is the sheet's (the paper's layers in window-tuning.ts,
 * off :root); the pills are the site's. No photo-print look — it is
 * drawn, a picture and a band.
 */

export type PrintSpec = {
  slug: string;
  title: string;
  href: string;
  /** wide: landscape, the picture as wide as the print. tall: portrait,
   *  narrower. */
  media: "wide" | "tall";
  /** The clip, under apps/web/public/ — the same file the case study's
   *  hero plays, so opening the page from the print finds it cached. */
  src: string;
  /** The clip's width / height: the picture takes this shape. */
  aspect: number;
  blurb: string;
  tags: string[];
  /** The print's own lean on the mat, degrees; alternate signs. */
  tilt: number;
};

/** A tall print's width, as a share of a wide one's. */
export const TALL_SHARE = 0.62;

/** Placeholder clips, until each project has its own. */
const PLACEHOLDER_WIDE = {
  src: asset("/media/placeholder-wide.mp4"),
  aspect: 1056 / 720,
};
const PLACEHOLDER_TALL = {
  src: asset("/media/placeholder-tall.mp4"),
  aspect: 720 / 826,
};

/** The three projects, in the signs' order. */
export const PRINTS: readonly PrintSpec[] = [
  {
    slug: "localpal",
    title: "LocalPal",
    href: asset("/work/localpal"),
    media: "tall",
    ...PLACEHOLDER_TALL,
    blurb:
      "A phone-first companion for meeting people nearby — plans, venues and friends on one live map. Designed and built end-to-end.",
    tags: ["iOS", "Design System", "End-to-end"],
    tilt: -1.6,
  },
  {
    slug: "camper",
    title: "Camper",
    href: asset("/work/camper"),
    media: "wide",
    src: asset("/media/camper.mp4"),
    aspect: 16 / 9,
    blurb:
      "A proposal film for Camper, made end to end with generative AI: everyone is equal in their feet. Concept, storyboard, every shot.",
    tags: ["Film", "Generative AI", "Concept"],
    tilt: 1.2,
  },
  {
    slug: "convertr",
    title: "Convertr",
    href: asset("/work/convertr"),
    media: "wide",
    ...PLACEHOLDER_WIDE,
    blurb:
      "A desktop video converter where one bounding box is the whole interface — drop a video, trim it, drag the result out. Runs live inside the portfolio.",
    tags: ["Desktop", "Product Design", "Live demo"],
    tilt: -0.8,
  },
];

export const printBySlug = (slug: string) =>
  PRINTS.find((p) => p.slug === slug) ?? null;

/**
 * A print's box for a wide print's width, px — the stylesheet's numbers
 * done in arithmetic, for layouts that must know a print's size before
 * it is measured (the signs' stage). The band is its minimum; a long
 * blurb makes a print a little taller.
 */
export function printSize(spec: PrintSpec, wideW: number) {
  const w = spec.media === "tall" ? wideW * TALL_SHARE : wideW;
  const picture = w / spec.aspect;
  // The band: its padding and three lines of the blurb (BAND below).
  const type = Math.min(22, Math.max(12, wideW * BAND.type));
  const band = 2 * wideW * BAND.padY + 3 * type * 1.35;
  return { w, h: picture + band };
}

/** The band's measures, as shares of a wide print's width, so a print
 *  keeps its proportions at any size and a tall print's type matches a
 *  wide one's (Julio's reference, 2026-09-26: the picture edge to edge
 *  and a white band under it, the blurb left and the pills right). */
const BAND = {
  padY: 0.026,
  padLeft: 0.031,
  padRight: 0.022,
  type: 0.0138,
  tag: 0.0098,
  tagH: 0.025,
};

/** A share of the wide print's width, as CSS, between a floor and a
 *  ceiling in px. */
const share = (k: number, lo: number, hi: number) =>
  `clamp(${lo}px, calc(var(--rs-print-w, 640px) * ${k}), ${hi}px)`;

/** The paper, from the page's variables (paperCss() on :root), the
 *  defaults' where a page sets none. */
const D = WINDOW_DEFAULTS;

/**
 * The print's stylesheet. The width is the caller's --rs-print-w; the
 * tilt is the print's own (inline). The picture runs edge to edge, the
 * band under it; the paper is the sheet's own — its scan, ground,
 * grain, corners, shadow, light and curl, off the page's variables
 * (paperCss()), so tuning the sheet tunes the prints. The light lies
 * over everything, the picture too, as it does on the sheet.
 */
export const PRINT_CSS = `
.rs-print { position: relative; display: block; box-sizing: border-box; width: var(--rs-print-w, 640px); overflow: hidden; isolation: isolate; border-radius: var(--paper-corner, ${D.corner}px); background: var(--paper-veil, ${paperVeil(D)}), var(--paper-sheet, ${paperSheet(D)}), var(--paper-ground, ${D.ground}); box-shadow: var(--paper-shadow, ${paperShadow(D)}); transform: rotate(var(--rs-tilt, 0deg)); transform-origin: 50% 50%; color: ${INK}; text-decoration: none; font-family: inherit; }
.rs-print::after { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none; border-radius: inherit; background: var(--paper-light, ${paperLight(D)}); box-shadow: var(--paper-curl, ${paperCurl(D)}); mix-blend-mode: soft-light; }
.rs-print.is-tall { width: calc(var(--rs-print-w, 640px) * ${TALL_SHARE}); }
.rs-print:focus-visible { outline: 2px solid ${INK}; outline-offset: 4px; }
.rs-media { position: relative; overflow: hidden; background: #ecebe8; }
.rs-media video { display: block; width: 100%; height: 100%; object-fit: cover; }
/* The band: the blurb left, the pills right, both from its top. */
.rs-band { display: flex; justify-content: space-between; align-items: flex-start; gap: ${share(0.03, 12, 48)}; padding: ${share(BAND.padY, 12, 42)} ${share(BAND.padRight, 10, 36)} ${share(BAND.padY, 12, 42)} ${share(BAND.padLeft, 12, 50)}; }
.rs-desc { margin: 0; min-width: 0; max-width: 21em; color: #57514a; font-weight: 400; font-size: ${share(BAND.type, 12, 22)}; line-height: 1.35; letter-spacing: -.01em; text-wrap: pretty; }
.rs-tags { flex: 0 1 auto; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: ${share(0.006, 5, 10)}; max-width: 55%; }
.rs-tag { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-height: ${share(BAND.tagH, 22, 40)}; padding: 0 ${share(0.0095, 8, 16)}; border: 1px solid color-mix(in srgb, ${INK} 70%, transparent); border-radius: 999px; background: transparent; color: ${INK}; font-weight: 400; font-size: ${share(BAND.tag, 10.5, 16)}; line-height: 1; letter-spacing: .01em; white-space: nowrap; }
/* Handed over: the project window has taken this print as its own box,
   to the pixel, so the print goes at once — or two of it would show. */
.rs-print.is-handed { visibility: hidden; }
`;

/**
 * One print. `index` is the caller's tag for the element (the column
 * keeps clones); `active` is the one whose clip plays and that the
 * pointer can open.
 */
export function Print({
  spec,
  index,
  active = false,
  tilt = spec.tilt,
  handed = false,
  refCallback,
  onClick,
  style,
}: {
  spec: PrintSpec;
  index?: number;
  active?: boolean;
  tilt?: number;
  handed?: boolean;
  refCallback?: (el: HTMLAnchorElement | null) => void;
  onClick?: (ev: ReactMouseEvent<HTMLAnchorElement>) => void;
  style?: CSSProperties;
}) {
  return (
    <a
      ref={refCallback}
      className={[
        `rs-print is-${spec.media}`,
        active && "is-active",
        handed && "is-handed",
      ]
        .filter(Boolean)
        .join(" ")}
      // The landing finds the print by this: the project window grows
      // out of it.
      data-slug={spec.slug}
      data-index={index}
      href={spec.href}
      // The clay cursor reads this: a small tag rides beside the hand.
      data-cursor-label={active ? "open" : undefined}
      aria-label={`Open ${spec.title}`}
      aria-hidden={!active}
      tabIndex={active ? 0 : -1}
      style={{ "--rs-tilt": `${tilt}deg`, ...style } as CSSProperties}
      onClick={onClick}
    >
      <div className="rs-media" style={{ aspectRatio: spec.aspect }}>
        <video
          src={spec.src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      </div>
      <div className="rs-band">
        <p className="rs-desc">{spec.blurb}</p>
        <div className="rs-tags">
          {spec.tags.map((tag) => (
            <span key={tag} className="rs-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

/**
 * The print the window picks up: the project's, found in the signs'
 * column by its slug — the one that is up (or, before any is, its own
 * place in the track) — its rect, lean and frame, its clip, the frame
 * the clip is on and a snapshot (clipPreview). The print is measured
 * where it sits with the stack at rest — while a project is open the
 * stack is stepped back (SIGNS_OPEN in signs-layout, a transform on
 * `stack`), so the
 * rect is taken through the inverse of whatever transform is on it,
 * which is where the print will be once the stack has eased home. A
 * print leans (a rotation about its centre): its bounding box is taken
 * for the centre alone, and its size is its own; the window turns by
 * the same lean, so the two meet to the pixel. Null when there is no
 * print (the signs not yet in).
 */
export function printPreview(
  stack: HTMLElement | null,
  slug: string,
): WindowPreview | null {
  const print =
    stack?.querySelector<HTMLElement>(
      `.rs-print[data-slug="${slug}"].is-active`,
    ) ?? stack?.querySelector<HTMLElement>(`.rs-print[data-slug="${slug}"]`);
  const media = print?.querySelector<HTMLElement>(".rs-media");
  const video = media?.querySelector("video");
  if (!stack || !print || !media || !video) return null;
  const r = print.getBoundingClientRect();
  const cs = getComputedStyle(stack);
  // The bounding box's centre through the stack's transform, if any:
  // the transform, about its origin, in its own box — the point that
  // stays put tells where the box is at rest, and the inverse takes
  // the centre back there.
  let cx = r.left + r.width / 2;
  let cy = r.top + r.height / 2;
  if (cs.transform !== "none") {
    const [ox = 0, oy = 0] = cs.transformOrigin.split(" ").map(parseFloat);
    const m = new DOMMatrix()
      .translate(ox, oy)
      .multiply(new DOMMatrix(cs.transform))
      .translate(-ox, -oy);
    const now = stack.getBoundingClientRect();
    const shift = m.transformPoint({ x: 0, y: 0 });
    const restX = now.left - shift.x;
    const restY = now.top - shift.y;
    const p = m.inverse().transformPoint({ x: cx - restX, y: cy - restY });
    cx = restX + p.x;
    cy = restY + p.y;
  }
  // The print's own size, and its frame, from layout — untouched by
  // any transform, and the stack at rest has none — grown by its lift
  // under the pointer (PRINT_CSS's scale), so the box starts as big as
  // the print looked.
  const grown = parseFloat(getComputedStyle(print).scale) || 1;
  const w = print.offsetWidth * grown;
  const h = print.offsetHeight * grown;
  const inset = {
    top: media.offsetTop,
    left: media.offsetLeft,
    right: print.offsetWidth - media.offsetLeft - media.offsetWidth,
    bottom: print.offsetHeight - media.offsetTop - media.offsetHeight,
  };
  const tilt =
    parseFloat(getComputedStyle(print).getPropertyValue("--rs-tilt")) || 0;
  return clipPreview(
    video,
    { x: cx - w / 2, y: cy - h / 2, w, h },
    { tilt, inset },
  );
}
