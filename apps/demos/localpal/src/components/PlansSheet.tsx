/**
 * Content of the "Your plans" sheet — the state the calendar button morphs
 * into (Figma 1384:2240 normal / 1384:2445 day-of / 1384:2685 RSVP'd).
 *
 * Coordinates are sheet-relative; the surface is full-bleed (393 wide, top at
 * 129) and runs past the screen bottom so its bottom corners never show.
 *
 * One scroll region holds everything: the "Your plans" title, the FOCUSED
 * card (the next plan, big and white) and the "Next up" list of joined venue
 * events. The focused card has three faces on the same 300×50 plate:
 *
 *   normal        → white-on-brand day/time plate ("MONDAY 20:30")
 *   day-of        → slide-to-RSVP slider (drag the knob past ~70% to commit)
 *   day-of+RSVP'd → live countdown ("2:34h left!") + check knob, and the
 *                   card grows to reveal the "On their way" attendee list
 *
 * Day-of + RSVP state lives in PlansProvider (toggle/reset from Lab → Plans).
 * A bottom brand fade + the floating "Propose a plan" CTA sit over the list,
 * exactly like the venue sheet's fade/CTA pattern.
 */
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Squircle } from "./Squircle";
import { PeerPin } from "./PeerPin";
import { AvatarCluster } from "./AvatarCluster";
import { useMotion, usePressFeedback } from "./MotionProvider";
import { usePlansState, formatCountdown } from "./PlansProvider";
import { useDragScroll } from "./useDragScroll";
import { layerZoom, layerZoomStyle } from "../theme/motion";
import { figmaIcons } from "./icons/figmaIcons";
import { BackChevron } from "./icons/BackChevron";
import { CheckIcon } from "./icons/CheckIcon";
import { CrossIcon } from "./icons/CrossIcon";
import { color, device } from "../theme/tokens";
import { capTrim, textButtonReset as buttonReset } from "../theme/resets";
import { VENUES, type VenueId } from "../data/venues";
import type { PeerPlan } from "../data/peerPlans";
import {
  FOCUSED_PLAN,
  FOCUSED_META,
  NEXT_UP,
  ON_THEIR_WAY,
  ON_THEIR_WAY_COUNT,
} from "../data/myPlans";

/** Surface geometry the calendar button morphs to (Figma 1384:2489: full-bleed,
 *  top at 129, running ~94px past the screen bottom so no bottom corners). */
export const PLANS = { x: 0, y: 129, w: 393, h: 817.5 };

const VISIBLE_H = device.height - PLANS.y; // 723 — band of the sheet on screen
const PAD_X = 32;
const COL_W = PLANS.w - PAD_X * 2; // 329
const CONTENT_TOP = 36; // "Your plans" title top (Figma 165.11 − 129)

// Focused-card plate / slider (Figma 1384:2320 / 2524): 300×50, knob 38.
const TRACK = { w: 300.26, h: 50 };
const KNOB = 38;
const KNOB_INSET = 6;
const KNOB_MAX_X = TRACK.w - KNOB - KNOB_INSET * 2; // ≈ 224
const RSVP_THRESHOLD = 0.7; // fraction of the run that commits the RSVP

// Next-up rows — same recipe as the venue sheet's event cards.
const ROW_H = 72;
const BADGE = { w: 90, h: 50 };

// Bottom chrome (Figma 1384:2406 / 2407): fade at 665, CTA at 745 (screen).
const FADE = { top: 665 - PLANS.y, h: 187 };
const CTA = { top: 745 - PLANS.y, w: 301.33, h: 64 };

/* ------------------------------------------------------------------ */
/* The focused card's bottom plate: day/time ⇄ RSVP slider ⇄ countdown  */
/* ------------------------------------------------------------------ */

