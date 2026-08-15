/**
 * The mock "AI" behind the search bar. No model anywhere — a query is read
 * with the same whole-word matchers the rest of the app uses:
 *
 *  1. `classifyQuery` decides if the user typed a KEYWORD ("beer") or a
 *     NATURAL request ("i want to do something fun while in the sun").
 *     Keywords filter instantly; natural queries get the thinking theater.
 *  2. `interpretQuery` turns a natural query into filter CHIPS (vibes, cats,
 *     days — what the AI "understood", shown to the user, removable) plus
 *     RANKED results, each with a one-line why.
 *
 * A few flagship interpretations are hand-curated (`CANNED`, keyed by the chip
 * signature a query extracts, so any phrasing of "fun + sun" hits the curated
 * picks). Everything else runs through the scorer. When nothing scores, a
 * friendly fallback returns the closest today-first items — the AI never comes
 * back empty-handed.
 */
import type { CategoryId } from "../theme/categories";
import { buildMatcher, tagCategories } from "../data/categorize";
import { tagQueryVibes, type VibeId } from "./vibes";
import type { DayBucket } from "./days";
import {
  chipEmoji,
  chipKey,
  chipLabel,
  matchesFilters,
  type FilterChip,
} from "./filters";
import { ALL_ITEMS, itemFacts, type SearchItem } from "./corpus";

export type QueryClass = "keyword" | "natural";

export type SearchResult = { item: SearchItem; why: string };

export type Interpretation = {
  /** What the AI "understood" — lands in the chips row, user-removable. */
  chips: FilterChip[];
  results: SearchResult[];
  /** True when nothing scored and we're showing closest picks instead. */
  fallback: boolean;
};

// ---------------------------------------------------------------------------
// Query reading

// Words that give away a sentence rather than a search term.
const NL_MARKERS = buildMatcher(
  [
    "i",
    "im",
    "i'm",
    "we",
    "me",
    "my",
    "want",
    "wanna",
    "need",
    "feel",
    "feeling",
    "something",
    "somewhere",
    "anything",
    "looking",
    "find",
    "show",
    "where",
    "what",
    "whats",
    "what's",
    "how",
    "with",
    "while",
    "when",
    "plan",
    "plans",
    "vibe",
    "mood",
    "ideas",
    "recommend",
    "suggest",
    "do",
    "go",
    "going",
  ],
  "iu",
);

// Time words in a query become DAY chips (the prototype's "now" is Thursday —
// see search/days). "friday" reads as tomorrow.
const QUERY_DAY_WORDS: [RegExp, DayBucket][] = [
  [buildMatcher(["today", "tonight", "now", "later"], "iu"), "today"],
  [buildMatcher(["tomorrow", "friday"], "iu"), "tomorrow"],
  [buildMatcher(["weekend", "saturday", "sunday"], "iu"), "weekend"],
];

const queryDays = (q: string): DayBucket[] =>
  QUERY_DAY_WORDS.filter(([re]) => re.test(q)).map(([, bucket]) => bucket);

/**
 * Keyword or natural? Sentences (≥4 words) and shorter phrases that carry a
 * sentence marker, a vibe or a day word read as natural. Single words are
 * always keywords here — the sheet promotes a zero-hit keyword to natural on
 * Enter, so nothing dead-ends.
 */
export function classifyQuery(q: string): QueryClass {
  const words = q.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 4) return "natural";
  if (
    words.length >= 2 &&
    (NL_MARKERS.test(q) || tagQueryVibes(q).size > 0 || queryDays(q).length > 0)
  ) {
    return "natural";
  }
  return "keyword";
}

// ---------------------------------------------------------------------------
// Interpretation

/** Chips a query extracts: vibes + categories + days, in that display order. */
function extractChips(q: string): FilterChip[] {
  return [
    ...[...tagQueryVibes(q)].map((id): FilterChip => ({ kind: "vibe", id })),
    ...[...tagCategories(q)].map((id): FilterChip => ({ kind: "cat", id })),
    ...queryDays(q).map((id): FilterChip => ({ kind: "day", id })),
  ];
}

