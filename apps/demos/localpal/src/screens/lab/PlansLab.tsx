import { usePlansState } from "../../components/PlansProvider";
import { panel, chip } from "./ui";

/**
 * Lab → Plans: demo controls for the "Your plans" focused card. There's no
 * real clock logic in the prototype, so "day of the plan" is a toggle here;
 * the RSVP can be reset to replay the slide-to-RSVP flow.
 */
export function PlansLab() {
  const { dayOf, setDayOf, rsvped, setRsvped } = usePlansState();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        color: "#fff",
        width: "min(920px, 92vw)",
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: "#9aa0a8" }}>
        Demo state for the focused plan on the <b>Your plans</b> sheet (the
        calendar button on the Map screen). Day-of swaps the day/time plate for
        the slide-to-RSVP slider; sliding it reveals the “On their way” list and
        starts the live countdown.
      </p>

      <div
        style={{
          ...panel,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, marginRight: 6 }}>
          Focused plan
        </span>
        <button style={chip(!dayOf)} onClick={() => setDayOf(false)}>
          Normal (upcoming day)
        </button>
        <button style={chip(dayOf)} onClick={() => setDayOf(true)}>
          Day of the plan
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#9aa0a8" }}>
          RSVP: {dayOf ? (rsvped ? "confirmed" : "waiting for the slide") : "—"}
        </span>
        <button
          style={chip(false)}
          onClick={() => setRsvped(false)}
          disabled={!rsvped}
        >
          Reset RSVP
        </button>
      </div>
    </div>
  );
}
