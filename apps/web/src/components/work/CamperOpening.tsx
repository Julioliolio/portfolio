"use client";

import { TapeArrow, TapeStyles } from "@portfolio/lab/tape";
import { useWindowPreview, useWindowScroller } from "@portfolio/lab/window";
import { clipTimeNow } from "@portfolio/lab/window-preview";
import { useEffect, useRef, useState } from "react";
import FilmPlayer from "./FilmPlayer";
import type { OpeningProps } from "./openings";

/**
 * Camper's opening: the project is a film, so the window opens on the
 * film — filling it, already playing — with a little tape arrow at its
 * foot, the landing's own (@portfolio/lab/tape) a size smaller, to say
 * the case study is underneath (Julio, 2026-09-18: keep it simple;
 * 2026-09-29: the tape in place of the drawn arrow). The page scrolls
 * as any page does; the film holds once half of it is out of sight, so
 * its sound doesn't play under the reading and the sheet isn't scrolled
 * over a playing film for long (2026-10-01), and carries on when it is
 * back.
 *
 * It is never taller than three quarters of its width: on a wide window
 * that is the whole first screen, cropped a little at the sides; on a
 * phone it is a band across the top rather than a sliver of the middle
 * of each shot.
 */

const CSS = `
.co { position: relative; height: min(var(--cs-vh, 100dvh), 56.25cqw); margin: 0 calc(-1 * var(--cs-gutter)); overflow: hidden; background: #000; }
/* The tape arrow, a size under the landing's (whose least, 40px, would
   hold it there on most windows). It is the film's company, not the
   fullscreen film's. */
.co .tape { --tape-size: max(3.2vh, 30px); }
.fp:fullscreen .tape { display: none; }
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
    let was = false;
    const read = () => {
      const el = film.current;
      if (!el) return;
      const top = scroller ? scroller.scrollTop : window.scrollY;
      // Two lines, not one, so resting near either doesn't flicker the
      // film on and off; and the page hears of it only when it flips,
      // not on every scroll event.
      const now = top > el.offsetHeight * (was ? 0.25 : 0.5);
      if (now === was) return;
      was = now;
      setAway(now);
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
  if ("type" in hero || hero.kind !== "video") return null;
  // Where the clip is now, not where it was at the click: this page
  // may have taken a moment to load while the box grew.
  const startAt =
    preview && preview.src.endsWith(hero.src)
      ? clipTimeNow(preview)
      : undefined;

  return (
    <div ref={film} className="co">
      <style>{CSS}</style>
      <TapeStyles />
      <FilmPlayer
        src={hero.src}
        poster={hero.poster}
        aspect={hero.aspect}
        cinema
        away={away}
        startAt={startAt}
      >
        <TapeArrow
          dir="down"
          shown
          delay={400}
          // No words: here the tape only peels.
          text=""
          label="Read the case study"
          onClick={down}
        />
      </FilmPlayer>
    </div>
  );
}
