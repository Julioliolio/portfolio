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
import { asset } from "@portfolio/lab/asset";
import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { WindowPreview } from "@portfolio/lab/window";
import {
  moveMs,
  useWindowTuning,
  windowEase,
} from "@portfolio/lab/window-tuning";
import { PRINTS, printPreview } from "@portfolio/lab/prints";
import {
  SIGNS_OPEN,
  signsTuning,
  useViewport,
} from "@portfolio/lab/signs-layout";
import { PHONE_PRINTS_CSS, PhoneProject, phoneScreenId } from "./PhonePrints";
import { ProjectWindowMount, warmWindow } from "./ProjectWindowMount";

/**
 * The landing: two screens on the wall, snapped.
 *
 *   1. The greeting, said to the viewer: "Hola! I’m" — the sign that
 *      watches the pointer, stamped in as the name — "A Product Designer
 *      Finding Charm In The Unexpected". One row, centred, word by word.
 *   2. The road signs, parked bottom-left — the projects stack, with the
 *      prints' column sliding in from the right on hover. On a phone,
 *      where nothing hovers, the prints themselves, one to a screen,
 *      snapped through (PhonePrints).
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
 * flip to About and back. The words take the pointer letter by
 * letter — the wave, its notes and the bed — as @portfolio/lab/greeting
 * says it, tuned on /lab/greeting.
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
 * A plain click on a sign (or its print) opens the project in the
 * window (@portfolio/lab/window) beside the signs rather than leaving
 * the page: the print is picked up into the sheet that takes the rest
 * of the mat, and the mat's left strip stays, with the signs in it,
 * smaller and tucked into the corner, the open one over the sheet's
 * edge (`is-open` lifts them past the window and steps them back). The
 * print is measured for the window as the click lands (printPreview, at
 * rest or through the stepped-back pose) and again on a switch, so
 * the sheet always shrinks back onto the open project's print. The
 * click is caught on the projects screens,
 * the slug goes into state and /work/<slug>/ onto the history stack, so
 * Back closes the window, a reload lands on the project's own page, and
 * a modified click still opens it in a new tab. The open sign holds its
 * hover pose; a click on another swaps the slug and the URL in place,
 * and a click on the open one closes, which goes back. See
 * ProjectWindowMount for what loads when.
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

/** Words in each speech, for its timers. */
const HELLO_WORDS = countWords(GREETING_HELLO);
const LINE_WORDS = countWords(GREETING_LINE);

/**
 * Every size and position below is read off Julio's mockups (2026-09-13),
 * a 1512 x 982 frame, and expressed as a share of the viewport so the
 * page keeps the mockup's proportions at any size:
 *
 *   hello screen     the row of words and sign — @portfolio/lab/hello;
 *                    the cue — its size and foot are the cue tuning's (/lab/cue)
 *   projects screen  glyph at the top, 3.5vh down; the stack's left edge
 *                    at 7.2vw, its foot 9.5vh up; each sign 8.8vh tall
 *   the card         44vw wide, out to 89vw, up beside the stack —
 *                    signsTuning()
 *
 * scroll-snap-stop stays "normal" (the yichenxie.com feel): the snap
 * settles the scroll, it never hijacks it.
 */
