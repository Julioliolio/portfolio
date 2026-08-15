/**
 * Unified sheet-dismiss primitives — ONE implementation of the two gestures
 * every big sheet in the app shares, instead of each re-rolling its own:
 *
 *   1. grabber drag-to-dismiss  → `useDragDismiss` (+ `SheetGrabber` visual)
 *   2. tap the exposed map      → `DismissScrim`
 *
 * Every morphing sheet (Messages, the search / venue / activity BottomBar
 * surface, "Your plans", the profile QR) drives its dismiss through these, so
 * the feel is identical everywhere and there's a single place to tune it.
 *
 * The parent owns the surface geometry: it applies the returned `dragY` to its
 * surface transform (`y: dragY`) and spreads `handleProps` onto the grabber. On
 * release past `threshold` the hook calls `onDismiss` (close / pop / step-back —
 * whatever the sheet means by "dismiss"); otherwise the sheet springs back.
 */
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  animate,
  useMotionValue,
  type MotionValue,
  type Transition,
} from "framer-motion";
import { Squircle } from "./Squircle";
import { device } from "../theme/tokens";

export type DragHandleProps = {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
};

/**
 * Drag-down-to-dismiss gesture shared by every sheet. Returns the drag offset
 * (apply as `y: dragY` on the surface) and the pointer handlers (spread onto
 * the grabber hitzone). Past `threshold` px it fires `onDismiss`; short drags
 * spring back on `cancelTransition`.
 */
export function useDragDismiss({
  onDismiss,
  threshold = 80,
  cancelTransition,
  dismissTransition,
}: {
  onDismiss: () => void;
  /** px the handle must travel down to commit the dismiss. */
  threshold?: number;
  /** spring the handle rides back up on a short (cancelled) drag. */
  cancelTransition: Transition;
  /** how `dragY` returns to 0 after a committed dismiss; omit to snap instantly
   *  (the surface morphs away anyway, so instant is invisible). */
  dismissTransition?: Transition;
}): { dragY: MotionValue<number>; handleProps: DragHandleProps } {
  const dragY = useMotionValue(0);
  const drag = useRef<{ startY: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { startY: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    dragY.set(Math.max(0, e.clientY - drag.current.startY));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const dy = dragY.get();
    drag.current = null;
    if (dy > threshold) {
      onDismiss();
      if (dismissTransition) animate(dragY, 0, dismissTransition);
      else dragY.set(0);
    } else {
      animate(dragY, 0, cancelTransition);
    }
  };
  return { dragY, handleProps: { onPointerDown, onPointerMove, onPointerUp } };
}

/**
 * The grabber pill + its drag hitzone. The hitzone spans the sheet's header
 * band (easy to grab) but the caller sizes it to stop above scrollable content
 * and clear any header controls (`left`/`height`), so it never eats content
 * taps. Spread a `useDragDismiss` `handleProps` onto it.
 */
export function SheetGrabber({
  handleProps,
  left = 0,
  height = 44,
  pillLeft,
  pillTop = 9,
  showPill = true,
  zIndex = 3,
}: {
  handleProps: DragHandleProps;
  /** hitzone inset from the left (clear a back button); default full width. */
  left?: number;
  /** hitzone height — cover the header, stop above the scroll list. */
  height?: number;
  /** pill x; defaults to centered on the full device width. */
  pillLeft?: number;
  pillTop?: number;
  showPill?: boolean;
  zIndex?: number;
}) {
  return (
    <>
      <div
        {...handleProps}
        style={{
          position: "absolute",
          left,
          top: 0,
          right: 0,
          height,
          cursor: "grab",
          touchAction: "none",
          zIndex,
        }}
      />
      {showPill && (
        <Squircle
          radius={2}
          smoothing={1}
          fill="#fefefe"
          style={{
            position: "absolute",
            left: pillLeft ?? (device.width - 44) / 2,
            top: pillTop,
            width: 44,
            height: 4,
            opacity: 0.9,
            pointerEvents: "none",
            zIndex,
          }}
        />
      )}
    </>
  );
}

/**
 * Transparent full-screen tap-catcher: tapping the exposed map (anything the
 * sheet doesn't cover) dismisses it. Sits just under the sheet, so it only ever
 * catches the map. `onTapThrough` lets a tap that lands on something behind
 * (e.g. a map pin) be handled instead of dismissing — return true to skip the
 * dismiss.
 */
export function DismissScrim({
  active,
  onDismiss,
  zIndex = 44,
  onTapThrough,
}: {
  active: boolean;
  onDismiss: () => void;
  zIndex?: number;
  onTapThrough?: (clientX: number, clientY: number) => boolean;
}) {
  return (
    <div
      onClick={(ev) => {
        if (onTapThrough && onTapThrough(ev.clientX, ev.clientY)) return;
        onDismiss();
      }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        background: "transparent",
        pointerEvents: active ? "auto" : "none",
      }}
    />
  );
}
