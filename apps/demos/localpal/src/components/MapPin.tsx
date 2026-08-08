/**
 * One activity pin on the map, memoized so a camera move only re-renders the
 * pins whose placement actually changed — not all ~60 every frame.
 *
 * All the visual/motion behavior is unchanged from the original inline markers
 * in MapHome; this file just wraps a single `<Marker>` + its morph layers in a
 * `React.memo` boundary. The parent passes primitive, mostly-stable props so a
 * full tile that stays `full` while the camera flies past skips re-render
 * entirely. Stacked tiles (whose screen offset depends on zoom) still update
 * as the cluster geometry changes — which is exactly when they must.
 */
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Marker } from 'react-map-gl/maplibre';
import { MapPeerPin } from './MapPeerPin';
import { MorphVenuePin } from './MorphVenuePin';
import { Squircle } from './Squircle';
import { usePinSize, useCenterFocusScale } from './PinSizeProvider';
import { useMapDensity } from './MapDensityProvider';
import { useSquircle } from './SquircleProvider';
import { useMotion, useMotionExtras, usePressFeedback } from './MotionProvider';
import { mercatorPx, type Placement, type PinStack } from './mapClusters';
import { defaultMapCluster } from '../theme/mapClusters';
import { peerSticker } from '../theme/peerStickers';
import { MAP_PEER_PLANS } from '../data/peerPlans';
import { VENUES } from '../data/venues';
import { color } from '../theme/tokens';
import type { Pin } from '../screens/MapHome';

const PEER_PIN_FOCUS = 71.342;

type MapPinProps = {
  pin: Pin;
  mode: Placement['mode'];
  slot: number;
  /** Present only when `mode === 'stack'`; drives the fan-out offset + tap. */
  stack?: PinStack;
  /** Quantized zoom, passed ONLY to stacked pins (0 otherwise) so full/dot
   *  tiles keep stable props across zoom frames and the memo can skip them. */
  zoomForStack: number;
  isSelected: boolean;
  centered: boolean;
  /** Identity tier: your own/joined plans render a touch bigger (ownPinScale). */
  big: boolean;
  index: number;
  onTap: (pin: Pin, mode: Placement['mode'], stack?: PinStack) => void;
};

