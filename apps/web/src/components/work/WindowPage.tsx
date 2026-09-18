"use client";

import { projects } from "@/content/projects";
import { CaseStudy } from "./CaseStudy";

/**
 * The page inside the landing's project window: the case study for a
 * slug. Its own module so the landing loads the template and the
 * content on the first open, not with its first paint (see
 * ProjectWindowMount).
 */
export default function WindowPage({ slug }: { slug: string }) {
  const project = projects.find((p) => p.slug === slug);
  if (!project) return null;
  return <CaseStudy project={project} />;
}
