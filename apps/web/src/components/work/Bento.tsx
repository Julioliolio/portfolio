"use client";

import { asset } from "@portfolio/lab/asset";
import { Reveal } from "@portfolio/lab/type";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Cell, Shot } from "@/content/projects";

/**
 * The bento and the field, after estrellagracia.com/work/wavn2 (Julio,
 * 2026-10-01): the media of the project pages as cells of different
 * sizes straight on the paper — no tray — each a loop, a still or a
 * marked slot on its own ground, and the screens on a field of colour
 * where a photo-real mockup will go.
 *
 * - The grid is the page's twelve columns. A row is `row` columns tall
 *   (gaps included), so a cell keeps its shape at any width; on a phone
 *   the bento is two columns and each cell keeps its proportions.
 * - --bn-g is registered (@property) so it resolves where it is set, on
 *   the bento, against the page's container — the bento is a container
 *   itself, and an unresolved --ty-u would measure it instead.
 * - A clip plays only while it is on screen, and not at all for readers
 *   who asked for reduced motion (they get the poster).
 * - A phone is drawn here, not recorded: the clip is the screen alone,
 *   so every phone on the site is the same phone. In a bento it sits
 *   straight on the paper — the phone is its own frame, so its cell has
 *   no ground (Julio, 2026-10-01). The same for anything with an edge of
 *   its own (`plain`), and for a field: its devices stand on the paper,
 *   the tag under them marking the mockup to come. The phone is a size
 *   container and its bezel a child, so the bezel's cqw are the phone's.
 */

export const BENTO_CSS = `
@property --bn-g { syntax: "<length>"; inherits: true; initial-value: 12px; }
.bn { --bn-g: calc(.5 * var(--ty-u)); container-type: inline-size; }
.bn-grid { --bn-c: calc((100cqw - 11 * var(--bn-g)) / 12); display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-rows: calc(var(--bn-row) * var(--bn-c) + (var(--bn-row) - 1) * var(--bn-g)); gap: var(--bn-g); }
.bn-cell { position: relative; grid-column: span var(--bn-w); grid-row: span var(--bn-h); overflow: hidden; border-radius: calc(.5 * var(--ty-u)); background: var(--bn-ground, #ecebe8); }
.bn-cell > video, .bn-cell > img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.bn-cell.is-screen { box-shadow: inset 0 0 0 1px rgba(43, 39, 34, .08); }
.bn-cell.is-phone, .bn-cell.is-plain { background: none; overflow: visible; border-radius: 0; box-shadow: none; }
.bn-cell.is-phone .bn-phone { height: 100%; max-width: 100%; }
.bn-center { position: absolute; inset: 0; display: grid; place-items: center; }
@container (max-width: 520px) {
  .bn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: auto; }
  .bn-cell { grid-column: span var(--bn-wm); grid-row: auto; aspect-ratio: var(--bn-ar); }
}

.bn-phone { container-type: inline-size; position: relative; height: 88%; aspect-ratio: calc(1 / (.936 / var(--bn-sa) + .064)); max-width: 88%; }
.bn-bezel { position: absolute; inset: 0; padding: 3.2cqw; border-radius: 15cqw; background: #16130f; box-shadow: 0 1px 1px rgba(0,0,0,.1), 0 12px 32px -12px rgba(43,39,34,.45); }
.bn-bezel > .bn-screen { width: 100%; height: 100%; border-radius: 12cqw; overflow: hidden; background: #000; }
.bn-screen video, .bn-screen img { display: block; width: 100%; height: 100%; object-fit: cover; }

.bn-label { position: absolute; left: calc(.5 * var(--ty-u)); top: calc(.5 * var(--ty-u)); z-index: 1; padding: .3em .6em; border-radius: 999px; background: rgba(250, 249, 246, .92); color: #2b2722; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.bn-slot { position: absolute; inset: 0; display: grid; align-content: end; padding: calc(.75 * var(--ty-u)); outline: 1px dashed rgba(43, 39, 34, .28); outline-offset: -1px; border-radius: inherit; }
.bn-mark { position: absolute; left: calc(.75 * var(--ty-u)); bottom: calc(.75 * var(--ty-u)); right: calc(.75 * var(--ty-u)); }
.bn-mark span { display: inline-block; padding: .35em .6em; border: 1px dashed rgba(43, 39, 34, .35); border-radius: 6px; background: rgba(255, 255, 255, .7); backdrop-filter: blur(6px); }

.bn-field { position: relative; }
.bn-field-row { position: absolute; inset: 8% 6% 16%; display: flex; justify-content: center; align-items: center; gap: 4%; }
.bn-field-row .bn-phone { height: 100%; max-width: none; }
.bn-laptop { height: 100%; aspect-ratio: var(--bn-sa); max-width: 100%; padding: .6%; border-radius: 10px 10px 4px 4px; background: #16130f; box-shadow: 0 18px 40px -16px rgba(43,39,34,.45); }
.bn-laptop > .bn-screen { width: 100%; height: 100%; border-radius: 5px; overflow: hidden; }
`;

