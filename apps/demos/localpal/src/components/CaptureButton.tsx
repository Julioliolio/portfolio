import { useState, type RefObject } from "react";
import { domToPng } from "modern-screenshot";

/**
 * Pixel multiplier for the exported PNG. 2× of the 417-wide frame ≈ 834px —
 * still retina-crisp, and cheaper to rasterize/encode than 3×.
 */
const SCALE = 2;

/**
 * Cap on how long modern-screenshot waits for in-frame media to "finish
 * loading". The default is 30_000ms — and the map view contains an element
 * whose load promise never resolves, so every capture used to stall for the
 * full 30s before proceeding (profiler: `wait until load` was ~30.5s of a 33s
 * capture; clone/embed/encode were <2s combined). Everything is already
 * on-screen and loaded by the time this dev button is clicked, so a short cap
 * ends the phantom wait without truncating anything. 33s → ~3.5s.
 */
const MEDIA_TIMEOUT = 1500;

/**
 * Captures a DOM node (the phone frame) to a high-res PNG and triggers a
 * download. Kept dev-only chrome — lives beside the screen nav, not inside
 * the phone. WebGL map capture relies on `preserveDrawingBuffer` on the Map.
 */
export function CaptureButton({
  target,
}: {
  target: RefObject<HTMLElement | null>;
}) {
  const [busy, setBusy] = useState(false);

  async function capture() {
    const node = target.current;
    if (!node || busy) return;
    setBusy(true);
    // Strip the frame's drop shadow for the capture: it bleeds into the
    // rounded-corner triangles and reads as a gray box around the phone. The
    // outer node carries nothing but that shadow (the case edge highlight lives
    // on the clipped body), so it can go entirely. Restored after, so the
    // on-screen frame keeps its float.
    const prevShadow = node.style.boxShadow;
    node.style.boxShadow = "none";
    try {
      const dataUrl = await domToPng(node, {
        scale: SCALE,
        // Transparent outside the frame's rounded corners.
        backgroundColor: "transparent",
        // Don't wait out the full 30s default on a never-resolving media load.
        timeout: MEDIA_TIMEOUT,
      });
      const a = document.createElement("a");
      a.download = `localpal-${Date.now()}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("Screenshot failed", err);
    } finally {
      node.style.boxShadow = prevShadow;
      setBusy(false);
    }
  }

  return (
    <button
      onClick={capture}
      disabled={busy}
      title="Download a high-res PNG of the phone frame"
      style={{
        padding: "10px 16px",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 14,
        color: "#bbb",
        background: "rgba(255,255,255,0.08)",
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? "Capturing…" : "📷 Screenshot"}
    </button>
  );
}
