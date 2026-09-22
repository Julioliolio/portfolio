"use client";

import { asset } from "@portfolio/lab/asset";
import { loaders } from "@portfolio/lab/loaders";
import { ProjectWindow } from "@portfolio/lab/window";
import { Suspense, lazy, type MouseEvent } from "react";
import { signsTuning, useViewport } from "@/components/landing/signsTuning";
import type { Project } from "@/content/projects";
import { CaseStudy } from "./CaseStudy";
import { SHEET_LAYOUT, SIGNS_OPEN } from "./sheetLayout";

/**
 * /work/<slug> as a page of its own — a direct link, a reload, a
 * modified click on a sign. It looks like the landing with the project
 * open: the same window in its page mode (no entrance; Home is a link
 * back to the projects), and the road signs parked where the landing
 * parks them, this project's one held open. Here the signs are plain
 * links: another goes to that project's page, and the open one goes
 * back to the projects, as its second click closes the window on the
 * landing. The signs are a
 * chunk of their own, behind the page, and wait for the viewport to be
 * measured, since they are sized to it. The case study inside is the
 * one the landing shows, with the way home at its top (on a phone) and
 * foot.
 */

const RoadSigns = lazy(loaders["road-signs"]);

/** The landing, opened on its projects screen (see Landing.tsx). */
const PROJECTS = asset("/#projects");

// .pp-signs is the landing's place for the signs, stepped back as they
// are there while a project is open (SIGNS_OPEN), over the window
// (z-index 80); none on a phone, where the sheet is the whole screen.
// Said here rather than in the CSS, which ships.
const CSS = `
html { background: #faf9f6; }
body { background: #faf9f6; color: #2b2722; }
.pp-signs { display: none; }
@media (min-width: 701px) { .pp-signs { display: block; position: fixed; left: 7.2vw; bottom: 9.5vh; z-index: 90; transform-origin: 0 100%; transform: ${SIGNS_OPEN}; } }
`;

export function ProjectPage({ project }: { project: Project }) {
  const { w, h, measured } = useViewport();
  // The open sign is the way back to the projects; the rest are the
  // browser's.
  function onSignsClick(e: MouseEvent<HTMLElement>) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const a = (e.target as Element).closest("a[aria-current]");
    if (!a) return;
    e.preventDefault();
    location.assign(PROJECTS);
  }

  return (
    <main>
      {/* The wall, on the root so nothing dark shows on overscroll. */}
      <style>{CSS}</style>
      <ProjectWindow
        mode="page"
        active={project.slug}
        shown
        label={project.title}
        layout={SHEET_LAYOUT}
        closeHref={PROJECTS}
      >
        <CaseStudy project={project} home />
      </ProjectWindow>
      <nav className="pp-signs" aria-label="Projects" onClick={onSignsClick}>
        {measured && (
          <Suspense fallback={null}>
            <RoadSigns
              controls={false}
              frame="signs"
              tuning={signsTuning(w, h)}
              selected={project.slug}
            />
          </Suspense>
        )}
      </nav>
    </main>
  );
}
