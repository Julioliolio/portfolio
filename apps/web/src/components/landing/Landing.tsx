"use client";

import { Cue, CueStyles } from "@portfolio/lab/cue";
import { loaders } from "@portfolio/lab/loaders";
import { useMotionTuning, type MotionTuning } from "@portfolio/lab/motion";
import {
  GREETING_HELLO,
  GREETING_LINE,
  GreetingStyles,
  Speech,
  countWords,
} from "@portfolio/lab/greeting";
import { HelloStyles, useHelloTuning } from "@portfolio/lab/hello";
import { SoundToggle, play } from "@portfolio/lab/sound";
import { Suspense, lazy, useEffect, useRef, useState } from "react";

/**
 * The landing: two screens on the wall, snapped.
 *
 *   1. The greeting, said to the viewer: "Hola! I’m" — the sign that
 *      watches the pointer, stamped in as the name — "A Product Designer
 *      Finding Charm In The Unexpected". One row, centred, word by word.
 *   2. The road signs, parked bottom-left — the projects stack, with its
 *      card popping out to the right on hover.
 *
 * Scrolling locks screen to screen (scroll-snap on the root, set by the
 * page). A glyph at the foot of the first screen and the head of the
 * second is the same arrow, flipped; clicking it scrolls to the other
 * screen. The cartel's circle of attention is the whole page.
 *
 * The greeting is dialogue, one word a beat: "Hola!", "I’m", then the
 * sign (held until "I’m" has landed and its frame is decoded — whichever
 * is later), then the line, then the scroll cue. Each word taps as it
 * lands. The words stay; the sign keeps its pointer walk and its click
 * flip to About and back. The words are plain under the pointer:
 * the letter-by-letter hover they could have lives on /lab/greeting
 * only (see @portfolio/lab/greeting).
 *
 * Every arrival on a screen plays that screen's entrance, with no dead
 * frames: both pieces are mounted once, at load, and stay mounted. An
 * IntersectionObserver watches both screens; while a screen is away its
 * piece is hidden, and as the screen starts to arrive (IN below) the
 * piece is shown and told to replay its entrance in place (the pieces'
 * `replay` prop) — no teardown, no reload, the stamp-in / drop-in just
 * restarts from its first pose while the screen is still sliding in, so
 * it is landing by the time the scroll settles. The first screen's
 * load-time mount is its first play.
 *
 * Pieces come through the lab loaders like everywhere else — never
 * imported directly.
 */

const Cartel = lazy(loaders.cartel);
const RoadSigns = lazy(loaders["road-signs"]);

/** A screen counts as arriving once this share of it is in view — early,
 *  so its entrance plays during the scroll rather than after it — and as
 *  away below the lower one; the gap keeps a screen mid-snap from
 *  flickering between the two. It holds the page, and so shows its
 *  scroll cue, from HELD up — the reference's 40% line, mirrored; in
 *  between the two screens, neither cue. */
const IN = 0.4;
const OUT = 0.2;
const HELD = 0.6;

/** How loud a word lands, relative to the tap's tuned level. */
const WORD_TAP = 0.6;
/** Words in each speech, for its timers. */
const HELLO_WORDS = countWords(GREETING_HELLO);
const LINE_WORDS = countWords(GREETING_LINE);

/**
 * Every size and position below is read off Julio's mockups (2026-09-13),
 * a 1512 x 982 frame, and expressed as a share of the viewport so the
 * page keeps the mockup's proportions at any size:
 *
 *   hello screen     the row of words and sign — @portfolio/lab/hello;
 *                    glyph 6vh tall, its foot 3.5vh off the bottom
 *   projects screen  glyph at the top, 3.5vh down; the stack's left edge
 *                    at 7.2vw, its foot 9.5vh up; each sign 8.8vh tall
 *   the card         44vw wide, out to 89vw, up beside the stack —
 *                    signsTuning()
 *
 * scroll-snap-stop stays "normal" (the yichenxie.com feel): the snap
 * settles the scroll, it never hijacks it.
 */
