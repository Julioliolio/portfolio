"use client";

import {
  clipTimeNow,
  useWindowPreview,
  useWindowScroller,
} from "@portfolio/lab/window";
import { useEffect, useRef, useState } from "react";
import FilmPlayer from "./FilmPlayer";
import type { OpeningProps } from "./openings";

/**
 * Camper's opening: the project is a film, so the window opens on the
 * film — filling it, already playing — with a small arrow at its foot
 * to say the case study is underneath (Julio, 2026-09-18: keep it
 * simple). The page scrolls as any page does; the film holds once it is
 * mostly out of sight, so its sound doesn't play under the reading, and
 * carries on when it is back.
 *
 * It is never taller than three quarters of its width: on a wide window
 * that is the whole first screen, cropped a little at the sides; on a
 * phone it is a band across the top rather than a sliver of the middle
 * of each shot.
 */

const CSS = `
.co { position: relative; height: min(var(--cs-vh, 100dvh), 75cqw); margin: 0 calc(-1 * var(--cs-gutter)); overflow: hidden; background: #000; }
/* The arrow: nudges down a couple of px in held cuts, now and then. */
.co-arrow { position: absolute; left: 50%; bottom: 14px; display: grid; place-items: center; width: 32px; height: 32px; margin-left: -16px; padding: 0; border: 0; border-radius: 999px; background: none; color: #fff; opacity: .9; }
.co-arrow:hover { opacity: 1; }
.co-arrow:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
.co-arrow svg { display: block; width: 14px; height: 14px; filter: drop-shadow(0 0 3px rgba(0, 0, 0, .55)); animation: co-nudge 2.4s steps(1, end) infinite; }
@keyframes co-nudge { 0%, 70%, 100% { transform: none; } 80% { transform: translateY(3px); } 90% { transform: translateY(1px); } }
@media (prefers-reduced-motion: reduce) { .co-arrow svg { animation: none; } }
`;

export default function CamperOpening({ project }: OpeningProps) {
  const scroller = useWindowScroller();
  // The project window picked up the print with this very film in it:
  // start where the print's clip was, so the hand-off shows no jump.
  const preview = useWindowPreview();
  const film = useRef<HTMLDivElement>(null);
  /** The film is mostly scrolled out of sight. */
  const [away, setAway] = useState(false);

  useEffect(() => {
    const target: HTMLElement | Window = scroller ?? window;
    const read = () => {
      const el = film.current;
      if (!el) return;
      const top = scroller ? scroller.scrollTop : window.scrollY;
      // Two lines, not one, so resting near either doesn't flicker the
      // film on and off.
      setAway((was) => top > el.offsetHeight * (was ? 0.35 : 0.65));
    };
    read();
    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [scroller]);

  function down() {
    const el = film.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (scroller ?? window).scrollTo({
      top: el.offsetHeight,
      behavior: still ? "auto" : "smooth",
    });
  }

  const hero = project.hero;
  if (hero.kind !== "video") return null;
  // Where the clip is now, not where it was at the click: this page
  // may have taken a moment to load while the box grew.
  const startAt =
    preview && preview.src.endsWith(hero.src)
      ? clipTimeNow(preview)
      : undefined;

  return (
    <div ref={film} className="co">
      <style>{CSS}</style>
      <FilmPlayer
        src={hero.src}
        poster={hero.poster}
        aspect={hero.aspect}
        cinema
        away={away}
        startAt={startAt}
      >
        <button
          type="button"
          className="co-arrow sm-press"
          aria-label="Read the case study"
          onClick={down}
        >
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M1.5 6.5 6 11l4.5-4.5M6 11V1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </button>
      </FilmPlayer>
    </div>
  );
}