/**
 * Each cell's span on a phone, where the bento is two columns: a cell
 * half the grid or more (or a slot, for its words) takes both; a half
 * cell that would sit alone on its row — before a wide one, or last —
 * takes both too, so no row ends in a hole.
 */
function phoneSpans(cells: Cell[]) {
  const spans = cells.map((c) => (c.w >= 6 || c.kind === "slot" ? 2 : 1));
  let open = -1; // index of a half cell waiting for a partner
  spans.forEach((s, i) => {
    if (s === 1) open = open === -1 ? i : -1;
    else if (open !== -1) {
      spans[open] = 2;
      open = -1;
    }
  });
  if (open !== -1) spans[open] = 2;
  return spans;
}

export function Bento({ cells, row = 2 }: { cells: Cell[]; row?: number }) {
  const wm = phoneSpans(cells);
  return (
    <div className="cs-wide bn">
      <div
        className="bn-grid"
        style={{ "--bn-row": row } as CSSProperties}
      >
        {cells.map((cell, i) => (
          <Reveal
            key={i}
            delay={i * 50}
            className={[
              "bn-cell",
              cell.kind === "shot" && cell.frame !== "bare" && `is-${cell.frame}`,
              cell.plain && "is-plain",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              {
                "--bn-w": cell.w,
                "--bn-h": cell.h,
                "--bn-wm": wm[i],
                // Its proportions on a phone, where rows are not shared.
                "--bn-ar": `${cell.w} / ${cell.h * row}`,
                "--bn-ground": cell.ground,
              } as CSSProperties
            }
          >
            <CellView cell={cell} />
            {cell.label && <span className="bn-label ty-small">{cell.label}</span>}
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function CellView({ cell }: { cell: Cell }) {
  if (cell.kind === "slot") {
    const what = cell.awaits === "photo" ? "Photo" : "Video";
    return (
      <div className="bn-slot" role="img" aria-label={`${what} to come: ${cell.need}`}>
        <p className="ty-small ty-dim">
          {what} needed: {cell.need}
        </p>
      </div>
    );
  }
  if (cell.frame === "phone")
    return (
      <div className="bn-center">
        <Phone shot={cell} />
      </div>
    );
  return <Media shot={cell} />;
}

function Phone({ shot }: { shot: Shot }) {
  return (
    <div className="bn-phone" style={{ "--bn-sa": shot.aspect } as CSSProperties}>
      <div className="bn-bezel">
        <div className="bn-screen">
          <Media shot={shot} />
        </div>
      </div>
    </div>
  );
}

/** A clip (mp4) or a still, by its extension. */
function Media({ shot }: { shot: Shot }) {
  const style: CSSProperties | undefined =
    shot.focus || shot.fit
      ? { objectPosition: shot.focus, objectFit: shot.fit }
      : undefined;
  if (!shot.src.endsWith(".mp4"))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={asset(shot.src)} alt={shot.alt} style={style} loading="lazy" />;
  return <Loop shot={shot} style={style} />;
}

/** A muted loop that plays while it is on screen. */
function Loop({ shot, style }: { shot: Shot; style?: CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          v.preload = "auto";
          void v.play().catch(() => {});
        } else v.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={asset(shot.src)}
      poster={shot.poster && asset(shot.poster)}
      aria-label={shot.alt}
      muted
      loop
      playsInline
      preload="none"
      style={style}
    />
  );
}

/** A field: the screens on a ground, marked for the mockup to come. */
export function Field({
  aspect,
  ground = "#e7e3dc",
  need,
  screens,
  device,
}: {
  aspect: number;
  ground?: string;
  need: string;
  screens: Shot[];
  device: "phone" | "laptop";
}) {
  return (
    <Reveal className="cs-wide">
      <div
        className="bn-field"
        style={{ aspectRatio: aspect, "--bn-ground": ground } as CSSProperties}
      >
        <div className="bn-field-row">
          {screens.map((s, i) =>
            device === "phone" ? (
              <Phone key={i} shot={s} />
            ) : (
              <div
                key={i}
                className="bn-laptop"
                style={{ "--bn-sa": s.aspect } as CSSProperties}
              >
                <div className="bn-screen">
                  <Media shot={s} />
                </div>
              </div>
            ),
          )}
        </div>
        <p className="bn-mark ty-small ty-dim">
          <span>Mockup needed: {need}</span>
        </p>
      </div>
    </Reveal>
  );
}
