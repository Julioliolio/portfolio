/**
 * The Messages flow — a FOURTH morphing squircle surface (next to BottomBar's
 * two and the ProfileFlow one). One persistent full-screen surface that grows
 * out of the map's chat button (the same per-frame superellipse morph the rest
 * of the app uses) and hosts a flat two-level nav stack:
 *
 *   chat button ──tap──▶ inbox (all conversations)
 *        ▲                   │
 *        └──── × ────────────┴──row──▶ thread (bubbles + composer)
 *                                          ▲
 *                                          └── ‹ back to inbox
 *
 * Entry points (both routed through MapHome's `messagesStack`):
 *   - the round chat button on the map → opens the inbox
 *   - "Enter groupchat" on a joined plan → opens (or spins up) that plan's
 *     group thread, with back returning to the inbox
 *
 * Flat navigation per the house rules: the inbox zooms away as you push into a
 * thread (layerZoomStyle), the back arrow / × returns — nothing ever stacks as
 * a sheet-over-sheet. Corners come from the registry (`bubble`, `card`,
 * `field`, `control`), motion from the registry roles (`morph`, `entrance`,
 * `press`). Sending a message appends it locally (no backend).
 */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { getSvgPath } from "figma-squircle";
import { Squircle } from "../Squircle";
import { useSquircle } from "../SquircleProvider";
import { useMotion, usePressFeedback } from "../MotionProvider";
import { useDragScroll } from "../useDragScroll";
import { useDragDismiss, SheetGrabber, DismissScrim } from "../sheetDismiss";
import { PeerPin } from "../PeerPin";
import { BackChevron } from "../icons/BackChevron";
import { figmaIcons } from "../icons/figmaIcons";
import { color, device } from "../../theme/tokens";
import { layerZoomStyle, lerp } from "../../theme/motion";
import { capTrim, textButtonReset as buttonReset } from "../../theme/resets";
import { PEOPLE, personTag } from "../../data/people";
import type { PeerPlan } from "../../data/peerPlans";
import {
  CONVERSATIONS,
  conversationName,
  previewLine,
  senderFirstName,
  synthConversationForPlan,
  type ChatMessage,
  type Conversation,
} from "../../data/conversations";

/* ------------------------------------------------------------------ */
/* Nav stack                                                            */
/* ------------------------------------------------------------------ */

export type MessagesView =
  | { kind: "inbox" }
  | { kind: "thread"; conversationId?: string; plan?: PeerPlan };

const viewKey = (v: MessagesView) =>
  v.kind === "inbox"
    ? "inbox"
    : `thread:${v.conversationId ?? (v.plan ? `plan:${v.plan.id}` : "?")}`;

/* ------------------------------------------------------------------ */
/* Geometry                                                             */
/* ------------------------------------------------------------------ */

// Rest shape = the map's chat button (BottomBar: left 24.22, top 676.88, 40×40).
const REST = { x: 24.22, y: 676.88, w: 40, h: 40 };
// Open shape = almost-full-screen, matching the "Your plans" sheet: full-bleed,
// top at 129 (a map strip stays above), rounded top corners, running off the
// bottom so its bottom corners never show (PlansSheet PLANS = 0,129,393,817.5).
const OPEN = { x: 0, y: 129, w: device.width, h: 817.5 };
const VISIBLE_H = device.height - OPEN.y; // 723 — band of the sheet on screen

const PAD_X = 20;
// Surface-relative layout (content lives in the visible band; the surface runs
// off-screen below, so anchor by top + height, never by bottom).
const HEAD_TOP = 24; // header row top
const SEARCH_TOP = HEAD_TOP + 44;
const INBOX_LIST_TOP = SEARCH_TOP + 48 + 16;
const THREAD_HEAD_H = 52;
const THREAD_LIST_TOP = HEAD_TOP + THREAD_HEAD_H + 12;
const COMPOSER_H = 48;
const COMPOSER_TOP = VISIBLE_H - 40 - COMPOSER_H; // 40px clear of the home indicator

const ellipsis: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/* ------------------------------------------------------------------ */
/* Small glyphs                                                         */
/* ------------------------------------------------------------------ */

