import type { LabPieceModule, LabSlug } from "./registry";

/**
 * One lazy loader per registered piece. Import this only from client
 * components (LabStage and the trial stages) — see registry.ts for why
 * the loaders are kept away from the server-rendered pages.
 *
 * The `satisfies` clause makes a registry entry without a loader (or a
 * loader without an entry) a type error, while each loader keeps its
 * piece's real module type — `lazy(loaders.cartel)` is typed with
 * Cartel's own props.
 */
export const loaders = {
  "pointer-tilt": () => import("./pieces/pointer-tilt"),
  "clay-cursor": () => import("./pieces/clay-cursor"),
  cartel: () => import("./pieces/cartel"),
  motion: () => import("./pieces/motion"),
  greeting: () => import("./pieces/greeting"),
  hello: () => import("./pieces/hello"),
  boil: () => import("./pieces/boil"),
  sound: () => import("./pieces/sound"),
  "road-signs": () => import("./pieces/road-signs"),
  window: () => import("./pieces/window"),
  "ransom-note": () => import("./pieces/ransom-note"),
  type: () => import("./pieces/type"),
  contents: () => import("./pieces/contents"),
} satisfies Record<LabSlug, () => Promise<LabPieceModule>>;
