import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import {
  useCameraEase,
  useMotion,
  useMotionContext,
  usePressFeedback,
} from '../../components/MotionProvider';
import { SearchGlyph } from '../../components/icons/SearchGlyph';
import { MorphSearchCross } from '../../components/icons/MorphSearchCross';
import { MOTION_ROLES, type MotionRole } from '../../theme/motion';
import { color } from '../../theme/tokens';
import { Slider, panel, chip } from './ui';

/**
 * Motion Lab — tune the ONE animation personality (theme/motion.ts) live.
 * The signature spring re-flavors every role at once; each role is a
 * speed/bounce multiplier with its own feel-it demo.
 */

const LAVENDER = '#8d84fe';

// ---------- per-role demos ----------

function PressDemo() {
  const press = usePressFeedback();
  return (
    <motion.button
      {...press}
      style={{
        padding: '10px 18px',
        borderRadius: 14,
        border: 'none',
        background: color.brand,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Hold me
    </motion.button>
  );
}

function SnapDemo() {
  const snap = useMotion('snap');
  const TICKS = 5;
  const W = 140;
  const x = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<{ stop: () => void } | null>(null);
  const dragging = useRef(false);

  const toX = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? Math.max(0, Math.min(W, clientX - r.left)) : 0;
  };
  const release = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const step = W / (TICKS - 1);
    anim.current = animate(x, Math.round(x.get() / step) * step, snap);
  };

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        anim.current?.stop();
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        x.set(toX(e.clientX));
      }}
      onPointerMove={(e) => dragging.current && x.set(toX(e.clientX))}
      onPointerUp={release}
      style={{ position: 'relative', width: W, height: 28, cursor: 'grab', touchAction: 'none' }}
    >
      <div style={{ position: 'absolute', top: 13, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.25)' }} />
      {Array.from({ length: TICKS }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 9,
            left: (W / (TICKS - 1)) * i - 1,
            width: 2,
            height: 10,
            background: 'rgba(255,255,255,0.5)',
          }}
        />
      ))}
      <motion.div
        style={{
          position: 'absolute',
          top: 4,
          left: -4,
          x,
          width: 8,
          height: 20,
          borderRadius: 3,
          background: '#fff',
        }}
      />
    </div>
  );
}

function CurvePlot({ easeIn, easeOut, size = 96 }: { easeIn: number; easeOut: number; size?: number }) {
  // The camera timing curve: control points (easeIn,0) and (1-easeOut,1) between
  // (0,0)→(1,1). SVG y is down, so flip. A diagonal reference shows linear.
  const pad = 6;
  const s = size - pad * 2;
  const X = (u: number) => pad + u * s;
  const Y = (v: number) => pad + (1 - v) * s;
  const x1 = Math.max(0, Math.min(1, easeIn));
  const x2 = Math.max(0, Math.min(1, 1 - easeOut));
  return (
    <svg width={size} height={size} style={{ display: 'block', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
      <path
        d={`M ${X(0)} ${Y(0)} C ${X(x1)} ${Y(0)}, ${X(x2)} ${Y(1)}, ${X(1)} ${Y(1)}`}
        fill="none"
        stroke={color.brand}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CameraDemo() {
  // Mirrors the real map move: two pins accelerate apart (a stack splitting)
  // then decelerate into place on the exact camera curve. Tap to toggle.
  const cam = useCameraEase();
  const [open, setOpen] = useState(false);
  const spread = useMotionValue(0);
  const leftX = useTransform(spread, (v) => -v * 24);
  const rightX = useTransform(spread, (v) => v * 24);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    animate(spread, next ? 1 : 0, { duration: cam.durationMs / 1000, ease: cam.easing });
  };
  return (
    <div
      onClick={toggle}
      style={{ position: 'relative', width: 96, height: 40, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
    >
      <motion.div style={{ position: 'absolute', x: leftX, width: 24, height: 24, borderRadius: 8, background: color.brand }} />
      <motion.div style={{ position: 'absolute', x: rightX, width: 24, height: 24, borderRadius: 8, background: LAVENDER }} />
    </div>
  );
}

function MorphDemo() {
  const morph = useMotion('morph');
  const [big, setBig] = useState(false);
  return (
    <motion.div
      onClick={() => setBig((v) => !v)}
      animate={big ? { width: 130, height: 84, borderRadius: 18 } : { width: 110, height: 36, borderRadius: 18 }}
      transition={morph}
      style={{
        background: color.brand,
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      tap to morph
    </motion.div>
  );
}

function EntranceDemo() {
  const entrance = useMotion('entrance');
  const { extras } = useMotionContext();
  const [shown, setShown] = useState(true);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, width: 76 }}>
        <AnimatePresence>
          {shown &&
            [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, y: -10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ ...entrance, delay: i * extras.entranceStagger }}
                style={{ width: 20, height: 20, borderRadius: '50%', background: LAVENDER }}
              />
            ))}
        </AnimatePresence>
      </div>
      <button
        onClick={() => {
          setShown(false);
          setTimeout(() => setShown(true), 250);
        }}
        style={chip(false)}
      >
        Replay
      </button>
    </div>
  );
}

function PopDemo() {
  const pop = useMotion('pop');
  const bump = useMotionValue(0);
  const scale = useTransform(bump, (b) => 1 + b);
  return (
    <motion.div
      onClick={() => {
        bump.set(0.32);
        animate(bump, 0, pop);
      }}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: LAVENDER,
        scale,
        cursor: 'pointer',
      }}
    />
  );
}

