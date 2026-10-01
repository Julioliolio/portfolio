"use client";

import { asset } from "@portfolio/lab/asset";
import {
  clayCursorOverride as override,
  clayCursorTuning as tuning,
  type ClayCursorVariant as Variant,
} from "@portfolio/lab/cursor-tuning";
import { useEffect, useRef } from "react";

/**
 * Site-wide clay cursor. The tip is glued to the real pointer — position
 * is never animated, so it is exactly as responsive as the OS cursor. The
 * body leans a few degrees with pointer velocity (pivoting at the tip),
 * ramping in softly, and springs back upright when the pointer stops —
 * the Tramuntana hover-card feel, with the touch of bounce the tuning
 * gives it. Pressing squishes it slightly.
 *
 * Scope: the whole viewport, including the same-origin demo iframes.
 * The parent window receives no pointer events while the pointer is over
 * an iframe, so each same-origin iframe gets listeners attached to its
 * own document (coordinates translated into viewport space) plus an
 * injected `cursor: none` style. Cross-origin iframes are left alone.
 *
 * The native cursor is hidden by the `html.clay-cursor` rule in
 * globals.css, applied only while this component is active — no-JS,
 * touch-only, and coarse-pointer sessions keep the OS cursor.
 *
 * The arrow is a set of photos of the same clay arrow re-posed slightly,
 * cycled at a stop-motion rate so the outline "boils" like a claymation
 * hold. Over interactive elements it becomes a clay pointing hand with its
 * own boil frames, animated identically; over the glyphs of readable text
 * it becomes a clay I-beam, likewise. prepare-cursor.mjs registers each
 * variant's frames at its hotspot (arrow tip / index fingertip / the
 * beam's middle) and pads them to identical dimensions, so swapping frames
 * never moves the hotspot. Text inside `data-cursor="arrow"` keeps the
 * arrow: words that are the picture, like the landing's greeting.
 *
 * Over an element carrying `data-cursor-label` a small tag with that text
 * rides beside the hand — cut in with the site's pop entrance (the sm-pop
 * keyframes from @portfolio/lab/motion, in the document via the root
 * layout), cut off the moment the pointer leaves. The landing's project
 * cards say "open".
 *
 * All variants are always mounted, stacked with their hotspots on the same
 * point. A change of shape is a short crossfade with a squish dip at
 * the midpoint, so the clay reads as re-forming rather than being cut to a
 * different object. The hand is drawn at tuning.pointerScale x the arrow's
 * height so the two read as the same size — see that knob for why equal
 * pixel heights do not look equal.
 */

// Physics + size knobs live in @portfolio/lab/cursor-tuning (mutable at
// runtime — /lab/clay-cursor is a slider bench over them). Only the asset
// geometry stays here.
// Hotspots as fractions of the image (measured from the prepared assets —
// prepare-cursor.mjs prints the pointer's fingertip column when it runs).
const ARROW_HOTSPOT = { x: 0.064, y: 0.01 }; // arrow tip
const POINTER_HOTSPOT = { x: 0.39, y: 0.01 }; // index fingertip
const TEXT_HOTSPOT = { x: 0.5, y: 0.5 }; // the middle of the beam

// WebP at 2x the display size (prepare-cursor.mjs) — the whole set is a
// few dozen KB, so warming every frame on mount is cheap.
const ARROW_FRAMES = Array.from({ length: 14 }, (_, i) =>
  asset(`/cursor/arrow-${i + 1}.webp`),
);
const POINTER_FRAMES = Array.from({ length: 5 }, (_, i) =>
  asset(`/cursor/arrow-pointer-${i + 1}.webp`),
);
const TEXT_FRAMES = Array.from({ length: 12 }, (_, i) =>
  asset(`/cursor/text-${i + 1}.webp`),
);
const VARIANTS = ["arrow", "pointer", "text"] as const;
const INTERACTIVE =
  "a,button,[role=button],label,select,summary,[data-cursor=pointer]";
const EDITABLE =
  "textarea,[contenteditable=''],[contenteditable=true],input:not([type]),input[type=text],input[type=search],input[type=email],input[type=url],input[type=tel],input[type=password],input[type=number]";

