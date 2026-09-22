"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { asset } from "./asset";
import { useBoilTuning } from "./boil";
import { useMotionTuning, type EnterKind } from "./motion";
import { createTuningStore } from "./tuning-store";

/**
 * The ransom note: a line of type where every letter is a scrap torn
 * from a different magazine and taped down crooked.
 *
 * After Arlan's study (arlan.me/vault/ransom-note, MIT) — the way a line
 * is composed is his: each character picks one of its scraps off a seeded
 * roll, then gets a small tilt, bounce and size of its own, so the same
 * text and seed always lay the same note. The scraps are his set too, cut
 * from resourceboy.com's pack: 294 WebPs in apps/web/public/ransom/, six
 * for most characters, every one 220px tall (see SCRAPS).
 *
 * What is this site's: nothing eases.
 *
 *   - The scraps land with the site's stop-motion entrance (motion.tsx —
 *     a stamp unless told otherwise), one after another on the note's own
 *     stagger, once the note is in view. A clicked scrap is swapped for
 *     another of its letter in one cut and the new one pops.
 *   - Under a fine pointer the scraps near it are pulled toward it,
 *     lifted, leaned and grown — by their depth, so the line parts
 *     unevenly — and a scrap can be dragged off and thrown; let go, it
 *     springs home. The physics runs every frame but the poses are only
 *     written `fps` times a second: held frames, like the cartel's walk.
 *   - At rest the paper boils: every scrap is re-posed a hair off its
 *     angle at the site's boil rate (boil.tsx), the way a claymation hold
 *     never quite sits still.
 *
 * It is silent; `onLand` and `onSwap` are where the page that uses it
 * puts its sound. /lab/ransom-note is the bench.
 */

// ------------------------------------------------------------ the scraps

/** The scraps' height, px — all of them. */
const SCRAP_H = 220;

/** Every character's scraps: the file stem and each variant's width, in
 *  file order (`A_1.webp` is 116 wide). */
const SCRAPS: Record<string, readonly [stem: string, widths: number[]]> = {
  "0": ["d0", [142, 191, 152, 110, 311, 138]],
  "1": ["d1", [84, 134, 89, 183, 118, 115]],
  "2": ["d2", [173, 143, 197, 177, 100, 140]],
  "3": ["d3", [303, 139, 270, 173, 182, 124]],
  "4": ["d4", [182, 133, 150, 262, 199, 204]],
  "5": ["d5", [154, 174, 181, 208, 171, 190]],
  "6": ["d6", [180, 161, 181, 331, 156, 268]],
  "7": ["d7", [153, 218, 193, 107, 172, 169]],
  "8": ["d8", [196, 185, 156, 230, 162, 190]],
  "9": ["d9", [180, 162, 210, 151, 143, 162]],
  A: ["A", [116, 196, 149, 81, 98, 222]],
  B: ["B", [137, 289, 210, 123, 220, 178]],
  C: ["C", [238, 215, 135, 195, 257, 183]],
  D: ["D", [287, 164, 150, 183, 207, 406]],
  E: ["E", [244, 254, 125, 208, 181, 146]],
  F: ["F", [156, 228, 106, 150, 135, 146]],
  G: ["G", [108, 187, 199, 355, 226, 189]],
  H: ["H", [108, 264, 171, 149, 156, 517]],
  I: ["I", [69, 132, 173, 86, 66, 74]],
  J: ["J", [176, 144, 177, 291, 86, 163]],
  K: ["K", [109, 105, 180, 220, 166, 206]],
  L: ["L", [178, 142, 331, 201, 120, 108]],
  M: ["M", [330, 497, 323, 289, 213, 233]],
  N: ["N", [123, 139, 202, 315, 200, 196]],
  O: ["O", [191, 222, 264, 210, 228, 158]],
  P: ["P", [275, 142, 202, 147, 271, 88]],
  Q: ["Q", [160, 206, 202, 275, 125, 122]],
  R: ["R", [276, 212, 115, 83, 187, 228]],
  S: ["S", [242, 155, 101, 112, 188, 244]],
  T: ["T", [382, 150, 180, 127, 133, 171]],
  U: ["U", [176, 251, 270, 196, 213, 243]],
  V: ["V", [384, 199, 248, 216, 114, 236]],
  W: ["W", [204, 215, 252, 167, 235, 301]],
  X: ["X", [228, 210, 224, 225, 208, 434]],
  Y: ["Y", [232, 129, 190, 128, 167, 120]],
  Z: ["Z", [121, 473, 224, 165, 217, 63]],
  "!": ["excl", [110, 97, 105, 71, 89, 64]],
  "?": ["ques", [146, 178, 130, 172, 142, 170]],
  ",": ["comma", [138, 180, 145, 137, 174]],
  "-": ["dash", [556, 470, 533, 558]],
  "@": ["at", [227, 197, 221, 265, 158, 217]],
  "&": ["amp", [55, 261, 234, 245, 134, 214]],
  $: ["dollar", [148, 131, 110, 187, 218, 171]],
  "%": ["pct", [238, 217, 214, 301, 237, 211]],
  "#": ["hash", [244, 147, 228, 246, 159, 199]],
  "+": ["plus", [193, 215, 227, 218, 222]],
  "/": ["slash", [119, 265, 101, 133, 128]],
  ":": ["colon", [74, 107, 101, 115, 110]],
  "(": ["paren", [90, 80, 84, 86, 78, 62]],
  '"': ["quote", [343, 304, 439, 281, 276, 176]],
};

