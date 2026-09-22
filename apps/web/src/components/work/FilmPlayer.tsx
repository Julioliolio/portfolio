"use client";

import { asset } from "@portfolio/lab/asset";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

/**
 * The film player: a case study's `film` figure with the site's own
 * controls instead of the browser's — and as few of them as will do.
 * The film is the thing; the controls are company (Julio, 2026-09-18:
 * "it's just complementary, it shouldn't take much attention").
 *
 * A hairline along the film's foot is the seek bar: the part played in
 * the page's tint, press and drag (or click) anywhere along it to scrub,
 * the film following the pointer and carrying on afterwards if it was
 * playing. Over it, small white icons: play, mute, fullscreen. A click
 * on the picture plays and pauses. While the film plays and the pointer
 * rests, the icons cut away and the line dims. The line moves the way
 * the site moves: in hard cuts on a 12 fps beat, never a glide.
 *
 * In a figure it sits in a box of the film's own shape, behind its
 * poster and a play mark. As a project's opening (`cinema`, see
 * CamperOpening.tsx) it fills the screen it is given and starts itself.
 */

const PAPER = "#faf9f6";
const INK = "#2b2722";
/** The project's own colour inside a case study; the rope's blue
 *  anywhere else. */
const TINT = "var(--cs-tint, #2f6df6)";
/** The line's beat while the film plays, cuts per second. */
const BEAT = 12;
/** ms the icons stay up after the pointer last moved, while playing. */
const REST = 2000;
/** Seconds an arrow key steps. */
const STEP = 5;

const CSS = `
/* The picture is one big button under the controls. */
.fp-stage { position: absolute; inset: 0; display: grid; place-items: center; width: 100%; padding: 0; border: 0; background: none; color: inherit; }
.fp-stage:focus-visible { outline: 2px solid ${TINT}; outline-offset: -4px; }
.fp-mark { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 999px; background: ${PAPER}; color: ${INK}; transition: transform .16s steps(2, end); }
.fp-mark svg { width: 20px; height: 20px; margin-left: 3px; }
.fp-stage:hover .fp-mark { transform: scale(1.08); }

/* The icons, on a shade just deep enough to read them on a bright
   shot. They cut away while the film plays and the pointer rests. */
.fp-bar { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; gap: 2px; padding: 28px 10px 12px; background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, .38)); color: #fff; pointer-events: none; transition: opacity .16s steps(2, end); }
.fp.is-idle .fp-bar:not(:focus-within) { opacity: 0; }
.fp-btn { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 999px; background: none; color: inherit; opacity: .82; pointer-events: auto; }
.fp-btn:hover { opacity: 1; }
.fp-btn:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
/* A soft shadow, so white reads on a white floor as well as on a dark
   doorway. */
.fp-btn svg { display: block; width: 14px; height: 14px; filter: drop-shadow(0 0 3px rgba(0, 0, 0, .55)); }
.fp-gap { flex: 1; }

/* The line. Its box is taller than it looks, so it is easy to catch;
   nothing here eases — it is written on the beat, and tracks the pointer
   exactly in a drag. */
.fp-seek { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; touch-action: none; user-select: none; -webkit-user-select: none; }
.fp-seek::before, .fp-seek::after { content: ""; position: absolute; left: 0; bottom: 0; height: 3px; }
.fp-seek::before { right: 0; background: rgba(255, 255, 255, .3); }
.fp-seek::after { width: calc(var(--fp-at) * 100%); background: ${TINT}; }
.fp-seek:hover::before, .fp-seek:hover::after, .fp-seek.is-dragging::before, .fp-seek.is-dragging::after { height: 5px; }
.fp-seek:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
.fp.is-idle .fp-seek { opacity: .5; }

/* Cinema: the film is the screen it is on. */
.fp.is-cinema { position: absolute; inset: 0; border-radius: 0; background: #000; }

/* Fullscreen: the player is the screen. The clay cursor lives in the
   page, under the top layer, so here the system's cursor comes back. */
.fp:fullscreen { width: 100vw; height: 100vh; aspect-ratio: auto !important; border-radius: 0; background: #000; }
.cs-media.fp:fullscreen video { object-fit: contain; }
html.clay-cursor .fp:fullscreen, html.clay-cursor .fp:fullscreen * { cursor: auto !important; }
html.clay-cursor .fp.is-idle:fullscreen, html.clay-cursor .fp.is-idle:fullscreen * { cursor: none !important; }
@media (prefers-reduced-motion: reduce) { .fp-bar, .fp-mark { transition: none; } }
`;

