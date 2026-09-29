"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { asset } from "../../asset";
import {
  BENCH_CSS,
  Choice,
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
import { HelloStyles, helloSignRect } from "../../hello";
import { useMotionTuning } from "../../motion";
import {
  TravelLayer,
  rectOf,
  resetTravelTuning,
  setTravelTuning,
  useTravelTuning,
  type TravelHandle,
  type TravelPhase,
  type TravelTuning,
} from "../../sign-travel";

/**
 * The sign travel's bench: the home page, cut down to the travel —
 * the two screens, snapped, the hello row with the sign's front photo
 * standing still in it, the second screen bare, the brand plate in
 * its corner — with the travel wired as the landing wires it, so the
 * real scroll plays it: on the way down the sign leaves for the corner
 * as the second screen arrives, on the way up it comes back; on the
 * scroll, the squash follows the page. The knobs float over it: the
 * feel, its spring or its beat, the path, each pose's size and its
 * place along the path. Values write the travel store, so what you set
 * here is what the landing does — in this browser, until Reset; "Copy
 * values" exports them for TRAVEL_DEFAULTS in
 * packages/lab/src/sign-travel.tsx. Nothing else of the landing is
 * here: no dialogue, no road signs, no window.
 */

const BrandSign = lazy(() => import("../brand-sign"));

const FRONT = asset("/cartel/julio/front.webp");

/** The landing's thresholds (Landing.tsx): a screen arrives at IN,
 *  leaves below OUT. */
const IN = 0.4;
const OUT = 0.2;

const BEAT: Field<TravelTuning>[] = [
  {
    key: "fps",
    label: "Beat",
    min: 4,
    max: 24,
    step: 1,
    unit: "/s",
    hint: "cuts a second",
  },
];

const SPRING: Field<TravelTuning>[] = [
  {
    key: "period",
    label: "Period",
    min: 150,
    max: 1500,
    step: 10,
    unit: "ms",
    hint: "the spring's period: shorter is quicker",
  },
  {
    key: "bounce",
    label: "Bounce",
    min: 0,
    max: 0.9,
    step: 0.01,
    hint: "0 settles without passing the plate; more swings past and back",
  },
];

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

const PATH: Field<TravelTuning>[] = [
  {
    key: "rise",
    label: "Up first",
    min: 0,
    max: 0.95,
    step: 0.05,
    hint: "the share of the way spent going straight up before going across; 0 is one straight line to the corner",
  },
  {
    key: "arc",
    label: "Arc",
    min: -0.4,
    max: 0.6,
    step: 0.01,
    hint: "how far the path bows upward, as a share of the way",
  },
  {
    key: "lean",
    label: "Lean",
    min: 0,
    max: 40,
    step: 1,
    unit: "°",
    hint: "the launch's lean toward the corner",
  },
];

const SIZES: Field<TravelTuning>[] = [
  {
    key: "sink",
    label: "Sink",
    min: 0.3,
    max: 1.5,
    step: 0.01,
    unit: "×",
    hint: "the anticipation's height, of the sign's",
  },
  {
    key: "launch",
    label: "Launch",
    min: 0.3,
    max: 2,
    step: 0.01,
    unit: "×",
    hint: "the stretch's height, of the sign's",
  },
  {
    key: "smear1",
    label: "Smear",
    min: 0.05,
    max: 1.5,
    step: 0.01,
    unit: "×",
    hint: "the first smear's height, of the sign's",
  },
  {
    key: "smear2",
    label: "Smear 2",
    min: 0.05,
    max: 1.5,
    step: 0.01,
    unit: "×",
    hint: "the second smear's height, of the sign's",
  },
  {
    key: "land",
    label: "Land",
    min: 0.5,
    max: 3,
    step: 0.01,
    unit: "×",
    hint: "the landing squash's height, of the plate's",
  },
];

const PLACES: Field<TravelTuning>[] = [
  {
    key: "at1",
    label: "Launch",
    min: -0.2,
    max: 1.2,
    step: 0.01,
    hint: "where along the path, 0 the sign, 1 the plate",
  },
  { key: "at2", label: "Smear", min: 0, max: 1.2, step: 0.01 },
  { key: "at3", label: "Smear 2", min: 0, max: 1.2, step: 0.01 },
  {
    key: "at4",
    label: "Land",
    min: 0.5,
    max: 1.4,
    step: 0.01,
    hint: "past 1 is past the slot: the overshoot",
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
  const travel = useRef<TravelHandle>(null);
  const hello = useRef<HTMLElement>(null);
  const projects = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLAnchorElement>(null);
  const [gone, setGone] = useState(false);
  const [plateShown, setPlateShown] = useState(false);
  // Where the sign is, for the played travels: on the wall, in the
  // corner, or on its way (the landing's `sign`).
  const sign = useRef<"wall" | "going" | "corner" | "coming">("wall");
  // The second screen has arrived (the landing's observer, its
  // thresholds).
  const [seen, setSeen] = useState(false);
  const [cut, setCut] = useState(6);
  const scrolls = values.mode === "scroll";

  useEffect(() => {
    const el = projects.current;
    if (!el) return;
    let was = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const now =
            e.intersectionRatio >= IN
              ? true
              : e.intersectionRatio < OUT
                ? false
                : was;
          if (now === was) continue;
          was = now;
          setSeen(now);
        }
      },
      { threshold: [OUT, IN] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The played travels, as the landing plays them: down as the second
  // screen arrives, up as it leaves — to where the sign will be once
  // the snap has settled. On the scroll the layer drives itself.
  useEffect(() => {
    const layer = travel.current;
    const s = slot.current;
    const p = plate.current;
    const screen = hello.current;
    if (!layer || !s || !p || !screen || layer.scrolls()) return;
    let live = true;
    if (seen) {
      if (sign.current === "corner") return;
      if (sign.current === "coming") layer.cancel();
      sign.current = "going";
      setGone(true);
      setPlateShown(false);
      void layer.play(helloSignRect(s), rectOf(p), "down").then(() => {
        if (!live) return;
        sign.current = "corner";
        setPlateShown(true);
        layer.cancel();
      });
    } else {
      if (sign.current === "wall") return;
      if (sign.current === "going") {
        layer.cancel();
        sign.current = "wall";
        setGone(false);
        return;
      }
      sign.current = "coming";
      setPlateShown(false);
      const r = helloSignRect(s);
      const b = screen.getBoundingClientRect();
      const dest = { ...r, x: r.x - b.left, y: r.y - b.top };
      void layer.play(dest, rectOf(p), "up").then(() => {
        if (!live) return;
        sign.current = "wall";
        setGone(false);
        layer.cancel();
      });
    }
    return () => {
      live = false;
    };
  }, [seen]);

  // On the scroll: the layer says where the sign is.
  const onPhase = (phase: TravelPhase) => {
    setGone(phase !== "before");
    setPlateShown(phase === "after");
    sign.current = phase === "before" ? "wall" : "corner";
  };
  const signBox = () => {
    if (!slot.current) return null;
    const r = helloSignRect(slot.current);
    return { ...r, y: r.y + window.scrollY };
  };
  const plateBox = () => (plate.current ? rectOf(plate.current) : null);

  // Hold one cut of the way down, in place, for a look.
  function hold(c: number) {
    const s = slot.current;
    const p = plate.current;
    if (!s || !p || !travel.current) return;
    setCut(c);
    sign.current = "going";
    setGone(true);
    setPlateShown(false);
    travel.current.seek(helloSignRect(s), rectOf(p), c);
  }

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
      <TravelLayer
        ref={travel}
        from={signBox}
        to={plateBox}
        onPhase={onPhase}
      />

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
        <Choice
          label="Feel"
          value={values.mode}
          options={[
            { value: "cuts", label: "Held cuts" },
            { value: "smooth", label: "Smooth" },
            { value: "scroll", label: "On the scroll" },
          ]}
          pick={(mode) => setTravelTuning({ mode })}
        />
        {scrolls ? (
          <Group
            title="On the scroll"
            fields={SCROLL}
            values={values}
            set={setTravelTuning}
          />
        ) : (
          <>
            {values.mode === "smooth" ? (
              <Group
                title="Spring"
                fields={SPRING}
                values={values}
                set={setTravelTuning}
              />
            ) : (
              <Group
                title="Beat"
                fields={BEAT}
                values={values}
                set={setTravelTuning}
              />
            )}
            <label
              className="bench-row"
              title="hold one cut of the way down, in place"
            >
              <span>Hold cut</span>
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={cut}
                onChange={(e) => hold(Number(e.target.value))}
              />
              <span className="bench-value">{cut}</span>
            </label>
            <Group
              title="Path"
              fields={PATH}
              values={values}
              set={setTravelTuning}
            />
            <Group
              title="Sizes"
              fields={SIZES}
              values={values}
              set={setTravelTuning}
            />
            <Group
              title="Along the way"
              fields={PLACES}
              values={values}
              set={setTravelTuning}
            />
          </>
        )}
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
          packages/lab/src/sign-travel.tsx. The frames are stand-ins until the
          drawn ones are in source-assets/sign-travel.
        </p>
      </Knobs>
    </>
  );
}