/** Characters set with another's scraps. The set has one bracket, so the
 *  closing one is the opening one turned over (see `flip`); an apostrophe
 *  is a comma, which the scraps cut at full height anyway. Anything else
 *  the set lacks — a full stop among them — is a gap. */
const STAND_INS: Record<string, string> = {
  ")": "(",
  "'": ",",
  "’": ",",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
};

function keyFor(ch: string): string | null {
  const up = ch.toUpperCase();
  const key = STAND_INS[up] ?? up;
  return key in SCRAPS ? key : null;
}

/** Whether the set can spell `ch`. */
export function hasScrap(ch: string): boolean {
  return keyFor(ch) !== null;
}

// ------------------------------------------------------------- composing

/** One character, placed. `variant` indexes its scraps; `rot` is deg,
 *  `dy` and `mx` shares of the line's height, `depth` how much of the
 *  pointer's pull it takes. */
type Placed =
  | { kind: "space" }
  | {
      kind: "scrap";
      ch: string;
      scrapKey: string;
      variant: number;
      flip: boolean;
      rot: number;
      dy: number;
      scale: number;
      mx: number;
      depth: number;
    };

type Jitter = Pick<RansomTuning, "tilt" | "bounce" | "scaleMix" | "spacing">;

/** The gap between two scraps and the width of a space, as shares of
 *  the line's height. */
const GAP = 0.04;
const SPACE = 0.32;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed from a string (FNV-1a), so a text lays the same note on the
 *  server, the client and every visit. */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Lays one line: a scrap and a jitter for every character, off `seed`.
 *  The roll is drawn in a fixed order, so a knob moves its own numbers
 *  and leaves the scraps where they were. */
function composeLine(text: string, seed: number, j: Jitter): Placed[] {
  const rnd = mulberry32(seed);
  const out: Placed[] = [];
  for (const ch of text) {
    const scrapKey = keyFor(ch);
    if (!scrapKey) {
      out.push({ kind: "space" });
      continue;
    }
    const count = SCRAPS[scrapKey]![1].length;
    out.push({
      kind: "scrap",
      ch,
      scrapKey,
      variant: Math.floor(rnd() * count),
      flip: ch === ")",
      rot: (rnd() * 2 - 1) * j.tilt,
      dy: (rnd() * 2 - 1) * j.bounce,
      scale: 1 + (rnd() * 2 - 1) * j.scaleMix,
      mx: rnd() * j.spacing,
      depth: 0.35 + rnd() * 0.65,
    });
  }
  return out;
}