/** Whether (x, y), in `doc`'s viewport, is on a run of text, the way the OS
 *  decides to show its I-beam: on the lines of a text node, with the
 *  line's leading counted in so the gaps between lines don't flicker back
 *  to the arrow, but not in a block's margins beside or below the text. */
function overText(doc: Document, x: number, y: number) {
  const node =
    "caretPositionFromPoint" in doc
      ? doc.caretPositionFromPoint(x, y)?.offsetNode
      : (doc as Document).caretRangeFromPoint?.(x, y)?.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim())
    return false;
  const parent = node.parentElement;
  if (!parent) return false;
  const lineHeight = parseFloat(getComputedStyle(parent).lineHeight);
  const range = doc.createRange();
  range.selectNodeContents(node);
  for (const r of range.getClientRects()) {
    const lead = Number.isFinite(lineHeight)
      ? Math.max(0, (lineHeight - r.height) / 2)
      : 0;
    if (
      x >= r.left &&
      x <= r.right &&
      y >= r.top - lead &&
      y <= r.bottom + lead
    )
      return true;
  }
  return false;
}

// The label: a small ink-on-wall tag in the mono cut, growing from its
// left edge (next to the hand) when it pops in.
const LABEL_CSS = `
.clay-cursor-label { position: absolute; display: none; padding: 5px 9px; border: 1px solid #2b2722; border-radius: 999px; background: #faf9f6; color: #2b2722; font: 500 11px/1 var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; transform-origin: 0 50%; box-shadow: 0 2px 6px rgba(0, 0, 0, .12); }
`;