function RsvpSlider() {
  const { rsvped, setRsvped, target } = usePlansState();
  const snap = useMotion("snap");

  const x = useMotionValue(rsvped ? KNOB_MAX_X : 0);
  const drag = useRef<{ startX: number } | null>(null);
  // "slide to RSVP" fades as the knob covers it (and stays gone once RSVP'd).
  const slideLabelOpacity = useTransform(x, [0, KNOB_MAX_X * 0.55], [1, 0]);

  const onKnobDown = (e: ReactPointerEvent) => {
    if (rsvped) return;
    e.stopPropagation();
    drag.current = { startX: e.clientX - x.get() };
    // Guarded: a stray/synthetic pointer id can throw NotFoundError (the
    // capture-stage auto-drag drives this with synthesized PointerEvents).
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* no active pointer — track without capture */
    }
  };
  const onKnobMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    x.set(Math.min(KNOB_MAX_X, Math.max(0, e.clientX - drag.current.startX)));
  };
  const onKnobUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (x.get() > KNOB_MAX_X * RSVP_THRESHOLD) {
      animate(x, KNOB_MAX_X, snap);
      setRsvped(true);
    } else {
      animate(x, 0, snap);
    }
  };

  // Live countdown — re-renders every 30s while visible.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!rsvped) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [rsvped]);

  return (
    <Squircle
      role="slider"
      fill={color.brand}
      // The slider owns its pointer events — a drag must not tap the card.
      onPointerDown={(e: ReactPointerEvent) => e.stopPropagation()}
      onClick={(e: ReactPointerEvent) => e.stopPropagation()}
      style={{
        width: TRACK.w,
        height: TRACK.h,
        position: "relative",
        flexShrink: 0,
        cursor: "default",
      }}
    >
      {/* centered invite label (pre-RSVP) */}
      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: color.lavender,
          fontSize: 12,
          fontWeight: 400,
          opacity: slideLabelOpacity,
          pointerEvents: "none",
        }}
      >
        slide to RSVP
      </motion.span>

      {/* left-aligned live countdown (post-RSVP) */}
      <motion.span
        initial={false}
        animate={{ opacity: rsvped ? 1 : 0 }}
        transition={snap}
        style={{
          position: "absolute",
          left: 12,
          top: 0,
          height: "100%",
          display: "flex",
          alignItems: "center",
          color: color.lavender,
          fontSize: 12,
          fontWeight: 400,
          pointerEvents: "none",
          ...capTrim,
        }}
      >
        {target ? formatCountdown(target, now) : ""}
      </motion.span>

      {/* the knob — drag right to RSVP; morphs chevron → check on commit */}
      <motion.div
        onPointerDown={onKnobDown}
        onPointerMove={onKnobMove}
        onPointerUp={onKnobUp}
        style={{
          position: "absolute",
          left: KNOB_INSET,
          top: KNOB_INSET,
          x,
          width: KNOB,
          height: KNOB,
          touchAction: "none",
          cursor: rsvped ? "default" : "grab",
        }}
      >
        <Squircle
          role="sliderKnob"
          fill={color.offWhite}
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
          }}
        >
          {/* chevron and check swap with the snap spring (see the × pattern) */}
          <motion.span
            initial={false}
            animate={{
              scale: rsvped ? 0.4 : 1,
              opacity: rsvped ? 0 : 1,
              rotate: rsvped ? 90 : 0,
            }}
            transition={snap}
            style={{ gridArea: "1 / 1", display: "grid", placeItems: "center" }}
          >
            {/* BackChevron points left; flip it to point along the slide */}
            <span style={{ display: "block", transform: "rotate(180deg)" }}>
              <BackChevron height={14} color={color.brand} />
            </span>
          </motion.span>
          <motion.span
            initial={false}
            animate={{
              scale: rsvped ? 1 : 0.4,
              opacity: rsvped ? 1 : 0,
              rotate: rsvped ? 0 : -90,
            }}
            transition={snap}
            style={{ gridArea: "1 / 1", display: "grid", placeItems: "center" }}
          >
            <CheckIcon size={15} color={color.brand} strokeWidth={2.4} />
          </motion.span>
        </Squircle>
      </motion.div>
    </Squircle>
  );
}