function scrapWidth(key: string, variant: number, h: number) {
  return (SCRAPS[key]![1][variant]! / SCRAP_H) * h;
}

/** A laid line's width at `lineH`, px. */
function lineWidth(placed: Placed[], lineH: number): number {
  let w = 0;
  placed.forEach((p, i) => {
    if (i > 0) w += lineH * GAP;
    w +=
      p.kind === "space"
        ? lineH * SPACE
        : scrapWidth(p.scrapKey, p.variant, lineH * p.scale) + p.mx * lineH;
  });
  return w;
}

// -------------------------------------------------------------- the knobs

export type RansomTuning = {
  /** The most a scrap is turned, deg either way. */
  tilt: number;
  /** The most it sits off the line, as a share of the line's height. */
  bounce: number;
  /** The most it is scaled, as a share either way. */
  scaleMix: number;
  /** The most extra room after it, as a share of the line's height. */
  spacing: number;
  /** The line's height, px — shrunk per line to fit the note's width. */
  size: number;
  /** ms between one scrap's first cut and the next's. Tighter than the
   *  site's sibling stagger: a note is many small things. */
  stagger: number;
  /** Poses a second under the pointer. 60 is the reference's smooth. */
  fps: number;
  /** How near the pointer a scrap answers it, px. */
  radius: number;
  /** How far it is pulled toward the pointer, px at full depth. */
  push: number;
  /** How far it lifts, px. */
  lift: number;
  /** How far it leans toward the pointer, deg at full depth. */
  lean: number;
  /** How much it grows, as a share. */
  grow: number;
  /** The idle boil: the most a resting scrap is re-posed off its angle,
   *  deg, at the boil tuning's rate. 0 is taped down. */
  sway: number;
};

export const RANSOM_DEFAULTS: Readonly<RansomTuning> = Object.freeze({
  tilt: 8,
  bounce: 0.06,
  scaleMix: 0.12,
  spacing: 0.2,
  size: 78,
  stagger: 60,
  fps: 12,
  radius: 150,
  push: 20,
  lift: 10,
  lean: 8,
  grow: 0.12,
  sway: 0.8,
});

const store = createTuningStore("ransom-tuning", RANSOM_DEFAULTS);

export const setRansomTuning = store.set;
export const resetRansomTuning = store.reset;
export const useRansomTuning = store.useTuning;

// ---------------------------------------------------------- the stylesheet

const RANSOM_CSS = `
/* The note: its lines, centred or from the start. It is the frame the
   pointer's pull is measured in, so it is positioned. Its width is its
   container's, never its lines' (contain) — a centring grid or a flex
   row would otherwise grow it to the longest line, and the fit would
   have nothing to fit to. Give it a container with a width. */
.ransom { position: relative; contain: inline-size; display: grid; gap: calc(var(--ransom-size) * .12); width: 100%; justify-items: center; user-select: none; -webkit-user-select: none; }
.ransom.is-start { justify-items: start; }
.ransom-line { display: flex; flex-wrap: nowrap; align-items: center; }
/* A scrap is three elements so no transform fights another: the pull of
   the pointer (the custom properties, written by useRansomPointer), the
   entrance inside it, and the paper's own crooked rest inside that. */
.ransom-scrap { position: relative; display: block; line-height: 0; transform: translate(var(--px, 0px), var(--py, 0px)) rotate(var(--pr, 0deg)) scale(var(--ps, 1)); }
.ransom-scrap[data-dragging] { z-index: 1; }
.ransom-enter { display: block; }
/* In the page but not yet in view: nothing shows and nothing is queued,
   so every scrap lands from its first pose when the note is armed. */
.ransom:not([data-armed]) .ransom-enter { opacity: 0; animation: none; }
.ransom-paper { display: block; filter: drop-shadow(0 2px 3px rgba(20, 20, 25, .16)) drop-shadow(0 6px 10px rgba(20, 20, 30, .1)); }
.ransom-paper img { display: block; width: 100%; height: 100%; }
.ransom-paper img.is-flipped { scale: -1 1; }
/* Only a fine pointer drags; a finger taps to swap and scrolls the page. */
@media (hover: hover) and (pointer: fine) {
  .ransom-scrap { cursor: grab; touch-action: none; }
  .ransom-scrap[data-dragging] { cursor: grabbing; }
}
`;

