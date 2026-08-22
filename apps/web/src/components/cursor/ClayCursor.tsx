"use client";

import { clayCursorTuning as tuning } from "@portfolio/lab/cursor-tuning";
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
 * hold. Over interactive elements it swaps to a clay pointing hand with its
 * own boil frames, animated identically. prepare-cursor.mjs registers each
 * variant's frames at its hotspot (arrow tip / index fingertip) and pads
 * them to identical dimensions, so swapping frames never moves the hotspot.
 */

// Physics + size knobs live in @portfolio/lab/cursor-tuning (mutable at
// runtime — /lab/clay-cursor is a slider bench over them). Only the asset
// geometry stays here.
// Hotspots as fractions of the image (measured from the prepared assets —
// prepare-cursor.mjs prints the pointer's fingertip column when it runs).
const ARROW_HOTSPOT = { x: 0.064, y: 0.01 }; // arrow tip
const POINTER_HOTSPOT = { x: 0.39, y: 0.01 }; // index fingertip

const ARROW_FRAMES = Array.from(
  { length: 14 },
  (_, i) => `/cursor/arrow-${i + 1}.png`,
);
const POINTER_FRAMES = Array.from(
  { length: 5 },
  (_, i) => `/cursor/arrow-pointer-${i + 1}.png`,
);
const INTERACTIVE =
  "a,button,[role=button],label,select,summary,[data-cursor=pointer]";

export function ClayCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const img = imgRef.current;
    if (!root || !img) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.documentElement.classList.add("clay-cursor");

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

    let variant: "arrow" | "pointer" = "arrow";
    let frameIdx = 0;
    let boilAcc = 0; // seconds accumulated toward the next boil frame

    function hotspot() {
      return variant === "pointer" ? POINTER_HOTSPOT : ARROW_HOTSPOT;
    }

    // Rendered image metrics for hotspot math (updated on load/resize and
    // whenever the variant swaps — the hand is a different aspect ratio).
    let imgW = tuning.size;
    let imgH = tuning.size;
    let appliedSize = -1;
    function measure() {
      if (!img) return;
      imgW = img.offsetWidth || tuning.size;
      imgH = img.offsetHeight || tuning.size;
      const { x, y } = hotspot();
      img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    }
    img.addEventListener("load", measure);
    measure();

    // Warm the browser cache so frame swaps never flash a missing image.
    const preload = [...ARROW_FRAMES, ...POINTER_FRAMES].map((src) => {
      const im = new Image();
      im.src = src;
      return im;
    });
    void preload;

    function currentFrames(): string[] {
      return variant === "pointer" ? POINTER_FRAMES : ARROW_FRAMES;
    }

    function applyFrame() {
      if (!img) return;
      const frames = currentFrames();
      const next = frames[frameIdx % frames.length];
      if (next && !img.src.endsWith(next)) img.src = next;
    }

    function setVariant(next: "arrow" | "pointer") {
      if (next === variant) return;
      variant = next;
      applyFrame();
      measure(); // re-anchors the pivot now; load re-measures the new width
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

    function onMove(x: number, y: number, target: EventTarget | null) {
      if (!seenFirstMove) {
        // Don't register the jump from the parked position as a flick.
        prev.x = x;
        prev.y = y;
        seenFirstMove = true;
      }
      pos.x = x;
      pos.y = y;
      show();
      const el = target instanceof Element ? target : null;
      setVariant(el?.closest(INTERACTIVE) ? "pointer" : "arrow");
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

      if (tuning.size !== appliedSize) {
        appliedSize = tuning.size;
        img!.style.height = `${tuning.size}px`;
        // A soft contact shadow, traced from the cursor's own alpha (not a
        // boxy CSS shadow) via drop-shadow — scaled with size so it stays
        // proportional if the cursor is resized on the bench. Light from
        // upper-left, like the page is lit from the same side as the UI.
        img!.style.filter = `drop-shadow(${tuning.size * 0.05}px ${
          tuning.size * 0.08
        }px ${tuning.size * 0.06}px rgba(0, 0, 0, 0.35))`;
        measure();
      }

      const instVx = (pos.x - prev.x) / dt;
      prev.x = pos.x;
      prev.y = pos.y;
      const blend = 1 - Math.exp(-dt * tuning.velocitySmoothing);
      vx += (instVx - vx) * blend;

      // Stop-motion boil: hold each frame for 1/boilFps, then jump to a
      // random other frame — never the same one twice, so every beat is a
      // visible pose change. Advancing only on the beat (not every rAF) is
      // what reads as claymation rather than flicker.
      if (!reducedMotion.matches && tuning.boilFps > 0) {
        boilAcc += dt;
        const hold = 1 / tuning.boilFps;
        if (boilAcc >= hold) {
          boilAcc %= hold;
          const count = currentFrames().length;
          if (count > 1) {
            const step = 1 + Math.floor(Math.random() * (count - 1));
            frameIdx = (frameIdx + step) % count;
          }
          applyFrame();
        }
      }

      if (reducedMotion.matches) {
        angle = 0;
        angleVel = 0;
      } else {
        // Lean with velocity, pivoting at the tip; near-critical damping
        // means it eases back upright with no bounce when the pointer
        // stops — the weight reads from the ramp and glide, not wobble.
        const target = Math.max(
          -tuning.maxTilt,
          Math.min(tuning.maxTilt, vx * tuning.tiltPerVx),
        );
        angleVel +=
          (tuning.tiltStiffness * (target - angle) -
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

      const hs = hotspot();
      root!.style.transform = `translate3d(${pos.x - hs.x * imgW}px, ${
        pos.y - hs.y * imgH
      }px, 0)`;
      img!.style.transform = `rotate(${angle}deg) scale(${scale})`;
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

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 opacity-0"
      style={{ zIndex: 2147483647 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny asset, transforms every frame; next/image adds nothing here */}
      <img
        ref={imgRef}
        src={ARROW_FRAMES[0]}
        alt=""
        draggable={false}
        style={{ height: `${tuning.size}px`, width: "auto" }}
      />
    </div>
  );
}
