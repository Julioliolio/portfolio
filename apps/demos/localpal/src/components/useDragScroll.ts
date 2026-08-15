import { useMemo, useRef } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from "react";

/**
 * Touch-style drag-to-scroll for MOUSE input, for spreading onto an
 * `overflow: auto` container:
 *
 *   const drag = useDragScroll('y');
 *   <div style={{ overflowY: 'auto', ... }} {...drag}>
 *
 * The prototype is a phone screen driven with a cursor, so people naturally
 * try to swipe lists with the mouse — which on desktop does nothing (wheel
 * scrolls, drag doesn't). This makes a mouse drag pan the list exactly like a
 * touch swipe, with light kinetic follow-through on release. Touch input is
 * left alone (native `touch-action` scrolling already handles it).
 *
 * Axis-locked: the gesture only engages once movement is DOMINANT along this
 * container's axis, so a horizontal collage nested in a vertical sheet
 * resolves naturally — each claims only its own direction, no stopPropagation
 * games. A drag that engages suppresses the trailing click (capture phase),
 * so letting go of a swipe doesn't accidentally open the card under the
 * cursor.
 *
 * The release decay emulates native kinetic scrolling (platform scroll
 * physics, not an interaction spring) — which is why it doesn't come from the
 * motion registry: scrolling is the one motion the OS owns.
 */

const ENGAGE_PX = 5; // movement before the drag claims the gesture
const DECAY_PER_FRAME = 0.94; // kinetic decay, ~native flick feel
const MIN_FLICK_VELOCITY = 0.08; // px/ms — below this, release without inertia

type DragScrollHandlers = {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
  onClickCapture: (e: ReactMouseEvent<HTMLElement>) => void;
  onWheel: (e: ReactWheelEvent<HTMLElement>) => void;
};

export function useDragScroll(axis: "x" | "y"): DragScrollHandlers {
  const state = useRef({
    downX: 0,
    downY: 0,
    startScroll: 0,
    tracking: false, // pointer is down on us
    engaged: false, // we claimed the gesture (movement dominant on our axis)
    rejected: false, // movement went dominant the OTHER way — sit this one out
    lastPos: 0,
    lastT: 0,
    velocity: 0, // px/ms along our axis
    raf: 0,
    suppressClick: false,
  });

  return useMemo(() => {
    const s = state.current;
    const pos = (e: { clientX: number; clientY: number }) =>
      axis === "x" ? e.clientX : e.clientY;
    const getScroll = (el: HTMLElement) =>
      axis === "x" ? el.scrollLeft : el.scrollTop;
    const setScroll = (el: HTMLElement, v: number) => {
      if (axis === "x") el.scrollLeft = v;
      else el.scrollTop = v;
    };
    const stopInertia = () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };

    const startInertia = (el: HTMLElement) => {
      if (Math.abs(s.velocity) < MIN_FLICK_VELOCITY) return;
      let v = s.velocity;
      let prev = performance.now();
      const step = (now: number) => {
        const dt = now - prev;
        prev = now;
        setScroll(el, getScroll(el) - v * dt);
        v *= DECAY_PER_FRAME ** (dt / (1000 / 60));
        if (Math.abs(v) >= MIN_FLICK_VELOCITY)
          s.raf = requestAnimationFrame(step);
        else s.raf = 0;
      };
      s.raf = requestAnimationFrame(step);
    };

    const release = (e: ReactPointerEvent<HTMLElement>) => {
      if (!s.tracking) return;
      s.tracking = false;
      document.body.style.userSelect = "";
      if (s.engaged) {
        s.suppressClick = true; // eat the click this drag would fire
        startInertia(e.currentTarget);
      }
      s.engaged = false;
      s.rejected = false;
    };

    return {
      onPointerDown: (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        stopInertia();
        s.tracking = true;
        s.engaged = false;
        s.rejected = false;
        s.suppressClick = false;
        s.downX = e.clientX;
        s.downY = e.clientY;
        s.startScroll = getScroll(e.currentTarget);
        s.lastPos = pos(e);
        s.lastT = e.timeStamp;
        s.velocity = 0;
      },
      onPointerMove: (e) => {
        if (!s.tracking || s.rejected) return;
        const dx = e.clientX - s.downX;
        const dy = e.clientY - s.downY;
        if (!s.engaged) {
          const along = axis === "x" ? dx : dy;
          const across = axis === "x" ? dy : dx;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < ENGAGE_PX) return;
          if (Math.abs(along) <= Math.abs(across)) {
            s.rejected = true; // some other axis' scroller owns this gesture
            return;
          }
          s.engaged = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          document.body.style.userSelect = "none"; // no text selection mid-drag
        }
        const p = pos(e);
        const dt = e.timeStamp - s.lastT;
        if (dt > 0) s.velocity = (p - s.lastPos) / dt;
        s.lastPos = p;
        s.lastT = e.timeStamp;
        setScroll(e.currentTarget, s.startScroll - (axis === "x" ? dx : dy));
      },
      onPointerUp: release,
      onPointerCancel: release,
      onClickCapture: (e) => {
        if (!s.suppressClick) return;
        s.suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
      },
      onWheel: () => stopInertia(), // wheel takes over from a live flick
    };
  }, [axis]);
}
