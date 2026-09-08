/**
 * Content of the create-plan flow — the state the BottomBar surface morphs
 * into from the venue sheet's "Create plan" CTA or the plans sheet's "Propose
 * a plan" (Figma 1431:2735 → 1431:5168). Like the activity sheet this is an
 * inset floating card (362 wide) glued to the same bottom edge, hosting a
 * WIZARD of step views:
 *
 *   title+tags → location (choose ⇄ venue/address search) → time (wheels)
 *     → people → description → last check → success
 *
 * Steps swap IN PLACE on the shared hierarchical zoom (layerZoomStyle):
 * going Next the old step scales past you ('parent'), Back reverses it —
 * exactly the pill → sheet → venue → activity personality. Each step is a
 * natural-height flow column measured by a ResizeObserver; the sheet reports
 * the active height up to BottomBar, which morphs the surface to fit — so
 * the tall venue-search state (Figma 1431:4085) is just a taller step. The
 * step DOTS and the Back/Next footer are PERSISTENT chrome pinned outside the
 * swapping layers: the active dot stretches into a pill on the `snap` role,
 * the footer label scrambles ("Next" ⇄ "Create plan"), and the success card
 * swaps the whole row for "Go to your plan" + share.
 *
 * Draft state lives here and survives back-and-forth between steps; the whole
 * component is remounted per flow session (keyed by BottomBar), so leaving
 * the flow discards the draft. Confirming hands a CreatePlanResult up to
 * MapHome, which mints the real plan (pin coords + PlansProvider entry).
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type MotionValue,
} from "framer-motion";
import { Squircle } from "./Squircle";
import { useMotion, usePressFeedback } from "./MotionProvider";
import { useConfirm } from "./ConfirmProvider";
import { useScramble } from "./useScramble";
import { useDragScroll } from "./useDragScroll";
import { layerZoomStyle } from "../theme/motion";
import { Glyph } from "./icons/Glyph";
import { CrossIcon } from "./icons/CrossIcon";
import { BackChevron } from "./icons/BackChevron";
import { PersonIcon } from "./icons/PersonIcon";
import { ShareIcon } from "./icons/ShareIcon";
import { figmaIcons } from "./icons/figmaIcons";
import { color } from "../theme/tokens";
import {
  capTrim,
  inputReset,
  textButtonReset as buttonReset,
} from "../theme/resets";
import { CATEGORIES, type CategoryId } from "../theme/categories";
import { VENUES, type Venue, type VenueId } from "../data/venues";
import { ADDRESSES } from "../data/addresses";

/** Surface geometry the BottomBar morphs to (Figma 1431:2788): inset card,
 *  362 wide, glued to the same bottom edge as the activity card. Heights are
 *  measured from the active step's content; `h` is only the fallback. */
export const CREATE = { x: 16.48, w: 362, h: 332.5 };
export const CREATE_BOTTOM = 803.54; // card bottom across every step frame

const PAD_X = 32.42; // content column left 48.9 − card x 16.48
const COL_W = 298;
const PAD_TOP = 32.5;
const PAD_BOTTOM = 32;
const BLOCK_GAP = 24;
const FOOTER_H = 64;
// Dots row: 8px dots, 4px gaps, the active dot stretched to a 24px pill
// (Figma 1431:4021 — total row 84px). Sits 8px under the column top.
const DOT = 8;
const DOT_PILL = 24;
const DOT_GAP = 4;
const DOTS_BLOCK = 32; // 8 pad + 8 dots + 16 gap to the title, baked into every step column

// Footer plates (Figma 1431:2872): back square 64, main plate 221, gap 12.
const BACK_W = 64.08;
const MAIN_W = 221.08;
const FOOTER_GAP = 12;

// Location step (Figma 1431:4031 / 1431:4152): choose buttons 47 tall; the
// search state is a full-width field + a 325-tall results panel, 12 apart.
const FIELD_H = 47;
const SEARCH_W = 297.78;
const PANEL_H = 325.32;
const VENUES_BTN_W = 161.79;
const ADDRESS_BTN_W = 125.82;

// Time step (Figma 1431:4472): day plate 178.74, time plate 110.83, both 74.3
// tall, 8 apart; tapping one grows an inline wheel out of it.
const PLATE_H = 74.32;
const DAY_W = 178.74;
const TIME_W = 110.83;
const WHEEL_ROW_H = 30;
const WHEEL_ROWS = 5;
const WHEEL_H = WHEEL_ROW_H * WHEEL_ROWS + 8;

// People step (Figma 1431:4609): one 84-tall plate, ∓ knobs inset 24.4.
const PEOPLE_PLATE_H = 84.32;
const KNOB = 33.3;
const KNOB_INSET = 24.45;
const PEOPLE_MIN = 2;
const PEOPLE_MAX = 20;

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);
const MAX_TAGS = 3;

const STEPS = [
  "title",
  "location",
  "time",
  "people",
  "description",
  "check",
] as const;
type StepId = (typeof STEPS)[number] | "success";

export type PlanLocation =
  | { kind: "venue"; venueId: VenueId }
  | { kind: "address"; address: string; area: string };

