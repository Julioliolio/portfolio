/**
 * The mock-AI "thinking" moment — three staged status lines while the search
 * pretends to reason ("Reading your vibe… Scanning plans nearby… Matching ☀️
 * sunny plans…"), then hands off to the results.
 *
 * Deliberately calm: stage advancement runs on wall-clock `setTimeout` and the
 * line swap is a CSS ease-out (duration read from the `inform` motion role) —
 * NEVER a spring. Progress that overshoots lies about state, and rAF-driven
 * motion values freeze in throttled/background tabs (same precedent as
 * `layerZoomStyle` / `useScramble`), which would strand the theater mid-think.
 */
import { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";
import { figmaIcons } from "./icons/figmaIcons";
import { color } from "../theme/tokens";

/** Per-line dwell — 3 lines ≈ 1.05s of thinking, snappy but legible. */
const STEP_MS = 350;

export function ThinkingTheater({
  lines,
  onDone,
}: {
  lines: string[];
  onDone: () => void;
}) {
  const inform = useMotion("inform");
  const [step, setStep] = useState(0);
  // Keep the latest callback without re-arming the timer chain.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => {
      if (step < lines.length - 1) setStep(step + 1);
      else onDoneRef.current();
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [step, lines.length]);

  const dur =
    "duration" in inform && typeof inform.duration === "number"
      ? inform.duration
      : 0.2;

  return (
    <div style={{ position: "relative", height: 20 }}>
      <style>{`
        @keyframes lp-theater-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes lp-theater-pulse { from { opacity: 0.55; } to { opacity: 1; } }
      `}</style>
      <div
        // Keyed per step: each line enters fresh with the ease-out rise.
        key={step}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          animation: `lp-theater-in ${dur}s ease-out both`,
        }}
      >
        <img
          src={figmaIcons.shootingStar}
          alt=""
          style={{
            width: 16,
            height: 16,
            display: "block",
            animation: "lp-theater-pulse 0.7s ease-in-out infinite alternate",
          }}
        />
        <span style={{ color: color.lavender, fontSize: 14, fontWeight: 500 }}>
          {lines[step]}
        </span>
      </div>
    </div>
  );
}
