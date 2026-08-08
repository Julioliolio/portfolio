import { useEffect, useRef, useState } from 'react';

/**
 * Text scramble: characters resolve left-to-right out of noise, length easing
 * toward the target — a persistent button label reads as one plate changing
 * its mind. Wall-clock setInterval (not rAF) so it always converges in
 * throttled tabs; duration should ride the `snap` role (glyph-morph
 * personality). Shared by the venue/activity CtaRow and the create-plan
 * footer ("Next" ⇄ "Create plan").
 */
export function useScramble(target: string, ms: number) {
  const [text, setText] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    fromRef.current = target;
    const CHARS = 'abcdefghijklmnopqrstuvwxyz';
    const start = performance.now();
    const id = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / ms);
      if (t >= 1) {
        setText(target);
        clearInterval(id);
        return;
      }
      const len = Math.round(from.length + (target.length - from.length) * t);
      const reveal = Math.floor(target.length * t);
      let out = target.slice(0, Math.min(reveal, len));
      for (let i = out.length; i < len; i++)
        out += target[i] === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)];
      setText(out);
    }, 34);
    return () => clearInterval(id);
  }, [target, ms]);
  return text;
}
