import type { LabPieceModule, LabSlug } from "./registry";

/**
 * One lazy loader per registered piece. Import this only from client
 * components (LabStage and the trial stages) — see registry.ts for why
 * the loaders are kept away from the server-rendered pages.
 *
 * The `satisfies` clause makes a registry entry without a loader (or a
 * loader without an entry) a type error.
 */
export const loaders = {
  "pointer-tilt": () => import("./pieces/pointer-tilt"),
  "clay-cursor": () => import("./pieces/clay-cursor"),
  cartel: () => import("./pieces/cartel"),
  motion: () => import("./pieces/motion"),
  "road-signs": () => import("./pieces/road-signs"),
} satisfies Record<LabSlug, () => Promise<LabPieceModule>>;

export function loadPiece(slug: LabSlug): Promise<LabPieceModule> {
  return loaders[slug]();
}
