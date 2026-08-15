/**
 * Content of the unified search sheet — what the pill morphs into. One smart
 * bar (the field lives in BottomBar, anchored above this content), one chips
 * row, one list, three phases:
 *
 *   browse   — the resting state. Typing a keyword filters the list instantly
 *              (substring over title/venue/host) AND'd with the filter chips.
 *              A natural-language query ("i want to do something fun while in
 *              the sun") leaves the list alone and arms the mock AI — it fires
 *              on Enter or after a ~900ms pause.
 *   thinking — the staged status lines (ThinkingTheater) while the "AI" reads
 *              the query. The list dims underneath rather than unmounting.
 *   results  — ranked picks, each with a one-line why. The chips the AI
 *              understood land in the shared chips row (removable, they filter
 *              the map too), and everything else sits dimmed under "More
 *              around you".
 *
 * The chips row holds a "Filters" button + the ACTIVE chips (solid, ×). The
 * manual palette lives behind the button in an INLINE EXPANDER — a panel that
 * unfolds under the row with "When" (days) and "What" (categories) as
 * tap-to-toggle chips, pushing the list down. AI-minted vibe chips and
 * hand-picked chips are the same thing afterwards — one filter model
 * (src/search/filters).
 *
 * While the field is focused and empty, ONE rotating suggestion chip teaches
 * that the bar takes full sentences (a different prompt each focus).
 *
 * Geometry is transcribed 1:1 from the Figma frame (sheet origin x 15.83 /
 * y 127.22, 362 × 697). Text uses CSS cap trimming (text-box) so the Figma
 * gaps — measured cap-to-cap — apply directly.
 */
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Squircle } from "./Squircle";
import { usePressFeedback, useMotion, useMotionExtras } from "./MotionProvider";
import { useDragScroll } from "./useDragScroll";
import { Glyph } from "./icons/Glyph";
import { CrossIcon } from "./icons/CrossIcon";
import { PeerPin } from "./PeerPin";
import { ThinkingTheater } from "./ThinkingTheater";
import { figmaIcons } from "./icons/figmaIcons";
import { peerSticker } from "../theme/peerStickers";
import { color } from "../theme/tokens";
import { CATEGORIES, type CategoryId } from "../theme/categories";
import type { VenueId } from "../data/venues";
import type { PeerPlan } from "../data/peerPlans";
import { ALL_ITEMS, itemFacts, type SearchItem } from "../search/corpus";
import {
  MANUAL_CHIPS,
  chipEmoji,
  chipKey,
  chipLabel,
  matchesFilters,
  type FilterChip,
} from "../search/filters";
import {
  SUGGESTED_PROMPTS,
  classifyQuery,
  interpretQuery,
  theaterLines,
  type Interpretation,
} from "../search/smartSearch";

// Chip icons — lavender Figma variants where the design provides them.
const CHIP_ICON: Partial<Record<CategoryId, string>> = {
  drinks: figmaIcons.chipDrinks,
  sports: figmaIcons.chipSports,
};

// Sheet-relative geometry, transcribed from Figma (sheet = 362 × 697).
const SHEET_H = 697;
const CHIP_ROW = { left: 19.57, top: 78.69, w: 342, h: 34 };
const CONTENT_LEFT = 22.57; // heading + cards (Figma x 38.4)
const CARD_W = 321; // Figma 321.076
const HEADING_TOP = 145.05; // Figma y 272.27 (cap top)
// The column now flows (so the filter panel can push the list down); this gap
// lands the heading at the Figma HEADING_TOP when the panel is closed.
const CHIPS_TO_HEADING = HEADING_TOP - CHIP_ROW.top - CHIP_ROW.h; // 32.36
const HEADING_TO_LIST = 12; // Figma flex gap
// Breathing room after the last card so the end of the list rests with space
// below it (not clipped by the bottom fade). Must exceed the fade (below) so
// the final card lands fully crisp when scrolled to the end.
const LIST_FADE = 16; // bottom fade height
const LIST_PAD_BOTTOM = 22;
const CARD_GAP = 8;
const CARD_H = 72;
const RESULT_CARD_H = 88; // grows to fit the why-line

// How long a natural-language query may rest before the AI fires on its own.
const PAUSE_MS = 900;