const CSS = `
.landing-screen { position: relative; height: 100dvh; scroll-snap-align: start; overflow: hidden; }
.landing-hello { display: grid; place-items: center; }
/* The row of the greeting — the words, the sign, the line — and its
   sizes live in @portfolio/lab/hello (tuned on /lab/hello); this file
   only places the pieces in it. */
/* The signs sit by their own edges (frame="signs"); the stage and its
   card hang off the box to the right and above. */
.landing-projects { position: absolute; left: 7.2vw; bottom: 9.5vh; }
/* A screen that is away keeps its piece out of sight, so the piece is
   never seen at rest before its entrance replays. */
.landing-screen.is-away .landing-piece { visibility: hidden; }
/* The mute switch: the glyph's blue, in the corner the card never
   reaches (its right edge stops at 89vw), level with the glyph's foot. */
.landing-sound { position: fixed; right: 2.4vw; bottom: 3.5vh; z-index: 2; display: grid; place-items: center; width: 3.2vh; height: 3.2vh; min-width: 24px; min-height: 24px; padding: 0; background: none; border: 0; color: #2562ff; }
.landing-sound svg { display: block; width: 100%; height: 100%; }
.landing-sound[aria-pressed="true"] { opacity: 0.45; }
.landing-sound:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 999px; }
`;

/** The mockup frame; what the server render and the first client
 *  render assume until the real viewport is measured. */
const FRAME = { w: 1512, h: 982 };

/** The viewport, in px, re-read on resize. */
function useViewport() {
  const [size, setSize] = useState(FRAME);
  useEffect(() => {
    const read = () => setSize({ w: innerWidth, h: innerHeight });
    read();
    addEventListener("resize", read);
    return () => removeEventListener("resize", read);
  }, []);
  return size;
}

/**
 * The road signs tuned to the mockup: each sign 8.8vh tall, and every
 * pixel value of the defaults (which were tuned at 64px) scaled with it,
 * so the walk feels the same at any size. The card is 44vw wide, its
 * right edge lands at 89vw, and it sits with its middle 26.6vh above
 * the stack's — up beside the signs rather than level with them.
 */
function signsTuning(vw: number, vh: number) {
  const height = 0.088 * vh;
  const k = height / 64;
  const cardWide = 0.44 * vw;
  // The stage runs from the stack's left edge to the card's right edge:
  // 89vw - (7.2vw - padX), with padX = 0.6 * height. cardSpan is what the
  // stage adds past the stack's padded box (widest sign * 3.563 + 2 padX).
  const stackW = 3.563 * height + 1.2 * height;
  const cardSpan = 0.818 * vw + 0.6 * height - stackW;
  return {
    height,
    gap: 12 * k,
    dimGap: 8 * k,
    hoverNudge: 6 * k,
    nudgePush: 16 * k,
    cardWide,
    cardTall: (cardWide * 300) / 640,
    cardSpan,
    cardY: -0.266 * vh,
    ropeInset: 24 * k,
    sagRest: 44 * k,
    sagNudge: 8 * k,
  };
}

/** Timers for a speech: a tap as each word lands, and `done` once the
 *  last has settled. */
function schedule(
  words: number,
  base: number,
  motion: MotionTuning,
  done: () => void,
) {
  const timers: number[] = [];
  for (let i = 0; i < words; i++) {
    timers.push(
      window.setTimeout(() => play("tap", WORD_TAP), base + i * motion.stagger),
    );
  }
  timers.push(
    window.setTimeout(
      done,
      base + (words - 1) * motion.stagger + motion.duration * 1000,
    ),
  );
  return () => {
    for (const t of timers) window.clearTimeout(t);
  };
}

