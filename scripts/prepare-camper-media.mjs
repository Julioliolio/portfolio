/**
 * Camper's page media, cut from the film's 1080p master
 * (docs/media-plan.md): the cast as short loops, one per person; the
 * still and the shot for "board → still → shot", on a moment the shot
 * visibly moves (a hand reaching down to press the velcro shut); and a keeper still for the
 * choosing, of someone the cast grid doesn't show.
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
  ["heels", 7.9],
  ["broom", 11.2],
  ["reader", 23.6],
  ["sofa", 39.0],
  ["beach", 47.2],
  ["step", 51.0],
];


const made = [];
for (const [name, start] of CAST)
  made.push(await loopClip({ src: SRC, start, dur: 2.8, width: 768, out: `${OUT}cast-${name}.mp4` }));
made.push(await loopClip({ src: SRC, start: 0.3, dur: 3.6, fade: 0.4, width: 1280, out: `${OUT}shot-velcro.mp4` }));
made.push(await still({ src: SRC, at: 0.4, width: 1280, out: `${OUT}still-velcro.webp` }));
made.push(await still({ src: SRC, at: 28.6, width: 1280, out: `${OUT}still-ledge.webp` }));

for (const p of made) console.log(`${kb(p).toString().padStart(5)} KB  ${p.slice(OUT.length)}`);
