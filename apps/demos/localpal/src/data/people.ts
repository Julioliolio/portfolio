/**
 * People — the social graph behind the profile flows (Figma 1431:2201 own /
 * 1431:2399 other / 1426:1434 QR). Every profile is derived from the same
 * shape: the TAG on the big card is computed from the person's DONE
 * activities (dominant category → TAG_RULES), never hand-written, so a user
 * who mostly does bar plans reads "Professional pub crawler" and a runner
 * reads "Marathon goblin". `doneVenueIds` doubles as the tag-card ROUTE — the
 * venues (in visit order) the special route-map mode draws when the card is
 * tapped.
 *
 * Profiles are reachable only through real social surface area (no user
 * search): the host row of an activity you're looking at, a row in a friends
 * list, or the in-person QR screen.
 */
import type { VenueId } from './venues';
import { VENUES } from './venues';
import { figmaIcons } from '../components/icons/figmaIcons';
import type { CategoryId } from '../theme/categories';

import perePhoto from '../assets/profile/pere.png';
import evaPhoto from '../assets/profile/eva.jpg';
import friend1 from '../assets/profile/friend-1.png';
import friend2 from '../assets/profile/friend-2.png';
import friend3 from '../assets/profile/friend-3.png';
import person1 from '../assets/people/person-1.png';
import person2 from '../assets/people/person-2.png';
import person3 from '../assets/people/person-3.png';
import mapOwn from '../assets/profile/map-own.png';
import mapEva from '../assets/profile/map-eva.png';
import tagCocktail from '../assets/profile/tag-cocktail.svg';
import tagRunner from '../assets/profile/tag-runner.svg';

export type PersonId = 'pere' | 'eva' | 'martin' | 'giulia' | 'theo' | 'emma' | 'marc' | 'lluc';

export type Person = {
  id: PersonId;
  firstName: string;
  lastName: string;
  photo: string;
  /** The signed-in user (Pere) — drives own-profile vs other-profile copy/CTA. */
  isMe?: boolean;
  /** Their people. Friends-in-common = intersection with ME's list. */
  friends: PersonId[];
  /** Activities done in 2026, in visit order — feeds the tag rule AND the
   *  route the tag card opens on the map. */
  doneVenueIds: VenueId[];
  /** Plans they organized (venue events stand in for them). */
  organized: Array<{ venueId: VenueId; eventId: string }>;
  /** Upcoming joined plans — "Your plans" / "What Eva's up to". */
  upcoming: Array<{ venueId: VenueId; eventId: string }>;
  /** The shareable profile link (the QR encodes https:// + this). */
  link: string;
  /** Map texture behind the tag card (a per-person "their patch of the city"). */
  tagMap: string;
};

/* ------------------------------------------------------------------ */
/* Tag rule: dominant done-activity category → the card's identity      */
/* ------------------------------------------------------------------ */

export type TagRule = {
  /** The two display lines of the tag ("Professional" / "pub crawler"). */
  lines: [string, string];
  /** Big decorative glyph riding the card's top-right corner. */
  glyph: string;
  /** Natural glyph box (px at the Figma 100-ish scale) to keep proportions. */
  glyphSize: { w: number; h: number };
  /** Playful tilt of the big glyph (deg, from Figma). */
  glyphRotate: number;
  /** Small white glyph for the route-mode map pill (figmaIcons style). */
  pillGlyph: string;
  /** Route-mode pill label: "Pere's <routeLabel>". */
  routeLabel: string;
};

