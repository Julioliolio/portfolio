"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type Ref,
} from "react";
import { asset } from "../../asset";
import { BENCH_CSS, CopyValues, Group, btn, type Field } from "../../bench";
import {
  BrandStyles,
  resetBrandTuning,
  setBrandTuning,
  useBrandTuning,
  type BrandTuning,
} from "../../brand";
import { playLater } from "../../play-later";

/**
 * The brand plate — the small "Julio(liolio)" lightbox, the site's home
 * mark, fixed in the upper-left (see ../../brand for where and how big).
 * A link home: on the landing it scrolls back up to the hello screen,
 * on a project page it is a link to the landing. It stamps in with the
 * site's drop (`entrance`), or is put there by the sign's travel with
 * no entrance of its own, the plate simply being there once the
 * travelling sign has landed (`shown`, flipped by the landing). Under
 * the pointer it lights up: a photo of it switched on, cut in over it.
 *
 * While a project is open (`back`) it reads "Back" and is the way back
 * to the projects: it turns over to it as the hello sign turns to its
 * other face — the same sheet (../../spin-sheet), the hop, the squash
 * and the sounds — through the face seen from below and the box's
 * rear, and turns home again when the project shuts. With `about`, the
 * plate under the pointer turns to "About me" the same way, and is a
 * link there.
 *
 * The bench (/lab/brand-sign, `controls`): the plate in its corner with
 * the knobs floating over it — its size, its place, its turn, its
 * shadow — and buttons to drop it in again and to turn it.
 */

/** What the plate reads. */
type Face = "julio" | "back" | "about";
/** What is on show: a face front on, as it rests, or one of the turn's
 *  photos — a face from below, the box's rear. */
type Photo = Face | `turn/${Face | "rear-a" | "rear-b"}`;

/** The faces front on (scripts/prepare-brand.mjs, prepare-brand-turn.mjs):
 *  at rest and, under the pointer, switched on. "About me" is only ever
 *  under the pointer, so it is the lit photo. */
const FLAT: Record<Face, { src: string; lit?: string }> = {
  julio: { src: asset("/brand/front.webp"), lit: asset("/brand/lit.webp") },
  back: { src: asset("/brand/back.webp"), lit: asset("/brand/back-lit.webp") },
  about: { src: asset("/brand/about.webp") },
};
const REAR: Photo[] = ["turn/rear-a", "turn/rear-b"];

/**
 * The sheet's stops (the cartel's keys) as the plate's photos, for the
 * face the exposure shows: the face from below as it tips away (the
 * windup) and as it comes round, the rear at an angle and straight on
 * between the two, the face front on at both ends.
 */
function photoFor(key: string, face: Face): Photo {
  switch (key) {
    case "spin-a":
      return "turn/rear-a";
    case "spin-b":
      return "turn/rear-b";
    case "spin-c":
    case "left":
      return `turn/${face}`;
    default:
      return face;
  }
}

/**
 * The plate turned to `want`: what is on show now, and the ref of the
 * body the hop and the squash are written on. A change of `want` plays
 * the turn; one that comes while it plays waits for the landing, then
 * turns again, as the cartel's does. Reduced motion changes the photo
 * in place.
 */
