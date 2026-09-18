"use client";

import { asset } from "@portfolio/lab/asset";
import { ProjectWindow } from "@portfolio/lab/window";
import type { Project } from "@/content/projects";
import { CaseStudy } from "./CaseStudy";

/**
 * /work/<slug> as a page of its own — a direct link, a reload, a
 * modified click on a sign or a pill. The same window as on the
 * landing, in its page mode: the card is the viewport, nothing behind
 * it, the close is a link home. The case study inside is the one the
 * window on the landing shows, with the way home at its top and foot.
 */
export function ProjectPage({ project }: { project: Project }) {
  return (
    <main>
      {/* The wall, on the root so nothing dark shows on overscroll. */}
      <style>{`html { background: #faf9f6; } body { background: #faf9f6; color: #2b2722; }`}</style>
      <ProjectWindow
        mode="page"
        tabs={[]}
        active={project.slug}
        shown
        label={project.title}
        closeHref={asset("/")}
      >
        <CaseStudy project={project} home />
      </ProjectWindow>
    </main>
  );
}
