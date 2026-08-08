/**
 * The profile flow — a THIRD morphing squircle surface next to BottomBar's two
 * (Figma 1431:2201 own profile / 1431:2399 other profile / 1277:816 friended /
 * 1426:1434 QR). One persistent surface, same per-frame superellipse
 * technique:
 *
 *   corner avatar ──tap──▶ own profile sheet
 *        ▲                    ├─ tag card ────▶ route-map mode (MapHome hides
 *        │                    │                 this surface + draws the route)
 *        └────────── × ───────┤
 *                             ├─ friends card ──▶ friends list ──row──▶ their
 *                             │                                        profile
 *                             ├─ organized card ─▶ organized list ─row─▶ plan
 *                             └─ QR button ──grows into──▶ "Add new friends"
 *
 * The AVATAR is a separate morphing element (it overlaps the sheet's top edge,
 * so it can't live inside the clipped surface): opening YOUR profile it
 * travels from the top-right map corner into the 120px header slot — one
 * continuous element. On deeper views (lists / QR) it slips BEHIND the sheet
 * so only its top sliver peeks over the edge, exactly like the Figma QR frame.
 *
 * Content views swap with the shared hierarchical zoom (layerZoomStyle) — the
 * lists grow OUT of the card you tapped (transform-origin at that card), the
 * profile zooms away behind them (flat navigation: nothing ever stacks). The
 * QR button is a real geometry morph: the little white squircle grows into
 * the big QR plate while its glyph crossfades into a REAL scannable QR code.
 *
 * The view STACK lives in MapHome (route mode + plan taps need it there);
 * this component only renders it.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { animate, motion, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { getSvgPath } from 'figma-squircle';
import { Squircle } from '../Squircle';
import { useSquircle } from '../SquircleProvider';
import { useMotion, usePressFeedback } from '../MotionProvider';
import { useDragDismiss, DismissScrim } from '../sheetDismiss';
import { useConfirm } from '../ConfirmProvider';
import { useDragScroll } from '../useDragScroll';
import { useScramble } from '../useScramble';
import { QrCodeSvg } from './QrCodeSvg';
import { PeerPin } from '../PeerPin';
import { useAvatarCluster } from '../AvatarClusterProvider';
import { CrossIcon } from '../icons/CrossIcon';
import { BackChevron } from '../icons/BackChevron';
import { figmaIcons } from '../icons/figmaIcons';
import { color, device } from '../../theme/tokens';
import { layerZoomStyle, layerZoom } from '../../theme/motion';
import {
  PEOPLE,
  ME,
  personTag,
  tagCountLine,
  friendsInCommon,
  type Person,
  type PersonId,
} from '../../data/people';
import { VENUES, type VenueId } from '../../data/venues';
import qrIcon from '../../assets/profile/icon-qr.svg';
import swapIcon from '../../assets/profile/icon-swap.svg';
import cameraIcon from '../../assets/profile/icon-camera.svg';
import shareIcon from '../../assets/profile/icon-share.svg';

/** One entry of the profile navigation stack. */
export type ProfileView =
  | { kind: 'person'; id: PersonId }
  | { kind: 'friends'; id: PersonId }
  | { kind: 'organized'; id: PersonId }
  | { kind: 'qr' };

const viewKey = (v: ProfileView) => (v.kind === 'qr' ? 'qr' : `${v.kind}:${v.id}`);

/* ------------------------------------------------------------------ */
/* Geometry (screen coords, transcribed from the Figma frames)          */
/* ------------------------------------------------------------------ */

// Resting corner avatar (the old map avatar slot, Figma 1320:948).
const REST = { x: 304.5, y: 61.5, s: 58 };
// The 120px header avatar (Figma 1431:2253).
const HEAD = { x: 137.5, y: 95, s: 120 };
// The full profile sheet (Figma 1431:2443: full-bleed, top 119, runs past the
// screen bottom so its bottom corners never show).
const SHEET = { x: -0.5, y: 119, w: 394, h: 798.7 };
// Where a NON-me profile grows from (no shared corner element to morph out
// of — it zooms in from the heart of the card you tapped the host on).
const OTHER_ORIGIN = { x: 166.5, y: 470, w: 60, h: 60 };

// Sheet-relative y = screen y − SHEET.y.
const rel = (screenY: number) => screenY - SHEET.y;

const PAD_X = 32;
const COL_W = 329;
const ROW_H = 72;
const BADGE = { w: 90, h: 50 };

// Person view (sheet-relative).
const CLOSE_BTN = { x: 39.5, y: rel(151), s: 24 };
const TAG_CARD = { x: PAD_X, y: rel(279), w: 328.66, h: 138.19 };
const TAG_GLYPH = { x: 264, y: rel(269) };
const STAT_ROW = { y: rel(429.2), friendsW: 182, countW: 124.84, h: 126.2, gap: 24 };
const LIST_TITLE_Y = rel(579.6);
const LIST_Y = rel(602.6);
const FADE = { y: rel(650), h: 202 };
const QR_BTN = { x: 165, y: rel(745), w: 63, h: 64 };
// Nudged down (was rel(303)) so the peeking profile avatar clears the QR
// heading — the QR reads like a profile header (avatar on top, content below),
// consistent with the friends/organized cards.
const QR_CARD = { x: 63, y: rel(322), w: 267.75, h: 272 };
const ADD_BTN = { y: rel(746), w: 221, h: 64 };
const SHEET_BOTTOM = device.height - SHEET.y; // 733 — visible band of the sheet

// Cap-trimmed text (Figma measures type cap-to-cap). Chromium 133+.
const capTrim = {
  textBoxTrim: 'trim-both',
  textBoxEdge: 'cap text',
} as CSSProperties;

const buttonReset: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ */
/* Small shared bits                                                    */
/* ------------------------------------------------------------------ */

/**
 * Scalable Apple-icon-grid guides (the same crosshair/rings IconPlaceholder
 * draws), in a 0–100 viewBox so it fills any square — used inside the
 * size-morphing header avatar, which can't take a fixed-size IconPlaceholder.
 */
function PlaceholderGuides({ color: stroke = color.lavender }: { color?: string }) {
  const c = 50;
  const rLg = 34.5;
  const rMd = 21.6;
  const rSm = 6.9;
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden
      style={{ position: 'absolute', inset: 0, display: 'block' }}
    >
      <g stroke={stroke} strokeWidth={0.8} opacity={0.6} fill="none" vectorEffect="non-scaling-stroke">
        <circle cx={c} cy={c} r={rLg} />
        <circle cx={c} cy={c} r={rMd} />
        <circle cx={c} cy={c} r={rSm} />
        <line x1={c} y1={0} x2={c} y2={100} />
        <line x1={0} y1={c} x2={100} y2={c} />
        <line x1={0} y1={0} x2={100} y2={100} />
        <line x1={100} y1={0} x2={0} y2={100} />
        <line x1={c - rLg} y1={0} x2={c - rLg} y2={100} />
        <line x1={c + rLg} y1={0} x2={c + rLg} y2={100} />
        <line x1={0} y1={c - rLg} x2={100} y2={c - rLg} />
        <line x1={0} y1={c + rLg} x2={100} y2={c + rLg} />
      </g>
    </svg>
  );
}