/** Paper-plane send glyph — inline SVG (no baked raster), takes any color. */
function SendGlyph({
  size = 20,
  color: c = color.brand,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M3.4 11.2 20 3.5c.6-.3 1.2.3.9.9L13.2 21c-.3.6-1.2.5-1.4-.1l-2-6.1a1 1 0 0 0-.6-.6l-6.1-2c-.7-.2-.8-1.1-.1-1.4Z"
        fill={c}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Avatars                                                              */
/* ------------------------------------------------------------------ */

/** A conversation's lead avatar: the shared placeholder tile (1:1) or a 2-tile
 *  placeholder stack (group) — the same PeerPin guides used across the app. */
function ConversationAvatar({
  conv,
  size = 48,
}: {
  conv: Conversation;
  size?: number;
}) {
  const isGroup = conv.kind === "group" && (conv.memberIds?.length ?? 0) >= 2;
  if (!isGroup) {
    return <PeerPin size={size} height={size * 1.05} />;
  }
  const tile = size * 0.72;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 1.05,
        flexShrink: 0,
      }}
    >
      <PeerPin
        size={tile}
        height={tile * 1.05}
        stroke={color.brandDeep}
        strokeWidth={2}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          transform: "rotate(6deg)",
        }}
      />
      <PeerPin
        size={tile}
        height={tile * 1.05}
        stroke={color.brandDeep}
        strokeWidth={2}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "rotate(-6deg)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inbox                                                                */
/* ------------------------------------------------------------------ */

function InboxRow({
  conv,
  onOpen,
}: {
  conv: Conversation;
  onOpen: () => void;
}) {
  const press = usePressFeedback();
  const unread = conv.unread > 0;
  return (
    <motion.button
      {...press}
      onClick={onOpen}
      style={{ ...buttonReset, width: "100%", flexShrink: 0 }}
    >
      <Squircle
        role="card"
        fill={color.brandDeep}
        style={{
          width: "100%",
          height: 76,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
          boxSizing: "border-box",
        }}
      >
        <ConversationAvatar conv={conv} size={48} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              color: color.onBrand,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "16px",
              ...ellipsis,
            }}
          >
            {conversationName(conv)}
          </span>
          <span
            style={{
              color: unread ? color.onBrand : color.lavender,
              fontSize: 13,
              fontWeight: unread ? 500 : 400,
              lineHeight: "15px",
              maxWidth: "100%",
              ...ellipsis,
            }}
          >
            {previewLine(conv)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: unread ? color.onBrand : color.lavender,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {conv.updatedLabel}
          </span>
          {unread ? (
            <span
              style={{
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                boxSizing: "border-box",
                borderRadius: 10,
                background: color.white,
                color: color.brand,
                fontSize: 12,
                fontWeight: 600,
                display: "grid",
                placeItems: "center",
                lineHeight: 1,
              }}
            >
              {conv.unread}
            </span>
          ) : (
            <span style={{ width: 20, height: 20 }} />
          )}
        </div>
      </Squircle>
    </motion.button>
  );
}

