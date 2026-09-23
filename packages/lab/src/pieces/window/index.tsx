"use client";

import { useRef, useState } from "react";
import { asset } from "../../asset";
import { BENCH_CSS, CopyValues, Group, btn, type Field } from "../../bench";
import { ProjectWindow, clipPreview, type WindowPreview } from "../../window";
import {
  resetWindowTuning,
  setWindowTuning,
  useWindowTuning,
  type WindowTuning,
} from "../../window-tuning";

/**
 * The project window's bench: the box over a stand-in for the
 * landing's projects screen, with the knobs floating over it — the
 * grow and the page's fade, the margin round the box, its corner
 * (square by default), the hairline, the rail's width. Three stand-in
 * signs sit bottom-left, each with its card's clip beside it (always up
 * here, no rope): a click on a sign grows the box out of that clip, as
 * the landing does from the hover card, and the open one closes it —
 * the box shrinks back into the clip. Home and the empty wall close it
 * too. The rail's contents are the page's own (a case study portals
 * them in), so here it only has Home.
 *
 * Sliders write the window store and the window regenerates its
 * stylesheet on every change, so what you set here is what the home
 * page does — in this browser, until Reset. "Copy values" exports them
 * for WINDOW_DEFAULTS in packages/lab/src/window-tuning.ts. (On the
 * site the rail's width follows the signs — windowLayout.ts in the web
 * app — not the slider.)
 */

const MOTION: Field<WindowTuning>[] = [
  {
    key: "duration",
    label: "Axis",
    min: 100,
    max: 900,
    step: 10,
    unit: "ms",
    hint: "one axis's move (width first, then height); the shrink is the same, and the signs step back over Axis + Lag",
  },
  {
    key: "lag",
    label: "Lag",
    min: 0,
    max: 900,
    step: 10,
    unit: "ms",
    hint: "the second axis starts this long after the first; equal to Axis is one then the other (Convertr), less overlaps and reads smoother",
  },
  {
    key: "reveal",
    label: "Reveal",
    min: 0,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the hand-off once the box has landed: the page dissolves in over the clip and its title and intro rise on it",
  },
  {
    key: "fade",
    label: "Fade",
    min: 0,
    max: 800,
    step: 10,
    unit: "ms",
    hint: "the quick ones: the page and rail out before the shrink, the rail in, the hover card's copy leaving",
  },
];

const BOX: Field<WindowTuning>[] = [
  {
    key: "margin",
    label: "Margin",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    hint: "the wall above, right of and below the box",
  },
  {
    key: "overhang",
    label: "Overhang",
    min: 0,
    max: 10,
    step: 0.1,
    unit: "vh",
    hint: "how far the open sign reaches over the box's left edge",
  },
  {
    key: "corner",
    label: "Corner",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    hint: "square by the reference; here in case",
  },
  { key: "edge", label: "Hairline", min: 0, max: 0.6, step: 0.02 },
  { key: "rail", label: "Rail", min: 12, max: 45, step: 0.5, unit: "vw" },
];

/** The stand-in signs and their clips: the landing's places. */
const SIGNS = [
  {
    slug: "one",
    title: "First project",
    bottom: "31vh",
    width: "19vw",
    clip: asset("/media/placeholder-tall.mp4"),
    aspect: 720 / 826,
  },
  {
    slug: "two",
    title: "Second",
    bottom: "20.5vh",
    width: "21vw",
    clip: asset("/media/camper.mp4"),
    aspect: 16 / 9,
  },
  {
    slug: "three",
    title: "Third project",
    bottom: "10vh",
    width: "18vw",
    clip: asset("/media/placeholder-wide.mp4"),
    aspect: 1056 / 720,
  },
];

const CSS = `
${BENCH_CSS}
.wb-wall { position: fixed; inset: 0; background: #faf9f6; }
/* A stand-in for the landing's projects screen: three sign-sized
   blocks bottom-left, over the window; the open one grown. Each has
   its card's clip to its right, where the rope would lead — hidden
   while its project is open, since the box is that clip grown. */
.wb-sign { position: fixed; z-index: 85; left: 7vw; height: 8.8vh; padding: 0; border: 0; background: #dcd8d0; border-radius: 6px; transform-origin: 50% 50%; cursor: pointer; }
.wb-sign[aria-pressed="true"] { background: #2f6df6; transform: scale(1.2) rotate(-1.5deg); }
.wb-clip { position: fixed; z-index: 84; left: 30vw; width: 200px; overflow: hidden; outline: 1px solid #2f6df6; outline-offset: -1px; background: #ecebe8; transform: translateY(50%); }
.wb-clip.is-open { visibility: hidden; }
.wb-clip video { display: block; width: 100%; height: 100%; object-fit: cover; }
/* The stand-in page inside the window. */
.wb-page { padding: 72px clamp(20px, 4cqw, 56px) 20vh; max-width: 800px; margin: 0 auto; color: #2b2722; }
.wb-page h1 { margin: 0 0 12px; font-size: 40px; line-height: 1.05; letter-spacing: -.03em; }
.wb-page p { margin: 0 0 18px; font-size: 15px; line-height: 1.5; color: #57514a; max-width: 560px; }
.wb-page .wb-box { aspect-ratio: 16 / 9; margin: 24px 0; border-radius: 12px; background: #ecebe8; }
`;

