/**
 * Vibe vocabulary — the mock-AI's understanding of moods. A vibe has two
 * keyword lists matched with the same whole-word rules as categories
 * (`buildMatcher` from data/categorize):
 *
 *  - `itemWords` run against an item's text (title + description + venue) to
 *    decide which vibes an event/plan CARRIES ("terrace" → sunny).
 *  - `queryWords` run against what the user TYPED to decide which vibes they
 *    are asking for ("in the sun" → sunny).
 *
 * The two lists differ on purpose: nobody writes "sunny" in an event blurb and
 * nobody types "terraza" when describing a mood. Time-of-day words the user
 * types (tonight, this weekend) become DAY chips, not vibes — see smartSearch.
 */
import { buildMatcher } from '../data/categorize';

export type VibeId =
  | 'sunny'
  | 'fun'
  | 'chill'
  | 'meetPeople'
  | 'active'
  | 'morning'
  | 'free';

export type Vibe = {
  id: VibeId;
  label: string;
  emoji: string;
  itemWords: string[];
  queryWords: string[];
};

export const VIBES: Record<VibeId, Vibe> = {
  sunny: {
    id: 'sunny',
    label: 'Sunny',
    emoji: '☀️',
    itemWords: ['terrace', 'terraza', 'rooftop', 'picnic', 'park', 'sunset', 'sunrise', 'golden hour', 'lake', 'boat', 'boats', 'río', 'rio', 'outdoor', 'grass', 'plaza', 'pool', 'walk', 'wander', 'garden', 'sunscreen'],
    queryWords: ['sun', 'sunny', 'sunshine', 'outside', 'outdoor', 'outdoors', 'fresh air', 'terrace', 'terraza', 'rooftop', 'park', 'picnic', 'open air'],
  },
  fun: {
    id: 'fun',
    label: 'Fun',
    emoji: '🎉',
    itemWords: ['party', 'afterparty', 'dance', 'dancing', 'disco', 'funk', 'dj', 'karaoke', 'games', 'game', 'bet', 'frisbee', 'crawl', 'club', 'gig', 'jam', 'night out', 'festival', 'match-day'],
    queryWords: ['fun', 'party', 'parties', 'wild', 'dance', 'dancing', 'celebrate', 'night out', 'crazy', 'exciting'],
  },
  chill: {
    id: 'chill',
    label: 'Chill',
    emoji: '🌿',
    itemWords: ['nap', 'slow', 'casual', 'low-key', 'lazy', 'easy', 'quiet', 'blanket', 'no rush', 'zero plans', 'no pressure', 'come and go', 'mellow', 'browse'],
    queryWords: ['chill', 'chilled', 'relax', 'relaxed', 'relaxing', 'calm', 'quiet', 'cozy', 'easy', 'slow', 'laid-back', 'lowkey', 'low-key', 'mellow', 'unwind'],
  },
  meetPeople: {
    id: 'meetPeople',
    label: 'Meet people',
    emoji: '👋',
    itemWords: ['come say hi', 'join', 'welcome', 'everyone', 'all levels', 'all paces', 'newcomers', 'intercambio', 'crew', 'group', 'meetup', 'need bodies', 'need four more', 'making mistakes out loud', 'be there or be square', 'real crowd'],
    queryWords: ['meet', 'people', 'friends', 'new people', 'social', 'strangers', 'company', 'alone', 'crowd', 'locals'],
  },
  active: {
    id: 'active',
    label: 'Active',
    emoji: '💪',
    itemWords: ['run', '5k', '6k', '8k', 'climb', 'boulder', 'bouldering', 'yoga', 'skate', 'padel', 'football', 'five-a-side', 'basketball', 'match', 'pedal', 'row', 'rowboat', 'gym', 'court', 'courts', 'trainers'],
    queryWords: ['active', 'sporty', 'sport', 'sports', 'workout', 'exercise', 'move', 'moving', 'sweat', 'run', 'running', 'fit'],
  },
  morning: {
    id: 'morning',
    label: 'Morning',
    emoji: '🌅',
    itemWords: ['morning', 'brunch', 'breakfast', 'sunrise', 'city wakes up', 'before it gets hot'],
    queryWords: ['morning', 'brunch', 'breakfast', 'early', 'sunrise'],
  },
  free: {
    id: 'free',
    label: 'Free',
    emoji: '🆓',
    itemWords: ['free', 'no cover', 'donation', 'cheap', 'cash and low expectations', 'buy nothing'],
    queryWords: ['free', 'cheap', 'budget', 'broke', 'affordable', 'no money', "doesn't cost", 'inexpensive'],
  },
};

export const ALL_VIBE_IDS = Object.keys(VIBES) as VibeId[];

const ITEM_MATCHERS = Object.fromEntries(
  ALL_VIBE_IDS.map((id) => [id, buildMatcher(VIBES[id].itemWords, 'iu')]),
) as Record<VibeId, RegExp>;
const QUERY_MATCHERS = Object.fromEntries(
  ALL_VIBE_IDS.map((id) => [id, buildMatcher(VIBES[id].queryWords, 'iu')]),
) as Record<VibeId, RegExp>;

/** Vibes an event/plan carries, from its text blob. */
export function tagItemVibes(text: string): Set<VibeId> {
  const tags = new Set<VibeId>();
  for (const id of ALL_VIBE_IDS) {
    if (ITEM_MATCHERS[id].test(text)) tags.add(id);
  }
  return tags;
}

/** Vibes the user asked for, from their typed query. */
export function tagQueryVibes(query: string): Set<VibeId> {
  const tags = new Set<VibeId>();
  for (const id of ALL_VIBE_IDS) {
    if (QUERY_MATCHERS[id].test(query)) tags.add(id);
  }
  return tags;
}
