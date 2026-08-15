/**
 * The search corpus — every searchable thing, built once from the SAME mock
 * data as the map/venue/plans sheets (`VENUES` events + standalone
 * `MAP_PEER_PLANS`), so a search row opens the exact activity card its map pin
 * would. Each item is enriched at build time with the facts the filter chips
 * check: categories (keyword-tagged), vibes (see search/vibes) and a day
 * bucket.
 *
 * Also exports per-PIN facts (`VENUE_FILTER_FACTS`, `planFilterFacts`) so the
 * map and the list agree on what a chip hides: a venue pin survives a day chip
 * if ANY of its events fall in that bucket.
 */
import { figmaIcons } from "../components/icons/figmaIcons";
import type { CategoryId } from "../theme/categories";
import {
  tagCategories,
  venuePrimaryCategory,
  planPrimaryCategory,
} from "../data/categorize";
import { VENUES, dayLabel, type VenueId } from "../data/venues";
import { MAP_PEER_PLANS, type PeerPlan } from "../data/peerPlans";
import { tagItemVibes, type VibeId } from "./vibes";
import { bucketVenueDay, bucketWhen, hourOf, type DayBucket } from "./days";
import type { FilterFacts } from "./filters";

// Card leading icon heights, keyed by the Figma SVG the venue pin uses (the
// playful tilt is baked into the exports). Icons keep their natural widths, so
// text left-edges are ragged per row, exactly like the design.
const ICON_H: Record<string, number> = {
  [figmaIcons.cocktail]: 34,
  [figmaIcons.bouldering]: 38,
  [figmaIcons.utensils]: 32,
  [figmaIcons.music]: 34,
  [figmaIcons.coffee]: 32,
  [figmaIcons.museum]: 28,
};

// A searchable row: a venue event (glyph tile → opens its activity card) or a
// standalone peer plan (avatar tile → opens its peer card). `cats`/`vibes`/
// `day` drive chip filtering, `search` the typed-text filter.
export type SearchItem = {
  id: string;
  title: string;
  meta: string;
  cats: Set<CategoryId>;
  vibes: Set<VibeId>;
  day: DayBucket | null;
  search: string;
} & (
  | {
      kind: "event";
      icon: string;
      iconH: number;
      venueId: VenueId;
      eventId: string;
    }
  | { kind: "peer"; plan: PeerPlan }
);

// A morning vibe you can't read from words alone: anything starting before
// noon IS a morning plan, whatever the blurb says.
const withMorning = (vibes: Set<VibeId>, timeText: string): Set<VibeId> => {
  const h = hourOf(timeText);
  if (h != null && h < 12) vibes.add("morning");
  return vibes;
};

// Every hosted venue event, in venue order.
const EVENT_ITEMS: SearchItem[] = Object.values(VENUES).flatMap((venue) =>
  venue.events.map((ev) => ({
    kind: "event" as const,
    id: `${venue.id}:${ev.id}`,
    title: ev.title,
    meta: `${dayLabel(ev.day)} - ${ev.time}`,
    icon: venue.icon,
    iconH: ICON_H[venue.icon] ?? 32,
    venueId: venue.id,
    eventId: ev.id,
    cats: tagCategories(
      `${ev.title} ${venue.category} ${venue.name} ${ev.description}`,
    ),
    vibes: withMorning(
      tagItemVibes(
        // '$0' is how the data spells "free entry".
        `${ev.title} ${venue.description} ${ev.description} ${ev.price === "$0" || ev.price === "Free" ? "free" : ""}`,
      ),
      ev.time,
    ),
    day: bucketVenueDay(ev.day),
    search: `${ev.title} ${venue.name} ${venue.category}`.toLowerCase(),
  })),
);

// Every standalone peer plan (the peer pins on the map).
const PEER_ITEMS: SearchItem[] = Object.values(MAP_PEER_PLANS).map((plan) => ({
  kind: "peer" as const,
  id: `peer:${plan.id}`,
  title: plan.title,
  meta: plan.when,
  plan,
  cats: tagCategories(`${plan.title} ${plan.description}`),
  vibes: withMorning(
    tagItemVibes(`${plan.title} ${plan.description}`),
    plan.when,
  ),
  day: bucketWhen(plan.when),
  search: `${plan.title} ${plan.host} ${plan.description}`.toLowerCase(),
}));

// Interleave events and peers so the list reads mixed (glyph/avatar rows
// alternating), matching the Figma reference, without losing any items.
export const ALL_ITEMS: SearchItem[] = (() => {
  const out: SearchItem[] = [];
  const max = Math.max(EVENT_ITEMS.length, PEER_ITEMS.length);
  for (let i = 0; i < max; i++) {
    if (i < EVENT_ITEMS.length) out.push(EVENT_ITEMS[i]);
    if (i < PEER_ITEMS.length) out.push(PEER_ITEMS[i]);
  }
  return out;
})();

export const itemFacts = (it: SearchItem): FilterFacts => ({
  cats: it.cats,
  vibes: it.vibes,
  days: it.day ? new Set([it.day]) : new Set(),
});

/**
 * Facts per venue PIN. A pin stands for the whole venue, so it aggregates its
 * events: category from the icon it wears (single, same as before), vibes and
 * day buckets unioned across events — a day chip keeps the pin if ANY event
 * falls in that bucket.
 */
export const VENUE_FILTER_FACTS = Object.fromEntries(
  Object.values(VENUES).map((venue): [VenueId, FilterFacts] => {
    const cat = venuePrimaryCategory(venue);
    const vibes = new Set<VibeId>();
    const days = new Set<DayBucket>();
    for (const ev of venue.events) {
      const evVibes = withMorning(
        tagItemVibes(
          `${ev.title} ${venue.description} ${ev.description} ${ev.price === "$0" || ev.price === "Free" ? "free" : ""}`,
        ),
        ev.time,
      );
      for (const v of evVibes) vibes.add(v);
      const d = bucketVenueDay(ev.day);
      if (d) days.add(d);
    }
    return [venue.id, { cats: new Set(cat ? [cat] : []), vibes, days }];
  }),
) as Record<VenueId, FilterFacts>;

// Peer plans include user-created ones (made at runtime), so facts are
// computed on demand and cached per plan object.
const planFactsCache = new WeakMap<PeerPlan, FilterFacts>();
export function planFilterFacts(plan: PeerPlan): FilterFacts {
  let facts = planFactsCache.get(plan);
  if (!facts) {
    const cat = planPrimaryCategory(plan);
    const day = bucketWhen(plan.when);
    facts = {
      cats: new Set(cat ? [cat] : []),
      vibes: withMorning(
        tagItemVibes(`${plan.title} ${plan.description}`),
        plan.when,
      ),
      days: new Set(day ? [day] : []),
    };
    planFactsCache.set(plan, facts);
  }
  return facts;
}
