/**
 * Which activity STICKER (the tilted badge on a peer pin's corner) a
 * peer-proposed plan wears. Peer plans have no explicit category, so we infer
 * one from the plan's title + description using keyword tags, then map that to a
 * Figma badge glyph.
 *
 * Kept independent of the 5-way `CategoryId` used by the activity-picker bubbles
 * (theme/categories.ts) on purpose: the map badges cover a WIDER set (adds
 * `culture`) and must not add a bubble to the picker. If a plan matches nothing,
 * it falls back to the neutral shooting-star ("a plan") rather than a wrong
 * category — that's better than pretending every plan is drinks.
 *
 * Badge art is the white-line / blue-fill Figma export set in icons/figmaIcons.
 */
import { figmaIcons } from "../components/icons/figmaIcons";

export type StickerCat =
  "coffee" | "culture" | "music" | "sports" | "food" | "drinks";

// Badge glyph per sticker category.
export const STICKER_BADGE: Record<StickerCat, string> = {
  coffee: figmaIcons.coffee,
  culture: figmaIcons.museum,
  music: figmaIcons.music,
  sports: figmaIcons.bouldering,
  food: figmaIcons.utensils,
  drinks: figmaIcons.cocktail,
};

/** Neutral badge for plans that don't map onto any category. */
export const NEUTRAL_STICKER = figmaIcons.shootingStar;

// Order matters: the FIRST category whose keyword appears wins, so the list runs
// primary-activity → incidental. `coffee` and `drinks` come LAST on purpose:
// they tag along with almost everything ("coffee at the end", "beers before"),
// so a plan that's really a run, a gig or a museum trip should keep its own
// sticker instead of collapsing to a cup or a cocktail. A plan whose ONLY signal
// is coffee/drinks (a café hang, a rooftop terraza) still lands there correctly.
const STICKER_KEYWORDS: [StickerCat, string[]][] = [
  [
    "culture",
    [
      "museum",
      "museo",
      "reina sofía",
      "guernica",
      "gallery",
      "galería",
      "art walk",
      "open-studios",
      "studio",
      "exhibition",
      "design market",
      "matadero",
      "film",
      "screening",
      "cinema",
      "book",
      "books",
      "reading",
      "sketchbook",
    ],
  ],
  [
    "music",
    [
      "music",
      "jazz",
      "band",
      "bands",
      "vinyl",
      "punk",
      "folk",
      "indie",
      "dj",
      "acoustic",
      "gig",
      "showcase",
      "flamenco",
      "concert",
      "open mic",
      "soul",
      "funk",
      "jam",
      "session",
      "trio",
    ],
  ],
  [
    "sports",
    [
      "climb",
      "boulder",
      "send",
      "run",
      "running",
      "padel",
      "basketball",
      "football",
      "five-a-side",
      "yoga",
      "skate",
      "boat",
      "boats",
      "pedal",
      "row",
      "pool",
      "match",
      "jog",
    ],
  ],
  [
    "food",
    [
      "food",
      "tapas",
      "tapeo",
      "tapa",
      "dinner",
      "brunch",
      "ramen",
      "burger",
      "burgers",
      "eats",
      "market",
      "churros",
      "picnic",
      "cheese",
      "street food",
      "pancakes",
    ],
  ],
  [
    "coffee",
    [
      "coffee",
      "café",
      "cafe",
      "brew",
      "latte",
      "flat white",
      "cupping",
      "espresso",
      "sketch",
    ],
  ],
  [
    "drinks",
    [
      "cocktail",
      "wine",
      "vermut",
      "vermouth",
      "bar",
      "drink",
      "drinks",
      "gin",
      "martini",
      "spritz",
      "beer",
      "beers",
      "caña",
      "cañas",
      "pub",
      "pre-drink",
      "nightcap",
      "crawl",
      "terraza",
      "rooftop",
    ],
  ],
];

// Whole-word match (Unicode-aware, so "café"/"caña" work): the keyword must be
// bounded by non-letters or string ends. Substring matching would misfire —
// "book" inside "booked", "run" inside "brunch", "bar" inside "Barajas" — and
// silently drag plans into the wrong category.
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (blob: string, kw: string) =>
  new RegExp(`(^|[^\\p{L}])${esc(kw)}([^\\p{L}]|$)`, "iu").test(blob);

/** Best-guess sticker badge for a peer plan, from its title + description. */
export function peerSticker(text: string): string {
  const blob = text.toLowerCase();
  for (const [cat, keywords] of STICKER_KEYWORDS) {
    if (keywords.some((kw) => hasWord(blob, kw))) return STICKER_BADGE[cat];
  }
  return NEUTRAL_STICKER;
}
