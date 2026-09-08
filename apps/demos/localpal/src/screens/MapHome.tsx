import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import Map, {
  Layer,
  Marker,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { color, font, device } from "../theme/tokens";
import { lerp } from "../theme/motion";
import { MapPin } from "../components/MapPin";
import { BottomBar, CAL } from "../components/BottomBar";
import {
  useCameraEase,
  useMotion,
  usePressFeedback,
} from "../components/MotionProvider";
import {
  usePinSize,
  useFocusRadius,
  useCenterFocusZone,
} from "../components/PinSizeProvider";
import {
  computeClusters,
  type Placement,
  type PinStack,
} from "../components/mapClusters";
import { EdgeZoom } from "../components/EdgeZoom";
import { defaultMapCluster } from "../theme/mapClusters";
import { useMapDensity } from "../components/MapDensityProvider";
import { PlaceHint } from "../components/PlaceHint";
import { LocationDot } from "../components/LocationDot";
import { VenuePin } from "../components/VenuePin";
import {
  ProfileFlow,
  type ProfileView,
} from "../components/profile/ProfileFlow";
import {
  MessagesFlow,
  type MessagesView,
} from "../components/messages/MessagesFlow";
import { RouteBanner } from "../components/profile/RouteBanner";
import { PEOPLE, ME, type PersonId } from "../data/people";
import type { InitialFlow } from "../demo/flows";
import { VENUES, type VenueId } from "../data/venues";
import { MAP_PEER_PLANS, type PeerPlan } from "../data/peerPlans";
import { matchesFilters, type FilterChip } from "../search/filters";
import { VENUE_FILTER_FACTS, planFilterFacts } from "../search/corpus";
import { ACTIVITY_CTA, type ActivityView } from "../components/ActivitySheet";
import type { CreatePlanResult } from "../components/CreatePlanSheet";
import { usePlansState, type CreatedPlan } from "../components/PlansProvider";
import {
  OnboardingFlow,
  type OnboardingResult,
} from "../components/onboarding/OnboardingFlow";
import {
  TourBanner,
  TourBubble,
  FirstPlanCard,
} from "../components/onboarding/TourPopups";
import { useConfirmOpen } from "../components/ConfirmProvider";
import { pickSpotlight } from "../theme/interests";
import { stageExit } from "../theme/onboardingStage";

/**
 * LocalPal — Map home over a real MapLibre map (OpenFreeMap "Liberty" style,
 * Google-Maps-like, no API key), centered on Madrid. Activity pins are
 * geo-anchored so they pan/zoom with the map; the buttons/avatar/search bar
 * stay as fixed UI chrome (exact Figma assets) floating on top.
 */

const MADRID = { longitude: -3.7038, latitude: 40.4168 };
const START_ZOOM = 14.4;
// Onboarding starts pulled way out over the whole city; finishing the flow
// flies the camera down into the neighbourhood — the reveal IS the payoff.
const ONBOARDING_ZOOM = 11.6;
// The user's "blue dot" location — the recenter/locate button flies back here.
const USER_LOCATION = { longitude: -3.7045, latitude: 40.4132 };

// Where the base map paints its "Madrid" city label (the OSM place node) —
// the far-tier crest docks just above it so the label reads as its caption,
// like the crest were part of the map's own cartography.
const MADRID_LABEL = { lng: -3.70379, lat: 40.41678 };

// Camera guardrails: without them a judge can zoom out to half of Spain or
// into a featureless void past the deepest pin. MIN leaves ~1.5 levels of
// "far tier" (aggregate hint) below farZoom; MAX sits comfortably above the
// deepest pin-focus fly-in (~z16.3 at the default 300m radius).
const MIN_ZOOM = 11;
const MAX_ZOOM = 17.5;

// The map's raw zoom streams continuously (~60 events/sec during any camera
// animation). Clustering only needs to react at coarse steps, so we snap the
// zoom that drives it to this grain — cutting cluster recomputes + marker
// re-renders during a fly-in from every frame to a handful, with no visible
// stepping (0.03 zoom ≈ a 2% scale change in the stack fan-out offsets).
const ZOOM_QUANTUM = 0.03;
const quantizeZoom = (z: number) => Math.round(z / ZOOM_QUANTUM) * ZOOM_QUANTUM;

// Custom MapLibre style tuned to Google Maps colors (see public/map-style.json).
// Free OpenFreeMap vector tiles, no API key.
const MAP_STYLE = import.meta.env.BASE_URL + "map-style.json";

// Both pin types are the shared native components (same ones the rest of the
// app uses): VenuePin (blue tile + centralized SVG glyph, venues/organizations)
// and PeerPin (photo tile + badge, peer-proposed plans). One size for all pins
// — tunable live from the Lab (see theme/mapPins.ts + PinSizeProvider).

export type Pin = { lng: number; lat: number; priority: number } &
  // Venue pins draw their glyph from VENUES[venueId].icon (single source of
  // truth) — no per-pin icon here, so the map can never drift from the sheet.
  ({ kind: "venue"; venueId: VenueId } | { kind: "peer"; planId: string });

// Scattered around central Madrid so they read like the original layout. Peer
// pins carry the standalone plan they open (see data/peerPlans MAP_PEER_PLANS).
// `priority` = hand-tuned interestingness: when pins crowd each other only the
// group's top pin keeps its full tile (Bump-style; see theme/mapClusters.ts).
// Peers outrank venues so people never demote to dots — they stack instead.
const pins: Pin[] = [
  { kind: "venue", venueId: "ritas", lng: -3.7078, lat: 40.4188, priority: 70 },
  { kind: "peer", planId: "mp-lluc", lng: -3.6998, lat: 40.4182, priority: 95 },
  {
    kind: "peer",
    planId: "mp-picnic",
    lng: -3.7092,
    lat: 40.415,
    priority: 90,
  },
  {
    kind: "venue",
    venueId: "molienda",
    lng: -3.7035,
    lat: 40.4142,
    priority: 55,
  },
  {
    kind: "venue",
    venueId: "deldiego",
    lng: -3.6985,
    lat: 40.4122,
    priority: 45,
  },
  { kind: "peer", planId: "mp-crawl", lng: -3.7098, lat: 40.41, priority: 85 },
  { kind: "venue", venueId: "toma", lng: -3.7057, lat: 40.4271, priority: 60 },
  {
    kind: "venue",
    venueId: "uadibloc",
    lng: -3.658,
    lat: 40.3905,
    priority: 40,
  }, // Vallecas (SE)
  { kind: "venue", venueId: "costello", lng: -3.716, lat: 40.43, priority: 65 }, // Argüelles (W)
  {
    kind: "venue",
    venueId: "wurlitzer",
    lng: -3.612,
    lat: 40.433,
    priority: 35,
  }, // San Blas (E)

  // — Cushion venues, scattered across Madrid's neighbourhoods —
  {
    kind: "venue",
    venueId: "salmonguru",
    lng: -3.6985,
    lat: 40.4145,
    priority: 68,
  }, // Huertas
  { kind: "venue", venueId: "angelita", lng: -3.68, lat: 40.424, priority: 58 }, // Salamanca
  { kind: "venue", venueId: "ojala", lng: -3.696, lat: 40.465, priority: 42 }, // Tetuán (N)
  { kind: "venue", venueId: "federal", lng: -3.683, lat: 40.463, priority: 50 }, // Chamartín (N)
  {
    kind: "venue",
    venueId: "lacomba",
    lng: -3.7095,
    lat: 40.4112,
    priority: 52,
  }, // La Latina
  { kind: "venue", venueId: "caracol", lng: -3.701, lat: 40.385, priority: 60 }, // Usera (S)
  {
    kind: "venue",
    venueId: "riviera",
    lng: -3.7198,
    lat: 40.4092,
    priority: 63,
  }, // Madrid Río
  { kind: "venue", venueId: "fabrica", lng: -3.72, lat: 40.387, priority: 38 }, // Carabanchel (SW)
  {
    kind: "venue",
    venueId: "comercial",
    lng: -3.7003,
    lat: 40.4295,
    priority: 55,
  }, // Bilbao
  { kind: "venue", venueId: "bendito", lng: -3.643, lat: 40.462, priority: 44 }, // Hortaleza (NE)
  { kind: "venue", venueId: "junco", lng: -3.701, lat: 40.4405, priority: 62 }, // Chamberí (Ríos Rosas)
  {
    kind: "venue",
    venueId: "sanfernando",
    lng: -3.7008,
    lat: 40.4075,
    priority: 46,
  }, // Lavapiés
  { kind: "venue", venueId: "macera", lng: -3.703, lat: 40.436, priority: 48 }, // Chamberí
  {
    kind: "venue",
    venueId: "salaequis",
    lng: -3.778,
    lat: 40.456,
    priority: 54,
  }, // Aravaca (W)
  {
    kind: "venue",
    venueId: "florida",
    lng: -3.6835,
    lat: 40.4155,
    priority: 57,
  }, // Retiro
  {
    kind: "venue",
    venueId: "framboise",
    lng: -3.642,
    lat: 40.446,
    priority: 40,
  }, // Ciudad Lineal (E)
  {
    kind: "venue",
    venueId: "reinasofia",
    lng: -3.6938,
    lat: 40.4083,
    priority: 66,
  }, // Atocha — museum (culture)
  {
    kind: "venue",
    venueId: "matadero",
    lng: -3.6992,
    lat: 40.3924,
    priority: 58,
  }, // Legazpi — arts centre (culture)

  // — Cushion peer pins (standalone plans), across the city —
  {
    kind: "peer",
    planId: "mp-flamenco",
    lng: -3.7028,
    lat: 40.4088,
    priority: 88,
  }, // Lavapiés
  {
    kind: "peer",
    planId: "mp-retiro-row",
    lng: -3.6825,
    lat: 40.4178,
    priority: 86,
  }, // Retiro
  {
    kind: "peer",
    planId: "mp-thrift",
    lng: -3.7038,
    lat: 40.4262,
    priority: 82,
  }, // Malasaña
  {
    kind: "peer",
    planId: "mp-language",
    lng: -3.6975,
    lat: 40.4212,
    priority: 91,
  }, // Chueca
  {
    kind: "peer",
    planId: "mp-rooftop-salamanca",
    lng: -3.6835,
    lat: 40.4238,
    priority: 89,
  }, // Salamanca
  {
    kind: "peer",
    planId: "mp-runriver",
    lng: -3.7135,
    lat: 40.3985,
    priority: 80,
  }, // Madrid Río
  {
    kind: "peer",
    planId: "mp-museum",
    lng: -3.6945,
    lat: 40.4088,
    priority: 84,
  }, // Atocha
  {
    kind: "peer",
    planId: "mp-churros",
    lng: -3.7075,
    lat: 40.4168,
    priority: 87,
  }, // Sol
  {
    kind: "peer",
    planId: "mp-bookclub",
    lng: -3.7,
    lat: 40.4365,
    priority: 83,
  }, // Chamberí
  {
    kind: "peer",
    planId: "mp-football",
    lng: -3.7055,
    lat: 40.4378,
    priority: 81,
  }, // Chamberí
  {
    kind: "peer",
    planId: "mp-tapas-latina",
    lng: -3.7098,
    lat: 40.4108,
    priority: 90,
  }, // La Latina
  { kind: "peer", planId: "mp-yoga", lng: -3.7175, lat: 40.4238, priority: 85 }, // Debod
  {
    kind: "peer",
    planId: "mp-boardgames",
    lng: -3.679,
    lat: 40.4265,
    priority: 82,
  }, // Salamanca
  {
    kind: "peer",
    planId: "mp-rastro",
    lng: -3.7075,
    lat: 40.4072,
    priority: 84,
  }, // La Latina/Rastro
  {
    kind: "peer",
    planId: "mp-jazzbar",
    lng: -3.673,
    lat: 40.416,
    priority: 86,
  }, // Retiro
  {
    kind: "peer",
    planId: "mp-terraza",
    lng: -3.6968,
    lat: 40.4198,
    priority: 92,
  }, // Chueca

  // — Outer districts: the rest of Madrid, well beyond the centre. Sparser than
  //   the core (which keeps the higher concentration), but reaching every edge. —
  {
    kind: "peer",
    planId: "mp-casadecampo",
    lng: -3.748,
    lat: 40.419,
    priority: 84,
  }, // Casa de Campo (W)
  { kind: "peer", planId: "mp-jc1run", lng: -3.612, lat: 40.465, priority: 80 }, // Juan Carlos I (NE)
  {
    kind: "peer",
    planId: "mp-vallecas",
    lng: -3.665,
    lat: 40.3915,
    priority: 85,
  }, // Vallecas (SE)
  {
    kind: "peer",
    planId: "mp-chamartin",
    lng: -3.677,
    lat: 40.46,
    priority: 81,
  }, // Chamartín (N)
  { kind: "peer", planId: "mp-tetuan", lng: -3.6985, lat: 40.46, priority: 83 }, // Tetuán (N)
  {
    kind: "peer",
    planId: "mp-hortaleza",
    lng: -3.642,
    lat: 40.456,
    priority: 79,
  }, // Hortaleza (NE)
  { kind: "peer", planId: "mp-usera", lng: -3.706, lat: 40.382, priority: 84 }, // Usera (S)
  {
    kind: "peer",
    planId: "mp-carabanchel",
    lng: -3.728,
    lat: 40.3835,
    priority: 82,
  }, // Carabanchel (SW)
  { kind: "peer", planId: "mp-aluche", lng: -3.756, lat: 40.388, priority: 79 }, // Aluche (W)
  {
    kind: "peer",
    planId: "mp-metropolitano",
    lng: -3.599,
    lat: 40.436,
    priority: 86,
  }, // San Blas (E)
  {
    kind: "peer",
    planId: "mp-barajas",
    lng: -3.582,
    lat: 40.472,
    priority: 78,
  }, // Barajas (NE edge)
  {
    kind: "peer",
    planId: "mp-matadero",
    lng: -3.6975,
    lat: 40.391,
    priority: 85,
  }, // Legazpi/Arganzuela (S)
  {
    kind: "peer",
    planId: "mp-sanchinarro",
    lng: -3.66,
    lat: 40.488,
    priority: 78,
  }, // Sanchinarro (far N)
  {
    kind: "peer",
    planId: "mp-villaverde",
    lng: -3.696,
    lat: 40.345,
    priority: 80,
  }, // Villaverde (far S)
];

const pinId = (p: Pin) => (p.kind === "venue" ? p.venueId : p.planId);

// Where the selected pin should land on screen when the venue sheet opens:
// the lozenge centers at y≈146 in the visible map strip above the sheet
// (Figma 1277:3461); the viewport center is 852/2 = 426.
const VENUE_PIN_OFFSET: [number, number] = [0, 146 - 426];
// The activity sheet starts lower (~340), so a tapped peer pin lands in the
// middle of the taller map strip above it (Figma 1362:2297: pin center y≈215),
// growing to the focused 71px tile while its card is open.
const PEER_PIN_OFFSET: [number, number] = [0, 215 - 426];

// Centering on a pin flies all the way in and isolates it, pushing neighbouring
// pins off-screen. How far in = the focus radius (metres, pin → nearest screen
// edge), tunable live from Lab → Squircles (see theme/mapPins.ts). Deep radii
// are fine — the vector tiles over-zoom cleanly past their source maxzoom.

// MapLibre zoom whose Web-Mercator ground resolution puts `radiusM` metres at
// `radiusPx` on screen, at the given latitude (156543.03 = equatorial m/px at z0
// for 256px tiles, which matches MapLibre/Mapbox GL zoom).
function zoomForRadius(lat: number, radiusM: number, radiusPx: number) {
  const mppTarget = radiusM / radiusPx;
  const mppAtZoom0 = 156543.03392 * Math.cos((lat * Math.PI) / 180);
  return Math.log2(mppAtZoom0 / mppTarget);
}

export function MapHome({
  interactive = true,
  onboarding = false,
  onOnboardingDone,
  initialFlow = null,
}: {
  interactive?: boolean;
  /** Start with the first-run onboarding over the map (Lab → "Run onboarding"). */
  onboarding?: boolean;
  /** Fires when the flow completes, so the host can disarm replay-on-remount. */
  onOnboardingDone?: () => void;
  /** Demo launcher: open a specific flow on mount (see src/demo/flows.ts).
   *  'plans' is opened by BottomBar (autoOpenPlans); the rest run here. */
  initialFlow?: InitialFlow;
}) {
  const [cursor, setCursor] = useState<"grab" | "grabbing">("grab");
  // ---- Onboarding ----
  // The flow is a full brand surface over the mounted map; completing it zooms
  // the surface away as a 'parent' layer while the camera flies down into the
  // city (and, when interests were picked, spotlights a matching pin).
  const [onbActive, setOnbActive] = useState(onboarding);
  const [onbExiting, setOnbExiting] = useState(false);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  // ---- First-plan tour ----
  // Reactive beats after the reveal, escorting the user to their first joined
  // plan: banner → coach bubble on the spotlighted pin → bubble on Join →
  // milestone card → bubble on the calendar button. Each beat waits for the
  // real action (nothing blocks the UI); the ✕ on any popup kills the tour.
  const [tour, setTour] = useState<
    "welcome" | "pin" | "join" | "celebrate" | "plans" | null
  >(null);
  const [firstPlan, setFirstPlan] = useState<PeerPlan | null>(null);
  const endTour = useCallback(() => {
    setTour(null);
    setSpotlightId(null);
  }, []);
  const [venueId, setVenueId] = useState<VenueId | null>(null);
  // Activity navigation stack: venue activity card → going list → peer card.
  // Lives here (not in BottomBar) because peer pins push onto it too.
  const [activityStack, setActivityStack] = useState<ActivityView[]>([]);
  // Create-plan flow: which surface it grew from (venue CTA / plans sheet).
  // Lives here because confirming mints a real map pin + camera move.
  const [createFrom, setCreateFrom] = useState<
    "venue" | "plans" | "profile" | null
  >(null);
  // Active filter chips (manual + AI-minted — categories, days, vibes). Held
  // here — not in BottomBar — so the selection PERSISTS after the search sheet
  // closes and can filter which pins the map shows.
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const { createdPlans, addCreatedPlan } = usePlansState();
  // The plan just minted this flow — "Go to your plan" flies to it.
  const lastCreatedRef = useRef<CreatedPlan | null>(null);
  // Live zoom drives the screen-space clustering (pins demote/merge as they
  // start colliding — see theme/mapClusters.ts for the behavior spec).
  const [zoom, setZoom] = useState(
    quantizeZoom(onboarding ? ONBOARDING_ZOOM : START_ZOOM),
  );
  const mapRef = useRef<MapRef>(null);
  const pinSize = usePinSize();
  const focusRadius = useFocusRadius();
  const centerFocusZone = useCenterFocusZone();
  // Snap-Map-style passive focus: the id of the full-tile pin currently nearest
  // the viewport center (within the catch zone), or null. It scales up a touch
  // and holds while centered, handing off as the camera moves (see
  // updateCentered). Distinct from `selectedId` — no card, no commit.
  const [centeredId, setCenteredId] = useState<string | null>(null);
  // True when the camera already sits on the user's blue dot — drives the
  // locate button's visibility (it hides when there's nothing to recenter).
  const [cameraCentered, setCameraCentered] = useState(false);
  const entrance = useMotion("entrance");
  const morph = useMotion("morph");
  const press = usePressFeedback();
  // The location halo rests calm and pulses a couple of slow breaths only when
  // the locate button recenters on it. Bumping this tick remounts the halo (via
  // `key`) so each tap replays the burst cleanly from rest.
  const [pulseTick, setPulseTick] = useState(0);
  // Tap-to-commit camera moves (split a stack / zoom toward a dot) use the
  // camera-ease curve — a real-camera accelerate-then-settle, tunable in
  // Lab → Motion → Camera.
  const cameraEase = useCameraEase();
  // A confirm sheet is layered above every card — tour coach bubbles anchored
  // to a card step aside while it's open instead of floating over it.
  const confirmOpen = useConfirmOpen();

  // ---- Profile flow ----
  // The profile navigation stack (see ProfileFlow): empty = closed. Lives
  // here because the tag card hands the screen to route-map mode and plan
  // rows open real activity cards — both map-level moves.
  const [profileStack, setProfileStack] = useState<ProfileView[]>([]);
  // ---- Messages flow ----
  // The full-screen Messages nav stack (inbox → thread): empty = closed. Owned
  // here because both the map's chat button and the "Enter groupchat" CTA on a
  // joined plan open it (the latter drops the activity card first).
  const [messagesStack, setMessagesStack] = useState<MessagesView[]>([]);
  const messagesOpen = messagesStack.length > 0;
  // People added as friends this session ("+ Add Eva" → "Message").
  const [friended, setFriended] = useState<ReadonlySet<PersonId>>(new Set());
  // Route-map mode: whose done-activity route owns the map right now.
  const [routePersonId, setRoutePersonId] = useState<PersonId | null>(null);
  // Camera to restore when leaving route mode.
  const preRouteCam = useRef<{ center: [number, number]; zoom: number } | null>(
    null,
  );

  // Static mock pins + one peer pin per plan created through the flow.
  const allPins = useMemo<Pin[]>(
    () => [
      ...pins,
      ...createdPlans.map((cp) => ({
        kind: "peer" as const,
        planId: cp.plan.id,
        lng: cp.lng,
        lat: cp.lat,
        priority: 99, // your own plan never demotes to a dot
      })),
    ],
    [createdPlans],
  );
  // Peer-plan lookup spanning the mock set and created plans.
  const planById = (id: string): PeerPlan | undefined =>
    MAP_PEER_PLANS[id] ?? createdPlans.find((cp) => cp.plan.id === id)?.plan;

  const cluster = defaultMapCluster;
  const collidePx = pinSize * cluster.collideFactor;
  // The focused pin under an open card: the venue sheet's venue, a peer plan's
  // pin, or — when an event card is open (e.g. opened from the search list) —
  // the pin of the venue hosting that event. It's exempt from clustering and
  // grows + bobs (see MorphVenuePin / MapPeerPin `selected`).
  const activityRoot = activityStack[0];
  const selectedId =
    venueId ??
    (activityRoot?.kind === "peer"
      ? activityRoot.plan.id
      : activityRoot?.kind === "event"
        ? activityRoot.venueId
        : null);

  // Chip filter: with chips active, the map shows only pins that match them
  // (AND across kinds — category/day/vibe — OR within a kind; see
  // search/filters). The focused pin under an open card is always exempt so a
  // card opened from the search list never hides its own pin. Filtering
  // persists after the sheet closes; removing the chips restores every pin.
  const visiblePins = useMemo(() => {
    if (filters.length === 0) return allPins;
    return allPins.filter((p) => {
      if (pinId(p) === selectedId) return true;
      if (p.kind === "venue")
        return matchesFilters(VENUE_FILTER_FACTS[p.venueId], filters);
      const plan = planById(p.planId);
      return plan != null && matchesFilters(planFilterFacts(plan), filters);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPins, filters, selectedId]);

  // Any open card (venue / my-plans / peer / create flow) hides the top-right
  // avatar so the card owns the screen — it springs back on the bare map.
  const cardOpen =
    venueId !== null || activityStack.length > 0 || createFrom !== null;
  // Read from the per-frame move handler without making it a dependency.
  const cardOpenRef = useRef(cardOpen);
  cardOpenRef.current = cardOpen;
  // The selected pin owns focus while a card is open; drop any passive
  // center-magnify so a still-full neighbour doesn't hold the emphasis.
  useEffect(() => {
    if (cardOpen) setCenteredId(null);
  }, [cardOpen]);

  // ---- Zoom-tier curation (Bump-style; see theme/mapClusters.ts) ----
  // The map earns detail as you zoom in: far = everything hides behind the
  // place crest; mid = a graduated priority budget (all pins at the near edge
  // thinning to the `tileBudget` floor at the far edge; the rest are quiet
  // dots); near = full collision clustering. The tier flips with a
  // ±hysteresis band so a camera ease sitting on a boundary can't flicker
  // pins between modes.
  const density = useMapDensity();
  const tierRef = useRef<"far" | "mid" | "near">("near");
  const tier = useMemo(() => {
    const prev = tierRef.current;
    const h = density.tierHysteresis;
    const farEdge = density.farZoom + (prev === "far" ? h : -h);
    const nearEdge = density.nearZoom + (prev === "near" ? -h : h);
    const next = zoom < farEdge ? "far" : zoom >= nearEdge ? "near" : "mid";
    tierRef.current = next;
    return next;
  }, [zoom, density.farZoom, density.nearZoom, density.tierHysteresis]);

  // The selected pin is exempt from clustering (it's focused/grown under an
  // open sheet); everyone else groups purely by pixel proximity at this zoom,
  // after the tier curation above has decided who participates at all.
  const { placements, stacks } = useMemo(() => {
    const pts = visiblePins
      .filter((p) => pinId(p) !== selectedId)
      .map((p) => ({
        id: pinId(p),
        lng: p.lng,
        lat: p.lat,
        kind: p.kind,
        priority: p.priority,
      }));
    // The onboarding spotlight pin always keeps its tile — the tour points at it.
    if (tier === "far") {
      // Staged exit: tiles are gone, but the quiet dots linger below farZoom
      // and only fade once the camera pulls past dotsZoom.
      const farMode: Placement = {
        mode: zoom >= density.dotsZoom ? "dot" : "hidden",
      };
      // (globalThis.Map — the bare name is shadowed by the react-map-gl component.)
      const hiddenAll = new globalThis.Map<string, Placement>(
        pts.map((p) => [
          p.id,
          p.id === spotlightId ? ({ mode: "full" } as Placement) : farMode,
        ]),
      );
      return { placements: hiddenAll, stacks: [] as PinStack[] };
    }
    if (tier === "mid") {
      // Graduated budget: virtually every pin keeps its tile at the near edge
      // of the band (a district zoom still maps what's around you), thinning
      // linearly by priority to the `tileBudget` floor at the far edge — pins
      // shed one rank at a time as you zoom out, never in one drop.
      const t = Math.max(
        0,
        Math.min(
          1,
          (zoom - density.farZoom) /
            Math.max(density.nearZoom - density.farZoom, 0.1),
        ),
      );
      const budget = Math.round(
        density.tileBudget + (pts.length - density.tileBudget) * t,
      );
      const keep = new Set(
        [...pts]
          .sort((a, b) => b.priority - a.priority)
          .slice(0, Math.max(budget, density.tileBudget))
          .map((p) => p.id),
      );
      if (spotlightId) keep.add(spotlightId);
      const curated = computeClusters(
        pts.filter((p) => keep.has(p.id)),
        zoom,
        collidePx,
      );
      for (const p of pts) {
        if (!keep.has(p.id)) curated.placements.set(p.id, { mode: "dot" });
      }
      return curated;
    }
    return computeClusters(pts, zoom, collidePx);
  }, [
    visiblePins,
    zoom,
    collidePx,
    selectedId,
    tier,
    density.tileBudget,
    density.dotsZoom,
    density.farZoom,
    density.nearZoom,
    spotlightId,
  ]);

  // Far-tier aggregate hint: one small count pill at the centroid of what the
  // map is hiding — the only content marker at that height (Bump keeps far
  // zooms for identity, not content). Tapping it dives to the mid tier.
  const hint = useMemo(() => {
    if (visiblePins.length === 0) return null;
    const lng = visiblePins.reduce((s, p) => s + p.lng, 0) / visiblePins.length;
    const lat = visiblePins.reduce((s, p) => s + p.lat, 0) / visiblePins.length;
    return { lng, lat, count: visiblePins.length };
  }, [visiblePins]);

  // Latest placements/pins, readable from the imperative move handler without
  // making them dependencies (which would re-subscribe every zoom step).
  const placementsRef = useRef(placements);
  placementsRef.current = placements;
  // Only the visible (filter-passing) pins are candidates for center-focus/edge
  // zoom, so a hidden pin never grabs focus behind the sheet.
  const allPinsRef = useRef(visiblePins);
  allPinsRef.current = visiblePins;

  // Center-focus only wakes once the camera has actually moved (the user's
  // gesture OR a programmatic fly-in re-arms it) — never on plain app entry,
  // where an already-enlarged pin would read as random emphasis.
  const focusArmed = useRef(false);
  // Mirror of centeredId, readable from the per-frame handler.
  const centeredIdRef = useRef<string | null>(null);
  centeredIdRef.current = centeredId;
  // Handoff hysteresis: a challenger must be clearly nearer the center than
  // the current holder, and the holder keeps focus a little past the zone
  // edge — otherwise easing/sub-pixel jitter at the boundary makes the two
  // pins trade the magnify back and forth.
  const FOCUS_STICKY_PX = 12;
  const FOCUS_EXIT = 1.15;

  // Recompute the centered pin: project every full tile to screen px, pick the
  // one nearest the viewport center, and keep it only if it's inside the catch
  // zone. Runs on every camera move but re-renders solely when the winner
  // changes (functional setState bails on equal), so panning through a pin
  // costs one grow + one shrink, not a frame-by-frame churn. Stacked pins and
  // demoted dots aren't candidates — only `full` tiles emphasize.
  const updateCentered = useCallback(() => {
    if (!focusArmed.current) return;
    // While a card is open the selected pin owns focus (and the fly-in is
    // exactly the laggy moment) — skip projecting all pins every frame.
    if (cardOpenRef.current) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const el = map.getContainer();
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    const zonePx = Math.min(el.clientWidth, el.clientHeight) * centerFocusZone;
    const prev = centeredIdRef.current;
    let bestId: string | null = null;
    let bestD = Infinity;
    let prevD: number | null = null;
    for (const p of allPinsRef.current) {
      const id = pinId(p);
      if (placementsRef.current.get(id)?.mode !== "full") continue;
      const pt = map.project([p.lng, p.lat]);
      const d = Math.hypot(pt.x - cx, pt.y - cy);
      if (id === prev) prevD = d;
      if (d < bestD) {
        bestD = d;
        bestId = id;
      }
    }
    let next = bestId !== null && bestD <= zonePx ? bestId : null;
    // Sticky holder: only hand off when the challenger clearly wins. A holder
    // that got demoted (no longer 'full') has prevD === null and releases.
    if (
      prev &&
      next !== prev &&
      prevD !== null &&
      prevD <= zonePx * FOCUS_EXIT
    ) {
      if (next === null || bestD > prevD - FOCUS_STICKY_PX) next = prev;
    }
    setCenteredId((p) => (p === next ? p : next));
  }, [centerFocusZone]);

  // Is the blue dot back under the viewport center? recenter() lands the camera
  // exactly on USER_LOCATION, so "centered" = the dot projects within a few px
  // of the screen center. Runs on every camera move to toggle the locate button.
  const updateCameraCentered = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const el = map.getContainer();
    const pt = map.project([USER_LOCATION.longitude, USER_LOCATION.latitude]);
    const off = Math.hypot(
      pt.x - el.clientWidth / 2,
      pt.y - el.clientHeight / 2,
    );
    const next = off <= 6; // px tolerance for easing/sub-pixel jitter
    setCameraCentered((prev) => (prev === next ? prev : next));
  }, []);

  // Re-evaluate whenever clustering changes (zoom promotes/demotes tiles, a card
  // opens/closes) and once the map is ready — panning is handled by onMove.
  useEffect(() => {
    updateCentered();
  }, [placements, updateCentered]);

  // ---- Edge-zoom camera control ----
  // The edge-zoom drag applies zoom directly (finger-tracked, no animation). But
  // when a pin is center-focused we ALSO glide it to exact screen center on the
  // camera-ease curve, so it eases in instead of snapping. Both run at once: a
  // one-shot recenter animation owns center+zoom while it plays; once it settles,
  // plain jumpTo keeps the pin pinned to center for the rest of the drag.
  const edge = useRef<{
    focus: [number, number] | null;
    startCenter: { lng: number; lat: number };
    zoom: number;
    recentering: boolean;
    started: boolean;
  } | null>(null);
  const edgeAnim = useRef<{ stop: () => void } | null>(null);

  // Latch the focused pin (if any) at the first zoom move of a gesture.
  const startEdgeZoom = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    edgeAnim.current?.stop();
    const p = visiblePins.find((pp) => pinId(pp) === centeredId);
    edge.current = {
      focus: p ? ([p.lng, p.lat] as [number, number]) : null,
      startCenter: map.getCenter(),
      zoom: map.getZoom(),
      recentering: false,
      started: false,
    };
  };

  const applyEdgeZoom = (z: number) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const g = edge.current;
    if (!g || !g.focus) return map.setZoom(z); // nothing focused → zoom around center
    g.zoom = z;
    // First move: kick the recenter ease, then let it own the camera til it settles.
    if (!g.started) {
      g.started = true;
      g.recentering = true;
      const sc = g.startCenter;
      const [flng, flat] = g.focus;
      edgeAnim.current = animate(0, 1, {
        duration: cameraEase.durationMs / 1000,
        ease: cameraEase.easing,
        onUpdate: (e) => {
          const gg = edge.current;
          if (!gg || !gg.focus) return;
          map.jumpTo({
            center: [lerp(sc.lng, flng, e), lerp(sc.lat, flat, e)],
            zoom: gg.zoom,
          });
        },
        onComplete: () => {
          if (edge.current) edge.current.recentering = false;
        },
      });
      return;
    }
    // Mid-ease the animation frame applies the latest zoom; once settled, keep
    // the pin pinned to exact center directly.
    if (!g.recentering) map.jumpTo({ center: g.focus, zoom: z });
  };

  // Stop any in-flight recenter if the map screen unmounts.
  useEffect(() => () => edgeAnim.current?.stop(), []);

  const onClick = (_e: MapLayerMouseEvent) => {
    // hook for later: open activity sheet on pin click
  };

  // Tapping a stack zooms in just far enough for its members to split apart
  // (the merge morph plays in reverse as they clear the collide radius).
  const splitStack = (st: PinStack) => {
    // Clamped both ways: near-identical coords would otherwise compute a
    // multi-level dive toward tiles that never separate.
    const dz = Math.min(
      Math.max(
        Math.log2(
          (collidePx * cluster.splitMargin) / Math.max(st.minPairPx, 1),
        ),
        cluster.minSplitZoom,
      ),
      cluster.maxSplitZoom,
    );
    mapRef.current?.easeTo({
      center: [st.center.lng, st.center.lat],
      zoom: zoom + dz,
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
  };

  // The locate button: pan back to the user's blue dot, keeping the current
  // zoom, on the camera-ease curve. Only tappable on the bare map (no card).
  const recenter = () => {
    mapRef.current?.easeTo({
      center: [USER_LOCATION.longitude, USER_LOCATION.latitude],
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
    // Replay the two-breath halo pulse (see the location Marker).
    setPulseTick((t) => t + 1);
  };

  // Tapping a demoted dot promotes it the honest way: zoom toward it.
  const zoomToward = (p: Pin) => {
    mapRef.current?.easeTo({
      center: [p.lng, p.lat],
      zoom: zoom + cluster.dotZoomStep,
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
  };

  // Tapping the far-tier place crest dives into the city: frame the camera on
  // the DENSE core of pins at a mid-tier zoom, so you land on a lively spread
  // (variety, many kinds) that the graduated budget keeps calm — never zoomed
  // onto a single pin. We centre on a trimmed mean (drop the farthest ~20%) so
  // the scattered outliers (Barajas, Villaverde, Aravaca…) don't drag the frame
  // east of the action the way a plain centroid did.
  const diveIntoCity = () => {
    const map = mapRef.current?.getMap();
    if (!map || visiblePins.length === 0) return;
    const mLng =
      visiblePins.reduce((s, p) => s + p.lng, 0) / visiblePins.length;
    const mLat =
      visiblePins.reduce((s, p) => s + p.lat, 0) / visiblePins.length;
    const core = [...visiblePins]
      .sort(
        (a, b) =>
          Math.hypot(a.lng - mLng, a.lat - mLat) -
          Math.hypot(b.lng - mLng, b.lat - mLat),
      )
      .slice(0, Math.max(1, Math.ceil(visiblePins.length * 0.8)));
    const coreLng = core.reduce((s, p) => s + p.lng, 0) / core.length;
    const coreLat = core.reduce((s, p) => s + p.lat, 0) / core.length;
    // Bias the frame toward the user's own location so YOU stay in view. The
    // pure pin-core centre sits north-east of the blue dot, which pinned it to
    // the left edge; pulling most of the way toward it moves the camera a touch
    // left + down and reads as "here's what's around me".
    const USER_BIAS = 0.7;
    const cLng = coreLng + (USER_LOCATION.longitude - coreLng) * USER_BIAS;
    const cLat = coreLat + (USER_LOCATION.latitude - coreLat) * USER_BIAS;
    // Land ~40% into the mid band: plenty of tiles/variety, still curated calm.
    const zoomTarget =
      density.farZoom + (density.nearZoom - density.farZoom) * 0.42;
    map.easeTo({
      center: [cLng, cLat],
      zoom: zoomTarget,
      // Nudge the cluster up so the bottom bar doesn't cover the southern pins.
      offset: [0, -36],
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
  };

  // Open the venue sheet and glide the tapped pin into the map strip above it,
  // on the same clock as the surface morph.
  const selectVenue = (pin: Pin & { kind: "venue" }) => {
    setVenueId(pin.venueId);
    setActivityStack([]); // a venue tap always lands on the venue sheet
    // Fly all the way in (≈focusRadius around the pin) so it stands alone —
    // a real-camera accelerate-then-settle, since it's a big zoom jump.
    mapRef.current?.easeTo({
      center: [pin.lng, pin.lat],
      zoom: zoomForRadius(pin.lat, focusRadius, device.width / 2),
      offset: VENUE_PIN_OFFSET,
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
  };

  // Peer pins open their standalone plan's activity card directly.
  const selectPeer = (pin: Pin & { kind: "peer" }) => {
    const plan = planById(pin.planId);
    if (!plan) return;
    setVenueId(null); // standalone plans don't sit on a venue sheet
    setActivityStack([{ kind: "peer", plan }]);
    // Same deep fly-in as venues, so the focused peer tile is isolated.
    mapRef.current?.easeTo({
      center: [pin.lng, pin.lat],
      zoom: zoomForRadius(pin.lat, focusRadius, device.width / 2),
      offset: PEER_PIN_OFFSET,
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
  };

  // Fly the camera to a pin and isolate it in the map strip above the activity
  // card (same deep fly-in + offset as selectPeer) — the pin focuses and bobs
  // because opening its card marks it `selected` (see selectedId).
  const flyToPin = (pin: Pin) => {
    mapRef.current?.easeTo({
      center: [pin.lng, pin.lat],
      zoom: zoomForRadius(pin.lat, focusRadius, device.width / 2),
      offset: PEER_PIN_OFFSET,
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
  };

  // A stable tap dispatcher for the pins: MapPin is React.memo'd, so its
  // onClick prop must keep the same identity across the ~per-frame re-renders
  // of a camera move (an inline arrow would defeat the memo and re-render all
  // pins every frame). The routing reads the latest handlers via a ref.
  const tapHandlers = useRef({
    zoomToward,
    splitStack,
    selectVenue,
    selectPeer,
  });
  tapHandlers.current = { zoomToward, splitStack, selectVenue, selectPeer };
  const onPinTap = useCallback(
    (pin: Pin, mode: Placement["mode"], stack?: PinStack) => {
      const h = tapHandlers.current;
      if (mode === "dot") return h.zoomToward(pin);
      if (mode === "stack" && stack) return h.splitStack(stack);
      return pin.kind === "venue" ? h.selectVenue(pin) : h.selectPeer(pin);
    },
    [],
  );

  // Search-list taps open the item's activity card AND fly to its pin, so it
  // gets the same focus/bob as a pin tap. Events focus their host venue's pin;
  // standalone plans focus their peer pin.
  const openEventFromSearch = (searchVenueId: VenueId, eventId: string) => {
    setVenueId(null);
    setActivityStack([{ kind: "event", venueId: searchVenueId, eventId }]);
    const pin = allPins.find(
      (p) => p.kind === "venue" && p.venueId === searchVenueId,
    );
    if (pin) flyToPin(pin);
  };
  const openPeerFromSearch = (plan: PeerPlan) => {
    setVenueId(null);
    setActivityStack([{ kind: "peer", plan }]);
    const pin = allPins.find((p) => p.kind === "peer" && p.planId === plan.id);
    if (pin) flyToPin(pin);
  };

  // ---- Create-plan flow ----
  // "Create plan" confirmed on the last-check card: mint the real plan — a
  // pin (the venue's coords, or just off the current map center for a custom
  // address) plus a "Your plans" entry. The card is already showing success;
  // the pin quietly exists behind it.
  const confirmCreate = (r: CreatePlanResult) => {
    const loc = r.location;
    let lng: number;
    let lat: number;
    if (loc.kind === "venue") {
      const pin = allPins.find(
        (p) => p.kind === "venue" && p.venueId === loc.venueId,
      );
      // Nudged ~60m off the venue: two pins at IDENTICAL coords can never be
      // split apart by zoom, so the stack tap would dive without separating.
      lng = (pin?.lng ?? MADRID.longitude) + 0.0006;
      lat = (pin?.lat ?? MADRID.latitude) + 0.0004;
    } else {
      const center = mapRef.current?.getMap().getCenter();
      lng = (center?.lng ?? MADRID.longitude) + 0.0016;
      lat = (center?.lat ?? MADRID.latitude) + 0.0009;
    }
    const address =
      loc.kind === "venue"
        ? VENUES[loc.venueId].address
        : `${loc.address}, ${loc.area}`;
    const plan: PeerPlan = {
      id: `created-${Date.now()}`,
      title: r.title,
      host: "You",
      hostLine: r.tags.length > 0 ? r.tags.join(" - ") : "Your plan",
      address,
      when: `${r.day} - ${r.time}`,
      description: r.description,
      goingNames: "Just you so far",
      goingCount: 1,
    };
    const created: CreatedPlan = {
      plan,
      lng,
      lat,
      dayTag: r.day.slice(0, 3).toUpperCase(),
      time: r.time,
      meta: `Hosted by you - up to ${r.people} people`,
    };
    lastCreatedRef.current = created;
    addCreatedPlan(created);
  };

  // ---- Route-map mode (the tag card's special map) ----
  // Only the venues from that person's done activities show, joined by a
  // route line in visit order; a top banner marks the mode (RouteBanner).
  const routeVenuePins = useMemo(() => {
    if (!routePersonId) return [];
    return PEOPLE[routePersonId].doneVenueIds
      .map((vid) =>
        allPins.find(
          (p): p is Pin & { kind: "venue" } =>
            p.kind === "venue" && p.venueId === vid,
        ),
      )
      .filter((p): p is Pin & { kind: "venue" } => p != null);
  }, [routePersonId, allPins]);

  const routeLine = useMemo(
    () =>
      routeVenuePins.length > 1
        ? {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: routeVenuePins.map((p) => [p.lng, p.lat]),
            },
          }
        : null,
    [routeVenuePins],
  );

  const openRoute = (personId: PersonId) => {
    const map = mapRef.current?.getMap();
    if (map) {
      const c = map.getCenter();
      preRouteCam.current = { center: [c.lng, c.lat], zoom: map.getZoom() };
    }
    // Route mode owns the map — any open card/sheet under the profile drops.
    setVenueId(null);
    setActivityStack([]);
    setCreateFrom(null);
    setRoutePersonId(personId);
    const coords = PEOPLE[personId].doneVenueIds
      .map((vid) =>
        allPins.find((p) => p.kind === "venue" && p.venueId === vid),
      )
      .filter((p): p is Pin => p != null);
    if (coords.length > 0 && map) {
      let minLng = Infinity,
        maxLng = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity;
      for (const p of coords) {
        minLng = Math.min(minLng, p.lng);
        maxLng = Math.max(maxLng, p.lng);
        minLat = Math.min(minLat, p.lat);
        maxLat = Math.max(maxLat, p.lat);
      }
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: { top: 150, bottom: 110, left: 55, right: 55 },
          duration: cameraEase.durationMs * 1.6,
          easing: cameraEase.easing,
        },
      );
    }
  };

  const closeRoute = () => {
    setRoutePersonId(null);
    const prev = preRouteCam.current;
    if (prev) {
      mapRef.current?.easeTo({
        center: prev.center,
        zoom: prev.zoom,
        duration: cameraEase.durationMs * 1.4,
        easing: cameraEase.easing,
      });
    }
  };

  // Plan rows on a profile open the real activity card: the profile drops
  // away and the card + focused pin take over (flat navigation, no stacking).
  const openPlanFromProfile = (planVenueId: VenueId, eventId: string) => {
    setProfileStack([]);
    openEventFromSearch(planVenueId, eventId);
  };

  // Host/attendee avatars on activity cards open that person's profile.
  const openProfilePerson = (personId: PersonId) => {
    setProfileStack([{ kind: "person", id: personId }]);
  };

  // Demo launcher: on a cold mount, drop straight into the requested flow via
  // the same handlers a tap would use ('plans' is handled by BottomBar). Skips
  // when onboarding is armed — the flow surfaces after the first-run finishes.
  useEffect(() => {
    if (onboarding || !initialFlow) return;
    if (initialFlow === "create") setCreateFrom("plans");
    else if (initialFlow === "profile") openProfilePerson(ME);
    else if (initialFlow === "messages") setMessagesStack([{ kind: "inbox" }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Go to your plan": drop the flow and land on the new plan exactly like a
  // peer-pin tap — its card opens while the camera isolates the fresh pin.
  const goToCreatedPlan = () => {
    const cp = lastCreatedRef.current;
    setCreateFrom(null);
    setVenueId(null);
    if (!cp) return;
    setActivityStack([{ kind: "peer", plan: cp.plan }]);
    mapRef.current?.easeTo({
      center: [cp.lng, cp.lat],
      zoom: zoomForRadius(cp.lat, focusRadius, device.width / 2),
      offset: PEER_PIN_OFFSET,
      duration: cameraEase.durationMs,
      easing: cameraEase.easing,
    });
  };

  // ---- Onboarding landing ----
  // The real map rests untouched beneath the toy-city playground for the
  // whole flow. Finishing is "the jump": the toy world zoom-through-dives
  // past the camera (OnboardingFlow's `exiting`) while the reveal dolly flies
  // from the city overview down into the neighbourhood beneath it. With
  // interests picked, it lands on the first matching pin and spotlights it
  // ("for you") — the guided first moment; skipping lands on the user dot.
  const spotlightTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  useEffect(() => () => spotlightTimers.current.forEach(clearTimeout), []);
  const finishOnboarding = (r: OnboardingResult) => {
    onOnboardingDone?.();
    setOnbExiting(true);
    spotlightTimers.current.push(
      setTimeout(() => {
        setOnbActive(false);
        setOnbExiting(false);
      }, stageExit.ms + 120),
    );
    const spotInterest = pickSpotlight(r.interests);
    const spotPin = spotInterest
      ? allPins.find((p) =>
          spotInterest.spot!.kind === "venue"
            ? p.kind === "venue" && p.venueId === spotInterest.spot!.id
            : p.kind === "peer" && p.planId === spotInterest.spot!.id,
        )
      : null;
    const targetZoom = spotPin ? 15.1 : START_ZOOM;
    const map = mapRef.current?.getMap();
    map?.stop();
    // 1.4× when the descent already landed nearby → 2.6× for a skip from the
    // welcome overview (~3.5 zoom levels out) — one continuous feel either way.
    const zoomDist = map ? Math.abs(targetZoom - map.getZoom()) : 0;
    const revealMs =
      cameraEase.durationMs * Math.min(2.6, 1.4 + (zoomDist / 3.5) * 1.2);
    mapRef.current?.easeTo({
      center: spotPin
        ? [spotPin.lng, spotPin.lat]
        : [USER_LOCATION.longitude, USER_LOCATION.latitude],
      zoom: targetZoom,
      duration: revealMs,
      easing: cameraEase.easing,
    });
    if (spotPin) {
      const id = pinId(spotPin);
      // once the camera settles, the tour opens: welcome banner first, the
      // pin's coach bubble anchored underneath it from the same moment
      spotlightTimers.current.push(
        setTimeout(() => {
          setSpotlightId(id);
          setTour("welcome");
        }, revealMs + 150),
      );
    }
  };
  const spotlightPin = spotlightId
    ? allPins.find((p) => pinId(p) === spotlightId)
    : null;

  // ---- Tour beat machine ----
  // The stack tells the story: a peer card opening advances pin → join; the
  // 'joined' confirmation triggers the milestone; closing the card without
  // joining regresses join → pin so the guidance never dangles unseen.
  const stackTop = activityStack[activityStack.length - 1];
  useEffect(() => {
    if (!tour) return;
    const joinedView = activityStack.find((v) => v.kind === "joined");
    const hasPeer = activityStack.some(
      (v) => v.kind === "peer" || v.kind === "joined",
    );
    if (
      (tour === "welcome" || tour === "pin" || tour === "join") &&
      joinedView
    ) {
      setFirstPlan(joinedView.kind === "joined" ? joinedView.plan : null);
      setTour("celebrate");
    } else if ((tour === "welcome" || tour === "pin") && hasPeer) {
      setTour("join");
    } else if (tour === "join" && !hasPeer) {
      setTour("pin");
    }
  }, [activityStack, tour]);

  // Timed beats: the banner announces then hands over to the pin bubble; the
  // milestone card says its piece then points at the calendar; the calendar
  // bubble (the goodbye) retires by itself if never acted on — but only while
  // it's actually visible (no card covering the resting chrome).
  useEffect(() => {
    if (tour !== "welcome") return;
    const t = setTimeout(() => setTour("pin"), 4600);
    return () => clearTimeout(t);
  }, [tour]);
  useEffect(() => {
    if (tour !== "celebrate") return;
    const t = setTimeout(() => setTour("plans"), 3200);
    return () => clearTimeout(t);
  }, [tour]);
  useEffect(() => {
    if (tour !== "plans" || cardOpen) return;
    const t = setTimeout(endTour, 14000);
    return () => clearTimeout(t);
  }, [tour, cardOpen, endTour]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          ...MADRID,
          zoom: onboarding ? ONBOARDING_ZOOM : START_ZOOM,
        }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        // Keep the GL drawing buffer so screenshot capture (modern-screenshot)
        // can read the map canvas instead of grabbing a blank rectangle.
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
        cursor={interactive ? cursor : "default"}
        onDragStart={() => setCursor("grabbing")}
        onDragEnd={() => setCursor("grab")}
        onZoom={(e) => {
          // Snap to the clustering grain; equal values bail React's re-render.
          const q = quantizeZoom(e.viewState.zoom);
          setZoom((prev) => (prev === q ? prev : q));
        }}
        onMove={() => {
          // Any real camera motion (gesture or fly-in) arms the passive
          // center-focus; app entry alone never enlarges a pin.
          focusArmed.current = true;
          updateCentered();
          updateCameraCentered();
        }}
        onLoad={() => {
          updateCameraCentered();
          // Dev/test hook: lets scripted sessions drive the camera directly
          // (preview tabs throttle rAF, so synthetic wheel easing stalls).
          (window as unknown as Record<string, unknown>).__lpMap =
            mapRef.current?.getMap();
        }}
        onClick={onClick}
        dragPan={interactive}
        scrollZoom={interactive}
        doubleClickZoom={interactive}
        touchZoomRotate={interactive}
        dragRotate={false}
        keyboard={interactive}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Route-map mode: ONLY that person's done venues, joined by a brand
            route line in visit order (everything else hides). The line lives
            in the map canvas so it pans/zooms under the pins. */}
        {routeLine && (
          <Source id="profile-route" type="geojson" data={routeLine}>
            <Layer
              id="profile-route-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": color.brand,
                "line-width": 4,
                "line-opacity": 0.9,
              }}
            />
          </Source>
        )}
        {routePersonId &&
          routeVenuePins.map((p, i) => (
            <Marker
              key={`route-${p.venueId}`}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...entrance, delay: 0.15 + i * 0.05 }}
              >
                <VenuePin size={pinSize} icon={VENUES[p.venueId].icon} />
              </motion.div>
            </Marker>
          ))}

        {/* Activity pins — each is a React.memo'd MapPin, so a camera move only
            re-renders the pins whose placement actually changed (see MapPin). */}
        {!routePersonId &&
          visiblePins.map((p, i) => {
            const id = pinId(p);
            const isSelected = id === selectedId;
            const pl: Placement = placements.get(id) ?? { mode: "full" };
            // Passive center-focus: a lone full tile sitting nearest the viewport
            // center gets the subtle magnify (never a stacked/demoted/selected pin).
            const centered =
              pl.mode === "full" && !isSelected && id === centeredId;
            return (
              <MapPin
                key={id}
                pin={p}
                mode={pl.mode}
                slot={pl.mode === "stack" ? pl.slot : 0}
                stack={pl.mode === "stack" ? pl.stack : undefined}
                // Only stacked tiles need zoom (their fan-out is screen-px); full/
                // dot tiles get 0 so their props stay stable across zoom frames.
                zoomForStack={pl.mode === "stack" ? zoom : 0}
                isSelected={isSelected}
                centered={centered}
                // Identity hierarchy (Bump-style): YOUR plans render bigger than
                // ordinary content pins — created ones carry priority 99.
                big={p.kind === "peer" && p.priority >= 99}
                index={i}
                onTap={onPinTap}
              />
            );
          })}

        {/* Far-tier place marker — the one content marker when the tier
            curation hides everything: the place's crest + count + name at the
            pins' centroid (browse the world by place, tap to dive into its
            pins). Tapping eases down to the mid tier (curated tiles). */}
        <AnimatePresence>
          {/* Hidden during onboarding: the crest is an invitation to tap, and
              the descent owns the camera until the flow hands over. */}
          {!routePersonId && !onbActive && tier === "far" && hint && (
            <Marker
              longitude={MADRID_LABEL.lng}
              latitude={MADRID_LABEL.lat}
              // Docked just above the base map's own "Madrid" label, which
              // captions the crest — no duplicate text, pans with the map.
              anchor="bottom"
              offset={[0, -14]}
              style={{ zIndex: 5 }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={morph}
                whileTap={press.whileTap}
                data-map-pin=""
                onClick={diveIntoCity}
                style={{ cursor: "pointer" }}
              >
                <PlaceHint count={hint.count} />
              </motion.div>
            </Marker>
          )}
        </AnimatePresence>

        {/* Stack count badges — geo-anchored at each stack's centroid,
            hugging the bottom seam of the fanned tiles (Bump-style "2"). */}
        {!routePersonId &&
          stacks.map((st) => {
            const badgePx = Math.max(18, pinSize * cluster.badgeRatio);
            return (
              <Marker
                key={`stack-${st.id}`}
                longitude={st.center.lng}
                latitude={st.center.lat}
                anchor="center"
                offset={[0, pinSize * 0.52]}
                // Sit in front of the stack: its front tile paints at z = 2 + n
                // (see stackZ), so the badge needs to beat that.
                style={{ zIndex: 3 + st.members.length }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={morph}
                  whileTap={press.whileTap}
                  onClick={() => splitStack(st)}
                  data-map-pin=""
                  style={{
                    width: badgePx,
                    height: badgePx,
                    boxSizing: "border-box",
                    borderRadius: "50%",
                    background: color.brand,
                    color: color.onBrand,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: font.family,
                    fontSize: badgePx * 0.5,
                    // Center the digits optically: kill the extra line box and nudge
                    // for the empty descender space so the glyph sits dead-center.
                    lineHeight: 1,
                    paddingTop: badgePx * 0.04,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {st.members.length}
                </motion.div>
              </Marker>
            );
          })}

        {/* User location — pulses once when the locate button recenters on it
            (each tap bumps pulseTick; see LocationDot). */}
        <Marker
          longitude={USER_LOCATION.longitude}
          latitude={USER_LOCATION.latitude}
          anchor="center"
        >
          <LocationDot pulseTick={pulseTick} />
        </Marker>

        {/* Tour beat 2 — the coach bubble riding the pin the reveal landed on.
            Hides while any card covers the map; the beat machine brings it
            back if the user wanders off without joining. */}
        <AnimatePresence>
          {(tour === "pin" || tour === "welcome") &&
            spotlightPin &&
            !cardOpen && (
              <Marker
                key="tour-pin"
                longitude={spotlightPin.lng}
                latitude={spotlightPin.lat}
                anchor="bottom"
                offset={[0, -(pinSize * 0.85)]}
                style={{ zIndex: 20 }}
              >
                <TourBubble
                  text="This one matches what you're into — take a look"
                  onSkip={endTour}
                />
              </Marker>
            )}
        </AnimatePresence>
      </Map>

      {/* Edge zoom (Snap-Map style): finger on the L/R edge, slide up to zoom
          in, down to zoom out; a black goo blob rides the finger while active. */}
      <EdgeZoom
        enabled={interactive}
        getZoom={() => mapRef.current?.getMap().getZoom() ?? zoom}
        onZoomStart={startEdgeZoom}
        setZoom={applyEdgeZoom}
      />

      {/* ---------- Fixed UI chrome (exact Figma assets) ---------- */}
      {/* Morphing bottom bar: search pill ⇄ search sheet ⇄ venue ⇄ activity.
          Route-map mode suppresses its resting chrome — the route owns the map. */}
      <BottomBar
        venue={venueId ? VENUES[venueId] : null}
        onCloseVenue={() => setVenueId(null)}
        activityStack={activityStack}
        onActivityPush={(view) => setActivityStack((s) => [...s, view])}
        onActivityPop={() => setActivityStack((s) => s.slice(0, -1))}
        onActivityClose={() => setActivityStack([])}
        onSearchEvent={openEventFromSearch}
        onSearchPeer={openPeerFromSearch}
        onLocate={recenter}
        cameraCentered={cameraCentered}
        createFrom={createFrom}
        onOpenCreate={setCreateFrom}
        onCloseCreate={() => setCreateFrom(null)}
        onConfirmCreate={confirmCreate}
        onGoToCreatedPlan={goToCreatedPlan}
        onOpenProfile={openProfilePerson}
        autoOpenPlans={initialFlow === "plans"}
        onPlansOpened={() => {
          if (tour === "plans") endTour();
        }}
        onOpenMessages={() => setMessagesStack([{ kind: "inbox" }])}
        filters={filters}
        onFiltersChange={setFilters}
        onEnterGroupChat={(plan) => {
          // Leave the activity card and open the plan's group thread, with the
          // inbox underneath so "back" returns to it (flat navigation).
          setActivityStack([]);
          setVenueId(null);
          setMessagesStack([{ kind: "inbox" }, { kind: "thread", plan }]);
        }}
        suppressed={routePersonId !== null || onbActive || messagesOpen}
      />

      {/* Route-map banner: "you're on Pere's pub crawl, not the normal map" */}
      <AnimatePresence>
        {routePersonId && (
          <RouteBanner personId={routePersonId} onClose={closeRoute} />
        )}
      </AnimatePresence>

      {/* The profile flow: the top-right avatar at rest, morphing into the
          full profile sheet (own + other profiles, lists, QR). Replaces the
          old avatar placeholder — same corner slot, now a real person. */}
      <ProfileFlow
        stack={profileStack}
        onPush={(view) =>
          setProfileStack((s) => {
            // Ignore a double-tap pushing the view that's already on top.
            const t = s[s.length - 1];
            const same =
              t != null &&
              t.kind === view.kind &&
              (t.kind === "qr" ||
                (view.kind !== "qr" &&
                  (t as { id: string }).id === (view as { id: string }).id));
            return same ? s : [...s, view];
          })
        }
        onPop={() => setProfileStack((s) => s.slice(0, -1))}
        onClose={() => setProfileStack([])}
        restHidden={cardOpen || onbActive || messagesOpen}
        routeActive={routePersonId !== null}
        onOpenRoute={openRoute}
        onOpenPlan={openPlanFromProfile}
        onCreatePlan={() => {
          // "Create a plan" from the profile: close the profile entirely, then
          // grow the from-scratch composer out of the resting pill.
          setProfileStack([]);
          setCreateFrom("profile");
        }}
        friended={friended}
        onAddFriend={(id) => setFriended((prev) => new Set(prev).add(id))}
      />

      {/* The Messages flow: full-screen inbox + thread, morphing out of the
          map's chat button. Opened by the chat button or by "Enter groupchat"
          on a joined plan. */}
      <MessagesFlow
        stack={messagesStack}
        onPush={(view) => setMessagesStack((s) => [...s, view])}
        onPop={() => setMessagesStack((s) => s.slice(0, -1))}
        onClose={() => setMessagesStack([])}
      />

      {/* ---------- First-plan tour popups (screen-anchored beats) ---------- */}
      {/* Beat 1 — the welcome banner sliding from the top */}
      <AnimatePresence>
        {tour === "welcome" && (
          <TourBanner
            title="Welcome to your map"
            body="Everything nearby lives here — we spotted something you’ll like."
            onSkip={endTour}
          />
        )}
      </AnimatePresence>

      {/* Beat 3 — bubble over the Join plate while a peer card is on top */}
      <AnimatePresence>
        {tour === "join" && stackTop?.kind === "peer" && !confirmOpen && (
          <div
            style={{
              position: "absolute",
              // centred over the main (Join) plate: it spans x 48..270
              left: ACTIVITY_CTA.x + ACTIVITY_CTA.mainW / 2 - 115,
              bottom: device.height - ACTIVITY_CTA.y + 12,
              zIndex: 70,
            }}
          >
            <TourBubble
              width={230}
              text="Peer plans are free — one tap and you’re in"
              onSkip={endTour}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Beat 4 — the first-plan milestone card */}
      <AnimatePresence>
        {tour === "celebrate" && firstPlan && (
          <FirstPlanCard planTitle={firstPlan.title} />
        )}
      </AnimatePresence>

      {/* Beat 5 (the goodbye) — bubble pointing at the calendar button */}
      <AnimatePresence>
        {tour === "plans" && !cardOpen && (
          <div
            style={{
              position: "absolute",
              left: device.width - 64.2 - 232,
              bottom: device.height - CAL.y + 12,
              zIndex: 70,
            }}
          >
            <TourBubble
              width={232}
              tailX={197}
              text="Your plans live here — that’s the tour ✦"
              onSkip={endTour}
            />
          </div>
        )}
      </AnimatePresence>

      {/* First-run onboarding: the toy-city playground over everything.
          Completing it plays the jump — the flow's own zoom-through dives the
          toy world past the camera (OnboardingFlow handles its exit visuals)
          while the reveal dolly flies underneath. */}
      {onbActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 80,
            pointerEvents: onbExiting ? "none" : undefined,
          }}
        >
          <OnboardingFlow onComplete={finishOnboarding} exiting={onbExiting} />
        </div>
      )}
    </div>
  );
}
