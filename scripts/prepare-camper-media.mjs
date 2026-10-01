/**
 * Camper's page media, cut from the film's 1080p master
 * (docs/media-plan.md): the cast as short loops, one per person; the
 * still and the shot for "board → still → shot", on a moment the shot
 * visibly moves (the arcade walk); and a keeper still for the choosing.
 * Times are the film's, between its cuts (scene changes at 4.7, 7.6,
 * 10.5, 15.0, 18.9, 23.1, 27.4, 30.2, 33.1, 35.9, 38.8, 41.6, 46.9, 50.7,
 * 54.6 s); crops are in the master's pixels.
 *
 *   node scripts/prepare-camper-media.mjs [path/to/master.mp4]
 *
 * The master is not in the repo; it defaults to where Julio keeps it.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { kb, loopClip, still } from "./lib/media.mjs";

const SRC =
  process.argv[2] ??
  join(homedir(), "Downloads/_organized/2894_/Campers/video campers.mp4");
const OUT = new URL("../apps/web/public/media/camper/", import.meta.url).pathname;

// One person each, in the film's order.
const CAST = [
  ["velcro", 1.0],
  ["heels", 7.9],
  ["broom", 11.2],
  ["reader", 23.6],
  ["market", 30.5],
  ["kitchen", 36.2],
  ["sofa", 39.0],
  ["arcade", 42.4],
  ["step", 51.0],
];


const made = [];
for (const [name, start] of CAST)
  made.push(await loopClip({ src: SRC, start, dur: 2.8, width: 768, out: `${OUT}cast-${name}.mp4` }));
made.push(await loopClip({ src: SRC, start: 41.7, dur: 4.8, fade: 0.5, width: 1280, out: `${OUT}shot-arcade.mp4` }));
made.push(await still({ src: SRC, at: 42.0, width: 1280, out: `${OUT}still-arcade.webp` }));
made.push(await still({ src: SRC, at: 25.0, width: 1280, out: `${OUT}still-reader.webp` }));

for (const p of made) console.log(`${kb(p).toString().padStart(5)} KB  ${p.slice(OUT.length)}`);