// One why-line voice per tag — two variants each so a results page doesn't
// stutter, picked by a stable hash of the item id.
const VIBE_WHYS: Record<VibeId, [string, string]> = {
  sunny: [
    "Open-air plan — made for a sunny day",
    "Sunshine-friendly: this one happens outside",
  ],
  fun: [
    "High-energy crowd, easy fun",
    "The kind of night that gets out of hand nicely",
  ],
  chill: ["Zero pressure, all mellow", "Slow-paced — come and go as you like"],
  meetPeople: [
    "Easy way to meet new people",
    "Friendly crowd, newcomers welcome",
  ],
  active: ["Gets you moving", "Break a sweat, then celebrate"],
  morning: ["A proper morning plan", "Early start, worth it"],
  free: ["Costs little to nothing to join", "Easy on the wallet"],
};
const CAT_WHYS: Record<CategoryId, string> = {
  drinks: "Good pour, better company",
  music: "Live sound, up close",
  sports: "For the movers",
  food: "Come hungry",
  coffee: "Caffeine with company",
};
const DAY_WHYS: Record<DayBucket, string> = {
  today: "Happening today",
  tomorrow: "Happening tomorrow",
  weekend: "A weekend plan",
};
const FALLBACK_WHY = "Closest match around you — worth a look";

/** The strongest reason this item matched, phrased for its card. `nth` picks
 *  between the two phrasings so neighbouring cards don't stutter. */
function whyLine(item: SearchItem, chips: FilterChip[], nth: number): string {
  const facts = itemFacts(item);
  const vibe = chips.find((c) => c.kind === "vibe" && facts.vibes.has(c.id));
  if (vibe && vibe.kind === "vibe") return VIBE_WHYS[vibe.id][nth % 2];
  const cat = chips.find((c) => c.kind === "cat" && facts.cats.has(c.id));
  if (cat && cat.kind === "cat") return CAT_WHYS[cat.id];
  const day = chips.find((c) => c.kind === "day" && facts.days.has(c.id));
  if (day && day.kind === "day") return DAY_WHYS[day.id];
  return FALLBACK_WHY;
}

// Words too generic to count as evidence when scoring leftovers.
const STOPWORDS = new Set(
  "a an the i im we me my to do in on at of and or for with while want wanna need something somewhere anything is it its this that some go going out get like would love around near nearby".split(
    " ",
  ),
);

/** Score = 3·vibe hits + 2·cat hits + 2·day hit + 1·leftover word hits. */
function scoreItem(
  item: SearchItem,
  chips: FilterChip[],
  leftovers: string[],
): number {
  const facts = itemFacts(item);
  let score = 0;
  for (const c of chips) {
    if (c.kind === "vibe" && facts.vibes.has(c.id)) score += 3;
    if (c.kind === "cat" && facts.cats.has(c.id)) score += 2;
    if (c.kind === "day" && facts.days.has(c.id)) score += 2;
  }
  for (const w of leftovers) if (item.search.includes(w)) score += 1;
  return score;
}

// Query words not consumed by a chip matcher — they still count for +1 as
// plain text evidence ("ramen" in "cheap ramen tonight").
function leftoverWords(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter(
      (w) =>
        w.length >= 3 &&
        !STOPWORDS.has(w) &&
        tagQueryVibes(w).size === 0 &&
        tagCategories(w).size === 0 &&
        queryDays(w).length === 0,
    );
}

const MAX_RESULTS = 8;

// ---------------------------------------------------------------------------
// Canned flagship queries — matched by chip SIGNATURE, so any phrasing that
// extracts the same understanding ("fun in the sun", "sunny and fun plans")
// lands on the curated picks. Everything is validated at module load: an
// unknown id, or a pick that doesn't actually carry the chips it's curated
// for (the live chip filter would silently drop it), throws immediately
// instead of failing quietly at demo time.
type Canned = { chips: FilterChip[]; top: [id: string, why: string][] };

const signature = (chips: FilterChip[]) => chips.map(chipKey).sort().join("|");