export function Landing() {
  const helloScreen = useRef<HTMLElement>(null);
  const projectsScreen = useRef<HTMLElement>(null);
  // Each screen as the observer last reported it: `away` hides its piece
  // (the signs start away), `held` is the screen holding most of the
  // viewport (its cue's condition), and `runs` counts arrivals — bumping
  // it replays the piece's entrance in place.
  const [screens, setScreens] = useState({
    hello: { away: false, held: true, runs: 0 },
    projects: { away: true, held: false, runs: 0 },
  });
  const { w, h } = useViewport();
  const tuning = signsTuning(w, h);
  const motion = useMotionTuning();
  const hello = useHelloTuning();

  // The load and every return are sequenced, nothing appears on its own.
  // On the hello screen it is the dialogue: the words before (keyed on
  // the arrival, so they say themselves again each time) tap in on the
  // stagger; once the last has settled the sign is released (`signRuns`
  // — its first bump lets the held entrance play, the rest replay it),
  // and it stamps when both that and its frame are in; the stamp's
  // start (`signSaid`) mounts the line, which follows a stagger after
  // the stamp; the line's last word settling (`said`) lets the cue pop a
  // stagger later. Leaving the screen clears `signSaid` and `said`, so
  // the line and the cue wait for the fresh stamp on the way back. On
  // the projects screen the cue follows the last sign's drop the same
  // way.
  const [signRuns, setSignRuns] = useState(0);
  const [signSaid, setSignSaid] = useState(0);
  const [said, setSaid] = useState(false);
  // Nothing is said until the typeface is in: on a cold load the words
  // would otherwise land in the fallback face and jump when the real one
  // swaps in. The words' cut, Regular, is asked for by name (the family
  // next/font registered, read off its variable), since fonts.ready can
  // settle before a face has even started to load. Regular is preloaded,
  // so on a warm cache this is at once; a face that is missing
  // altogether does not hold the words up.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const sans = (
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-neue-montreal")
        .split(",")[0] ?? ""
    )
      .trim()
      .replace(/^['"]|['"]$/g, "");
    document.fonts
      .load(`400 1em ${sans}`)
      .catch(() => [])
      .then(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const afterStamp = motion.duration * 1000 + motion.stagger;
  const afterDrop =
    motion.lead + 2 * motion.stagger + motion.duration * 1000 + motion.stagger;
  // The timings are read at the moment a speech starts — a bench change
  // mid-sentence does not restart it.
  const motionRef = useRef(motion);
  useEffect(() => {
    motionRef.current = motion;
  }, [motion]);
  useEffect(() => {
    if (!ready) return;
    return schedule(
      HELLO_WORDS,
      motionRef.current.lead,
      motionRef.current,
      () => setSignRuns((n) => n + 1),
    );
  }, [ready, screens.hello.runs]);
  useEffect(() => {
    if (signSaid === 0) return;
    const m = motionRef.current;
    return schedule(LINE_WORDS, m.duration * 1000 + m.stagger, m, () =>
      setSaid(true),
    );
  }, [signSaid]);

  // Always open on the sign: the browser's restored scroll position (a
  // reload, back from a project, a bfcache return) is overridden, so the
  // sequence above is what every arrival gets. The setting is the
  // document's, so it is put back when the landing unmounts.
  useEffect(() => {
    const restoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.scrollTo(0, 0);
    };
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      history.scrollRestoration = restoration;
    };
  }, []);

  useEffect(() => {
    // `seen` and `held` are each screen's last known state. The first
    // screen starts as seen: its load-time mount plays on its own, so
    // the observer's first report (in view) must not replay it.
    const watched = [
      {
        el: helloScreen.current,
        key: "hello" as const,
        seen: true,
        held: true,
      },
      {
        el: projectsScreen.current,
        key: "projects" as const,
        seen: false,
        held: false,
      },
    ];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const screen = watched.find((s) => s.el === entry.target);
          if (!screen) continue;
          const ratio = entry.intersectionRatio;
          const was = screen.seen;
          const now = ratio >= IN ? true : ratio < OUT ? false : was;
          const held = ratio >= HELD;
          if (now === was && held === screen.held) continue;
          screen.seen = now;
          screen.held = held;
          setScreens((s) => ({
            ...s,
            [screen.key]: {
              away: !now,
              held,
              runs: s[screen.key].runs + (now && !was ? 1 : 0),
            },
          }));
          // The line and the cue follow the fresh stamp (see `signSaid`).
          if (screen.key === "hello" && !now) {
            setSignSaid(0);
            setSaid(false);
          }
        }
      },
      { threshold: [OUT, IN, HELD] },
    );
    for (const s of watched) if (s.el) io.observe(s.el);
    return () => io.disconnect();
  }, []);

  // A real scroll to the other screen — the page travels, the arrival
  // entrance plays as it settles.
  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <style>{CSS}</style>
      <CueStyles />
      <GreetingStyles />
      <HelloStyles />

      <section
        ref={helloScreen}
        // Arrays, not template strings: prettier-plugin-tailwindcss trims
        // the whitespace inside className templates and glues the classes.
        className={[
          "landing-screen",
          "landing-hello",
          screens.hello.away && "is-away",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Julio Romero"
      >
        <h1 className="sr-only">
          Hola! I&rsquo;m Julio Romero, a product designer finding charm in the
          unexpected.
        </h1>
        <div className="landing-piece hello-row" aria-hidden="true">
          {ready && (
            <Speech
              key={screens.hello.runs}
              lines={GREETING_HELLO}
              base={motion.lead}
              step={motion.stagger}
              className="hello-words"
            />
          )}
          <div
            className={["hello-sign", signSaid === 0 && "is-waiting"]
              .filter(Boolean)
              .join(" ")}
          >
            <Suspense fallback={null}>
              {/* The whole page is its circle of attention: it turns
                  toward the pointer wherever it is. The wall stays bare
                  until the stamp, and the stamp waits its turn in the
                  dialogue; its start tells the line when to follow. */}
              <Cartel
                height={`${hello.signHeight}vh`}
                controls={false}
                radius="page"
                placeholder={false}
                entrance="held"
                onEntrance={() => setSignSaid((n) => n + 1)}
                replay={signRuns}
              />
            </Suspense>
          </div>
          <div
            className={["hello-line-slot", signSaid === 0 && "is-waiting"]
              .filter(Boolean)
              .join(" ")}
          >
            {/* Said again from its first word at each stamp (the key);
                before the first it is only holding the row's shape. */}
            <Speech
              key={signSaid}
              lines={GREETING_LINE}
              base={afterStamp}
              step={motion.stagger}
              className="hello-words"
            />
          </div>
        </div>
        <Cue
          dir="down"
          shown={said && screens.hello.held}
          delay={motion.stagger}
          label="Scroll to the projects"
          text={["View", "projects"]}
          onClick={() => {
            play("knock");
            scrollTo(projectsScreen);
          }}
        />
      </section>

      <section
        ref={projectsScreen}
        className={["landing-screen", screens.projects.away && "is-away"]
          .filter(Boolean)
          .join(" ")}
        aria-label="Projects"
      >
        <Cue
          dir="up"
          shown={screens.projects.held}
          delay={afterDrop}
          label="Scroll back to the top"
          text={["Back", "up"]}
          onClick={() => {
            play("knock");
            scrollTo(helloScreen);
          }}
        />
        <div className="landing-projects landing-piece">
          <Suspense fallback={null}>
            <RoadSigns
              controls={false}
              frame="signs"
              tuning={tuning}
              replay={screens.projects.runs}
            />
          </Suspense>
        </div>
      </section>

      {/* Sound (see @portfolio/lab/sound): the pieces tick, strike and
          knock on their own; this is the switch that mutes all of it,
          and its mount primes the audio context. On by default: a
          browser that trusts the site sounds from the first hover, the
          rest wait for the first click — the browser's rule, not ours. */}
      <SoundToggle className="landing-sound sm-hover-lift sm-press" />
    </>
  );
}
