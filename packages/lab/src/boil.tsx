"use client";

import { useEffect, useRef } from "react";
import { createTuningStore } from "./tuning-store";

/**
 * The boil: the way a claymation hold never quite sits still. Whatever
 * wears a boil filter has its outlines shoved by a field of noise, and
 * the field is cut between held frames — a different seed each — at a
 * few frames a second, so the letters wobble in place without ever
 * sliding. The run of seeds is long and shuffled, so no frame comes
 * round soon enough to be seen coming. The hero's words boil under
 * the pointer.
 *
 * One filter is one frame (`seeds` of one), or a cycle: given several
 * seeds it steps through them at `boilFps`, discretely, while `on`
 * (from `delay` ms after) — an SVG animation on the noise's seed, which
 * the browser re-renders through.
 *
 * Sized in pixels from the words' em, so the same numbers give the same
 * feel at any size: the noise `boilWave` swells across a span of BOIL_EM
 * ems, a third more down, `boilGrain` octaves
 * deep, and the shove `boilShove` percent of that span, never under
 * `boilFloor` px. (The browser
 * reads these in pixels whatever units the filter declares, hence the
 * arithmetic rather than objectBoundingBox.)
 *
 * The numbers are a `BoilTuning`; /lab/boil is its bench, and the store
 * is a tuning store like the motion one: values are kept in this
 * browser until Reset, and every boil reads them live. Lock a feel in
 * by pasting the bench's values into BOIL_DEFAULTS.
 */

export type BoilTuning = {
  /** Boil frames a second: each frame is held for 1 / this. Claymation
   *  holds boil at about four to five. */
  boilFps: number;
  /** How far the outlines are shoved, percent of the span. */
  boilShove: number;
  /** The least shove, px: small words would otherwise barely move. */
  boilFloor: number;
  /** How many swells of noise across the span: few and whole strokes
   *  bend, many and the edges fray. */
  boilWave: number;
  /** Octaves of finer noise laid over the swells, 1 to 3. */
  boilGrain: number;
};

// Julio's numbers off the bench, 2026-09-16: five frames a second, a
// 2.5% shove of broad, smooth noise.
const BOIL_DEFAULTS: Readonly<BoilTuning> = Object.freeze({
  boilFps: 5,
  boilShove: 2.5,
  boilFloor: 3,
  boilWave: 1.5,
  boilGrain: 1,
});

const store = createTuningStore<BoilTuning>("portfolio.boil", BOIL_DEFAULTS);
export const setBoilTuning = store.set;
export const resetBoilTuning = store.reset;
export const useBoilTuning = store.useTuning;

/** The span the tuning's wave and shove are measured across, ems: the
 *  width of the word the numbers were tuned on ("projects", Medium, 71
 *  units at an em of 20). */
const BOIL_EM = 71 / 20;

/** The seeds of a cycle, sixteen in a shuffled order: at five frames a
 *  second a frame comes round every three seconds and change, and no
 *  two in a row are alike, so the boil reads as random. */
export const BOIL_SEEDS: readonly number[] = [
  7, 41, 14, 33, 21, 58, 3, 47, 26, 11, 52, 19, 38, 61, 29, 44,
];

/** The least blur the browser will draw, px: below this it draws none. */
const BLUR_LEAST = 0.75;
/** φ, the standard normal's density. */
const normalPdf = (x: number) =>
  Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);

/** Φ, the standard normal's cumulative distribution (Abramowitz and
 *  Stegun 7.1.26, good to a few parts in ten million). */
function normalCdf(x: number) {
  const z = Math.abs(x) / Math.SQRT2;
  const q = 1 / (1 + 0.3275911 * z);
  const poly =
    q *
    (0.254829592 +
      q *
        (-0.284496736 +
          q * (1.421413741 + q * (-1.453152027 + q * 1.061405429))));
  const erf = 1 - poly * Math.exp(-z * z);
  return 0.5 * (1 + (x < 0 ? -erf : erf));
}

/**
 * One boil filter, `id`, for words set at `em` px. Put it in an
 * `<svg width={0} height={0}>` and point `filter: url(#id)` at it. With
 * `hair` (px) it also draws a hairline: the glyph is thickened by half
 * of it all round before the shove, so the line and the fill are one
 * shape and can never drift apart — a text-stroke under a filter can,
 * the fill sitting on a subpixel grid and the stroke on the path. The
 * thickening is a blur re-thresholded: an edge blurred by σ has alpha
 * Φ(-r / σ) at r outside it, and a ramp through that level puts the
 * new edge there — its slope the blur's own gradient there, so a pixel
 * the new edge crosses gets its true coverage, a pixel soft like any
 * drawn edge — not a dilation, which the browser rounds to whole
 * pixels, and with σ never under BLUR_LEAST, under which the browser
 * skips the blur. After
 * the shove the edge's alpha is steepened, so the resampling reads as
 * a bend, not a blur; and the filter works in sRGB, so anti-aliased
 * edges keep their weight instead of darkening. One seed is one held
 * frame; several cycle while `on`, from the first
 * seed each time, `delay` ms after `on` (never under reduced motion:
 * the first seed holds).
 */
export function BoilFilter({
  id,
  em,
  seeds,
  on = true,
  delay = 0,
  hair = 0,
}: {
  id: string;
  em: number;
  seeds: readonly number[];
  on?: boolean;
  delay?: number;
  /** A hairline to draw around the words, px, 0 for none. */
  hair?: number;
}) {
  const t = useBoilTuning();
  const anim = useRef<SVGAnimateElement>(null);
  const span = BOIL_EM * em;
  const cycles = seeds.length > 1;
  // The hairline's outset, the blur that draws it and the alpha level
  // the new edge sits at (see above).
  const outset = hair / 2;
  const sigma = Math.max(outset, BLUR_LEAST);
  const level = normalCdf(-outset / sigma);
  const ramp = sigma / normalPdf(outset / sigma);
  useEffect(() => {
    if (!cycles || !on) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = anim.current;
    const timer = window.setTimeout(() => el?.beginElement(), delay);
    return () => {
      window.clearTimeout(timer);
      el?.endElement();
    };
  }, [cycles, on, delay]);
  return (
    <filter
      id={id}
      x="-0.3"
      y="-0.3"
      width="1.6"
      height="1.6"
      colorInterpolationFilters="sRGB"
    >
      {hair > 0 && (
        <>
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={sigma}
            result="haze"
          />
          <feComponentTransfer in="haze" result="haired">
            <feFuncA
              type="linear"
              slope={ramp}
              intercept={0.5 - level * ramp}
            />
          </feComponentTransfer>
        </>
      )}
      <feTurbulence
        type="fractalNoise"
        baseFrequency={`${t.boilWave / span} ${(t.boilWave * 1.33) / (span * 0.8)}`}
        numOctaves={t.boilGrain}
        seed={seeds[0]}
        result="noise"
      >
        {cycles && (
          <animate
            ref={anim}
            attributeName="seed"
            values={seeds.join(";")}
            calcMode="discrete"
            dur={`${seeds.length / t.boilFps}s`}
            begin="indefinite"
            repeatCount="indefinite"
          />
        )}
      </feTurbulence>
      <feDisplacementMap
        in={hair > 0 ? "haired" : "SourceGraphic"}
        in2="noise"
        scale={Math.max(t.boilFloor, (t.boilShove / 100) * span)}
        xChannelSelector="R"
        yChannelSelector="G"
      />
      <feComponentTransfer>
        <feFuncA type="linear" slope={2.2} intercept={-0.6} />
      </feComponentTransfer>
    </filter>
  );
}
