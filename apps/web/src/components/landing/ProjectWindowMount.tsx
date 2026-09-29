"use client";

import { WINDOW_LAYOUT } from "@portfolio/lab/signs-layout";
import type { WindowPreview } from "@portfolio/lab/window-preview";
import { Suspense, useEffect, useState } from "react";
import { PROJECT_LIST } from "@/content/projects/list";

/**
 * The project window on the landing, and what goes in it. Both come in
 * on demand: the window's chrome (@portfolio/lab/window) and the page
 * (the case-study template with the three content modules) are
 * separate chunks, fetched by `loadWindow()` — which the landing calls
 * as the projects screen arrives, and waits for before it opens a
 * project, so the signs stepping back and the box growing start in the
 * same commit. They are rendered as plain components once loaded, not
 * through lazy(): a lazy one suspends on its first render, and React
 * holds a revealed Suspense boundary back ~300ms, which left the box
 * that far behind the signs.
 *
 * The landing owns which project is open (and the URL), and the signs
 * that switch it; this only maps that onto the window. The last open
 * slug is kept through the close so the exit plays with the page still
 * in the box.
 */

type Loaded = {
  ProjectWindow: typeof import("@portfolio/lab/window").ProjectWindow;
  WindowPage: typeof import("@/components/work/WindowPage").default;
};
/** The signs' order, for the way a switch goes. */
const ORDER = PROJECT_LIST.map((p) => p.slug);
let loaded: Loaded | null = null;
let loading: Promise<void> | null = null;

/** Fetches the window's chunks; resolves once both are in. */
export function loadWindow(): Promise<void> {
  loading ??= Promise.all([
    import("@portfolio/lab/window"),
    import("@/components/work/WindowPage"),
  ]).then(([w, p]) => {
    loaded = { ProjectWindow: w.ProjectWindow, WindowPage: p.default };
  });
  return loading;
}

export function ProjectWindowMount({
  open,
  from,
  onClose,
}: {
  /** The open project's slug, or null for closed. */
  open: string | null;
  /** The open project's print (printPreview): the box grows out of it
   *  and shrinks back into it. */
  from: WindowPreview | null;
  onClose: () => void;
}) {
  const [slug, setSlug] = useState(open);
  if (open !== null && open !== slug) setSlug(open);
  // Opened before the chunks were in (a Forward, say): rendered once
  // they are.
  const [, setReady] = useState(loaded !== null);
  useEffect(() => {
    if (slug !== null && !loaded) void loadWindow().then(() => setReady(true));
  }, [slug]);
  if (slug === null || !loaded) return null;
  const { ProjectWindow, WindowPage } = loaded;
  const title = PROJECT_LIST.find((p) => p.slug === slug)?.title ?? slug;

  return (
    <ProjectWindow
      active={slug}
      order={ORDER}
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
  );
}