function MapPinImpl({
  pin,
  mode,
  slot,
  stack,
  zoomForStack,
  isSelected,
  centered,
  big,
  index,
  onTap,
}: MapPinProps) {
  const pinSize = usePinSize();
  const centerFocusScale = useCenterFocusScale();
  const density = useMapDensity();
  const pinSq = useSquircle('pin');
  const entrance = useMotion('entrance');
  const morph = useMotion('morph');
  const { entranceStagger } = useMotionExtras();
  const press = usePressFeedback();
  const cluster = defaultMapCluster;

  const demoted = mode === 'dot';
  const hidden = mode === 'hidden';
  // Identity hierarchy: your own plan's tile reads a touch bigger than
  // ordinary content pins. Stack fan-out math stays on the base pinSize so a
  // mixed stack keeps one geometry.
  const tileSize = big ? Math.round(pinSize * density.ownPinScale) : pinSize;

  // Peer pins wear their plan's activity sticker; venue pins use their own glyph.
  const peerBadge =
    pin.kind === 'peer'
      ? (() => {
          const plan = MAP_PEER_PLANS[pin.planId];
          return plan ? peerSticker(`${plan.title} ${plan.description}`) : undefined;
        })()
      : undefined;

  // Stacked peers glide from their own anchor to a fanned slot around the
  // stack's centroid (screen-px offset, recomputed as zoom moves). Only the top
  // `stackMaxTiles` fan out; extras collapse into the centre (`overflow`).
  let off = { x: 0, y: 0, rotate: 0 };
  let stackZ: number | undefined;
  let overflow = false;
  if (mode === 'stack' && stack) {
    const own = mercatorPx(pin.lng, pin.lat, zoomForStack);
    const c = mercatorPx(stack.center.lng, stack.center.lat, zoomForStack);
    const n = stack.members.length;
    const vis = Math.min(n, cluster.stackMaxTiles);
    overflow = slot >= cluster.stackMaxTiles;
    off = {
      x: c.x - own.x + (overflow ? 0 : (slot - (vis - 1) / 2) * pinSize * cluster.stackSpread),
      y: c.y - own.y + (overflow ? 0 : cluster.stackLift[slot % cluster.stackLift.length]),
      rotate: overflow ? 0 : cluster.stackTilts[slot % cluster.stackTilts.length],
    };
    stackZ = 2 + (n - slot); // front (winner) tile paints on top
  }

  return (
    <Marker
      longitude={pin.lng}
      latitude={pin.lat}
      anchor="center"
      // Dots sink below full tiles so a demoted neighbour never sits on top of
      // the pin that won its group.
      style={{ zIndex: isSelected ? 8 : (stackZ ?? (demoted ? 0 : 1)) }}
    >
      <motion.div
        // A hidden (far-tier) pin must not keep an invisible tap target — its
        // layout box stays pin-sized even while both layers fade out.
        style={{ position: 'relative', cursor: 'pointer', pointerEvents: hidden ? 'none' : undefined }}
        initial={{ scale: 0, y: -14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ ...entrance, delay: 0.15 + index * entranceStagger }}
        whileHover={isSelected || hidden ? undefined : { scale: 1.1 }}
        whileTap={isSelected || hidden ? undefined : press.whileTap}
        onClick={() => { if (!hidden) onTap(pin, mode, stack); }}
        // Lets the BottomBar dismiss-scrim forward taps to this pin.
        data-map-pin=""
      >
        {/* Cluster offset layer — springs to the stack slot and back. */}
        <motion.div initial={false} animate={{ x: off.x, y: off.y, rotate: off.rotate }} transition={morph}>
          {/* Full-pin layer — shrinks away when demoted to a dot, collapses
              into the stack centre when it's an overflow tile, or fades out
              entirely at the far tier (hidden). */}
          <motion.div
            initial={false}
            animate={{
              scale: demoted
                ? cluster.dotSize / pinSize
                : hidden
                  ? 0.3
                  : overflow
                    ? 0
                    : centered
                      ? centerFocusScale
                      : 1,
              opacity: demoted || hidden || overflow ? 0 : 1,
            }}
            transition={morph}
            style={{ pointerEvents: demoted || hidden || overflow ? 'none' : undefined }}
          >
            {pin.kind === 'peer' ? (
              <MapPeerPin
                size={tileSize}
                focusSize={PEER_PIN_FOCUS}
                selected={isSelected}
                // Back tiles drop their activity badge so the stack reads as one
                // container, not competing pins. The badge is the plan's own
                // activity sticker (drinks/music/food/sports/coffee/culture),
                // inferred from its text — see theme/peerStickers.
                badge={mode === 'stack' && slot > 0 ? undefined : peerBadge}
                stroke={mode === 'stack' ? '#fff' : undefined}
                strokeWidth={mode === 'stack' ? 2 : undefined}
              />
            ) : (
              <div style={{ position: 'relative' }}>
                {/* White rim so stacked same-blue tiles read as separate cards. */}
                <motion.div
                  aria-hidden
                  initial={false}
                  animate={{ opacity: mode === 'stack' ? 1 : 0 }}
                  transition={morph}
                  style={{ position: 'absolute', left: -2, top: -2, pointerEvents: 'none' }}
                >
                  <Squircle
                    radius={pinSq.radius + 2}
                    smoothing={pinSq.smoothing}
                    fill="#fff"
                    style={{ width: tileSize + 4, height: tileSize + 4 }}
                  />
                </motion.div>
                <MorphVenuePin
                  size={tileSize}
                  icon={VENUES[pin.venueId].icon}
                  name={VENUES[pin.venueId].name}
                  selected={isSelected}
                  // Ring only venues that host activities; drop it while stacked
                  // so the cluster reads as one container.
                  hasActivity={VENUES[pin.venueId].events.length > 0 && mode !== 'stack'}
                />
              </div>
            )}
          </motion.div>
          {/* Dot layer — what a demoted pin condenses into. Kept translucent
              on purpose: dots are quiet texture ("something's here"), never
              competing with the curated tiles (see defaultMapDensity).
              Deliberately NOT scale-linked to the tile: it lives at its true
              size and mostly just fades (the shrinking tile carries the
              condensation), so no transition ever passes through a big
              half-faded dot. */}
          <motion.div
            aria-hidden
            initial={false}
            animate={{
              scale: demoted ? 1 : 0.6,
              opacity: demoted ? density.dotOpacity : 0,
            }}
            transition={morph}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: cluster.dotSize,
              height: cluster.dotSize,
              marginLeft: -cluster.dotSize / 2,
              marginTop: -cluster.dotSize / 2,
              borderRadius: '50%',
              background: color.brand,
              // Thin white ring so the dot separates from the map.
              boxShadow: `0 0 0 ${cluster.dotStroke}px #fff`,
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      </motion.div>
    </Marker>
  );
}

export const MapPin = memo(MapPinImpl);
