import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { color, font } from "../../theme/tokens";

/**
 * The capture stage — an isolated recording environment for one micro-
 * interaction (…?capture=<id>). Feelslike-studio typology: the interaction
 * alone on a flat changeable backdrop, framed at an exact social aspect.
 *
 * The stage BOX is the shot: record/crop exactly that rectangle. All chrome
 * (backdrop swatches, aspect, the Auto toggle) lives OUTSIDE it on the dark
 * surround, so nothing extra can leak into the footage. Control state is
 * mirrored into the URL (replaceState) so a tuned setup is shareable/reloadable.
 */

export type Aspect = "4x5" | "9x16" | "1x1";
const ASPECTS: Record<Aspect, number> = {
  "4x5": 4 / 5,
  "9x16": 9 / 16,
  "1x1": 1,
};
const ASPECT_LABELS: Record<Aspect, string> = {
  "4x5": "4:5",
  "9x16": "9:16",
  "1x1": "1:1",
};

// Feelslike-ish flat backdrops: warm neutrals first, then a cool, a brand
// tint, and a near-black for the dark stages (edge-zoom).
const SWATCHES = ["#EFE9E1", "#F4EFE7", "#ECEEF2", "#E7EBFF", "#101014"];

const CONTROLS_H = 64;

export function CaptureShell({
  stageId,
  title,
  initialBg,
  initialAspect,
  initialAuto,
  children,
}: {
  stageId: string;
  title: string;
  initialBg: string;
  initialAspect: Aspect;
  initialAuto: boolean;
  /** Render prop — the stage content, told whether the auto-loop drives it. */
  children: (ctx: { auto: boolean }) => React.ReactNode;
}) {
  const [bg, setBg] = useState(initialBg);
  const [aspect, setAspect] = useState<Aspect>(initialAspect);
  const [auto, setAuto] = useState(initialAuto);

  // Mirror the tuned setup into the URL so reload/share keeps it.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("capture", stageId);
    url.searchParams.set("bg", bg.replace("#", ""));
    url.searchParams.set("aspect", aspect);
    url.searchParams.set("auto", auto ? "1" : "0");
    window.history.replaceState(null, "", url.toString());
  }, [stageId, bg, aspect, auto]);

  // Stage box: largest rect of the chosen aspect that fits the viewport above
  // the control strip.
  const [box, setBox] = useState({ w: 320, h: 400 });
  useLayoutEffect(() => {
    const update = () => {
      const ratio = ASPECTS[aspect];
      const availW = window.innerWidth - 32;
      const availH = window.innerHeight - CONTROLS_H - 32;
      const w = Math.min(availW, availH * ratio);
      setBox({ w, h: w / ratio });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [aspect]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        background: "#0b0b10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.family,
        overflow: "hidden",
      }}
    >
      {/* The shot. Overflow hidden — the box edge IS the crop. */}
      <div
        style={{
          width: box.w,
          height: box.h,
          background: bg,
          position: "relative",
          overflow: "hidden",
          flex: "none",
        }}
      >
        {children({ auto })}
      </div>

      {/* Chrome — outside the shot. */}
      <div
        style={{
          height: CONTROLS_H,
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: "rgba(255,255,255,0.65)",
          fontSize: 12,
          flex: "none",
        }}
      >
        <a
          href={captureHref("")}
          style={{
            color: "rgba(255,255,255,0.45)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← stages
        </a>
        <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          {title}
        </span>

        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setBg(c)}
              aria-label={`backdrop ${c}`}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: c,
                border:
                  bg === c
                    ? `2px solid ${color.brand}`
                    : "2px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
          <input
            type="color"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            style={{
              width: 24,
              height: 22,
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="custom backdrop color"
          />
        </span>

        <span style={{ display: "inline-flex", gap: 4 }}>
          {(Object.keys(ASPECTS) as Aspect[]).map((a) => (
            <ChromeButton
              key={a}
              active={aspect === a}
              onClick={() => setAspect(a)}
            >
              {ASPECT_LABELS[a]}
            </ChromeButton>
          ))}
        </span>

        <ChromeButton active={auto} onClick={() => setAuto((v) => !v)}>
          {auto ? "● auto" : "○ manual"}
        </ChromeButton>
      </div>
    </div>
  );
}

function ChromeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        border: "none",
        borderRadius: 8,
        padding: "5px 10px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
        color: active ? "#fff" : "#999",
        background: active ? color.brand : "rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </button>
  );
}

/** Href for a stage link, preserving nothing but the capture id. */
export function captureHref(id: string) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("capture", id);
  return url.toString();
}

/**
 * Centers content of a fixed intrinsic size inside the stage box, scaled to
 * fit (margin < 1 leaves breathing room — feelslike shots never touch edges).
 *
 * Centering is done with `translate(-50%,-50%) scale(s)` off the box centre,
 * NOT flex/grid centering: `transform` doesn't shrink the LAYOUT box, so a
 * phone-sized child (393×852+) is taller than the stage box and grid pins the
 * overflowing item to the top edge instead of centring it — the scaled visual
 * then sits low and its bottom is cropped. Translating off the centre is
 * immune to the layout box overflowing.
 */
export function FitScale({
  w,
  h,
  margin = 0.86,
  children,
}: {
  w: number;
  h: number;
  margin?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0)
        setScale(Math.min((r.width * margin) / w, (r.height * margin) / h));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h, margin]);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: w,
          height: h,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
