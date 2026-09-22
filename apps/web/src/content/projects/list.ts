/**
 * The projects by name and slug only, in the order the road signs stack
 * them — for the landing's window pills and the case study's way on,
 * which must not pull the case studies' copy into a page's first load
 * (a work page gets its own project as a prop). index.ts orders the full
 * modules by this list.
 */
export const PROJECT_LIST = [
  { slug: "localpal", title: "LocalPal" },
  { slug: "camper", title: "Camper" },
  { slug: "convertr", title: "Convertr" },
] as const;

export type ProjectSlug = (typeof PROJECT_LIST)[number]["slug"];

/**
 * The project after a slug's, wrapping around: each case study links to
 * the next one. Here rather than on the full modules so the template can
 * name it without pulling every case study's copy into the page's JS.
 */
export function projectAfter(slug: string): (typeof PROJECT_LIST)[number] {
  const i = PROJECT_LIST.findIndex((p) => p.slug === slug);
  return PROJECT_LIST[(i + 1) % PROJECT_LIST.length] ?? PROJECT_LIST[0];
}