const CANNED: Canned[] = [
  {
    chips: [
      { kind: "vibe", id: "sunny" },
      { kind: "vibe", id: "fun" },
    ],
    top: [
      [
        "peer:mp-picnic",
        "Golden hour, blankets and a playlist — sun until it sets",
      ],
      [
        "peer:mp-terraza",
        "A terrace, a spritz and the best of the evening light",
      ],
      ["peer:mp-retiro-row", "Boats on the lake — bring the sunscreen"],
    ],
  },
  {
    chips: [
      { kind: "vibe", id: "meetPeople" },
      { kind: "day", id: "today" },
    ],
    top: [
      ["peer:mp-lluc", "Half the neighbourhood is going — easy to say hi"],
      ["peer:mp-flamenco", "Small tablao, shared plates, real crowd"],
      ["peer:mp-terraza", "Low-key terrace — easy to join, easy to leave"],
    ],
  },
  {
    chips: [
      { kind: "vibe", id: "free" },
      { kind: "day", id: "weekend" },
    ],
    top: [
      ["peer:mp-rastro", "The flea market costs nothing to wander"],
      ["peer:mp-yoga", "Pay-what-you-can sunrise flow"],
      ["peer:mp-matadero", "Browse the makers’ market — buying optional"],
    ],
  },
];

const ITEM_BY_ID = new Map(ALL_ITEMS.map((it) => [it.id, it]));
const CANNED_BY_SIG = new Map(CANNED.map((c) => [signature(c.chips), c]));
for (const canned of CANNED) {
  for (const [id] of canned.top) {
    const item = ITEM_BY_ID.get(id);
    if (!item)
      throw new Error(
        `Canned '${signature(canned.chips)}' references unknown item '${id}'`,
      );
    if (!matchesFilters(itemFacts(item), canned.chips))
      throw new Error(
        `Canned pick '${id}' doesn't carry the chips it's curated for (${signature(canned.chips)}) — extend the vibe vocabulary in search/vibes.ts`,
      );
  }
}

// ---------------------------------------------------------------------------

/** Read a natural query → chips the AI understood + ranked, explained picks. */
export function interpretQuery(q: string): Interpretation {
  const chips = extractChips(q);
  const leftovers = leftoverWords(q);

  const scored = ALL_ITEMS.map((item) => ({
    item,
    score: scoreItem(item, chips, leftovers),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    // Nothing understood — never come back empty. Closest picks, today first.
    const closest = [...ALL_ITEMS]
      .sort((a, b) => Number(b.day === "today") - Number(a.day === "today"))
      .slice(0, 3);
    return {
      chips: [],
      results: closest.map((item) => ({ item, why: FALLBACK_WHY })),
      fallback: true,
    };
  }

  const canned = CANNED_BY_SIG.get(signature(chips));
  const pinned: SearchResult[] = canned
    ? canned.top.map(([id, why]) => ({ item: ITEM_BY_ID.get(id)!, why }))
    : [];
  const pinnedIds = new Set(pinned.map((r) => r.item.id));

  const rest: SearchResult[] = scored
    .filter((s) => !pinnedIds.has(s.item.id))
    .slice(0, MAX_RESULTS - pinned.length)
    .map((s, i) => ({ item: s.item, why: whyLine(s.item, chips, i) }));

  return { chips, results: [...pinned, ...rest], fallback: false };
}

/** Idle-state example prompts — teach that the bar takes full sentences. */
export const SUGGESTED_PROMPTS = [
  "something fun in the sun",
  "meet people tonight",
  "cheap plans this weekend",
  "a chill morning with coffee",
];

/** The staged status lines the thinking theater walks through. */
export function theaterLines(q: string): string[] {
  const chips = extractChips(q);
  const first = chips[0];
  const last = first
    ? `Matching ${chipEmoji(first) ?? ""} ${chipLabel(first).toLowerCase()} plans…`.replace(
        "  ",
        " ",
      )
    : "Picking the closest matches…";
  return ["Reading your vibe…", "Scanning plans nearby…", last];
}