function AmbientDemo() {
  const [tick, setTick] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: color.brand, display: 'grid', placeItems: 'center' }}>
        <SearchGlyph size={30} spinNow={tick} />
      </div>
      <button onClick={() => setTick((t) => t + 1)} style={chip(false)}>
        Spin now
      </button>
    </div>
  );
}

function InformDemo() {
  const inform = useMotion('inform');
  const p = useMotionValue(0);
  const width = useTransform(p, (v) => `${v * 100}%`);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 130, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
        <motion.div style={{ width, height: '100%', background: LAVENDER }} />
      </div>
      <button
        onClick={() => {
          p.set(0);
          animate(p, 1, inform);
        }}
        style={chip(false)}
      >
        Replay
      </button>
    </div>
  );
}

function GlyphMorphDemo() {
  const [toCross, setToCross] = useState(false);
  return (
    <button
      onClick={() => setToCross((v) => !v)}
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        border: 'none',
        background: color.brandDeep,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
      }}
    >
      <MorphSearchCross toCross={toCross} size={26} />
    </button>
  );
}

function FloatDemo() {
  const float = useMotion('float');
  const bob = useMotionValue(0);
  // Same loop as the selected venue pin: one half-cycle per role duration,
  // reversed forever; the floor shadow counter-scales against the bob.
  useEffect(() => {
    bob.set(-2.5);
    const c = animate(bob, 2.5, { ...float, repeat: Infinity, repeatType: 'reverse' });
    return () => c.stop();
  }, [bob, float]);
  const shadowScale = useTransform(bob, [-2.5, 2.5], [0.94, 1.04]);
  return (
    <div style={{ position: 'relative', width: 56, height: 64 }}>
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 2,
          x: '-50%',
          scaleX: shadowScale,
          width: 36,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(0,29,51,0.45)',
          filter: 'blur(4px)',
        }}
      />
      <motion.div
        style={{ position: 'absolute', left: 6, top: 4, width: 44, height: 44, borderRadius: 14, background: LAVENDER, y: bob }}
      />
    </div>
  );
}

const DEMOS: Record<MotionRole, () => React.JSX.Element> = {
  press: PressDemo,
  snap: SnapDemo,
  morph: MorphDemo,
  entrance: EntranceDemo,
  pop: PopDemo,
  ambient: AmbientDemo,
  float: FloatDemo,
  inform: InformDemo,
};

// ---------- the lab ----------