const CSS = `
.landing-screen { --cue-ink: #fff; position: relative; height: 100dvh; scroll-snap-align: start; overflow: hidden; }
.landing-hello { display: grid; place-items: center; }
/* The row of the greeting — the words, the sign, the line — and its
   sizes live in @portfolio/lab/hello (tuned on /lab/hello); this file
   only places the pieces in it. */
/* The signs sit by their own edges (frame="signs"); the stage and its
   card hang off the box to the right and above. */
.landing-projects { position: absolute; left: 7.2vw; bottom: 9.5vh; }
/* A project is open: the signs sit over the window (z-index 80) and
   step back into the corner (SIGNS_OPEN), on the box's own clock and
   curve (--signs-move / --signs-ease, from the window's tuning) so the
   two move as one; on the way back they wait for the page's fade, as
   the box does (--signs-wait). The hover card's copy and rope leave on
   the same fade (--rs-hand). Not on a phone, where the box is the
   whole screen (the window's own 701px line). */
.landing-projects { transform-origin: 0 100%; transition: transform var(--signs-move, 420ms) var(--signs-ease, ease) var(--signs-wait, 0ms); }
@media (min-width: 701px) { .landing-projects.is-open { z-index: 90; transform: ${SIGNS_OPEN}; } }
@media (prefers-reduced-motion: reduce) { .landing-projects { transition: none; } }
/* A screen that is away keeps its piece out of sight, so the piece is
   never seen at rest before its entrance replays. */
.landing-screen.is-away .landing-piece { visibility: hidden; }
/* The mute switch: white on the mat, bottom right, level with the
   glyph's foot; over the prints' column (z-index 3), under the window. */
.landing-sound { position: fixed; right: 2.4vw; bottom: 3.5vh; z-index: 4; display: grid; place-items: center; width: 3.2vh; height: 3.2vh; min-width: 24px; min-height: 24px; padding: 0; background: none; border: 0; color: #fff; }
.landing-sound svg { display: block; width: 100%; height: 100%; }
.landing-sound[aria-pressed="true"] { opacity: 0.45; }
.landing-sound:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 999px; }
`;

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
      window.setTimeout(
        () => play("tap", 1, { at: "word" }),
        base + i * motion.stagger,
      ),
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
  const { w, h, measured } = useViewport();
  const tuning = signsTuning(w, h);
  // Under the window's rail line there is no pointer to speak of: the
  // prints take the screens instead of the signs. Decided once the
  // viewport is measured; until then neither is mounted.
  const phone = measured && w < 701;
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
  // reload, a bfcache return) is overridden, so the sequence above is
  // what every arrival gets — unless the arrival asks for the projects
  // (#projects: Home on a project's own page, and its foot), which
  // opens on the signs instead. The setting is the document's, so it is
  // put back when the landing unmounts.
  useEffect(() => {
    const restoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const land = () => {
      if (location.hash === "#projects" && projectsScreen.current)
        projectsScreen.current.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
    };
    land();
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) land();
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

  // The project window: which case study is open, kept in step with
  // the history stack. Opening pushes the project's URL (its state
  // carries the slug), a switch replaces it, and a close goes back —
  // so Back and the close button are the same thing, and a popstate
  // from either sets the state. Next patches pushState to keep its own
  // tree in the state; ours rides along.
  const [open, setOpen] = useState<string | null>(null);
  // The window's clock: the signs step back and return on it, and the
  // card's copy fades on its fade.
  const wt = useWindowTuning();
  // The open project's print, for the window to pick up and put back;
  // measured off the signs' stack, or off the phone's screens.
  const stack = useRef<HTMLDivElement>(null);
  const screensWrap = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState<WindowPreview | null>(null);
  const measure = (slug: string) =>
    printPreview(phone ? screensWrap.current : stack.current, slug);
  // The first open is a step in the history; a switch stays on it.
  function showProject(slug: string) {
    setFrom(measure(slug));
    setOpen(slug);
    history[open === null ? "pushState" : "replaceState"](
      { ...history.state, pw: slug },
      "",
      asset(`/work/${slug}/`),
    );
  }
  function closeProject() {
    // Measured again on the way out: the viewport may have changed.
    setFrom((f) => (open ? (measure(open) ?? f) : f));
    if (history.state?.pw) history.back();
    else setOpen(null);
  }
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      setOpen((e.state as { pw?: string } | null)?.pw ?? null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // The window's chunks come in as the projects screen arrives, so the
  // first click has nothing to wait for.
  useEffect(() => {
    if (screens.projects.held) warmWindow();
  }, [screens.projects.held]);
  // A plain left click on a link to a project opens it here; anything
  // modified, or any other link, is the browser's.
  function onProjectsClick(e: MouseEvent<HTMLElement>) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest("a[href]");
    const slug = a?.getAttribute("href")?.match(/\/work\/([^/?#]+)/)?.[1];
    if (!slug) return;
    e.preventDefault();
    if (slug === open) closeProject();
    else showProject(slug);
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
          text="Browse projects"
          onClick={() => {
            play("knock", 1, { at: "click" });
            scrollTo(projectsScreen);
          }}
        />
      </section>

      {/* The projects: one screen with the signs, or, on a phone, a
          screen per print. A click on a print or a sign anywhere in
          here opens the project. */}
      <div ref={screensWrap} onClick={onProjectsClick}>
        <section
          ref={projectsScreen}
          id="projects"
          className={["landing-screen", screens.projects.away && "is-away"]
            .filter(Boolean)
            .join(" ")}
          aria-label="Projects"
        >
          {phone && <style>{PHONE_PRINTS_CSS}</style>}
          <Cue
            dir="up"
            shown={screens.projects.held}
            delay={afterDrop}
            label="Scroll back to the top"
            text="Back up"
            onClick={() => {
              play("knock", 1, { at: "click" });
              scrollTo(helloScreen);
            }}
          />
          {phone && <PhoneProject spec={PRINTS[0]!} index={0} />}
          <div
            ref={stack}
            className={[
              "landing-projects",
              "landing-piece",
              open !== null && "is-open",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              {
                "--signs-move": `${moveMs(wt)}ms`,
                "--signs-ease": windowEase(wt),
                "--signs-wait": `${open === null ? wt.fade : 0}ms`,
                "--rs-hand": `${wt.fade}ms`,
              } as CSSProperties
            }
          >
            {measured && !phone && (
              <Suspense fallback={null}>
                <RoadSigns
                  controls={false}
                  frame="signs"
                  // The print stays under the box for the window's whole
                  // way back (the page's fade, then the shrink), then goes.
                  tuning={{ ...tuning, returnDelay: wt.fade + moveMs(wt) }}
                  replay={screens.projects.runs}
                  selected={open}
                />
              </Suspense>
            )}
          </div>
        </section>
        {phone &&
          PRINTS.slice(1).map((spec, i) => (
            <section
              key={spec.slug}
              id={phoneScreenId(i + 1)}
              className="landing-screen"
              aria-label={spec.title}
            >
              <PhoneProject spec={spec} index={i + 1} />
            </section>
          ))}
      </div>

      {/* The project window, beside the signs, while one is open. */}
      <ProjectWindowMount open={open} from={from} onClose={closeProject} />

      {/* Sound (see @portfolio/lab/sound): the pieces tick, strike and
          knock on their own; this is the switch that mutes all of it,
          and its mount primes the audio context. On by default: a
          browser that trusts the site sounds from the first hover, the
          rest wait for the first click — the browser's rule, not ours. */}
      <SoundToggle className="landing-sound sm-hover-lift sm-press" />
    </>
  );
}
