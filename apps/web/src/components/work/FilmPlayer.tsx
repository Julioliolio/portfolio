"use client";

import { asset } from "@portfolio/lab/asset";
import { playLater } from "@portfolio/lab/play-later";
import { BLUE, INK } from "@portfolio/lab/style";
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
 * the site's blue, press and drag (or click) anywhere along it to scrub,
 * the film following the pointer and carrying on afterwards if it was
 * playing. While the pointer is over the film, small white icons come
 * up (Julio, 2026-09-29): in the middle, back to the start, play or
 * pause, and five seconds on; the sound at the top right, fullscreen at
 * the bottom right. A click on the picture plays and pauses. When the
 * pointer rests or leaves, the icons cut away; while the film plays the
 * line dims too. The line moves the way
 * the site moves: in hard cuts on a 12 fps beat, never a glide.
 *
 * In a figure it sits in a box of the film's own shape, behind its
 * poster and a play mark. As a project's opening (`cinema`, see
 * CamperOpening.tsx) it fills the screen it is given and starts itself.
 */

const PAPER = "#faf9f6";
/** The line's beat while the film plays, cuts per second. */
const BEAT = 12;
/** ms the icons stay up after the pointer last moved, while playing. */
const REST = 2000;
/** Seconds an arrow key, or the five-on button, steps. */
const STEP = 5;

