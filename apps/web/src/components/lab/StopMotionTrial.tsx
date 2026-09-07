"use client";

import { loadPiece } from "@portfolio/lab/loaders";
import type { LabSlug } from "@portfolio/lab/registry";
import Link from "next/link";
import {
  CLAY_CURSOR_DEFAULTS,
  clayCursorTuning,
} from "@portfolio/lab/cursor-tuning";
import {
  Suspense,
  lazy,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { ENTER_KINDS, Enter, Stagger, type EnterKind } from "@/components/motion/Enter";

/**
 * The stop-motion trial. Two halves:
 *
 * 1. Entrances — the CSS steps(1) keyframes from styles/stop-motion.css,
 *    laid down on a board through <Stagger>. Replay re-mounts the board so
 *    every element plays from its first pose; the stagger slider changes
 *    the beat between siblings.
 *
 * 2. The pieces — road signs, cartel, pointer tilt and the clay cursor —
 *    each with a current / sparse switch. "Current" is the piece's own
 *    defaults; "sparse" passes the overrides below in. The pieces never
 *    change their defaults here; if a sparse feel wins, its values get
 *    pasted into the piece.
 */

type Beat = "current" | "sparse";

// Road signs: the hover walk in three cuts on a 10-beat, lands well past
// its pose and squeezes hard; the poke, the rope and the card cut on the
// same beat instead of tweening.
const ROAD_SIGNS_SPARSE = {
  fps: 10,
  steps: 3,
  growOvershoot: 1.6,
  shrinkOvershoot: 1.4,
  growSqueeze: 0.9,
  shrinkSqueeze: 0.9,
  nudgeFps: 10,
  nudgeSteps: 3,
  ropeFps: 10,
  cardFps: 10,
};

// Cartel: the photo swaps are already on twos (12fps, fixed). Sparse puts
// the spin, the bob and the pointer glide on that same beat so the whole
// sign moves on twos — nothing left "on ones" or at 60.
const CARTEL_SPARSE = {
  spin: { fps: 12 },
  bob: { fps: 12 },
  glideFps: 12,
};

const POINTER_TILT_SPARSE_FPS = 10;
const CURSOR_SPARSE_FPS = 10;

// Pieces are loaded through the lab loaders like LabStage — never imported
// directly. The casts add the props the pieces accept that the generic
// piece module type doesn't carry.
function pieceLoader<P>(slug: LabSlug) {
  return lazy(
    () => loadPiece(slug) as Promise<{ default: ComponentType<P> }>,
  );
}

const RoadSigns = pieceLoader<{
  controls?: boolean;
  tuning?: Partial<typeof ROAD_SIGNS_SPARSE>;
}>("road-signs");

const Cartel = pieceLoader<{
  height?: string;
  controls?: boolean;
  spin?: { fps?: number };
  bob?: { fps?: number };
  glideFps?: number;
}>("cartel");

const PointerTilt = pieceLoader<{ stepFps?: number }>("pointer-tilt");

const CSS = `
.smt { color: #2b2722; font-family: var(--font-neue-montreal), "Helvetica Neue", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
.smt .mono { font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; }
.smt-intro { max-width: 640px; margin: 0 0 40px; font-size: 13px; line-height: 1.5; color: #57514a; }
.smt-intro h1 { margin: 0 0 6px; font: 500 13px/normal var(--font-neue-montreal-extra), var(--font-sans), sans-serif; color: #2b2722; letter-spacing: .02em; text-transform: uppercase; }
.smt-master { display: flex; gap: 8px; align-items: center; margin-top: 14px; font-size: 12px; }

.smt-section { padding: 24px 0 36px; border-top: 1px solid rgba(43, 39, 34, .12); }
.smt-head { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: baseline; margin-bottom: 18px; font-size: 12px; }
.smt-head b { font-weight: 500; letter-spacing: .02em; }
.smt-head span { color: #57514a; }
.smt-notes { max-width: 640px; margin: 0 0 18px; padding: 0 0 0 14px; font-size: 11.5px; line-height: 1.45; color: #57514a; }
.smt-notes li { margin: 0 0 4px; }
.smt-stage { display: grid; justify-items: center; align-content: center; min-height: 240px; padding: 24px; overflow: visible; }

.smt-toggle { display: inline-flex; border: 1px solid rgba(43, 39, 34, .35); border-radius: 999px; overflow: hidden; }
.smt-toggle button { font: inherit; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; padding: 5px 12px; background: transparent; color: #2b2722; border: 0; }
.smt-toggle button[aria-pressed="true"] { background: #2b2722; color: #fff; }
.smt-btn { font: inherit; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; padding: 5px 12px; border: 1px solid rgba(43, 39, 34, .35); border-radius: 999px; background: transparent; color: #2b2722; }
.smt-btn:hover { background: rgba(43, 39, 34, .06); }
.smt-range { display: inline-flex; gap: 8px; align-items: center; font-size: 11px; }
.smt-range input { width: 120px; }

/* The entrances board */
.smt-board { position: relative; display: grid; grid-template-columns: 220px 1fr 200px; gap: 28px; align-items: start; padding: 28px; background: #f3efe9; border: 1px solid rgba(43, 39, 34, .12); }
.smt-board .kind { position: absolute; top: -8px; left: 8px; font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: rgba(43, 39, 34, .5); }
.smt-item { position: relative; }
.smt-polaroid { box-sizing: border-box; width: 200px; padding: 10px 10px 34px; background: #fff; box-shadow: 0 0 0 1px rgba(43, 39, 34, .2), 0 10px 18px rgba(0, 0, 0, .12); }
.smt-polaroid .pic { aspect-ratio: 1 / 1.1; background: linear-gradient(160deg, #e9e5de, #d6d0c6); }
.smt-tape { position: absolute; top: -10px; left: 60px; width: 76px; height: 22px; background: rgba(255, 220, 120, .8); box-shadow: 0 1px 2px rgba(0, 0, 0, .12); }
.smt-h2 { margin: 0 0 8px; font-size: 26px; font-weight: 600; letter-spacing: -.02em; line-height: 1.05; }
.smt-rule { height: 2px; width: 100%; margin: 4px 0 14px; background: #2b2722; }
.smt-p { margin: 0 0 8px; max-width: 420px; font-size: 14px; line-height: 1.45; color: #57514a; }
.smt-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.smt-chip { display: inline-block; padding: 4px 9px; border: 1px solid #1f4fc2; color: #1f4fc2; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }
.smt-card { box-sizing: border-box; padding: 16px; background: #fff; border: 1px solid rgba(43, 39, 34, .15); box-shadow: 0 8px 20px rgba(0, 0, 0, .1); font-size: 12.5px; line-height: 1.4; color: #57514a; }
.smt-card b { display: block; margin-bottom: 6px; color: #2b2722; font-weight: 500; }
.smt-stamp { position: absolute; right: -8px; bottom: -14px; padding: 4px 8px; border: 2px solid #c2392b; color: #c2392b; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; transform: rotate(-8deg); }
.smt-dot { width: 14px; height: 14px; border-radius: 50%; background: #c2392b; }
.smt-dots { display: flex; gap: 8px; margin-top: 12px; }

/* A row of every kind, plain, for comparison */
.smt-kinds { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 22px; }
.smt-kinds .tile { display: grid; place-items: center; width: 92px; height: 64px; background: #fff; border: 1px solid rgba(43, 39, 34, .2); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }
`;

function Toggle({
  value,
  onChange,
}: {
  value: Beat;
  onChange: (b: Beat) => void;
}) {
  return (
    <span className="smt-toggle" role="group" aria-label="Beat">
      {(["current", "sparse"] as const).map((b) => (
        <button
          key={b}
          type="button"
          aria-pressed={value === b}
          onClick={() => onChange(b)}
        >
          {b}
        </button>
      ))}
    </span>
  );
}

function Section({
  title,
  sub,
  beat,
  onBeat,
  notes,
  children,
}: {
  title: string;
  sub: string;
  beat?: Beat;
  onBeat?: (b: Beat) => void;
  notes?: string[];
  children: ReactNode;
}) {
  return (
    <section className="smt-section">
      <div className="smt-head">
        <b>{title}</b>
        <span>{sub}</span>
        {beat && onBeat && <Toggle value={beat} onChange={onBeat} />}
      </div>
      {notes && (
        <ul className="smt-notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}

function Loading() {
  return <p className="animate-pulse">Loading piece…</p>;
}

export function StopMotionTrial() {
  const [replay, setReplay] = useState(0);
  const [step, setStep] = useState(90);
  // Decided 2026-09-06: the pieces keep their current beat and the cursor
  // goes sparse (now its default), so the toggles open on that.
  const [signs, setSigns] = useState<Beat>("current");
  const [cartel, setCartel] = useState<Beat>("current");
  const [tilt, setTilt] = useState<Beat>("current");
  const [cursor, setCursor] = useState<Beat>("sparse");
  // Re-mount keys, to replay a piece's mount entrance.
  const [signsRun, setSignsRun] = useState(0);
  const [cartelRun, setCartelRun] = useState(0);

  // The cursor is site-wide and reads its tuning per frame: the toggle
  // writes the singleton ("current" here means the old every-frame draw),
  // and leaving the page puts the site default back.
  useEffect(() => {
    clayCursorTuning.stepFps = cursor === "sparse" ? CURSOR_SPARSE_FPS : 0;
    return () => {
      clayCursorTuning.stepFps = CLAY_CURSOR_DEFAULTS.stepFps;
    };
  }, [cursor]);

  function setAll(b: Beat) {
    setSigns(b);
    setCartel(b);
    setTilt(b);
    setCursor(b);
  }

  const boardKey = `${replay}:${step}`;

  return (
    <div className="smt">
      <style>{CSS}</style>

      <div className="smt-intro">
        <h1>Stop motion — trial</h1>
        <p>
          The punch of arjunr.dev&apos;s appear animations: hard cuts, no
          easing. Three or four held poses about a tenth of a second apart —
          far off, past the mark, a hair short, rest — with a squash on the
          landing and opacity that snaps. Up top, the entrances built that
          way. Below, every piece with its own switch between the beat it
          ships with and the sparse one. Nothing here changes a piece&apos;s
          defaults. The entrances&apos; knobs (beat, distance, overshoot,
          squash, stagger) live on <Link href="/lab/motion" style={{ textDecoration: "underline" }}>/lab/motion</Link>, and what is set
          there applies here and everywhere else.
        </p>
        <div className="smt-master">
          <span>All pieces:</span>
          <button type="button" className="smt-btn" onClick={() => setAll("current")}>
            current
          </button>
          <button type="button" className="smt-btn" onClick={() => setAll("sparse")}>
            sparse
          </button>
        </div>
      </div>

      <Section
        title="Entrances"
        sub="components/motion/Enter — steps(1) keyframes, staggered"
        notes={[
          "Each element is a CSS keyframe animation with steps(1, end): every keyframe is a pose held until the next. Nothing between them.",
          "Stagger hands the children a delay a beat apart, so a section reads as things laid down in order. In view gating waits for the scroll.",
          "Hover the polaroid (two-cut lift) and the chips (a held shake): responses cut too.",
        ]}
      >
        <div className="smt-head" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className="smt-btn"
            onClick={() => setReplay((n) => n + 1)}
          >
            ▶ Replay
          </button>
          <label className="smt-range mono">
            stagger {step}ms
            <input
              type="range"
              min={40}
              max={200}
              step={10}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="smt-board" key={boardKey}>
          <Stagger step={step} base={80}>
            <Enter kind="drop" className="smt-item">
              <div className="smt-polaroid sm-hover-lift">
                <div className="pic" />
              </div>
              <Enter kind="tape" as="span" className="smt-tape" delay={step * 4} />
            </Enter>
            <Enter kind="stamp" as="header" className="smt-item">
              <h2 className="smt-h2">Road signs</h2>
              <Enter kind="rule" className="smt-rule" delay={step * 2} />
              <Stagger step={step} base={step * 3}>
                <Enter kind="slide" as="p" className="smt-p">
                  Three photographed road signs, stacked like a signpost.
                  Hovering one lifts it and steps the others back.
                </Enter>
                <Enter kind="slide" as="p" className="smt-p">
                  Every pose change is walked in a handful of hard cuts on a
                  beat — the claymation pose, overshoot, hold.
                </Enter>
              </Stagger>
              <div className="smt-chips">
                <Stagger step={Math.round(step * 0.8)} base={step * 6}>
                  <Enter kind="pop" as="span" className="smt-chip sm-hover-shake">
                    iOS
                  </Enter>
                  <Enter kind="pop" as="span" className="smt-chip sm-hover-shake">
                    Design system
                  </Enter>
                  <Enter kind="pop" as="span" className="smt-chip sm-hover-shake">
                    End-to-end
                  </Enter>
                </Stagger>
              </div>
            </Enter>
            <Enter kind="unfold" className="smt-item">
              <div className="smt-card">
                <b>Camper</b>
                A desktop file converter with a mocked conversion flow — drop
                files, pick a format, get results.
                <div className="smt-dots">
                  <Stagger step={Math.round(step * 0.7)} base={step * 5}>
                    <Enter kind="pop" className="smt-dot" />
                    <Enter kind="pop" className="smt-dot" style={{ background: "#1f4fc2" }} />
                    <Enter kind="pop" className="smt-dot" style={{ background: "#2b2722" }} />
                  </Stagger>
                </div>
              </div>
              <Enter kind="stamp" as="span" className="smt-stamp mono" delay={step * 7}>
                Live demo
              </Enter>
            </Enter>
          </Stagger>
        </div>

        <div className="smt-kinds" key={`kinds:${boardKey}`}>
          <Stagger step={step} base={step * 8}>
            {ENTER_KINDS.map((kind: EnterKind) => (
              <Enter key={kind} kind={kind} className="tile mono">
                {kind}
              </Enter>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section
        title="Road signs"
        sub="the hover walk, the poke, the rope and the card"
        beat={signs}
        onBeat={setSigns}
        notes={[
          "On mount the signs drop in one after another in hard cuts — the piece's own entrance, on by default. Replay re-mounts it.",
          "Current: seven cuts at 24fps, the poke a 60fps tween, the rope a spring drawn every frame, the card on a CSS overshoot curve with a fade.",
          "Sparse: three cuts at 10fps with overshoot 1.6 / 1.4 and squeeze 0.9; the poke in three cuts on the same beat; the rope's droop drawn on the beat; the card a three-cut stamp, nothing fading.",
        ]}
      >
        <div className="smt-head" style={{ marginBottom: 6 }}>
          <button type="button" className="smt-btn" onClick={() => setSignsRun((n) => n + 1)}>
            ▶ Replay entrance
          </button>
        </div>
        <div className="smt-stage" style={{ justifyItems: "start" }} key={signsRun}>
          <Suspense fallback={<Loading />}>
            <RoadSigns
              controls={false}
              tuning={signs === "sparse" ? ROAD_SIGNS_SPARSE : {}}
            />
          </Suspense>
        </div>
      </Section>

      <Section
        title="Cartel"
        sub="the spin, the idle bob and the pointer glide"
        beat={cartel}
        onBeat={setCartel}
        notes={[
          "Once its frames are decoded the sign stamps in through hard cuts — the piece's own entrance, on by default. Replay re-mounts it.",
          "The photo swaps are already on twos (12fps) and stay there.",
          "Current: the spin sampled at 24fps, the bob on ones (24fps), the pointer glide a 60fps ease between cuts.",
          "Sparse: spin, bob and glide all on the swaps' own beat, 12fps — the whole sign moves on twos. Click it to spin.",
        ]}
      >
        <div className="smt-head" style={{ marginBottom: 6 }}>
          <button type="button" className="smt-btn" onClick={() => setCartelRun((n) => n + 1)}>
            ▶ Replay entrance
          </button>
        </div>
        <div className="smt-stage" key={cartelRun}>
          <Suspense fallback={<Loading />}>
            <Cartel
              height="min(45vh, 380px)"
              controls={false}
              spin={cartel === "sparse" ? CARTEL_SPARSE.spin : {}}
              bob={cartel === "sparse" ? CARTEL_SPARSE.bob : {}}
              glideFps={cartel === "sparse" ? CARTEL_SPARSE.glideFps : 0}
            />
          </Suspense>
        </div>
      </Section>

      <Section
        title="Pointer tilt"
        sub="the spring, drawn on the beat"
        beat={tilt}
        onBeat={setTilt}
        notes={[
          "Current: a motion spring drawn every frame.",
          `Sparse: the same spring, but the tilt only catches up ${POINTER_TILT_SPARSE_FPS} times a second — held poses, and it lands past the pointer and settles because the spring does.`,
        ]}
      >
        <div className="smt-stage">
          <Suspense fallback={<Loading />}>
            <PointerTilt stepFps={tilt === "sparse" ? POINTER_TILT_SPARSE_FPS : 0} />
          </Suspense>
        </div>
      </Section>

      <Section
        title="Clay cursor"
        sub="the lean and the press squish — move the pointer"
        beat={cursor}
        onBeat={setCursor}
        notes={[
          "The tip is glued to the real pointer either way; only the body is cut.",
          "Current: the lean and squish springs drawn every frame — how the cursor was before 2026-09-06. The boil is already stop motion at 6fps.",
          `Sparse: lean and squish drawn ${CURSOR_SPARSE_FPS} times a second. This is now the site default. Flick the pointer sideways and press on the button below to feel it.`,
        ]}
      >
        <div className="smt-stage" style={{ minHeight: 120 }}>
          <button type="button" className="smt-btn sm-press">
            press me
          </button>
        </div>
      </Section>
    </div>
  );
}