/**
 * The friends stat-card's tile stack — the SAME hand-tuned overlap the avatar
 * cluster uses (theme/avatarCluster, Lab → Cluster), scaled up to fill the
 * card and nudged so the tiles peek a bit over its top edge. With only one or
 * two friends the tiles CENTER on the card instead of hugging a side. All
 * tiles are the shared placeholder (photos come later).
 */
function ProfileFriendsStack({ count, cardW }: { count: number; cardW: number }) {
  const cluster = useAvatarCluster();
  const n = Math.min(3, Math.max(0, count));
  const S = 78; // profile-card tile size (cluster config is authored at 40px)
  const k = S / 40;
  const TOP = -12; // peek over the card's top edge
  const TILE_W = 40;
  const ARCH_H = 42;

  if (n >= 3) {
    const ox = (cardW - cluster.boxW * k) / 2;
    return (
      <>
        {cluster.slots.map((s, i) => (
          <PeerPin
            key={i}
            size={s.w * k}
            height={s.h * k}
            style={{
              position: 'absolute',
              left: ox + (s.x - s.w / 2) * k,
              top: TOP + (s.y - s.h / 2) * k,
              transform: `rotate(${s.rot}deg)`,
            }}
          />
        ))}
      </>
    );
  }

  // 1–2 friends: center the tiles on the card (Figma: never shoved to a side).
  const cy = TOP + (cluster.boxH * k) / 2;
  const tiles =
    n === 2
      ? [
          { rot: 6, cx: cardW / 2 - 19 * k },
          { rot: -8, cx: cardW / 2 + 19 * k },
        ]
      : n === 1
        ? [{ rot: -6, cx: cardW / 2 }]
        : [];
  return (
    <>
      {tiles.map((t, i) => (
        <PeerPin
          key={i}
          size={TILE_W * k}
          height={ARCH_H * k}
          style={{
            position: 'absolute',
            left: t.cx - (TILE_W * k) / 2,
            top: cy - (ARCH_H * k) / 2,
            transform: `rotate(${t.rot}deg)`,
          }}
        />
      ))}
    </>
  );
}

