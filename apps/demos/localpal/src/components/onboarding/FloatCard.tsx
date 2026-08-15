/**
 * FloatCard — a floating white onboarding surface for "The Playground". Step
 * bodies hover over the toy city in the venue-lozenge language: a soft idle
 * bob plus the FloatingSquircle treatment (even ambient shadow + the card's
 * own silhouette squashed onto the floor as a contact pool).
 *
 * PERF: the bob is the shared `lp-onb-bob` CSS keyframe (declared by
 * OnboardingFlow) on the SAME element as the ambient filter — the filtered
 * card rasterizes once and the compositor moves it; no main-thread work per
 * frame. The contact pool is static (its breathing was invisible nuance at
 * real cost: an infinite loop re-compositing a blurred layer).
 *
 * Width is fluid (the step column); height is measured live (ResizeObserver)
 * so the floor shadow always matches the card's real silhouette.
 */
import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Squircle } from "../Squircle";
import { useSquircle } from "../SquircleProvider";
import { useFloatShadow } from "../FloatShadowProvider";
import { useMotion } from "../MotionProvider";
import { color } from "../../theme/tokens";

export function FloatCard({
  children,
  pad = 20,
  style,
}: {
  children: ReactNode;
  pad?: number;
  style?: CSSProperties;
}) {
  const float = useMotion("float");
  const s = useFloatShadow();
  const sq = useSquircle("onbCard");
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setDims({ w: el.offsetWidth, h: el.offsetHeight }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One full up-and-back per two float cycles (same clock as the stickers).
  const bobDur = ((float as { duration?: number }).duration ?? 1) * 2;
  const shadowW = (dims?.w ?? 0) * s.contactWidthRatio;

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      {/* Contact shadow: the card's silhouette squashed onto the floor. */}
      {dims && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: dims.h + s.contactOffset - shadowW / 2,
            width: shadowW,
            height: shadowW,
            marginLeft: -shadowW / 2,
            transform: `scaleY(${s.contactSquash})`,
            filter: `blur(${s.contactBlur}px)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <Squircle
            radius={sq.radius * s.contactWidthRatio}
            smoothing={sq.smoothing}
            fill={`rgba(${s.color},${s.contactOpacity})`}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}

      {/* The card itself: compositor bob + soft even ambient shadow. */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          filter: `drop-shadow(0 1px 2px rgba(${s.color},${s.ambientNear})) drop-shadow(0 0 2px rgba(${s.color},${s.ambientFar}))`,
          animation: `lp-onb-bob ${bobDur}s ease-in-out infinite`,
          willChange: "transform",
        }}
      >
        <div ref={ref}>
          <Squircle
            role="onbCard"
            fill={color.white}
            style={{ width: "100%", padding: pad, boxSizing: "border-box" }}
          >
            {children}
          </Squircle>
        </div>
      </div>
    </div>
  );
}