function InboxView({
  conversations,
  onOpen,
}: {
  conversations: Conversation[];
  onOpen: (conv: Conversation) => void;
}) {
  const dragScroll = useDragScroll("y");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = conversationName(c).toLowerCase();
      const preview = previewLine(c).toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }, [conversations, query]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Header: title (drag the grabber down to dismiss, like the plans sheet) */}
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          right: PAD_X,
          top: HEAD_TOP,
        }}
      >
        <span
          style={{
            color: color.onBrand,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: "36px",
          }}
        >
          Messages
        </span>
      </div>

      {/* Search field */}
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          right: PAD_X,
          top: SEARCH_TOP,
        }}
      >
        <Squircle
          role="field"
          fill={color.brandDeep}
          style={{
            width: "100%",
            height: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
            boxSizing: "border-box",
          }}
        >
          <img
            src={figmaIcons.search}
            alt=""
            width={15}
            height={15}
            style={{ display: "block", flexShrink: 0, opacity: 0.9 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: color.onBrand,
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 400,
            }}
          />
        </Squircle>
      </div>

      {/* Conversation list */}
      <div
        {...dragScroll}
        style={{
          position: "absolute",
          left: PAD_X,
          right: PAD_X,
          top: INBOX_LIST_TOP,
          height: VISIBLE_H - INBOX_LIST_TOP - 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          scrollbarWidth: "none",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {filtered.length === 0 ? (
          <span
            style={{
              color: color.lavender,
              fontSize: 14,
              fontWeight: 400,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            No conversations match “{query}”.
          </span>
        ) : (
          filtered.map((conv) => (
            <InboxRow key={conv.id} conv={conv} onOpen={() => onOpen(conv)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thread                                                               */
/* ------------------------------------------------------------------ */

/** A run of consecutive messages from the same sender (one avatar + name). */
type Run = {
  fromMe: boolean;
  senderKey: string;
  sample: ChatMessage;
  messages: ChatMessage[];
};

function groupRuns(messages: ChatMessage[]): Run[] {
  const runs: Run[] = [];
  for (const m of messages) {
    const senderKey = m.fromMe ? "me" : (m.senderId ?? m.senderName ?? "?");
    const last = runs[runs.length - 1];
    if (last && last.senderKey === senderKey) last.messages.push(m);
    else runs.push({ fromMe: m.fromMe, senderKey, sample: m, messages: [m] });
  }
  return runs;
}

function ThreadView({
  conv,
  isGroup,
  onBack,
  onSend,
}: {
  conv: Conversation;
  isGroup: boolean;
  onBack: () => void;
  onSend: (text: string) => void;
}) {
  const press = usePressFeedback();
  const bubbleSq = useSquircle("bubble");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const runs = useMemo(() => groupRuns(conv.messages), [conv.messages]);

  // Pin to the newest message on open + whenever the count grows.
  const count = conv.messages.length;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  const headerSub = isGroup
    ? (conv.subtitle ?? `${conv.memberIds?.length ?? 0} people`)
    : conv.personId
      ? personTag(PEOPLE[conv.personId]).lines.join(" ")
      : "";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Header: back + avatar + name/sub */}
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          right: PAD_X,
          top: HEAD_TOP,
          height: THREAD_HEAD_H,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <motion.button
          {...press}
          aria-label="Back"
          onClick={onBack}
          style={{
            ...buttonReset,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            width: 24,
            height: 24,
          }}
        >
          <BackChevron height={19} color={color.onBrand} />
        </motion.button>
        <ConversationAvatar conv={conv} size={40} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              color: color.onBrand,
              fontSize: 17,
              fontWeight: 600,
              lineHeight: "18px",
              ...ellipsis,
            }}
          >
            {conversationName(conv)}
          </span>
          {headerSub && (
            <span
              style={{
                color: color.lavender,
                fontSize: 12,
                fontWeight: 400,
                ...ellipsis,
              }}
            >
              {headerSub}
            </span>
          )}
        </div>
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        style={{
          position: "absolute",
          left: PAD_X,
          right: PAD_X,
          top: THREAD_LIST_TOP,
          height: COMPOSER_TOP - THREAD_LIST_TOP - 12,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowY: "auto",
          scrollbarWidth: "none",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {runs.map((run, ri) => (
          <MessageRun
            key={ri}
            run={run}
            isGroup={isGroup}
            bubbleSq={bubbleSq}
            isNewest={ri === runs.length - 1}
          />
        ))}
      </div>

      {/* Composer */}
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          right: PAD_X,
          top: COMPOSER_TOP,
          height: COMPOSER_H,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Squircle
          role="field"
          fill={color.brandDeep}
          style={{
            flex: 1,
            minWidth: 0,
            height: COMPOSER_H,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            boxSizing: "border-box",
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: color.onBrand,
              fontFamily: "inherit",
              fontSize: 16,
              fontWeight: 400,
            }}
          />
        </Squircle>
        <motion.button
          {...press}
          aria-label="Send"
          onClick={send}
          disabled={draft.trim().length === 0}
          style={{
            ...buttonReset,
            flexShrink: 0,
            opacity: draft.trim() ? 1 : 0.45,
            transition: "opacity 160ms ease",
          }}
        >
          <Squircle
            role="control"
            fill={color.white}
            style={{
              width: 48,
              height: 48,
              display: "grid",
              placeItems: "center",
            }}
          >
            <SendGlyph size={20} color={color.brand} />
          </Squircle>
        </motion.button>
      </div>
    </div>
  );
}

function MessageRun({
  run,
  isGroup,
  bubbleSq,
  isNewest,
}: {
  run: Run;
  isGroup: boolean;
  bubbleSq: { radius: number; smoothing: number };
  isNewest: boolean;
}) {
  const entrance = useMotion("entrance");
  const showMeta = isGroup && !run.fromMe;
  const lastTime = run.messages[run.messages.length - 1].time;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        flexDirection: run.fromMe ? "row-reverse" : "row",
      }}
    >
      {/* group incoming: sender placeholder tile aligned to the run's bottom bubble */}
      {showMeta && (
        <div style={{ flexShrink: 0, width: 28 }}>
          <PeerPin size={28} height={29} />
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: run.fromMe ? "flex-end" : "flex-start",
          maxWidth: "76%",
        }}
      >
        {showMeta && (
          <span
            style={{
              color: color.lavender,
              fontSize: 11,
              fontWeight: 500,
              marginLeft: 12,
              ...capTrim,
            }}
          >
            {senderFirstName(run.sample)}
          </span>
        )}
        {run.messages.map((m, i) => {
          // Newest outgoing bubble springs in; everything else is static.
          const content = (
            <SquircleBubble key={m.id} fromMe={m.fromMe} sq={bubbleSq}>
              {m.text}
            </SquircleBubble>
          );
          return isNewest && i === run.messages.length - 1 && m.fromMe ? (
            <motion.div
              key={m.id}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={entrance}
              style={{ transformOrigin: "bottom right" }}
            >
              {content}
            </motion.div>
          ) : (
            content
          );
        })}
        <span
          style={{
            color: color.lavender,
            fontSize: 10,
            fontWeight: 500,
            opacity: 0.8,
            margin: run.fromMe ? "0 6px 0 0" : "0 0 0 6px",
          }}
        >
          {lastTime}
        </span>
      </div>
    </div>
  );
}

/** A single chat bubble, clipped to the registry `bubble` squircle. */
function SquircleBubble({
  fromMe,
  sq,
  children,
}: {
  fromMe: boolean;
  sq: { radius: number; smoothing: number };
  children: ReactNode;
}) {
  return (
    <Squircle
      radius={sq.radius}
      smoothing={sq.smoothing}
      fill={fromMe ? color.white : color.bubbleOnBrand}
      style={{
        maxWidth: "100%",
        color: fromMe ? color.brand : color.onBrand,
        fontSize: 15,
        fontWeight: 400,
        lineHeight: "19px",
        padding: "10px 14px",
        wordBreak: "break-word",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Squircle>
  );
}

/* ------------------------------------------------------------------ */
/* The flow: morphing surface + inbox/thread layers                     */
/* ------------------------------------------------------------------ */

export function MessagesFlow({
  stack,
  onPush,
  onPop,
  onClose,
}: {
  /** Live nav stack (owned by MapHome). Empty = closed. */
  stack: MessagesView[];
  onPush: (view: MessagesView) => void;
  onPop: () => void;
  onClose: () => void;
}) {
  const controlSq = useSquircle("control");
  const sheetSq = useSquircle("sheet");
  const morph = useMotion("morph");
  const snap = useMotion("snap");

  const open = stack.length > 0;

  // Session conversation state (seeded from mock data). Sending appends;
  // opening a thread clears its unread. Plan-synthesized threads are inserted
  // on first send/open so they persist for the session.
  const [convMap, setConvMap] = useState<Record<string, Conversation>>(() =>
    Object.fromEntries(CONVERSATIONS.map((c) => [c.id, c])),
  );
  const conversations = useMemo(
    () =>
      Object.values(convMap).sort((a, b) => {
        // Unread first, then by most-recently touched (mock: keep seed order).
        if (a.unread !== b.unread) return b.unread - a.unread;
        return 0;
      }),
    [convMap],
  );

  // Resolve a thread view to a concrete conversation (stored or transient).
  const resolveConv = (
    v: Extract<MessagesView, { kind: "thread" }>,
  ): Conversation | null => {
    if (v.conversationId) return convMap[v.conversationId] ?? null;
    if (v.plan) {
      const existing = Object.values(convMap).find(
        (c) => c.planId === v.plan!.id,
      );
      return existing ?? synthConversationForPlan(v.plan);
    }
    return null;
  };

  // Clear unread when the top view is a thread (on open / when it changes).
  const top = open ? stack[stack.length - 1] : null;
  const topThreadId =
    top?.kind === "thread"
      ? (top.conversationId ?? (top.plan ? `plan:${top.plan.id}` : null))
      : null;
  useEffect(() => {
    if (!top || top.kind !== "thread") return;
    const conv = resolveConv(top);
    if (!conv) return;
    setConvMap((prev) => {
      const cur = prev[conv.id];
      // Insert transient plan threads; clear unread on the resolved one.
      if (!cur) return { ...prev, [conv.id]: { ...conv, unread: 0 } };
      if (cur.unread === 0) return prev;
      return { ...prev, [conv.id]: { ...cur, unread: 0 } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topThreadId]);

  const sendTo = (conv: Conversation, text: string) => {
    setConvMap((prev) => {
      const cur = prev[conv.id] ?? conv;
      const msg: ChatMessage = {
        id: `me-${cur.messages.length}-${text.length}`,
        fromMe: true,
        text,
        time: "Now",
      };
      return {
        ...prev,
        [conv.id]: {
          ...cur,
          messages: [...cur.messages, msg],
          updatedLabel: "Now",
          unread: 0,
        },
      };
    });
  };

  /* ---- surface morph: chat button ⇄ almost-full-screen sheet ---- */
  const m = useMotionValue(0);
  useEffect(() => {
    const c = animate(m, open ? 1 : 0, morph);
    return () => c.stop();
  }, [open, m, morph]);

  const left = useTransform(m, (t) => lerp(REST.x, OPEN.x, t));
  const topY = useTransform(m, (t) => lerp(REST.y, OPEN.y, t));
  const width = useTransform(m, (t) => lerp(REST.w, OPEN.w, t));
  const height = useTransform(m, (t) => lerp(REST.h, OPEN.h, t));
  // Round button → sheet corners (like the plans sheet; the bottom runs off
  // screen so only the rounded top corners ever show).
  const radius = useTransform(m, (t) =>
    lerp(controlSq.radius, sheetSq.radius, t),
  );
  const smooth = useTransform(m, () => sheetSq.smoothing);
  const clipPath = useTransform(
    [width, height, radius, smooth],
    ([w, h, r, s]) =>
      `path('${getSvgPath({ width: w as number, height: h as number, cornerRadius: r as number, cornerSmoothing: s as number })}')`,
  );
  // Surface fades in fast at the very start of the grow (it starts exactly on
  // the button, so no pop); content arrives once there's room.
  const surfaceOpacity = useTransform(m, [0, 0.16], [0, 1]);
  const contentOpacity = useTransform(m, [0.4, 1], [0, 1]);

  // Keep popped layers mounted so their zoom-out completes (ActivitySheet
  // pattern): a strict prefix of what we last rendered keeps the longer list.
  const layersRef = useRef<MessagesView[]>([]);
  const prev = layersRef.current;
  const isPrefix =
    stack.length < prev.length &&
    stack.every((v, i) => viewKey(v) === viewKey(prev[i]));
  const layers = open ? (isPrefix ? prev : stack) : prev;
  layersRef.current = layers;
  const topKey = open ? viewKey(stack[stack.length - 1]) : null;

  /* ---- grabber drag-to-dismiss + map-tap dismiss (shared primitives) ---- */
  const { dragY, handleProps } = useDragDismiss({
    onDismiss: onClose,
    threshold: 90,
    cancelTransition: snap,
    dismissTransition: morph,
  });

  // The drag hitzone covers the whole header band (much easier to grab than a
  // thin strip) but stops above the scroll list so it never blocks scrolling,
  // and — in a thread — clears the back button on the left so it stays tappable.
  const activeView = (open ? stack : layers)[
    (open ? stack : layers).length - 1
  ] ?? { kind: "inbox" as const };
  const inThread = activeView.kind === "thread";
  const dragZone = inThread
    ? { left: 56, height: THREAD_LIST_TOP - 4 }
    : { left: 0, height: SEARCH_TOP - 8 };

  return (
    <>
      {/* Tap the exposed map strip to dismiss (shared with every sheet). */}
      <DismissScrim active={open} onDismiss={onClose} zIndex={44} />
      <motion.div
        style={{
          position: "absolute",
          left,
          top: topY,
          y: dragY,
          width,
          height,
          clipPath,
          background: color.brand,
          opacity: surfaceOpacity,
          zIndex: 45, // above all map chrome + profile, below SystemUI (60)
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <motion.div
          style={{ position: "absolute", inset: 0, opacity: contentOpacity }}
        >
          {layers.map((view, i) => {
            const key = viewKey(view);
            const visible = key === topKey;
            const hiddenAs = i < stack.length - 1 ? "parent" : "child";
            let content: ReactNode = null;
            if (view.kind === "inbox") {
              content = (
                <InboxView
                  conversations={conversations}
                  onOpen={(conv) =>
                    onPush({ kind: "thread", conversationId: conv.id })
                  }
                />
              );
            } else {
              const conv = resolveConv(view);
              if (conv) {
                content = (
                  <ThreadView
                    conv={conv}
                    isGroup={conv.kind === "group"}
                    onBack={onPop}
                    onSend={(text) => sendTo(conv, text)}
                  />
                );
              }
            }
            return (
              <div
                key={key}
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: visible ? undefined : "none",
                  ...layerZoomStyle(visible, hiddenAs),
                }}
              >
                {content}
              </div>
            );
          })}

          {/* Grabber pill + drag-to-dismiss hitzone (shared). The hitzone covers
            the header band but stops above the scroll list and clears the
            thread's back button, so it never eats content taps. */}
          <SheetGrabber
            handleProps={handleProps}
            left={dragZone.left}
            height={dragZone.height}
          />
        </motion.div>
      </motion.div>
    </>
  );
}