function useTurn(want: Face, hop: number) {
  const [photo, setPhoto] = useState<Photo>(want);
  const body = useRef<HTMLSpanElement>(null);
  const turn = useRef({ face: want, want, hop, busy: false, timer: 0 });

  useEffect(() => {
    turn.current.hop = hop;
  }, [hop]);

  // The sheet is a chunk of its own, asked for ahead of the first turn.
  useEffect(() => {
    void import("../../spin-sheet");
    const s = turn.current;
    return () => {
      window.clearInterval(s.timer);
      s.busy = false;
    };
  }, []);

  useEffect(() => {
    const s = turn.current;
    s.want = want;
    if (s.busy || s.face === want) return;

    async function play() {
      s.busy = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        s.face = s.want;
        s.busy = false;
        setPhoto(s.face);
        return;
      }
      const { SPIN_DEFAULTS, makeSpinSheet, isAirborne } =
        await import("../../spin-sheet");
      if (!s.busy) return; // unmounted while it loaded
      const from = s.face;
      const to = s.want;
      if (from === to) {
        s.busy = false;
        return;
      }
      const sheet = makeSpinSheet(SPIN_DEFAULTS);
      let index = 0;
      let last: Photo = from;
      let air = false;

      const show = () => {
        const exposure = sheet[index]!;
        const next = photoFor(exposure.key, exposure.pastSwap ? to : from);
        if (next !== last) {
          last = next;
          setPhoto(next);
          playLater("cut", 1, "spin");
        }
        // Touchdown, softer than the launch.
        const up = isAirborne(exposure);
        if (air && !up) playLater("knock", 0.6, "spin");
        air = up;
        if (body.current)
          body.current.style.transform =
            `translateY(${(exposure.jumpY * s.hop).toFixed(2)}%) ` +
            `scale(${exposure.squashX.toFixed(4)}, ${(1 + exposure.stretchY).toFixed(4)})`;
      };

      playLater("knock", 1, "spin");
      show();
      s.timer = window.setInterval(() => {
        index++;
        if (index < sheet.length) return show();
        window.clearInterval(s.timer);
        if (body.current) body.current.style.transform = "";
        s.face = to;
        s.busy = false;
        setPhoto(to);
        if (s.want !== to) void play();
      }, 1000 / SPIN_DEFAULTS.fps);
    }

    void play();
  }, [want]);

  return { photo, body };
}

const TURNING: Field<BrandTuning>[] = [
  {
    key: "turnSize",
    label: "Size",
    min: 0.8,
    max: 1.5,
    step: 0.01,
    unit: "×",
    hint: "the turn's photos, their width over the plate's",
  },
  {
    key: "hop",
    label: "Hop",
    min: 0,
    max: 5,
    step: 0.1,
    unit: "×",
    hint: "the jump, over the hello sign's",
  },
];

const PLACE: Field<BrandTuning>[] = [
  {
    key: "height",
    label: "Height",
    min: 3,
    max: 16,
    step: 0.1,
    unit: "vh",
    hint: "the plate's height; its width follows the photo",
  },
  {
    key: "top",
    label: "Down",
    min: 0,
    max: 12,
    step: 0.1,
    unit: "vh",
    hint: "its top edge from the screen's",
  },
  {
    key: "left",
    label: "In",
    min: 0,
    max: 12,
    step: 0.1,
    unit: "vw",
    hint: "its left edge from the screen's — the window rail's inset lines up with it",
  },
  {
    key: "gap",
    label: "Gap",
    min: 0,
    max: 60,
    step: 1,
    unit: "px",
    hint: "the room under it before a page's contents",
  },
];