export function ClayCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLImageElement>(null);
  const pointerRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLImageElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const arrowImg = arrowRef.current;
    const pointerImg = pointerRef.current;
    const textImg = textRef.current;
    const labelEl = labelRef.current;
    if (!root || !arrowImg || !pointerImg || !textImg || !labelEl) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.documentElement.classList.add("clay-cursor");

    const layers: Record<
      Variant,
      {
        img: HTMLImageElement;
        frames: string[];
        hotspot: { x: number; y: number };
      }
    > = {
      arrow: { img: arrowImg, frames: ARROW_FRAMES, hotspot: ARROW_HOTSPOT },
      pointer: {
        img: pointerImg,
        frames: POINTER_FRAMES,
        hotspot: POINTER_HOTSPOT,
      },
      text: { img: textImg, frames: TEXT_FRAMES, hotspot: TEXT_HOTSPOT },
    };

    // Physics state, mutated per-frame outside React.
    const pos = { x: -100, y: -100 }; // real pointer; drawn 1:1, never animated
    let vx = 0; // smoothed horizontal pointer velocity, px/s
    let angle = 0; // pendulum swing around the tip
    let angleVel = 0;
    let scale = 1;
    let scaleVel = 0;
    let pressed = false;
    let visible = false;
    let seenFirstMove = false;

    // How much of each shape is showing; always sums to 1. The target's
    // share moves linearly toward 1 so a hover that flickers just reverses
    // mid-way instead of restarting; the eased shares drive opacity, the
    // raw ones the squish.
    let target: Variant = "arrow";
    const weight: Record<Variant, number> = { arrow: 1, pointer: 0, text: 0 };
    const drawnWeight: Record<Variant, number> = {
      arrow: -1,
      pointer: -1,
      text: -1,
    };
    // What each layer and the root were last drawn with.
    const drawnPose: Record<Variant, string> = {
      arrow: "",
      pointer: "",
      text: "",
    };
    let drawnAt = "";
    // The tag beside the hand; null while the pointer is over nothing
    // labelled.
    let label: string | null = null;

    let frameIdx = 0;
    let boilAcc = 0; // seconds accumulated toward the next boil frame
    let appliedSize = "";
    // What the body is drawn with. Tracks the physics every frame at
    // tuning.stepFps 0; otherwise sampled from it on the beat.
    let stepAcc = 0;
    let shownAngle = 0;
    let shownScale = 1;

    /** Display height per variant. The variants ship at the same pixel
     * height, but the hand carries a thin raised finger where the arrow has
     * solid body, so matching heights makes the hand read smaller —
     * pointerScale compensates so the swap has no size pop. The I-beam
     * has its own textScale. */
    function displaySize(v: Variant) {
      if (v === "pointer") return tuning.size * tuning.pointerScale;
      if (v === "text") return tuning.size * tuning.textScale;
      return tuning.size;
    }

    function applySizes() {
      // The tag sits off the hand's lower right, clear of the finger.
      labelEl!.style.left = `${tuning.size * 0.62}px`;
      labelEl!.style.top = `${tuning.size * 0.98}px`;
      for (const v of VARIANTS) {
        const size = displaySize(v);
        const { img } = layers[v];
        img.style.height = `${size}px`;
        // A soft contact shadow, traced from the cursor's own alpha (not a
        // boxy CSS shadow) via drop-shadow — scaled with size so it stays
        // proportional if the cursor is resized on the bench. Light from
        // upper-left, like the page is lit from the same side as the UI.
        img.style.filter = `drop-shadow(${size * 0.05}px ${size * 0.08}px ${
          size * 0.06
        }px rgba(0, 0, 0, 0.35))`;
      }
    }

    // Warm the browser cache so frame swaps never flash a missing image.
    const preload = [...ARROW_FRAMES, ...POINTER_FRAMES, ...TEXT_FRAMES].map(
      (src) => {
        const im = new Image();
        im.src = src;
        return im;
      },
    );
    void preload;

    function applyFrames() {
      for (const v of VARIANTS) {
        // Only the shapes that show: a hidden one re-posed in the dark
        // was a repaint for nothing, three a beat (2026-10-01). It
        // catches up on the first beat it shows on.
        if (weight[v] <= 0) continue;
        const { img, frames } = layers[v];
        const next = frames[frameIdx % frames.length];
        if (next && !img.src.endsWith(next)) img.src = next;
      }
    }

    /** The label an element asks for, if any. */
    function labelOf(el: Element | null): string | null {
      return (
        el?.closest("[data-cursor-label]")?.getAttribute("data-cursor-label") ||
        null
      );
    }

    /** Swaps the tag. A new text pops in from its first pose: the tag is
     *  hidden and shown again across a reflow, which restarts its
     *  animation; no text cuts it off at once. */
    function applyLabel(next: string | null) {
      if (next === label) return;
      label = next;
      labelEl!.style.display = "none";
      if (!next) return;
      labelEl!.textContent = next;
      void labelEl!.offsetWidth;
      labelEl!.style.display = "block";
    }

    function show() {
      if (visible) return;
      visible = true;
      root!.style.opacity = "1";
    }
    function hide() {
      visible = false;
      root!.style.opacity = "0";
    }

    const prev = { x: -100, y: -100 }; // pos at last frame, for velocity

    /** `x`, `y` are in the parent viewport, where the cursor is drawn;
     *  `localX`, `localY` in the viewport of the document the event came
     *  from, which the text hit-test needs. */
    function onMove(
      x: number,
      y: number,
      eventTarget: EventTarget | null,
      localX = x,
      localY = y,
    ) {
      if (!seenFirstMove) {
        // Don't register the jump from the parked position as a flick.
        prev.x = x;
        prev.y = y;
        seenFirstMove = true;
      }
      pos.x = x;
      pos.y = y;
      show();
      const el = eventTarget instanceof Element ? eventTarget : null;
      target = !el
        ? "arrow"
        : el.closest(INTERACTIVE)
          ? "pointer"
          : el.closest(EDITABLE) ||
              (!el.closest("[data-cursor=arrow]") &&
                overText(el.ownerDocument, localX, localY))
            ? "text"
            : "arrow";
      applyLabel(labelOf(el));
    }

    const press = () => {
      pressed = true;
    };
    const release = () => {
      pressed = false;
    };

    // --- main window listeners ---
    const onWindowMove = (e: PointerEvent) =>
      onMove(e.clientX, e.clientY, e.target);
    window.addEventListener("pointermove", onWindowMove, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    // A card that leaves under a still pointer (the road signs drop
    // theirs on a timer) must take its tag with it.
    const onOut = (e: PointerEvent) => {
      applyLabel(
        e.relatedTarget instanceof Element ? labelOf(e.relatedTarget) : null,
      );
    };
    window.addEventListener("pointerout", onOut, { passive: true });

    // --- same-origin iframe wiring ---
    const wiredDocs = new WeakSet<Document>();
    const iframeCleanups: (() => void)[] = [];

    function wireIframe(iframe: HTMLIFrameElement) {
      const attach = () => {
        let doc: Document | null = null;
        try {
          doc = iframe.contentDocument;
        } catch {
          return; // cross-origin — leave its native cursor alone
        }
        if (!doc || wiredDocs.has(doc)) return;
        wiredDocs.add(doc);

        const style = doc.createElement("style");
        style.textContent = "*,*::before,*::after{cursor:none!important}";
        (doc.head ?? doc.documentElement)?.appendChild(style);

        const frameMove = (e: PointerEvent) => {
          // Iframe-viewport coords -> parent-viewport coords. The ratio
          // covers CSS transforms scaling the iframe box.
          const rect = iframe.getBoundingClientRect();
          const sx = rect.width / (iframe.clientWidth || rect.width || 1);
          const sy = rect.height / (iframe.clientHeight || rect.height || 1);
          onMove(
            rect.left + e.clientX * sx,
            rect.top + e.clientY * sy,
            e.target,
            e.clientX,
            e.clientY,
          );
        };
        doc.addEventListener("pointermove", frameMove, { passive: true });
        doc.addEventListener("pointerdown", press, { passive: true });
        doc.addEventListener("pointerup", release, { passive: true });
        doc.documentElement?.addEventListener("mouseleave", hide);
        iframeCleanups.push(() => {
          doc!.removeEventListener("pointermove", frameMove);
          doc!.removeEventListener("pointerdown", press);
          doc!.removeEventListener("pointerup", release);
        });
      };
      attach(); // already-loaded doc (e.g. about:blank or fast load)
      iframe.addEventListener("load", attach); // (re)navigations get a new doc
      iframeCleanups.push(() => iframe.removeEventListener("load", attach));
    }

    document.querySelectorAll("iframe").forEach(wireIframe);
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node instanceof HTMLIFrameElement) wireIframe(node);
          node.querySelectorAll?.("iframe").forEach(wireIframe);
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // --- physics loop ---
    let raf = 0;
    let lastT = performance.now();
    function tick(t: number) {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((t - lastT) / 1000, 1 / 30); // clamp tab-switch jumps
      lastT = t;
      if (dt <= 0) return;

      // Sizes are re-derived each frame so bench edits land immediately;
      // the style writes only happen when something changed.
      const sizeKey = `${tuning.size} ${tuning.pointerScale} ${tuning.textScale}`;
      if (sizeKey !== appliedSize) {
        appliedSize = sizeKey;
        applySizes();
      }

      const instVx = (pos.x - prev.x) / dt;
      prev.x = pos.x;
      prev.y = pos.y;
      const blendRate = 1 - Math.exp(-dt * tuning.velocitySmoothing);
      vx += (instVx - vx) * blendRate;

      // Stop-motion boil: hold each frame for 1/boilFps, then jump to a
      // random other frame — never the same one twice, so every beat is a
      // visible pose change. Advancing only on the beat (not every rAF) is
      // what reads as claymation rather than flicker.
      if (!reducedMotion.matches && tuning.boilFps > 0) {
        boilAcc += dt;
        const hold = 1 / tuning.boilFps;
        if (boilAcc >= hold) {
          boilAcc %= hold;
          // One shared index drives both layers; a step shorter than the
          // smaller set guarantees each layer's `idx % length` changes on
          // every beat, so neither variant ever holds the same pose twice.
          const count = Math.min(
            ARROW_FRAMES.length,
            POINTER_FRAMES.length,
            TEXT_FRAMES.length,
          );
          if (count > 1)
            frameIdx += 1 + Math.floor(Math.random() * (count - 1));
          applyFrames();
        }
      }

      // Shape transition. The bench can pin the shape to play a swap on
      // demand; otherwise hover decides. The target gains share and the
      // others give theirs up in proportion, so a swap that changes its
      // mind mid-way (hand -> I-beam) still fades out whatever is showing.
      const shape = override.variant ?? target;
      const gain =
        reducedMotion.matches || tuning.swapMs <= 0
          ? 1
          : (dt * 1000) / tuning.swapMs;
      const from = 1 - weight[shape];
      if (from > 0) {
        weight[shape] = Math.min(1, weight[shape] + gain);
        const keep = (1 - weight[shape]) / from;
        for (const v of VARIANTS) if (v !== shape) weight[v] *= keep;
      }

      if (reducedMotion.matches) {
        angle = 0;
        angleVel = 0;
      } else {
        // Lean with velocity, pivoting at the tip; the damping decides how
        // it comes back upright when the pointer stops (no bounce near
        // critical) — the weight reads from the ramp and glide.
        const targetAngle = Math.max(
          -tuning.maxTilt,
          Math.min(tuning.maxTilt, vx * tuning.tiltPerVx),
        );
        angleVel +=
          (tuning.tiltStiffness * (targetAngle - angle) -
            tuning.tiltDamping * angleVel) *
          dt;
        angle += angleVel * dt;
      }

      const targetScale = pressed ? tuning.pressScale : 1;
      scaleVel +=
        (tuning.scaleStiffness * (targetScale - scale) -
          tuning.scaleDamping * scaleVel) *
        dt;
      scale += scaleVel * dt;

      // The squish dip peaks half-way through the crossfade, so the clay
      // looks like it pinches in and re-forms as the other shape.
      const lead = Math.max(weight.arrow, weight.pointer, weight.text);
      const morph = 1 - tuning.swapSquish * Math.sin(Math.PI * (1 - lead));

      // Stop-motion body: the springs above run every frame, but the lean
      // and squish that get drawn only catch up on the beat, so the body
      // moves in held poses (and overshoots, since the springs do). The
      // position write below is never held — the tip stays on the pointer.
      if (tuning.stepFps > 0 && !reducedMotion.matches) {
        stepAcc += dt;
        const hold = 1 / tuning.stepFps;
        if (stepAcc >= hold) {
          stepAcc %= hold;
          shownAngle = angle;
          shownScale = scale * morph;
        }
      } else {
        stepAcc = 0;
        shownAngle = angle;
        shownScale = scale * morph;
      }

      const at = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (at !== drawnAt) root!.style.transform = drawnAt = at;
      // Each layer is pinned by its own hotspot: the percent translate is
      // relative to that image's box, so no measuring is needed and the
      // rotate/scale (origin 0 0, applied after) pivot exactly on the tip.
      // Rounded, and written only when it changes: the springs settle
      // toward rest forever, and a pose rewritten on every beat was a
      // repaint ten times a second, each one having the page re-layer
      // itself under the cursor (2026-10-01, the project sheets).
      const pose = `rotate(${shownAngle.toFixed(2)}deg) scale(${shownScale.toFixed(4)})`;
      for (const v of VARIANTS) {
        const { img, hotspot } = layers[v];
        if (pose !== drawnPose[v]) {
          drawnPose[v] = pose;
          img.style.transform = `${pose} translate(${-hotspot.x * 100}%, ${-hotspot.y * 100}%)`;
        }
        const w = weight[v];
        if (w !== drawnWeight[v]) {
          drawnWeight[v] = w;
          img.style.opacity = `${w * w * (3 - 2 * w)}`;
        }
      }
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      iframeCleanups.forEach((fn) => fn());
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", hide);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.documentElement.classList.remove("clay-cursor");
    };
  }, []);

  const layerStyle = {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "auto",
    maxWidth: "none",
    transformOrigin: "0 0",
  };

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 opacity-0"
      style={{ zIndex: 2147483647 }}
    >
      <style>{LABEL_CSS}</style>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny asset, transforms every frame; next/image adds nothing here */}
      <img
        ref={arrowRef}
        src={ARROW_FRAMES[0]}
        alt=""
        draggable={false}
        style={{ ...layerStyle, height: `${tuning.size}px`, opacity: 1 }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- same as above */}
      <img
        ref={pointerRef}
        src={POINTER_FRAMES[0]}
        alt=""
        draggable={false}
        style={{
          ...layerStyle,
          height: `${tuning.size * tuning.pointerScale}px`,
          opacity: 0,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- same as above */}
      <img
        ref={textRef}
        src={TEXT_FRAMES[0]}
        alt=""
        draggable={false}
        style={{
          ...layerStyle,
          height: `${tuning.size * tuning.textScale}px`,
          opacity: 0,
        }}
      />
      {/* The pop (sm-enter sm-pop) plays each time the tag is shown. */}
      <span ref={labelRef} className="clay-cursor-label sm-enter sm-pop" />
    </div>
  );
}
