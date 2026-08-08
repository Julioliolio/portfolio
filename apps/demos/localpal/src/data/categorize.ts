/**
 * Category tagging — the ONE place free-text mock data (venue categories, plan
 * titles/blurbs) is mapped onto the five activity categories (see
 * theme/categories). Shared by:
 *   - the search sheet (per-event/plan chip filtering — see search/corpus),
 *   - the map (hiding pins that don't match the active chips),
 *   - the mock-AI query reading (search/smartSearch tags what the user typed).
 *
 * Keeping it here means a venue/plan lands in the same categories everywhere —
 * a chip you filter by and a pin you hide always agree.
 */
import type { CategoryId } from '../theme/categories';
import { figmaIcons } from '../components/icons/figmaIcons';
import type { Venue } from './venues';
import type { PeerPlan } from './peerPlans';

// The Figma glyph each category's pins wear on the map — the SAME icon the
// bubble for that category shows, so a "Drinks" blob and the cocktail pins it
// filters to read as the same thing. (Single source of truth for both.)
export const CATEGORY_PIN_ICON: Record<CategoryId, string> = {
  drinks: figmaIcons.cocktail,
  music: figmaIcons.music,
  sports: figmaIcons.bouldering,
  food: figmaIcons.utensils,
  coffee: figmaIcons.coffee,
};

// Inverse: a venue's map icon IS its type, so it maps 1:1 to a category. The
// museum glyph is culture — none of the five activity categories — so those
// pins carry no category (they hide under any filter, which is correct).
const ICON_CATEGORY: Record<string, CategoryId> = {
  [figmaIcons.cocktail]: 'drinks',
  [figmaIcons.music]: 'music',
  [figmaIcons.bouldering]: 'sports',
  [figmaIcons.utensils]: 'food',
  [figmaIcons.coffee]: 'coffee',
};

// Keyword tags per category — an item matches a category if any keyword appears
// in its text blob (see `tagCategories`). A venue/plan can carry several (Rita's
// is drinks + music).
export const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  drinks: ['cocktail', 'wine', 'vermut', 'vermouth', 'bar', 'drinks', 'gin', 'martini', 'spritz', 'beer', 'caña', 'pub', 'pre-drink', 'nightcap', 'terraza', 'terrace', 'rooftop'],
  music: ['music', 'jazz', 'band', 'vinyl', 'punk', 'folk', 'indie', 'dj', 'acoustic', 'gig', 'showcase', 'flamenco', 'concert', 'open mic', 'soul', 'funk', 'disco', 'session', 'ballroom', 'club'],
  sports: ['climb', 'boulder', 'run', 'padel', 'basketball', 'football', 'five-a-side', 'yoga', 'skate', 'boat', 'pedal', 'row', 'pool', 'send', 'match', 'gym'],
  food: ['food', 'tapas', 'tapeo', 'dinner', 'brunch', 'ramen', 'burger', 'eats', 'market', 'churros', 'picnic', 'pastry', 'patisserie', 'cheese', 'merienda', 'crawl', 'restaurant'],
  coffee: ['coffee', 'café', 'cafe', 'brew', 'latte', 'cupping', 'espresso', 'sketch', 'roastery'],
};

const ALL_CATEGORY_IDS = Object.keys(CATEGORY_KEYWORDS) as CategoryId[];

// Match keywords as WHOLE WORDS (letters on either side disqualify), with a
// tolerant trailing "s" for plurals. Substring matching silently mis-fired —
// 'gin' inside "San Ginés", 'run' inside "brunch", 'row' inside "crowd" — which
// dragged pins into the wrong category. `\p{L}` boundaries (Unicode, so accents
// like é count as letters) fix it. `g`-flagged variant is for counting hits.
// Exported so the search vibes (src/search/vibes.ts) match with the same rules.
export function buildMatcher(words: string[], flags: string): RegExp {
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<!\\p{L})(?:${esc.join('|')})s?(?!\\p{L})`, flags);
}
const MATCHERS = Object.fromEntries(
  ALL_CATEGORY_IDS.map((id) => [id, buildMatcher(CATEGORY_KEYWORDS[id], 'iu')]),
) as Record<CategoryId, RegExp>;
const MATCHERS_G = Object.fromEntries(
  ALL_CATEGORY_IDS.map((id) => [id, buildMatcher(CATEGORY_KEYWORDS[id], 'giu')]),
) as Record<CategoryId, RegExp>;

export function tagCategories(text: string): Set<CategoryId> {
  const tags = new Set<CategoryId>();
  for (const id of ALL_CATEGORY_IDS) {
    if (MATCHERS[id].test(text)) tags.add(id);
  }
  return tags;
}

// Tie-break order when a plan's text hits several categories — most specific
// first, so the broad "drinks" ('bar', 'terrace'…) only wins when it clearly
// dominates. A pin gets exactly ONE category so filtering prunes cleanly.
const PRIMARY_ORDER: CategoryId[] = ['sports', 'coffee', 'food', 'music', 'drinks'];

/** A venue pin's single category — read straight off the icon it wears. */
export function venuePrimaryCategory(v: Venue): CategoryId | null {
  return ICON_CATEGORY[v.icon] ?? null;
}

/** A peer plan's single category — the strongest keyword match on its text. */
export function planPrimaryCategory(p: PeerPlan): CategoryId | null {
  const blob = `${p.title} ${p.description}`.toLowerCase();
  let best: CategoryId | null = null;
  let bestScore = 0;
  for (const id of PRIMARY_ORDER) {
    const score = blob.match(MATCHERS_G[id])?.length ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

