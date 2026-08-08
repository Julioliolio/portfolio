/**
 * THE persistent CTA row — one piece of chrome that survives the whole
 * venue → activity flow instead of each sheet rebuilding its own buttons:
 *
 *   venue sheet      event card        going list        peer card
 *   Create plan + ×  $8 Get tickets ‹  Create a plan ‹   Join ‹
 *
 * Rendered by BottomBar as a SIBLING of the morphing surface (zIndex 21), so
 * no layer swap ever remounts it. Between states it slides to the active
 * anchor on the `morph` spring, the white plate width and price slot morph,
 * the label scrambles (`snap` timing), and the small square swaps its glyph
 * × (close the venue) ⇄ ‹ (pop one level) with a wall-clock rotate swap.
 * Show/hide is wall-clock CSS (layerZoom tokens) for the usual rAF-throttling
 * reason; only opacity/visibility — transforms stay with framer for the
 * position/drag work.
 */
import { useEffect, useRef, type CSSProperties } from 'react';
import { motion, type MotionValue } from 'framer-motion';
import { Squircle } from './Squircle';
import { useMotion, usePressFeedback } from './MotionProvider';
import { useScramble } from './useScramble';
import { CrossIcon } from './icons/CrossIcon';
import { BackChevron } from './icons/BackChevron';
import { ShareIcon } from './icons/ShareIcon';
import { color } from '../theme/tokens';
import { layerZoom } from '../theme/motion';
import { VENUES } from '../data/venues';
import { VENUE_CTA } from './VenueSheet';
import { ACTIVITY_CTA, type ActivityView } from './ActivitySheet';

/** What the row is currently standing in for. */
export type CtaView = ActivityView | { kind: 'venue' };

const LABELS: Record<CtaView['kind'], string> = {
  venue: 'Create plan',
  event: 'Get tickets',
  going: 'Create a plan',
  peer: 'Join',
  joined: 'Enter groupchat',
};

const SMALL = 64; // the square button (== CTA height)
const GAP = 12;

const buttonReset: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
};

