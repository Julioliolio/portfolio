import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { Project } from "@/content/projects";

/**
 * A project's opening: its own first screen, in place of the template's
 * hero figure. The case studies share a hand — the window, the type, the
 * sections, the fades — and differ where a project can be told apart at
 * a glance: how it opens, and what its media is staged in. Camper is a
 * film, so it opens as cinema; a project with no opening here keeps the
 * hero figure.
 *
 * An opening fills the window's first screen (the template gives it
 * --cs-vh, the window's visible height) and the rest of the case study
 * follows under it, so it should say there is more below.
 *
 * Each is a chunk of its own — only its project pays for it.
 */
export type OpeningProps = {
  project: Project;
};

export const OPENINGS: Record<
  string,
  LazyExoticComponent<ComponentType<OpeningProps>> | undefined
> = {
  camper: lazy(() => import("./CamperOpening")),
};
