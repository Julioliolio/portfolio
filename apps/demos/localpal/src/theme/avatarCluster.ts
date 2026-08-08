/**
 * Tunable layout for the avatar cluster — the three tilted, overlapping
 * peer-pin tiles on activity cards ("Going together" / who's-going rows).
 * Defaults measured from the Figma node geometry (1362:2244). The Lab →
 * Cluster tab edits a copy of this live (drag tiles to place them by hand);
 * paste tuned values back here to make them the app-wide default.
 *
 * All values are at the reference scale (40px-wide tiles); the component
 * scales everything by `size / 40`.
 */
export type ClusterSlot = {
  /** Tile CENTER within the cluster box. */
  x: number;
  y: number;
  /** Tile size — the design mixes a 40×40 tile with 40×42 arch tiles. */
  w: number;
  h: number;
  /** Tilt in degrees. */
  rot: number;
};

export type AvatarClusterConfig = {
  /** Layout box the row reserves — tiles may overhang it, like the design. */
  boxW: number;
  boxH: number;
  /** BACK-TO-FRONT paint order: [back, middle, front]. */
  slots: [ClusterSlot, ClusterSlot, ClusterSlot];
};

// Hand-tuned in Lab → Cluster (2026-07-03).
export const defaultAvatarCluster: AvatarClusterConfig = {
  boxW: 94.5,
  boxH: 49.4,
  slots: [
    { x: 70.34, y: 25.15, w: 40, h: 40, rot: 11 },
    { x: 22.98, y: 25.47, w: 40, h: 42, rot: 5 },
    { x: 46.38, y: 24.59, w: 40, h: 42, rot: -10 },
  ],
};