const SHADOW: Field<BrandTuning>[] = [
  { key: "shadowX", label: "Across", min: -20, max: 20, step: 0.5, unit: "%" },
  { key: "shadowY", label: "Down", min: -20, max: 20, step: 0.5, unit: "%" },
  { key: "shadowBlur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "%" },
  { key: "shadowAlpha", label: "Dark", min: 0, max: 1, step: 0.01 },
];

export default function BrandSign({
  controls = true,
  href = asset("/"),
  onClick,
  shown = true,
  entrance = true,
  replay = 0,
  back = false,
  about,
  ref,
}: {
  /** Show the bench's knobs. */
  controls?: boolean;
  /** Where home is. */
  href?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  /** Out of sight, but in place (the landing measures it for the
   *  travel, and shows it once the sign has landed). */
  shown?: boolean;
  /** Stamp in on mount (and on every `replay` bump). Off for a plate
   *  the travel puts there. */
  entrance?: boolean;
  replay?: number;
  /** A project is open: the plate reads "Back", and `href` and
   *  `onClick` are the way back to the projects. */
  back?: boolean;
  /** The about page. Given, the plate under the pointer turns to
   *  "About me" and is a link there (`onClick` is not called). */
  about?: string;
  ref?: Ref<HTMLAnchorElement>;
}) {
  const values = useBrandTuning();
  const [run, setRun] = useState(0);
  const [benchBack, setBenchBack] = useState(false);
  const [over, setOver] = useState(false);
  // The bench has no about page, and turns to it all the same.
  const aboutHref = about ?? (controls ? "#" : undefined);
  const reading = back || benchBack;
  const toAbout = !!aboutHref && over && !reading;
  const want: Face = reading ? "back" : toAbout ? "about" : "julio";
  const { photo, body } = useTurn(want, values.hop);
  const faces: Face[] = aboutHref
    ? ["julio", "back", "about"]
    : ["julio", "back"];
  const img = { alt: "", draggable: false, decoding: "async" } as const;

  return (
    <>
      <BrandStyles />
      <a
        key={`${replay}-${run}`}
        ref={ref}
        href={toAbout ? aboutHref : href}
        onClick={toAbout ? undefined : onClick}
        onPointerEnter={(e) => e.pointerType === "mouse" && setOver(true)}
        onPointerLeave={() => setOver(false)}
        aria-label={reading ? "Back to the projects" : "Home"}
        data-cursor-label={reading ? "back" : toAbout ? "about" : "home"}
        className={[
          "brand-sign",
          "sm-hover-lift",
          "sm-press",
          entrance && "brand-enter",
          !shown && "is-hidden",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Every photo, stacked, one on show at a time; a face's lit
            photo comes straight after it (see brandCss). Static
            pre-sized WebPs: the Next optimizer adds nothing here. */}
        {/* eslint-disable @next/next/no-img-element */}
        <span ref={body} className="brand-body">
          {faces.map((face) => (
            <Fragment key={face}>
              <img
                {...img}
                className={face === photo ? "brand-flat is-on" : "brand-flat"}
                src={FLAT[face].src}
                fetchPriority="low"
              />
              {FLAT[face].lit && (
                <img
                  {...img}
                  className="brand-lit"
                  src={FLAT[face].lit}
                  fetchPriority="low"
                />
              )}
            </Fragment>
          ))}
          {[...REAR, ...faces.map((face): Photo => `turn/${face}`)].map((p) => (
            <img
              {...img}
              key={p}
              className={p === photo ? "brand-turn is-on" : "brand-turn"}
              src={asset(`/brand/${p}.webp`)}
              fetchPriority="low"
            />
          ))}
        </span>
        {/* eslint-enable @next/next/no-img-element */}
      </a>
      {controls && (
        <div className="bench-panel">
          <style>{BENCH_CSS}</style>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <strong>Brand plate</strong>
            <button
              type="button"
              style={btn}
              onClick={() => setRun((r) => r + 1)}
            >
              ▶ Drop in again
            </button>
            <button
              type="button"
              style={btn}
              onClick={() => setBenchBack((b) => !b)}
            >
              ⟳ Turn
            </button>
          </div>
          <Group
            title="Place"
            fields={PLACE}
            values={values}
            set={setBrandTuning}
          />
          <Group
            title="Turn"
            fields={TURNING}
            values={values}
            set={setBrandTuning}
          />
          <Group
            title="Shadow"
            fields={SHADOW}
            values={values}
            set={setBrandTuning}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
            }}
          >
            <button type="button" style={btn} onClick={resetBrandTuning}>
              Reset
            </button>
            <CopyValues values={values} />
          </div>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.6, lineHeight: 1.5 }}>
            Applies to the site in this browser until Reset. Lock it in by
            pasting into BRAND_DEFAULTS in packages/lab/src/brand.tsx.
          </p>
        </div>
      )}
    </>
  );
}
