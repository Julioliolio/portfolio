/**
 * Map pin tile size — shared by VenuePin and PeerPin on the Map screen (both
 * pin types render at the same size). Tunable live from the Lab → Squircles
 * tab; paste the tuned value back here to persist.
 */
export const defaultPinSize = 28;

/**
 * Pin-focus radius, in metres — tapping a pin flies the map in until roughly
 * this radius (pin → nearest screen edge) fills the view, isolating the pin
 * from its neighbours. Tunable live from the Lab → Squircles tab; paste the
 * tuned value back here to persist.
 */
export const defaultFocusRadiusM = 300;

/**
 * Center-focus (Snap-Map style): as you pan the map, the single full-tile pin
 * nearest the viewport centre is gently emphasised — it scales up a touch and
 * holds that size while it stays centred, shrinking back once another pin takes
 * over (or none is close enough). Purely passive/visual; tap still opens.
 *
 * `Scale` = how much bigger the centred pin gets (subtle by design).
 * `Zone`  = the central catch radius, as a fraction of the shorter viewport
 *           side; a pin only focuses once it's inside this radius of centre, so
 *           panning through empty map emphasises nothing.
 * Both tunable live from the Lab → Squircles tab; paste tuned values back here.
 */
export const defaultCenterFocusScale = 1.5;
export const defaultCenterFocusZone = 0.2;
