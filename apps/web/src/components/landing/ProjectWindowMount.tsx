"use client";

import { clipPreview, type WindowPreview } from "@portfolio/lab/window";
import { Suspense, lazy, useState } from "react";
import { WINDOW_LAYOUT } from "@/components/work/windowLayout";
import { PROJECT_LIST } from "@/content/projects/list";

/**
 * The project window on the landing, and what goes in it. Both come in
 * on demand: the window's chrome (@portfolio/lab/window) and the page
 * (the case-study template with the three content modules) are
 * separate chunks, fetched on the first open — or earlier, by
 * `warmWindow()`, which the landing calls as the projects screen
 * arrives so a click on a sign has nothing to wait for.
 *
 * The landing owns which project is open (and the URL), and the signs
 * that switch it; this only maps that onto the window. The last open
 * slug is kept through the close so the exit plays with the page still
 * in the box.
 */

const ProjectWindow = lazy(() =>
  import("@portfolio/lab/window").then((m) => ({ default: m.ProjectWindow })),
);
const WindowPage = lazy(() => import("@/components/work/WindowPage"));

/** Fetches the window's chunks ahead of the first open. */
export function warmWindow() {
  void import("@portfolio/lab/window");
  void import("@/components/work/WindowPage");
}

/**
 * The print the window picks up: the project's, found in the signs'
 * column by its slug — the one that is up (or, before any is, its own
 * place in the track) — its rect, lean and frame, its clip, the frame
 * the clip is on and a snapshot (clipPreview). The print is measured
 * where it sits with the stack at rest — while a project is open the
 * stack is stepped back (SIGNS_OPEN, a transform on `stack`), so the
 * rect is taken through the inverse of whatever transform is on it,
 * which is where the print will be once the stack has eased home. A
 * print leans (a rotation about its centre): its bounding box is taken
 * for the centre alone, and its size is its own; the window turns by
 * the same lean, so the two meet to the pixel. Null when there is no
 * print (the signs not yet in).
 */
export function previewOf(
  stack: HTMLElement | null,
  slug: string,
): WindowPreview | null {
  const print =
    stack?.querySelector<HTMLElement>(
      `.rs-print[data-slug="${slug}"].is-active`,
    ) ?? stack?.querySelector<HTMLElement>(`.rs-print[data-slug="${slug}"]`);
  const media = print?.querySelector<HTMLElement>(".rs-media");
  const video = media?.querySelector("video");
  if (!stack || !print || !media || !video) return null;
  const r = print.getBoundingClientRect();
  const cs = getComputedStyle(stack);
  // The bounding box's centre through the stack's transform, if any:
  // the transform, about its origin, in its own box — the point that
  // stays put tells where the box is at rest, and the inverse takes
  // the centre back there.
  let cx = r.left + r.width / 2;
  let cy = r.top + r.height / 2;
  if (cs.transform !== "none") {
    const [ox = 0, oy = 0] = cs.transformOrigin.split(" ").map(parseFloat);
    const m = new DOMMatrix()
      .translate(ox, oy)
      .multiply(new DOMMatrix(cs.transform))
      .translate(-ox, -oy);
    const now = stack.getBoundingClientRect();
    const shift = m.transformPoint({ x: 0, y: 0 });
    const restX = now.left - shift.x;
    const restY = now.top - shift.y;
    const p = m.inverse().transformPoint({ x: cx - restX, y: cy - restY });
    cx = restX + p.x;
    cy = restY + p.y;
  }
  // The print's own size, and its frame, from layout — untouched by
  // any transform, and the stack at rest has none.
  const w = print.offsetWidth;
  const h = print.offsetHeight;
  const inset = {
    top: media.offsetTop,
    left: media.offsetLeft,
    right: print.offsetWidth - media.offsetLeft - media.offsetWidth,
    bottom: print.offsetHeight - media.offsetTop - media.offsetHeight,
  };
  const tilt =
    parseFloat(getComputedStyle(print).getPropertyValue("--rs-tilt")) || 0;
  return clipPreview(
    video,
    { x: cx - w / 2, y: cy - h / 2, w, h },
    { tilt, inset },
  );
}

export function ProjectWindowMount({
  open,
  from,
  onClose,
}: {
  /** The open project's slug, or null for closed. */
  open: string | null;
  /** The open project's card clip: the box grows out of it and shrinks
   *  back into it. */
  from: WindowPreview | null;
  onClose: () => void;
}) {
  const [slug, setSlug] = useState(open);
  if (open !== null && open !== slug) setSlug(open);
  if (slug === null) return null;
  const title = PROJECT_LIST.find((p) => p.slug === slug)?.title ?? slug;

  return (
    <Suspense fallback={null}>
      <ProjectWindow
        active={slug}
        shown={open !== null}
        from={from}
        label={title}
        layout={WINDOW_LAYOUT}
        onClose={onClose}
      >
        <Suspense fallback={null}>
          <WindowPage key={slug} slug={slug} />
        </Suspense>
      </ProjectWindow>
    </Suspense>
  );
}
