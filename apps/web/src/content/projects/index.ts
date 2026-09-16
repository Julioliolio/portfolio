import { camper } from "./camper";
import { convertr } from "./convertr";
import { localpal } from "./localpal";
import type { Project } from "./types";

export type { Block, Figure, Project, Section } from "./types";

/**
 * The three case studies, in the order the road signs stack them on the
 * landing. Each page links to the next one here, wrapping around.
 */
export const projects: readonly Project[] = [localpal, camper, convertr];

export type ProjectSlug = (typeof projects)[number]["slug"];

export function projectAfter(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length] ?? projects[0]!;
}
