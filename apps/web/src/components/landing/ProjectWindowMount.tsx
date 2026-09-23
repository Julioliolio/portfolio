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
 * The clip the window grows out of: a project's hover card, found in
 * the signs' stack by its slug — its rect, file, frame and a snapshot
 * (clipPreview). The card is measured where it sits
 * with the stack at rest — while a project is open the stack is
 * stepped back (SIGNS_OPEN, a transform on `stack`), so the rect is
 * taken through the inverse of whatever transform is on it, which is
 * where the card will be once the stack has eased home. Null when
 * there is no card (a phone, the signs not yet in).
 */
export function previewOf(
  stack: HTMLElement | null,
  slug: string,
): WindowPreview | null {
  const media = stack?.querySelector<HTMLElement>(
    `.rs-card[data-slug="${slug}"] .rs-media`,
  );
  const video = media?.querySelector("video");
  if (!stack || !media || !video) return null;
  const r = media.getBoundingClientRect();
  const cs = getComputedStyle(stack);
  if (cs.transform === "none") {
    return clipPreview(video, {
      x: r.left,
      y: r.top,
      w: r.width,
      h: r.height,
    });
  }
  // The stack's transform, about its origin, in its own box: the point
  // that stays put tells where the box is at rest, and the inverse
  // takes the card's corners back there.
  const [ox = 0, oy = 0] = cs.transformOrigin.split(" ").map(parseFloat);
  const m = new DOMMatrix()
    .translate(ox, oy)
    .multiply(new DOMMatrix(cs.transform))
    .translate(-ox, -oy);
  const now = stack.getBoundingClientRect();
  const shift = m.transformPoint({ x: 0, y: 0 });
  const restX = now.left - shift.x;
  const restY = now.top - shift.y;
  const inv = m.inverse();
  const back = (x: number, y: number) => {
    const p = inv.transformPoint({ x: x - restX, y: y - restY });
    return { x: restX + p.x, y: restY + p.y };
  };
  const a = back(r.left, r.top);
  const b = back(r.right, r.bottom);
  return clipPreview(video, { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y });
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
