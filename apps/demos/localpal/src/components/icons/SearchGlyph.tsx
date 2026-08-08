import { useEffect, useRef } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { useMotion, useMotionExtras } from '../MotionProvider';

/**
 * THE pill search glyph — vector paths extracted from Figma node 1358:1494
 * (replacing the baked search-glyph.png, per CLAUDE.md). The lens reflection is
 * its own path so it can orbit the lens centre: every `ambientEvery` seconds it
 * does one full spin on the `ambient` spring — overshooting past 360° and
 * settling back — the idle "alive, waiting" flourish.
 */

// Lens centre in viewBox coordinates (the outer ring is centred here).
const CX = 14.6611;
const CY = 14.6611;

export function SearchGlyph({
  size = 33,
  color = '#FEFEFE',
  ambient = true,
  spinNow = 0,
}: {
  size?: number;
  color?: string;
  ambient?: boolean;
  /** Bump this counter to trigger one spin immediately (Lab demo). */
  spinNow?: number;
}) {
  const rot = useMotionValue(0);
  const spin = useMotion('ambient');
  const { ambientEvery } = useMotionExtras();
  // Write the SVG transform attribute directly — framer's `transform` prop is
  // treated as a CSS style and won't rotate around the lens centre.
  const gRef = useRef<SVGGElement>(null);
  useEffect(
    () => rot.on('change', (r) => gRef.current?.setAttribute('transform', `rotate(${r} ${CX} ${CY})`)),
    [rot],
  );

  useEffect(() => {
    let anim: { stop: () => void } | null = null;
    const trigger = () => {
      anim?.stop();
      rot.set(0);
      anim = animate(rot, 360, { ...spin, onComplete: () => rot.set(0) });
    };
    if (spinNow > 0) trigger();
    const id = ambient ? setInterval(trigger, ambientEvery * 1000) : undefined;
    return () => {
      clearInterval(id);
      anim?.stop();
      rot.set(0);
    };
  }, [ambient, ambientEvery, spin, rot, spinNow]);

  return (
    <svg width={size} height={size} viewBox="0 0 33.2988 33.2451" fill="none" aria-hidden style={{ display: 'block' }}>
      {/* magnifier body: ring + handle (Figma "Union") */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.6611 0C22.7579 0.000372638 29.3223 6.56436 29.3223 14.6611C29.3222 17.7912 28.3402 20.692 26.6689 23.0732L29.0557 25.4443L33.2988 29.0049L29.0586 33.2451L25.2744 28.7354L23.1436 26.6191C20.7493 28.3206 17.822 29.3221 14.6611 29.3223C6.5642 29.3223 0.000109268 22.7581 0 14.6611C0 6.56412 6.56412 0 14.6611 0ZM14.6611 5C9.32554 5 5 9.32555 5 14.6611L5.0127 15.1582C5.26318 20.0981 9.22409 24.0593 14.1641 24.3096L14.6611 24.3223C19.8297 24.3219 24.0508 20.2625 24.3096 15.1582L24.3223 14.6611C24.3223 9.49249 20.2625 5.27175 15.1582 5.0127L14.6611 5Z"
        fill={color}
      />
      {/* lens reflection — orbits the lens centre on the ambient spin */}
      <g ref={gRef}>
        <path
          d="M12.1475 9.49121C14.2885 8.25235 17.0749 8.54812 18.9072 10.3799C20.3854 11.8582 20.8627 13.9582 20.3418 15.8389L17.3184 15.0293C17.5609 14.1932 17.3531 13.254 16.6943 12.5947C15.8863 11.7867 14.658 11.6582 13.7139 12.2051L12.1475 9.49121Z"
          fill={color}
        />
      </g>
    </svg>
  );
}
