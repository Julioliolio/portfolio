/**
 * The generalized filter model — ONE chip type for everything that narrows the
 * map and the search list. Chips come from two places and are indistinguishable
 * afterwards: the user tapping the manual palette (categories + days), and the
 * mock-AI minting chips from a natural-language query (vibes + whatever else it
 * read). Removing a chip widens the results again, wherever it came from.
 *
 * Matching semantics: AND across kinds, OR within a kind. "drinks + music +
 * today" means (drinks OR music) AND today — pick more categories to see more,
 * stack different kinds to narrow.
 */
import { CATEGORIES, type CategoryId } from '../theme/categories';
import { DAY_BUCKETS, type DayBucket } from './days';
import { VIBES, type VibeId } from './vibes';

export type FilterChip =
  | { kind: 'cat'; id: CategoryId }
  | { kind: 'day'; id: DayBucket }
  | { kind: 'vibe'; id: VibeId };

/** Stable identity for dedup/removal ("cat:drinks", "vibe:sunny"…). */
export const chipKey = (c: FilterChip) => `${c.kind}:${c.id}`;

/** What a chip shows: vibes get an emoji, categories keep their glyph. */
export function chipLabel(c: FilterChip): string {
  if (c.kind === 'cat') return CATEGORIES[c.id].label;
  if (c.kind === 'day') return DAY_BUCKETS[c.id].label;
  return VIBES[c.id].label;
}
export function chipEmoji(c: FilterChip): string | null {
  return c.kind === 'vibe' ? VIBES[c.id].emoji : null;
}

/** Everything a filterable thing (list row, map pin) is known to be. */
export type FilterFacts = {
  cats: ReadonlySet<CategoryId>;
  vibes: ReadonlySet<VibeId>;
  days: ReadonlySet<DayBucket>;
};

/** AND across kinds, OR within a kind. No chips = everything matches. */
export function matchesFilters(facts: FilterFacts, chips: readonly FilterChip[]): boolean {
  const want: Record<FilterChip['kind'], string[]> = { cat: [], day: [], vibe: [] };
  for (const c of chips) want[c.kind].push(c.id);
  return (
    (want.cat.length === 0 || want.cat.some((id) => facts.cats.has(id as CategoryId))) &&
    (want.day.length === 0 || want.day.some((id) => facts.days.has(id as DayBucket))) &&
    (want.vibe.length === 0 || want.vibe.some((id) => facts.vibes.has(id as VibeId)))
  );
}

/** The always-available palette the user can tap by hand (in row order). */
export const MANUAL_CHIPS: FilterChip[] = [
  { kind: 'day', id: 'today' },
  { kind: 'day', id: 'tomorrow' },
  { kind: 'day', id: 'weekend' },
  ...(Object.keys(CATEGORIES) as CategoryId[]).map(
    (id): FilterChip => ({ kind: 'cat', id }),
  ),
];
