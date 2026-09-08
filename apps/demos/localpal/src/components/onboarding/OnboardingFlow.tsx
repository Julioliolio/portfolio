/**
 * Onboarding — "The Playground". The first-run flow performs on a toy city
 * (ToyMap): a decorative, hand-drawn stage set in the brand's palette — NOT
 * the real map. Your profile visibly builds on it as you answer: your name
 * lands as a sticker, every picked interest drops a glyph sticker, the stage
 * nudges to a fresh pose each step. One question per screen (Duolingo
 * cadence), steps swapping in place on the shared hierarchical zoom
 * (layerZoomStyle):
 *
 *   welcome → sign-in (mock) → motivation → name → interests (bubbles)
 *     → verification (email mocked end-to-end; QR/ID tiles inert) → location
 *
 * Step bodies are floating white surfaces (FloatCard / white OptionPlates) in
 * the venue-lozenge language — objects hovering over the playground, not
 * screens painted over it. Persistent chrome mirrors the create-plan wizard:
 * step dots (top-centre, active dot stretches to a pill on `snap`) + a white
 * CTA footer whose label scrambles between states. Tap-steps (sign-in,
 * motivation, location) advance themselves — no footer.
 *
 * The memoir's rules, kept structural: verification is a skippable step
 * presented as reward, never a wall (§8.5); the flow's last act is the jump
 * to the REAL city: `exiting` dives the toy world past the camera
 * (zoom-through, theme/onboardingStage.ts) while MapHome flies the landing
 * dolly + guided first moment beneath. The surface never unmounts mid-flow.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Squircle } from "../Squircle";
import {
  useMotion,
  useMotionExtras,
  usePressFeedback,
} from "../MotionProvider";
import { useFloatShadow } from "../FloatShadowProvider";
import { useScramble } from "../useScramble";
import { layerZoom, layerZoomStyle } from "../../theme/motion";
import { color, device } from "../../theme/tokens";
import {
  capTrim,
  inputReset,
  textButtonReset as buttonReset,
} from "../../theme/resets";
import { INTEREST_MIN, type InterestId } from "../../theme/interests";
import {
  stagePalette,
  stagePoses,
  stagePoseMs,
  stageExit,
  CLUSTER,
  INTEREST_GLYPH,
} from "../../theme/onboardingStage";
import { InterestBubbles } from "./InterestBubbles";
import { FloatCard } from "./FloatCard";
import { ToyMap } from "./ToyMap";
import localpalLogo from "../../assets/onboarding/localpal-logo.svg";
import { GlyphSticker, ProfileBadge } from "./Stickers";
import { ThinkingTheater } from "../ThinkingTheater";
import { BackChevron } from "../icons/BackChevron";
import { CheckIcon } from "../icons/CheckIcon";
import { PersonIcon } from "../icons/PersonIcon";

export type OnboardingResult = { name: string; interests: InterestId[] };

const STEPS = [
  "welcome",
  "signin",
  "motivation",
  "name",
  "photo",
  "interests",
  "verify",
  "location",
] as const;
export type StepId = (typeof STEPS)[number];
/** Steps that get a dot (everything after the cold open). */
const DOT_STEPS = STEPS.slice(1);

const PAD_X = 28;
const COL_W = device.width - PAD_X * 2; // 337
const TITLE_TOP = 148;
const FOOTER_H = 64;
const FOOTER_BOTTOM = 48;
const DOT = 8;
const DOT_PILL = 24;
const DOT_GAP = 4;
const DOT_DIM = 0.35;

const MOTIVATIONS = [
  "Just landed — new in Madrid",
  "Here for a semester",
  "I live here",
  "Just looking around",
];

// Ink text sits straight on the paper city — a soft light halo lifts it off
// the street texture beneath.
const TEXT_HALO = `0 1px 10px rgba(${stagePalette.vignette},0.9)`;

/** Soft lift for white chrome floating directly over the map (plates, CTAs). */
const liftShadow = (c: string) =>
  `drop-shadow(0 1px 2px rgba(${c},0.1)) drop-shadow(0 3px 10px rgba(${c},0.12))`;

/* ------------------------------------------------------------------ */
/* Chrome                                                               */
/* ------------------------------------------------------------------ */

