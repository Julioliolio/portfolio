import { camper } from "./camper";
import { convertr } from "./convertr";
import { localpal } from "./localpal";
import { PROJECT_LIST } from "./list";
import type { Project } from "./types";

export type { Block, Figure, Project, Section } from "./types";
export { PROJECT_LIST } from "./list";
export type { ProjectSlug } from "./list";

const bySlug: Record<string, Project> = { localpal, camper, convertr };

/**
 * The three case studies, in the order the road signs stack them (the
 * list's).
 */
export const projects: readonly Project[] = PROJECT_LIST.map((p) => {
  const project = bySlug[p.slug];
  if (!project) throw new Error(`No case study for ${p.slug}`);
  return project;
});
