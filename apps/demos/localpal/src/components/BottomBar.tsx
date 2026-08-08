import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { getSvgPath } from 'figma-squircle';
import { Squircle } from './Squircle';
import { useSquircle } from './SquircleProvider';
import { useMotion, usePressFeedback } from './MotionProvider';
import { SearchSheet } from './SearchSheet';
import { VenueSheet } from './VenueSheet';
import { ActivitySheet, ACTIVITY, ACTIVITY_BOTTOM, type ActivityView } from './ActivitySheet';
import { PlansSheet, PLANS } from './PlansSheet';
import { CreatePlanSheet, CREATE, CREATE_BOTTOM, type CreatePlanResult } from './CreatePlanSheet';
import { CtaRow, type CtaView } from './CtaRow';
import { useDragDismiss, DismissScrim } from './sheetDismiss';
import { useConfirm } from './ConfirmProvider';
import { SearchGlyph } from './icons/SearchGlyph';
import { CrossIcon } from './icons/CrossIcon';
import { figmaIcons } from './icons/figmaIcons';
import { color, font } from '../theme/tokens';
import { layerZoomStyle } from '../theme/motion';
import type { FilterChip } from '../search/filters';
import { classifyQuery } from '../search/smartSearch';
import type { Venue, VenueId } from '../data/venues';
import type { PeerPlan } from '../data/peerPlans';
import type { PersonId } from '../data/people';

import chatGlyph from '../assets/map/chat-glyph.png';
import { LocateIcon } from './icons/LocateIcon';
import CalendarGlyph from './CalendarGlyph';

/**
 * The morphing bottom bar. "One-screen" pattern built from TWO persistent
 * squircle surfaces, each morphing between its own resting shapes:
 *
 *   MAIN surface (rests as the search pill):
 *     pill  ──tap──▶  search sheet (smart bar + chips + list)
 *       ├──────────── tap a venue pin ──────────▶  venue sheet
 *       └─ tap a peer pin ─▶  activity sheet  ◀─ tap a venue event ─┘
 *
 *   PLANS surface (rests as the calendar button):
 *     calendar button ──tap──▶ "Your plans" sheet ──tap a plan──▶ activity card
 *
 * The main surface's geometry is composed from `p` (pill ⇄ search sheet), `v`
 * (⇄ venue) and `a` (⇄ activity); the plans surface's
 * from `pl` (calendar ⇄ plans sheet) and `pa` (plans sheet ⇄ activity card).
 * BOTH reshape through the SAME activity-card geometry, so a plan tapped on the
 * plans sheet morphs into its activity exactly like a venue event does on the
 * main surface — activities just route to whichever surface they were opened
 * from (`activityFromPlans`). All geometry recomputes the superellipse
 * clip-path each frame, so every surface is a true squircle at rest and while
 * morphing. Drag the handle down to step back; tap the map to dismiss.
 *
 * Venue/activity modes swallow the search states: opening either also drops
 * `open`, so the surface morphs straight from wherever it is.
 *
 * The activity sheet is an inset floating card holding its own content STACK
 * (venue activity card → going-together list → peer card — see ActivitySheet).
 * The stack lives in MapHome, because peer pins on the map push onto it too;
 * with `a` up, the venue layer beneath stays mounted, so popping the last
 * entry morphs back onto the venue sheet (or the pill) it came from.
 *
 * The search field is the smart bar — it anchors the sheet top and autofocuses
 * as the pill opens, so the keyboard rises with the morph.
 */

// Resting search pill and the sheet sizes (Figma 1277:3477 / 1277:3310). The
// venue sheet is full-bleed and runs ~56px past the screen bottom (852) so its
// bottom corners never show.
const PILL = { x: 64.2, y: 734, w: 186.15, h: 70.01 };
const TEXT = { x: 15.83, y: 127.22, w: 362, h: 697 };
const VENUE = { x: 0, y: 243.89, w: 393, h: 663.6 };
// The calendar button — resting shape of the SECOND morphing surface, which
// grows into the full-bleed "Your plans" sheet (see PLANS in PlansSheet).
// Exported so the first-plan tour can anchor its coach bubble to it.
export const CAL = { x: 258.35, y: 734, w: 70.44, h: 70.38 };

// Sheet content, positioned relative to the sheet origin.
const grabber = { x: 154.5, y: 7.38, w: 53, h: 4 };
const field = { x: 17.82, y: 23.38, w: 326.36, h: 48.31 };
// Open, the field narrows to make room for the close (×) button on the
// right (Figma 1348:947: 306px field + × inside a 326px row).
const FIELD_OPEN_W = 306.36;