// One identity per category. Only drinks + sports have bespoke Figma glyphs;
// the rest borrow the closest activity glyph until they're designed.
export const TAG_RULES: Record<CategoryId, TagRule> = {
  drinks: { lines: ['Professional', 'pub crawler'], glyph: tagCocktail, glyphSize: { w: 100, h: 100 }, glyphRotate: -10, pillGlyph: figmaIcons.cocktail, routeLabel: 'pub crawl' },
  sports: { lines: ['Marathon', 'goblin'], glyph: tagRunner, glyphSize: { w: 106, h: 113 }, glyphRotate: 0, pillGlyph: figmaIcons.bouldering, routeLabel: 'training route' },
  food: { lines: ['Certified', 'food hunter'], glyph: figmaIcons.utensils, glyphSize: { w: 90, h: 90 }, glyphRotate: -8, pillGlyph: figmaIcons.utensils, routeLabel: 'food trail' },
  music: { lines: ['Front-row', 'regular'], glyph: figmaIcons.shootingStar, glyphSize: { w: 90, h: 90 }, glyphRotate: -8, pillGlyph: figmaIcons.shootingStar, routeLabel: 'gig trail' },
  coffee: { lines: ['Espresso', 'evangelist'], glyph: figmaIcons.utensils, glyphSize: { w: 90, h: 90 }, glyphRotate: -8, pillGlyph: figmaIcons.utensils, routeLabel: 'café crawl' },
};

/** A venue's category, inferred from the glyph its pin wears. */
export function venueCategory(venueId: VenueId): CategoryId {
  const icon = VENUES[venueId].icon;
  if (icon === figmaIcons.cocktail) return 'drinks';
  if (icon === figmaIcons.bouldering) return 'sports';
  return 'food';
}

