"use client";

import type { MouseEvent as ReactMouseEvent, CSSProperties } from "react";
import { asset } from "./asset";
import { clipPreview, type WindowPreview } from "./window";
import {
  INK,
  PAPER_BASE,
  PAPER_TILE,
  PAPER_TILE_SIZE,
  PRINT_BAND,
  PRINT_PAD,
  PRINT_SHADOW,
} from "./style";

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
 * caller's (`--rs-print-w`); the frame and the band are PRINT_PAD and
 * PRINT_BAND, in px, and the same for every print, so the window can
 * take them as its starting inset.
 *
 * The paper is Julio's scan, tiled (PAPER_TILE); the pills are the
 * site's. No photo-print look — it is drawn, a frame and a band.
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
  const picture = (w - 2 * PRINT_PAD) / spec.aspect;
  return { w, h: PRINT_PAD + picture + PRINT_BAND };
}

/**
 * The print's stylesheet. The width is the caller's --rs-print-w; the
 * tilt is the print's own (inline). The picture keeps a hairline so a
 * white clip does not float on the paper; the paper keeps the same tile
 * at the same scale as the sheet.
 */
export const PRINT_CSS = `
.rs-print { position: relative; display: block; box-sizing: border-box; width: var(--rs-print-w, 640px); padding: ${PRINT_PAD}px ${PRINT_PAD}px 0; background: ${PAPER_BASE} url(${asset(PAPER_TILE)}) 0 0 / ${PAPER_TILE_SIZE} repeat; box-shadow: ${PRINT_SHADOW}; transform: rotate(var(--rs-tilt, 0deg)); transform-origin: 50% 50%; color: ${INK}; text-decoration: none; font-family: inherit; container-type: inline-size; }
.rs-print.is-tall { width: calc(var(--rs-print-w, 640px) * ${TALL_SHARE}); }
.rs-print:focus-visible { outline: 2px solid ${INK}; outline-offset: 4px; }
.rs-media { position: relative; overflow: hidden; background: #ecebe8; box-shadow: inset 0 0 0 1px rgba(43, 39, 34, .12); }
.rs-media video { display: block; width: 100%; height: 100%; object-fit: cover; }
/* The band: the blurb left, the pills right, on the picture's foot. */
.rs-band { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; min-height: ${PRINT_BAND}px; padding: ${PRINT_PAD}px 0 ${PRINT_PAD}px; }
.rs-desc { margin: 0; min-width: 0; max-width: 26em; color: #57514a; font-weight: 400; font-size: clamp(11.5px, 9px + .9cqi, 15px); line-height: 1.35; letter-spacing: -.01em; text-wrap: pretty; }
.rs-tags { flex: 0 0 auto; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; max-width: 45%; }
.rs-tag { display: inline-flex; align-items: center; justify-content: center; min-height: 22px; padding: 3px 8px; border: 1px solid color-mix(in srgb, ${INK} 52%, transparent); border-radius: 999px; background: transparent; color: ${INK}; font-weight: 400; font-size: 11px; line-height: 1; letter-spacing: .01em; white-space: nowrap; }
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
  // any transform, and the stack at rest has none.
  const w = print.offsetWidth;
  const h = print.offsetHeight;
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