// Content-layer swaps ride the shared hierarchical zoom (theme/motion
// `layerZoomStyle`): wall-clock CSS on purpose — rAF-driven motion values
// freeze mid-flight in throttled/background tabs (headless screenshots!),
// which could leave a stale layer painted over the new one. Hierarchy here:
// search sheet < venue < activity.

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function BottomBar({
  venue = null,
  onCloseVenue,
  activityStack = [],
  onActivityPush,
  onActivityPop,
  onActivityClose,
  onSearchEvent,
  onSearchPeer,
  onLocate,
  cameraCentered = false,
  createFrom = null,
  onOpenCreate,
  onCloseCreate,
  onConfirmCreate,
  onGoToCreatedPlan,
  onOpenProfile,
  onPlansOpened,
  autoOpenPlans = false,
  onOpenMessages,
  onEnterGroupChat,
  filters,
  onFiltersChange,
  suppressed = false,
  scriptedSearchOpen,
}: {
  /** Selected venue — non-null morphs the surface into the venue sheet. */
  venue?: Venue | null;
  onCloseVenue?: () => void;
  /** Activity navigation stack — non-empty morphs into the activity sheet. */
  activityStack?: ActivityView[];
  onActivityPush?: (view: ActivityView) => void;
  /** Step back one activity level (drag handle / × on the going list). */
  onActivityPop?: () => void;
  /** Drop the whole stack (map tap). */
  onActivityClose?: () => void;
  /** Search-list row taps — open the item's card AND fly/focus its map pin. */
  onSearchEvent?: (venueId: VenueId, eventId: string) => void;
  onSearchPeer?: (plan: PeerPlan) => void;
  /** Recenter the map on the user's location (the locate button). */
  onLocate?: () => void;
  /** True when the camera already sits on the user's blue dot — the locate
   *  button hides itself (nothing to recenter). */
  cameraCentered?: boolean;
  /** The create-plan flow — non-null morphs the owning surface into the
   *  wizard card: 'venue' grows it out of the venue sheet (main surface,
   *  location pre-filled), 'plans' out of the plans sheet, 'profile' from
   *  scratch (the profile's "Create a plan" CTA, no venue pre-filled — grows
   *  straight out of the resting pill). State lives in MapHome because
   *  confirming mints a map pin. */
  createFrom?: 'venue' | 'plans' | 'profile' | null;
  onOpenCreate?: (from: 'venue' | 'plans' | 'profile') => void;
  onCloseCreate?: () => void;
  /** "Create plan" confirmed — MapHome mints the pin + plans entry. */
  onConfirmCreate?: (r: CreatePlanResult) => void;
  /** "Go to your plan" on the success card. */
  onGoToCreatedPlan?: () => void;
  /** Host avatars on activity cards open that person's profile. */
  onOpenProfile?: (id: PersonId) => void;
  /** The calendar button was tapped (plans sheet opening) — the first-plan
   *  tour uses this to retire its "your plans live here" bubble. */
  onPlansOpened?: () => void;
  /** Demo launcher: open the "Your plans" sheet on mount (the "day of the
   *  plan" jump — pair with PlansProvider dayOf for the RSVP slider). */
  autoOpenPlans?: boolean;
  /** The round chat button was tapped — open the full-screen Messages flow. */
  onOpenMessages?: () => void;
  /** "Enter groupchat" on a joined plan — open that plan's group thread. */
  onEnterGroupChat?: (plan: PeerPlan) => void;
  /** Active filter chips (manual + AI-minted, one model). CONTROLLED by the
   *  map so the selection persists after the sheet closes and can filter the
   *  map pins (see MapHome). */
  filters: FilterChip[];
  onFiltersChange: (chips: FilterChip[]) => void;
  /** Route-map mode owns the screen — hide ALL resting chrome while true. */
  suppressed?: boolean;
  /** Capture stages (?capture) script the pill ⇄ sheet morph from outside:
   *  each change drives the search open state; user taps still work between
   *  scripted beats. Leave undefined everywhere else. */
  scriptedSearchOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (scriptedSearchOpen !== undefined) setOpen(scriptedSearchOpen);
  }, [scriptedSearchOpen]);
  const [query, setQuery] = useState('');
  // Bumped on Enter — tells the sheet to run the mock-AI on the current query.
  const [submitTick, setSubmitTick] = useState(0);
  // Keyboard focus on the smart bar — the sheet shows its one suggestion chip.
  const [fieldFocused, setFieldFocused] = useState(false);
  // "Your plans" — the SECOND morphing surface (calendar button ⇄ plans sheet
  // ⇄ the activity card of a plan you tapped). Tapping a plan MORPHS the sheet
  // straight into the activity card (same morph as venue → activity), with the
  // plans sheet staying its parent underneath; the back arrow morphs it back.
  const [plansOpen, setPlansOpen] = useState(false);
  // Demo launcher: cold-open the "Your plans" sheet on mount (day-of jump).
  useEffect(() => {
    if (autoOpenPlans) {
      setPlansOpen(true);
      onPlansOpened?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Whether the live activity was opened FROM the plans sheet — routes it to
  // the plans surface (this second one) instead of the main surface.
  const [activityFromPlans, setActivityFromPlans] = useState(false);
  const venueOpen = venue != null;
  const activityOpen = activityStack.length > 0;
  // Create-plan flow: which surface hosts the wizard card — 'venue' morphs it
  // out of the venue sheet (main surface), 'plans' out of the plans sheet.
  const createOpen = createFrom != null;
  // 'venue' and 'profile' both host the wizard on the MAIN surface (the resting
  // pill), so they share the same morph clock; 'plans' hosts it in the plans sheet.
  const mainCreateOpen = createFrom === 'venue' || createFrom === 'profile';
  const plansCreateOpen = createFrom === 'plans';
  // Keep the last host rendered while the close-morph fades the layer out,
  // and remount the sheet per session so a fresh flow starts a fresh draft.
  const [displayCreateFrom, setDisplayCreateFrom] = useState<'venue' | 'plans' | 'profile' | null>(null);
  const [createSession, setCreateSession] = useState(0);
  useEffect(() => {
    if (createFrom) {
      setDisplayCreateFrom(createFrom);
      setCreateSession((s) => s + 1);
    }
  }, [createFrom]);
  // Activity routing: from a plan → the plans surface; from a pin/venue → the
  // main surface. `plansFlow` = the plans surface owns the screen right now.
  const plansActivityOpen = activityOpen && activityFromPlans;
  const pinActivityOpen = activityOpen && !activityFromPlans;
  const plansFlow = plansOpen || plansActivityOpen;
  // Keep the last venue rendered while the close-morph fades the layer out.
  const [displayVenue, setDisplayVenue] = useState<Venue | null>(null);
  useEffect(() => {
    if (venue) setDisplayVenue(venue);
  }, [venue]);
  // Same for the activity stack: the sheet keeps its last content while closing.
  const [displayStack, setDisplayStack] = useState<ActivityView[]>([]);
  useEffect(() => {
    if (activityStack.length > 0) setDisplayStack(activityStack);
  }, [activityStack]);
  // Which surface renders the activity — kept while it closes so the fade-out
  // stays on the surface it grew from.
  const [displayFromPlans, setDisplayFromPlans] = useState(false);
  useEffect(() => {
    if (activityStack.length > 0) setDisplayFromPlans(activityFromPlans);
  }, [activityStack, activityFromPlans]);
  // The persistent CTA row mirrors whichever state is on top (activity view
  // wins over the venue sheet); while everything closes it keeps the last
  // shown state so the fade-out doesn't flash a different label.
  const [ctaView, setCtaView] = useState<CtaView | null>(null);
  useEffect(() => {
    if (activityStack.length > 0) setCtaView(activityStack[activityStack.length - 1]);
    else if (venueOpen) setCtaView({ kind: 'venue' });
  }, [activityStack, venueOpen]);
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const btn = useSquircle('button');
  const sheet = useSquircle('sheet');
  const morph = useMotion('morph');
  const entrance = useMotion('entrance');
  const snap = useMotion('snap');
  const press = usePressFeedback();

  // p: pill ⇄ search sheet. v: anything ⇄ venue.
  // a: anything ⇄ activity sheet (outermost — it can open over the venue).
  const p = useMotionValue(0);
  const v = useMotionValue(0);
  const a = useMotionValue(0);
  // Live target height of the activity sheet — the sheet measures its content
  // and reports it here, so the surface sizes to the content (short cards
  // shrink instead of leaving blank space). Only affects the `a` portion.
  const activityH = useMotionValue(ACTIVITY.h);
  const onActivityHeight = useCallback(
    (h: number) => {
      animate(activityH, h, morph);
    },
    [activityH, morph],
  );
  useEffect(() => {
    const c = animate(p, open ? 1 : 0, morph);
    return () => c.stop();
  }, [open, p, morph]);
  useEffect(() => {
    const c = animate(v, venueOpen ? 1 : 0, morph);
    return () => c.stop();
  }, [venueOpen, v, morph]);
  useEffect(() => {
    const c = animate(a, pinActivityOpen ? 1 : 0, morph);
    return () => c.stop();
  }, [pinActivityOpen, a, morph]);
  // cr: anything ⇄ the create-plan card, on whichever surface hosts it. The
  // card is bottom-anchored like the activity sheet and sizes to the active
  // step's measured height (`createH`), so the tall venue-search step is just
  // a taller morph of the same surface.
  const cr = useMotionValue(0); // main surface: venue sheet ⇄ create card
  const pcr = useMotionValue(0); // plans surface: plans sheet ⇄ create card
  const createH = useMotionValue(CREATE.h);
  const onCreateHeight = useCallback(
    (h: number) => {
      // First report of a fresh session lands before the card is visible —
      // snap straight there so the entrance morph starts from the real shape.
      if (cr.get() < 0.01 && pcr.get() < 0.01) createH.set(h);
      else animate(createH, h, morph);
    },
    [createH, cr, pcr, morph],
  );
  useEffect(() => {
    const c = animate(cr, mainCreateOpen ? 1 : 0, morph);
    return () => c.stop();
  }, [mainCreateOpen, cr, morph]);
  useEffect(() => {
    const c = animate(pcr, plansCreateOpen ? 1 : 0, morph);
    return () => c.stop();
  }, [plansCreateOpen, pcr, morph]);
  // Closing the sheet clears the query so the list is fresh on the next open
  // (the chips persist — they keep filtering the map, badged on the pill).
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);
  // The smart bar autofocuses as the pill opens — it IS a search bar, the
  // keyboard should rise with the morph. (rAF so the input is interactable.)
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);
  // Venue/activity modes swallow the search sheet: `p` collapses alongside the
  // rising value, so mid-morph blends stay smooth and closing lands on the pill.
  useEffect(() => {
    if (venueOpen || activityOpen) setOpen(false);
  }, [venueOpen, activityOpen]);
  // A from-scratch profile create owns a CLEAN main surface — it grows straight
  // out of the resting pill with nothing behind it. Clear any lingering search
  // sheet / plans flow so their content doesn't paint through the (transparent)
  // composer, and so backing out lands on the pill rather than the search sheet.
  useEffect(() => {
    if (createFrom === 'profile') {
      setOpen(false);
      setPlansOpen(false);
    }
  }, [createFrom]);
  // A venue sheet replaces the plans flow outright (a pin tapped in the map
  // strip above it) — no return trip.
  useEffect(() => {
    if (venueOpen) setPlansOpen(false);
  }, [venueOpen]);
  // Reset the "opened from plans" flag once its activity fully closes, so a
  // later pin activity routes to the MAIN surface, not the plans one.
  useEffect(() => {
    if (!activityOpen) setActivityFromPlans(false);
  }, [activityOpen]);

  // The plans surface carries — exactly like the main one carries pill → venue
  // → activity —  calendar button ─pl→ plans sheet ─pa→ activity card. So
  // tapping a plan MORPHS the sheet down into the activity card (the same
  // venue → activity morph), and the back arrow morphs it right back.
  const pl = useMotionValue(0); // calendar ⇄ plans sheet
  const pa = useMotionValue(0); // plans sheet ⇄ activity card
  useEffect(() => {
    const c = animate(pl, plansOpen ? 1 : 0, morph);
    return () => c.stop();
  }, [plansOpen, pl, morph]);
  useEffect(() => {
    const c = animate(pa, plansActivityOpen ? 1 : 0, morph);
    return () => c.stop();
  }, [plansActivityOpen, pa, morph]);
  const plLeft = useTransform([pl, pa, pcr], ([pp, aa, cc]) =>
    lerp(lerp(lerp(CAL.x, PLANS.x, pp as number), ACTIVITY.x, aa as number), CREATE.x, cc as number));
  const plTop = useTransform([pl, pa, pcr, activityH, createH], ([pp, aa, cc, ah, ch]) =>
    lerp(lerp(lerp(CAL.y, PLANS.y, pp as number), ACTIVITY_BOTTOM - (ah as number), aa as number), CREATE_BOTTOM - (ch as number), cc as number));
  const plWidth = useTransform([pl, pa, pcr], ([pp, aa, cc]) =>
    lerp(lerp(lerp(CAL.w, PLANS.w, pp as number), ACTIVITY.w, aa as number), CREATE.w, cc as number));
  const plHeight = useTransform([pl, pa, pcr, activityH, createH], ([pp, aa, cc, ah, ch]) =>
    lerp(lerp(lerp(CAL.h, PLANS.h, pp as number), ah as number, aa as number), ch as number, cc as number));
  const plRadius = useTransform([pl, pa], ([pp, aa]) =>
    lerp(lerp(btn.radius, sheet.radius, pp as number), sheet.radius, aa as number));
  const plSmooth = useTransform([pl, pa], ([pp, aa]) =>
    lerp(lerp(btn.smoothing, sheet.smoothing, pp as number), sheet.smoothing, aa as number));
  const plClipPath = useTransform([plWidth, plHeight, plRadius, plSmooth], ([w, h, r, s]) =>
    `path('${getSvgPath({ width: w as number, height: h as number, cornerRadius: r as number, cornerSmoothing: s as number })}')`,
  );
  const calGlyphOpacity = useTransform(pl, (val) => Math.max(0, 1 - val / 0.35));

  // Plans-sheet ⇄ activity-card content crossfade, driven by `pa` (the SAME
  // spring that reshapes the surface) — NOT a fixed-duration CSS fade. A fixed
  // fade lets the fast geometry spring outrun it, flashing a blank full-screen
  // sheet on the way back before its content appears; frame-locking to `pa`
  // keeps the content painted exactly in step with the reshape, both ways.
  // `plGate` also fades the sheet in over the calendar-button → sheet morph.
  const plGate = useTransform(pl, [0.35, 1], [0, 1]); // calendar → sheet
  const paCross = useTransform(pa, [0.15, 0.85], [0, 1]); // sheet → card (overlapped)
  const pcrCross = useTransform(pcr, [0.15, 0.85], [0, 1]); // sheet → create card
  // Whichever card is rising out of the plans sheet (activity or create)
  // pushes the sheet content away the same way.
  const plansAway = useTransform([paCross, pcrCross], ([aa, cc]) => Math.max(aa as number, cc as number));
  const plansContentOpacity = useTransform(
    [plGate, plansAway],
    ([g, c]) => (g as number) * (1 - (c as number)),
  );
  const plansContentScale = useTransform(plansAway, (c) => 1 + 0.06 * (c as number)); // zooms past
  const plansContentBlur = useTransform(plansAway, (c) => `blur(${6 * (c as number)}px)`);
  const activityContentScale = useTransform(paCross, (c) => 0.92 + 0.08 * (c as number)); // grows in
  const activityContentBlur = useTransform(paCross, (c) => `blur(${6 * (1 - (c as number))}px)`);
  const createContentScale = useTransform(pcrCross, (c) => 0.92 + 0.08 * (c as number)); // grows in
  const createContentBlur = useTransform(pcrCross, (c) => `blur(${6 * (1 - (c as number))}px)`);

  // Drag-to-close from the plans sheet's handle zone.
  const { dragY: plansDragY, handleProps: plansHandle } = useDragDismiss({
    onDismiss: () => setPlansOpen(false),
    threshold: 70,
    cancelTransition: snap,
  });

  // Tapping a plan MORPHS the plans sheet into the activity card (the sheet
  // stays open underneath as the activity's parent, like the venue sheet is
  // for pin activities); the back arrow / handle morphs it right back.
  const openFromPlans = (view: ActivityView) => {
    setActivityFromPlans(true);
    onActivityPush?.(view);
  };

  // Geometry composed from all progress values:
  // ((pill → search sheet → venue) → activity) → create card.
  const left = useTransform([p, v, a, cr], ([pp, vv, aa, cc]) =>
    lerp(lerp(lerp(lerp(PILL.x, TEXT.x, pp as number), VENUE.x, vv as number), ACTIVITY.x, aa as number), CREATE.x, cc as number));
  // Activity/create tops follow their measured heights so the sheet stays
  // glued to its bottom edge — short views shrink upward, no gap above the
  // home indicator.
  const top = useTransform([p, v, a, cr, activityH, createH], ([pp, vv, aa, cc, ah, ch]) =>
    lerp(lerp(lerp(lerp(PILL.y, TEXT.y, pp as number), VENUE.y, vv as number), ACTIVITY_BOTTOM - (ah as number), aa as number), CREATE_BOTTOM - (ch as number), cc as number));
  const width = useTransform([p, v, a, cr], ([pp, vv, aa, cc]) =>
    lerp(lerp(lerp(lerp(PILL.w, TEXT.w, pp as number), VENUE.w, vv as number), ACTIVITY.w, aa as number), CREATE.w, cc as number));
  const height = useTransform([p, v, a, cr, activityH, createH], ([pp, vv, aa, cc, ah, ch]) =>
    lerp(lerp(lerp(lerp(PILL.h, TEXT.h, pp as number), VENUE.h, vv as number), ah as number, aa as number), ch as number, cc as number));
  const radius = useTransform([p, v, a], ([pp, vv, aa]) =>
    lerp(lerp(lerp(btn.radius, sheet.radius, pp as number), sheet.radius, vv as number), sheet.radius, aa as number));
  const smooth = useTransform([p, v, a], ([pp, vv, aa]) =>
    lerp(lerp(lerp(btn.smoothing, sheet.smoothing, pp as number), sheet.smoothing, vv as number), sheet.smoothing, aa as number));
  const clipPath = useTransform([width, height, radius, smooth], ([w, h, r, s]) =>
    `path('${getSvgPath({ width: w as number, height: h as number, cornerRadius: r as number, cornerSmoothing: s as number })}')`,
  );

  const magnifierOpacity = useTransform([p, v, a, cr], ([pp, vv, aa, cc]) =>
    Math.max(0, 1 - (pp as number) / 0.35) *
    Math.max(0, 1 - (vv as number) / 0.35) *
    Math.max(0, 1 - (aa as number) / 0.35) *
    Math.max(0, 1 - (cc as number) / 0.35));
  const contentOpacity = useTransform(p, [0.35, 1], [0, 1]);
  // Field narrows and the × fades in as the sheet opens.
  const fieldWidth = useTransform(p, [0, 1], [field.w, FIELD_OPEN_W]);
  // The sparkle flags a query the mock-AI will take (a sentence, not a term).
  const naturalQuery = open && query.trim() !== '' && classifyQuery(query.trim()) === 'natural';

  // Drag-to-step-back, ONLY from the handle zone (not the whole sheet). Here
  // "dismiss" means one level back: activity → venue → pill (shared gesture).
  const { dragY, handleProps: mainHandle } = useDragDismiss({
    onDismiss: () => {
      if (activityOpen) onActivityPop?.(); // activity → one level back (… → venue/pill)
      else if (venueOpen) onCloseVenue?.(); // venue → pill
      else setOpen(false); // search sheet → pill
    },
    threshold: 70,
    cancelTransition: snap,
  });

  return (
    <>
      {/* Tap the map to dismiss (shared with every sheet). */}
      <DismissScrim
        active={!suppressed && (open || venueOpen || activityOpen || plansOpen || createOpen)}
        zIndex={15}
        onTapThrough={(x, y) => {
          // Map pins win over dismiss: forward a tap that lands on a pin (sheet
          // → venue morphs directly, venue → venue switches, peer → peer card).
          // Not mid-create though — a wizard in progress dismisses plainly.
          if (createOpen) return false;
          const pin = document
            .elementsFromPoint(x, y)
            .find((el): el is HTMLElement => el instanceof HTMLElement && el.dataset.mapPin != null);
          if (pin) {
            pin.click();
            return true;
          }
          return false;
        }}
        onDismiss={() => {
          // Tap the map = dismiss everything back to the resting shapes.
          if (createOpen) onCloseCreate?.();
          if (activityOpen) onActivityClose?.();
          if (venueOpen) onCloseVenue?.();
          if (plansOpen) setPlansOpen(false);
          if (!activityOpen && !venueOpen && !plansOpen && !createOpen) setOpen(false);
        }}
      />

      {/* Resting nav (side circles) — animate away when open. */}
      <AnimatePresence>
        {!suppressed && !open && !venueOpen && !activityOpen && !plansOpen && !createOpen && (
          <>
            <motion.button
              key="chat"
              aria-label="Messages"
              onClick={onOpenMessages}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={entrance}
              {...press}
              style={{ position: 'absolute', left: 24.22, top: 676.88, zIndex: 16, filter: 'drop-shadow(0 2px 6px rgba(0,29,51,0.16))' }}
            >
              <Squircle role="control" fill="#fff" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
                <img src={chatGlyph} width={20} height={20} alt="" />
              </Squircle>
            </motion.button>
            {!cameraCentered && (
              <motion.button
                key="locate"
                aria-label="Locate me"
                onClick={onLocate}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={entrance}
                whileTap={{ ...press.whileTap, rotate: 90 }}
                style={{ position: 'absolute', left: 329, top: 676.88, zIndex: 16, filter: 'drop-shadow(0 2px 6px rgba(0,29,51,0.16))' }}
              >
                <Squircle role="control" fill="#fff" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
                  <LocateIcon size={22} />
                </Squircle>
              </motion.button>
            )}
          </>
        )}
      </AnimatePresence>

      {/* SECOND morphing surface: calendar button ⇄ "Your plans" sheet ⇄ the
          activity card of a tapped plan. Tapping a plan MORPHS the sheet down
          into the activity card (the venue → activity morph, but out of the
          plans surface); the back arrow / handle morphs it back. It stays
          mounted through that whole flow — only the search / venue / pin-
          activity states send it away as the calendar button (slide/pop). */}
      <AnimatePresence>
        {!suppressed && ((!open && !venueOpen && !activityOpen && !createOpen) || plansFlow) && (
          <motion.div
            key="plans"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.4, opacity: 0, x: -90 }}
            transition={entrance}
            whileTap={plansFlow ? undefined : press.whileTap}
            onClick={() => {
              if (!plansFlow) {
                setPlansOpen(true);
                onPlansOpened?.();
              }
            }}
            style={{
              position: 'absolute',
              left: plLeft,
              top: plTop,
              y: plansDragY,
              width: plWidth,
              height: plHeight,
              clipPath: plClipPath,
              background: color.brand,
              zIndex: 19, // under the main surface (venue/pin activity morph on top)
              cursor: plansFlow ? 'default' : 'pointer',
              // Don't let the fading calendar button catch taps as it slides
              // away behind an opening search / venue / pin-activity.
              pointerEvents: plansFlow ? undefined : open || venueOpen || activityOpen || createOpen ? 'none' : undefined,
            }}
          >
            {/* Drag zone, plans level only. Reaches down through the big "Your
                plans" title (non-interactive) to just above the focused card, so
                the grab target is the whole header band rather than a thin strip. */}
            {plansOpen && !plansActivityOpen && !plansCreateOpen && (
              <div
                {...plansHandle}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 66, cursor: 'grab', touchAction: 'none', zIndex: 6 }}
              />
            )}

            {/* Resting content: the calendar glyph */}
            <motion.div
              style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: calGlyphOpacity, pointerEvents: 'none' }}
            >
              <CalendarGlyph width={27} height={33} />
            </motion.div>

            {/* Plans-sheet content — the PARENT the activity morphs out of.
                Its crossfade + zoom rides `pa` (the reshape spring), so it
                stays painted in step with the surface instead of a late fade. */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: plansContentOpacity,
                scale: plansContentScale,
                filter: plansContentBlur,
                pointerEvents: plansOpen && !plansActivityOpen && !plansCreateOpen ? undefined : 'none',
              }}
            >
              <PlansSheet
                onOpenPlan={(plan) => openFromPlans({ kind: 'peer', plan })}
                onOpenEvent={(venueId, eventId) => openFromPlans({ kind: 'event', venueId, eventId })}
                onPropose={() => onOpenCreate?.('plans')}
              />
            </motion.div>

            {/* Activity card grown from a plan — the same ActivitySheet the
                main surface uses, morphing out of the plans sheet. Grows in on
                the same `pa` clock (mirror of the plans layer above). */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: paCross,
                scale: activityContentScale,
                filter: activityContentBlur,
                pointerEvents: plansActivityOpen ? 'auto' : 'none',
              }}
            >
              {displayFromPlans && displayStack.length > 0 && (
                <ActivitySheet
                  stack={activityOpen ? activityStack : displayStack}
                  onPush={(view) => onActivityPush?.(view)}
                  onHeight={onActivityHeight}
                  onOpenProfile={onOpenProfile}
                />
              )}
            </motion.div>

            {/* Create-plan card grown from "Propose a plan" — same wizard the
                main surface hosts, morphing out of the plans sheet on the
                `pcr` clock (mirror of the activity layer above). */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: pcrCross,
                scale: createContentScale,
                filter: createContentBlur,
                pointerEvents: plansCreateOpen ? 'auto' : 'none',
              }}
            >
              {displayCreateFrom === 'plans' && (
                <CreatePlanSheet
                  key={`create-${createSession}`}
                  onHeight={onCreateHeight}
                  onExit={() => onCloseCreate?.()}
                  onConfirm={(r) => onConfirmCreate?.(r)}
                  onGoToPlan={() => {
                    // The plan card opens on the MAIN surface — drop the
                    // plans sheet so it isn't left painted underneath.
                    setPlansOpen(false);
                    onGoToCreatedPlan?.();
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Morphing squircle surface: pill <-> bubble/text <-> venue <-> activity.
          While the plans sheet is up with nothing above it, the resting pill
          shrinks away (it would paint over the full-bleed sheet); it springs
          back as an activity/venue morph rises on top. */}
      <motion.div
        onClick={() => !open && !venueOpen && !activityOpen && !plansFlow && !createOpen && setOpen(true)}
        whileTap={open || venueOpen || activityOpen || plansFlow || createOpen ? undefined : press.whileTap}
        initial={false}
        animate={{ opacity: plansFlow || suppressed ? 0 : 1, scale: plansFlow || suppressed ? 0.5 : 1 }}
        transition={morph}
        style={{
          position: 'absolute',
          left,
          top,
          y: dragY,
          width,
          height,
          clipPath,
          background: color.brand,
          zIndex: 20,
          cursor: open || venueOpen || activityOpen || createOpen ? 'default' : 'pointer',
          pointerEvents: plansFlow || suppressed ? 'none' : undefined,
        }}
      >
        {/* Drag zone. The band reaches as far down as the header stays
            non-interactive, so the grab target is generous without eating taps:
            in venue mode the whole title block down to the category icon is fair
            game (right edge inset to clear the bookmark button); the activity
            card has a grabber pad above its content; search keeps a thin strip
            because the field sits right under the pill. */}
        {(open || venueOpen || activityOpen) && (
          <div
            {...mainHandle}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: venueOpen ? 64 : 0,
              height: venueOpen ? 88 : activityOpen ? 40 : 22,
              cursor: 'grab',
              touchAction: 'none',
              zIndex: 6,
            }}
          />
        )}

        {/* Pill content: magnifier */}
        <motion.div
          style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: magnifierOpacity, pointerEvents: 'none' }}
        >
          <SearchGlyph size={33} />
        </motion.div>

        {/* Filter badge on the resting pill — the chips PERSIST after the
            sheet closes and keep the map filtered, so the pill flags how many
            are active (tap the pill to reopen + adjust). Fades with
            the magnifier as the pill morphs into the sheet. */}
        {filters.length > 0 && (
          <motion.div
            style={{
              position: 'absolute',
              top: 14,
              right: 18,
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: 11,
              background: color.lavender,
              color: color.brand,
              display: 'grid',
              placeItems: 'center',
              fontFamily: font.family,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1,
              opacity: magnifierOpacity,
              pointerEvents: 'none',
            }}
          >
            {filters.length}
          </motion.div>
        )}

        {/* Shared search-sheet content (fades in with the sheet). Pointer-dead
            in venue/activity mode — it's opacity-0 then, but the invisible
            field would still catch clicks over the sheet content. */}
        <motion.div
          style={{ position: 'absolute', inset: 0, opacity: contentOpacity, pointerEvents: venueOpen || activityOpen || createOpen ? 'none' : undefined }}
        >
          {/* grabber handle */}
          <Squircle
            radius={2}
            smoothing={1}
            fill="#fefefe"
            style={{ position: 'absolute', left: grabber.x, top: grabber.y, width: grabber.w, height: grabber.h }}
          />

          {/* The unified search sheet: smart bar results + chips + list. */}
          <SearchSheet
            filters={filters}
            onFiltersChange={onFiltersChange}
            query={query}
            submitTick={submitTick}
            active={open}
            fieldFocused={fieldFocused}
            onAskPrompt={(prompt) => {
              // A suggested prompt fills the field and submits in one tap.
              setQuery(prompt);
              setSubmitTick((t) => t + 1);
            }}
            onOpenEvent={onSearchEvent}
            onOpenPlan={onSearchPeer}
          />

          {/* Search field — the smart bar, anchored above the sheet content.
              Narrows as the sheet opens (motion width) to make room for the ×. */}
          <motion.div
            style={{
              position: 'absolute',
              left: field.x,
              top: field.y,
              width: fieldWidth,
              height: field.h,
              zIndex: 4,
            }}
          >
            <Squircle
              role="field"
              fill={color.brandDeep}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 4, // Figma: 4px between magnifier and text
                padding: '0 16px',
                cursor: 'text',
              }}
            >
              <img src={figmaIcons.search} alt="" width={14} height={14} style={{ display: 'block', flexShrink: 0 }} />
              <input
                ref={inputRef}
                className="lp-search-input"
                placeholder="Search or describe your plan..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFieldFocused(true)}
                onBlur={() => setFieldFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim() !== '') {
                    setSubmitTick((t) => t + 1);
                    inputRef.current?.blur(); // keyboard down, results visible
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: 16,
                  fontWeight: 400, // Figma: PP Neue Montreal Regular
                }}
              />
              {/* Sparkle: this query reads as a sentence — the AI will take it. */}
              <motion.img
                src={figmaIcons.shootingStar}
                alt=""
                initial={false}
                animate={{ opacity: naturalQuery ? 1 : 0, scale: naturalQuery ? 1 : 0.6 }}
                transition={snap}
                style={{ width: 15, height: 15, display: 'block', flexShrink: 0 }}
              />
            </Squircle>
          </motion.div>

          {/* Close (×) to the right of the search bar — clears the query first,
              then closes the sheet. */}
          <button
            aria-label={query !== '' ? 'Clear search' : 'Close search'}
            onClick={() => {
              if (query !== '') {
                setQuery('');
                // Drop the AI's reading too (its vibe chips) — hand-picked
                // category/day chips survive.
                if (filters.some((c) => c.kind === 'vibe'))
                  onFiltersChange(filters.filter((c) => c.kind !== 'vibe'));
              } else {
                setOpen(false);
              }
            }}
            style={{
              position: 'absolute',
              left: 322,
              top: field.y + field.h / 2 - 15,
              width: 30,
              height: 30,
              display: 'grid',
              placeItems: 'center',
              background: 'transparent',
              border: 'none',
              padding: 0,
              // inherit when active — an explicit 'auto' would poke through
              // the search wrapper's 'none' in venue/activity mode.
              pointerEvents: open ? undefined : 'none',
              cursor: 'pointer',
              zIndex: 4,
              ...layerZoomStyle(open, 'child'),
            }}
          >
            {/* THE cross glyph (wedge-star), springing in with a rotate+scale
                on the snap role — the elastic "morph in" without a fake × shape. */}
            <motion.span
              animate={{ rotate: open ? 0 : -90, scale: open ? 1 : 0.4 }}
              transition={snap}
              style={{ display: 'grid', placeItems: 'center' }}
            >
              <CrossIcon size={12} color={color.lavender} />
            </motion.span>
          </button>
        </motion.div>

        {/* Venue-detail state (fades IN as the surface grows full-bleed).
            Stays mounted under an open activity so popping back lands on it. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: venueOpen && !activityOpen && !mainCreateOpen ? 'auto' : 'none',
            // Hidden under an open activity or create card it's the PARENT
            // you zoomed through; hidden while collapsing to the pill it's
            // the child shrinking back into it.
            ...layerZoomStyle(
              venueOpen && !activityOpen && !mainCreateOpen,
              activityOpen || mainCreateOpen ? 'parent' : 'child',
            ),
          }}
        >
          {/* Keyed so switching venue (or reopening) remounts with the list
              scrolled back to the top. */}
          {displayVenue && (
            <VenueSheet
              key={venue?.id ?? 'closing'}
              venue={displayVenue}
              onEventTap={(ev) =>
                onActivityPush?.({ kind: 'event', venueId: displayVenue.id, eventId: ev.id })
              }
            />
          )}
        </div>

        {/* Activity state — the inset floating card with its own content stack.
            Only PIN/venue activities live here; plan activities morph out of
            the plans surface above. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: pinActivityOpen ? 'auto' : 'none',
            ...layerZoomStyle(pinActivityOpen, 'child'),
          }}
        >
          {!displayFromPlans && displayStack.length > 0 && (
            <ActivitySheet
              stack={activityOpen ? activityStack : displayStack}
              onPush={(view) => onActivityPush?.(view)}
              onHeight={onActivityHeight}
              onOpenProfile={onOpenProfile}
            />
          )}
        </div>

        {/* Create-plan card grown from the venue sheet's "Create plan" CTA —
            the venue stays mounted underneath as its parent, so backing out
            of step 1 morphs right back onto it. Keyed per session so a fresh
            flow starts a fresh draft (leaving discards it). */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: mainCreateOpen ? 'auto' : 'none',
            ...layerZoomStyle(mainCreateOpen, 'child'),
          }}
        >
          {(displayCreateFrom === 'venue' || displayCreateFrom === 'profile') && (
            <CreatePlanSheet
              key={`create-${createSession}`}
              initialVenue={displayCreateFrom === 'venue' ? (venue ?? displayVenue) : undefined}
              onHeight={onCreateHeight}
              onExit={() => onCloseCreate?.()}
              onConfirm={(r) => onConfirmCreate?.(r)}
              onGoToPlan={() => onGoToCreatedPlan?.()}
            />
          )}
        </div>
      </motion.div>

      {/* THE persistent CTA row — a sibling of the surface, so it survives
          every layer swap across the whole venue → activity flow. */}
      <CtaRow
        view={ctaView}
        visible={(venueOpen || activityOpen) && !createOpen}
        onSmall={() => (activityOpen ? onActivityPop?.() : onCloseVenue?.())}
        onMain={(kind) => {
          if (kind === 'venue') {
            onOpenCreate?.('venue');
            return;
          }
          // "Enter groupchat" on the join confirmation → open that plan's
          // group thread in the Messages flow.
          if (kind === 'joined') {
            const top = activityStack[activityStack.length - 1];
            if (top?.kind === 'joined') onEnterGroupChat?.(top.plan);
            return;
          }
          // "Create a plan" off the going list → start a fresh plan from
          // scratch: drop the activity stack and grow the from-scratch
          // composer out of the pill (same path as the profile CTA).
          if (kind === 'going') {
            onActivityClose?.();
            onOpenCreate?.('profile');
            return;
          }
          // Join → confirm first ("are you sure?"), then morph on confirm.
          if (kind === 'peer') {
            const top = activityStack[activityStack.length - 1];
            if (top?.kind === 'peer') {
              const plan = top.plan;
              confirm({ title: 'Join this plan?', subtitle: plan.title, confirmLabel: 'Join plan' }).then(
                (ok) => {
                  if (ok) onActivityPush?.({ kind: 'joined', plan });
                },
              );
            }
          }
        }}
        dragY={dragY}
      />
    </>
  );
}
