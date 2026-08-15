/**
 * Onboarding interests — the expanded set behind "What are you into?".
 * Wider than the 5 map categories on purpose (Bump-style picking): each
 * interest optionally points at a parent map category (`cat`, for future
 * map filtering) and at the pin the guided first moment spotlights
 * (`spot` — the camera lands there after onboarding, Giulia-storyboard
 * style). Bubble poses live here too so the picker stays registry-driven.
 */
import type { CategoryId } from "./categories";

export type InterestId =
  | "drinks"
  | "livemusic"
  | "climbing"
  | "running"
  | "football"
  | "yoga"
  | "tapas"
  | "coffee"
  | "museums"
  | "photography"
  | "books"
  | "thrifting";

export type Interest = {
  id: InterestId;
  label: string;
  /** Parent map category, where one exists (future map filtering). */
  cat: CategoryId | null;
  /** Pin the guided first moment flies to: a venue or a peer plan. */
  spot: { kind: "venue" | "peer"; id: string } | null;
  /** Bubble pose in the picker field (px, field-relative). */
  pose: { cx: number; cy: number; r: number };
};

/** Picker field size the poses are laid out in (px). Sized to the packed
 *  cluster below so it sits directly under the title, no dead space. */
export const INTEREST_FIELD = { w: 340, h: 353 };

// Poses are a solved tight packing — every bubble kisses a neighbour at
// ~0.9*(rA+rB) centre distance. That sits just ABOVE the soft-collision
// threshold in InterestBubbles (0.88), so at rest the sim is dormant and the
// cluster settles still (no churn) yet everything is touching. A tap inflates
// the bubble's radius + kicks it, which momentarily crosses the threshold and
// ripples through the cluster — the signature bouncy-bubble feel.
// (Coordinates from scratchpad/pack.mjs; re-run it if you retune the radii.)
export const INTERESTS: Interest[] = [
  {
    id: "drinks",
    label: "Drinks",
    cat: "drinks",
    spot: { kind: "peer", id: "mp-crawl" },
    pose: { cx: 114, cy: 60, r: 54 },
  },
  {
    id: "livemusic",
    label: "Live music",
    cat: "music",
    spot: { kind: "peer", id: "mp-jazzbar" },
    pose: { cx: 210, cy: 92, r: 47 },
  },
  {
    id: "tapas",
    label: "Tapas",
    cat: "food",
    spot: { kind: "peer", id: "mp-tapas-latina" },
    pose: { cx: 287, cy: 140, r: 48 },
  },
  {
    id: "climbing",
    label: "Climbing",
    cat: "sports",
    spot: { kind: "venue", id: "uadibloc" },
    pose: { cx: 59, cy: 144, r: 51 },
  },
  {
    id: "coffee",
    label: "Coffee",
    cat: "coffee",
    spot: { kind: "venue", id: "comercial" },
    pose: { cx: 145, cy: 140, r: 41 },
  },
  {
    id: "running",
    label: "Running",
    cat: "sports",
    spot: { kind: "peer", id: "mp-runriver" },
    pose: { cx: 214, cy: 176, r: 43 },
  },
  {
    id: "football",
    label: "Football",
    cat: "sports",
    spot: { kind: "peer", id: "mp-football" },
    pose: { cx: 47, cy: 232, r: 42 },
  },
  {
    id: "yoga",
    label: "Yoga",
    cat: "sports",
    spot: { kind: "peer", id: "mp-yoga" },
    pose: { cx: 115, cy: 204, r: 37 },
  },
  {
    id: "museums",
    label: "Museums",
    cat: null,
    spot: { kind: "peer", id: "mp-museum" },
    pose: { cx: 251, cy: 254, r: 47 },
  },
  {
    id: "photography",
    label: "Photo walks",
    cat: null,
    spot: { kind: "peer", id: "mp-rastro" },
    pose: { cx: 111, cy: 282, r: 45 },
  },
  {
    id: "books",
    label: "Books",
    cat: null,
    spot: { kind: "peer", id: "mp-bookclub" },
    pose: { cx: 174, cy: 237, r: 36 },
  },
  {
    id: "thrifting",
    label: "Thrifting",
    cat: null,
    spot: { kind: "peer", id: "mp-thrift" },
    pose: { cx: 188, cy: 307, r: 40 },
  },
];

export const INTEREST_MIN = 3;

/** First selected interest that has a spotlight target (insertion order). */
export function pickSpotlight(selected: InterestId[]): Interest | null {
  for (const id of selected) {
    const it = INTERESTS.find((i) => i.id === id);
    if (it?.spot) return it;
  }
  return null;
}