/** Dominant done-category → the person's tag. */
export function personTag(person: Person): TagRule {
  const counts = new Map<CategoryId, number>();
  for (const v of person.doneVenueIds) {
    const c = venueCategory(v);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: CategoryId = 'drinks';
  let bestN = -1;
  for (const [c, n] of counts) {
    if (n > bestN) {
      best = c;
      bestN = n;
    }
  }
  return TAG_RULES[best];
}

/** "12 plans attended in 2026" / "04 plans done in 2026" (zero-padded). */
export function tagCountLine(person: Person): string {
  const n = String(person.doneVenueIds.length).padStart(2, '0');
  return person.isMe ? `${n} plans attended in 2026` : `${n} plans done in 2026`;
}

/* ------------------------------------------------------------------ */
/* The people                                                           */
/* ------------------------------------------------------------------ */

export const ME: PersonId = 'pere';

export const PEOPLE: Record<PersonId, Person> = {
  pere: {
    id: 'pere',
    firstName: 'Pere',
    lastName: 'Vicenç',
    photo: perePhoto,
    isMe: true,
    friends: ['martin', 'giulia', 'theo', 'emma', 'marc', 'lluc'],
    // 12 bar nights in visit order — the "Professional pub crawler" route.
    doneVenueIds: [
      'ritas', 'deldiego', 'salmonguru', 'costello', 'junco', 'macera',
      'angelita', 'riviera', 'caracol', 'wurlitzer', 'bendito', 'salaequis',
    ],
    organized: [
      { venueId: 'ritas', eventId: 'r1' },
      { venueId: 'deldiego', eventId: 'd1' },
      { venueId: 'comercial', eventId: 'co1' },
      { venueId: 'costello', eventId: 'c1' },
    ],
    upcoming: [
      { venueId: 'ritas', eventId: 'r1' },
      { venueId: 'deldiego', eventId: 'd1' },
      { venueId: 'comercial', eventId: 'co1' },
      { venueId: 'molienda', eventId: 'm2' },
      { venueId: 'costello', eventId: 'c1' },
    ],
    link: 'localpal.com/user/ja18hP2aFSXSoR0F',
    tagMap: mapOwn,
  },
  eva: {
    id: 'eva',
    firstName: 'Eva',
    lastName: 'Satorra',
    photo: evaPhoto,
    friends: ['martin', 'giulia', 'theo'],
    // Sports-heavy — the "Marathon goblin" route (04 plans done).
    doneVenueIds: ['uadibloc', 'fabrica', 'molienda', 'junco'],
    organized: [],
    upcoming: [
      { venueId: 'ritas', eventId: 'r1' },
      { venueId: 'molienda', eventId: 'm3' },
      { venueId: 'molienda', eventId: 'm2' },
    ],
    link: 'localpal.com/user/eR2mQx7VbNp4KsL0',
    tagMap: mapEva,
  },
  martin: {
    id: 'martin',
    firstName: 'Martin',
    lastName: 'Roca',
    photo: friend1,
    friends: ['pere', 'eva', 'giulia'],
    doneVenueIds: ['ritas', 'costello', 'wurlitzer', 'salmonguru', 'molienda'],
    organized: [{ venueId: 'ritas', eventId: 'r3' }],
    upcoming: [
      { venueId: 'ritas', eventId: 'r3' },
      { venueId: 'comercial', eventId: 'co1' },
    ],
    link: 'localpal.com/user/mR9tYw2ZaQx6PdN1',
    tagMap: mapEva,
  },
  giulia: {
    id: 'giulia',
    firstName: 'Giulia',
    lastName: 'Moretti',
    photo: friend2,
    friends: ['pere', 'eva', 'martin'],
    doneVenueIds: ['molienda', 'toma', 'federal', 'lacomba', 'ritas'],
    organized: [{ venueId: 'molienda', eventId: 'm1' }],
    upcoming: [
      { venueId: 'molienda', eventId: 'm1' },
      { venueId: 'ritas', eventId: 'r2' },
    ],
    link: 'localpal.com/user/gM4kLp8XcVb2WsJ7',
    tagMap: mapOwn,
  },
  theo: {
    id: 'theo',
    firstName: 'Theo',
    lastName: 'Krüger',
    photo: friend3,
    friends: ['pere', 'eva', 'martin', 'giulia'],
    doneVenueIds: ['uadibloc', 'fabrica', 'ritas'],
    organized: [{ venueId: 'ritas', eventId: 'r1' }],
    upcoming: [{ venueId: 'ritas', eventId: 'r1' }],
    link: 'localpal.com/user/tK6nBv3YdRz9QcM5',
    tagMap: mapEva,
  },
  emma: {
    id: 'emma',
    firstName: 'Emma',
    lastName: 'de Vries',
    photo: person1,
    friends: ['pere'],
    doneVenueIds: ['ritas', 'junco', 'angelita'],
    organized: [{ venueId: 'ritas', eventId: 'r6' }],
    upcoming: [{ venueId: 'ritas', eventId: 'r2' }],
    link: 'localpal.com/user/eV1sHq5TfWm8Jxj3',
    tagMap: mapOwn,
  },
  marc: {
    id: 'marc',
    firstName: 'Marc',
    lastName: 'Serra',
    photo: person2,
    friends: ['pere'],
    doneVenueIds: ['sanfernando', 'florida', 'toma', 'ritas'],
    organized: [{ venueId: 'ritas', eventId: 'r5' }],
    upcoming: [{ venueId: 'ritas', eventId: 'r5' }],
    link: 'localpal.com/user/mS7wDn4UgXk1LzB6',
    tagMap: mapOwn,
  },
  lluc: {
    id: 'lluc',
    firstName: 'Lluc',
    lastName: 'Ferrer',
    photo: person3,
    friends: ['pere'],
    doneVenueIds: ['ritas', 'wurlitzer'],
    organized: [],
    upcoming: [{ venueId: 'ritas', eventId: 'r7' }],
    link: 'localpal.com/user/lF3xCm9RhYv5NqA8',
    tagMap: mapEva,
  },
};

/** Host first name on a peer plan → their profile (if they're a known person). */
export function personByFirstName(name: string): Person | null {
  const lower = name.trim().toLowerCase();
  for (const p of Object.values(PEOPLE)) {
    if (p.firstName.toLowerCase() === lower) return p;
  }
  return null;
}

/** Friends in common with ME (what the other-profile friends card shows). */
export function friendsInCommon(person: Person): Person[] {
  const mine = new Set(PEOPLE[ME].friends);
  return person.friends.filter((f) => mine.has(f) && f !== person.id).map((f) => PEOPLE[f]);
}
