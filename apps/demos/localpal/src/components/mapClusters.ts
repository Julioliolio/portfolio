/**
 * Screen-space clustering for the map's event pins (see theme/mapClusters.ts
 * for the behavior spec and tunables).
 *
 * Pure geometry: all pins pan together, so the pixel distance between two geo
 * points depends only on zoom — the grouping is a function of (pins, zoom,
 * collide radius) and needs no map projection calls. Pins are union-found
 * into collision groups; in each group every pin of the highest-`priority`
 * member's kind merges into a stacked container at their centroid (a lone
 * winner just stays full-size), and the other kind demotes to dots.
 */

export type ClusterPoint = {
  id: string;
  lng: number;
  lat: number;
  kind: "venue" | "peer";
  priority: number;
};

export type PinStack = {
  /** The winner's pin id names the stack. */
  id: string;
  /** What's stacked — peers and venues each bunch with their own kind. */
  kind: "venue" | "peer";
  /** Geo centroid of the stacked pins — the container's anchor. */
  center: { lng: number; lat: number };
  /** Member pin ids, front (winner) → back. */
  members: string[];
  /** Tightest member pair (px at the computed zoom) — for split-zoom math. */
  minPairPx: number;
};

export type Placement =
  | { mode: "full" }
  | { mode: "dot" }
  /** Far-tier curation: the pin doesn't exist at this zoom (see
   *  theme/mapClusters.ts `defaultMapDensity`) — it fades out entirely and
   *  the aggregate hint pill speaks for it. */
  | { mode: "hidden" }
  | { mode: "stack"; stack: PinStack; slot: number };

/** Web-Mercator world position in px at a zoom (512px tiles, like MapLibre). */
export function mercatorPx(lng: number, lat: number, zoom: number) {
  const world = 512 * Math.pow(2, zoom);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * world,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world,
  };
}

export function computeClusters(
  points: ClusterPoint[],
  zoom: number,
  collidePx: number,
): { placements: Map<string, Placement>; stacks: PinStack[] } {
  const px = points.map((p) => mercatorPx(p.lng, p.lat, zoom));
  const dist = (a: number, b: number) =>
    Math.hypot(px[a].x - px[b].x, px[a].y - px[b].y);

  // Union-find over colliding pairs.
  const parent = points.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (dist(i, j) < collidePx) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, number[]>();
  points.forEach((_, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) g.push(i);
    else groups.set(root, [i]);
  });

  const placements = new Map<string, Placement>();
  const stacks: PinStack[] = [];

  for (const idxs of groups.values()) {
    if (idxs.length === 1) {
      placements.set(points[idxs[0]].id, { mode: "full" });
      continue;
    }
    const byPriority = [...idxs].sort(
      (a, b) => points[b].priority - points[a].priority,
    );
    const winner = byPriority[0];
    const kind = points[winner].kind;
    // The winner's kind bunches into a stack; the other kind demotes to dots.
    const kin = byPriority.filter((i) => points[i].kind === kind);

    if (kin.length >= 2) {
      const center = {
        lng: kin.reduce((s, i) => s + points[i].lng, 0) / kin.length,
        lat: kin.reduce((s, i) => s + points[i].lat, 0) / kin.length,
      };
      let minPairPx = Infinity;
      for (let a = 0; a < kin.length; a++) {
        for (let b = a + 1; b < kin.length; b++) {
          minPairPx = Math.min(minPairPx, dist(kin[a], kin[b]));
        }
      }
      const stack: PinStack = {
        id: points[winner].id,
        kind,
        center,
        members: kin.map((i) => points[i].id),
        minPairPx,
      };
      stacks.push(stack);
      kin.forEach((i, slot) =>
        placements.set(points[i].id, { mode: "stack", stack, slot }),
      );
      for (const i of idxs) {
        if (points[i].kind !== kind)
          placements.set(points[i].id, { mode: "dot" });
      }
    } else {
      // A lone winner among the other kind: full tile, everyone else dots.
      for (const i of idxs) {
        placements.set(points[i].id, { mode: i === winner ? "full" : "dot" });
      }
    }
  }
  return { placements, stacks };
}