/* ------------------------------------------------------------------ */
/* The focused (next-up) plan card                                      */
/* ------------------------------------------------------------------ */

export function FocusedPlanCard({
  onOpen,
}: {
  onOpen: (plan: PeerPlan) => void;
}) {
  const { dayOf, rsvped } = usePlansState();
  const press = usePressFeedback();

  // Animate the "On their way" panel to an EXPLICITLY measured height, not
  // `height: 'auto'`: framer measures the auto target once at animation start
  // and can over-measure it, so the panel eases past its final height and then
  // snaps back a frame later (visible as a brief over-extension on the capture
  // RSVP stage). The content box is always laid out (visibility-hidden when
  // closed), so its offsetHeight is the true final height at all times.
  const otwRef = useRef<HTMLDivElement>(null);
  const [otwH, setOtwH] = useState(0);
  useLayoutEffect(() => {
    const h = otwRef.current?.offsetHeight ?? 0;
    setOtwH((prev) => (prev !== h ? h : prev));
  });

  return (
    <motion.button
      {...press}
      onClick={() => onOpen(FOCUSED_PLAN)}
      style={{ ...buttonReset, flexShrink: 0 }}
    >
      <Squircle
        role="planCard"
        fill={color.white}
        style={{
          width: COL_W,
          boxSizing: "border-box",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
          }}
        >
          <span
            style={{
              color: color.brand,
              fontSize: 20,
              fontWeight: 600,
              lineHeight: "20px",
              width: 297,
              wordBreak: "break-word",
            }}
          >
            {FOCUSED_PLAN.title}
          </span>
          {/* who's going */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <AvatarCluster />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  color: color.muted,
                  fontSize: 12,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                {FOCUSED_PLAN.goingNames}
              </span>
              <span
                style={{
                  color: color.muted,
                  fontSize: 8,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                and +{Math.max(0, FOCUSED_PLAN.goingCount - 2)} others are going
              </span>
            </div>
          </div>
        </div>

        {/* the 300×50 plate: day/time normally, the RSVP slider on the day */}
        {dayOf ? (
          <RsvpSlider />
        ) : (
          <Squircle
            role="slider"
            fill={color.brand}
            style={{
              width: TRACK.w,
              height: TRACK.h,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box",
              padding: "0 16px 0 12.6px",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              <span
                style={{
                  color: color.onBrand,
                  fontSize: 8,
                  fontWeight: 600,
                  ...capTrim,
                }}
              >
                {FOCUSED_META.dayTag}
              </span>
              <span
                style={{
                  color: color.onBrand,
                  fontSize: 24,
                  fontWeight: 600,
                  ...capTrim,
                }}
              >
                {FOCUSED_META.time}
              </span>
            </div>
            <img
              src={figmaIcons.chevron}
              alt=""
              style={{ width: 8, height: 11.33, display: "block" }}
            />
          </Squircle>
        )}

        {/* "On their way" — grows open once you RSVP (day-of only). The panel
            is INFORMATION appearing, so its height reveals on a monotonic ease
            LOCKED to the content's layer-zoom (matching ease + in/out timing +
            in-delay) — never the bouncy `morph` spring, which overshoots the
            content height and briefly extends the card past where it settles
            (visible as an empty white void on the capture RSVP stage). Height
            now grows exactly as the list zooms in: no gap, no over-extension. */}
        <motion.div
          initial={false}
          animate={{ height: dayOf && rsvped ? otwH : 0 }}
          transition={{
            duration:
              (dayOf && rsvped ? layerZoom.inMs : layerZoom.outMs) / 1000,
            ease: [0.22, 1, 0.36, 1],
            delay: dayOf && rsvped ? layerZoom.inDelayMs / 1000 : 0,
          }}
          style={{ width: "100%", overflow: "hidden" }}
        >
          <div
            ref={otwRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingTop: 4,
              paddingBottom: 4,
              ...layerZoomStyle(dayOf && rsvped, "child"),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  color: color.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  ...capTrim,
                }}
              >
                On their way
              </span>
              <span
                style={{
                  color: color.muted,
                  fontSize: 10,
                  fontWeight: 600,
                  opacity: 0.6,
                  ...capTrim,
                }}
              >
                {ON_THEIR_WAY_COUNT.going} of {ON_THEIR_WAY_COUNT.total}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ON_THEIR_WAY.map((a) => (
                <div
                  key={a.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <PeerPin size={33.7} height={35.4} />
                      {/* blue "on their way" tick over the tile's corner */}
                      <div
                        style={{
                          position: "absolute",
                          left: 24.6,
                          top: 25.3,
                          width: 13,
                          height: 13,
                          borderRadius: "50%",
                          background: color.brand,
                          display: "grid",
                          placeItems: "center",
                          zIndex: 2,
                        }}
                      >
                        <CheckIcon
                          size={7}
                          color={color.offWhite}
                          strokeWidth={3}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        color: color.muted,
                        fontSize: 12,
                        fontWeight: 500,
                        ...capTrim,
                      }}
                    >
                      {a.name}
                    </span>
                  </div>
                  <span
                    style={{
                      color: color.muted,
                      fontSize: 10,
                      fontWeight: 500,
                      opacity: 0.6,
                      ...capTrim,
                    }}
                  >
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Squircle>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* The sheet                                                            */
/* ------------------------------------------------------------------ */

export function PlansSheet({
  onOpenPlan,
  onOpenEvent,
  onPropose,
}: {
  /** Tapping the focused card opens its peer activity card. */
  onOpenPlan: (plan: PeerPlan) => void;
  /** Tapping a "Next up" row opens that venue event's activity card. */
  onOpenEvent: (venueId: VenueId, eventId: string) => void;
  /** The floating "Propose a plan" CTA — opens the create-plan flow. */
  onPropose?: () => void;
}) {
  const press = usePressFeedback();
  const listDrag = useDragScroll("y");
  const { createdPlans } = usePlansState();

  return (
    <>
      {/* grabber handle */}
      <Squircle
        radius={2}
        smoothing={1}
        fill="#fefefe"
        style={{
          position: "absolute",
          left: (PLANS.w - 53) / 2,
          top: 8,
          width: 53,
          height: 4,
          zIndex: 1,
        }}
      />

      {/* One scroll region: title + focused card + next-up list */}
      <div
        {...listDrag}
        style={{
          position: "absolute",
          left: 0,
          top: CONTENT_TOP,
          width: PLANS.w,
          height: VISIBLE_H - CONTENT_TOP,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: `0 ${PAD_X}px 200px`,
          overflowY: "auto",
          scrollbarWidth: "none",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <span
          style={{
            color: color.onBrand,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: "26px",
            flexShrink: 0,
          }}
        >
          Your plans
        </span>

        <FocusedPlanCard onOpen={onOpenPlan} />

        {/* Next up */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                color: color.onBrand,
                fontSize: 16,
                fontWeight: 500,
                ...capTrim,
              }}
            >
              Next up
            </span>
            <span
              style={{
                color: color.lavenderDim,
                fontSize: 16,
                fontWeight: 500,
                ...capTrim,
              }}
            >
              see all
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Plans minted by the create-plan flow land on top of the list */}
            {createdPlans.map((cp) => (
              <motion.button
                key={cp.plan.id}
                {...press}
                onClick={() => onOpenPlan(cp.plan)}
                style={{ ...buttonReset, flexShrink: 0 }}
              >
                <Squircle
                  role="card"
                  fill={color.brandDeep}
                  style={{
                    width: COL_W,
                    height: ROW_H,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 12px",
                    boxSizing: "border-box",
                  }}
                >
                  <Squircle
                    role="badge"
                    fill={color.offWhite}
                    style={{
                      width: BADGE.w,
                      height: BADGE.h,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        color: color.brandDeep,
                        fontSize: 8,
                        fontWeight: 600,
                        ...capTrim,
                      }}
                    >
                      {cp.dayTag}
                    </span>
                    <span
                      style={{
                        color: color.brandDeep,
                        fontSize: 24,
                        fontWeight: 600,
                        ...capTrim,
                      }}
                    >
                      {cp.time}
                    </span>
                  </Squircle>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        color: color.onBrand,
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: "16px",
                      }}
                    >
                      {cp.plan.title}
                    </span>
                    <span
                      style={{
                        color: color.lavender,
                        fontSize: 12,
                        fontWeight: 500,
                        ...capTrim,
                      }}
                    >
                      {cp.meta}
                    </span>
                  </div>
                  <img
                    src={figmaIcons.chevron}
                    alt=""
                    style={{
                      width: 8,
                      height: 11.33,
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                </Squircle>
              </motion.button>
            ))}
            {NEXT_UP.map(({ venueId, eventId }) => {
              const ev = VENUES[venueId].events.find((e) => e.id === eventId);
              if (!ev) return null;
              return (
                <motion.button
                  key={`${venueId}:${eventId}`}
                  {...press}
                  onClick={() => onOpenEvent(venueId, eventId)}
                  style={{ ...buttonReset, flexShrink: 0 }}
                >
                  <Squircle
                    role="card"
                    fill={color.brandDeep}
                    style={{
                      width: COL_W,
                      height: ROW_H,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 12px",
                      boxSizing: "border-box",
                    }}
                  >
                    <Squircle
                      role="badge"
                      fill={color.offWhite}
                      style={{
                        width: BADGE.w,
                        height: BADGE.h,
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          color: color.brandDeep,
                          fontSize: 8,
                          fontWeight: 600,
                          ...capTrim,
                        }}
                      >
                        {ev.day}
                      </span>
                      <span
                        style={{
                          color: color.brandDeep,
                          fontSize: 24,
                          fontWeight: 600,
                          ...capTrim,
                        }}
                      >
                        {ev.time}
                      </span>
                    </Squircle>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: color.onBrand,
                          fontSize: 16,
                          fontWeight: 500,
                          lineHeight: "16px",
                        }}
                      >
                        {ev.title}
                      </span>
                      <span
                        style={{
                          color: color.lavender,
                          fontSize: 12,
                          fontWeight: 500,
                          ...capTrim,
                        }}
                      >
                        {ev.meta}
                      </span>
                    </div>
                    <img
                      src={figmaIcons.chevron}
                      alt=""
                      style={{
                        width: 8,
                        height: 11.33,
                        display: "block",
                        flexShrink: 0,
                      }}
                    />
                  </Squircle>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom brand fade over the scrolling list */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: FADE.top,
          width: PLANS.w,
          height: FADE.h,
          background:
            "linear-gradient(to bottom, rgba(44,30,223,0) 0%, rgba(49,33,255,0.9) 96%)",
          pointerEvents: "none",
        }}
      />

      {/* Floating "Propose a plan" CTA — morphs the sheet into the create flow */}
      <motion.button
        {...press}
        onClick={onPropose}
        style={{
          ...buttonReset,
          position: "absolute",
          left: (PLANS.w - CTA.w) / 2,
          top: CTA.top,
        }}
      >
        <Squircle
          role="cta"
          fill={color.offWhite}
          style={{
            width: CTA.w,
            height: CTA.h,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <CrossIcon plus size={17} color={color.brand} />
          <span
            style={{
              color: color.brand,
              fontSize: 24,
              fontWeight: 600,
              lineHeight: "26px",
            }}
          >
            Propose a plan
          </span>
        </Squircle>
      </motion.button>
    </>
  );
}
