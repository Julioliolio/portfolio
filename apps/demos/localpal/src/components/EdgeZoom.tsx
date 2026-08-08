import { useRef, type PointerEvent as ReactPointerEvent, type CSSProperties } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useMotion } from './MotionProvider';
import { defaultEdgeZoom } from '../theme/edgeZoom';

/**
 * Snap-Map edge zoom. Finger down within `edgeMargin` of the LEFT or RIGHT
 * screen edge, then slide VERTICALLY: up zooms the real camera in, down zooms
 * out — continuous and committed (the zoom simply stays where you leave it).
 * While the finger is down a black "goo" blob bulges in from the edge and
 * rides the finger. Its size follows the finger's HORIZONTAL distance from
 * the edge (a sliver at the edge, full size `growDistance` px inward — direct
 * manipulation, the goo is being pulled out of the edge); on release it
 * springs back into the edge. The map stays full-screen — the blob is the
 * only visual, exactly like the reference.
 *
 * Renders as an absolute overlay INSIDE the map screen (not a wrapper): two
 * invisible catch strips + one blob per edge. zIndex 6 = above the map canvas,
 * below the fixed UI chrome (avatar 10, bottom bar 15+).
 *
 * Registry-driven: the release retract springs with the `snap` motion role
 * (drag-release, click-into-place); the gesture scalars live in
 * theme/edgeZoom.ts (paste-to-persist pattern).
 */
type Props = {
  /** Live camera zoom, read at gesture start. */
  getZoom: () => number;
  /** Drive the real camera zoom (jump, no animation) each pointer move. */
  setZoom: (z: number) => void;
  /**
   * Fires once the first zoom move of a gesture lands — lets the host latch the
   * center-focused pin and glide it to center (see MapHome). Deferred to the
   * first move (not pointer-down) so merely tapping the edge never recenters.
   */
  onZoomStart?: () => void;
  /** Turn the whole gesture off (non-interactive embeds). */
  enabled?: boolean;
};

type Drag = { startY: number; startZoom: number; started: boolean };

/**
 * The goo meniscus: a smooth lens hugging the right edge (mirrored for left),
 * bulging `w` px in at its waist and tapering back to the edge at both tails.
 */
function blobPath(w: number, h: number) {
  return [
    `M ${w} 0`,
    `C ${w} ${h * 0.2}, 0 ${h * 0.28}, 0 ${h * 0.5}`,
    `C 0 ${h * 0.72}, ${w} ${h * 0.8}, ${w} ${h}`,
    'Z',
  ].join(' ');
}