/** Three pages that look different enough to see the swap. */
const PAGES: Record<string, { title: string; boxes: number }> = {
  one: { title: "A first project, standing in.", boxes: 3 },
  two: { title: "The second one.", boxes: 1 },
  three: { title: "A third, longer than the others.", boxes: 5 },
};

export default function WindowBench() {
  const t = useWindowTuning();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("one");
  const [from, setFrom] = useState<WindowPreview | null>(null);
  const clips = useRef(new Map<string, HTMLDivElement>());
  const page = PAGES[active] ?? PAGES.one!;

  /** The clip beside a sign, as the window wants it. */
  function previewOf(slug: string): WindowPreview | null {
    const el = clips.current.get(slug);
    const video = el?.querySelector("video");
    if (!el || !video) return null;
    const r = el.getBoundingClientRect();
    return clipPreview(video, {
      x: r.left,
      y: r.top,
      w: r.width,
      h: r.height,
    });
  }
  function show(slug: string) {
    setFrom(previewOf(slug));
    setActive(slug);
    setOpen(true);
  }
  function hide() {
    setFrom(previewOf(active));
    setOpen(false);
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="wb-wall" aria-hidden="true" />
      {SIGNS.map((sign) => (
        <button
          key={sign.slug}
          type="button"
          className="wb-sign"
          aria-label={sign.title}
          aria-pressed={open && sign.slug === active}
          style={{ bottom: sign.bottom, width: sign.width }}
          onClick={() => {
            if (open && sign.slug === active) hide();
            else show(sign.slug);
          }}
        />
      ))}
      {SIGNS.map((sign) => (
        <div
          key={sign.slug}
          ref={(el) => {
            if (el) clips.current.set(sign.slug, el);
            else clips.current.delete(sign.slug);
          }}
          className={
            open && sign.slug === active ? "wb-clip is-open" : "wb-clip"
          }
          style={{
            bottom: `calc(${sign.bottom} + 4.4vh)`,
            aspectRatio: sign.aspect,
          }}
          aria-hidden="true"
        >
          <video src={sign.clip} muted loop autoPlay playsInline />
        </div>
      ))}

      <ProjectWindow
        active={active}
        shown={open}
        from={from}
        label={SIGNS.find((x) => x.slug === active)?.title ?? ""}
        layout={{ inset: "7vw", foot: "45vh" }}
        onClose={hide}
      >
        <div className="wb-page" key={active}>
          <h1>{page.title}</h1>
          <p>
            Text at the reading measure, the way a case study sets it. The
            window is the chrome; the page inside is whatever the caller
            renders, keyed on the open project so a switch plays its entrances
            again.
          </p>
          {Array.from({ length: page.boxes }, (_, i) => (
            <div key={i}>
              <div className="wb-box" />
              <p>
                More of the page, so there is something to scroll and the
                controls have a hero to sit over.
              </p>
            </div>
          ))}
        </div>
      </ProjectWindow>

      <div className="bench-panel">
        <div className="bench-buttons">
          <button
            type="button"
            style={btn}
            onClick={() => (open ? hide() : show(active))}
          >
            {open ? "Close" : "Open"}
          </button>
          <button
            type="button"
            style={btn}
            onClick={() => {
              hide();
              window.setTimeout(
                () => show(active),
                t.fade + t.lag + t.duration + 80,
              );
            }}
          >
            Replay
          </button>
          <button type="button" style={btn} onClick={resetWindowTuning}>
            Reset
          </button>
          <CopyValues values={t} />
        </div>
        <Group
          title="The move"
          fields={MOTION}
          values={t}
          set={setWindowTuning}
        />
        <Group title="The box" fields={BOX} values={t} set={setWindowTuning} />
      </div>
    </>
  );
}
