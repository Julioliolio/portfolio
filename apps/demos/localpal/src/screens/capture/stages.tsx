import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MorphVenuePin } from '../../components/MorphVenuePin';
import { MorphSearchCross } from '../../components/icons/MorphSearchCross';
import { InterestBubbles } from '../../components/onboarding/InterestBubbles';
import { BottomBar } from '../../components/BottomBar';
import { CtaRow, type CtaView } from '../../components/CtaRow';
import { EdgeZoom } from '../../components/EdgeZoom';
import { ConfirmProvider } from '../../components/ConfirmProvider';
import { PlansProvider, usePlansState } from '../../components/PlansProvider';
import { FocusedPlanCard } from '../../components/PlansSheet';
import { LocationDot } from '../../components/LocationDot';
import { Squircle } from '../../components/Squircle';
import { usePressFeedback } from '../../components/MotionProvider';
import { LocateIcon } from '../../components/icons/LocateIcon';
import { figmaIcons } from '../../components/icons/figmaIcons';
import { VENUES } from '../../data/venues';
import { MAP_PEER_PLANS } from '../../data/peerPlans';
import type { ActivityView } from '../../components/ActivitySheet';
import { INTEREST_FIELD, type InterestId } from '../../theme/interests';
import { color, device } from '../../theme/tokens';
import { FitScale } from './CaptureShell';

/**
 * Capture stages — each mounts ONE micro-interaction in isolation for social
 * recording (see CaptureShell). Auto mode scripts the interaction on a loop so
 * a take needs no hand on the trackpad; manual mode leaves the real component
 * interactive. The components themselves are the production ones, untouched —
 * stages only drive their props (or synthesize pointer gestures where the
 * interaction IS the gesture).
 */

export type StageProps = { auto: boolean };

/** Scripted on/off cycle: on for `onMs`, off for `offMs`, after a short lead. */
function useToggleLoop(enabled: boolean, onMs: number, offMs: number, set: (v: boolean) => void) {
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let t: number;
    const cycle = (v: boolean) => {
      if (!alive) return;
      set(v);
      t = window.setTimeout(() => cycle(!v), v ? onMs : offMs);
    };
    t = window.setTimeout(() => cycle(true), 500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [enabled, onMs, offMs, set]);
}

/* ---------------------------------------------------------------- */
/* Venue pin ⇄ lozenge morph + idle float                            */
/* ---------------------------------------------------------------- */

export function VenuePinStage({ auto }: StageProps) {
  const [sel, setSel] = useState(false);
  // Open long enough to see two full float bobs; brief rest collapsed.
  useToggleLoop(auto, 3600, 1100, setSel);
  return (
    <FitScale w={340} h={200} margin={0.78}>
      <div
        onClick={() => setSel((s) => !s)}
        style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
      >
        <MorphVenuePin icon={figmaIcons.music} name="Rita’s" selected={sel} hasActivity />
      </div>
    </FitScale>
  );
}

/* ---------------------------------------------------------------- */
/* Search ⇄ cross glyph point-morph                                  */
/* ---------------------------------------------------------------- */

export function SearchMorphStage({ auto }: StageProps) {
  const [toCross, setToCross] = useState(false);
  useToggleLoop(auto, 1600, 1600, setToCross);
  return (
    <FitScale w={240} h={240} margin={0.55}>
      <div
        onClick={() => setToCross((v) => !v)}
        style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
      >
        <MorphSearchCross toCross={toCross} size={240} color={color.brand} strokeWidth={2.2} />
      </div>
    </FitScale>
  );
}

/* ---------------------------------------------------------------- */
/* Interest bubbles — bouncy physics picker                          */
/* ---------------------------------------------------------------- */

export function BubblesStage({ auto }: StageProps) {
  const [selected, setSelected] = useState<ReadonlySet<InterestId>>(new Set());
  const [runKey, setRunKey] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);

  const toggle = (id: InterestId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Auto: poke bubbles through their real click handler (pop + neighbour
  // jostle + selection), then remount to replay the entrance pop-out.
  useEffect(() => {
    if (!auto) return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      if (n % 8 === 0) {
        setSelected(new Set());
        setRunKey((k) => k + 1);
        return;
      }
      const field = hostRef.current?.firstElementChild;
      if (!field) return;
      const bubbles = Array.from(field.children) as HTMLElement[];
      if (bubbles.length === 0) return;
      bubbles[(n * 5) % bubbles.length]?.click();
    }, 1500);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <FitScale w={INTEREST_FIELD.w} h={INTEREST_FIELD.h} margin={0.8}>
      <div ref={hostRef}>
        <InterestBubbles key={runKey} active selected={selected} onToggle={toggle} />
      </div>
    </FitScale>
  );
}