const PLAY = (
  <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <path d="M3 1.2v11.6a.6.6 0 0 0 .92.5l9-5.8a.6.6 0 0 0 0-1L3.92.7A.6.6 0 0 0 3 1.2Z" />
  </svg>
);
const PAUSE = (
  <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <rect x="2.5" y="1.5" width="3.2" height="11" rx=".8" />
    <rect x="8.3" y="1.5" width="3.2" height="11" rx=".8" />
  </svg>
);
const SPEAKER =
  "M1.5 5h2.3l3-2.6a.5.5 0 0 1 .8.4v8.4a.5.5 0 0 1-.8.4L3.8 9H1.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Z";
const SOUND_ON = (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d={SPEAKER} fill="currentColor" />
    <path
      d="M9.6 4.8a3 3 0 0 1 0 4.4M11.4 3a5.6 5.6 0 0 1 0 8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);
const SOUND_OFF = (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d={SPEAKER} fill="currentColor" />
    <path
      d="m9.6 5.2 3.4 3.6m0-3.6L9.6 8.8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);
const EXPAND = (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M1.5 5V1.5H5M9 1.5h3.5V5M12.5 9v3.5H9M5 12.5H1.5V9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
    />
  </svg>
);

/** The synth is its own chunk (as in @portfolio/lab/window): the work
 *  pages sit close to the JS budget, and a film that is never played
 *  never needs it. */
const sounds = () => import("@portfolio/lab/sound");
function click(name: "tap" | "knock") {
  void sounds().then((m) => m.play(name, 1, { at: "click" }));
}

/** 83 -> "1:23", for the line's spoken value. */
function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Props = {
  /** public/ paths, as the content module has them. */
  src: `/${string}`;
  poster?: `/${string}`;
  aspect: number;
  /** The film fills its parent edge to edge (cropped to cover) and
   *  starts on its own — with sound where the browser allows it (it does
   *  after a click on this site, as when a sign opens the window), muted
   *  otherwise. Not for readers who asked for reduced motion. */
  cinema?: boolean;
  /** The film has been scrolled out of sight: it holds, and carries on
   *  when it is back if this is what stopped it. */
  away?: boolean;
  /** Laid over the picture, above the controls. */
  children?: ReactNode;
};

export default function FilmPlayer({
  src,
  poster,
  aspect,
  cinema = false,
  away = false,
  children,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  /** A drag in progress, and whether the film was playing when it
   *  began. */
  const drag = useRef<{ resume: boolean } | null>(null);
  /** The newest seek asked for while the last one was still landing. */
  const pending = useRef<number | null>(null);
  const rest = useRef<number | null>(null);
  /** Being out of sight is what paused it. */
  const held = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [awake, setAwake] = useState(false);
  const [dragging, setDragging] = useState(false);

  // The beat: while the film plays, the line is read off it twelve
  // times a second and no oftener.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const v = video.current;
      if (v && !drag.current) setTime(v.currentTime);
    }, 1000 / BEAT);
    return () => window.clearInterval(id);
  }, [playing]);

  // The page is prerendered, so the film's metadata can land before
  // React is listening for it: read what is already known.
  useEffect(() => {
    const v = video.current;
    if (v && v.readyState >= 1) setDuration(v.duration);
  }, []);

  // Cinema starts itself: with sound, or failing that without.
  useEffect(() => {
    const v = video.current;
    if (!cinema || !v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [cinema]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (away && !v.paused) {
      held.current = true;
      v.pause();
    } else if (!away && held.current) {
      held.current = false;
      void v.play().catch(() => {});
    }
  }, [away]);

  useEffect(
    () => () => {
      if (rest.current !== null) window.clearTimeout(rest.current);
    },
    [],
  );

  /** The pointer is about: the icons are up, until it rests. */
  function wake(ms = REST) {
    setAwake(true);
    if (rest.current !== null) window.clearTimeout(rest.current);
    rest.current = window.setTimeout(() => {
      rest.current = null;
      setAwake(false);
    }, ms);
  }

  function toggle() {
    const v = video.current;
    if (!v) return;
    click("knock");
    held.current = false;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }

  function toggleMute() {
    const v = video.current;
    if (!v) return;
    click("tap");
    v.muted = !v.muted;
  }

  function toggleFull() {
    const el = root.current;
    const v = video.current as
      (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    click("tap");
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el?.requestFullscreen) void el.requestFullscreen().catch(() => {});
    // iPhone Safari has no element fullscreen, only the video's own.
    else v?.webkitEnterFullscreen?.();
  }

  /** Moves the film. A seek can take a few frames to land; the ones
   *  asked for meanwhile collapse into the newest, sent when it does. */
  function seek(to: number) {
    const v = video.current;
    if (!v || !duration) return;
    const t = Math.min(duration, Math.max(0, to));
    setStarted(true);
    setTime(t);
    if (v.seeking) pending.current = t;
    else v.currentTime = t;
  }

  function seeked() {
    const v = video.current;
    const t = pending.current;
    pending.current = null;
    if (v && t !== null) v.currentTime = t;
  }

  function at(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * duration;
  }

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    const v = video.current;
    if (!v || e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A pointer that can't be captured still scrubs while it is over
      // the line.
    }
    drag.current = { resume: !v.paused };
    v.pause();
    setDragging(true);
    seek(at(e));
  }

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current) seek(at(e));
  }

  function up(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
    if (d.resume) void video.current?.play().catch(() => {});
    wake();
  }

  /** On the line: the arrows step. */
  function keys(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const now = pending.current ?? time;
    seek(now + (e.key === "ArrowLeft" ? -STEP : STEP));
    e.preventDefault();
    wake();
  }

  const progress = duration ? Math.min(1, time / duration) : 0;
  const idle = playing && !awake && !dragging;

  return (
    <div
      ref={root}
      className={["cs-media fp", cinema && "is-cinema", idle && "is-idle"]
        .filter(Boolean)
        .join(" ")}
      style={cinema ? undefined : { aspectRatio: aspect }}
      onPointerMove={() => wake()}
      onPointerDown={() => wake()}
      onPointerLeave={() => wake(500)}
      // Tabbing in brings the icons up, so they can be reached.
      onFocus={() => wake()}
    >
      <style>{CSS}</style>
      <video
        ref={video}
        src={asset(src)}
        poster={poster && asset(poster)}
        playsInline
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => {
          // A drag holds the film still without it counting as paused.
          if (!drag.current) setPlaying(false);
        }}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        onSeeked={seeked}
        onTimeUpdate={(e) => {
          // Playing, the beat reads the time; this is for the rest.
          if (e.currentTarget.paused && !drag.current)
            setTime(e.currentTarget.currentTime);
        }}
      />
      <button
        type="button"
        className="fp-stage"
        aria-label={playing ? "Pause the film" : "Play the film"}
        data-cursor-label={playing ? "pause" : "play"}
        onClick={toggle}
      >
        {!started && <span className="fp-mark">{PLAY}</span>}
      </button>

      <div className="fp-bar">
        <button
          type="button"
          className="fp-btn sm-press"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
        >
          {playing ? PAUSE : PLAY}
        </button>
        <button
          type="button"
          className="fp-btn sm-press"
          aria-label={muted ? "Sound on" : "Mute"}
          aria-pressed={muted}
          onClick={toggleMute}
        >
          {muted ? SOUND_OFF : SOUND_ON}
        </button>
        <span className="fp-gap" />
        <button
          type="button"
          className="fp-btn sm-press"
          aria-label="Fullscreen"
          onClick={toggleFull}
        >
          {EXPAND}
        </button>
      </div>
      {children}
      <div
        className={dragging ? "fp-seek is-dragging" : "fp-seek"}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${clock(time)} of ${clock(duration)}`}
        data-cursor="pointer"
        style={{ "--fp-at": progress } as CSSProperties}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={keys}
      />
    </div>
  );
}
