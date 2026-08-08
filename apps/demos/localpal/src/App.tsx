import { useEffect, useRef, useState } from 'react';
import { PhoneFrame, FullScreenPhone } from './components/PhoneFrame';
import { CaptureButton } from './components/CaptureButton';
import { SquircleProvider } from './components/SquircleProvider';
import { MotionProvider } from './components/MotionProvider';
import { PinSizeProvider } from './components/PinSizeProvider';
import { MapDensityProvider } from './components/MapDensityProvider';
import { FloatShadowProvider } from './components/FloatShadowProvider';
import { AvatarClusterProvider } from './components/AvatarClusterProvider';
import { PlansProvider } from './components/PlansProvider';
import { MapHome } from './screens/MapHome';
import { Lab } from './screens/Lab';
import { DesignSystemWeb } from './screens/ds-web/DesignSystemWeb';
import { Landing } from './screens/Landing';
import { CaptureApp } from './screens/capture/CaptureApp';
import { useDeviceMode } from './hooks/useDeviceMode';
import { usePlansState } from './components/PlansProvider';
import { resolveIntent, type DemoIntent } from './demo/flows';
import { color, font } from './theme/tokens';

// The dev view (Map/Lab/DS Web toggles) is gated behind ?dev so the public
// URL only ever shows the polished Landing → prototype flow. The builder keeps
// full access at …/?dev on the live site.
const params = new URLSearchParams(window.location.search);
const isDev = params.has('dev');
// …/?ds is a stable deep-link straight into the design-system showcase, so it
// can be linked directly (e.g. from the memoir) without going through the
// landing. Exiting drops the param and returns to the normal entry.
const isDS = params.has('ds');
// …?capture — isolated recording stages for social clips of the app's
// micro-interactions (see screens/capture). Sits above ds/dev: it's a
// deliberate deep-link, never reachable from the public flow.
const isCapture = params.has('capture');
// …?embed[=intent] — portfolio iframe entry: straight into the prototype,
// scale-to-fit, no landing and no own bezel (the portfolio provides the device
// frame). Optional value picks a launch flow, e.g. ?embed=map.
const isEmbed = params.has('embed');
const embedIntentParam = params.get('embed');

function App() {
  const content = isCapture ? (
    <CaptureApp />
  ) : isEmbed ? (
    <EmbedApp />
  ) : isDS ? (
    <DesignSystemDeepLink />
  ) : isDev ? (
    <DevApp />
  ) : (
    <PublicApp />
  );
  return (
    <SquircleProvider>
      <MotionProvider>
        <PinSizeProvider>
          <MapDensityProvider>
          <FloatShadowProvider>
            <AvatarClusterProvider>
              <PlansProvider>{content}</PlansProvider>
            </AvatarClusterProvider>
          </FloatShadowProvider>
          </MapDensityProvider>
        </PinSizeProvider>
      </MotionProvider>
    </SquircleProvider>
  );
}

/* Portfolio-iframe entry — the prototype fills the frame via FullScreenPhone.
   Mirrors PublicApp's launch ordering: prime day-of state first, then mount
   MapHome, so intents like dayOfPlan find their plans already primed. */
const EMBED_INTENTS: DemoIntent[] = [
  'default',
  'onboarding',
  'dayOfPlan',
  'create',
  'profile',
  'messages',
  'map',
];

function EmbedApp() {
  const intent: DemoIntent = EMBED_INTENTS.includes(embedIntentParam as DemoIntent)
    ? (embedIntentParam as DemoIntent)
    : 'default';
  const cfg = resolveIntent(intent);
  const { setDayOf } = usePlansState();
  const [primed, setPrimed] = useState(false);

  useEffect(() => {
    setDayOf(cfg.dayOf);
    setPrimed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!primed) return null;

  return (
    <FullScreenPhone>
      <MapHome onboarding={cfg.onboarding} initialFlow={cfg.initialFlow} />
    </FullScreenPhone>
  );
}

/* Direct entry for …/?ds — renders the showcase full-screen. Exiting clears the
   query param so the user lands back on the public flow. */
function DesignSystemDeepLink() {
  const exit = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('ds');
    window.location.href = url.toString();
  };
  return <DesignSystemWeb onExit={exit} />;
}

/* ------------------------------------------------------------------ */
/* Public entry — what judges see: Landing → device-aware prototype.   */
/* ------------------------------------------------------------------ */