/** The note's stylesheet, once per page. */
export function RansomStyles() {
  return <style>{RANSOM_CSS}</style>;
}

// -------------------------------------------------------------- the note

type RansomNoteProps = {
  /** What it says; a newline starts a new line. Set in capitals. */
  text: string;
  /** The roll the scraps are drawn off. Defaults to the text's own hash;
   *  change it to re-roll. */
  seed?: number;
  /** The line's height, px. Defaults to the tuning's. */
  size?: number;
  /** The entrance every scrap lands with. */
  kind?: EnterKind;
  /** ms before the first scrap's first cut. */
  delay?: number;
  /** "view" (default) waits until the note is in the viewport; "mount"
   *  plays at once. Re-key the note to play it again. */
  gate?: "view" | "mount";
  align?: "center" | "start";
  /** A scrap has landed — its place among the note's scraps. */
  onLand?: (index: number) => void;
  /** A scrap was swapped for another of its letter. */
  onSwap?: (ch: string) => void;
  className?: string;
};

export function RansomNote({
  text,
  seed,
  size,
  kind = "stamp",
  delay = 0,
  gate = "view",
  align = "center",
  onLand,
  onSwap,
  className,
}: RansomNoteProps) {
  const t = useRansomTuning();
  const motion = useMotionTuning();
  const lineH = size ?? t.size;
  const rootRef = useRef<HTMLDivElement>(null);
  // The note's width, px, once measured: a line too long for it is set
  // smaller, on its own.
  const [avail, setAvail] = useState<number | null>(null);

  const { tilt, bounce, scaleMix, spacing } = t;
  const roll = seed ?? hashSeed(text);
  const lines = useMemo(
    () =>
      (text || " ")
        .split("\n")
        .map((ln, i) =>
          composeLine(ln, roll + i * 101, { tilt, bounce, scaleMix, spacing }),
        ),
    [text, roll, tilt, bounce, scaleMix, spacing],
  );
  const count = lines.flat().filter((p) => p.kind === "scrap").length;

  // The landing's first cut past the start pose, ms into a scrap's run —
  // when `onLand` is due.
  const landAt = (motion.duration * 1000) / (Math.round(motion.cuts) + 1);
  const landRef = useRef({ onLand, count, delay, step: t.stagger, landAt });
  useEffect(() => {
    landRef.current = { onLand, count, delay, step: t.stagger, landAt };
  });

  // A ref callback owns the gate, as <Enter>'s does: the note is armed on
  // the node, not through state, so the first pose paints on the frame it
  // is decided. React never writes data-armed back (it is not a prop when
  // gated on view), so a re-render leaves an armed note armed.
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      rootRef.current = el;
      if (!el) return;
      const timers: number[] = [];
      const arm = () => {
        el.setAttribute("data-armed", "");
        const land = landRef.current;
        if (!land.onLand) return;
        for (let i = 0; i < land.count; i++) {
          timers.push(
            window.setTimeout(
              () => landRef.current.onLand?.(i),
              land.delay + i * land.step + land.landAt,
            ),
          );
        }
      };
      const ro = new ResizeObserver(() => setAvail(el.clientWidth));
      ro.observe(el);
      let io: IntersectionObserver | null = null;
      const r = el.getBoundingClientRect();
      if (gate === "mount" || (r.top < innerHeight && r.bottom > 0)) {
        arm();
      } else {
        io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              arm();
              io?.disconnect();
            }
          },
          { rootMargin: "0px 0px -10% 0px" },
        );
        io.observe(el);
      }
      return () => {
        ro.disconnect();
        io?.disconnect();
        for (const id of timers) window.clearTimeout(id);
      };
    },
    [gate],
  );

  useRansomPointer(rootRef, t);

  let index = 0;
  return (
    <div
      ref={attach}
      role="img"
      aria-label={text}
      className={["ransom", align === "start" && "is-start", className]
        .filter(Boolean)
        .join(" ")}
      style={{ "--ransom-size": `${lineH}px` } as CSSProperties}
      // Rendered armed when it plays at mount, so it is right without JS.
      {...(gate === "mount" ? { "data-armed": "" } : null)}
    >
      {lines.map((placed, li) => {
        const natural = lineWidth(placed, lineH);
        const h =
          avail !== null && natural > avail
            ? Math.max(20, Math.floor((lineH * avail) / natural))
            : lineH;
        return (
          <div
            key={li}
            className="ransom-line"
            style={{ gap: h * GAP, minHeight: h }}
          >
            {placed.map((p, i) =>
              p.kind === "space" ? (
                <span key={i} style={{ width: h * SPACE }} />
              ) : (
                <Scrap
                  key={i}
                  p={p}
                  lineH={h}
                  kind={kind}
                  delay={delay + index++ * t.stagger}
                  onSwap={onSwap}
                />
              ),
            )}
          </div>
        );
      })}
    </div>
  );
}

