/**
 * Content of the venue-detail sheet — the state the BottomBar surface morphs
 * into when a venue pin is tapped (Figma 1277:3310).
 *
 * Coordinates are sheet-relative. The venue surface is full-bleed: 393 wide,
 * top at ~244, and it runs ~56px past the screen bottom so its bottom corners
 * never show — layout therefore only occupies the visible 608px band.
 *
 * Name + address stay pinned at the top; everything below them — category row,
 * photo collage, description, "What's on" heading and event cards — scrolls as
 * ONE region (Figma 1360:1854 is the fully-scrolled state: the heading lands
 * right under the address), sliding under the bottom brand-gradient fade with
 * the floating Create plan / × actions on top. Photos are tinted placeholder
 * tiles for now (`photo` role); the collage intentionally bleeds off the right
 * screen edge, exactly like the design — the scroll region is full-bleed with
 * padded content so that overhang clips at the screen edge, not at the column.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Squircle } from "./Squircle";
import { usePressFeedback, useMotion } from "./MotionProvider";
import { useDragScroll } from "./useDragScroll";
import { figmaIcons } from "./icons/figmaIcons";
import { BookmarkIcon } from "./icons/BookmarkIcon";
import { color, device } from "../theme/tokens";
import { capTrim } from "../theme/resets";
import type { Venue, VenueEvent } from "../data/venues";

const SHEET_W = 393;
const SHEET_TOP = 243.89; // surface top in screen space (see BottomBar VENUE)
const VISIBLE_H = device.height - SHEET_TOP; // ≈608 — band of the sheet on screen
const PAD_X = 32;
const COL_W = SHEET_W - PAD_X * 2;

// Photo collage (Figma 1277:3365): tall / two-stacked / tall, 8px gaps.
const PHOTO = { tallW: 122, tallH: 177.7, smallH: 84.85, gap: 8 };
// Tint set for the placeholder tiles — each reads as a distinct "photo".
const PHOTO_TINTS = [
  "rgba(255,255,255,0.16)",
  "rgba(255,255,255,0.10)",
  "rgba(255,255,255,0.20)",
  "rgba(255,255,255,0.13)",
  "rgba(255,255,255,0.18)",
  "rgba(255,255,255,0.11)",
  "rgba(255,255,255,0.15)",
];

const CARD_H = 72;
const BADGE = { w: 90, h: 50 };

// Bottom brand fade (Figma 1277:3420). The floating actions that sat on top
// of it (Create plan + ×, Figma 1277:3422) are now the shared persistent
// CtaRow rendered by BottomBar — this export tells it where to anchor in
// venue mode (screen coords: the sheet is full-bleed at SHEET_TOP).
const FADE_H = 151.5;
const ACTIONS = { left: 37.4, top: 501.1, mainW: 240 };
export const VENUE_CTA = {
  x: ACTIONS.left,
  y: SHEET_TOP + ACTIONS.top,
  mainW: ACTIONS.mainW,
};

export function VenueSheet({
  venue,
  onEventTap,
}: {
  venue: Venue;
  /** Tapping an event card opens that event's activity card. */
  onEventTap?: (ev: VenueEvent) => void;
}) {
  const press = usePressFeedback();
  const pop = useMotion("pop");
  const [saved, setSaved] = useState(false);
  const listDrag = useDragScroll("y");
  const collageDrag = useDragScroll("x");

  return (
    <>
      {/* grabber handle (venue sheet is wider than the search sheet, so it has its own) */}
      <Squircle
        radius={2}
        smoothing={1}
        fill="#fefefe"
        style={{
          position: "absolute",
          left: (SHEET_W - 53) / 2,
          top: 8,
          width: 53,
          height: 4,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 37.2,
          width: SHEET_W,
          height: VISIBLE_H - 37.2,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Name + address — pinned above the scroll region. Save bookmark sits
            top-right, aligned with the name (Figma 1277:3310 → 1394:4126). */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: `0 ${PAD_X}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 0,
            }}
          >
            <span
              style={{
                color: color.onBrand,
                fontSize: 24,
                fontWeight: 600,
                lineHeight: "26px",
              }}
            >
              {venue.name}
            </span>
            <span
              style={{
                color: color.lavender,
                fontSize: 12,
                fontWeight: 400,
                ...capTrim,
              }}
            >
              {venue.address}
            </span>
          </div>

          <motion.button
            {...press}
            onClick={() => setSaved((s) => !s)}
            aria-label={saved ? "Remove from saved" : "Save venue"}
            aria-pressed={saved}
            style={{
              background: "transparent",
              border: "none",
              padding: 4,
              margin: -4,
              marginTop: -1,
              cursor: "pointer",
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            {/* Keyed so the glyph pops when it fills — animate the interaction. */}
            <motion.span
              key={saved ? "on" : "off"}
              initial={saved ? { scale: 0.6 } : false}
              animate={{ scale: 1 }}
              transition={pop}
              style={{ display: "block" }}
            >
              <BookmarkIcon size={18} color={color.onBrand} filled={saved} />
            </motion.span>
          </motion.button>
        </div>

        {/* Everything below the address scrolls as one region. Full-bleed with
            padded content so the collage overhang clips at the screen edge. */}
        <div
          {...listDrag}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: `0 ${PAD_X}px ${FADE_H - 30}px`,
            scrollbarWidth: "none",
            // Own vertical touch gestures so a swipe pans the list (not the
            // map/surface beneath), and don't chain the overscroll outward.
            touchAction: "pan-y",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Category row: tilted glyph + type / hours */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <img
              src={venue.icon}
              alt=""
              style={{
                height: 32,
                width: "auto",
                display: "block",
                transform: "rotate(-4deg)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  color: color.onBrand,
                  fontSize: 16,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                {venue.category}
              </span>
              <span
                style={{
                  color: color.lavender,
                  fontSize: 12,
                  fontWeight: 400,
                  ...capTrim,
                }}
              >
                {venue.hours}
              </span>
            </div>
          </div>

          {/* Photo collage — horizontally scrollable. Full-bleed: negative
              margins break out of the column's PAD_X padding so tiles scroll
              off both screen edges, while the inner padding keeps the first
              tile aligned with the rest of the content. */}
          <div
            {...collageDrag}
            style={{
              display: "flex",
              gap: PHOTO.gap,
              flexShrink: 0,
              overflowX: "auto",
              overflowY: "hidden",
              marginLeft: -PAD_X,
              marginRight: -PAD_X,
              paddingLeft: PAD_X,
              paddingRight: PAD_X,
              scrollbarWidth: "none",
            }}
          >
            <Squircle
              role="photo"
              fill={PHOTO_TINTS[0]}
              style={{ flexShrink: 0, width: PHOTO.tallW, height: PHOTO.tallH }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: PHOTO.gap,
                flexShrink: 0,
              }}
            >
              <Squircle
                role="photo"
                fill={PHOTO_TINTS[1]}
                style={{ width: PHOTO.tallW, height: PHOTO.smallH }}
              />
              <Squircle
                role="photo"
                fill={PHOTO_TINTS[2]}
                style={{ width: PHOTO.tallW, height: PHOTO.smallH }}
              />
            </div>
            <Squircle
              role="photo"
              fill={PHOTO_TINTS[3]}
              style={{ flexShrink: 0, width: PHOTO.tallW, height: PHOTO.tallH }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: PHOTO.gap,
                flexShrink: 0,
              }}
            >
              <Squircle
                role="photo"
                fill={PHOTO_TINTS[4]}
                style={{ width: PHOTO.tallW, height: PHOTO.smallH }}
              />
              <Squircle
                role="photo"
                fill={PHOTO_TINTS[5]}
                style={{ width: PHOTO.tallW, height: PHOTO.smallH }}
              />
            </div>
            <Squircle
              role="photo"
              fill={PHOTO_TINTS[6]}
              style={{ flexShrink: 0, width: PHOTO.tallW, height: PHOTO.tallH }}
            />
          </div>

          <p
            style={{
              color: color.lavender,
              fontSize: 12,
              fontWeight: 400,
              margin: 0,
              width: COL_W,
              flexShrink: 0,
            }}
          >
            {venue.description}
          </p>

          {/* Sticky: once scrolled to the top it stays put (the fully-scrolled
              reference 1360:1854 shows it right under the address) and the
              cards slide beneath its brand-colored box. Venues that host no
              activities skip this whole section (and get no map ring). */}
          {venue.events.length > 0 && (
            <>
              <span
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  background: color.brand,
                  padding: "0 0 10px",
                  marginBottom: -10,
                  color: color.onBrand,
                  fontSize: 16,
                  fontWeight: 500,
                  flexShrink: 0,
                  ...capTrim,
                }}
              >
                What’s on at {venue.name}
              </span>

              {/* Event cards: 8px apart (tighter than the 16px section rhythm) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                {venue.events.map((ev) => (
                  <motion.div
                    key={ev.id}
                    {...press}
                    onClick={() => onEventTap?.(ev)}
                    style={{ flexShrink: 0 }}
                  >
                    <Squircle
                      role="card"
                      fill={color.brandDeep}
                      style={{
                        height: CARD_H,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0 12px",
                        cursor: "pointer",
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
                            fontWeight: 400,
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
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom brand fade over the scrolling list */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: VISIBLE_H - FADE_H,
          width: SHEET_W,
          height: FADE_H,
          background:
            "linear-gradient(to bottom, rgba(44,30,223,0) 0%, rgba(49,33,255,0.9) 96%)",
          pointerEvents: "none",
        }}
      />

      {/* The Create plan / × actions that floated here are the shared CtaRow
          now (see VENUE_CTA above) — it persists across the whole flow. */}
    </>
  );
}
