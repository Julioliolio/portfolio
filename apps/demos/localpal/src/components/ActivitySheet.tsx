/**
 * Content of the activity sheet — the state the BottomBar surface morphs into
 * when an activity opens (Figma 1300:3843 / 1300:4562 / 1300:4743). Unlike the
 * full-bleed venue sheet this is an inset floating card (362 wide, ~40% down
 * the screen), and it hosts a small NAVIGATION STACK of three content views:
 *
 *   venue activity card ──"Going together"──▶ peer-plans list ──row──▶ peer card
 *
 * The stack itself lives in MapHome (peer pins push onto it too); this
 * component only renders it. Views swap IN PLACE with wall-clock CSS
 * transitions + trailing visibility, not rAF-driven springs — same reasoning
 * as BottomBar's CROSSFADE (throttled/background tabs freeze rAF mid-swap).
 * Popped views stay mounted (hidden) so the fade-out always completes.
 *
 * Each view is a natural-height flow COLUMN (grabber pad · content region ·
 * CTA-row spacer), and the sheet reports the active view's measured height up
 * to the BottomBar, which morphs the surface to fit — so a short peer card
 * shrinks instead of leaving blank space, while a long list caps out and
 * scrolls. The CTA row itself is PERSISTENT chrome (`FooterCtaRow`): one row
 * pinned to the bottom edge across all levels — label scrambles, plate width
 * and price morph, plus glyph and back chevron persist.
 */
import type { CSSProperties, ReactNode, Ref } from "react";
import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Squircle } from "./Squircle";
import { PeerPin } from "./PeerPin";
import { useDragScroll } from "./useDragScroll";
import { layerZoomStyle } from "../theme/motion";
import { AvatarCluster } from "./AvatarCluster";
import { usePressFeedback } from "./MotionProvider";
import { figmaIcons } from "./icons/figmaIcons";
import { color } from "../theme/tokens";
import {
  VENUES,
  dayLabel,
  type VenueId,
  type VenueEvent,
  type Venue,
} from "../data/venues";
import { PEER_PLANS, planOthers, type PeerPlan } from "../data/peerPlans";
import { personByFirstName, type PersonId } from "../data/people";

/** Surface geometry the BottomBar morphs to (Figma 1300:3897). `h` is only the
 *  fallback/initial height — the real height is measured from the content.
 *  `y` is where the DEFAULT-height sheet tops out; the surface is anchored to
 *  the BOTTOM edge (`ACTIVITY_BOTTOM`), so shorter views shrink upward from a
 *  fixed base instead of leaving a gap above the home indicator. */
export const ACTIVITY = { x: 16, y: 340.3, w: 362, h: 463.6 };
export const ACTIVITY_BOTTOM = ACTIVITY.y + ACTIVITY.h; // ≈ 803.9

/** One entry of the activity navigation stack. */
export type ActivityView =
  | { kind: "event"; venueId: VenueId; eventId: string }
  | { kind: "going"; venueId: VenueId; eventId: string }
  | { kind: "peer"; plan: PeerPlan }
  // Confirmation the peer card morphs into after tapping Join (Figma 1431:5282).
  | { kind: "joined"; plan: PeerPlan };

const viewKey = (v: ActivityView) =>
  v.kind === "peer"
    ? `peer:${v.plan.id}`
    : v.kind === "joined"
      ? `joined:${v.plan.id}`
      : `${v.kind}:${v.venueId}:${v.eventId}`;

const PAD_X = 32;
const COL_W = ACTIVITY.w - PAD_X * 2; // 298
const CTA_H = 64;
const ROW_H = 72;

// Flow-layout metrics: every view is a natural-height column — top pad (clears
// the grabber), a content region, a gap, then the CTA row, bottom pad.
const PAD_TOP = 42; // content start below the grabber (Figma 1300:3920)
const PAD_BOTTOM = 24; // room under the CTA to the sheet's bottom edge
const COL_GAP = 16; // between the content region and the CTA row
// Cap on sheet height — bottom-anchored, so this bounds how far the top edge
// can climb (ACTIVITY_BOTTOM − max ≈ 316, keeping a map strip visible above).
export const ACTIVITY_MAX_H = 488;

const PRICE_W = 40; // slot for short price strings ("$8"), + 12 gap when shown

/** Screen anchor + plate widths for the shared persistent CTA row (CtaRow,
 *  rendered by BottomBar): where the row sits while an activity is open. */