export function MotionLab() {
  const { signature, roles, extras, cameraEase, setSignature, setRole, setExtras, setCameraEase, reset } = useMotionContext();
  const [copied, setCopied] = useState<string | null>(null);
  const sigDemoX = useMotionValue(0);

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1200);
  };

  const configText =
    `export const defaultSignature: MotionSignature = { duration: ${signature.duration}, bounce: ${signature.bounce} };\n\n` +
    `export const defaultMotionRoles: Record<MotionRole, MotionRoleTuning> = {\n` +
    MOTION_ROLES.map(({ role }) => `  ${role}: { speed: ${roles[role].speed}, bounce: ${roles[role].bounce} },`).join('\n') +
    `\n};\n\n` +
    `export const defaultMotionExtras: MotionExtras = {\n` +
    `  pressScale: ${extras.pressScale},\n  entranceStagger: ${extras.entranceStagger},\n  ambientEvery: ${extras.ambientEvery},\n};`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: '#fff', width: 'min(920px, 92vw)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#9aa0a8' }}>
          One signature spring = one personality. Roles are multipliers on it — retune the signature
          and the whole app changes character. Copy into <code>theme/motion.ts</code> to persist.
        </p>
        <button onClick={reset} style={chip(false)}>Reset all</button>
      </div>

      {/* Signature */}
      <div style={{ ...panel, display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Signature</div>
              <div style={{ fontSize: 11, color: '#9aa0a8', marginBottom: 12 }}>
                The base spring every springy role derives from. Undershoot-free, overshoot-and-settle.
              </div>
            </div>
            <button
              onClick={() => copy('sig', `{ duration: ${signature.duration}, bounce: ${signature.bounce} }`)}
              style={{ ...chip(copied === 'sig'), fontSize: 11, padding: '5px 10px' }}
            >
              {copied === 'sig' ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <Slider label="Duration (ms)" value={signature.duration} min={150} max={1000} step={10} onChange={(v) => setSignature({ duration: v })} />
          <Slider label="Bounce" value={signature.bounce} min={0} max={1} step={0.01} onChange={(v) => setSignature({ bounce: v })} />
        </div>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <motion.div
            onClick={() => {
              const target = sigDemoX.get() > 30 ? 0 : 60;
              animate(sigDemoX, target, { type: 'spring', duration: signature.duration / 1000, bounce: signature.bounce });
            }}
            style={{ x: sigDemoX, width: 48, height: 48, borderRadius: 14, background: color.brand, cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Camera — NOT a spring. A real-camera timing curve (ramp up, settle in). */}
      <div style={{ ...panel, display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Camera</div>
              <div style={{ fontSize: 11, color: '#9aa0a8', marginBottom: 12 }}>
                Map zoom on tap (split a stack / zoom to a dot). A real-camera curve — ramps up, then
                decelerates and settles into place. No overshoot. Ease-in = how gradual the start; Ease-out = how hard it settles.
              </div>
            </div>
            <button
              onClick={() => copy('camera', `export const defaultCameraEase: CameraEaseConfig = { durationMs: ${cameraEase.durationMs}, easeIn: ${cameraEase.easeIn}, easeOut: ${cameraEase.easeOut} };`)}
              style={{ ...chip(copied === 'camera'), fontSize: 11, padding: '5px 10px' }}
            >
              {copied === 'camera' ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <Slider label="Duration (ms)" value={cameraEase.durationMs} min={150} max={1200} step={10} onChange={(v) => setCameraEase({ durationMs: v })} />
          <Slider label="Ease-in (accel)" value={cameraEase.easeIn} min={0} max={1} step={0.01} onChange={(v) => setCameraEase({ easeIn: v })} />
          <Slider label="Ease-out (settle)" value={cameraEase.easeOut} min={0} max={1} step={0.01} onChange={(v) => setCameraEase({ easeOut: v })} />
        </div>
        <div style={{ display: 'grid', placeItems: 'center', gap: 10 }}>
          <CurvePlot easeIn={cameraEase.easeIn} easeOut={cameraEase.easeOut} />
          <CameraDemo />
        </div>
      </div>

      {/* Roles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {MOTION_ROLES.map(({ role, label, hint, springy }) => {
          const t = roles[role];
          const Demo = DEMOS[role];
          return (
            <div key={role} style={{ ...panel, display: 'grid', gridTemplateColumns: '1fr 170px', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#9aa0a8', marginBottom: 12 }}>{hint}</div>
                  </div>
                  <button
                    onClick={() => copy(role, `${role}: { speed: ${t.speed}, bounce: ${t.bounce} },`)}
                    style={{ ...chip(copied === role), fontSize: 11, padding: '5px 10px' }}
                  >
                    {copied === role ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <Slider label="Speed ×" value={t.speed} min={0.2} max={4} step={0.05} onChange={(v) => setRole(role, { speed: v })} />
                {springy && (
                  <Slider label="Bounce ×" value={t.bounce} min={0} max={4} step={0.05} onChange={(v) => setRole(role, { bounce: v })} />
                )}
              </div>
              <div style={{ display: 'grid', placeItems: 'center' }}>
                <Demo />
              </div>
            </div>
          );
        })}

        {/* Glyph morph showcase — rides the snap role */}
        <div style={{ ...panel, display: 'grid', gridTemplateColumns: '1fr 170px', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Glyph morph</div>
            <div style={{ fontSize: 11, color: '#9aa0a8' }}>
              Search ⇄ cross, geometry interpolated on the <b>snap</b> spring (the sheet's close button).
              Tap to toggle.
            </div>
          </div>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <GlyphMorphDemo />
          </div>
        </div>
      </div>

      {/* Extras */}
      <div style={panel}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Extras</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <Slider label="Press scale" value={extras.pressScale} min={0.7} max={1} step={0.01} onChange={(v) => setExtras({ pressScale: v })} />
          <Slider label="Entrance stagger (s)" value={extras.entranceStagger} min={0} max={0.3} step={0.005} onChange={(v) => setExtras({ entranceStagger: v })} />
          <Slider label="Ambient every (s)" value={extras.ambientEvery} min={2} max={20} step={0.5} onChange={(v) => setExtras({ ambientEvery: v })} />
        </div>
      </div>

      {/* Config */}
      <div style={panel}>
        <div style={{ fontSize: 13, color: '#cfd2d8', marginBottom: 8 }}>Config</div>
        <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#d7dae0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
          {configText}
        </pre>
      </div>
    </div>
  );
}
