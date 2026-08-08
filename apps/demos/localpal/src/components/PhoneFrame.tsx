import { forwardRef, useEffect, useState, type ReactNode } from 'react';
import { getSvgPath } from 'figma-squircle';
import { device, smoothing } from '../theme/tokens';
import { SystemUI } from './SystemUI';
import { ConfirmProvider } from './ConfirmProvider';

/**
 * Both shells are a fixed, known size, so the superellipse paths are generated
 * once at module scope — no measuring, no first-paint flash of square corners.
 * `clip-path` (not just `border-radius` + `overflow: hidden`) because a plain
 * radius clip is unreliable over transformed/composited descendants — the map
 * layers pushed square corners through the mask.
 */
const BODY = {
  width: device.width + device.bezel * 2,
  height: device.height + device.bezel * 2,
};
const SCREEN_PATH = getSvgPath({
  width: device.width,
  height: device.height,
  cornerRadius: device.screenRadius,
  cornerSmoothing: smoothing,
});
const BODY_PATH = getSvgPath({
  width: BODY.width,
  height: BODY.height,
  cornerRadius: device.bodyRadius,
  cornerSmoothing: smoothing,
});

/**
 * The 393×852 iOS screen surface: children render at true logical size with the
 * shared SystemUI overlay (status bar, Dynamic Island, home indicator) on top,
 * and confirmations layered at the screen level. This is the reusable core —
 * `PhoneFrame` wraps it in a bezel (desktop), `FullScreenPhone` scales it to
 * fill the viewport (mobile). MapHome is absolutely positioned at these exact
 * dimensions, so we never resize the screen — only the container around it.
 */
export function PhoneScreen({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width: device.width,
        height: device.height,
        flex: 'none', // never let a flex parent squeeze the screen
        clipPath: `path('${SCREEN_PATH}')`,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {/* Confirmations render at the phone-screen level so they layer over
          any open card, wherever in the tree they were triggered. */}
      <ConfirmProvider>{children}</ConfirmProvider>
      <SystemUI />
    </div>
  );
}

/**
 * A 393×852 iPhone-style frame. Renders `PhoneScreen` inside a squircle bezel.
 *
 * Two layers on purpose: the outer div owns only the drop shadow (a clip-path
 * would eat it), the inner div is the clipped case body. The ref stays on the
 * outer div so screenshot capture targets the whole phone and can strip that
 * shadow for clean transparent corners.
 */
export const PhoneFrame = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function PhoneFrame({ children }, ref) {
    return (
      <div
        ref={ref}
        style={{
          width: BODY.width,
          height: BODY.height,
          // The frame is a flex item on both stages; without this it shrinks
          // below its width while the fixed-size screen inside doesn't, and the
          // screen spills out of the case.
          flex: 'none',
          borderRadius: device.bodyRadius,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            padding: device.bezel,
            background: '#0b0b10',
            clipPath: `path('${BODY_PATH}')`,
          }}
        >
          <PhoneScreen>{children}</PhoneScreen>
          {/* Edge highlight, drawn as a stroke on the same superellipse so it
              hugs the case exactly (an inset box-shadow would be square). */}
          <svg
            width={BODY.width}
            height={BODY.height}
            viewBox={`0 0 ${BODY.width} ${BODY.height}`}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            aria-hidden
          >
            <path
              d={BODY_PATH}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={4}
            />
          </svg>
        </div>
      </div>
    );
  },
);

/**
 * Mobile presentation: the untouched 393×852 `PhoneScreen` scaled to fit the
 * real viewport (contain — so the bottom bar never clips), centered on a brand
 * fill. Reuses the exact same screen as the framed desktop view, so nothing in
 * MapHome has to become fluid. Uses 100dvh to survive mobile browser chrome.
 */
export function FullScreenPhone({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(vw / device.width, vh / device.height));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0b0b10',
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <PhoneScreen>{children}</PhoneScreen>
      </div>
    </div>
  );
}
