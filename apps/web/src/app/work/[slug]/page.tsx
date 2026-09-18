import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/work/ProjectPage";
import { projects } from "@/content/projects";

/**
 * /work/<slug>: one case study per project, all from the same template,
 * shown in the project window's page mode (components/work/ProjectPage).
 * The slugs come from the content index, so adding a project is one
 * content module and one entry in its list; the road signs on the
 * landing open the same case study in the window and push this URL, so
 * a reload, a share or a modified click lands here.
 */
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} — Julio Romero`,
    description: project.summary,
  };
}

export default async function WorkPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  return <ProjectPage project={project} />;
}