// Cap-trimmed text (Figma measures type cap-to-cap). Chromium 133+.
const capTrim = {
  textBoxTrim: "trim-both",
  textBoxEdge: "cap text",
} as CSSProperties;

export function SearchSheet({
  filters,
  onFiltersChange,
  query = "",
  submitTick = 0,
  onAskPrompt,
  active = false,
  fieldFocused = false,
  onOpenEvent,
  onOpenPlan,
}: {
  /** The shared filter chips (CONTROLLED by the map — they filter pins too). */
  filters: FilterChip[];
  onFiltersChange: (chips: FilterChip[]) => void;
  /** Live text from the shared search field. */
  query?: string;
  /** Bumped by BottomBar when the user presses Enter in the field. */
  submitTick?: number;
  /** A suggested prompt was tapped — fill the field and submit it. */
  onAskPrompt?: (prompt: string) => void;
  /** Whether the sheet is up — closing resets the AI phases. */
  active?: boolean;
  /** The smart bar has keyboard focus — shows the one suggestion chip. */
  fieldFocused?: boolean;
  /** Tapping an event row opens that venue event's activity card. */
  onOpenEvent?: (venueId: VenueId, eventId: string) => void;
  /** Tapping a peer row opens that standalone plan's peer card. */
  onOpenPlan?: (plan: PeerPlan) => void;
}) {
  const press = usePressFeedback();
  const entrance = useMotion("entrance");
  const morph = useMotion("morph");
  const snap = useMotion("snap");
  const { entranceStagger } = useMotionExtras();
  const listDrag = useDragScroll("y");
  const chipDrag = useDragScroll("x");

  const [phase, setPhase] = useState<"browse" | "thinking" | "results">(
    "browse",
  );
  const [interp, setInterp] = useState<Interpretation | null>(null);
  // The inline filter expander (the manual When/What palette).
  const [panelOpen, setPanelOpen] = useState(false);

  const trimmed = query.trim();
  const natural = trimmed !== "" && classifyQuery(trimmed) === "natural";

  // Browse list: chips AND typed text. A natural-language sentence is NOT a
  // substring filter (it would empty the list mid-thought) — it leaves the
  // list chips-only until the AI reads it.
  const browseItems = useMemo(() => {
    const q = natural ? "" : trimmed.toLowerCase();
    return ALL_ITEMS.filter(
      (it) =>
        matchesFilters(itemFacts(it), filters) &&
        (q === "" || it.search.includes(q)),
    );
  }, [trimmed, natural, filters]);

  const runAI = useRef(() => {});
  runAI.current = () => {
    setInterp(interpretQuery(trimmed));
    setPhase("thinking");
    setPanelOpen(false); // the AI is about to restate the chips anyway
  };

  // Typing again cancels results/thinking; a resting natural query self-fires.
  useEffect(() => {
    setPhase("browse");
    if (trimmed === "" || classifyQuery(trimmed) !== "natural") return;
    const t = setTimeout(() => runAI.current(), PAUSE_MS);
    return () => clearTimeout(t);
  }, [trimmed]);

  // Enter: natural queries run the AI; a keyword with zero hits promotes to
  // natural (never a dead end); a keyword with hits just keeps its list.
  useEffect(() => {
    if (submitTick === 0 || trimmed === "") return;
    if (classifyQuery(trimmed) === "natural" || browseItems.length === 0)
      runAI.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTick]);

  // Closing the sheet drops any AI phase so the next open starts fresh.
  useEffect(() => {
    if (!active) {
      setPhase("browse");
      setInterp(null);
      setPanelOpen(false);
    }
  }, [active]);

  // ONE suggestion while the field is focused and empty; a different prompt
  // each time it reappears, so repeated opens teach different asks.
  const showSuggestion = phase === "browse" && trimmed === "" && fieldFocused;
  const [promptIdx, setPromptIdx] = useState(0);
  const prevShowSuggestion = useRef(false);
  useEffect(() => {
    if (prevShowSuggestion.current && !showSuggestion)
      setPromptIdx((i) => (i + 1) % SUGGESTED_PROMPTS.length);
    prevShowSuggestion.current = showSuggestion;
  }, [showSuggestion]);

  // Results narrow/widen live as chips are removed — same predicate as the map.
  const resultRows = useMemo(
    () =>
      phase === "results" && interp
        ? interp.results.filter((r) =>
            matchesFilters(itemFacts(r.item), filters),
          )
        : [],
    [phase, interp, filters],
  );
  const resultIds = useMemo(
    () => new Set(resultRows.map((r) => r.item.id)),
    [resultRows],
  );
  const moreRows = useMemo(
    () =>
      phase === "results"
        ? ALL_ITEMS.filter(
            (it) =>
              !resultIds.has(it.id) && matchesFilters(itemFacts(it), filters),
          )
        : [],
    [phase, resultIds, filters],
  );

  const activeKeys = useMemo(() => new Set(filters.map(chipKey)), [filters]);
  const dayPalette = MANUAL_CHIPS.filter((c) => c.kind === "day");
  const catPalette = MANUAL_CHIPS.filter((c) => c.kind === "cat");

  const removeChip = (c: FilterChip) =>
    onFiltersChange(filters.filter((f) => chipKey(f) !== chipKey(c)));
  const toggleChip = (c: FilterChip) =>
    activeKeys.has(chipKey(c))
      ? removeChip(c)
      : onFiltersChange([...filters, c]);

  const heading =
    phase === "results"
      ? interp?.fallback
        ? "Closest picks around you"
        : "Best matches"
      : "Happening around you";

  const openItem = (it: SearchItem) =>
    it.kind === "peer"
      ? onOpenPlan?.(it.plan)
      : onOpenEvent?.(it.venueId, it.eventId);

  return (
    <div
      style={{
        position: "absolute",
        left: CHIP_ROW.left,
        top: CHIP_ROW.top,
        width: CHIP_ROW.w,
        height: SHEET_H - CHIP_ROW.top - 25,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Chips row — the Filters button + the ACTIVE chips (solid, ×). */}
      <div
        {...chipDrag}
        style={{
          height: CHIP_ROW.h,
          flexShrink: 0,
          display: "flex",
          gap: 10,
          alignItems: "center",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
        }}
      >
        <motion.button
          {...press}
          onClick={() => setPanelOpen((o) => !o)}
          aria-label={panelOpen ? "Close filters" : "Open filters"}
          aria-expanded={panelOpen}
          style={{
            flexShrink: 0,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Squircle
            role="chip"
            fill={
              panelOpen ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"
            }
            style={{
              height: CHIP_ROW.h,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 10px",
            }}
          >
            {/* The cross glyph doubles as +: rotated 45° it reads "add", and
                it snaps back to × while the panel is open (geometry morph,
                not a swap). */}
            <motion.span
              animate={{ rotate: panelOpen ? 0 : 45 }}
              transition={snap}
              style={{ display: "grid", placeItems: "center" }}
            >
              <CrossIcon size={10} color={color.lavender} />
            </motion.span>
            <span
              style={{
                color: color.lavender,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Filters
            </span>
          </Squircle>
        </motion.button>
        {filters.map((c) => (
          <motion.div key={chipKey(c)} {...press} style={{ flexShrink: 0 }}>
            <Squircle
              role="chip"
              fill="rgba(255,255,255,0.12)"
              style={{
                height: CHIP_ROW.h,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 10px",
              }}
            >
              <ChipFace chip={c} dim={false} />
              <button
                aria-label={`Remove ${chipLabel(c)}`}
                onClick={() => removeChip(c)}
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 16,
                  height: 16,
                  marginLeft: 2,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <CrossIcon size={9} color={color.lavender} />
              </button>
            </Squircle>
          </motion.div>
        ))}
      </div>

      {/* Inline filter expander — the manual palette, grouped and wrapped.
          Unfolds under the chips row and pushes the list down. */}
      <AnimatePresence initial={false}>
        {panelOpen && (
          <motion.div
            key="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={morph}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <Squircle
              role="card"
              fill="rgba(255,255,255,0.07)"
              style={{
                marginTop: 10,
                padding: "14px 14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <PanelGroup label="When">
                {dayPalette.map((c) => (
                  <PanelChip
                    key={chipKey(c)}
                    chip={c}
                    selected={activeKeys.has(chipKey(c))}
                    onToggle={toggleChip}
                  />
                ))}
              </PanelGroup>
              <PanelGroup label="What">
                {catPalette.map((c) => (
                  <PanelChip
                    key={chipKey(c)}
                    chip={c}
                    selected={activeKeys.has(chipKey(c))}
                    onToggle={toggleChip}
                  />
                ))}
              </PanelGroup>
            </Squircle>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heading + scrollable list (one column, Figma gap 12). */}
      <div
        style={{
          marginTop: CHIPS_TO_HEADING,
          marginLeft: CONTENT_LEFT - CHIP_ROW.left,
          width: CARD_W,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: HEADING_TO_LIST,
        }}
      >
        {phase === "thinking" ? (
          <ThinkingTheater
            lines={theaterLines(trimmed)}
            onDone={() => {
              // Each ask is a FRESH reading — the new chips replace the old
              // set outright. Stacking day/cat chips across queries quietly
              // filtered new answers down to nothing.
              if (interp && !interp.fallback) onFiltersChange(interp.chips);
              setPhase("results");
            }}
          />
        ) : (
          <div
            style={{
              color: color.onBrand,
              fontSize: 16,
              fontWeight: 500,
              ...capTrim,
            }}
          >
            {heading}
          </div>
        )}

        <div
          {...listDrag}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: CARD_GAP,
            paddingBottom: LIST_PAD_BOTTOM,
            scrollbarWidth: "none",
            WebkitMaskImage: `linear-gradient(to bottom, #000 calc(100% - ${LIST_FADE}px), transparent)`,
            maskImage: `linear-gradient(to bottom, #000 calc(100% - ${LIST_FADE}px), transparent)`,
            // Thinking dims the list rather than unmounting it (wall-clock CSS).
            opacity: phase === "thinking" ? 0.3 : 1,
            transition: "opacity 0.25s ease-out",
            pointerEvents: phase === "thinking" ? "none" : undefined,
          }}
        >
          {/* One suggestion while the field is focused — teaches that the bar
              takes full sentences without eating the list. pointerDown so the
              tap wins the race against the field's blur unmounting it. */}
          <AnimatePresence initial={false}>
            {showSuggestion && (
              <motion.button
                key="suggestion"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={entrance}
                {...press}
                onPointerDown={() =>
                  onAskPrompt?.(SUGGESTED_PROMPTS[promptIdx])
                }
                style={{
                  alignSelf: "flex-start",
                  flexShrink: 0,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <Squircle
                  role="chip"
                  fill="rgba(255,255,255,0.08)"
                  style={{
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "0 12px",
                  }}
                >
                  <img
                    src={figmaIcons.shootingStar}
                    alt=""
                    style={{ width: 13, height: 13, display: "block" }}
                  />
                  <span
                    style={{
                      color: color.lavender,
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    try “{SUGGESTED_PROMPTS[promptIdx]}”
                  </span>
                </Squircle>
              </motion.button>
            )}
          </AnimatePresence>

          {phase === "results" ? (
            <>
              {resultRows.length === 0 && (
                <div
                  style={{
                    color: color.lavender,
                    fontSize: 14,
                    fontWeight: 400,
                    paddingTop: 4,
                    ...capTrim,
                  }}
                >
                  Nothing left — remove a filter to widen the net.
                </div>
              )}
              {resultRows.map((r, i) => (
                <motion.div
                  key={r.item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...entrance, delay: i * entranceStagger }}
                >
                  <ItemCard item={r.item} why={r.why} onTap={openItem} />
                </motion.div>
              ))}
              {moreRows.length > 0 && (
                <>
                  <div
                    style={{
                      color: color.lavender,
                      fontSize: 13,
                      fontWeight: 500,
                      marginTop: 14,
                      marginBottom: 4,
                      ...capTrim,
                    }}
                  >
                    More around you
                  </div>
                  {moreRows.map((it) => (
                    <div key={it.id} style={{ opacity: 0.55 }}>
                      <ItemCard item={it} onTap={openItem} />
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {browseItems.length === 0 && (
                <div
                  style={{
                    color: color.lavender,
                    fontSize: 14,
                    fontWeight: 400,
                    paddingTop: 4,
                    ...capTrim,
                  }}
                >
                  Nothing matches your search.
                </div>
              )}
              {browseItems.map((it) => (
                <ItemCard key={it.id} item={it} onTap={openItem} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** A labelled group inside the filter expander ("When" / "What"). */
function PanelGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          color: color.lavender,
          fontSize: 11,
          fontWeight: 600,
          opacity: 0.8,
          ...capTrim,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

/** A tap-to-toggle chip in the expander — selected inverts to white. */
function PanelChip({
  chip,
  selected,
  onToggle,
}: {
  chip: FilterChip;
  selected: boolean;
  onToggle: (chip: FilterChip) => void;
}) {
  const press = usePressFeedback();
  const fg = selected ? color.brand : color.lavender;
  return (
    <motion.button
      {...press}
      onClick={() => onToggle(chip)}
      aria-pressed={selected}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <Squircle
        role="chip"
        fill={selected ? "#fff" : "rgba(255,255,255,0.1)"}
        style={{
          height: 32,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 11px",
        }}
      >
        {chip.kind === "cat" && (
          <Glyph name={CATEGORIES[chip.id].glyph} size={14} color={fg} />
        )}
        <span
          style={{
            color: fg,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {chipLabel(chip)}
        </span>
      </Squircle>
    </motion.button>
  );
}

/** A chip's face: vibe emoji / category glyph / plain day label. */
function ChipFace({ chip, dim }: { chip: FilterChip; dim: boolean }) {
  const emoji = chipEmoji(chip);
  const textColor = color.lavender;
  return (
    <>
      {emoji ? (
        <span style={{ fontSize: 13, lineHeight: 1 }}>{emoji}</span>
      ) : chip.kind === "cat" ? (
        CHIP_ICON[chip.id] ? (
          <img
            src={CHIP_ICON[chip.id]}
            alt=""
            style={{ height: 17, width: "auto", display: "block" }}
          />
        ) : (
          <Glyph name={CATEGORIES[chip.id].glyph} size={15} color={textColor} />
        )
      ) : null}
      <span
        style={{
          color: textColor,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
          opacity: dim ? 0.9 : 1,
        }}
      >
        {chipLabel(chip)}
      </span>
    </>
  );
}

/** One list row — venue event (glyph tile) or peer plan (avatar tile), with an
 *  optional mock-AI why-line under the meta. */
function ItemCard({
  item,
  why,
  onTap,
}: {
  item: SearchItem;
  why?: string;
  onTap: (item: SearchItem) => void;
}) {
  const press = usePressFeedback();
  return (
    <motion.button
      {...press}
      onClick={() => onTap(item)}
      style={{
        flexShrink: 0,
        background: "transparent",
        border: "none",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
        display: "block",
        width: "100%",
      }}
    >
      <Squircle
        role="card"
        fill={color.brandDeep}
        style={{
          height: why ? RESULT_CARD_H : CARD_H,
          display: "flex",
          alignItems: "center",
          gap: 12,
          // Avatar rows hug tighter (Figma px-12 vs px-16) — the 45px
          // tile is visually heavier than the line glyphs.
          padding: `0 ${item.kind === "peer" ? 12 : 16}px`,
        }}
      >
        {item.kind === "peer" ? (
          <PeerPin
            size={45}
            badge={peerSticker(`${item.plan.title} ${item.plan.description}`)}
          />
        ) : (
          <img
            src={item.icon}
            alt=""
            style={{
              height: item.iconH,
              width: "auto",
              display: "block",
              flexShrink: 0,
            }}
          />
        )}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* overflow:hidden clips descenders below the cap-trimmed box,
              so instead let long real-data titles ellipsize on one line. */}
          <span
            style={{
              color: color.onBrand,
              fontSize: 16,
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              ...capTrim,
            }}
          >
            {item.title}
          </span>
          <span
            style={{
              color: color.lavender,
              fontSize: 12,
              fontWeight: 500,
              ...capTrim,
            }}
          >
            {item.meta}
          </span>
          {why && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                color: color.lavender,
                fontSize: 12,
                fontWeight: 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                ...capTrim,
              }}
            >
              <img
                src={figmaIcons.shootingStar}
                alt=""
                style={{
                  width: 11,
                  height: 11,
                  display: "block",
                  flexShrink: 0,
                }}
              />
              {why}
            </span>
          )}
        </div>
        <img
          src={figmaIcons.chevron}
          alt=""
          style={{ width: 8, height: 11.33, display: "block", flexShrink: 0 }}
        />
      </Squircle>
    </motion.button>
  );
}
