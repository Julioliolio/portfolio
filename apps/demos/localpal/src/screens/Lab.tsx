import { useRef, useState } from 'react';
import { color, device } from '../theme/tokens';
import { PhoneFrame } from '../components/PhoneFrame';
import { MapHome } from './MapHome';
import { ShadowLab } from './lab/ShadowLab';
import { SquircleLab } from './lab/SquircleLab';
import { MotionLab } from './lab/MotionLab';
import { ClusterLab } from './lab/ClusterLab';
import { PlansLab } from './lab/PlansLab';

/**
 * Effects Lab — a sandbox to tune reusable design primitives with live sliders
 * and copy-paste config. Tabs:
 *  - Squircles       → theme/squircles.ts (per-role, applies live everywhere)
 *  - Floating shadow → theme/floatShadow.ts
 *  - Cluster         → theme/avatarCluster.ts (drag the tiles by hand)
 *
 * "Preview in context" embeds the real Map screen (same live registry), so
 * tuning updates the actual UI in real time.
 */

const TABS = ['Squircles', 'Motion', 'Floating shadow', 'Cluster', 'Plans'] as const;
type Tab = (typeof TABS)[number];

const VP_W = 360;
const VP_H = 660;

function ContextPreview({
  scale,
  onScale,
}: {
  scale: number;
  onScale: (v: number) => void;
}) {
  const w = (device.width + device.bezel * 2) * scale;
  const h = (device.height + device.bezel * 2) * scale;

  // Grab-to-pan the viewport, but only once the pointer actually moves past a
  // threshold — a tap with no movement passes through to the buttons beneath.
  const vpRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; l: number; t: number; active: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = vpRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop, active: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = vpRef.current;
    if (!el || !drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (!drag.current.active) {
      if (Math.hypot(dx, dy) < 5) return; // still a tap, don't hijack
      drag.current.active = true;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    }
    el.scrollLeft = drag.current.l - dx;
    el.scrollTop = drag.current.t - dy;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const el = vpRef.current;
    if (el && drag.current?.active) {
      el.style.cursor = 'grab';
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    drag.current = null;
  };

  return (
    <div style={{ position: 'sticky', top: 0, flex: '0 0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#9aa0a8' }}>Live context · drag to pan</span>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={scale}
          onChange={(e) => onScale(parseFloat(e.target.value))}
          style={{ width: 90, accentColor: color.brand }}
        />
        <span style={{ fontSize: 11, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(scale * 100)}%
        </span>
      </div>
      <div
        ref={vpRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          width: Math.min(w, VP_W),
          height: Math.min(h, VP_H),
          overflow: 'auto',
          borderRadius: 20,
          cursor: 'grab',
          touchAction: 'none',
          background: '#0b0b10',
        }}
      >
        <div style={{ width: w, height: h }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <PhoneFrame>
              <MapHome interactive={false} />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Lab({ onStartOnboarding }: { onStartOnboarding?: () => void }) {
  const [tab, setTab] = useState<Tab>('Squircles');
  const [showContext, setShowContext] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: active ? '#fff' : '#aeb2ba',
    background: active ? color.brand : 'rgba(255,255,255,0.08)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 'min(1200px, 94vw)' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>
            {t}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {onStartOnboarding && (
          <button
            onClick={onStartOnboarding}
            style={{ ...tabStyle(false), background: 'rgba(255,255,255,0.12)', color: '#fff' }}
          >
            ▶ Run onboarding
          </button>
        )}
        <button
          onClick={() => setShowContext((v) => !v)}
          style={{
            ...tabStyle(showContext),
            background: showContext ? color.brand : 'rgba(255,255,255,0.12)',
            color: '#fff',
          }}
        >
          {showContext ? 'Hide context' : 'Preview in context'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === 'Squircles' ? <SquircleLab /> : tab === 'Motion' ? <MotionLab /> : tab === 'Floating shadow' ? <ShadowLab /> : tab === 'Cluster' ? <ClusterLab /> : <PlansLab />}
        </div>
        {showContext && <ContextPreview scale={previewScale} onScale={setPreviewScale} />}
      </div>
    </div>
  );
}
