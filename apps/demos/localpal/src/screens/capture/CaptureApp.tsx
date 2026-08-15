import { CaptureShell, captureHref, type Aspect } from "./CaptureShell";
import {
  VenuePinStage,
  SearchMorphStage,
  BubblesStage,
  BottomBarStage,
  EdgeZoomStage,
  LocateStage,
  RsvpStage,
  VenueFlowStage,
  CtaMorphStage,
  type StageProps,
} from "./stages";
import { color, font } from "../../theme/tokens";

/**
 * …?capture — isolated recording environments for the app's micro-interactions
 * (Instagram/LinkedIn loops, feelslike-studio typology). Bare ?capture lists
 * the stages; ?capture=<id> mounts one inside the CaptureShell. Extra params:
 * bg=RRGGBB, aspect=4x5|9x16|1x1, auto=0|1.
 */

type StageDef = {
  id: string;
  title: string;
  note: string;
  bg: string;
  aspect: Aspect;
  Comp: (props: StageProps) => React.ReactNode;
};

const STAGES: StageDef[] = [
  {
    id: "venue-pin",
    title: "Venue pin ⇄ lozenge",
    note: "Squircle tile grows into the labeled pill, then idle-floats over its breathing shadow",
    bg: "#EFE9E1",
    aspect: "4x5",
    Comp: VenuePinStage,
  },
  {
    id: "bubbles",
    title: "Interest bubble physics",
    note: "Bubbles pop out from the centre, shove each other apart, jostle on every tap",
    bg: "#F4EFE7",
    aspect: "4x5",
    Comp: BubblesStage,
  },
  {
    id: "bottom-bar",
    title: "Pill ⇄ sheet morph",
    note: "The real bottom bar: search pill grows into the full sheet, glyph bends into a cross",
    bg: "#ECEEF2",
    aspect: "9x16",
    Comp: BottomBarStage,
  },
  {
    id: "search-morph",
    title: "Search ⇄ cross glyph",
    note: "The magnifier physically bends into an × — point-interpolated, no crossfade",
    bg: "#EFE9E1",
    aspect: "1x1",
    Comp: SearchMorphStage,
  },
  {
    id: "cta-morph",
    title: "Card button morph",
    note: "The persistent card button scrambles its label and swaps its glyph (× ⇄ ‹ ⇄ share) across every state",
    bg: "#3121FF",
    aspect: "1x1",
    Comp: CtaMorphStage,
  },
  {
    id: "venue-flow",
    title: "Venue → activity → Join",
    note: "The whole morph chain: pill grows into the venue sheet, the party card rises out of it, Join → confirm → joined",
    bg: "#ECEEF2",
    aspect: "9x16",
    Comp: VenueFlowStage,
  },
  {
    id: "rsvp",
    title: "Slide to RSVP",
    note: 'Drag the knob across the plate — chevron morphs to a check, countdown lands, "On their way" grows open',
    bg: "#EFE9E1",
    aspect: "4x5",
    Comp: RsvpStage,
  },
  {
    id: "locate",
    title: "Locate pulse",
    note: "The round locate button twists on press and the blue dot answers with a double-breath halo pulse",
    bg: "#F4EFE7",
    aspect: "1x1",
    Comp: LocateStage,
  },
  {
    id: "edge-zoom",
    title: "Edge-zoom goo",
    note: "Black goo pulled out of the screen edge rides the finger while it zooms the real map",
    bg: "#101014",
    aspect: "9x16",
    Comp: EdgeZoomStage,
  },
];

export function CaptureApp() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("capture") ?? "";
  const stage = STAGES.find((s) => s.id === id);

  if (!stage) return <StageIndex />;

  const bgParam = params.get("bg");
  const aspectParam = params.get("aspect") as Aspect | null;
  const Comp = stage.Comp;
  return (
    <CaptureShell
      stageId={stage.id}
      title={stage.title}
      initialBg={
        bgParam && /^[0-9a-fA-F]{6}$/.test(bgParam) ? `#${bgParam}` : stage.bg
      }
      initialAspect={
        aspectParam === "4x5" || aspectParam === "9x16" || aspectParam === "1x1"
          ? aspectParam
          : stage.aspect
      }
      initialAuto={params.get("auto") !== "0"}
    >
      {({ auto }) => <Comp auto={auto} />}
    </CaptureShell>
  );
}

function StageIndex() {
  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100dvh",
        background: "#0b0b10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontFamily: font.family,
        padding: 32,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          color: "#fff",
          fontWeight: 600,
          fontSize: 18,
          marginBottom: 8,
        }}
      >
        Capture stages
      </div>
      {STAGES.map((s) => (
        <a
          key={s.id}
          href={captureHref(s.id)}
          style={{
            width: "min(560px, 100%)",
            textDecoration: "none",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "14px 18px",
          }}
        >
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {s.title}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 12,
              marginTop: 3,
            }}
          >
            {s.note}
          </div>
        </a>
      ))}
      <div
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          marginTop: 10,
          maxWidth: 560,
          textAlign: "center",
        }}
      >
        Record the flat stage box only — chrome lives outside the shot. Params:
        bg, aspect (4x5 / 9x16 / 1x1), auto=0 for manual driving.
      </div>
      <a
        href={(() => {
          const u = new URL(window.location.href);
          u.search = "";
          return u.toString();
        })()}
        style={{ color: color.brand, fontSize: 12, marginTop: 6 }}
      >
        ← back to the app
      </a>
    </div>
  );
}
