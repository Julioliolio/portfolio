/**
 * Live state for the "Your plans" focused card — whether today is the day of
 * the next plan (demo toggle, Lab → Plans) and whether the user has RSVP'd.
 *
 * `dayOf` swaps the focused card's white day/time plate for the slide-to-RSVP
 * slider; completing the slide sets `rsvped`, which reveals the "On their way"
 * list and starts the live countdown (target = now + countdownMinutes when
 * day-of mode turns on). Toggling day-of off resets the RSVP so the demo can
 * be replayed.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FOCUSED_META } from "../data/myPlans";
import type { PeerPlan } from "../data/peerPlans";

/** A plan minted by the create-plan flow: the peer plan itself plus its map
 *  pin coords and the badge fields the "Your plans" rows render. */
export type CreatedPlan = {
  plan: PeerPlan;
  lng: number;
  lat: number;
  /** Badge day tag ("MON") + time ("18:30") for the Next-up row. */
  dayTag: string;
  time: string;
  meta: string;
};

type PlansState = {
  dayOf: boolean;
  setDayOf: (v: boolean) => void;
  rsvped: boolean;
  setRsvped: (v: boolean) => void;
  /** Epoch ms the focused plan "starts" at (null when not day-of). */
  target: number | null;
  /** Plans created through the create-plan flow this session. */
  createdPlans: CreatedPlan[];
  addCreatedPlan: (p: CreatedPlan) => void;
};

const Ctx = createContext<PlansState | null>(null);

export function PlansProvider({ children }: { children: ReactNode }) {
  const [dayOf, setDayOf] = useState(false);
  const [rsvped, setRsvped] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const [createdPlans, setCreatedPlans] = useState<CreatedPlan[]>([]);

  // Entering day-of mode anchors the countdown; leaving it resets the demo.
  useEffect(() => {
    if (dayOf) {
      setTarget(Date.now() + FOCUSED_META.countdownMinutes * 60_000);
    } else {
      setTarget(null);
      setRsvped(false);
    }
  }, [dayOf]);

  const value = useMemo(
    () => ({
      dayOf,
      setDayOf,
      rsvped,
      setRsvped,
      target,
      createdPlans,
      addCreatedPlan: (p: CreatedPlan) =>
        setCreatedPlans((prev) => [p, ...prev]),
    }),
    [dayOf, rsvped, target, createdPlans],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlansState(): PlansState {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlansState outside PlansProvider");
  return v;
}

/** "2:34h left!" — live remaining time to the plan start. */
export function formatCountdown(target: number, now: number): string {
  const mins = Math.max(0, Math.round((target - now) / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")}h left!`;
}