export const ACTIVITY_CTA = {
  x: ACTIVITY.x + PAD_X,
  y: ACTIVITY_BOTTOM - PAD_BOTTOM - CTA_H,
  mainW: COL_W - CTA_H - 12, // 222
  mainWPriced: COL_W - CTA_H - 12 - (PRICE_W + 12), // 170
  priceW: PRICE_W,
};
const MAX_SCROLL_H = ACTIVITY_MAX_H - PAD_TOP - PAD_BOTTOM - COL_GAP - CTA_H; // 342

// Cap-trimmed text (Figma measures type cap-to-cap). Chromium 133+.
const capTrim = {
  textBoxTrim: "trim-both",
  textBoxEdge: "cap text",
} as CSSProperties;

const buttonReset: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

// View swaps ride the shared hierarchical zoom (theme/motion layerZoomStyle),
// direction-aware: pushing deeper, the old view scales past you ('parent');
// popping back, the abandoned view shrinks into where it grew from ('child').

/* ------------------------------------------------------------------ */
/* Shared column: content region (scrolls past the cap) + CTA row       */
/* ------------------------------------------------------------------ */

function ActivityColumn({
  colRef,
  contentGap = 16,
  content,
}: {
  /** Measured by the sheet to size the surface (only the visible view gets it). */
  colRef?: Ref<HTMLDivElement>;
  contentGap?: number;
  content: ReactNode;
}) {
  const dragScroll = useDragScroll("y");
  return (
    <div
      ref={colRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: ACTIVITY.w,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: COL_GAP,
        paddingTop: PAD_TOP,
        paddingBottom: PAD_BOTTOM,
      }}
    >
      <div
        {...dragScroll}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: contentGap,
          padding: `0 ${PAD_X}px`,
          minHeight: 0,
          maxHeight: MAX_SCROLL_H,
          overflowY: "auto",
          scrollbarWidth: "none",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {content}
      </div>
      {/* Spacer where the CTA row sits: the row itself is the PERSISTENT
          footer rendered once by the sheet (it barely changes between levels),
          pinned to the bottom edge outside these swapping layers. Keeping the
          spacer means measured column heights are unchanged. */}
      <div style={{ height: CTA_H, flexShrink: 0 }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

function TitleBlock({
  title,
  address,
  when,
}: {
  title: string;
  address: string;
  when: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            color: color.onBrand,
            fontSize: 24,
            fontWeight: 600,
            lineHeight: "26px",
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: color.lavender,
            fontSize: 12,
            fontWeight: 400,
            ...capTrim,
          }}
        >
          {address}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <img
          src={figmaIcons.clock}
          alt=""
          width={14}
          height={14}
          style={{ display: "block" }}
        />
        <span
          style={{
            color: color.onBrand,
            fontSize: 16,
            fontWeight: 500,
            ...capTrim,
          }}
        >
          {when}
        </span>
      </div>
    </div>
  );
}

