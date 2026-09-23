import type { Place, SoundName } from "./sound";

/**
 * The site's sounds, fetched on demand. The synth (sound.tsx) is a chunk
 * of its own: the landing has it already, and a work page (/work/<slug>,
 * the film player, the contents) sits at the JS budget without it
 * (scripts/check-budget.mjs). A sound asked for before the chunk is in
 * plays as soon as it is; `loadSounds()` fetches it ahead of the first
 * click.
 */
export const loadSounds = () => import("./sound");

export function playLater(name: SoundName, level: number, at: Place) {
  void loadSounds().then((m) => m.play(name, level, { at }));
}