function PublicApp() {
  // `launch` is the active demo intent (null = still on the landing). Bumping
  // `runKey` remounts MapHome fresh so each launch replays cleanly.
  const [launch, setLaunch] = useState<DemoIntent | null>(null);
  const [showDS, setShowDS] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const { mode, setOverride } = useDeviceMode();
  const { setDayOf } = usePlansState();

  const startDemo = (intent: DemoIntent) => {
    // day-of mode lives in PlansProvider (which wraps the landing too), so set
    // it here before mounting the app; the rest resolves into MapHome props.
    setDayOf(resolveIntent(intent).dayOf);
    setRunKey((k) => k + 1);
    setLaunch(intent);
  };

  const backToIntro = () => {
    setDayOf(false); // reset the RSVP demo so it can be replayed
    setLaunch(null);
  };

  // The design system is a resolution-independent web showcase, not a phone
  // flow — it owns the whole screen (no device frame), like it does behind ?dev.
  if (showDS) {
    return <DesignSystemWeb onExit={() => setShowDS(false)} />;
  }

  if (launch === null) {
    return (
      <div style={{ width: '100vw', height: '100dvh' }}>
        <Landing device={mode} onLaunch={startDemo} onViewDesignSystem={() => setShowDS(true)} />
      </div>
    );
  }

  const cfg = resolveIntent(launch);
  const app = (
    <MapHome
      key={runKey}
      onboarding={cfg.onboarding}
      initialFlow={cfg.initialFlow}
    />
  );

  if (mode === 'mobile') {
    return <FullScreenPhone>{app}</FullScreenPhone>;
  }

  // Desktop: framed prototype centred on a dark stage, with a device override
  // and a way back to the landing page.
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap', // narrow window: buttons drop below, frame stays whole
        gap: 40,
        padding: 32,
        boxSizing: 'border-box',
        background: '#0b0b10',
      }}
    >
      <PhoneFrame>{app}</PhoneFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <PublicTextButton onClick={backToIntro}>← Back to intro</PublicTextButton>
        <PublicTextButton onClick={() => setOverride('mobile')}>View full-screen</PublicTextButton>
      </div>
    </div>
  );
}

function PublicTextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none',
        border: 'none',
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.75)',
        fontFamily: font.family,
        fontSize: 13,
        fontWeight: font.weight.medium,
        padding: '8px 14px',
        borderRadius: 12,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Dev view — the builder's tuning surface (unchanged), behind ?dev.   */
/* ------------------------------------------------------------------ */

type ScreenName = 'Map' | 'Lab' | 'DS Web' | 'Landing';
const NAMES: ScreenName[] = ['Map', 'Lab', 'DS Web', 'Landing'];

function DevApp() {
  const [screen, setScreen] = useState<ScreenName>('Map');
  // Lab → "Run onboarding": remounts MapHome (fresh session, bumped key) with
  // the first-run flow armed over it. The armed flag drops when the flow
  // completes — WITHOUT touching the key — so later Map visits don't replay it.
  const [onbKey, setOnbKey] = useState(0);
  const [onbArmed, setOnbArmed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const isPhoneScreen = screen === 'Map';

  const startOnboarding = () => {
    setOnbKey((k) => k + 1);
    setOnbArmed(true);
    setScreen('Map');
  };

  if (screen === 'DS Web') {
    return <DesignSystemWeb onExit={() => setScreen('Map')} />;
  }

  return (
    <div className="stage">
      {screen === 'Lab' ? (
        <Lab onStartOnboarding={startOnboarding} />
      ) : screen === 'Landing' ? (
        <div style={{ width: 900, height: 560, borderRadius: 24, overflow: 'hidden' }}>
          <Landing device="desktop" onLaunch={() => setScreen('Map')} />
        </div>
      ) : (
        <PhoneFrame ref={frameRef}>
          <MapHome key={onbKey} onboarding={onbArmed} onOnboardingDone={() => setOnbArmed(false)} />
        </PhoneFrame>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isPhoneScreen && <CaptureButton target={frameRef} />}
        {NAMES.map((name) => (
          <button
            key={name}
            onClick={() => setScreen(name)}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              color: screen === name ? '#fff' : '#bbb',
              background: screen === name ? color.brand : 'rgba(255,255,255,0.08)',
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
