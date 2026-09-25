"use client";

import {
  PRINTS,
  PRINT_CSS,
  Print,
  type PrintSpec,
} from "@portfolio/lab/prints";
import { useEffect, useRef, type CSSProperties } from "react";

/**
 * The projects on a phone, where there is no pointer to hover a sign
 * with: the prints themselves, one to a screen, snapped through — the
 * pattern of yichenxie.com's phone list (Julio, 2026-09-25) in the
 * site's look. Each screen holds its print, square on the mat, and a
 * rail of dots on the right that says which of the three this is (each
 * a link to its screen). A tap on the print picks it up into the
 * window, which is the whole screen there; the landing's own click
 * handler does that (see Landing.tsx). A print's loop plays while its
 * screen is in view.
 *
 * The first print lives in the landing's projects screen, with its
 * cue; the others get a screen each after it.
 */

export const PHONE_PRINTS_CSS = `
${PRINT_CSS}
/* A screen's print: centred, square on the mat, as wide as the screen
   less a margin; a tall print keeps clear of the top and the bottom. */
.pp-slide { --rs-print-w: calc(100vw - 32px); position: absolute; inset: 0; display: grid; place-items: center; }
.pp-slide .rs-print { transform: none; }
.pp-slide .rs-print.is-tall { width: min(calc(100vw - 32px), calc((100dvh - 200px) * var(--pp-aspect, 1))); }
.pp-dots { position: absolute; right: 12px; top: 50%; display: grid; gap: 10px; transform: translateY(-50%); }
.pp-dot { display: block; width: 8px; height: 8px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, .85); background: transparent; }
.pp-dot[aria-current="true"] { background: #fff; }
`;

/** The id of the print's screen: the first is the projects screen. */
export const phoneScreenId = (i: number) =>
  i === 0 ? "projects" : `projects-${i + 1}`;

export function PhoneProject({
  spec,
  index,
}: {
  spec: PrintSpec;
  index: number;
}) {
  const slide = useRef<HTMLDivElement>(null);
  // The loop runs while the screen is in view, and rests otherwise.
  useEffect(() => {
    const el = slide.current;
    const video = el?.querySelector("video");
    if (!el || !video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={slide}
      className="pp-slide landing-piece"
      style={{ "--pp-aspect": spec.aspect } as CSSProperties}
    >
      <Print spec={spec} active tilt={0} />
      <nav className="pp-dots" aria-label="Projects">
        {PRINTS.map((p, i) => (
          <a
            key={p.slug}
            className="pp-dot"
            href={`#${phoneScreenId(i)}`}
            aria-current={i === index ? "true" : undefined}
            aria-label={p.title}
          />
        ))}
      </nav>
    </div>
  );
}