/* ---------------------------------------------------------------- */
/* Bottom bar — pill ⇄ search sheet morph (real component)           */
/* ---------------------------------------------------------------- */

export function BottomBarStage({ auto }: StageProps) {
  const [scripted, setScripted] = useState(false);
  // Open long enough for the hierarchical zoom + suggestion content to land.
  useToggleLoop(auto, 4200, 1800, setScripted);
  return (
    <FitScale w={device.width} h={device.height} margin={0.94}>
      <ConfirmProvider>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <BottomBar
            filters={[]}
            onFiltersChange={() => {}}
            scriptedSearchOpen={auto ? scripted : undefined}
          />
        </div>
      </ConfirmProvider>
    </FitScale>
  );
}

/** Simulate a real press (pointerdown → pointerup + click) so framer's
 *  whileTap squish plays even when a script does the tapping. */
function pressEl(el: HTMLElement) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 98, isPrimary: true }));
  window.setTimeout(() => {
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 98, isPrimary: true }));
    el.click();
  }, 140);
}

/** Click the deepest VISIBLE element whose exact trimmed text matches —
 *  containers holding more text fail the exact match, and hidden mounted
 *  layers (visibility-hidden layerZoom swaps) are skipped. */
function clickByText(root: HTMLElement | null, re: RegExp) {
  if (!root) return;
  const hit = Array.from(root.querySelectorAll<HTMLElement>('button, span, div'))
    .filter((el) => {
      if (!re.test((el.textContent ?? '').trim())) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    })
    .pop();
  hit?.click();
}

/* ---------------------------------------------------------------- */
/* Locate button → blue-dot halo pulse                               */
/* ---------------------------------------------------------------- */

export function LocateStage({ auto }: StageProps) {
  const [tick, setTick] = useState(0);
  const press = usePressFeedback();
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!auto) return;
    const tap = () => btnRef.current && pressEl(btnRef.current);
    const lead = window.setTimeout(tap, 900);
    const id = setInterval(tap, 3200);
    return () => {
      clearTimeout(lead);
      clearInterval(id);
    };
  }, [auto]);
  return (
    <FitScale w={200} h={280} margin={0.78}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        <LocationDot pulseTick={tick} />
        {/* The BottomBar locate button, verbatim (control squircle, 90° tap twist). */}
        <motion.button
          ref={btnRef}
          aria-label="Locate me"
          onClick={() => setTick((t) => t + 1)}
          {...press}
          whileTap={{ ...press.whileTap, rotate: 90 }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            filter: 'drop-shadow(0 2px 6px rgba(0,29,51,0.16))',
          }}
        >
          <Squircle role="control" fill="#fff" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
            <LocateIcon size={22} />
          </Squircle>
        </motion.button>
      </div>
    </FitScale>
  );
}

/* ---------------------------------------------------------------- */
/* Slide-to-RSVP — the focused plan card on the day of the event     */
/* ---------------------------------------------------------------- */

function RsvpInner({ auto }: StageProps) {
  const { setDayOf } = usePlansState();
  const hostRef = useRef<HTMLDivElement>(null);
  // Arm day-of mode: the white day/time plate becomes the RSVP slider.
  useEffect(() => {
    setDayOf(true);
  }, [setDayOf]);

  useEffect(() => {
    if (!auto) return;
    let alive = true;
    let raf = 0;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => alive && fn(), ms));
    const cycle = () => {
      if (!alive) return;
      // Drag the knob across the plate with a real (synthesized) pointer.
      at(1500, () => {
        const host = hostRef.current;
        const knob = host && Array.from(host.querySelectorAll<HTMLElement>('div')).find((d) => d.style.cursor === 'grab');
        if (!knob) return;
        const r = knob.getBoundingClientRect();
        const sx = r.left + r.width / 2;
        const sy = r.top + r.height / 2;
        const fire = (type: string, x: number) =>
          knob.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: sy, pointerId: 97, isPrimary: true }));
        fire('pointerdown', sx);
        const t0 = performance.now();
        const D = 950;
        const step = (now: number) => {
          if (!alive) return;
          const t = Math.min(1, (now - t0) / D);
          const x = sx + 340 * easeOut(t); // overshoot the clamp — commit is certain
          fire('pointermove', x);
          if (t < 1) raf = requestAnimationFrame(step);
          else fire('pointerup', x);
        };
        raf = requestAnimationFrame(step);
      });
      // Hold on the countdown + "On their way" reveal, then reset the demo
      // (day-of off resets rsvped and remounts the slider at rest).
      at(6600, () => setDayOf(false));
      at(7500, () => setDayOf(true));
    };
    cycle();
    const loop = window.setInterval(cycle, 9200);
    return () => {
      alive = false;
      clearInterval(loop);
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [auto, setDayOf]);

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <FocusedPlanCard onOpen={() => {}} />
    </div>
  );
}

