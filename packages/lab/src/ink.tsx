"use client";

import { asset } from "./asset";
import { thicken } from "./boil";
import { createTuningStore } from "./tuning-store";

/**
 * The ink: the case study's type treated as printed on the sheet.
 * Parked (Julio, 2026-09-26: "ditch the whole ink thing, save it
 * somewhere in case I want to use it again") — the site's window is
 * paper alone, and only /lab/ink (pieces/ink) puts this on it: it
 * renders `inkCss()` in a <style> beside the window and <InkFilter>
 * once, and the rules find the page through `.pw-scroll`. To bring it
 * back to the site, a page would render the same two things next to
 * its <ProjectWindow>; the knobs are in this file's own store.
 *
 * The looks, each a switch with its strengths:
 * - density — a mask of the paper's grain (public/paper/ink.webp) under a flat floor, added, so the ink thins
 *   where the fibres are, by as much as the floor lets it; not clipped
 *   to the block, or a title's overshoots and the bleed's shoved pixels
 *   would be cut;
 * - bleed — the edges shoved by a field of noise (the filter), after
 *   the ink is spread out a touch if asked; applied before the mask, as
 *   the browser orders them;
 * - pressure — the filter's last stage: the ink kept in a coarse field
 *   of noise, so some letters print darker than others (his xerox
 *   reference: "some letters printed darker than others. The hand
 *   bears down");
 * - soak — the block multiplied into the paper, the way ink is: black
 *   stays black, a colour takes the paper's grain, nothing lightened
 *   (his references: a newspaper spread, a blue print), and a little
 *   transparent too if asked;
 * - relief — a light below-right and a shade above-left of every
 *   stroke, in the block's own paint, so the bleed shoves them with it;
 * - the photos, films and demos printed too: multiplied into the paper
 *   (a film or a demo re-blends every frame), the photos under the
 *   grain as well.
 *
 * What was learnt, for whoever brings it back:
 * - A ground (type.tsx's .ty-ground[data-ground], a block of ink with
 *   the words knocked out) is only ever multiplied in — never filtered
 *   or masked whole: a whole screen of it re-ran the noise whenever
 *   anything in it moved, and the cursor lagged (LocalPal's header).
 *   Its white words get the bleed like any block, never the soak or
 *   the density (white multiplied into blue vanishes).
 * - Fine noise (roughness above ~0.5) reads as blur; he rejected the
 *   fuzz. Anything that lightens the ink (pressure, density low, soak's
 *   transparency) he rejected too: "intense, just with the bleed".
 * - The filter is one octave; each octave is a whole pass over every
 *   block, and Safari runs these on the CPU (never measured there).
 * - The scroller must not be a stacking context (no z-index) or the
 *   multiplies see only its own transparent backdrop; the box isolates.
 */

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** A switch, as the store can hold it. */
export type Toggle = "on" | "off";

export type InkTuning = {
  /** The ink's colour, hex: the page's type (type.tsx's --ty-fg). */
  ink: string;
  /** What is printed matter: the type, the photos, the films, the
   *  demos. Films and demos re-blend on every frame — costly. */
  inkText: Toggle;
  inkPhotos: Toggle;
  inkFilms: Toggle;
  inkDemos: Toggle;
  /** Density: the fibres eating into the strokes. `density` is the
   *  floor, 0 to 1: how much ink stays where the grain is thinnest —
   *  0 the raw grain, 1 no effect. */
  inkDensity: Toggle;
  density: number;
  /** Bleed: the edges roughened. `bleed` is how far they are shoved,
   *  px; `roughness` how fine the noise is, cycles per px; `spread`
   *  how far the ink is fattened out first, px (0 for none). */
  inkBleed: Toggle;
  bleed: number;
  roughness: number;
  spread: number;
  /** Pressure: the hand bearing down unevenly — some letters printed
   *  darker than others. `pressure` is the floor, 0 to 1: how much ink
   *  the lightest letter keeps; `pressureScale` how big the swells of
   *  it are, px — about a word. */
  inkPressure: Toggle;
  pressure: number;
  pressureScale: number;
  /** Soak: the ink multiplied into the paper, as printed ink is —
   *  black stays black, a colour takes the paper's grain, nothing
   *  lightened. `soak` (0 to .4) makes the strokes that much
   *  transparent as well; 0 for none. */
  inkSoak: Toggle;
  soak: number;
  /** Relief: the type pressed into the paper — a light below-right
   *  and a shade above-left, `relief` px off, at their alphas. */
  inkRelief: Toggle;
  relief: number;
  reliefLight: number;
  reliefShade: number;
};

/** Where Julio left it (2026-09-26): solid ink, the bleed, the soak's
 *  multiply, the grain into it a little; the rest here to try. */
export const INK_DEFAULTS: Readonly<InkTuning> = Object.freeze({
  ink: "#000517",
  inkText: "on",
  inkPhotos: "off",
  inkFilms: "off",
  inkDemos: "off",
  inkDensity: "off",
  density: 0.8,
  inkBleed: "on",
  bleed: 1.1,
  roughness: 1.5,
  spread: 0.15,
  inkPressure: "off",
  pressure: 0.73,
  pressureScale: 22,
  inkSoak: "on",
  soak: 0,
  inkRelief: "off",
  relief: 0.5,
  reliefLight: 0.35,
  reliefShade: 0.08,
});

const store = createTuningStore("ink-tuning", INK_DEFAULTS);
export const setInkTuning = store.set;
export const resetInkTuning = store.reset;
export const useInkTuning = store.useTuning;

/** The type the ink is printed on: the page's blocks of text, never
 *  one inside another (a p in a li). `textSel` takes every block, the
 *  words knocked out of a ground included; `textOutSel` only those on
 *  the paper — what soaks, thins and stands in relief. */
