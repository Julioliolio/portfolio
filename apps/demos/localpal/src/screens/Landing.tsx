import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Squircle } from '../components/Squircle';
import { QrCodeSvg } from '../components/profile/QrCodeSvg';
import { usePressFeedback } from '../components/MotionProvider';
import { color, font, text } from '../theme/tokens';
import type { DeviceMode } from '../hooks/useDeviceMode';
import { DEMO_FLOWS, type DemoIntent } from '../demo/flows';

/** Shared style for the landing's discreet text links (flows toggle / DS). */
const LINK_STYLE: CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'transparent',
  padding: '4px 0',
  cursor: 'pointer',
  fontFamily: font.family,
  fontSize: text.caption.size,
  fontWeight: font.weight.medium,
  color: color.onBrandMuted,
};

/**
 * A one-shot fade-up entrance driven by a CSS transition, not framer-motion.
 * The reveal is triggered from an effect (a task callback, not rAF), so it runs
 * even in throttled/backgrounded tabs where rAF is frozen — the judge's very
 * first frame must never risk being stuck invisible (see the raf-throttled
 * note in theme/motion.ts). `delay` staggers the columns.
 */
function Reveal({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => setShown(true), []);
  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The public front door. A minimal branded page — LocalPal wordmark, one-line
 * claim, a single "Try the prototype" CTA — that walks a first-time visitor
 * (a judge) into the prototype. On desktop it also offers a QR to open the real
 * thing on their own phone (it's a mobile app); on mobile they're already there,
 * so the QR is dropped and the layout collapses to one centred column.
 */
export function Landing({
  device,
  onLaunch,
  onViewDesignSystem,
}: {
  device: DeviceMode;
  onLaunch: (intent: DemoIntent) => void;
  onViewDesignSystem?: () => void;
}) {
  const press = usePressFeedback();
  const isDesktop = device === 'desktop';
  const [showFlows, setShowFlows] = useState(false);

  // The clean public URL (never carries ?dev), so a scanned phone lands as a judge.
  const publicUrl =
    typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : '';

  const copy = (
    <Reveal
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isDesktop ? 'flex-start' : 'center',
        textAlign: isDesktop ? 'left' : 'center',
        gap: 20,
        maxWidth: 420,
      }}
    >
      <div
        style={{
          fontFamily: font.family,
          fontSize: isDesktop ? 68 : 52,
          fontWeight: font.weight.semibold,
          letterSpacing: '-0.02em',
          color: color.onBrand,
          lineHeight: 1,
        }}
      >
        LocalPal
      </div>
      <div
        style={{
          fontFamily: font.family,
          fontSize: isDesktop ? 20 : 17,
          fontWeight: font.weight.medium,
          color: color.onBrandMuted,
          lineHeight: 1.35,
        }}
      >
        Encuentra gente con quien hacer planes, cerca de ti, ahora mismo.
      </div>

      <motion.button
        onClick={() => onLaunch('default')}
        {...press}
        style={{
          appearance: 'none',
          border: 'none',
          background: 'transparent',
          padding: 0,
          marginTop: 8,
          cursor: 'pointer',
        }}
      >
        <Squircle
          role="cta"
          fill={color.white}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 60,
            padding: '0 32px',
            fontFamily: font.family,
            fontSize: text.bodyLg.size,
            fontWeight: font.weight.semibold,
            color: color.brand,
          }}
        >
          Probar el prototipo
        </Squircle>
      </motion.button>

      {/* Discreet links — jump into a specific flow, or view the design system.
          Kept low-key so the hero still reads as a product intro, not a dev menu. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: isDesktop ? 'flex-start' : 'center',
        }}
      >
        <button onClick={() => setShowFlows((v) => !v)} style={LINK_STYLE}>
          {showFlows ? 'Ocultar flujos ▴' : 'Ver flujos ▾'}
        </button>
        {onViewDesignSystem && (
          <button onClick={onViewDesignSystem} style={LINK_STYLE}>
            Ver design system →
          </button>
        )}
      </div>

      {showFlows && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: isDesktop ? 'flex-start' : 'center',
            maxWidth: 360,
          }}
        >
          {DEMO_FLOWS.map((flow) => (
            <motion.button
              key={flow.intent}
              onClick={() => onLaunch(flow.intent)}
              {...press}
              style={{
                appearance: 'none',
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <Squircle
                role="chip"
                fill={color.bubbleOnBrand}
                style={{
                  padding: '9px 14px',
                  fontFamily: font.family,
                  fontSize: text.caption.size,
                  fontWeight: font.weight.medium,
                  color: color.onBrand,
                }}
              >
                {flow.label}
              </Squircle>
            </motion.button>
          ))}
        </div>
      )}
    </Reveal>
  );

  const qr = (
    <Reveal
      delay={0.08}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
    >
      <Squircle
        role="qrCard"
        fill={color.white}
        style={{ width: 240, height: 240, padding: 26 }}
      >
        <QrCodeSvg text={publicUrl} />
      </Squircle>
      <div
        style={{
          fontFamily: font.family,
          fontSize: text.caption.size,
          fontWeight: font.weight.medium,
          color: color.onBrandMuted,
          textAlign: 'center',
          maxWidth: 200,
        }}
      >
        ¿Prefieres tu móvil? Escanéalo para abrirlo ahí.
      </div>
    </Reveal>
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: color.brand,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isDesktop ? 96 : 0,
        padding: 32,
        boxSizing: 'border-box',
      }}
    >
      {copy}
      {isDesktop && qr}
    </div>
  );
}
