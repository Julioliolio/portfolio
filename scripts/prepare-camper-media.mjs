/**
 * Camper's page media, cut from the film's 1080p master
 * (docs/media-plan.md): the cast as short loops, one per person; the
 * shoes up close; and the still and the shot for "board → still → shot".
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

// The shoe, close: [name, start, crop w:h:x:y].
const SHOES = [
  ["velcro", 1.0, "1000:750:560:330"],
  ["heels", 7.9, "600:450:530:630"],
  ["reader", 23.6, "900:675:270:405"],
  ["sofa", 39.0, "700:525:800:150"],
  ["beach", 47.4, "1200:900:450:180"],
  ["step", 51.2, "640:480:40:450"],
];

const made = [];
for (const [name, start] of CAST)
  made.push(await loopClip({ src: SRC, start, dur: 2.8, width: 768, out: `${OUT}cast-${name}.mp4` }));
for (const [name, start, crop] of SHOES)
  made.push(await loopClip({ src: SRC, start, dur: 2.8, crop, width: 600, out: `${OUT}shoe-${name}.mp4` }));
made.push(await loopClip({ src: SRC, start: 47.0, dur: 3.6, width: 1280, out: `${OUT}shot-beach.mp4` }));
made.push(await still({ src: SRC, at: 49.0, width: 1280, out: `${OUT}still-beach.webp` }));

for (const p of made) console.log(`${kb(p).toString().padStart(5)} KB  ${p.slice(OUT.length)}`);
