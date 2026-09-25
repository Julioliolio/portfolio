"use client";

import { WINDOW_LAYOUT } from "@portfolio/lab/signs-layout";
import type { WindowPreview } from "@portfolio/lab/window";
import { Suspense, lazy, useState } from "react";
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