/** List row squircle in the venue-sheet recipe (Figma 1300:4562 style). */
function ListRow({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  const press = usePressFeedback();
  return (
    <motion.button {...press} onClick={onClick} style={{ ...buttonReset, width: '100%', flexShrink: 0 }}>
      <Squircle
        role="card"
        fill={color.brandDeep}
        style={{
          width: '100%',
          height: ROW_H,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </Squircle>
    </motion.button>
  );
}

/** A joined/organized plan row: white time badge + title + meta + chevron. */
function PlanRow({
  venueId,
  eventId,
  onOpen,
}: {
  venueId: VenueId;
  eventId: string;
  onOpen: (venueId: VenueId, eventId: string) => void;
}) {
  const ev = VENUES[venueId].events.find((e) => e.id === eventId);
  if (!ev) return null;
  return (
    <ListRow onClick={() => onOpen(venueId, eventId)}>
      <Squircle
        role="badge"
        fill={color.offWhite}
        style={{
          width: BADGE.w,
          height: BADGE.h,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span style={{ color: color.brandDeep, fontSize: 8, fontWeight: 600, ...capTrim }}>{ev.day}</span>
        <span style={{ color: color.brandDeep, fontSize: 24, fontWeight: 600, ...capTrim }}>{ev.time}</span>
      </Squircle>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ color: color.onBrand, fontSize: 16, fontWeight: 500, lineHeight: '16px' }}>{ev.title}</span>
        <span style={{ color: color.lavender, fontSize: 12, fontWeight: 500, ...capTrim }}>{ev.meta}</span>
      </div>
      <img src={figmaIcons.chevron} alt="" style={{ width: 8, height: 11.33, display: 'block', flexShrink: 0 }} />
    </ListRow>
  );
}

/** Bottom brand fade over a scrolling list (same recipe as the other sheets). */
function BottomFade() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: FADE.y,
        width: device.width,
        height: FADE.h,
        background: 'linear-gradient(to bottom, rgba(44,30,223,0) 0%, rgba(49,33,255,0.9) 96%)',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Person view — the profile itself (own + other are the same layout)   */
/* ------------------------------------------------------------------ */

function PersonView({
  person,
  depth,
  onBack,
  onRoute,
  onFriends,
  onOrganized,
  onOpenPlan,
  isFriend,
  onAddFriend,
}: {
  person: Person;
  /** >0 = pushed view (back chevron instead of ×). */
  depth: number;
  onBack: () => void;
  onRoute: () => void;
  onFriends: () => void;
  onOrganized: () => void;
  onOpenPlan: (venueId: VenueId, eventId: string) => void;
  isFriend: boolean;
  onAddFriend: () => void;
}) {
  const press = usePressFeedback();
  const snap = useMotion('snap');
  const morph = useMotion('morph');
  const listDrag = useDragScroll('y');
  const tag = personTag(person);
  const me = person.isMe === true;
  const commons = me ? person.friends.map((f) => PEOPLE[f]) : friendsInCommon(person);
  const snapMs = ((snap as { duration?: number }).duration ?? 0.3) * 1000;
  const ctaLabel = useScramble(isFriend ? 'Message' : `Add ${person.firstName}`, snapMs);

  return (
    <>
      {/* × close (root) / ‹ back (pushed) — top-left mini button */}
      <motion.button
        {...press}
        aria-label={depth > 0 ? 'Back' : 'Close profile'}
        onClick={onBack}
        style={{ ...buttonReset, position: 'absolute', left: CLOSE_BTN.x, top: CLOSE_BTN.y }}
      >
        <Squircle
          role="miniButton"
          fill={color.offWhite}
          style={{ width: CLOSE_BTN.s, height: CLOSE_BTN.s, display: 'grid', placeItems: 'center' }}
        >
          <span
            style={{
              gridArea: '1 / 1',
              display: 'grid',
              placeItems: 'center',
              opacity: depth > 0 ? 0 : 1,
              transform: depth > 0 ? 'rotate(-90deg) scale(0.4)' : 'none',
              transition: `opacity ${snapMs}ms ${layerZoom.ease}, transform ${snapMs}ms ${layerZoom.ease}`,
            }}
          >
            <CrossIcon size={10} color={color.brand} />
          </span>
          <span
            style={{
              gridArea: '1 / 1',
              display: 'grid',
              placeItems: 'center',
              opacity: depth > 0 ? 1 : 0,
              transform: depth > 0 ? 'none' : 'rotate(90deg) scale(0.4)',
              transition: `opacity ${snapMs}ms ${layerZoom.ease}, transform ${snapMs}ms ${layerZoom.ease}`,
            }}
          >
            <BackChevron height={11} color={color.brand} />
          </span>
        </Squircle>
      </motion.button>

      {/* top-right utility: ⇄ on your own profile, ⋮ on others (inert) */}
      <motion.button
        {...press}
        aria-label={me ? 'Profile settings' : 'More options'}
        style={{
          ...buttonReset,
          position: 'absolute',
          right: PAD_X + 7.5,
          top: CLOSE_BTN.y + (me ? 4 : 4),
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {me ? (
          <img src={swapIcon} alt="" style={{ width: 16, height: 19.2, display: 'block', transform: 'rotate(90deg)' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[0, 1, 2].map((i) => (
              <Squircle key={i} radius={1.5} smoothing={1} fill={color.offWhite} style={{ width: 4, height: 4 }} />
            ))}
          </div>
        )}
      </motion.button>

      {/* Tag card — the identity computed from their done activities. Tapping
          it leaves the profile for the special route map (MapHome). */}
      <motion.button {...press} onClick={onRoute} style={{ ...buttonReset, position: 'absolute', left: TAG_CARD.x, top: TAG_CARD.y }}>
        <Squircle
          role="card"
          fill={color.offWhite}
          stroke={color.brand}
          strokeWidth={3}
          style={{ width: TAG_CARD.w, height: TAG_CARD.h }}
        >
          <img
            src={person.tagMap}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(112deg, #ffffff 30%, rgba(255,255,255,0.55) 58%, rgba(255,255,255,0) 80%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 25,
              top: 25,
              height: 90,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              color: color.brand,
              letterSpacing: -0.4,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, fontWeight: 400, ...capTrim }}>
                {me ? 'You’re a ' : `${person.firstName} is a`}
              </span>
              <span style={{ fontSize: 32, fontWeight: 600, lineHeight: '30px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                {tag.lines[0]}
                <br />
                {tag.lines[1]}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 400, ...capTrim }}>{tagCountLine(person)}</span>
          </div>
        </Squircle>
      </motion.button>

      {/* The big tag glyph riding the card's top-right corner */}
      <img
        src={tag.glyph}
        alt=""
        style={{
          position: 'absolute',
          left: TAG_GLYPH.x,
          top: TAG_GLYPH.y,
          width: tag.glyphSize.w,
          height: tag.glyphSize.h,
          transform: `rotate(${tag.glyphRotate}deg)`,
          pointerEvents: 'none',
        }}
      />

      {/* Stat cards: friends (photo fan) + plans organized (count) */}
      <div
        style={{
          position: 'absolute',
          left: PAD_X,
          top: STAT_ROW.y,
          width: COL_W,
          display: 'flex',
          gap: STAT_ROW.gap,
          justifyContent: 'flex-end',
        }}
      >
        {/* friends card — morphs into the friends list */}
        <motion.button {...press} onClick={onFriends} style={{ ...buttonReset, position: 'relative', flexShrink: 0 }}>
          <Squircle
            role="statCard"
            fill={color.brandDeep}
            style={{ width: STAT_ROW.friendsW, height: STAT_ROW.h }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 100.6,
                textAlign: 'center',
                color: color.lavender,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: -0.4,
                ...capTrim,
              }}
            >
              {me ? 'your friends' : `${commons.length} friends in common`}
            </span>
          </Squircle>
          {/* Placeholder tiles in the tuned cluster overlap, peeking over top */}
          <ProfileFriendsStack count={commons.length} cardW={STAT_ROW.friendsW} />
        </motion.button>

        {/* plans-organized card — morphs into the organized list */}
        <motion.button {...press} onClick={onOrganized} style={{ ...buttonReset, flexShrink: 0 }}>
          <Squircle
            role="statCard"
            fill={color.brandDeep}
            style={{ width: STAT_ROW.countW, height: STAT_ROW.h, position: 'relative' }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 42.9,
                textAlign: 'center',
                color: color.onBrand,
                fontSize: 40,
                fontWeight: 600,
                ...capTrim,
              }}
            >
              {String(person.organized.length).padStart(2, '0')}
            </span>
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 100.8,
                textAlign: 'center',
                color: color.lavender,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: -0.4,
                ...capTrim,
              }}
            >
              {/* faithful to the Figma frame, stray "1" and all */}
              {me ? 'plans organized1' : 'plans organized'}
            </span>
          </Squircle>
        </motion.button>
      </div>

      {/* Upcoming plans — "Your plans" / "What Eva's up to" */}
      <span
        style={{
          position: 'absolute',
          left: PAD_X + 1,
          top: LIST_TITLE_Y,
          color: color.onBrand,
          fontSize: 16,
          fontWeight: 500,
          ...capTrim,
        }}
      >
        {me ? 'Your plans' : `What ${person.firstName}’s up to`}
      </span>
      <div
        {...listDrag}
        style={{
          position: 'absolute',
          left: 0,
          top: LIST_Y,
          width: device.width,
          height: SHEET_BOTTOM - LIST_Y,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: `0 ${PAD_X}px 150px`,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {person.upcoming.map(({ venueId, eventId }) => (
          <PlanRow key={`${venueId}:${eventId}`} venueId={venueId} eventId={eventId} onOpen={onOpenPlan} />
        ))}
      </div>

      <BottomFade />

      {/* CTA on OTHER profiles: "+ Add X" morphing into "Message" once added.
          (Your own CTA is the QR button — a persistent sibling, so it can
          morph into the QR plate.) */}
      {!me && (
        <motion.button
          {...press}
          onClick={isFriend ? undefined : onAddFriend}
          style={{
            ...buttonReset,
            position: 'absolute',
            left: (device.width - ADD_BTN.w) / 2,
            top: ADD_BTN.y,
          }}
        >
          <Squircle
            role="cta"
            fill={color.offWhite}
            style={{
              width: ADD_BTN.w,
              height: ADD_BTN.h,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={false}
              animate={{ width: isFriend ? 0 : 17, marginRight: isFriend ? 0 : 4, opacity: isFriend ? 0 : 1 }}
              transition={morph}
              style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}
            >
              <CrossIcon plus size={12} color={color.brand} />
            </motion.div>
            <span style={{ color: color.brand, fontSize: 24, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {ctaLabel}
            </span>
          </Squircle>
        </motion.button>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* List sheets: friends / plans organized (Figma 1300:4562 style)       */
/* ------------------------------------------------------------------ */

// The list popup is a floating card INSET from the page edges (like the confirm
// popups), not a full-bleed bottom sheet: same 329-wide footprint, a gap at the
// bottom, all four corners visible.
const LIST_ROW_H = 72;
const LIST_ROW_GAP = 8;
const LIST_INSET_X = PAD_X; // 32px each side → 329-wide card, matching ConfirmSheet
const LIST_BOTTOM_GAP = 56; // clears the home indicator, like the confirm popup
const LIST_TOP_MIN = 128; // never rise past here — keep the profile header peeking
const LIST_PAD = 20; // inner horizontal padding (card is narrower than the sheet)

// Content-fit height (no blank space): grabber + title + rows + CTA row. The CTA
// row is ALWAYS present (it holds the close ✕, plus the optional primary action).
function listContentHeight(rowCount: number, isEmpty: boolean): number {
  const HEAD = 34 + 20 + 16; // grabber pad + title + gap
  const rows = isEmpty ? 64 : rowCount * LIST_ROW_H + Math.max(0, rowCount - 1) * LIST_ROW_GAP;
  const cta = 16 + 64; // gap + CTA row
  return HEAD + rows + cta + 20; // + bottom pad
}

/**
 * A friends / plans-organized list as a floating CARD popup over the profile —
 * inset from the page edges like the confirm popups (not a full-bleed sheet). It
 * sizes to its content (no blank space), the profile stays dimmed behind it, and
 * it drags DOWN to dismiss. The drag hit zone is JUST the grabber (via
 * useDragControls) so the rows stay tappable — a full-card drag would swallow
 * "open this friend" taps. A CTA row pins to the bottom: the optional primary
 * action (Add friends / Create a plan) + a close ✕.
 */
function ProfileListSheet({
  isTop,
  title,
  rows,
  rowCount,
  emptyText,
  primaryCta,
  onDismiss,
}: {
  isTop: boolean;
  title: string;
  rows: React.ReactNode;
  rowCount: number;
  emptyText?: string;
  /** Optional primary action (own profile only); the ✕ is always shown. */
  primaryCta?: { label: string; onClick: () => void };
  onDismiss: () => void;
}) {
  const morph = useMotion('morph');
  const snap = useMotion('snap');
  const controls = useDragControls();
  const listDrag = useDragScroll('y');
  const isEmpty = emptyText != null;

  const CARD_W = device.width - LIST_INSET_X * 2;
  const contentH = listContentHeight(rowCount, isEmpty);
  const maxH = device.height - LIST_BOTTOM_GAP - LIST_TOP_MIN;
  const H = Math.min(contentH, maxH);
  const panelTop = device.height - LIST_BOTTOM_GAP - H;
  const OFF = device.height - panelTop + 40; // travel fully below the screen

  const y = useMotionValue(OFF);
  useEffect(() => {
    const c = animate(y, isTop ? 0 : OFF, morph);
    return () => c.stop();
  }, [isTop, y, OFF, morph]);

  return (
    <motion.div
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ top: 0, bottom: OFF }}
      dragElastic={{ top: 0, bottom: 0.2 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 90) onDismiss();
        else animate(y, 0, snap);
      }}
      style={{
        position: 'absolute',
        left: LIST_INSET_X,
        top: panelTop,
        width: CARD_W,
        height: H,
        y,
        zIndex: 8,
        pointerEvents: isTop ? 'auto' : 'none',
        filter: 'drop-shadow(0 8px 28px rgba(0,0,29,0.28))',
      }}
    >
      <Squircle role="sheet" fill={color.brand} style={{ width: '100%', height: '100%' }}>
        <div style={{ height: H, display: 'flex', flexDirection: 'column' }}>
          {/* Drag handle — the grabber pill AND the (non-interactive) title
              both start the dismiss drag, so the target is the whole header
              band, not just the thin pill. paddingTop keeps the title where the
              old fixed-34 handle put it, so the layout height is unchanged; the
              rows below stay tappable. */}
          <div
            onPointerDown={(e) => controls.start(e)}
            style={{ position: 'relative', paddingTop: 34, flexShrink: 0, cursor: 'grab', touchAction: 'none' }}
          >
            <Squircle
              radius={2}
              smoothing={1}
              fill="#fefefe"
              style={{ position: 'absolute', left: (CARD_W - 53) / 2, top: 9, width: 53, height: 4 }}
            />
            <span style={{ display: 'block', color: color.onBrand, fontSize: 16, fontWeight: 500, padding: `0 ${LIST_PAD + 1}px`, ...capTrim }}>
              {title}
            </span>
          </div>

          {isEmpty ? (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: `0 ${LIST_PAD}px` }}>
              <span style={{ color: color.lavender, fontSize: 16, fontWeight: 500, textAlign: 'center', lineHeight: '22px' }}>
                {emptyText}
              </span>
            </div>
          ) : (
            <div
              {...listDrag}
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: LIST_ROW_GAP,
                padding: `16px ${LIST_PAD}px 0`,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {rows}
            </div>
          )}

          <div style={{ padding: `16px ${LIST_PAD}px 0`, flexShrink: 0 }}>
            <CardCtaRow primary={primaryCta} onClose={onDismiss} />
          </div>
          <div style={{ height: 20, flexShrink: 0 }} />
        </div>
      </Squircle>
    </motion.div>
  );
}

/**
 * Bottom CTA row for the list popups: an optional primary action (Add friends /
 * Create a plan) that fills the width, plus a square close ✕ always on the right.
 * With no primary, the ✕ sits alone, centered.
 */
function CardCtaRow({
  primary,
  onClose,
}: {
  primary?: { label: string; onClick: () => void };
  onClose: () => void;
}) {
  const press = usePressFeedback();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', justifyContent: primary ? 'stretch' : 'center' }}>
      {primary && (
        <motion.button {...press} onClick={primary.onClick} style={{ ...buttonReset, flex: 1, width: undefined }}>
          <Squircle
            role="cta"
            fill={color.offWhite}
            style={{ width: '100%', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <CrossIcon plus size={12} color={color.brand} />
            <span style={{ color: color.brand, fontSize: 22, fontWeight: 600, whiteSpace: 'nowrap' }}>{primary.label}</span>
          </Squircle>
        </motion.button>
      )}
      <motion.button {...press} aria-label="Close" onClick={onClose} style={{ ...buttonReset, width: 64, flexShrink: 0 }}>
        <Squircle role="cta" fill={color.offWhite} style={{ width: 64, height: 64, display: 'grid', placeItems: 'center' }}>
          <CrossIcon size={14} color={color.brand} />
        </Squircle>
      </motion.button>
    </div>
  );
}

function FriendRow({ person, onOpen }: { person: Person; onOpen: () => void }) {
  const tag = personTag(person);
  return (
    <ListRow onClick={onOpen}>
      <PeerPin size={45} height={47.27} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginLeft: 4 }}>
        <span style={{ color: color.onBrand, fontSize: 16, fontWeight: 500, lineHeight: '16px', ...capTrim }}>
          {person.firstName} {person.lastName}
        </span>
        <span style={{ color: color.lavender, fontSize: 12, fontWeight: 500, ...capTrim }}>
          {tag.lines[0]} {tag.lines[1]}
        </span>
      </div>
      <img src={figmaIcons.chevron} alt="" style={{ width: 8, height: 11.33, display: 'block', flexShrink: 0 }} />
    </ListRow>
  );
}

/* ------------------------------------------------------------------ */
/* QR view — "Add new friends on LocalPal" (Figma 1426:1434)            */
/* ------------------------------------------------------------------ */

function QrView({ person }: { person: Person }) {
  const press = usePressFeedback();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(`https://${person.link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const [domain, path] = (() => {
    const i = person.link.indexOf('/');
    return [person.link.slice(0, i), person.link.slice(i)];
  })();

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          // Sits below the peeking avatar (was rel(189)) so the avatar reads as
          // a header over the QR rather than colliding with this heading.
          top: rel(226),
          width: device.width,
          textAlign: 'center',
          color: color.onBrand,
          fontSize: 32,
          fontWeight: 600,
          lineHeight: '38px',
        }}
      >
        Add new friends
        <br />
        on LocalPal
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: rel(613),
          width: device.width,
          textAlign: 'center',
          color: color.onBrand,
          fontSize: 20,
          fontWeight: 500,
          ...capTrim,
        }}
      >
        or share your profile
      </div>

      {/* the link plate — tap to copy */}
      <Squircle
        role="field"
        fill={color.brandDeep}
        onClick={copy}
        style={{
          position: 'absolute',
          left: 36,
          top: rel(662),
          width: device.width - 72,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          boxSizing: 'border-box',
          cursor: 'pointer',
        }}
      >
        <span style={{ position: 'relative', display: 'grid' }}>
          <span
            style={{
              gridArea: '1 / 1',
              fontSize: 16,
              fontWeight: 400,
              whiteSpace: 'nowrap',
              opacity: copied ? 0 : 1,
              transition: `opacity 180ms ${layerZoom.ease}`,
            }}
          >
            <span style={{ color: color.lavender }}>{domain}</span>
            <span style={{ color: '#6055FF' }}>{path}</span>
          </span>
          <span
            style={{
              gridArea: '1 / 1',
              fontSize: 16,
              fontWeight: 400,
              color: color.lavender,
              whiteSpace: 'nowrap',
              opacity: copied ? 1 : 0,
              transition: `opacity 180ms ${layerZoom.ease}`,
            }}
          >
            link copied!
          </span>
        </span>
      </Squircle>

      {/* scan + share (visual only for now) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: rel(733),
          width: device.width,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        {[
          { label: 'scan', icon: cameraIcon, w: 34.8, h: 31 },
          { label: 'share link', icon: shareIcon, w: 26.5, h: 31.5 },
        ].map((b) => (
          <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.button {...press} aria-label={b.label} style={{ ...buttonReset, flexShrink: 0 }}>
              <Squircle role="cta" fill="#FCFBF9" style={{ width: 63, height: 64, display: 'grid', placeItems: 'center' }}>
                <img src={b.icon} alt="" style={{ width: b.w, height: b.h, display: 'block' }} />
              </Squircle>
            </motion.button>
            <span style={{ color: color.lavender, fontSize: 12, fontWeight: 400 }}>{b.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The flow: morphing avatar + morphing sheet + view layers             */
/* ------------------------------------------------------------------ */

export function ProfileFlow({
  stack,
  onPush,
  onPop,
  onClose,
  restHidden = false,
  routeActive = false,
  onOpenRoute,
  onOpenPlan,
  onCreatePlan,
  friended,
  onAddFriend,
}: {
  /** Live navigation stack (owned by MapHome). Empty = closed. */
  stack: ProfileView[];
  onPush: (view: ProfileView) => void;
  onPop: () => void;
  onClose: () => void;
  /** Hide the resting corner avatar (a venue/activity card owns the screen). */
  restHidden?: boolean;
  /** Route-map mode owns the screen — this surface hides but keeps its stack. */
  routeActive?: boolean;
  onOpenRoute: (id: PersonId) => void;
  onOpenPlan: (venueId: VenueId, eventId: string) => void;
  /** "Create a plan" CTA in your organized-plans popup — closes the profile
   *  and opens the from-scratch plan composer. */
  onCreatePlan: () => void;
  /** People added as friends this session (Add X → Message morph). */
  friended: ReadonlySet<PersonId>;
  onAddFriend: (id: PersonId) => void;
}) {
  const avatarSq = useSquircle('avatar');
  const headSq = useSquircle('profileAvatar');
  const sheetSq = useSquircle('sheet');
  const ctaSq = useSquircle('cta');
  const qrSq = useSquircle('qrCard');
  const morph = useMotion('morph');
  const entrance = useMotion('entrance');
  const snap = useMotion('snap');
  const press = usePressFeedback();
  const confirm = useConfirm();

  const open = stack.length > 0;

  // Keep the last content while the close-morph plays (BottomBar pattern),
  // and keep popped layers mounted so their fade-out completes.
  const layersRef = useRef<ProfileView[]>([]);
  const prev = layersRef.current;
  const isPrefix = stack.length < prev.length && stack.every((v, i) => viewKey(v) === viewKey(prev[i]));
  const layers = open ? (isPrefix ? prev : stack) : prev;
  layersRef.current = layers;
  // Keys are index-scoped: circular hops (Theo → mutuals → Martin → mutuals →
  // Theo) legitimately put the same view on the stack twice.
  const layerKey = (v: ProfileView, i: number) => `${i}:${viewKey(v)}`;
  const topKey = open ? layerKey(stack[stack.length - 1], stack.length - 1) : null;
  const top = open ? stack[stack.length - 1] : null;

  // Whose profile flow is this? The root drives the open/close geometry —
  // with nothing open it defaults to ME (the resting corner avatar).
  const root = (open ? stack : layers)[0];
  const rootIsMe = root == null || (root.kind === 'person' && root.id === ME);
  // Whose face floats over the sheet right now.
  const headerPerson: Person =
    top == null
      ? PEOPLE[ME]
      : top.kind === 'qr'
        ? PEOPLE[ME]
        : PEOPLE[top.id];
  const topIsPerson = top?.kind === 'person';

  /* ---- surface progress values ---- */
  const pr = useMotionValue(0); // closed ⇄ profile sheet
  const qv = useMotionValue(0); // QR button ⇄ QR plate
  useEffect(() => {
    const c = animate(pr, open ? 1 : 0, morph);
    return () => c.stop();
  }, [open, pr, morph]);
  const qrOpen = top?.kind === 'qr';
  useEffect(() => {
    const c = animate(qv, qrOpen ? 1 : 0, morph);
    return () => c.stop();
  }, [qrOpen, qv, morph]);

  // Closed geometry differs: your own profile grows out of the corner avatar;
  // someone else's zooms in from the card you opened it from.
  const closed = rootIsMe
    ? { x: REST.x, y: REST.y, w: REST.s, h: REST.s }
    : OTHER_ORIGIN;

  const shX = useTransform(pr, (t) => lerp(closed.x, SHEET.x, t));
  const shY = useTransform(pr, (t) => lerp(closed.y, SHEET.y, t));
  const shW = useTransform(pr, (t) => lerp(closed.w, SHEET.w, t));
  const shH = useTransform(pr, (t) => lerp(closed.h, SHEET.h, t));
  const shR = useTransform(pr, (t) => lerp(avatarSq.radius, sheetSq.radius, t));
  const shS = useTransform(pr, (t) => lerp(avatarSq.smoothing, sheetSq.smoothing, t));
  const shClip = useTransform([shW, shH, shR, shS], ([w, h, r, s]) =>
    `path('${getSvgPath({ width: w as number, height: h as number, cornerRadius: r as number, cornerSmoothing: s as number })}')`,
  );
  // The sheet fades in fast at the start of the grow (it starts exactly under
  // the avatar, so there's no pop) and the content arrives once there's room.
  const sheetOpacity = useTransform(pr, [0, 0.18], [0, 1]);
  const contentOpacity = useTransform(pr, [0.4, 1], [0, 1]);

  /* ---- avatar geometry ---- */
  // Me-root: corner ⇄ header (one continuous element). Other-root: grow in place.
  const avFrom = rootIsMe ? REST : { x: HEAD.x + 25, y: HEAD.y + 25, s: 70 };
  const avX = useTransform(pr, (t) => lerp(avFrom.x, HEAD.x, t));
  const avY = useTransform(pr, (t) => lerp(avFrom.y, HEAD.y, t));
  const avS = useTransform(pr, (t) => lerp(avFrom.s, HEAD.s, t));
  const avR = useTransform(pr, (t) => lerp(avatarSq.radius, headSq.radius, t));
  const avSm = useTransform(pr, (t) => lerp(avatarSq.smoothing, headSq.smoothing, t));
  const avClip = useTransform([avS, avR, avSm], ([s, r, sm]) =>
    `path('${getSvgPath({ width: s as number, height: s as number, cornerRadius: r as number, cornerSmoothing: sm as number })}')`,
  );
  const avOpacity = useTransform(pr, rootIsMe ? [0, 1] : [0.2, 0.7], rootIsMe ? [1, 1] : [0, 1]);

  // Rest-state hide (a venue/activity card owns the screen) — only when closed.
  const restScale = !open && restHidden ? 0 : 1;

  /* ---- QR plate geometry (own profile only) ---- */
  const qpX = useTransform(qv, (t) => lerp(QR_BTN.x, QR_CARD.x, t));
  const qpY = useTransform(qv, (t) => lerp(QR_BTN.y, QR_CARD.y, t));
  const qpW = useTransform(qv, (t) => lerp(QR_BTN.w, QR_CARD.w, t));
  const qpH = useTransform(qv, (t) => lerp(QR_BTN.h, QR_CARD.h, t));
  const qpR = useTransform(qv, (t) => lerp(ctaSq.radius, qrSq.radius, t));
  const qpS = useTransform(qv, (t) => lerp(ctaSq.smoothing, qrSq.smoothing, t));
  const qpClip = useTransform([qpW, qpH, qpR, qpS], ([w, h, r, s]) =>
    `path('${getSvgPath({ width: w as number, height: h as number, cornerRadius: r as number, cornerSmoothing: s as number })}')`,
  );
  const qrGlyphOpacity = useTransform(qv, [0, 0.35], [1, 0]);
  const qrCodeOpacity = useTransform(qv, [0.35, 0.85], [0, 1]);
  // The QR is a bottom-sheet-style CARD in front of the (still-rendered)
  // profile: its opaque blue panel fades in as the QR opens, covering the
  // profile, and drags down to reveal it again (never the bare map).
  const qrPanelOpacity = useTransform(qv, [0, 0.55], [0, 1]);
  // The panel carries its OWN `sheet` squircle so its top corners are rounded
  // the same as the friends/organized cards — and, because the clip rides with
  // the panel's y-drag, the top edge stays a squircle as you drag it down
  // (the surface's own clip only rounds at its fixed top, leaving a hard edge
  // mid-drag). Sized to the fully-open sheet (the only state the QR shows in).
  const qrPanelClip = `path('${getSvgPath({
    width: SHEET.w,
    height: SHEET.h,
    cornerRadius: sheetSq.radius,
    cornerSmoothing: sheetSq.smoothing,
  })}')`;
  // The plate is YOUR person view's CTA *and* the QR view's hero — it hides
  // on lists and on other people's profiles (wall-clock CSS, layerZoom feel).
  const plateVisible =
    open && rootIsMe && ((top?.kind === 'person' && top.id === ME) || qrOpen);

  /* ---- QR-view drag-to-dismiss (handle zone at the sheet top) ---- */
  // Dismiss pops, then rides dragY smoothly back to 0 as the plate morphs
  // card→button (dismissTransition = morph, NOT an instant reset, which would
  // snap it to the open position for a frame before morphing — the glitch).
  const { dragY, handleProps: qrHandle } = useDragDismiss({
    onDismiss: onPop,
    threshold: 70,
    cancelTransition: snap,
    dismissTransition: morph,
  });

  /* ---- layer plumbing ---- */
  const popOrClose = useCallback(() => {
    if (stack.length > 1) onPop();
    else onClose();
  }, [stack.length, onPop, onClose]);

  // Where each list view grows from: the card that was tapped.
  const originFor = (v: ProfileView): string | undefined => {
    if (v.kind === 'friends') return '31% 46%';
    if (v.kind === 'organized') return '76% 46%';
    return undefined;
  };

  // A "card" view (qr / friends / organized) sits IN FRONT of the profile
  // beneath it, which stays rendered so dragging the card down reveals it.
  const topKind = top?.kind;
  const topIsCard = topKind === 'qr' || topKind === 'friends' || topKind === 'organized';
  // A bottom-sheet card popup (friends / organized) sits over the profile and
  // reveals it behind — so the profile (avatar + name + content) dims in place.
  // The QR is a full takeover: the avatar stays peeking (as a header) but the
  // profile isn't dimmed, and the name is hidden (it would collide with the QR
  // heading).
  const dimProfile = topKind === 'friends' || topKind === 'organized';
  // The profile a top card reveals = the nearest PERSON below it (cards can
  // stack, e.g. friends list → "Add friends" → QR, so it isn't always -2).
  let revealPersonIdx = -1;
  if (topIsCard) {
    for (let j = stack.length - 2; j >= 0; j--) {
      if (stack[j].kind === 'person') {
        revealPersonIdx = j;
        break;
      }
    }
  }

  const renderLayer = (view: ProfileView, i: number) => {
    // The QR is its own dedicated panel below (skip here).
    if (view.kind === 'qr') return null;
    const key = layerKey(view, i);
    const isTop = key === topKey;

    /* ---- person view: a full-page layer (the profile itself) ---- */
    if (view.kind === 'person') {
      // Keep the profile beneath a card VISIBLE (not zoomed away) so the card
      // drags down to reveal it; it just can't be tapped through.
      const revealedByCard = topIsCard && i === revealPersonIdx;
      const visible = isTop || revealedByCard;
      const hiddenAs = i < stack.length - 1 ? 'parent' : 'child';
      const person = PEOPLE[view.id];
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: isTop ? undefined : 'none',
            transformOrigin: originFor(view),
            ...layerZoomStyle(visible, hiddenAs),
          }}
        >
          <PersonView
            person={person}
            depth={i}
            onBack={popOrClose}
            onRoute={() => onOpenRoute(view.id)}
            onFriends={() => onPush({ kind: 'friends', id: view.id })}
            onOrganized={() => onPush({ kind: 'organized', id: view.id })}
            onOpenPlan={onOpenPlan}
            isFriend={friended.has(view.id)}
            onAddFriend={() => {
              confirm({
                title: `Add ${person.firstName} as a friend?`,
                confirmLabel: `Add ${person.firstName}`,
              }).then((ok) => {
                if (ok) onAddFriend(view.id);
              });
            }}
          />
        </div>
      );
    }

    /* ---- friends / organized: NOT rendered here. They surface as
       ConfirmSheet-style modal popups ABOVE the whole profile (avatar + name
       included) via renderCardPopup below, so nothing in the profile moves or
       peeks in front of them. ---- */
    return null;
  };

  /**
   * Friends / organized list cards as modal popups OVER the entire profile —
   * exactly the ConfirmSheet pattern: the profile (avatar, name, content) stays
   * STATIC behind a single uniform dim, and only the card slides up. Rendered
   * at a zIndex above the header avatar + name so nothing peeks in front of it.
   * Still driven by the same nav stack (isTop → slide up; popped-but-mounted →
   * slide down), so back/drag-dismiss and row taps behave as before.
   */
  const renderCardPopup = (view: ProfileView, i: number) => {
    if (view.kind !== 'friends' && view.kind !== 'organized') return null;
    const key = layerKey(view, i);
    const isTop = key === topKey;
    const person = PEOPLE[view.id];
    if (view.kind === 'friends') {
      const list = person.isMe ? person.friends.map((f) => PEOPLE[f]) : friendsInCommon(person);
      return (
        <ProfileListSheet
          key={key}
          isTop={isTop}
          title={person.isMe ? 'Your friends' : `Friends in common with ${person.firstName}`}
          rowCount={list.length}
          rows={list.map((p) => (
            <FriendRow key={p.id} person={p} onOpen={() => onPush({ kind: 'person', id: p.id })} />
          ))}
          primaryCta={person.isMe ? { label: 'Add friends', onClick: () => onPush({ kind: 'qr' }) } : undefined}
          onDismiss={onPop}
        />
      );
    }
    // organized
    return (
      <ProfileListSheet
        key={key}
        isTop={isTop}
        title={person.isMe ? 'Plans you organized' : `Plans ${person.firstName} organized`}
        rowCount={person.organized.length}
        rows={person.organized.map(({ venueId, eventId }) => (
          <PlanRow key={`${venueId}:${eventId}`} venueId={venueId} eventId={eventId} onOpen={onOpenPlan} />
        ))}
        emptyText={
          person.organized.length === 0
            ? person.isMe
              ? 'You haven’t organized any plans yet'
              : `${person.firstName} hasn’t organized any plans yet`
            : undefined
        }
        primaryCta={person.isMe ? { label: 'Create a plan', onClick: onCreatePlan } : undefined}
        onDismiss={onPop}
      />
    );
  };

  // Wall-clock show/hide for chrome synced with the top view (same tokens as
  // the layer zoom, opacity only).
  const fadeWith = (visible: boolean): CSSProperties =>
    visible
      ? { opacity: 1, visibility: 'inherit', transition: `opacity ${layerZoom.inMs}ms ${layerZoom.ease} ${layerZoom.inDelayMs}ms, visibility 0s` }
      : { opacity: 0, visibility: 'hidden', transition: `opacity ${layerZoom.outMs}ms ${layerZoom.ease}, visibility 0s linear ${layerZoom.outMs}ms` };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: routeActive ? 0 : 1, scale: routeActive ? 1.05 : 1 }}
      transition={morph}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 25,
        pointerEvents: 'none',
      }}
    >
      {/* Tap-catcher over the visible map strip (and anything outside the
          sheet/cards): clicking the map resets the WHOLE profile flow straight
          back to the map, from any depth. Sits below the sheet + avatar, so it
          only ever catches the exposed map. */}
      <DismissScrim active={open && !routeActive} onDismiss={onClose} zIndex={1} />

      {/* The morphing corner⇄header avatar — handles the map-corner → header
          morph and the plain profile view. A card (friends / organized / QR)
          is just a popup OVER this profile: the avatar stays exactly where it
          is (peeking over the sheet), only dimming with the rest of the page —
          it never moves or hands off to a second avatar. */}
      <motion.div
        onClick={() => {
          if (!open && !restHidden) onPush({ kind: 'person', id: ME });
        }}
        whileTap={!open ? press.whileTap : undefined}
        initial={false}
        animate={{ scale: restScale, opacity: restScale }}
        transition={restHidden ? morph : { ...entrance, delay: 0.1 }}
        style={{
          position: 'absolute',
          left: avX,
          top: avY,
          width: avS,
          height: avS,
          // The avatar peeks OVER the sheet's top edge and never moves. When a
          // friends/organized card opens it's a modal popup layered ABOVE the
          // whole profile (avatar included) over a single dim scrim — so the
          // avatar simply sits behind that scrim, dimmed in place, rather than
          // peeking in front of / colliding with the card.
          zIndex: 27,
          pointerEvents: routeActive || open ? 'none' : 'auto',
          cursor: open ? 'default' : 'pointer',
          // Soft even ambient shadow, no stroke (Figma 1442:5703 avatar).
          filter: 'drop-shadow(0 3px 8px rgba(0, 29, 51, 0.2))',
        }}
      >
        <motion.div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            clipPath: avClip,
            opacity: avOpacity,
            background: color.offWhite,
          }}
        >
          <PlaceholderGuides />
        </motion.div>
      </motion.div>

      {/* The blue sheet surface. It stays PUT — only the QR panel/plate drag
          (so the QR reveals the profile behind, never the bare map). */}
      <motion.div
        style={{
          position: 'absolute',
          left: shX,
          top: shY,
          width: shW,
          height: shH,
          clipPath: shClip,
          background: color.brand,
          opacity: sheetOpacity,
          zIndex: 25,
          pointerEvents: open && !routeActive ? 'auto' : 'none',
        }}
      >
        <motion.div style={{ position: 'absolute', inset: 0, opacity: contentOpacity }}>
          {layers.map(renderLayer)}

          {/* Scrim dimming the profile behind the QR takeover while its opaque
              panel fades in over the open morph (before the panel is fully
              opaque, the profile would otherwise show through un-dimmed).
              Friends/organized get their own full-page scrim ABOVE the avatar
              and name instead (see the card popup layer below). */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,24,0.4)',
              zIndex: 2,
              pointerEvents: 'none',
              opacity: qrOpen ? 1 : 0,
              transition: `opacity ${layerZoom.inMs}ms ${layerZoom.ease}`,
            }}
          />

          {/* QR panel — the opaque blue card in front of the still-rendered
              profile. Fades in over the morph (covering the profile), and the
              whole thing drags DOWN to reveal the profile page behind it. */}
          {rootIsMe && (
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                y: dragY,
                background: color.brand,
                clipPath: qrPanelClip,
                opacity: qrPanelOpacity,
                zIndex: 4,
                pointerEvents: qrOpen ? 'auto' : 'none',
              }}
            >
              <QrView person={PEOPLE[ME]} />

              {/* Drag zone reaching almost down to the QR card + grabber pill —
                  drag it down to dismiss. The × top-right (below) is the tap
                  equivalent, matching the profile's close button. */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: rel(295), zIndex: 2 }}>
                {qrOpen && (
                  <div {...qrHandle} style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'none' }} />
                )}
                <Squircle
                  radius={2}
                  smoothing={1}
                  fill="#fefefe"
                  style={{ position: 'absolute', left: (device.width - 53) / 2, top: 9, width: 53, height: 4, pointerEvents: 'none' }}
                />
              </div>

              {/* × close — top-left mini button (matches the profile's close).
                  Sits above the drag zone; tapping it dismisses the QR back to
                  the profile, same as dragging the panel down. */}
              {qrOpen && (
                <motion.button
                  {...press}
                  aria-label="Close"
                  onClick={onPop}
                  style={{ ...buttonReset, position: 'absolute', left: CLOSE_BTN.x, top: CLOSE_BTN.y, zIndex: 3 }}
                >
                  <Squircle
                    role="miniButton"
                    fill={color.offWhite}
                    style={{ width: CLOSE_BTN.s, height: CLOSE_BTN.s, display: 'grid', placeItems: 'center' }}
                  >
                    <CrossIcon size={10} color={color.brand} />
                  </Squircle>
                </motion.button>
              )}
            </motion.div>
          )}

          {/* The QR plate: your CTA button growing into the scannable code.
              Rides the drag with the panel while the QR is open. */}
          {rootIsMe && (
            <motion.div
              onClick={() => {
                if (!qrOpen && topIsPerson) onPush({ kind: 'qr' });
              }}
              whileTap={!qrOpen && topIsPerson ? press.whileTap : undefined}
              style={{
                position: 'absolute',
                left: qpX,
                top: qpY,
                // Always ride dragY (0 unless the QR is being dragged): on
                // dismiss it eases back to 0 WITH the card→button morph, so
                // there's no one-frame snap to the open position.
                y: dragY,
                width: qpW,
                height: qpH,
                clipPath: qpClip,
                background: '#FCFBF9',
                zIndex: 5,
                cursor: qrOpen ? 'default' : 'pointer',
                ...fadeWith(plateVisible),
                pointerEvents: plateVisible ? 'auto' : 'none',
              }}
            >
              {/* resting glyph — crossfades into the code as the plate grows */}
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  opacity: qrGlyphOpacity,
                  pointerEvents: 'none',
                }}
              >
                <img src={qrIcon} alt="" style={{ width: '51.5%', height: '51.5%', objectFit: 'contain', display: 'block' }} />
              </motion.div>
              <motion.div
                style={{
                  position: 'absolute',
                  left: '15.3%',
                  top: '14%',
                  width: '69.5%',
                  height: '72%',
                  opacity: qrCodeOpacity,
                  pointerEvents: 'none',
                }}
              >
                <QrCodeSvg text={`https://${PEOPLE[ME].link}`} />
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Name labels — they paint OVER the avatar photo (Figma boxed-name
          style), so they live above it. They stay put whenever the profile is
          open — a card popup just dims them, it never removes them. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: HEAD.y + 108,
          width: device.width,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 28,
          pointerEvents: 'none',
          // Stays put for the profile + bottom-sheet cards; hidden only in the
          // full-screen QR takeover (its own title would collide).
          ...fadeWith(open && topKind !== 'qr'),
        }}
      >
        <motion.div style={{ opacity: contentOpacity, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ marginLeft: 11, background: color.offWhite, padding: 4, zIndex: 2 }}>
            <span style={{ color: color.brand, fontSize: 24, fontWeight: 500, lineHeight: '26px', whiteSpace: 'nowrap' }}>
              {headerPerson.firstName}
            </span>
          </div>
          <div style={{ marginTop: -8, background: color.offWhite, padding: 4, opacity: 0.9, zIndex: 1 }}>
            <span style={{ color: color.muted, fontSize: 24, fontWeight: 400, lineHeight: '26px', opacity: 0.6, whiteSpace: 'nowrap' }}>
              {headerPerson.lastName}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Friends / organized card popups — ConfirmSheet-style modals layered
          OVER the entire profile. A single uniform scrim dims everything (map
          strip, avatar, name, profile content) and the card slides up on top;
          nothing in the profile moves or peeks in front of the card. Tapping
          the scrim (outside the card) dismisses it, exactly like the confirm
          popups + the card's own drag-down. */}
      <div
        onClick={onPop}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 29, // above the header avatar (27) + name (28), below the card (30)
          background: 'rgba(0,0,24,0.4)',
          opacity: dimProfile ? 1 : 0,
          pointerEvents: dimProfile ? 'auto' : 'none',
          transition: `opacity ${layerZoom.inMs}ms ${layerZoom.ease}`,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
        {layers.map(renderCardPopup)}
      </div>
    </motion.div>
  );
}