const CSS = `
/* The picture is one big button under the controls. */
.fp-stage { position: absolute; inset: 0; display: grid; place-items: center; width: 100%; padding: 0; border: 0; background: none; color: inherit; }
.fp-stage:focus-visible { outline: 2px solid ${BLUE}; outline-offset: -4px; }
.fp-mark { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 999px; background: ${PAPER}; color: ${INK}; transition: transform .16s steps(2, end); }
.fp-mark svg { width: 20px; height: 20px; margin-left: 3px; }
.fp-stage:hover .fp-mark { transform: scale(1.08); }

/* The controls come up while the pointer is over the film (or focus is
   inside it) and cut away when it rests or leaves: in the middle, back
   to the start, play or pause, five seconds on; the sound at the top
   right, fullscreen at the bottom right. White on a soft shadow, so they
   read on a white floor as well as on a dark doorway; the middle three
   on a faint round shade, since they sit on the picture itself. */
.fp-mid, .fp-corner { position: absolute; display: flex; align-items: center; color: #fff; pointer-events: none; transition: opacity .16s steps(2, end); }
.fp-mid { left: 50%; top: 50%; gap: 14px; transform: translate(-50%, -50%); }
.fp-corner.is-top { top: 10px; right: 10px; }
.fp-corner.is-foot { bottom: 14px; right: 10px; }
.fp.is-rest .fp-mid:not(:focus-within), .fp.is-rest .fp-corner:not(:focus-within), .fp.is-fresh .fp-mid { opacity: 0; }
.fp.is-rest .fp-mid:not(:focus-within) .fp-btn, .fp.is-rest .fp-corner:not(:focus-within) .fp-btn, .fp.is-fresh .fp-mid .fp-btn { pointer-events: none; }
.fp-btn { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 999px; background: none; color: inherit; opacity: .86; pointer-events: auto; }
.fp-btn:hover { opacity: 1; }
.fp-btn:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
.fp-btn svg { display: block; width: 14px; height: 14px; filter: drop-shadow(0 0 3px rgba(0, 0, 0, .6)); }
.fp-mid .fp-btn { width: 44px; height: 44px; background: rgba(0, 0, 0, .22); }
.fp-mid .fp-btn svg { width: 18px; height: 18px; }
.fp-mid .fp-btn.is-main { width: 60px; height: 60px; }
.fp-mid .fp-btn.is-main svg { width: 22px; height: 22px; }

/* The line. Its box is taller than it looks, so it is easy to catch;
   nothing here eases — it is written on the beat, and tracks the pointer
   exactly in a drag. */
.fp-seek { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; touch-action: none; user-select: none; -webkit-user-select: none; }
.fp-seek::before, .fp-seek::after { content: ""; position: absolute; left: 0; bottom: 0; height: 3px; }
.fp-seek::before { right: 0; background: rgba(255, 255, 255, .3); }
.fp-seek::after { width: calc(var(--fp-at) * 100%); background: ${BLUE}; }
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
@media (prefers-reduced-motion: reduce) { .fp-mid, .fp-corner, .fp-mark { transition: none; } }
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
const TO_START = (
  <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <rect x="1.6" y="1.8" width="1.8" height="10.4" rx=".6" />
    <path d="M12.4 2.3v9.4a.6.6 0 0 1-.93.5L4.6 7.5a.6.6 0 0 1 0-1l6.87-4.7a.6.6 0 0 1 .93.5Z" />
  </svg>
);
/** A turn clockwise with the seconds it goes on in it. */
const FIVE_ON = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.5 12a8.5 8.5 0 1 1-2.5-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19.8 1.8v5.4h-5.4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="10.5"
      fontWeight="600"
      fill="currentColor"
    >
      {STEP}
    </text>
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
  /** Cinema: where to start, s — the frame the project window's clip
   *  was on, so the hand-off to the page shows no jump. */
  startAt?: number;
  /** Laid over the picture, above the controls. */
  children?: ReactNode;
};

export default function FilmPlayer({
  src,
  poster,
  aspect,
  cinema = false,
  away = false,
  startAt,
  children,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const line = useRef<HTMLDivElement>(null);
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
  // times a second and no oftener — written straight onto the line, so
  // the player isn't rendered again twelve times a second under a
  // scrolling page. A pause, a seek or a drag hands it back to `time`
  // (onTimeUpdate, seek()).
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const v = video.current;
      const el = line.current;
      if (!v || !el || drag.current) return;
      const t = v.currentTime;
      const d = v.duration;
      el.style.setProperty("--fp-at", String(d > 0 ? Math.min(1, t / d) : 0));
      el.setAttribute("aria-valuenow", String(Math.round(t)));
      el.setAttribute("aria-valuetext", `${clock(t)} of ${clock(d)}`);
    }, 1000 / BEAT);
    return () => window.clearInterval(id);
  }, [playing]);

  // The page is prerendered, so the film's metadata can land before
  // React is listening for it: read what is already known.
  useEffect(() => {
    const v = video.current;
    if (v && v.readyState >= 1) setDuration(v.duration);
  }, []);

  // Cinema starts itself — where it was asked to, and with sound, or
  // failing that without.
  useEffect(() => {
    const v = video.current;
    if (!cinema || !v) return;
    if (startAt) v.currentTime = startAt;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
    // Starts once: a later startAt must not seek a film already playing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    playLater("knock", 1, "click");
    held.current = false;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }

  /** Back to the first frame, playing. */
  function restart() {
    const v = video.current;
    if (!v) return;
    playLater("tap", 1, "click");
    held.current = false;
    seek(0);
    void v.play().catch(() => {});
  }

  /** Where the film is now: playing, `time` lags it (see the beat). */
  const now = () => pending.current ?? video.current?.currentTime ?? time;

  function skip() {
    playLater("tap", 1, "click");
    seek(now() + STEP);
  }

  function toggleMute() {
    const v = video.current;
    if (!v) return;
    playLater("tap", 1, "click");
    v.muted = !v.muted;
  }

  function toggleFull() {
    const el = root.current;
    const v = video.current as
      (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    playLater("tap", 1, "click");
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
    seek(now() + (e.key === "ArrowLeft" ? -STEP : STEP));
    e.preventDefault();
    wake();
  }

  const progress = duration ? Math.min(1, time / duration) : 0;
  /** No pointer about: the controls are down. */
  const lowered = !awake && !dragging;
  const idle = playing && lowered;

  return (
    <div
      ref={root}
      className={[
        "cs-media fp",
        cinema && "is-cinema",
        lowered && "is-rest",
        idle && "is-idle",
        // Before the first play the mark is the way in.
        !started && "is-fresh",
      ]
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
        onClick={toggle}
      >
        {!started && <span className="fp-mark">{PLAY}</span>}
      </button>

      <div className="fp-mid">
        <button
          type="button"
          className="fp-btn sm-press"
          aria-label="Start again"
          onClick={restart}
        >
          {TO_START}
        </button>
        <button
          type="button"
          className="fp-btn is-main sm-press"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
        >
          {playing ? PAUSE : PLAY}
        </button>
        <button
          type="button"
          className="fp-btn sm-press"
          aria-label={`${STEP} seconds on`}
          onClick={skip}
        >
          {FIVE_ON}
        </button>
      </div>
      <div className="fp-corner is-top">
        <button
          type="button"
          className="fp-btn sm-press"
          aria-label={muted ? "Sound on" : "Mute"}
          aria-pressed={muted}
          onClick={toggleMute}
        >
          {muted ? SOUND_OFF : SOUND_ON}
        </button>
      </div>
      <div className="fp-corner is-foot">
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
        ref={line}
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
