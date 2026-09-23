/**
 * The site's spring, for anything that moves on one: the scroll cue's
 * open (cue.tsx), the pill and Framer sketches on /lab/cue, and the
 * contents index (contents.tsx) when it is set to spring.
 */

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/**
 * A spring from rest at 0 to 1, as a period (ms) and a bounce — the
 * damping ratio is 1 - bounce, the stiffness (2π / period)². `at(ms)`
 * is where it is; `settle` is the ms after which it stays within a
 * two-hundredth of 1 — the length the open is given.
 */
export function spring(period: number, bounce: number) {
  const z = Math.min(1, Math.max(0, 1 - bounce));
  const w0 = (2 * Math.PI) / Math.max(period / 1000, 0.01);
  let at: (ms: number) => number;
  let envelope: (s: number) => number;
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    at = (ms) => {
      const s = ms / 1000;
      return (
        1 -
        Math.exp(-z * w0 * s) *
          (Math.cos(wd * s) + ((z * w0) / wd) * Math.sin(wd * s))
      );
    };
    envelope = (s) => Math.exp(-z * w0 * s) / Math.sqrt(1 - z * z);
  } else {
    at = (ms) => {
      const s = ms / 1000;
      return 1 - Math.exp(-w0 * s) * (1 + w0 * s);
    };
    envelope = (s) => Math.exp(-w0 * s) * (1 + w0 * s);
  }
  let settle = 10;
  while (settle < 5000 && envelope(settle / 1000) > 0.005) settle += 5;
  return { at, settle };
}

/** The spring as a CSS easing over its settle: linear() through 48 of
 *  its points. */
export function springEasing(period: number, bounce: number) {
  const { at, settle } = spring(period, bounce);
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++)
    pts.push(n(i === 48 ? 1 : at((settle * i) / 48), 4));
  return { easing: `linear(${pts.join(", ")})`, settle };
}