export function EdgeZoom({ getZoom, setZoom, onZoomStart, enabled = true }: Props) {
  const cfg = defaultEdgeZoom;
  const snap = useMotion('snap');

  // Which edge owns the current gesture drives which blob shows.
  const drag = useRef<Drag | null>(null);
  const activeEdge = useRef<'left' | 'right' | null>(null);

  // Blob state, all direct manipulation while the finger is down: y sticks to
  // the thumb; stretch (0..1) = how far the goo has been pulled out of the
  // edge, driven by the finger's horizontal distance. Only the release animates
  // (the snap-role spring back into the edge).
  const stretch = { left: useMotionValue(0), right: useMotionValue(0) };
  const blobY = useMotionValue(0);
  // Rendered scale clamps at 0 so the release spring's overshoot can't dip
  // negative (a negative scale would paint a mirror-flipped blob for a frame).
  const leftScale = useTransform(stretch.left, (v) => Math.max(0, v));
  const rightScale = useTransform(stretch.right, (v) => Math.max(0, v));
  // Hide fully-retracted blobs so they never sit over the map edge.
  const leftVisible = useTransform(stretch.left, (p) => (p > 0.001 ? 'visible' : 'hidden'));
  const rightVisible = useTransform(stretch.right, (p) => (p > 0.001 ? 'visible' : 'hidden'));

  // Finger Y in screen-local coords: measure from the strip itself (it spans
  // the full screen height, so its top == the screen's top).
  const localY = (e: ReactPointerEvent) =>
    e.clientY - (e.currentTarget as Element).getBoundingClientRect().top;

  // Finger's horizontal distance from the owning screen edge → stretch 0..1.
  // The strip hugs its edge, so its outer side IS the screen edge.
  const stretchFor = (e: ReactPointerEvent, edge: 'left' | 'right') => {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const dist = edge === 'left' ? e.clientX - r.left : r.right - e.clientX;
    return Math.max(0, Math.min(1, dist / cfg.growDistance));
  };

  // Single exit path for every way a gesture can end (strip pointerup, window
  // fallback, capture loss). Idempotent — guarded on drag.current — because a
  // release can arrive through more than one of those doors.
  const endGesture = () => {
    if (!drag.current) return;
    drag.current = null;
    const edge = activeEdge.current;
    if (edge) animate(stretch[edge], 0, snap); // goo springs back into the edge
    activeEdge.current = null;
  };

  const onDown = (edge: 'left' | 'right') => (e: ReactPointerEvent) => {
    if (!enabled) return;
    // No native drag/text-selection: a long mouse drag would otherwise start a
    // selection sweep that eats the eventual pointerup (stuck gesture).
    e.preventDefault();
    // Keep receiving moves once the finger leaves the thin strip. Guarded: a
    // stray/synthetic pointer id can throw NotFoundError.
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer — track without capture */
    }
    drag.current = { startY: e.clientY, startZoom: getZoom(), started: false };
    activeEdge.current = edge;
    stretch[edge].stop(); // cancel an in-flight retract spring
    blobY.jump(localY(e));
    stretch[edge].set(stretchFor(e, edge)); // finger at the edge → tiny nub
    // Belt-and-braces release: if capture was lost mid-drag (far drags, DOM
    // churn, release outside the window), the strip never hears pointerup —
    // the window still does.
    const winEnd = () => {
      endGesture();
      window.removeEventListener('pointerup', winEnd);
      window.removeEventListener('pointercancel', winEnd);
    };
    window.addEventListener('pointerup', winEnd);
    window.addEventListener('pointercancel', winEnd);
  };

  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    const edge = activeEdge.current;
    if (!d || !edge) return;
    // A move with no button held means the release happened where we couldn't
    // hear it — end the gesture instead of gluing the blob to a hover.
    if (e.pointerType === 'mouse' && e.buttons === 0) return endGesture();
    blobY.set(localY(e));
    stretch[edge].set(stretchFor(e, edge)); // goo pulled out with the finger
    // First real move of the gesture: let the host latch + glide the focused pin.
    if (!d.started) {
      d.started = true;
      onZoomStart?.();
    }
    // Slide up (clientY decreases) → zoom IN; slide down → zoom OUT, clamped
    // so a long drag can't fly out past the metro or into blank over-zoom.
    const z = d.startZoom + (d.startY - e.clientY) / cfg.pxPerZoom;
    setZoom(Math.max(cfg.minZoom, Math.min(cfg.maxZoom, z)));
  };

  const onUp = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* capture was never taken */
    }
    endGesture();
  };

  const strip: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: cfg.edgeMargin,
    zIndex: 6, // above the map, below the UI chrome (avatar 10, bottom bar 15+)
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: enabled ? 'ns-resize' : undefined,
  };

  const blobStyle = (edge: 'left' | 'right'): CSSProperties => ({
    position: 'absolute',
    [edge]: 0,
    top: -cfg.blobHeight / 2, // y motion value centres it on the finger
    width: cfg.blobWidth,
    height: cfg.blobHeight,
    zIndex: 6,
    pointerEvents: 'none',
    transformOrigin: edge === 'left' ? 'left center' : 'right center',
  });

  if (!enabled) return null;

  return (
    <>
      {/* Goo blobs — one per edge, grown out of the edge by the finger's pull
          (uniform scale, origin at the edge, so they inflate from a sliver). */}
      <motion.div style={{ ...blobStyle('left'), y: blobY, scale: leftScale, visibility: leftVisible }}>
        <svg
          width={cfg.blobWidth}
          height={cfg.blobHeight}
          viewBox={`0 0 ${cfg.blobWidth} ${cfg.blobHeight}`}
          // Mirror the right-edge path for the left edge.
          style={{ display: 'block', transform: 'scaleX(-1)' }}
          aria-hidden
        >
          <path d={blobPath(cfg.blobWidth, cfg.blobHeight)} fill={cfg.blobColor} />
        </svg>
      </motion.div>
      <motion.div style={{ ...blobStyle('right'), y: blobY, scale: rightScale, visibility: rightVisible }}>
        <svg
          width={cfg.blobWidth}
          height={cfg.blobHeight}
          viewBox={`0 0 ${cfg.blobWidth} ${cfg.blobHeight}`}
          style={{ display: 'block' }}
          aria-hidden
        >
          <path d={blobPath(cfg.blobWidth, cfg.blobHeight)} fill={cfg.blobColor} />
        </svg>
      </motion.div>

      {/* Invisible catch strips. */}
      <div
        style={{ ...strip, left: 0 }}
        onPointerDown={onDown('left')}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={endGesture}
      />
      <div
        style={{ ...strip, right: 0 }}
        onPointerDown={onDown('right')}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={endGesture}
      />
    </>
  );
}