export function RsvpStage({ auto }: StageProps) {
  return (
    <FitScale w={340} h={440} margin={0.84}>
      {/* Own provider so the day-of/RSVP demo state stays local to the stage. */}
      <PlansProvider>
        <RsvpInner auto={auto} />
      </PlansProvider>
    </FitScale>
  );
}

/* ---------------------------------------------------------------- */
/* CTA button morph — label scramble + glyph swap across states      */
/* ---------------------------------------------------------------- */

const PARTY = MAP_PEER_PLANS['mp-lluc']; // "Party at Rita's + afterparty…"

// The persistent CTA row as it appears across the whole flow. Each state
// changes the label (scrambles), the small square's glyph (× ⇄ ‹ ⇄ share),
// the plate width, and — on the event — opens the price slot.
const CTA_VIEWS: CtaView[] = [
  { kind: 'venue' }, //                                    "＋ Create plan"  ×
  { kind: 'event', venueId: 'ritas', eventId: 'r1' }, //   "$8  ＋ Get tickets" ‹
  { kind: 'going', venueId: 'ritas', eventId: 'r1' }, //   "＋ Create a plan" ‹
  { kind: 'peer', plan: PARTY }, //                        "＋ Join"          ‹
  { kind: 'joined', plan: PARTY }, //                      "Enter groupchat" share
];

export function CtaMorphStage({ auto }: StageProps) {
  const [i, setI] = useState(0);
  const dragY = useMotionValue(0); // the row rides a surface's drag — none here
  const advance = () => setI((n) => (n + 1) % CTA_VIEWS.length);

  useEffect(() => {
    if (!auto) return;
    // 2.2s per state — the scramble + width morph fully resolve before the next.
    const id = setInterval(advance, 2200);
    return () => clearInterval(id);
  }, [auto]);

  return (
    // The row lives on the blue card in-app, so the brand backdrop reproduces
    // the white-plate-on-blue contrast exactly (changeable in the stage chrome).
    <FitScale w={344} h={90} margin={0.9}>
      <CtaRow view={CTA_VIEWS[i]} visible showcase dragY={dragY} onMain={advance} onSmall={advance} />
    </FitScale>
  );
}

/* ---------------------------------------------------------------- */
/* Venue → activity → Join — the whole morph chain                   */
/* ---------------------------------------------------------------- */

