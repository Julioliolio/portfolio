/**
 * First-plan tour popups — the little guides that walk a fresh user from the
 * reveal to their first joined plan (skippable at every beat):
 *
 *   TourBanner  — iOS-notification-style announcement sliding from the top
 *   TourBubble  — white coach bubble with a tail, anchored to a control or pin
 *   FirstPlanCard — the milestone celebration when the first plan is joined
 *                   (the memoir's "pequeños reconocimientos en los hitos")
 *
 * All surfaces read the squircle registry (`banner` / `tooltip` / `planCard`
 * roles) and the motion registry (`morph` slide, `entrance`/`pop` pops); the
 * beat state machine lives in MapHome — these are purely presentational.
 */
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { Squircle } from "../Squircle";
import { useMotion, usePressFeedback } from "../MotionProvider";
import { CrossIcon } from "../icons/CrossIcon";
import { figmaIcons } from "../icons/figmaIcons";
import { color, font, shadow } from "../../theme/tokens";

const buttonReset: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

/** Small ✕ that kills the whole tour — present on every popup. */
function SkipDot({ onSkip }: { onSkip: () => void }) {
  const press = usePressFeedback();
  return (
    <motion.button
      {...press}
      aria-label="Skip the tour"
      onClick={(e) => {
        e.stopPropagation();
        onSkip();
      }}
      style={{
        ...buttonReset,
        display: "grid",
        placeItems: "center",
        width: 18,
        height: 18,
        flexShrink: 0,
      }}
    >
      <CrossIcon size={7} color={color.muted} />
    </motion.button>
  );
}

/**
 * iOS-style notification banner, sliding from the top. The host controls
 * mounting (wrap in AnimatePresence for the slide-away).
 */
export function TourBanner({
  title,
  body,
  onSkip,
}: {
  title: string;
  body: string;
  onSkip: () => void;
}) {
  const morph = useMotion("morph");
  return (
    <motion.div
      initial={{ y: -120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={morph}
      style={{
        position: "absolute",
        top: 66,
        left: 16,
        width: 361,
        zIndex: 70,
        fontFamily: font.family,
      }}
    >
      <Squircle
        role="banner"
        fill={color.white}
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          boxShadow: shadow.fab,
        }}
      >
        {/* app-icon tile — the real LocalPal brand mark (favicon), clipped to
            a squircle so it reads as the app's own notification icon */}
        <Squircle
          role="pin"
          style={{ width: 38, height: 38, overflow: "hidden", flexShrink: 0 }}
        >
          <img
            src="/favicon.svg"
            alt=""
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
            }}
          />
        </Squircle>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: color.ink,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: "16px",
            }}
          >
            {title}
          </span>
          <span
            style={{
              color: color.muted,
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "15px",
            }}
          >
            {body}
          </span>
        </div>
        <SkipDot onSkip={onSkip} />
      </Squircle>
    </motion.div>
  );
}

/**
 * A coach bubble with a little tail. Anchor it yourself (absolute position or
 * inside a map Marker); `tailX` is the tail centre in px from the bubble's
 * left edge ('center' by default). Tail points down at whatever it explains.
 */
export function TourBubble({
  text,
  onSkip,
  width,
  tailX = "center",
  style,
}: {
  text: string;
  onSkip: () => void;
  width?: number;
  tailX?: number | "center";
  style?: CSSProperties;
}) {
  const entrance = useMotion("entrance");
  const tailLeft = tailX === "center" ? "50%" : `${tailX}px`;
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.7, opacity: 0 }}
      transition={entrance}
      style={{
        position: "relative",
        width: width ?? "fit-content",
        maxWidth: 250,
        transformOrigin: `${tailX === "center" ? "50%" : `${tailX}px`} 100%`,
        fontFamily: font.family,
        ...style,
      }}
    >
      <Squircle
        role="tooltip"
        fill={color.white}
        style={{
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 14px",
          boxShadow: shadow.fab,
        }}
      >
        <span
          style={{
            color: color.brand,
            fontSize: 12.5,
            fontWeight: 600,
            lineHeight: "16px",
          }}
        >
          {text}
        </span>
        <SkipDot onSkip={onSkip} />
      </Squircle>
      {/* the tail — a rotated square peeking from under the bubble */}
      <div
        style={{
          position: "absolute",
          left: tailLeft,
          bottom: -5,
          width: 12,
          height: 12,
          background: color.white,
          transform: "translateX(-50%) rotate(45deg)",
          borderRadius: 2.5,
        }}
      />
    </motion.div>
  );
}

/**
 * The first-plan milestone card — pops once the join is confirmed, says its
 * piece, and the host takes it away. Peak-end beat, kept small.
 */
export function FirstPlanCard({ planTitle }: { planTitle: string }) {
  const pop = useMotion("pop");
  return (
    <motion.div
      initial={{ scale: 0.55, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={pop}
      style={{
        position: "absolute",
        left: "50%",
        top: 170,
        transform: "translateX(-50%)",
        zIndex: 70,
        fontFamily: font.family,
      }}
    >
      <Squircle
        role="planCard"
        fill={color.white}
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: "20px 26px",
          boxShadow: shadow.fab,
          minWidth: 220,
        }}
      >
        <img
          src={figmaIcons.shootingStar}
          alt=""
          style={{ width: 26, height: 26, display: "block" }}
        />
        <span
          style={{
            color: color.ink,
            fontSize: 18,
            fontWeight: 600,
            lineHeight: "20px",
          }}
        >
          Your first plan
        </span>
        <span
          style={{
            color: color.brand,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16px",
            textAlign: "center",
            maxWidth: 220,
          }}
        >
          {planTitle}
        </span>
        <span style={{ color: color.muted, fontSize: 12, fontWeight: 400 }}>
          you’re going — see you there
        </span>
      </Squircle>
    </motion.div>
  );
}
