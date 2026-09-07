"use client";

import { asset } from "@portfolio/lab/asset";
import {
  clayCursorOverride as override,
  clayCursorTuning as tuning,
} from "@portfolio/lab/cursor-tuning";
import { useEffect, useRef } from "react";

/**
 * Site-wide clay cursor. The tip is glued to the real pointer — position
 * is never animated, so it is exactly as responsive as the OS cursor. The
 * body leans a few degrees with pointer velocity (pivoting at the tip),
 * ramping in softly, and eases back upright with no bounce when the
 * pointer stops — the Tramuntana hover-card feel. Pressing squishes it
 * slightly.
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
 * own boil frames, animated identically. prepare-cursor.mjs registers each
 * variant's frames at its hotspot (arrow tip / index fingertip) and pads
 * them to identical dimensions, so swapping frames never moves the hotspot.
 *
 * Both variants are always mounted, stacked with their hotspots on the same
 * point. The arrow<->hand change is a short crossfade with a squish dip at
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

// WebP at 2x the display size (prepare-cursor.mjs) — the whole set is a
// few dozen KB, so warming every frame on mount is cheap.
const ARROW_FRAMES = Array.from({ length: 14 }, (_, i) =>
  asset(`/cursor/arrow-${i + 1}.webp`),
);
const POINTER_FRAMES = Array.from({ length: 5 }, (_, i) =>
  asset(`/cursor/arrow-pointer-${i + 1}.webp`),
);
const INTERACTIVE =
  "a,button,[role=button],label,select,summary,[data-cursor=pointer]";

type Variant = "arrow" | "pointer";

export function ClayCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLImageElement>(null);
  const pointerRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const arrowImg = arrowRef.current;
    const pointerImg = pointerRef.current;
    if (!root || !arrowImg || !pointerImg) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.documentElement.classList.add("clay-cursor");

    const layers: Record<
      Variant,
      { img: HTMLImageElement; frames: string[]; hotspot: { x: number; y: number } }
    > = {
      arrow: { img: arrowImg, frames: ARROW_FRAMES, hotspot: ARROW_HOTSPOT },
      pointer: {
        img: pointerImg,
        frames: POINTER_FRAMES,
        hotspot: POINTER_HOTSPOT,
      },
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

    // Arrow<->hand blend: 0 = arrow, 1 = hand. Moves linearly toward the
    // target so a hover that flickers just reverses mid-way instead of
    // restarting; the eased value drives opacity, the raw value the squish.
    let target: Variant = "arrow";
    let blend = 0;
    let drawnBlend = -1;

    let frameIdx = 0;
    let boilAcc = 0; // seconds accumulated toward the next boil frame
    let appliedSize = -1;
    // What the body is drawn with. Tracks the physics every frame at
    // tuning.stepFps 0; otherwise sampled from it on the beat.
    let stepAcc = 0;
    let shownAngle = 0;
    let shownScale = 1;

    /** Display height per variant. The variants ship at the same pixel
     * height, but the hand carries a thin raised finger where the arrow has
     * solid body, so matching heights makes the hand read smaller —
     * pointerScale compensates so the swap has no size pop. */
    function displaySize(v: Variant) {
      return v === "pointer" ? tuning.size * tuning.pointerScale : tuning.size;
    }

    function applySizes() {
      for (const v of ["arrow", "pointer"] as const) {
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
    const preload = [...ARROW_FRAMES, ...POINTER_FRAMES].map((src) => {
      const im = new Image();
      im.src = src;
      return im;
    });
    void preload;

    function applyFrames() {
      for (const v of ["arrow", "pointer"] as const) {
        const { img, frames } = layers[v];
        const next = frames[frameIdx % frames.length];
        if (next && !img.src.endsWith(next)) img.src = next;
      }
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

    function onMove(x: number, y: number, eventTarget: EventTarget | null) {
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
      target = el?.closest(INTERACTIVE) ? "pointer" : "arrow";
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
      const sizeKey = tuning.size * 1000 + tuning.pointerScale;
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
          const count = Math.min(ARROW_FRAMES.length, POINTER_FRAMES.length);
          if (count > 1) frameIdx += 1 + Math.floor(Math.random() * (count - 1));
          applyFrames();
        }
      }

      // Arrow<->hand transition. The bench can pin the shape to play the
      // swap on demand; otherwise hover decides.
      const blendTarget = (override.variant ?? target) === "pointer" ? 1 : 0;
      if (reducedMotion.matches || tuning.swapMs <= 0) {
        blend = blendTarget;
      } else {
        const maxStep = (dt * 1000) / tuning.swapMs;
        blend += Math.max(-maxStep, Math.min(maxStep, blendTarget - blend));
      }

      if (reducedMotion.matches) {
        angle = 0;
        angleVel = 0;
      } else {
        // Lean with velocity, pivoting at the tip; near-critical damping
        // means it eases back upright with no bounce when the pointer
        // stops — the weight reads from the ramp and glide, not wobble.
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
      const morph = 1 - tuning.swapSquish * Math.sin(Math.PI * blend);

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

      root!.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      // Each layer is pinned by its own hotspot: the percent translate is
      // relative to that image's box, so no measuring is needed and the
      // rotate/scale (origin 0 0, applied after) pivot exactly on the tip.
      for (const v of ["arrow", "pointer"] as const) {
        const { img, hotspot } = layers[v];
        img.style.transform = `rotate(${shownAngle}deg) scale(${shownScale}) translate(${-hotspot.x * 100}%, ${-hotspot.y * 100}%)`;
      }

      if (blend !== drawnBlend) {
        drawnBlend = blend;
        const eased = blend * blend * (3 - 2 * blend);
        arrowImg!.style.opacity = `${1 - eased}`;
        pointerImg!.style.opacity = `${eased}`;
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
    </div>
  );
}