export function VenueFlowStage({ auto }: StageProps) {
  const [venueOn, setVenueOn] = useState(false);
  const [stack, setStack] = useState<ActivityView[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);

  // Manual mode: keep the venue sheet available (there's no map pin to tap).
  useEffect(() => {
    if (!auto) setVenueOn(true);
  }, [auto]);

  // The scripted flow: pill → venue sheet → the party's activity card →
  // Join → confirm sheet → joined confirmation → morph all the way back.
  useEffect(() => {
    if (!auto) return;
    let alive = true;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => alive && fn(), ms));
    const cycle = () => {
      if (!alive) return;
      setResetKey((k) => k + 1); // fresh providers — un-joins the last run
      setVenueOn(false);
      setStack([]);
      at(1300, () => setVenueOn(true));
      at(4300, () => setStack([{ kind: 'peer', plan: PARTY }]));
      at(7600, () => clickByText(hostRef.current, /^Join$/));
      at(9200, () => clickByText(hostRef.current, /^Join plan$/));
      at(13200, () => setStack([])); // joined card → back onto the venue sheet
      at(15000, () => setVenueOn(false)); // venue sheet → pill
    };
    cycle();
    const loop = window.setInterval(cycle, 17000);
    return () => {
      alive = false;
      clearInterval(loop);
      timers.forEach(clearTimeout);
    };
  }, [auto]);

  // Frame = the phone screen: the venue sheet is full-bleed and runs off the
  // bottom edge just like in the app, while the inset activity card floats
  // within it.
  return (
    <FitScale w={device.width} h={device.height} margin={0.94}>
      {/* hostRef wraps the ConfirmProvider so the scripted clicks can reach
          the confirm sheet too (it renders as the provider's own child). */}
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }}>
        <ConfirmProvider key={resetKey}>
          <PlansProvider>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <BottomBar
                filters={[]}
                onFiltersChange={() => {}}
                venue={venueOn ? VENUES.ritas : null}
                onCloseVenue={() => setVenueOn(false)}
                activityStack={stack}
                onActivityPush={(view) => setStack((s) => [...s, view])}
                onActivityPop={() => setStack((s) => s.slice(0, -1))}
                onActivityClose={() => setStack([])}
              />
            </div>
          </PlansProvider>
        </ConfirmProvider>
      </div>
    </FitScale>
  );
}

/* ---------------------------------------------------------------- */
/* Edge-zoom goo over the real map                                   */
/* ---------------------------------------------------------------- */

const MADRID = { longitude: -3.7038, latitude: 40.4168 };
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function EdgeZoomStage({ auto }: StageProps) {
  const mapRef = useRef<MapRef>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  // Finger indicator — client coords, drawn fixed over everything so it also
  // visualizes the synthetic auto gesture.
  const [dot, setDot] = useState<{ x: number; y: number } | null>(null);

  // Auto: synthesize the real pointer gesture against the right edge strip —
  // pull the goo out while sliding up (zoom in) then down (zoom out), release.
  useEffect(() => {
    if (!auto) return;
    let alive = true;
    let raf = 0;
    const run = () => {
      const host = phoneRef.current;
      if (!host || !alive) return;
      const r = host.getBoundingClientRect();
      const edgeX = r.right - 3;
      const startY = r.top + r.height * 0.58;
      const target = document.elementFromPoint(edgeX, startY);
      if (!target) return;
      const fire = (type: string, x: number, y: number) =>
        target.dispatchEvent(
          new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 99, isPrimary: true }),
        );
      fire('pointerdown', edgeX, startY);
      const t0 = performance.now();
      const D = 3200;
      const step = (now: number) => {
        if (!alive) return;
        const t = Math.min(1, (now - t0) / D);
        const pull = easeOut(Math.min(1, t * 3)); // goo fully out in the first third
        const x = edgeX - (56 * r.width) / device.width * pull;
        const y = startY - Math.sin(t * Math.PI * 2) * r.height * 0.24; // up, then down, back
        fire('pointermove', x, y);
        if (t < 1) raf = requestAnimationFrame(step);
        else fire('pointerup', x, y);
      };
      raf = requestAnimationFrame(step);
    };
    const lead = window.setTimeout(run, 900);
    const id = setInterval(run, 5200);
    return () => {
      alive = false;
      clearTimeout(lead);
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [auto]);

  return (
    <>
      <FitScale w={device.width} h={device.height} margin={0.94}>
        <div
          ref={phoneRef}
          style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
          onPointerDownCapture={(e) => setDot({ x: e.clientX, y: e.clientY })}
          onPointerMoveCapture={(e) => setDot((d) => (d ? { x: e.clientX, y: e.clientY } : d))}
          onPointerUpCapture={() => setDot(null)}
          onPointerCancelCapture={() => setDot(null)}
        >
          <Map
            ref={mapRef}
            initialViewState={{ ...MADRID, zoom: 14.4 }}
            mapStyle={import.meta.env.BASE_URL + 'map-style.json'}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          />
          <EdgeZoom
            getZoom={() => mapRef.current?.getMap().getZoom() ?? 14.4}
            setZoom={(z) => mapRef.current?.getMap().setZoom(z)}
          />
        </div>
      </FitScale>
      {dot && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: dot.x - 16,
            top: dot.y - 16,
            width: 32,
            height: 32,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.35)',
            border: '1.5px solid rgba(255,255,255,0.7)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
            zIndex: 99,
          }}
        />
      )}
    </>
  );
}
