import { useEffect, useRef } from 'react';
import { useMotionSim } from '../MotionProvider';
import { INTERESTS, INTEREST_FIELD, type InterestId } from '../../theme/interests';
import { color } from '../../theme/tokens';

/**
 * The onboarding interest picker — the bouncy-bubble physics personality over
 * the expanded interest set (theme/interests.ts). The recipe: bubbles pop in from
 * the cluster centre and grow while pushing each other apart (spring +
 * soft-collision sim on rAF); tapping toggles selection (white ⇄ translucent)
 * with the `pop` bump that jostles neighbours. Labels live inside the bubbles
 * (Bump-style picking) — no compact layout here, the cluster is the step.
 */

type Particle = { cx: number; cy: number; vx: number; vy: number; s: number; pop: number; popV: number };

// On the light paper-city stage the bubbles flip: unpicked = white stickers
// with ink labels, picked = brand-filled. A soft shadow lifts them off the
// street texture.
const BUBBLE = color.white;
const BUBBLE_SHADOW = '0 2px 10px rgba(0,29,51,0.14)';
const START_PX = 16;

const CENTROID = {
  x: INTERESTS.reduce((s, b) => s + b.pose.cx, 0) / INTERESTS.length,
  y: INTERESTS.reduce((s, b) => s + b.pose.cy, 0) / INTERESTS.length,
};

// Seed each bubble part-way from the cluster centre toward its OWN pose (not
// all stacked at the centroid). With 12 tightly-packed bubbles, a pure-centroid
// seed makes them all overlap at once and the collision solver scatters them
// chaotically — the weak spring then takes ages to drag them back, which reads
// as endless churn. Fanning them out means they grow roughly into place and
// settle cleanly on the tangent layout, still "popping out from the centre".
const SEED_FROM_CENTRE = 0.35;

function initParticles(): Particle[] {
  return INTERESTS.map((b) => ({
    cx: CENTROID.x + (b.pose.cx - CENTROID.x) * SEED_FROM_CENTRE,
    cy: CENTROID.y + (b.pose.cy - CENTROID.y) * SEED_FROM_CENTRE,
    vx: 0,
    vy: 0,
    s: START_PX / (2 * b.pose.r),
    pop: 0,
    popV: 0,
  }));
}

export function InterestBubbles({
  active,
  selected,
  onToggle,
}: {
  /** Replays the entrance pop each time the step (re)opens; freezes when hidden. */
  active: boolean;
  selected: ReadonlySet<InterestId>;
  onToggle: (id: InterestId) => void;
}) {
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const parts = useRef<Particle[]>(initParticles());
  const raf = useRef(0);

  const popSim = useMotionSim('pop');
  const popSimRef = useRef(popSim);
  popSimRef.current = popSim;

  useEffect(() => {
    if (active) parts.current = initParticles();
  }, [active]);

  // The sim SLEEPS once the cluster settles (30 calm frames) instead of
  // burning rAF forever — a poke wakes it back up. `startRef` lets the tap
  // handler restart the loop without re-arming the effect.
  const startRef = useRef<() => void>(() => {});
  const running = useRef(false);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(raf.current);
      running.current = false;
      return;
    }
    let calm = 0;
    const step = () => {
      const p = parts.current;
      let motion = 0;
      for (let i = 0; i < INTERESTS.length; i++) {
        const pose = INTERESTS[i].pose;
        const pt = p[i];
        pt.vx += (pose.cx - pt.cx) * 0.02;
        pt.vy += (pose.cy - pt.cy) * 0.02;
        pt.vx *= 0.86;
        pt.vy *= 0.86;
        pt.cx += pt.vx;
        pt.cy += pt.vy;
        pt.s += (1 - pt.s) * 0.09;
        pt.popV += (0 - pt.pop) * popSimRef.current.k;
        pt.popV *= popSimRef.current.damp;
        pt.pop += pt.popV;
        if (Math.abs(pt.pop) < 0.0005 && Math.abs(pt.popV) < 0.0005) {
          pt.pop = 0;
          pt.popV = 0;
        }
        motion += Math.abs(pt.vx) + Math.abs(pt.vy) + Math.abs(pt.pop) + Math.abs(1 - pt.s);
      }
      // soft collisions — same ~12% allowed overlap as the search bubbles
      for (let i = 0; i < INTERESTS.length; i++) {
        for (let j = i + 1; j < INTERESTS.length; j++) {
          const a = p[i];
          const c = p[j];
          const dx = c.cx - a.cx;
          const dy = c.cy - a.cy;
          const dist = Math.hypot(dx, dy) || 0.001;
          const aR = INTERESTS[i].pose.r * a.s * (1 + a.pop);
          const cR = INTERESTS[j].pose.r * c.s * (1 + c.pop);
          const minDist = (aR + cR) * 0.88;
          if (dist < minDist) {
            const push = ((minDist - dist) / dist) * 0.5;
            const ox = dx * push;
            const oy = dy * push;
            a.cx -= ox; a.cy -= oy; c.cx += ox; c.cy += oy;
            a.vx -= ox * 0.3; a.vy -= oy * 0.3; c.vx += ox * 0.3; c.vy += oy * 0.3;
          }
        }
      }
      for (let i = 0; i < INTERESTS.length; i++) {
        const el = nodeRefs.current[i];
        if (!el) continue;
        const pt = p[i];
        const baseR = INTERESTS[i].pose.r;
        el.style.transform = `translate(${pt.cx - baseR}px, ${pt.cy - baseR}px) scale(${pt.s * (1 + pt.pop)})`;
      }
      // The cluster is packed, so equilibrium isn't exactly at the poses —
      // calmness is "nothing meaningfully moved for 30 frames".
      calm = motion < 0.05 ? calm + 1 : 0;
      if (calm > 30) {
        running.current = false;
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    const start = () => {
      if (running.current) return;
      running.current = true;
      calm = 0;
      raf.current = requestAnimationFrame(step);
    };
    startRef.current = start;
    start();
    return () => {
      cancelAnimationFrame(raf.current);
      running.current = false;
    };
  }, [active]);

  const pokePop = (i: number) => {
    const pt = parts.current[i];
    if (!pt) return;
    pt.pop = 0.32;
    pt.popV = 0.06;
    const ang = i * 2.399963; // golden-angle kick, deterministic (no Math.random)
    pt.vx += Math.cos(ang) * 1.6;
    pt.vy += Math.sin(ang) * 1.6;
    startRef.current(); // wake the sleeping sim
  };

  return (
    <div style={{ position: 'relative', width: INTEREST_FIELD.w, height: INTEREST_FIELD.h }}>
      {INTERESTS.map((b, i) => {
        const isSel = selected.has(b.id);
        const baseR = b.pose.r;
        return (
          <div
            key={b.id}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            onClick={() => {
              pokePop(i);
              onToggle(b.id);
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: baseR * 2,
              height: baseR * 2,
              borderRadius: '50%',
              transformOrigin: 'center',
              background: isSel ? color.brand : BUBBLE,
              boxShadow: BUBBLE_SHADOW,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              willChange: 'transform',
            }}
          >
            <span
              style={{
                color: isSel ? color.onBrand : color.ink,
                fontSize: Math.max(11, Math.min(15, baseR * 0.3)),
                fontWeight: 600,
                textAlign: 'center',
                lineHeight: 1.1,
                maxWidth: baseR * 1.7,
                pointerEvents: 'none',
                transition: 'color 0.2s ease',
              }}
            >
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