/** Everything the flow collected — MapHome mints the real plan from this. */
export type CreatePlanResult = {
  title: string;
  tags: string[];
  location: PlanLocation;
  day: string; // 'Monday'
  time: string; // '18:30'
  people: number;
  description: string;
};

type DraftTag = {
  id: string;
  label: string;
  glyph: "drinks" | "sports" | CategoryId | "custom";
};

// Chip icons — the lavender Figma variants where the design provides them
// (same recipe as the search sheet's filter chips).
const CHIP_ICON: Partial<Record<string, string>> = {
  drinks: figmaIcons.chipDrinks,
  sports: figmaIcons.chipSports,
};

/* ------------------------------------------------------------------ */
/* Persistent chrome: step dots + footer                                */
/* ------------------------------------------------------------------ */

// Future (not-yet-done) steps read as a translucent white, not full white
// (Figma 1431:4021) — done + current stay bright.
const DOT_DIM = 0.35;

function StepDots({ active }: { active: number }) {
  const snap = useMotion("snap");
  return (
    <div
      style={{
        position: "absolute",
        left: PAD_X,
        top: PAD_TOP + 8,
        display: "flex",
        gap: DOT_GAP,
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      {STEPS.map((id, i) => (
        <motion.div
          key={id}
          initial={false}
          // width: the active step is a pill, the rest are dots. opacity: done
          // + current are full white, upcoming steps dim (Figma 1431:4021).
          animate={{
            width: i === active ? DOT_PILL : DOT,
            opacity: i <= active ? 1 : DOT_DIM,
          }}
          transition={snap}
          style={{ height: DOT }}
        >
          <Squircle
            role="stepDot"
            fill={color.offWhite}
            style={{ width: "100%", height: "100%" }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/** Small stacked up/down chevrons riding the wheel-plate labels (Figma 1431:4526). */
function UpDownChevrons({ color: c = color.lavender }: { color?: string }) {
  return (
    <svg
      width={8}
      height={14}
      viewBox="0 0 8 14"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M1 5l3-3 3 3"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 9l3 3 3-3"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Shared step scaffolding                                              */
/* ------------------------------------------------------------------ */

/** Natural-height flow column, measured by the sheet to size the surface.
 *  Top pad clears the persistent dots; a footer spacer keeps the measured
 *  height honest while the real footer is pinned chrome. */
function StepColumn({
  colRef,
  children,
}: {
  colRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div
      ref={colRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: CREATE.w,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: BLOCK_GAP,
        paddingTop: PAD_TOP + DOTS_BLOCK,
        paddingBottom: PAD_BOTTOM,
        paddingLeft: PAD_X,
        paddingRight: PAD_X,
      }}
    >
      {children}
      <div style={{ height: FOOTER_H, flexShrink: 0 }} />
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    // The title keeps its tight 26px leading (design) so multi-line titles stay
    // compact. capTrim trims the top to cap height and the bottom to the text
    // edge, so the box includes descenders ("y"/"p" in "you up to?") instead of
    // clipping them at the baseline; the 12px gap is measured from below them.
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: color.onBrand,
          fontSize: 32,
          fontWeight: 600,
          lineHeight: "26px",
          wordBreak: "break-word",
          ...capTrim,
        }}
      >
        {title}
      </span>
      {subtitle && (
        <span
          style={{
            color: color.lavender,
            fontSize: 12,
            fontWeight: 400,
            ...capTrim,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — title + tags (Figma 1431:2735)                              */
/* ------------------------------------------------------------------ */

function TagChip({ tag, onRemove }: { tag: DraftTag; onRemove: () => void }) {
  const press = usePressFeedback();
  const icon = CHIP_ICON[tag.glyph];
  return (
    <motion.div {...press} style={{ flexShrink: 0 }}>
      <Squircle
        role="chip"
        fill="rgba(255,255,255,0.12)"
        style={{
          height: 31.6,
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "0 10px",
        }}
      >
        {icon ? (
          <img
            src={icon}
            alt=""
            style={{
              height: 14,
              width: "auto",
              display: "block",
              transform: "rotate(-5deg)",
            }}
          />
        ) : tag.glyph === "custom" ? (
          <img
            src={figmaIcons.shootingStar}
            alt=""
            style={{ height: 13, width: "auto", display: "block" }}
          />
        ) : (
          <Glyph
            name={CATEGORIES[tag.glyph as CategoryId].glyph}
            size={13}
            color={color.lavender}
          />
        )}
        <span
          style={{
            color: "#a59eff",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {tag.label}
        </span>
        <button
          aria-label={`Remove ${tag.label}`}
          onClick={onRemove}
          style={{
            ...buttonReset,
            display: "grid",
            placeItems: "center",
            width: 14,
            height: 14,
            marginLeft: 1,
          }}
        >
          <CrossIcon size={8} color={color.lavender} />
        </button>
      </Squircle>
    </motion.div>
  );
}

function TitleStep({
  colRef,
  title,
  onTitle,
  tags,
  onTags,
}: {
  colRef?: Ref<HTMLDivElement>;
  title: string;
  onTitle: (v: string) => void;
  tags: DraftTag[];
  onTags: (t: DraftTag[]) => void;
}) {
  const press = usePressFeedback();
  const entrance = useMotion("entrance");
  const [picking, setPicking] = useState(false);
  const [custom, setCustom] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the title area with its content (1–3 lines of 26px).
  const autosize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "26px";
    el.style.height = `${Math.min(78, el.scrollHeight)}px`;
  };
  useEffect(autosize, [title]);

  const addTag = (t: DraftTag) => {
    if (tags.length >= MAX_TAGS || tags.some((x) => x.id === t.id)) return;
    onTags([...tags, t]);
    setPicking(false);
    setCustom("");
  };
  const remaining = Object.values(CATEGORIES).filter(
    (c) => !tags.some((t) => t.id === c.id),
  );

  return (
    <StepColumn colRef={colRef}>
      <StepTitle
        title="What are you up to?"
        subtitle="choose a title for your activity"
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 270.5,
          flexShrink: 0,
        }}
      >
        {/* Title field — 24px over a 1px lavender rule (Figma 1431:3120). */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <textarea
            ref={taRef}
            className="lp-create-input"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Write your plan title..."
            rows={1}
            maxLength={64}
            style={{
              ...inputReset,
              width: "100%",
              color: color.onBrand,
              fontSize: 24,
              fontWeight: 500,
              lineHeight: "26px",
              resize: "none",
              overflow: "hidden",
            }}
          />
          <div
            style={{ height: 1, width: "100%", background: color.lavender }}
          />
        </div>

        {/* Tag chips + the ⊕ picker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {tags.map((t) => (
            <TagChip
              key={t.id}
              tag={t}
              onRemove={() => onTags(tags.filter((x) => x.id !== t.id))}
            />
          ))}
          {tags.length < MAX_TAGS && (
            <motion.button
              {...press}
              onClick={() => setPicking((p) => !p)}
              aria-label="Add tag"
              style={{ ...buttonReset, flexShrink: 0 }}
            >
              <Squircle
                role="chip"
                fill="rgba(255,255,255,0.12)"
                style={{
                  width: 31.3,
                  height: 31.3,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {/* rotates into an × while the picker is open — glyphs morph, not swap */}
                <motion.span
                  initial={false}
                  animate={{ rotate: picking ? 45 : 0 }}
                  transition={entrance}
                  style={{ display: "grid", placeItems: "center" }}
                >
                  <CrossIcon plus size={8} color={color.lavender} />
                </motion.span>
              </Squircle>
            </motion.button>
          )}
        </div>

        {/* Preset categories + a custom entry, fading in under the chips. Only
            OPACITY animates — the row's height changes instantly so the single
            surface-height spring reshapes the card (springing height here too
            would chain onto it and stutter). Fade rides the `entrance` role;
            its bounce is imperceptible on opacity, so it just reads as a fade. */}
        <AnimatePresence>
          {picking && (
            <motion.div
              key="picker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={entrance}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {remaining.map((c) => (
                <motion.button
                  key={c.id}
                  {...press}
                  onClick={() =>
                    addTag({ id: c.id, label: c.label, glyph: c.id })
                  }
                  style={{ ...buttonReset, flexShrink: 0 }}
                >
                  <Squircle
                    role="chip"
                    fill={color.brandDeep}
                    style={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "0 10px",
                    }}
                  >
                    <Glyph name={c.glyph} size={12} color={color.lavender} />
                    <span
                      style={{
                        color: "#a59eff",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.label}
                    </span>
                  </Squircle>
                </motion.button>
              ))}
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && custom.trim())
                    addTag({
                      id: `custom-${custom.trim().toLowerCase()}`,
                      label: custom.trim(),
                      glyph: "custom",
                    });
                }}
                placeholder="or type your own…"
                maxLength={16}
                style={{
                  ...inputReset,
                  color: color.onBrand,
                  fontSize: 12,
                  fontWeight: 500,
                  width: 110,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StepColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — location: choose ⇄ venue/address search (Figma 1431:3964)   */
/* ------------------------------------------------------------------ */

type LocationMode = "choose" | "venues" | "address";

function LocationStep({
  colRef,
  location,
  onLocation,
}: {
  colRef?: Ref<HTMLDivElement>;
  location: PlanLocation | null;
  onLocation: (l: PlanLocation) => void;
}) {
  const press = usePressFeedback();
  const [mode, setMode] = useState<LocationMode>("choose");
  const [query, setQuery] = useState("");
  const listDrag = useDragScroll("y");
  const inputRef = useRef<HTMLInputElement>(null);
  const searching = mode !== "choose";

  const openMode = (m: LocationMode) => {
    setMode(m);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const q = query.trim().toLowerCase();
  const venueResults = Object.values(VENUES).filter(
    (v) =>
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q),
  );
  const addressResults = ADDRESSES.filter(
    (a) =>
      !q ||
      a.label.toLowerCase().includes(q) ||
      a.area.toLowerCase().includes(q),
  );

  const selectedVenue =
    location?.kind === "venue" ? VENUES[location.venueId] : null;

  const rowStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    padding: "10px 4px",
    width: "100%",
    flexShrink: 0,
  };

  return (
    <StepColumn colRef={colRef}>
      <StepTitle
        title="Where’s it happening?"
        subtitle="choose or add a place"
      />

      {/* The region grows between the two-button row and the tall search
          state. Its height changes INSTANTLY so the single surface-height
          spring (BottomBar's `createH`, fed by the measured column) does the
          whole reshape — animating this height too would chain a second
          spring onto the first, which reads as a stutter mid-morph. The two
          content layers just crossfade on the shared hierarchical zoom. */}
      <div
        style={{
          position: "relative",
          width: COL_W,
          flexShrink: 0,
          height: searching ? FIELD_H + 12 + PANEL_H : FIELD_H,
        }}
      >
        {/* choose: search venues… / add location + (parent once you dive in) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            pointerEvents: searching ? "none" : undefined,
            ...layerZoomStyle(!searching, "parent"),
          }}
        >
          <motion.button
            {...press}
            onClick={() => openMode("venues")}
            style={{ ...buttonReset, flexShrink: 0 }}
          >
            <Squircle
              role="field"
              fill={color.brandDeep}
              style={{
                width: VENUES_BTN_W,
                height: FIELD_H,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 16px",
              }}
            >
              <img
                src={figmaIcons.search}
                alt=""
                width={14}
                height={14}
                style={{ display: "block", flexShrink: 0 }}
              />
              <span
                style={{
                  color: selectedVenue ? color.onBrand : color.lavender,
                  fontSize: 16,
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedVenue ? selectedVenue.name : "search venues..."}
              </span>
            </Squircle>
          </motion.button>
          <motion.button
            {...press}
            onClick={() => openMode("address")}
            style={{ ...buttonReset, flexShrink: 0 }}
          >
            <Squircle
              role="field"
              fill={color.brandDeep}
              style={{
                width: ADDRESS_BTN_W,
                height: FIELD_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0 12px",
              }}
            >
              <span
                style={{
                  color:
                    location?.kind === "address"
                      ? color.onBrand
                      : color.lavender,
                  fontSize: 16,
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {location?.kind === "address"
                  ? location.address
                  : "add location"}
              </span>
              {location?.kind !== "address" && (
                <CrossIcon plus size={6} color={color.lavender} />
              )}
            </Squircle>
          </motion.button>
        </div>

        {/* searching: full-width field + results panel (Figma 1431:4152) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            pointerEvents: searching ? undefined : "none",
            ...layerZoomStyle(searching, "child"),
          }}
        >
          <Squircle
            role="field"
            fill={color.brandDeep}
            style={{
              width: SEARCH_W,
              height: FIELD_H,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "0 16px",
              flexShrink: 0,
            }}
          >
            {mode !== "address" && (
              <img
                src={figmaIcons.search}
                alt=""
                width={14}
                height={14}
                style={{ display: "block", flexShrink: 0 }}
              />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "address" ? "type an address..." : "search venues..."
              }
              style={{
                ...inputReset,
                flex: 1,
                minWidth: 0,
                color: color.onBrand,
                fontSize: 16,
                fontWeight: 400,
              }}
            />
            <button
              aria-label="Close search"
              onClick={() => setMode("choose")}
              style={{
                ...buttonReset,
                display: "grid",
                placeItems: "center",
                width: 20,
                height: 20,
                flexShrink: 0,
              }}
            >
              <CrossIcon size={9} color={color.lavender} />
            </button>
          </Squircle>

          <Squircle
            role="plate"
            fill={color.brandDeep}
            style={{ width: COL_W, height: PANEL_H, flexShrink: 0 }}
          >
            <div
              {...listDrag}
              style={{
                position: "absolute",
                inset: 0,
                padding: "10px 14px",
                overflowY: "auto",
                scrollbarWidth: "none",
                touchAction: "pan-y",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {mode === "venues"
                ? venueResults.map((v) => (
                    <motion.button
                      key={v.id}
                      {...press}
                      onClick={() => {
                        onLocation({ kind: "venue", venueId: v.id });
                        setMode("choose");
                      }}
                      style={{ ...buttonReset, ...rowStyle }}
                    >
                      <span
                        style={{
                          color: color.onBrand,
                          fontSize: 16,
                          fontWeight: 500,
                          lineHeight: "16px",
                        }}
                      >
                        {v.name}
                      </span>
                      <span
                        style={{
                          color: color.lavender,
                          fontSize: 12,
                          fontWeight: 400,
                          ...capTrim,
                        }}
                      >
                        {v.category} - {v.address}
                      </span>
                    </motion.button>
                  ))
                : addressResults.map((a) => (
                    <motion.button
                      key={a.id}
                      {...press}
                      onClick={() => {
                        onLocation({
                          kind: "address",
                          address: a.label,
                          area: a.area,
                        });
                        setMode("choose");
                      }}
                      style={{ ...buttonReset, ...rowStyle }}
                    >
                      <span
                        style={{
                          color: color.onBrand,
                          fontSize: 16,
                          fontWeight: 500,
                          lineHeight: "16px",
                        }}
                      >
                        {a.label}
                      </span>
                      <span
                        style={{
                          color: color.lavender,
                          fontSize: 12,
                          fontWeight: 400,
                          ...capTrim,
                        }}
                      >
                        {a.area}
                      </span>
                    </motion.button>
                  ))}
            </div>
          </Squircle>
        </div>
      </div>
    </StepColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — time: tap a plate, a wheel grows out of it (Figma 1431:4472)*/
/* ------------------------------------------------------------------ */

function WheelColumn({
  values,
  index,
  onChange,
  width,
}: {
  values: string[];
  index: number;
  onChange: (i: number) => void;
  width: number;
}) {
  const snap = useMotion("snap");
  const y = useMotionValue(-index * WHEEL_ROW_H);
  const drag = useRef<{ startY: number; startVal: number } | null>(null);
  const wheelAcc = useRef(0);
  const maxY = 0;
  const minY = -(values.length - 1) * WHEEL_ROW_H;

  useEffect(() => {
    if (drag.current) return;
    const c = animate(y, -index * WHEEL_ROW_H, snap);
    return () => c.stop();
  }, [index, y, snap]);

  const settle = () => {
    const i = Math.round(
      -Math.min(maxY, Math.max(minY, y.get())) / WHEEL_ROW_H,
    );
    if (i !== index) onChange(i);
    else animate(y, -i * WHEEL_ROW_H, snap);
  };
  const onDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    drag.current = { startY: e.clientY, startVal: y.get() };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    y.set(
      Math.min(
        maxY,
        Math.max(
          minY,
          drag.current.startVal + (e.clientY - drag.current.startY),
        ),
      ),
    );
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    settle();
  };
  const onWheel = (e: ReactWheelEvent) => {
    e.stopPropagation();
    wheelAcc.current += e.deltaY;
    if (Math.abs(wheelAcc.current) < 18) return;
    const step = Math.sign(wheelAcc.current);
    wheelAcc.current = 0;
    onChange(Math.min(values.length - 1, Math.max(0, index + step)));
  };

  const pad = ((WHEEL_ROWS - 1) / 2) * WHEEL_ROW_H;
  const shifted = useTransform(y, (v) => v + pad);

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onWheel={onWheel}
      style={{
        width,
        height: WHEEL_ROW_H * WHEEL_ROWS,
        overflow: "hidden",
        position: "relative",
        touchAction: "none",
        cursor: "grab",
      }}
    >
      <motion.div style={{ y: shifted }}>
        {values.map((v, i) => (
          <WheelRow key={v} label={v} i={i} y={y} onPick={() => onChange(i)} />
        ))}
      </motion.div>
    </div>
  );
}

function WheelRow({
  label,
  i,
  y,
  onPick,
}: {
  label: string;
  i: number;
  y: MotionValue<number>;
  onPick: () => void;
}) {
  const opacity = useTransform(y, (v) => {
    const d = Math.abs(v + i * WHEEL_ROW_H) / WHEEL_ROW_H;
    return d < 0.5 ? 1 : d < 1.5 ? 0.45 : d < 2.5 ? 0.18 : 0.08;
  });
  return (
    <motion.div
      onClick={onPick}
      style={{
        height: WHEEL_ROW_H,
        display: "grid",
        placeItems: "center",
        opacity,
        color: color.onBrand,
        fontSize: 20,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </motion.div>
  );
}

function WheelPlate({
  width,
  label,
  open,
  onToggle,
  onNudge,
  children,
}: {
  width: number;
  label: string;
  open: boolean;
  onToggle: () => void;
  /** Wheel-scroll on the collapsed plate nudges the value ±1. */
  onNudge: (dir: 1 | -1) => void;
  children: ReactNode;
}) {
  const morph = useMotion("morph");
  const press = usePressFeedback();
  const acc = useRef(0);
  return (
    <Squircle
      role="plate"
      fill={color.brandDeep}
      style={{ width, flexShrink: 0, alignSelf: "flex-start" }}
    >
      {/* Height changes instantly; the ONE surface-height spring reshapes the
          card (a spring here too would chain onto it and stutter). The wheel
          reveals via the shared hierarchical zoom on the layer below. */}
      <div
        style={{
          height: open ? PLATE_H + WHEEL_H : PLATE_H,
          overflow: "hidden",
        }}
      >
        <motion.button
          {...press}
          onClick={onToggle}
          onWheel={(e) => {
            if (open) return;
            acc.current += e.deltaY;
            if (Math.abs(acc.current) < 18) return;
            onNudge(Math.sign(acc.current) as 1 | -1);
            acc.current = 0;
          }}
          style={{
            ...buttonReset,
            width: "100%",
            height: PLATE_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              color: color.onBrand,
              fontSize: 24,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
          <motion.span
            initial={false}
            animate={{ rotate: open ? 180 : 0 }}
            transition={morph}
            style={{ display: "block" }}
          >
            <UpDownChevrons />
          </motion.span>
        </motion.button>
        <div
          style={{
            ...layerZoomStyle(open, "child"),
            pointerEvents: open ? undefined : "none",
          }}
        >
          {children}
        </div>
      </div>
    </Squircle>
  );
}

function TimeStep({
  colRef,
  day,
  hour,
  minute,
  onDay,
  onHour,
  onMinute,
}: {
  colRef?: Ref<HTMLDivElement>;
  day: number;
  hour: number;
  minute: number;
  onDay: (i: number) => void;
  onHour: (i: number) => void;
  onMinute: (i: number) => void;
}) {
  const [openPlate, setOpenPlate] = useState<null | "day" | "time">(null);
  const cycle = (v: number, n: number, d: number) => (v + d + n) % n;
  return (
    <StepColumn colRef={colRef}>
      <StepTitle title="When?" subtitle="add a time for your activity" />
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          flexShrink: 0,
        }}
      >
        <WheelPlate
          width={DAY_W}
          label={WEEKDAYS[day]}
          open={openPlate === "day"}
          onToggle={() => setOpenPlate((p) => (p === "day" ? null : "day"))}
          onNudge={(d) => onDay(cycle(day, 7, d))}
        >
          <WheelColumn
            values={WEEKDAYS}
            index={day}
            onChange={onDay}
            width={DAY_W}
          />
        </WheelPlate>
        <WheelPlate
          width={TIME_W}
          label={`${HOURS[hour]}:${MINUTES[minute]}`}
          open={openPlate === "time"}
          onToggle={() => setOpenPlate((p) => (p === "time" ? null : "time"))}
          onNudge={(d) => onMinute(cycle(minute, 12, d))}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <WheelColumn
              values={HOURS}
              index={hour}
              onChange={onHour}
              width={44}
            />
            <span
              style={{
                height: WHEEL_ROW_H * WHEEL_ROWS,
                display: "grid",
                placeItems: "center",
                color: color.onBrand,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              :
            </span>
            <WheelColumn
              values={MINUTES}
              index={minute}
              onChange={onMinute}
              width={44}
            />
          </div>
        </WheelPlate>
      </div>
    </StepColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — people (Figma 1431:4609)                                    */
/* ------------------------------------------------------------------ */

function PeopleStep({
  colRef,
  people,
  onPeople,
}: {
  colRef?: Ref<HTMLDivElement>;
  people: number;
  onPeople: (n: number) => void;
}) {
  const press = usePressFeedback();
  const pop = useMotion("pop");
  const knob = (side: "minus" | "plus") => {
    const disabled =
      side === "minus" ? people <= PEOPLE_MIN : people >= PEOPLE_MAX;
    return (
      <motion.button
        {...press}
        aria-label={side === "minus" ? "Fewer people" : "More people"}
        onClick={() =>
          onPeople(
            Math.min(
              PEOPLE_MAX,
              Math.max(PEOPLE_MIN, people + (side === "minus" ? -1 : 1)),
            ),
          )
        }
        style={{
          ...buttonReset,
          position: "absolute",
          top: (PEOPLE_PLATE_H - KNOB) / 2,
          [side === "minus" ? "left" : "right"]: KNOB_INSET,
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Squircle
          role="sliderKnob"
          fill={color.offWhite}
          style={{
            width: KNOB,
            height: KNOB,
            display: "grid",
            placeItems: "center",
          }}
        >
          {side === "minus" ? (
            <div
              style={{
                width: 13,
                height: 2.6,
                borderRadius: 1.3,
                background: color.brand,
              }}
            />
          ) : (
            <CrossIcon plus size={10} color={color.brand} />
          )}
        </Squircle>
      </motion.button>
    );
  };
  return (
    <StepColumn colRef={colRef}>
      <StepTitle
        title="How many people can join?"
        subtitle="can be changed any time"
      />
      <Squircle
        role="plate"
        fill={color.brandDeep}
        style={{ width: COL_W, height: PEOPLE_PLATE_H, flexShrink: 0 }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          {/* keyed pop when the number changes — animate the interaction */}
          <motion.span
            key={people}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={pop}
            style={{ color: color.onBrand, fontSize: 24, fontWeight: 600 }}
          >
            {people} people
          </motion.span>
        </div>
        {knob("minus")}
        {knob("plus")}
      </Squircle>
    </StepColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Step 5 — description (Figma 1431:4810)                               */
/* ------------------------------------------------------------------ */

function DescriptionStep({
  colRef,
  description,
  onDescription,
  onSkip,
}: {
  colRef?: Ref<HTMLDivElement>;
  description: string;
  onDescription: (v: string) => void;
  onSkip: () => void;
}) {
  const press = usePressFeedback();
  return (
    <StepColumn colRef={colRef}>
      <StepTitle
        title="Anything they should know?"
        subtitle="add a description for your activity"
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <Squircle
          role="plate"
          fill={color.brandDeep}
          style={{ width: COL_W, height: 134.3 }}
        >
          <textarea
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            placeholder="Write anything..."
            maxLength={220}
            style={{
              ...inputReset,
              position: "absolute",
              inset: 0,
              padding: 12.5,
              color: color.onBrand,
              fontSize: 12,
              fontWeight: 400,
              lineHeight: "15px",
              resize: "none",
            }}
          />
        </Squircle>
        <motion.button
          {...press}
          onClick={onSkip}
          style={{ ...buttonReset, alignSelf: "center" }}
        >
          <span
            style={{
              color: color.lavender,
              fontSize: 12,
              fontWeight: 500,
              ...capTrim,
            }}
          >
            Skip for now
          </span>
        </motion.button>
      </div>
    </StepColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Step 6 — last check (Figma 1431:4918)                                */
/* ------------------------------------------------------------------ */

function CheckStep({
  colRef,
  title,
  address,
  when,
  people,
  description,
}: {
  colRef?: Ref<HTMLDivElement>;
  title: string;
  address: string;
  when: string;
  people: number;
  description: string;
}) {
  return (
    <StepColumn colRef={colRef}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <StepTitle title={title} subtitle={address} />
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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* who can come */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Squircle
            role="badge"
            fill={color.offWhite}
            style={{
              width: 31.5,
              height: 32,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <PersonIcon size={18} color={color.brand} />
          </Squircle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{
                color: color.onBrand,
                fontSize: 16,
                fontWeight: 500,
                ...capTrim,
              }}
            >
              Up to {people} people
            </span>
            <span
              style={{
                color: color.lavender,
                fontSize: 12,
                fontWeight: 400,
                ...capTrim,
              }}
            >
              minimum of 3
            </span>
          </div>
        </div>

        {description && (
          <Squircle
            role="plate"
            fill={color.brandDeep}
            style={{ width: COL_W, padding: 15, boxSizing: "border-box" }}
          >
            {/* break-word so a long unbroken string wraps (and the plate grows
                to fit) instead of overflowing the box — same convention as the
                app's other user-text blocks (plan titles, activity cards). */}
            <p
              style={{
                color: color.lavender,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: "13px",
                margin: 0,
                whiteSpace: "pre-line",
                wordBreak: "break-word",
              }}
            >
              {description}
            </p>
          </Squircle>
        )}
      </div>
    </StepColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Step 7 — success (Figma 1431:5222)                                   */
/* ------------------------------------------------------------------ */

function SuccessStep({ colRef }: { colRef?: Ref<HTMLDivElement> }) {
  return (
    <StepColumn colRef={colRef}>
      <span
        style={{
          color: color.onBrand,
          fontSize: 32,
          fontWeight: 600,
          lineHeight: "32px",
          wordBreak: "break-word",
        }}
      >
        Plan created successfully!
      </span>
    </StepColumn>
  );
}

/* ------------------------------------------------------------------ */
/* The sheet                                                            */
/* ------------------------------------------------------------------ */

export function CreatePlanSheet({
  initialVenue = null,
  onHeight,
  onExit,
  onConfirm,
  onGoToPlan,
}: {
  /** Entering from a venue's CTA pre-fills the location step. */
  initialVenue?: Venue | null;
  /** Reports the active step's natural height so the surface sizes to it. */
  onHeight?: (h: number) => void;
  /** Back on the first step — morphs back to wherever the flow grew from. */
  onExit: () => void;
  /** "Create plan" on the last check — MapHome mints the real plan. */
  onConfirm: (r: CreatePlanResult) => void;
  /** "Go to your plan" on the success card. */
  onGoToPlan: () => void;
}) {
  const press = usePressFeedback();
  const confirm = useConfirm();
  const snap = useMotion("snap");
  const snapMs = ((snap as { duration?: number }).duration ?? 0.3) * 1000;

  const [step, setStep] = useState<StepId>("title");
  // Draft — survives back-and-forth between steps; the component is keyed per
  // flow session, so leaving the flow discards it.
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<DraftTag[]>([]);
  const [location, setLocation] = useState<PlanLocation | null>(
    initialVenue ? { kind: "venue", venueId: initialVenue.id } : null,
  );
  const [day, setDay] = useState(0); // Monday
  const [hour, setHour] = useState(18);
  const [minute, setMinute] = useState(0);
  const [people, setPeople] = useState(6);
  const [description, setDescription] = useState("");

  const activeIdx = step === "success" ? STEPS.length : STEPS.indexOf(step);
  const dotIdx = Math.min(activeIdx, STEPS.length - 1);

  const canNext =
    step === "title"
      ? title.trim().length > 0
      : step === "location"
        ? location != null
        : true;

  const timeLabel = `${HOURS[hour]}:${MINUTES[minute]}`;
  const whenLabel = `${WEEKDAYS[day]} - ${timeLabel}`;
  const addressLabel =
    location?.kind === "venue"
      ? VENUES[location.venueId].address
      : location
        ? `${location.address}, ${location.area}`
        : "";

  const next = () => {
    if (!canNext) return;
    if (step === "check") {
      const result: CreatePlanResult = {
        title: title.trim(),
        tags: tags.map((t) => t.label),
        location: location!,
        day: WEEKDAYS[day],
        time: timeLabel,
        people,
        description: description.trim(),
      };
      // Commit + reveal the success card, gated behind an "are you sure?".
      confirm({
        title: "Create this plan?",
        subtitle: result.title,
        confirmLabel: "Create plan",
      }).then((ok) => {
        if (!ok) return;
        onConfirm(result);
        setStep("success");
      });
      return;
    }
    const i = STEPS.indexOf(step as (typeof STEPS)[number]);
    setStep(STEPS[i + 1]);
  };
  const back = () => {
    if (step === "success") return;
    const i = STEPS.indexOf(step as (typeof STEPS)[number]);
    if (i <= 0) onExit();
    else setStep(STEPS[i - 1]);
  };

  const mainLabel = useScramble(
    step === "check" ? "Create plan" : "Next",
    snapMs,
  );

  // Observe the VISIBLE step's column and report its height (same recipe as
  // ActivitySheet) — switching steps re-points the observer.
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

  const layers: Array<{
    id: StepId;
    node: (ref?: Ref<HTMLDivElement>) => ReactNode;
  }> = [
    {
      id: "title",
      node: (ref) => (
        <TitleStep
          colRef={ref}
          title={title}
          onTitle={setTitle}
          tags={tags}
          onTags={setTags}
        />
      ),
    },
    {
      id: "location",
      node: (ref) => (
        <LocationStep
          colRef={ref}
          location={location}
          onLocation={setLocation}
        />
      ),
    },
    {
      id: "time",
      node: (ref) => (
        <TimeStep
          colRef={ref}
          day={day}
          hour={hour}
          minute={minute}
          onDay={setDay}
          onHour={setHour}
          onMinute={setMinute}
        />
      ),
    },
    {
      id: "people",
      node: (ref) => (
        <PeopleStep colRef={ref} people={people} onPeople={setPeople} />
      ),
    },
    {
      id: "description",
      node: (ref) => (
        <DescriptionStep
          colRef={ref}
          description={description}
          onDescription={setDescription}
          onSkip={next}
        />
      ),
    },
    {
      id: "check",
      node: (ref) => (
        <CheckStep
          colRef={ref}
          title={title.trim() || "Untitled plan"}
          address={addressLabel}
          when={whenLabel}
          people={people}
          description={description.trim()}
        />
      ),
    },
    { id: "success", node: (ref) => <SuccessStep colRef={ref} /> },
  ];

  return (
    <>
      <StepDots active={dotIdx} />

      {layers.map(({ id, node }, i) => {
        const visible = id === step;
        const hiddenAs = i < activeIdx ? "parent" : "child";
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              inset: 0,
              // undefined (inherit), not 'auto' — see ActivitySheet: an
              // explicit value would poke through a closed ancestor layer.
              pointerEvents: visible ? undefined : "none",
              ...layerZoomStyle(visible, hiddenAs),
            }}
          >
            {node(visible ? measureRef : undefined)}
          </div>
        );
      })}

      {/* Persistent footer — pinned to the card's bottom edge across every
          step (the wizard row), swapping for the success actions at the end. */}
      <div
        style={{
          position: "absolute",
          left: PAD_X,
          bottom: PAD_BOTTOM,
          width: COL_W,
          height: FOOTER_H,
          zIndex: 3,
        }}
      >
        {/* back ‹ + Next / Create plan */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            gap: FOOTER_GAP,
            pointerEvents: step === "success" ? "none" : undefined,
            ...layerZoomStyle(step !== "success", "parent"),
          }}
        >
          <motion.button
            {...press}
            aria-label="Back"
            onClick={back}
            style={{ ...buttonReset, flexShrink: 0 }}
          >
            <Squircle
              role="cta"
              fill={color.white}
              style={{
                width: BACK_W,
                height: FOOTER_H,
                display: "grid",
                placeItems: "center",
              }}
            >
              <BackChevron color={color.brand} />
            </Squircle>
          </motion.button>
          <motion.button
            {...press}
            onClick={next}
            initial={false}
            animate={{ opacity: canNext ? 1 : 0.45 }}
            transition={snap}
            style={{
              ...buttonReset,
              flexShrink: 0,
              cursor: canNext ? "pointer" : "default",
            }}
          >
            <Squircle
              role="cta"
              fill={color.white}
              style={{
                width: MAIN_W,
                height: FOOTER_H,
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  color: color.brand,
                  fontSize: 24,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {mainLabel}
              </span>
            </Squircle>
          </motion.button>
        </div>

        {/* Go to your plan + share (Figma 1431:5258) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            gap: FOOTER_GAP,
            pointerEvents: step === "success" ? undefined : "none",
            ...layerZoomStyle(step === "success", "child"),
          }}
        >
          <motion.button
            {...press}
            onClick={onGoToPlan}
            style={{ ...buttonReset, flexShrink: 0 }}
          >
            <Squircle
              role="cta"
              fill={color.white}
              style={{
                width: MAIN_W,
                height: FOOTER_H,
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  color: color.brand,
                  fontSize: 24,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Go to your plan
              </span>
            </Squircle>
          </motion.button>
          {/* share — dead for now, just the press feedback */}
          <motion.button
            {...press}
            aria-label="Share plan"
            style={{ ...buttonReset, flexShrink: 0 }}
          >
            <Squircle
              role="cta"
              fill={color.white}
              style={{
                width: 63,
                height: FOOTER_H,
                display: "grid",
                placeItems: "center",
              }}
            >
              <ShareIcon size={22} color={color.brand} />
            </Squircle>
          </motion.button>
        </div>
      </div>
    </>
  );
}