function StepDots({ active }: { active: number }) {
  const snap = useMotion("snap");
  return (
    <div
      style={{
        position: "absolute",
        top: 76,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: DOT_GAP,
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      {DOT_STEPS.map((id, i) => (
        <motion.div
          key={id}
          initial={false}
          animate={{
            width: i === active ? DOT_PILL : DOT,
            opacity: i <= active ? 1 : DOT_DIM,
          }}
          transition={snap}
          style={{ height: DOT }}
        >
          <Squircle
            role="stepDot"
            fill={color.brand}
            style={{ width: "100%", height: "100%" }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span
        style={{
          color: color.ink,
          fontSize: 32,
          fontWeight: 600,
          lineHeight: "34px",
          wordBreak: "break-word",
          textShadow: TEXT_HALO,
          ...capTrim,
        }}
      >
        {title}
      </span>
      {subtitle && (
        <span
          style={{
            color: color.muted,
            fontSize: 13,
            fontWeight: 400,
            lineHeight: "17px",
            textShadow: TEXT_HALO,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}

/** Full-screen step column under the dots. Footer-less steps that place
 *  their own CTAs (location) can reclaim the reserved footer band. */
function StepColumn({
  children,
  gap = 28,
  padBottom = FOOTER_BOTTOM + FOOTER_H + 24,
}: {
  children: ReactNode;
  gap?: number;
  padBottom?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap,
        paddingTop: TITLE_TOP,
        paddingLeft: PAD_X,
        paddingRight: PAD_X,
        paddingBottom: padBottom,
      }}
    >
      {children}
    </div>
  );
}

/** Staggered entrance for step content: each child pops in on the `entrance`
 *  role, one beat apart (the map-pin recipe), replaying every time its step
 *  becomes visible — hidden layers settle back to the tucked pose unseen. */
function StaggerIn({
  active,
  index,
  children,
}: {
  active: boolean;
  index: number;
  children: ReactNode;
}) {
  const entrance = useMotion("entrance");
  const { entranceStagger } = useMotionExtras();
  return (
    <motion.div
      initial={false}
      animate={
        active
          ? { scale: 1, y: 0, opacity: 1 }
          : { scale: 0.85, y: 14, opacity: 0 }
      }
      transition={
        active
          ? { ...entrance, delay: index * entranceStagger }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}

/** Floating white option plate over the map: sign-in doors, motivation
 *  answers, verify tiles. Selecting inverts it to brand — the answer lights
 *  up in the app's own color before the camera dives. `popped` gives the
 *  chosen answer a win-bump on `pop`; `faded` recedes the unchosen siblings
 *  on `snap` while the auto-advance beat plays. */
function OptionPlate({
  onTap,
  selected = false,
  dimmed = false,
  faded = false,
  popped = false,
  height = 60,
  children,
}: {
  onTap?: () => void;
  selected?: boolean;
  dimmed?: boolean;
  faded?: boolean;
  popped?: boolean;
  height?: number;
  children: ReactNode;
}) {
  const press = usePressFeedback();
  const snap = useMotion("snap");
  const pop = useMotion("pop");
  const shadow = useFloatShadow();
  return (
    <motion.button
      {...(onTap && !dimmed ? press : {})}
      onClick={dimmed ? undefined : onTap}
      initial={false}
      animate={{
        opacity: dimmed ? 0.55 : faded ? 0.3 : 1,
        scale: faded ? 0.96 : popped ? [1, 1.05, 1] : 1,
      }}
      transition={popped && !faded ? pop : snap}
      style={{
        ...buttonReset,
        width: "100%",
        flexShrink: 0,
        cursor: onTap && !dimmed ? "pointer" : "default",
        filter: liftShadow(shadow.color),
      }}
    >
      <Squircle
        role="plate"
        fill={selected ? color.brand : color.white}
        style={{
          width: "100%",
          height,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px",
          boxSizing: "border-box",
          transition: "background-color 0.2s ease",
        }}
      >
        {children}
      </Squircle>
    </motion.button>
  );
}

/* Little inline logos for the mock sign-in doors (vector, per CLAUDE.md). */
function AppleLogo({
  size = 18,
  fill = color.ink,
}: {
  size?: number;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      aria-hidden
      style={{ display: "block" }}
    >
      <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.94 3.6 2.89 1.44-.06 1.99-.93 3.73-.93s2.23.93 3.76.9c1.55-.03 2.53-1.41 3.48-2.8 1.1-1.61 1.55-3.17 1.57-3.25-.03-.02-3.01-1.16-3.02-4.6zM14.16 4.06c.8-.96 1.33-2.3 1.18-3.64-1.14.05-2.53.77-3.35 1.72-.74.85-1.38 2.21-1.21 3.52 1.28.1 2.58-.65 3.38-1.6z" />
    </svg>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45c-.28 1.5-1.12 2.77-2.4 3.62v3h3.88c2.27-2.1 3.57-5.18 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.1C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29v-3.1H1.28C.46 8.24 0 10.06 0 12s.46 3.76 1.28 5.39l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.61l4 3.1C6.22 6.87 8.87 4.76 12 4.76z"
      />
    </svg>
  );
}

function MailGlyph({
  size = 18,
  stroke = color.ink,
}: {
  size?: number;
  stroke?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: "block" }}
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function QrGlyph({
  size = 18,
  stroke = color.ink,
}: {
  size?: number;
  stroke?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: "block" }}
    >
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
      <path d="M14 14h3v3h-3zM20.5 14v.01M14 20.5h.01M17.5 20.5h3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Verification sub-flow                                                */
/* ------------------------------------------------------------------ */

type VerifyStage = "choose" | "email" | "code" | "done";
const CODE = "3121"; // of course it is

function VerifyStep({
  stage,
  onStage,
  email,
  onEmail,
}: {
  stage: VerifyStage;
  onStage: (s: VerifyStage) => void;
  email: string;
  onEmail: (v: string) => void;
}) {
  const press = usePressFeedback();
  const pop = useMotion("pop");
  const snap = useMotion("snap");
  const shadow = useFloatShadow();
  const [typed, setTyped] = useState("");

  // Code boxes auto-fill one digit at a beat — the fake network doing its
  // fake job — then hand over to the verified moment.
  useEffect(() => {
    if (stage !== "code") {
      setTyped("");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(CODE.slice(0, i));
      if (i >= CODE.length) {
        clearInterval(id);
        setTimeout(() => onStage("done"), 550);
      }
    }, 340);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const stageIdx: Record<VerifyStage, number> = {
    choose: 0,
    email: 1,
    code: 2,
    done: 3,
  };

  const layer = (s: VerifyStage, node: ReactNode) => (
    <div
      key={s}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: stage === s ? undefined : "none",
        ...layerZoomStyle(
          stage === s,
          stageIdx[s] < stageIdx[stage] ? "parent" : "child",
        ),
      }}
    >
      {node}
    </div>
  );

  return (
    <div style={{ position: "relative", flex: 1 }}>
      {layer(
        "choose",
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <OptionPlate height={72} onTap={() => onStage("email")}>
            <MailGlyph />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                flex: 1,
              }}
            >
              <span
                style={{
                  color: color.ink,
                  fontSize: 16,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                Uni email
              </span>
              <span
                style={{
                  color: color.muted,
                  fontSize: 12,
                  fontWeight: 400,
                  ...capTrim,
                }}
              >
                fastest — any student address
              </span>
            </div>
            <Squircle
              role="chip"
              fill="rgba(49,33,255,0.08)"
              style={{ padding: "6px 10px" }}
            >
              <span
                style={{
                  color: color.brand,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                recommended
              </span>
            </Squircle>
          </OptionPlate>
          <OptionPlate height={72} dimmed>
            <QrGlyph />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                flex: 1,
              }}
            >
              <span
                style={{
                  color: color.ink,
                  fontSize: 16,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                At an event
              </span>
              <span
                style={{
                  color: color.muted,
                  fontSize: 12,
                  fontWeight: 400,
                  ...capTrim,
                }}
              >
                scan the QR at a partner event
              </span>
            </div>
          </OptionPlate>
          <OptionPlate height={72} dimmed>
            <PersonIcon size={18} color={color.ink} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                flex: 1,
              }}
            >
              <span
                style={{
                  color: color.ink,
                  fontSize: 16,
                  fontWeight: 500,
                  ...capTrim,
                }}
              >
                ID document
              </span>
              <span
                style={{
                  color: color.muted,
                  fontSize: 12,
                  fontWeight: 400,
                  ...capTrim,
                }}
              >
                the classic, if you prefer
              </span>
            </div>
          </OptionPlate>
        </div>,
      )}

      {layer(
        "email",
        <FloatCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Squircle
              role="field"
              fill="rgba(49,33,255,0.06)"
              style={{
                width: "100%",
                height: 56,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 18px",
                boxSizing: "border-box",
              }}
            >
              <MailGlyph size={16} stroke={color.muted} />
              <input
                value={email}
                onChange={(e) => onEmail(e.target.value)}
                placeholder="name@uni.es"
                style={{
                  ...inputReset,
                  flex: 1,
                  minWidth: 0,
                  color: color.ink,
                  caretColor: color.brand,
                  fontSize: 16,
                  fontWeight: 400,
                }}
              />
            </Squircle>
            <motion.button
              {...press}
              onClick={() => email.trim() && onStage("code")}
              initial={false}
              animate={{ opacity: email.trim() ? 1 : 0.45 }}
              transition={snap}
              style={{ ...buttonReset, width: "100%" }}
            >
              <Squircle
                role="cta"
                fill={color.brand}
                style={{
                  width: "100%",
                  height: FOOTER_H,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span
                  style={{
                    color: color.onBrand,
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
                  Send code
                </span>
              </Squircle>
            </motion.button>
          </div>
        </FloatCard>,
      )}

      {layer(
        "code",
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span
            style={{
              color: color.muted,
              fontSize: 13,
              fontWeight: 400,
              textShadow: TEXT_HALO,
            }}
          >
            we sent a code to {email.trim() || "your inbox"}
          </span>
          <div
            style={{
              display: "flex",
              gap: 10,
              filter: liftShadow(shadow.color),
            }}
          >
            {Array.from({ length: CODE.length }, (_, i) => (
              <Squircle
                key={i}
                role="plate"
                fill={color.white}
                style={{
                  width: 60,
                  height: 68,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {typed[i] && (
                  <motion.span
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={pop}
                    style={{
                      color: color.brand,
                      fontSize: 28,
                      fontWeight: 600,
                    }}
                  >
                    {typed[i]}
                  </motion.span>
                )}
              </Squircle>
            ))}
          </div>
        </div>,
      )}

      {layer(
        "done",
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            paddingTop: 24,
          }}
        >
          {stage === "done" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={pop}
              style={{ filter: liftShadow(shadow.color) }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: color.white,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CheckIcon size={40} color={color.brand} strokeWidth={2.2} />
              </div>
            </motion.div>
          )}
          <span
            style={{
              color: color.ink,
              fontSize: 32,
              fontWeight: 600,
              textShadow: TEXT_HALO,
              ...capTrim,
            }}
          >
            You’re verified
          </span>
          <span
            style={{
              color: color.muted,
              fontSize: 13,
              fontWeight: 400,
              textAlign: "center",
              lineHeight: "17px",
              textShadow: TEXT_HALO,
            }}
          >
            joining plans and messaging are unlocked —{"\n"}people can trust
            you’re real
          </span>
        </div>,
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The flow                                                             */
/* ------------------------------------------------------------------ */

export function OnboardingFlow({
  onComplete,
  exiting = false,
}: {
  onComplete: (r: OnboardingResult) => void;
  /** MapHome sets this while the flow zooms through into the real map. */
  exiting?: boolean;
}) {
  const press = usePressFeedback();
  const snap = useMotion("snap");
  const entrance = useMotion("entrance");
  const float = useMotion("float");
  const shadow = useFloatShadow();
  const snapMs = ((snap as { duration?: number }).duration ?? 0.3) * 1000;

  const [step, setStep] = useState<StepId>("welcome");
  const [motivation, setMotivation] = useState<number | null>(null);
  const [name, setName] = useState("Pere");
  const [lastName, setLastName] = useState("Vicenç");
  const [interests, setInterests] = useState<Set<InterestId>>(new Set());
  const [interestOrder, setInterestOrder] = useState<InterestId[]>([]);
  const [verifyStage, setVerifyStage] = useState<VerifyStage>("choose");
  const [email, setEmail] = useState("");
  const finished = useRef(false);

  const stepIdx = STEPS.indexOf(step);
  const dotIdx = Math.max(0, stepIdx - 1);

  const finish = (skipped = false) => {
    if (finished.current) return;
    finished.current = true;
    onComplete({
      name: name.trim() || "Pere",
      interests: skipped ? [] : interestOrder,
    });
  };

  // Interests commit runs a short ThinkingTheater beat in the footer (the
  // mock-AI reading your picks while the matching pins light up on the map
  // below) before advancing — input is blocked for its ~1s.
  const [committing, setCommitting] = useState(false);

  const next = () => {
    if (step === "location") return finish();
    setStep(STEPS[stepIdx + 1]);
  };
  const back = () => {
    if (committing) return;
    // Inside the verify sub-flow, back walks the sub-stages first.
    if (step === "verify" && verifyStage !== "choose") {
      setVerifyStage(
        verifyStage === "done"
          ? "choose"
          : verifyStage === "code"
            ? "email"
            : "choose",
      );
      return;
    }
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
  };

  const toggleInterest = (id: InterestId) => {
    setInterests((prev) => {
      const nxt = new Set(prev);
      if (nxt.has(id)) nxt.delete(id);
      else nxt.add(id);
      return nxt;
    });
    setInterestOrder((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Tap-select then auto-advance a beat later — one question, one answer.
  // The chosen plate wins visibly (pop bump, siblings recede) while the beat
  // plays, so the answer lands before the camera dives.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );
  const pickMotivation = (i: number) => {
    setMotivation(i);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(next, 480);
  };

  // The sign-in doors ride the same beat: chosen door bumps, siblings recede.
  const [door, setDoor] = useState<number | null>(null);
  useEffect(() => {
    if (step !== "signin") setDoor(null); // replay clean if you walk back
  }, [step]);
  const pickDoor = (i: number) => {
    if (door !== null) return;
    setDoor(i);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(next, 480);
  };

  // Mock photo step: no camera, no picker — "take one" drops the app's
  // placeholder-grid avatar onto the cluster and rides the beat onward;
  // "skip" moves on with just the name tag.
  const [hasAvatar, setHasAvatar] = useState(false);
  const pickPhoto = (take: boolean) => {
    if (take) setHasAvatar(true);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(next, take ? 520 : 120);
  };

  // Footer: which steps show the main CTA, and what it says.
  const interestsLeft = INTEREST_MIN - interests.size;
  const footerLabel =
    step === "name"
      ? "Next"
      : step === "interests"
        ? interestsLeft > 0
          ? `Pick ${interestsLeft} more`
          : "Next"
        : step === "verify"
          ? verifyStage === "done"
            ? "Next"
            : "Skip for now"
          : "";
  const scrambledFooter = useScramble(footerLabel || " ", snapMs);
  const footerVisible = footerLabel !== "";
  const footerEnabled =
    step === "name"
      ? name.trim().length > 0
      : step === "interests"
        ? interestsLeft <= 0
        : verifyStage === "choose" || verifyStage === "done";
  const footerAction = () => {
    if (!footerEnabled || committing) return;
    if (step === "interests") {
      // Commit the picks: the theater narrates a beat over the stickers
      // already dropped on the playground, then hands over.
      setCommitting(true);
      return;
    }
    next();
  };

  /* ---- steps ---- */

  const layers: Array<{ id: StepId; node: ReactNode }> = [
    {
      id: "welcome",
      node: (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxSizing: "border-box",
            padding: `0 ${PAD_X}px ${FOOTER_BOTTOM}px`,
          }}
        >
          <div style={{ flex: 0.45 }} />
          {/* the logo plates (shadow baked into the artwork, like the mock),
              riding the shared idle bob on FloatCard's clock */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={entrance}
          >
            <img
              src={localpalLogo}
              alt="LocalPal"
              style={{
                width: 195,
                display: "block",
                animation: `lp-onb-bob ${((float as { duration?: number }).duration ?? 1) * 2}s ease-in-out infinite`,
                willChange: "transform",
              }}
            />
          </motion.div>
          <div style={{ flex: 1.55 }} />
          <motion.button
            {...press}
            onClick={next}
            style={{
              ...buttonReset,
              width: "100%",
              filter: liftShadow(shadow.color),
            }}
          >
            <Squircle
              role="cta"
              fill={color.brand}
              style={{
                width: "100%",
                height: FOOTER_H,
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{ color: color.onBrand, fontSize: 24, fontWeight: 600 }}
              >
                Get started
              </span>
            </Squircle>
          </motion.button>
          <motion.button
            {...press}
            onClick={() => finish(true)}
            style={{ ...buttonReset, marginTop: 18 }}
          >
            <span
              style={{
                color: color.muted,
                fontSize: 12,
                fontWeight: 500,
                textShadow: TEXT_HALO,
                ...capTrim,
              }}
            >
              skip the intro
            </span>
          </motion.button>
        </div>
      ),
    },
    {
      id: "signin",
      node: (
        <StepColumn>
          <StepTitle
            title="Come on in"
            subtitle="this is a prototype — any door works"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Continue with Apple", icon: <AppleLogo /> },
              { label: "Continue with Google", icon: <GoogleLogo /> },
              { label: "Continue with email", icon: <MailGlyph /> },
            ].map((d, i) => (
              <StaggerIn key={d.label} active={step === "signin"} index={i}>
                <OptionPlate
                  onTap={() => pickDoor(i)}
                  popped={door === i}
                  faded={door !== null && door !== i}
                >
                  {d.icon}
                  <span
                    style={{
                      color: color.ink,
                      fontSize: 16,
                      fontWeight: 500,
                      ...capTrim,
                    }}
                  >
                    {d.label}
                  </span>
                </OptionPlate>
              </StaggerIn>
            ))}
          </div>
        </StepColumn>
      ),
    },
    {
      id: "motivation",
      node: (
        <StepColumn>
          <StepTitle
            title="What brings you here?"
            subtitle="so we know what to show first"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOTIVATIONS.map((m, i) => (
              <StaggerIn key={m} active={step === "motivation"} index={i}>
                <OptionPlate
                  selected={motivation === i}
                  popped={motivation === i}
                  faded={motivation !== null && motivation !== i}
                  onTap={() => pickMotivation(i)}
                >
                  <span
                    style={{
                      color: motivation === i ? color.onBrand : color.ink,
                      fontSize: 16,
                      fontWeight: 500,
                      transition: "color 0.2s ease",
                      ...capTrim,
                    }}
                  >
                    {m}
                  </span>
                </OptionPlate>
              </StaggerIn>
            ))}
          </div>
        </StepColumn>
      ),
    },
    {
      id: "name",
      node: (
        <StepColumn>
          <StepTitle
            title="What should people call you?"
            subtitle="it shows on the plans you join"
          />
          <StaggerIn active={step === "name"} index={0}>
            <FloatCard pad={24}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    placeholder="first name…"
                    style={{
                      ...inputReset,
                      width: "100%",
                      color: color.ink,
                      caretColor: color.brand,
                      fontSize: 28,
                      fontWeight: 500,
                      lineHeight: "32px",
                    }}
                  />
                  <div
                    style={{
                      height: 1,
                      width: "100%",
                      background: "rgba(49,33,255,0.25)",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={24}
                    placeholder="last name…"
                    style={{
                      ...inputReset,
                      width: "100%",
                      color: color.ink,
                      caretColor: color.brand,
                      fontSize: 22,
                      fontWeight: 400,
                      lineHeight: "26px",
                    }}
                  />
                  <div
                    style={{
                      height: 1,
                      width: "100%",
                      background: "rgba(49,33,255,0.25)",
                    }}
                  />
                </div>
              </div>
            </FloatCard>
          </StaggerIn>
        </StepColumn>
      ),
    },
    {
      id: "photo",
      node: (
        <StepColumn gap={22}>
          <StepTitle
            title="Put a face on the map"
            subtitle="plans go better when people know who's coming"
          />
          <StaggerIn active={step === "photo"} index={0}>
            <OptionPlate
              height={72}
              onTap={() => pickPhoto(true)}
              popped={hasAvatar && step === "photo"}
            >
              <PersonIcon size={18} color={color.ink} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    color: color.ink,
                    fontSize: 16,
                    fontWeight: 500,
                    ...capTrim,
                  }}
                >
                  Take a photo
                </span>
                <span
                  style={{
                    color: color.muted,
                    fontSize: 12,
                    fontWeight: 400,
                    ...capTrim,
                  }}
                >
                  this is a prototype — you get the placeholder
                </span>
              </div>
            </OptionPlate>
          </StaggerIn>
          <StaggerIn active={step === "photo"} index={1}>
            <motion.button
              {...press}
              onClick={() => pickPhoto(false)}
              style={{ ...buttonReset, alignSelf: "center" }}
            >
              <span
                style={{
                  color: color.muted,
                  fontSize: 12,
                  fontWeight: 500,
                  textShadow: TEXT_HALO,
                  ...capTrim,
                }}
              >
                skip for now
              </span>
            </motion.button>
          </StaggerIn>
        </StepColumn>
      ),
    },
    {
      id: "interests",
      node: (
        <StepColumn gap={16}>
          <StepTitle
            title="What are you into?"
            subtitle={`pick at least ${INTEREST_MIN} — they shape your map`}
          />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <InterestBubbles
              active={step === "interests"}
              selected={interests}
              onToggle={toggleInterest}
            />
          </div>
        </StepColumn>
      ),
    },
    {
      id: "verify",
      node: (
        <StepColumn gap={22}>
          <StepTitle
            title="Get verified"
            subtitle="one signal that you're a real person — the social side of LocalPal opens up to verified people"
          />
          <VerifyStep
            stage={verifyStage}
            onStage={setVerifyStage}
            email={email}
            onEmail={setEmail}
          />
        </StepColumn>
      ),
    },
    {
      id: "location",
      node: (
        <StepColumn gap={24} padBottom={FOOTER_BOTTOM + 12}>
          <StepTitle title="LocalPal is a map" />
          <StaggerIn active={step === "location"} index={0}>
            <FloatCard pad={22}>
              <span
                style={{
                  color: color.ink,
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: "21px",
                  display: "block",
                }}
              >
                Everything here — venues, plans, people — lives on a map of your
                city. Your profile is packed; time to drop it on the real one.
                To show you what’s around, it needs to know where you are.
              </span>
            </FloatCard>
          </StaggerIn>
          {/* the real blue dot is on the map below — the descent nearly landed on it */}
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <motion.button
              {...press}
              onClick={() => finish()}
              style={{
                ...buttonReset,
                width: "100%",
                filter: liftShadow(shadow.color),
              }}
            >
              <Squircle
                role="cta"
                fill={color.brand}
                style={{
                  width: "100%",
                  height: FOOTER_H,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span
                  style={{
                    color: color.onBrand,
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
                  Allow location
                </span>
              </Squircle>
            </motion.button>
            <motion.button
              {...press}
              onClick={() => finish()}
              style={{ ...buttonReset }}
            >
              <span
                style={{
                  color: color.muted,
                  fontSize: 12,
                  fontWeight: 500,
                  textShadow: TEXT_HALO,
                  ...capTrim,
                }}
              >
                not now
              </span>
            </motion.button>
          </div>
        </StepColumn>
      ),
    },
  ];

  // The profile collage drifts with the city's pose (translation only — your
  // profile keeps a constant, legible size wherever the stage wanders) and
  // dives with it on the exit zoom-through. All wall-clock CSS.
  const pose = stagePoses[step];
  const stageLayer: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    transformOrigin: "50% 50%",
    transform: exiting
      ? `scale(${stageExit.scale})`
      : `translate(${pose.x}px, ${pose.y}px)`,
    opacity: exiting ? 0 : 1,
    transition: exiting
      ? `transform ${stageExit.ms}ms ${stageExit.ease}, opacity ${stageExit.ms}ms ${stageExit.ease}`
      : `transform ${stagePoseMs}ms ${layerZoom.ease}`,
  };
  // The profile collage: freshest picks keep the cluster a cute pile, never
  // a wall. Slots are claimed by position in the visible window; a reshuffle
  // (deselecting an early pick) glides survivors to their new spot on `snap`.
  const visiblePicks = interestOrder.slice(-CLUSTER.max);
  const avatarLanded = hasAvatar && stepIdx >= STEPS.indexOf("photo");
  const snapT = snap;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* The shared idle bob for everything floating on the playground —
          a compositor-driven CSS keyframe (zero main-thread work per frame);
          FloatCard + the sticker collage all ride it with phase offsets. */}
      <style>{`@keyframes lp-onb-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }`}</style>

      {/* The stage set — a toy city, not the real map. */}
      <ToyMap step={step} exiting={exiting} />

      {/* The profile, building in real time in the middle of the playground:
          boxed name plates → placeholder-grid avatar (the profile-page
          construction) → interest glyph stickers collaging around it. */}
      <div style={stageLayer}>
        <div
          style={{
            position: "absolute",
            left: CLUSTER.center.x,
            top: CLUSTER.center.y,
            width: 0,
            height: 0,
          }}
        >
          <AnimatePresence>
            {visiblePicks.map((id, i) => {
              const slot = CLUSTER.slots[i % CLUSTER.slots.length];
              return (
                <motion.div
                  key={id}
                  initial={false}
                  animate={{ x: slot.dx, y: slot.dy }}
                  transition={snapT}
                  style={{ position: "absolute", left: 0, top: 0 }}
                >
                  <div style={{ transform: "translate(-50%, -50%)" }}>
                    <GlyphSticker icon={INTEREST_GLYPH[id]} rot={slot.rot} />
                  </div>
                </motion.div>
              );
            })}
            {stepIdx >= STEPS.indexOf("name") && name.trim() !== "" && (
              <div
                key="profile"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <ProfileBadge
                  name={name.trim()}
                  lastName={lastName.trim()}
                  hasAvatar={avatarLanded}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Step content + chrome: zooms away as a 'parent' layer on exit while
          the stage beneath plays the longer zoom-through dive. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...layerZoomStyle(!exiting, "parent"),
        }}
      >
        {step !== "welcome" && <StepDots active={dotIdx} />}

        {/* back chevron — top-left, walks sub-stages before steps */}
        {step !== "welcome" && (
          <motion.button
            {...press}
            aria-label="Back"
            onClick={back}
            style={{
              ...buttonReset,
              position: "absolute",
              top: 62,
              left: 16,
              zIndex: 4,
            }}
          >
            <Squircle
              role="control"
              fill={color.white}
              style={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                filter: liftShadow(shadow.color),
              }}
            >
              <BackChevron height={15} color={color.ink} />
            </Squircle>
          </motion.button>
        )}

        {layers.map(({ id, node }, i) => {
          const visible = id === step;
          const hiddenAs = i < stepIdx ? "parent" : "child";
          return (
            <div
              key={id}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: visible ? undefined : "none",
                ...layerZoomStyle(visible, hiddenAs),
              }}
            >
              {node}
            </div>
          );
        })}

        {/* persistent footer CTA (name / interests / verify). While the
          interests commit "thinks", the button inverts to brand and hosts the
          ThinkingTheater — the mock-AI narrating while pins pop in below. */}
        {footerVisible && (
          <div
            style={{
              position: "absolute",
              left: PAD_X,
              bottom: FOOTER_BOTTOM,
              width: COL_W,
              height: FOOTER_H,
              zIndex: 3,
            }}
          >
            <motion.button
              {...(committing ? {} : press)}
              onClick={footerAction}
              initial={false}
              animate={{ opacity: footerEnabled ? 1 : 0.45 }}
              transition={snap}
              style={{
                ...buttonReset,
                width: "100%",
                cursor: footerEnabled && !committing ? "pointer" : "default",
                pointerEvents: committing ? "none" : undefined,
                filter: liftShadow(shadow.color),
              }}
            >
              <Squircle
                role="cta"
                fill={color.brand}
                style={{
                  width: "100%",
                  height: FOOTER_H,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {committing ? (
                  <ThinkingTheater
                    lines={[
                      "Reading your vibe…",
                      "Scanning Madrid…",
                      "Packing your map…",
                    ]}
                    onDone={() => {
                      setCommitting(false);
                      next();
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: color.onBrand,
                      fontSize: 24,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {scrambledFooter}
                  </span>
                )}
              </Squircle>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
