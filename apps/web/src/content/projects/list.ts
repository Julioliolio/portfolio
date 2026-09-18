/**
 * The projects by name and slug only, in the order the road signs stack
 * them — for the landing's window pills, which must not pull the case
 * studies' copy into the landing's first load. index.ts orders the full
 * modules by this list.
 */
export const PROJECT_LIST = [
  { slug: "localpal", title: "LocalPal" },
  { slug: "camper", title: "Camper" },
  { slug: "convertr", title: "Convertr" },
] as const;

export type ProjectSlug = (typeof PROJECT_LIST)[number]["slug"];
