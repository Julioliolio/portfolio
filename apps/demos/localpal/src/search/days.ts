/**
 * Day buckets for filtering — the three coarse "when" filters the chips row
 * offers (Today / Tomorrow / Weekend), mapped from the loose day strings the
 * mock data uses.
 *
 * The prototype has a FIXED "now": it's Thursday (`PROTO_TODAY`). Events tagged
 * 'TODAY' are today, 'FRI' is tomorrow, 'SAT'/'SUN' are the weekend. Everything
 * else ('TUE', 'WED', 'THU'…) reads as "sometime next week" and falls in no
 * bucket — a day chip simply hides it, which is correct. No Date math on
 * purpose: the demo must behave identically whatever real day it runs on.
 */
export type DayBucket = 'today' | 'tomorrow' | 'weekend';

export const PROTO_TODAY = 'THU';

export const DAY_BUCKETS: Record<DayBucket, { id: DayBucket; label: string }> = {
  today: { id: 'today', label: 'Today' },
  tomorrow: { id: 'tomorrow', label: 'Tomorrow' },
  weekend: { id: 'weekend', label: 'Weekend' },
};

/** Venue event `day` tag ("TODAY", "FRI"…) → bucket, or null (out of range). */
export function bucketVenueDay(day: string): DayBucket | null {
  switch (day) {
    case 'TODAY':
      return 'today';
    case 'FRI':
      return 'tomorrow';
    case 'SAT':
    case 'SUN':
      return 'weekend';
    default:
      return null;
  }
}

/** Peer plan `when` string ("Today - 20:30", "Friday - 19:00"…) → bucket. */
export function bucketWhen(when: string): DayBucket | null {
  const lead = when.split(/[\s-]/, 1)[0].toLowerCase();
  switch (lead) {
    case 'today':
      return 'today';
    case 'friday':
      return 'tomorrow';
    case 'saturday':
    case 'sunday':
      return 'weekend';
    default:
      return null;
  }
}

/** Hour of a "20:30"-style time, or of the time inside a `when` string. */
export function hourOf(text: string): number | null {
  const m = text.match(/(\d{1,2}):\d{2}/);
  return m ? Number(m[1]) : null;
}
