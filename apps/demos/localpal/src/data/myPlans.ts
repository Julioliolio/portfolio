/**
 * Mock data for the "Your plans" sheet (Figma 1384:2240 / 2445 / 2685) — the
 * plans the user has already joined. The FOCUSED plan is the next one up (the
 * big white card); NEXT_UP lists the rest, wired to real venue events so
 * tapping a row opens that event's activity card.
 */
import type { VenueId } from './venues';
import type { PeerPlan } from './peerPlans';

/** The next plan — a peer plan, so tapping the card opens the peer activity
 *  card. Title matches the Figma frame (typo and all — it's the reference). */
export const FOCUSED_PLAN: PeerPlan = {
  id: 'my-pregame',
  title: 'Pregame and dinner before the match beggins',
  host: 'Martin',
  hostLine: 'Local - from Madrid',
  address: 'C. de la Palma, 8, Madrid',
  when: 'Monday - 20:30',
  description:
    'Tortilla, cañas and loud opinions about the starting eleven before we head to the bar with the big screen. Kickoff is at 21:00 — we walk over together.',
  goingNames: 'Giulia, Martin',
  goingCount: 7,
};

export const FOCUSED_META = {
  /** White plate day/time when it's NOT the day of the plan. */
  dayTag: 'MONDAY',
  time: '20:30',
  /** Minutes to kickoff when day-of mode starts — "2:34h left!" (Figma 1384:2768). */
  countdownMinutes: 154,
};

/** "On their way" list shown once you RSVP (Figma 1384:2772). */
export const ON_THEIR_WAY: Array<{ name: string; time: string }> = [
  { name: 'Giulia M.', time: '19:38' },
  { name: 'Martin R.', time: '19:41' },
  { name: 'Theo K.', time: '19:47' },
  { name: 'Emma S.', time: '19:52' },
];
export const ON_THEIR_WAY_COUNT = { going: 6, total: 7 };

/** The rest of the joined plans — real venue events (see data/venues.ts). */
export const NEXT_UP: Array<{ venueId: VenueId; eventId: string }> = [
  { venueId: 'ritas', eventId: 'r1' },
  { venueId: 'deldiego', eventId: 'd1' },
  { venueId: 'comercial', eventId: 'co1' },
  { venueId: 'molienda', eventId: 'm2' },
  { venueId: 'costello', eventId: 'c1' },
];