const TEXT = "h1, h2, h3, h4, p, li, dt, dd, figcaption, cite";
const textSel = (scope: string) => `${scope} :is(${TEXT}):not(:is(${TEXT}) *)`;
const textOutSel = (scope: string) => `${textSel(scope)}:not([data-ground] *)`;
const groundSel = (scope: string) => `${scope} [data-ground]`;

/** The ink's rules for a tuning, over a window's `.pw-scroll`: only
 *  the switched-on looks are written. Empty when the type is not
 *  printed at all. */
export function inkCss(t: InkTuning): string {
  const on = (k: keyof InkTuning) => t[k] === "on";
  const text = textSel(".pw-scroll");
  const textOut = textOutSel(".pw-scroll");
  const ground = groundSel(".pw-scroll");
  const mask = `-webkit-mask-composite: source-over; mask-image: url(${asset("/paper/ink.webp")}), linear-gradient(rgba(0, 0, 0, ${n(t.density)}) 0 0); mask-mode: luminance, alpha; mask-size: 512px 512px, auto; mask-repeat: repeat; mask-composite: add; mask-clip: no-clip;`;
  const rules: string[] = [];
  if (on("inkText")) {
    rules.push(`.pw-scroll .ty { --ty-fg: ${t.ink}; }`);
    if (on("inkDensity")) rules.push(`${textOut} { ${mask} }`);
    if (on("inkBleed") || on("inkPressure"))
      rules.push(`${text} { filter: url(#pw-ink); }`);
    if (on("inkSoak")) {
      rules.push(
        `${textOut} { mix-blend-mode: multiply;${t.soak > 0 ? ` opacity: ${n(1 - t.soak)};` : ""} }`,
      );
      rules.push(`${ground} { mix-blend-mode: multiply; }`);
    }
    if (on("inkRelief"))
      rules.push(
        `${textOut} { text-shadow: ${n(t.relief, 2)}px ${n(t.relief, 2)}px 0 rgba(255, 255, 255, ${n(t.reliefLight)}), -${n(t.relief, 2)}px -${n(t.relief, 2)}px 0 rgba(0, 0, 0, ${n(t.reliefShade)}); }`,
      );
  }
  if (on("inkPhotos")) {
    rules.push(`.pw-scroll img { mix-blend-mode: multiply; }`);
    if (on("inkDensity")) rules.push(`.pw-scroll img { ${mask} }`);
  }
  if (on("inkFilms"))
    rules.push(`.pw-scroll video { mix-blend-mode: multiply; }`);
  if (on("inkDemos"))
    rules.push(`.pw-scroll iframe { mix-blend-mode: multiply; }`);
  return rules.join("\n");
}

/** Whether the filter is wanted at all for a tuning. */
export const inkFiltered = (t: InkTuning) =>
  t.inkText === "on" && (t.inkBleed === "on" || t.inkPressure === "on");

/**
 * The ink's filter, in stages, each there when its switch is on:
 * - the bleed: with `spread` the ink is first fattened out by that
 *   many px (the boil's hairline maths: a blur re-thresholded, so the
 *   new edge is a true edge), the way ink spreads into fibres; then
 *   the edges are shoved by a field of noise — one held frame of the
 *   boil (boil.tsx), fine and small;
 * - the pressure: the hand bearing down unevenly. A coarse field of
 *   noise (a swell about a word wide) becomes an alpha between the
 *   floor and 1, and the ink is kept "in" it, so one letter prints
 *   darker than the next.
 * The region is grown so the shoved pixels have room; sRGB so the
 * anti-aliased edges keep their weight. Pointed at by
 * `filter: url(#pw-ink)`. Render it once on the page.
 */
export function InkFilter({ t }: { t: InkTuning }) {
  const bleed = t.inkBleed === "on";
  const spread = bleed && t.spread > 0 ? thicken(t.spread) : null;
  const pressure = t.inkPressure === "on";
  let last = "SourceGraphic";
  return (
    <svg width={0} height={0} aria-hidden style={{ position: "absolute" }}>
      <filter
        id="pw-ink"
        x="-2%"
        y="-12%"
        width="104%"
        height="124%"
        colorInterpolationFilters="sRGB"
      >
        {spread && (
          <>
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={spread.sigma}
              result="haze"
            />
            <feComponentTransfer in="haze" result={(last = "spread")}>
              <feFuncA
                type="linear"
                slope={spread.slope}
                intercept={spread.intercept}
              />
            </feComponentTransfer>
          </>
        )}
        {bleed && (
          <>
            {/* One octave: the noise is at pixel scale already, and
                each octave is a whole pass over every block. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={n(t.roughness)}
              numOctaves={1}
              seed={7}
              result="noise"
            />
            <feDisplacementMap
              in={last}
              in2="noise"
              scale={n(t.bleed, 2)}
              xChannelSelector="R"
              yChannelSelector="G"
              result={(last = "bled")}
            />
          </>
        )}
        {pressure && (
          <>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={n(1 / Math.max(t.pressureScale, 1), 4)}
              numOctaves={1}
              seed={3}
              result="hand"
            />
            {/* The noise's red, stretched about its middle, as an alpha
                between the floor and 1; no colour, so "in" keeps the
                ink's own. */}
            <feColorMatrix
              in="hand"
              type="matrix"
              values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${n(2 * (1 - t.pressure))} 0 0 0 ${n(t.pressure - (1 - t.pressure) * 0.5)}`}
              result="press"
            />
            <feComposite in={last} in2="press" operator="in" />
          </>
        )}
      </filter>
    </svg>
  );
}