export function CtaRow({
  view,
  visible,
  onSmall,
  onMain,
  dragY,
  showcase = false,
}: {
  /** Active (or last shown, while fading out) state the row reflects. */
  view: CtaView | null;
  visible: boolean;
  /** Small square action: close the venue / pop one activity level. */
  onSmall: () => void;
  /** Main plate action — venue (Create plan) and going (Create a plan) open
   *  the create-plan wizard; peer (Join) confirms first. */
  onMain?: (kind: CtaView['kind']) => void;
  /** The surface's drag-down offset, so the row rides handle drags with it. */
  dragY: MotionValue<number>;
  /** Capture-only (?capture=cta-morph): drop the absolute screen anchoring so
   *  a stage can centre the row and cycle it through states — the label
   *  scramble, glyph swap, price slot and width morph are unchanged. */
  showcase?: boolean;
}) {
  const press = usePressFeedback();
  const morph = useMotion('morph');
  const snap = useMotion('snap');
  const snapMs = ((snap as { duration?: number }).duration ?? 0.3) * 1000;

  const kind = view?.kind ?? 'venue';
  const label = useScramble(LABELS[kind], snapMs);

  let price: string | null = null;
  if (view && view.kind === 'event') {
    const ev = VENUES[view.venueId].events.find((e) => e.id === view.eventId);
    price = ev?.price ?? null;
  }
  // Keep the last price rendered while its slot collapses closed.
  const lastPriceRef = useRef('');
  if (price) lastPriceRef.current = price;

  const anchor = kind === 'venue' ? VENUE_CTA : ACTIVITY_CTA;
  const mainW =
    kind === 'venue' ? VENUE_CTA.mainW : price ? ACTIVITY_CTA.mainWPriced : ACTIVITY_CTA.mainW;

  // Snap (don't slide) to the anchor when appearing from hidden — the slide
  // is for venue ⇄ activity handoffs the user can see.
  const wasVisible = useRef(false);
  const moveTransition = wasVisible.current ? morph : { duration: 0 };
  useEffect(() => {
    wasVisible.current = visible;
  });

  // Wall-clock show/hide (opacity/visibility only — transforms belong to the
  // framer position work below, so the two never fight over `transform`).
  const fade: CSSProperties = visible
    ? {
        opacity: 1,
        visibility: 'inherit',
        transition: `opacity ${layerZoom.inMs}ms ${layerZoom.ease} ${layerZoom.inDelayMs}ms, visibility 0s`,
      }
    : {
        opacity: 0,
        visibility: 'hidden',
        transition: `opacity ${layerZoom.outMs}ms ${layerZoom.ease}, visibility 0s linear ${layerZoom.outMs}ms`,
      };

  // × ⇄ ‹ swap on the small square: wall-clock rotate/scale crossfade timed
  // like the snap role (same recipe as the search sheet's × entrance).
  const iconSwap = (active: boolean): CSSProperties => ({
    gridArea: '1 / 1',
    display: 'grid',
    placeItems: 'center',
    opacity: active ? 1 : 0,
    transform: active ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.4)',
    transition: `opacity ${snapMs}ms ${layerZoom.ease}, transform ${snapMs}ms ${layerZoom.ease}`,
  });

  // Showcase centres the row in its parent (no screen anchor); otherwise the
  // 0×0 + pointer-events-none wrapper must never swallow taps at the screen
  // origin — interactivity is re-enabled on the row itself when visible.
  const wrapperStyle: CSSProperties = showcase
    ? { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 21 }
    : { position: 'absolute', left: 0, top: 0, width: 0, height: 0, zIndex: 21, pointerEvents: 'none', ...fade };

  return (
    <div style={wrapperStyle}>
      <motion.div style={{ y: dragY }}>
        <motion.div
          initial={false}
          animate={showcase ? {} : { x: anchor.x, y: anchor.y }}
          transition={moveTransition}
          style={{
            width: 'max-content',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: showcase || visible ? 'auto' : 'none',
          }}
        >
          {/* price slot — only open on the event level */}
          <motion.div
            initial={false}
            animate={{ width: price ? ACTIVITY_CTA.priceW + GAP : 0, opacity: price ? 1 : 0 }}
            transition={morph}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <span style={{ color: color.onBrand, fontSize: 24, fontWeight: 600, lineHeight: '26px', whiteSpace: 'nowrap' }}>
              {price ?? lastPriceRef.current}
            </span>
          </motion.div>

          {/* main plate — width morphs, label scrambles, plus persists */}
          <motion.button {...press} onClick={() => onMain?.(kind)} style={{ ...buttonReset, flexShrink: 0 }}>
            <motion.div initial={false} animate={{ width: mainW }} transition={morph}>
              <Squircle
                role="cta"
                fill={color.white}
                style={{
                  width: '100%',
                  height: SMALL,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0, // the plus owns its own 4px trailing gap (below)
                }}
              >
                {/* size 12 unrotated → the 45°-rotated plus spans ~17px,
                    matching the Figma box (1373:1052: 16.97). The confirmation
                    label ("Enter groupchat") carries no plus, so it collapses
                    away on the morph spring. */}
                <motion.div
                  initial={false}
                  animate={{
                    width: kind === 'joined' ? 0 : 17,
                    marginRight: kind === 'joined' ? 0 : 4,
                    opacity: kind === 'joined' ? 0 : 1,
                  }}
                  transition={morph}
                  style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}
                >
                  <CrossIcon plus size={12} color={color.brand} />
                </motion.div>
                <span style={{ color: color.brand, fontSize: 24, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </Squircle>
            </motion.div>
          </motion.button>

          <div style={{ width: GAP, flexShrink: 0 }} />

          {/* small square: × on the venue sheet, ‹ inside the activity stack,
              share on the join confirmation (dead for now — press feedback
              only; tapping outside is what dismisses the confirmation). */}
          <motion.button
            {...press}
            aria-label={kind === 'venue' ? 'Close venue' : kind === 'joined' ? 'Share plan' : 'Back'}
            onClick={kind === 'joined' ? undefined : onSmall}
            style={{ ...buttonReset, flexShrink: 0 }}
          >
            <Squircle
              role="cta"
              fill={color.white}
              style={{ width: SMALL, height: SMALL, display: 'grid', placeItems: 'center' }}
            >
              <span style={iconSwap(kind === 'venue')}>
                <CrossIcon size={19} color={color.brand} />
              </span>
              <span style={iconSwap(kind !== 'venue' && kind !== 'joined')}>
                <BackChevron color={color.brand} />
              </span>
              <span style={iconSwap(kind === 'joined')}>
                <ShareIcon size={22} color={color.brand} />
              </span>
            </Squircle>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
