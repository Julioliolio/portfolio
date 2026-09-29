"use client";

import { Suspense, lazy, useRef, useState } from "react";
import { asset } from "../../asset";
import {
  BENCH_CSS,
  CopyValues,
  Group,
  Knobs,
  btn,
  useWholeScreen,
  type Field,
} from "../../bench";
import {
  GREETING_HELLO,
  GREETING_LINE,
  GreetingStyles,
  Speech,
} from "../../greeting";
import { HelloStyles, helloSignRect, rectOf } from "../../hello";
import { useMotionTuning } from "../../motion";
import {
  TravelLayer,
  resetTravelTuning,
  setTravelTuning,
  useTravelTuning,
  type TravelPhase,
  type TravelTuning,
} from "../../sign-travel";

/**
 * The sign travel's bench: the home page, cut down to the travel —
 * the two screens, snapped, the hello row with the sign's front photo
 * standing still in it, the second screen bare, the brand plate in
 * its corner — with the travel wired as the landing wires it, so the
 * real scroll plays it: the squash follows the page down to the corner
 * and back. The knobs float over it: where the sign pins, how soon the
 * way is done, how much of it squashes, how far it widens, where the
 * photo cuts to the plate, and how much it trails the scroll. Values
 * write the travel store, so what you set
 * here is what the landing does — in this browser, until Reset; "Copy
 * values" exports them for TRAVEL_DEFAULTS in
 * packages/lab/src/sign-travel.tsx. Nothing else of the landing is
 * here: no dialogue, no road signs, no window.
 */

const BrandSign = lazy(() => import("../brand-sign"));

const FRONT = asset("/cartel/julio/front.webp");

const SCROLL: Field<TravelTuning>[] = [
  {
    key: "pin",
    label: "Pin at",
    min: 0,
    max: 40,
    step: 0.5,
    unit: "vh",
    hint: "the line the sign sticks to and is squashed against, down from the top of the screen",
  },
  {
    key: "end",
    label: "Done by",
    min: 0.3,
    max: 1,
    step: 0.05,
    hint: "the share of the scroll left, from the pin to the second screen landing, by which the plate is in its corner; 1 uses all of it — the slowest — and the snap always gets there",
  },
  {
    key: "squash",
    label: "Squash",
    min: 0.05,
    max: 0.95,
    step: 0.05,
    hint: "the share of the way spent squashing; the rest slides to the corner",
  },
  {
    key: "lag",
    label: "Lag",
    min: 0,
    max: 0.95,
    step: 0.05,
    hint: "how much the sign trails the scroll: 0 is locked to the finger, more is softer and later, catching up once the page settles",
  },
  {
    key: "widen",
    label: "Widen",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "how far toward the plate's width it goes as it squashes: 0 keeps the sign's",
  },
  {
    key: "swap",
    label: "Cut at",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "where in the slide the photo cuts to the plate, as a share of it",
  },
];

/* The two screens as the landing has them (Landing.tsx: 100dvh, snapped
   on the root), the words white on the mat, the lab page's title and
   its column out of the way. */
const STAGE_CSS = `
html { scroll-snap-type: y mandatory; }
main > h1 { display: none; }
main { padding: 0 !important; gap: 0 !important; }
.st-screen { position: relative; height: 100dvh; scroll-snap-align: start; overflow: hidden; display: grid; place-items: center; color: #fff; }
.st-screen .hello-sign.is-gone { visibility: hidden; }
.st-screen .hello-sign img { display: block; width: 100%; height: 100%; user-select: none; }
.st-hint { font-size: 13px; opacity: .55; }
.st-knobs { --bench-label: 5rem; }
`;

export default function SignTravelBench() {
  useWholeScreen();
  const values = useTravelTuning();
  const motion = useMotionTuning();
  const hello = useRef<HTMLElement>(null);
  const projects = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLAnchorElement>(null);
  const [gone, setGone] = useState(false);
  const [plateShown, setPlateShown] = useState(false);

  // The layer says where the sign is.
  const onPhase = (phase: TravelPhase) => {
    setGone(phase !== "before");
    setPlateShown(phase === "after");
  };
  const signBox = () => {
    if (!slot.current) return null;
    const r = helloSignRect(slot.current);
    return { ...r, y: r.y + window.scrollY };
  };
  const plateBox = () => (plate.current ? rectOf(plate.current) : null);

  const go = (ref: React.RefObject<HTMLElement | null>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <style>{BENCH_CSS + STAGE_CSS}</style>
      <HelloStyles />
      <GreetingStyles />

      <section ref={hello} className="st-screen" aria-label="Hello">
        <div className="hello-row">
          <Speech
            lines={GREETING_HELLO}
            base={motion.lead}
            step={motion.stagger}
            className="hello-words"
          />
          <div
            ref={slot}
            className={gone ? "hello-sign is-gone" : "hello-sign"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the cartel's front frame, still */}
            <img src={FRONT} alt="" draggable={false} />
          </div>
          <div className="hello-line-slot">
            <Speech
              lines={GREETING_LINE}
              base={motion.lead}
              step={motion.stagger}
              className="hello-words"
            />
          </div>
        </div>
      </section>
      <section ref={projects} className="st-screen" aria-label="Projects">
        <span className="st-hint">the projects screen — scroll back up</span>
      </section>

      <Suspense fallback={null}>
        <BrandSign
          ref={plate}
          controls={false}
          entrance={false}
          shown={plateShown}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go(hello);
          }}
        />
      </Suspense>
      <TravelLayer from={signBox} to={plateBox} onPhase={onPhase} />

      <Knobs
        className="st-knobs"
        buttons={
          <>
            <button type="button" style={btn} onClick={() => go(projects)}>
              ▼ Down
            </button>
            <button type="button" style={btn} onClick={() => go(hello)}>
              ▲ Up
            </button>
          </>
        }
      >
        <Group
          title="On the scroll"
          fields={SCROLL}
          values={values}
          set={setTravelTuning}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
          }}
        >
          <button type="button" style={btn} onClick={resetTravelTuning}>
            Reset
          </button>
          <CopyValues values={values} />
        </div>
        <p style={{ margin: 0, fontSize: 11, opacity: 0.6, lineHeight: 1.5 }}>
          Scroll, or Down and Up. Applies to the landing in this browser until
          Reset; lock it in by pasting into TRAVEL_DEFAULTS in
          packages/lab/src/sign-travel.tsx.
        </p>
      </Knobs>
    </>
  );
}