function HostRow({
  name,
  sub,
  venueHost = false,
  hostName,
  onOpenProfile,
}: {
  name: string;
  sub: string;
  /** Venue-hosted activities mark the host tile with a white stroke
   *  (Figma 1300:3933); peer hosts wear the plain tile. */
  venueHost?: boolean;
  /** Peer host's first name — if they're a known person, the row wears their
   *  photo and tapping it opens their profile (profiles are only reachable
   *  through shared activities, friends and QRs — this is the activity door). */
  hostName?: string;
  onOpenProfile?: (id: PersonId) => void;
}) {
  const press = usePressFeedback();
  const person = hostName ? personByFirstName(hostName) : null;
  const tappable = person != null && onOpenProfile != null;
  const row = (
    <div
      style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}
    >
      {/* venue hosts wear the square 40 tile; peer hosts the 40×42 arch tile */}
      <PeerPin
        size={40}
        height={venueHost ? 40 : 42}
        stroke={venueHost ? color.offWhite : undefined}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "flex-start",
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
          {name}
        </span>
        <span
          style={{
            color: color.lavender,
            fontSize: 12,
            fontWeight: 400,
            ...capTrim,
          }}
        >
          {sub}
        </span>
      </div>
    </div>
  );
  if (!tappable) return row;
  return (
    <motion.button
      {...press}
      onClick={() => onOpenProfile(person.id)}
      style={{ ...buttonReset, flexShrink: 0, textAlign: "left" }}
    >
      {row}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* View 1 — venue activity card (Figma 1300:3843)                       */
/* ------------------------------------------------------------------ */

function VenueActivityCard({
  venue,
  event,
  onOpenGoing,
  colRef,
}: {
  venue: Venue;
  event: VenueEvent;
  onOpenGoing: () => void;
  colRef?: Ref<HTMLDivElement>;
}) {
  const press = usePressFeedback();
  const plans = event.peerPlanIds.map((id) => PEER_PLANS[id]).filter(Boolean);
  const people = plans.reduce((n, p) => n + p.goingCount, 0);

  return (
    <ActivityColumn
      colRef={colRef}
      content={
        <>
          <TitleBlock
            title={event.title}
            address={venue.address}
            when={`${dayLabel(event.day)} - ${event.time}`}
          />
          <p
            style={{
              color: color.lavender,
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "13px",
              margin: 0,
              flexShrink: 0,
            }}
          >
            {event.description}
          </p>
          <HostRow
            name={`Hosted by ${venue.name}`}
            sub={venue.category}
            venueHost
          />

          {/* Going together → the peer-plans list */}
          <motion.button
            {...press}
            onClick={onOpenGoing}
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
                padding: "0 14px 0 13px",
              }}
            >
              <AvatarCluster />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
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
                  Going together
                </span>
                <span
                  style={{
                    color: color.lavender,
                    fontSize: 12,
                    fontWeight: 500,
                    ...capTrim,
                  }}
                >
                  {plans.length} groups - {people} people going
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
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* View 2 — "Going together" peer-plans list (Figma 1300:4562)          */
/* ------------------------------------------------------------------ */

function GoingTogetherList({
  event,
  onOpenPlan,
  colRef,
}: {
  event: VenueEvent;
  onOpenPlan: (plan: PeerPlan) => void;
  colRef?: Ref<HTMLDivElement>;
}) {
  const press = usePressFeedback();
  const plans = event.peerPlanIds.map((id) => PEER_PLANS[id]).filter(Boolean);

  return (
    <ActivityColumn
      colRef={colRef}
      contentGap={8}
      content={plans.map((plan) => (
        <motion.button
          key={plan.id}
          {...press}
          onClick={() => onOpenPlan(plan)}
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
              gap: 12,
              padding: "0 12px",
            }}
          >
            <PeerPin size={45} height={47.27} />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span
                style={{
                  color: color.onBrand,
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: "16px",
                  ...capTrim,
                }}
              >
                {plan.title}
              </span>
              <span
                style={{
                  color: color.lavender,
                  fontSize: 12,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                {plan.host} - {plan.goingCount} going
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
    />
  );
}

/* ------------------------------------------------------------------ */
/* View 3 — peer activity card (Figma 1300:4743 / 1362:2222)            */
/* ------------------------------------------------------------------ */

function PeerActivityCard({
  plan,
  colRef,
  onOpenProfile,
}: {
  plan: PeerPlan;
  colRef?: Ref<HTMLDivElement>;
  onOpenProfile?: (id: PersonId) => void;
}) {
  return (
    <ActivityColumn
      colRef={colRef}
      content={
        <>
          <TitleBlock
            title={plan.title}
            address={plan.address}
            when={plan.when}
          />
          <HostRow
            name={`Hosted by ${plan.host}`}
            sub={plan.hostLine}
            hostName={plan.host}
            onOpenProfile={onOpenProfile}
          />

          {/* Description plate — the darker rounded box on the peer card */}
          <Squircle
            role="card"
            fill={color.brandDeep}
            style={{ width: COL_W, padding: 13, flexShrink: 0 }}
          >
            <p
              style={{
                color: color.lavender,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: "13px",
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {plan.description}
            </p>
          </Squircle>

          {/* Who's going */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <AvatarCluster />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  color: color.onBrand,
                  fontSize: 16,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                {plan.goingNames}
              </span>
              <span
                style={{
                  color: color.lavender,
                  fontSize: 12,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                and +{planOthers(plan)} others are going
              </span>
            </div>
          </div>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* View 4 — join confirmation (Figma 1431:5282)                         */
/* ------------------------------------------------------------------ */

// Same self-contained shape as CreatePlanSheet's SuccessStep: just the heading
// in the content column. The [Enter groupchat · share] row is the PERSISTENT
// footer (CtaRow) morphing, and the grabber + tap-to-dismiss are the activity
// sheet's own chrome — so tapping outside just ignores the confirmation.
function JoinedCard({ colRef }: { colRef?: Ref<HTMLDivElement> }) {
  return (
    <ActivityColumn
      colRef={colRef}
      content={
        <span
          style={{
            color: color.onBrand,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: "32px",
            wordBreak: "break-word",
            flexShrink: 0,
          }}
        >
          Plan joined successfully!
        </span>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* The sheet: renders the stack, swapping views in place                */
/* ------------------------------------------------------------------ */

export function ActivitySheet({
  stack,
  onPush,
  onHeight,
  onOpenProfile,
}: {
  /** Live navigation stack (BottomBar keeps the last non-empty one while closing). */
  stack: ActivityView[];
  onPush: (view: ActivityView) => void;
  /** Reports the active view's natural height so the surface can size to it. */
  onHeight?: (h: number) => void;
  /** Tapping a known host opens their profile (see HostRow). */
  onOpenProfile?: (id: PersonId) => void;
}) {
  // Keep popped views mounted so their fade-out completes: if the new stack is
  // a strict prefix of what we last rendered, keep rendering the longer list.
  const layersRef = useRef<ActivityView[]>([]);
  const prev = layersRef.current;
  const isPrefix =
    stack.length < prev.length &&
    stack.every((v, i) => viewKey(v) === viewKey(prev[i]));
  const layers = isPrefix ? prev : stack;
  layersRef.current = layers;
  const topKey = stack.length > 0 ? viewKey(stack[stack.length - 1]) : null;

  // Observe the VISIBLE view's column and report its height. The callback ref
  // is handed only to the visible view, so switching views re-points the
  // observer at the new column and reports its height (→ surface morphs to it).
  const onHeightRef = useRef(onHeight);
  onHeightRef.current = onHeight;
  const roRef = useRef<ResizeObserver | null>(null);
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!node) return;
    const report = () => onHeightRef.current?.(node.offsetHeight);
    const ro = new ResizeObserver(report);
    ro.observe(node);
    roRef.current = ro;
    report();
  }, []);

  return (
    <>
      {/* grabber handle (the shared search-sheet one is hidden in this state) */}
      <Squircle
        radius={2}
        smoothing={1}
        fill="#fefefe"
        style={{
          position: "absolute",
          left: (ACTIVITY.w - 53) / 2,
          top: 8.5,
          width: 53,
          height: 4,
          zIndex: 1,
        }}
      />

      {layers.map((view, i) => {
        const key = viewKey(view);
        const visible = key === topKey;
        // Hidden layers BELOW the top are ancestors you zoomed through;
        // layers past the live stack are popped children shrinking back.
        const hiddenAs = i < stack.length - 1 ? "parent" : "child";
        const ref = visible ? measureRef : undefined;
        let content = null;
        if (view.kind === "event" || view.kind === "going") {
          const venue = VENUES[view.venueId];
          const event = venue.events.find((ev) => ev.id === view.eventId);
          if (!event) return null;
          content =
            view.kind === "event" ? (
              <VenueActivityCard
                venue={venue}
                event={event}
                colRef={ref}
                onOpenGoing={() =>
                  onPush({
                    kind: "going",
                    venueId: view.venueId,
                    eventId: view.eventId,
                  })
                }
              />
            ) : (
              <GoingTogetherList
                event={event}
                colRef={ref}
                onOpenPlan={(plan) => onPush({ kind: "peer", plan })}
              />
            );
        } else if (view.kind === "peer") {
          content = (
            <PeerActivityCard
              plan={view.plan}
              colRef={ref}
              onOpenProfile={onOpenProfile}
            />
          );
        } else {
          content = <JoinedCard colRef={ref} />;
        }
        return (
          <div
            key={key}
            style={{
              position: "absolute",
              inset: 0,
              // undefined (inherit), not 'auto': 'auto' would re-enable this
              // view for hit-testing even while the WHOLE activity layer is
              // closed (pointer-events is inherited, and explicit values beat
              // the ancestor's 'none') — an invisible card eating clicks.
              pointerEvents: visible ? undefined : "none",
              ...layerZoomStyle(visible, hiddenAs),
            }}
          >
            {content}
          </div>
        );
      })}
    </>
  );
}