/** One cut-out letter. A click swaps it for another of its letter's
 *  scraps: the old one is gone in the cut and the new one pops. The swap
 *  is forgotten when the roll deals this place a new scrap. It is a toy
 *  for the pointer, like the drag — the note reads as its text (role
 *  "img"), and the scraps are not stops on the way through the page. */
function Scrap({
  p,
  lineH,
  kind,
  delay,
  onSwap,
}: {
  p: Extract<Placed, { kind: "scrap" }>;
  lineH: number;
  kind: EnterKind;
  delay: number;
  onSwap?: (ch: string) => void;
}) {
  const [swap, setSwap] = useState<{
    key: string;
    dealt: number;
    picked: number;
  } | null>(null);
  const swapped =
    swap !== null && swap.key === p.scrapKey && swap.dealt === p.variant;
  const variant = swapped ? swap.picked : p.variant;
  const [stem, widths] = SCRAPS[p.scrapKey]!;

  const h = lineH * p.scale;
  const w = scrapWidth(p.scrapKey, variant, h);

  const swapScrap = () => {
    if (widths.length < 2) return;
    // Any of the others, evenly: a roll over one fewer, stepped past the
    // one that is showing.
    const pick = Math.floor(Math.random() * (widths.length - 1));
    setSwap({
      key: p.scrapKey,
      dealt: p.variant,
      picked: pick >= variant ? pick + 1 : pick,
    });
    onSwap?.(p.ch);
  };

  return (
    <span
      className="ransom-scrap"
      data-depth={p.depth.toFixed(2)}
      style={{ marginRight: p.mx * lineH }}
      // No text selection or image drag starts here; the pointer hook
      // takes the drag.
      onPointerDown={(e) => e.preventDefault()}
      onClick={(e) => {
        // The click that ends a drag is not a swap.
        if (e.currentTarget.dataset.dragging === undefined) swapScrap();
      }}
    >
      <span
        className={`ransom-enter sm-enter sm-${kind}`}
        style={{ "--sm-delay": `${delay}ms` } as CSSProperties}
      >
        <span
          className="ransom-paper"
          style={{
            width: w,
            height: h,
            transform: `translateY(${(p.dy * lineH).toFixed(2)}px) rotate(${p.rot.toFixed(2)}deg)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a static
              export has no image optimizer, and the scraps are sized in px */}
          <img
            key={variant}
            src={asset(`/ransom/${stem}_${variant + 1}.webp`)}
            alt=""
            draggable={false}
            decoding="async"
            className={[swapped && "sm-enter sm-pop", p.flip && "is-flipped"]
              .filter(Boolean)
              .join(" ")}
          />
        </span>
      </span>
    </span>
  );
}

// ------------------------------------------------------------ the pointer

/** The spring that brings a thrown scrap home, and the fastest a throw
 *  counts, px/s — the reference's. */
const SPRING = 52;
const DAMPING = 7.5;
const MAX_THROW = 2600;
/** How much a held scrap grows, and how far the pointer travels before a
 *  press is a drag, px. */
const HELD_SCALE = 1.14;
const DRAG_SLOP = 5;
/** How fast a pose closes on its target, and the pointer on the real
 *  one, as the share covered in a 60th of a second. */
const EASE = 0.18;
const POINTER_EASE = 0.35;

type Item = {
  el: HTMLElement;
  depth: number;
  /** Its centre at rest, in the note's frame. */
  cx: number;
  cy: number;
  /** The pointer's pull: offset, lean, and how much of it (0–1). */
  mx: number;
  my: number;
  mr: number;
  ms: number;
  /** The drag: offset and velocity. */
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  held: boolean;
  /** The idle boil's angle, this frame. */
  sway: number;
  /** The pose last put on the page, so a scrap that has not moved is not
   *  written again. */
  pose: string;
};

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};
/** An ease given per 60th of a second, over `dt` s. */
const over = (ease: number, dt: number) => 1 - Math.pow(1 - ease, 60 * dt);

/**
 * The pointer on a note: the pull, the drag, and the idle boil, for
 * every [data-depth] scrap under `ref`. It writes four custom properties
 * on each scrap (--px --py --pr --ps) and nothing else, so React renders
 * the note without knowing. One loop does all of it: it simulates on
 * every animation frame while anything moves, writes poses `fps` times a
 * second, and when only the boil is left it ticks at the boil's rate on
 * a timer instead. The pull and the drag are for fine pointers only;
 * none of it runs under reduced motion.
 */
function useRansomPointer(
  ref: RefObject<HTMLElement | null>,
  tuning: RansomTuning,
) {
  const boilFps = useBoilTuning().boilFps;
  // Read through a ref, so a slider on the bench moves the running loop
  // without tearing it down.
  const live = useRef({ ...tuning, boilFps });
  useEffect(() => {
    live.current = { ...tuning, boilFps };
  });

  useEffect(() => {
    const root = ref.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // The boil is for everyone; the pull and the drag need a fine pointer.
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

    const items = new Map<HTMLElement, Item>();
    let inside = false;
    let onScreen = true;
    // The pointer, real and eased, in the note's frame.
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let timer = 0;
    let last = 0;
    let lastWrite = 0;
    let lastBoil = 0;

    // Centres come from the layout, not the painted boxes, so a scrap
    // that is mid-pull measures where it rests.
    const measure = () => {
      const seen = new Set<HTMLElement>();
      root.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
        seen.add(el);
        const it = items.get(el) ?? {
          el,
          depth: 0.5,
          cx: 0,
          cy: 0,
          mx: 0,
          my: 0,
          mr: 0,
          ms: 0,
          dx: 0,
          dy: 0,
          vx: 0,
          vy: 0,
          held: false,
          sway: 0,
          pose: "",
        };
        it.depth = parseFloat(el.dataset.depth || "0.5");
        it.cx = el.offsetLeft + el.offsetWidth / 2;
        it.cy = el.offsetTop + el.offsetHeight / 2;
        items.set(el, it);
      });
      for (const el of items.keys()) if (!seen.has(el)) items.delete(el);
    };

    const write = (it: Item) => {
      const grown =
        (1 + it.ms * live.current.grow) * (it.held ? HELD_SCALE : 1);
      // `+ 0` turns a rounded -0 into 0, so rest always reads the same.
      const px = `${Number((it.mx + it.dx).toFixed(1)) + 0}px`;
      const py = `${Number((it.my + it.dy).toFixed(1)) + 0}px`;
      const pr = `${Number((it.mr + it.sway).toFixed(2)) + 0}deg`;
      const ps = grown.toFixed(3);
      const pose = `${px} ${py} ${pr} ${ps}`;
      if (pose === it.pose) return;
      it.pose = pose;
      const s = it.el.style;
      s.setProperty("--px", px);
      s.setProperty("--py", py);
      s.setProperty("--pr", pr);
      s.setProperty("--ps", ps);
    };

    const tick = (now: number) => {
      raf = 0;
      timer = 0;
      const k = live.current;
      const dt = last
        ? Math.min(0.05, Math.max(0.001, (now - last) / 1000))
        : 1 / 60;
      last = now;

      const pe = over(POINTER_EASE, dt);
      x += (tx - x) * pe;
      y += (ty - y) * pe;
      const ease = over(EASE, dt);

      let moving = false;
      for (const it of items.values()) {
        let mx = 0;
        let my = 0;
        let mr = 0;
        let ms = 0;
        if (!it.held && inside) {
          const ox = x - it.cx;
          const oy = y - it.cy;
          const dist = Math.hypot(ox, oy);
          const pull = smooth(1 - dist / k.radius);
          const ux = dist > 0.001 ? ox / dist : 0;
          const uy = dist > 0.001 ? oy / dist : 0;
          // Within its own reach of the pointer a scrap only goes as far
          // as the pointer is: it comes to the hand, never past it, and
          // does not flip sides as the pointer crosses its middle.
          const near = k.push > 0 ? Math.min(1, dist / k.push) : 1;
          mx = ux * k.push * pull * it.depth * near;
          my = uy * k.push * pull * it.depth * near - k.lift * pull;
          mr = ux * k.lean * pull * it.depth * near;
          ms = pull;
        }
        it.mx += (mx - it.mx) * ease;
        it.my += (my - it.my) * ease;
        it.mr += (mr - it.mr) * ease;
        it.ms += (ms - it.ms) * ease;
        if (!it.held) {
          it.vx += (-SPRING * it.dx - DAMPING * it.vx) * dt;
          it.vy += (-SPRING * it.dy - DAMPING * it.vy) * dt;
          it.dx += it.vx * dt;
          it.dy += it.vy * dt;
          // Home, near enough: stop, so the loop can.
          if (Math.abs(it.dx) < 0.3 && Math.abs(it.vx) < 2) it.dx = it.vx = 0;
          if (Math.abs(it.dy) < 0.3 && Math.abs(it.vy) < 2) it.dy = it.vy = 0;
        }
        if (
          it.held ||
          it.dx !== 0 ||
          it.dy !== 0 ||
          Math.abs(it.mx - mx) > 0.05 ||
          Math.abs(it.my - my) > 0.05 ||
          Math.abs(it.mr - mr) > 0.05 ||
          Math.abs(it.ms - ms) > 0.005
        )
          moving = true;
      }

      // The boil: every resting scrap takes a new angle on the same
      // frame; one the pointer has, or that is off its place, holds still.
      const boiling = k.sway > 0 && k.boilFps > 0;
      // (A timer can fire a hair early; that still counts as the beat.)
      const reboil = boiling && now - lastBoil >= 1000 / k.boilFps - 4;
      if (reboil) lastBoil = now;
      if (reboil || !boiling) {
        for (const it of items.values()) {
          const resting =
            boiling && !it.held && it.ms < 0.05 && it.dx === 0 && it.dy === 0;
          it.sway = resting ? (Math.random() * 2 - 1) * k.sway : 0;
        }
      }

      // Held frames: the poses are only put on the page `fps` times a
      // second, however often they are worked out.
      if (reboil || now - lastWrite >= 1000 / k.fps - 1) {
        lastWrite = now;
        for (const it of items.values()) write(it);
      }

      if (moving || inside) raf = requestAnimationFrame(tick);
      else if (boiling && onScreen) {
        last = 0;
        timer = window.setTimeout(
          () => tick(performance.now()),
          1000 / k.boilFps,
        );
      }
    };

    const wake = () => {
      if (raf) return;
      window.clearTimeout(timer);
      timer = 0;
      raf = requestAnimationFrame(tick);
    };

    const place = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    };
    const enter = (e: PointerEvent) => {
      measure();
      place(e);
      x = tx;
      y = ty;
      inside = true;
      wake();
    };
    const move = (e: PointerEvent) => {
      place(e);
      inside = true;
      wake();
    };
    const leave = () => {
      inside = false;
      wake();
    };

    // The drag: a press on a scrap that travels past the slop. While it
    // is held the scrap follows the pointer and keeps its velocity, which
    // the throw takes; let go, the spring has it.
    let drag: Item | null = null;
    let dragging = false;
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    let prevX = 0;
    let prevY = 0;
    let prevT = 0;
    const down = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(
        "[data-depth]",
      );
      if (!el) return;
      if (!items.has(el)) measure();
      drag = items.get(el) ?? null;
      if (!drag) return;
      dragging = false;
      pointerId = e.pointerId;
      startX = prevX = e.clientX;
      startY = prevY = e.clientY;
      prevT = e.timeStamp;
    };
    const dragMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== pointerId) return;
      const ox = e.clientX - startX;
      const oy = e.clientY - startY;
      if (!dragging && Math.hypot(ox, oy) > DRAG_SLOP) {
        dragging = true;
        drag.held = true;
        drag.el.dataset.dragging = "";
        try {
          drag.el.setPointerCapture(pointerId);
        } catch {
          // The pointer is already gone; the drag ends on its own.
        }
      }
      if (dragging) {
        const dt = Math.max(0.008, (e.timeStamp - prevT) / 1000);
        drag.vx = 0.4 * drag.vx + 0.6 * ((e.clientX - prevX) / dt);
        drag.vy = 0.4 * drag.vy + 0.6 * ((e.clientY - prevY) / dt);
        drag.dx = ox;
        drag.dy = oy;
        wake();
      }
      prevX = e.clientX;
      prevY = e.clientY;
      prevT = e.timeStamp;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== pointerId) return;
      if (dragging) {
        const speed = Math.hypot(drag.vx, drag.vy);
        if (speed > MAX_THROW) {
          drag.vx *= MAX_THROW / speed;
          drag.vy *= MAX_THROW / speed;
        }
        drag.held = false;
        const el = drag.el;
        try {
          el.releasePointerCapture(pointerId);
        } catch {
          // see dragMove
        }
        // After the click this pointerup is about to fire, so the scrap's
        // own handler still sees a drag and does not swap.
        requestAnimationFrame(() => delete el.dataset.dragging);
        wake();
      }
      drag = null;
      dragging = false;
      pointerId = -1;
    };

    const ro = new ResizeObserver(measure);
    ro.observe(root);
    // A new text, a re-roll, a swapped scrap of another width.
    const mo = new MutationObserver(() => {
      measure();
      wake();
    });
    mo.observe(root, { childList: true, subtree: true });
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) wake();
    });
    io.observe(root);

    if (fine) {
      root.addEventListener("pointerenter", enter);
      root.addEventListener("pointermove", move);
      root.addEventListener("pointerleave", leave);
      root.addEventListener("pointerdown", down);
      addEventListener("pointermove", dragMove);
      addEventListener("pointerup", up);
      addEventListener("pointercancel", up);
    }
    measure();
    wake();

    return () => {
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointerdown", down);
      removeEventListener("pointermove", dragMove);
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
      ro.disconnect();
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      for (const it of items.values()) {
        for (const v of ["--px", "--py", "--pr", "--ps"])
          it.el.style.removeProperty(v);
      }
    };
  }, [ref]);
}
