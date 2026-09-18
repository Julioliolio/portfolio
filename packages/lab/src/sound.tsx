"use client";

import {
  useEffect,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createTuningStore } from "./tuning-store";

/**
 * The site's sounds — every one synthesized in Web Audio, no files. The
 * language is physical, to match the stop motion: a wooden tick on each
 * photo cut, a cardboard tap when the pointer lands on a sign, a paper
 * slide when a card comes out, a solid knock on the clicks that go
 * somewhere. And, apart from those, a felt piano: every letter of the
 * greeting is a note of it as it stamps under the pointer, and a bed of
 * it plays under the pointer on its own slow clock (`useBed`) — the
 * greeting asks for it while hovered, and lets go when the pointer
 * leaves.
 * Both are B major pentatonic, the letters from B3 up, the bed from B2,
 * ringing into a small synthesized room, so whatever the pointer does
 * the notes agree.
 *
 * Pieces call `play(name)` at their cut/hover/click points and never
 * think about audio state. Nothing sounds until the browser allows it —
 * an AudioContext only starts inside a user gesture, so the first
 * pointerdown or keydown anywhere unlocks it (`arm`), and until then
 * every play is a no-op. The context is made at mount all the same
 * (`prime`): a browser that already trusts the site (Chrome does after
 * one click on the domain in the tab) starts it right away, and the
 * hovers sound from the first one. Otherwise the silence before the
 * first click is the price of the autoplay policy; jrands.com pays it.
 *
 * Two stores: the tuning (levels and pitch, with a slider row in the
 * pieces' bench panels — a tuning store like the motion one) and the
 * mute switch, which <SoundToggle> flips. The mute holds for the visit
 * only: every page load starts with sound on. Tuning changes apply
 * live — one-shots read the store when they fire.
 */

// ------------------------------------------------------------ the tuning

export type SoundTuning = {
  /** Everything's level, 0..1. */
  master: number;
  /** Pitch multiplier on every one-shot: 0.5 = an octave down. */
  pitch: number;
  /** The tick on a photo cut (cartel walk and spin). */
  cut: number;
  /** The cardboard tap when the pointer lands on a road sign. */
  tap: number;
  /** The wooden knock: spin launch and landing, clicks that navigate. */
  knock: number;
  /** The paper slide when a project card comes out or goes back. */
  slide: number;
  /** The greeting's letters, one piano note each as they stamp under
   *  the pointer. */
  letter: number;
  /** How long a letter's note rings, s. The bed's ring 2.5× this. */
  ring: number;
  /** Least ms between two main notes — the letter under the pointer.
   *  Letters that stamp within it sound as company instead. */
  gap: number;
  /** The company's level, as a share of the main note: the letters
   *  around the one under the pointer, and the ones a fast sweep
   *  crosses inside the gap. 0 and only the main notes sound. */
  company: number;
  /** How often the melody leaps and adds a grace note, and the company
   *  takes a second instead of a third or a fifth. 0 is all steps. */
  whimsy: number;
  /** The room the notes ring into: how much of the tail is heard. */
  room: number;
  /** The bed's level, where a page asks for the bed. */
  bed: number;
  /** The bed's pace: the mean wait between its notes, s. */
  pace: number;
  /** Where the one-shots play, each a level of its own on top of the
   *  voice's — so the cue's tap and a sign's tap can differ. */
  cue: number;
  sign: number;
  card: number;
  word: number;
  walk: number;
  spin: number;
  click: number;
};

/** A place a one-shot plays from, for its own level. */
export type Place =
  "cue" | "sign" | "card" | "word" | "walk" | "spin" | "click";

// Julio's numbers off /lab/sound, 2026-09-17: the letters quiet under the
// sign's ticks with their company barely there, and a good deal of room
// around them.
const SOUND_DEFAULTS: Readonly<SoundTuning> = Object.freeze({
  master: 0.6,
  pitch: 1,
  cut: 0.35,
  tap: 0.4,
  knock: 0.6,
  slide: 0.5,
  letter: 0.15,
  ring: 1,
  gap: 120,
  company: 0.1,
  whimsy: 0.35,
  room: 0.7,
  bed: 0.25,
  pace: 2,
  cue: 1,
  sign: 1,
  card: 1,
  word: 0.6,
  walk: 1,
  spin: 1,
  click: 1,
});

/** One row per tuning key, for the pieces' bench panels. */
export const SOUND_FIELDS: {
  key: keyof SoundTuning;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  {
    key: "master",
    label: "Level",
    hint: "Everything's volume. The mute toggle is separate.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "pitch",
    label: "Pitch",
    hint: "Multiplier on every one-shot. 0.5 is an octave down.",
    min: 0.5,
    max: 2,
    step: 0.05,
    unit: "×",
  },
  {
    key: "cut",
    label: "Cut",
    hint: "The wooden tick on each photo cut of the cartel.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "tap",
    label: "Tap",
    hint: "The cardboard tap when the pointer lands on a road sign.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "knock",
    label: "Knock",
    hint: "Spin launch and landing, and the clicks that go somewhere.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "slide",
    label: "Slide",
    hint: "The paper slide of a project card coming out or going back.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "letter",
    label: "Letter",
    hint: "The greeting's letters, one piano note each as they stamp under the pointer.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "ring",
    label: "Ring",
    hint: "How long a letter's note rings. The bed's notes ring 2.5× this.",
    min: 0.2,
    max: 4,
    step: 0.1,
    unit: "s",
  },
  {
    key: "gap",
    label: "Gap",
    hint: "Least time between two main notes. Letters that stamp inside it sound as company instead.",
    min: 0,
    max: 400,
    step: 10,
    unit: "ms",
  },
  {
    key: "company",
    label: "Company",
    hint: "The level of the letters around the one under the pointer, as a share of the main note. 0 and only the main notes sound.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "whimsy",
    label: "Whimsy",
    hint: "How often the melody leaps or adds a grace note, and the company takes a second instead of a third or a fifth. 0 is all steps.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "room",
    label: "Room",
    hint: "The room the notes ring into: how much of the tail is heard.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "bed",
    label: "Bed",
    hint: "The bed's level: a slow low line that plays while the pointer is over the greeting's words.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "pace",
    label: "Pace",
    hint: "The bed's mean wait between notes; each wait is between half and one and a half of it.",
    min: 0.5,
    max: 6,
    step: 0.1,
    unit: "s",
  },
  {
    key: "cue",
    label: "Cue hover",
    hint: "The scroll cue's tap as its ring opens under the pointer, and the softer one as it shuts.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "sign",
    label: "Sign hover",
    hint: "The tap as the pointer lands on a road sign.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "card",
    label: "Card",
    hint: "The paper slide as a project card comes out, and back.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "word",
    label: "Words landing",
    hint: "The tap as each word of the greeting lands on its entrance.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "walk",
    label: "Cartel walk",
    hint: "The tick on each photo cut as the sign turns toward the pointer.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "spin",
    label: "Spin",
    hint: "The sign's click spin: the knock of the launch, the ticks in the air, the softer knock of the landing.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
  {
    key: "click",
    label: "Clicks",
    hint: "The knock on the clicks that go somewhere: the cue, a sign, a card.",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
  },
];

const store = createTuningStore("sound-tuning", SOUND_DEFAULTS);

/** Lays `patch` over the current values and tells every subscriber. */
export const setSoundTuning = store.set;
export const resetSoundTuning = store.reset;
export const getSoundTuning = store.get;

// ------------------------------------------------------------- the mute

// A module variable and nothing more: the switch holds across the
// client-side navigations of one visit and is forgotten on the next
// load, so every arrival at the site starts with sound on.
let muted = false;
const muteListeners = new Set<() => void>();

function setMuted(next: boolean) {
  muted = next;
  for (const fn of muteListeners) fn();
}

function subscribeMuted(fn: () => void): () => void {
  muteListeners.add(fn);
  return () => {
    muteListeners.delete(fn);
  };
}

/** The live tuning, re-rendering the caller on every change. */
export const useSoundTuning: () => SoundTuning = store.useTuning;

/** The mute switch, re-rendering the caller when it flips. */
function useMuted(): boolean {
  return useSyncExternalStore(
    subscribeMuted,
    () => muted,
    () => false,
  );
}

// ------------------------------------------------------------- the engine

type Engine = {
  ac: AudioContext;
  master: GainNode;
  /** Two seconds of white noise, sliced by every percussive one-shot. */
  noise: AudioBuffer;
  /** The room's send: what the notes put in here comes back as a tail,
   *  at the tuning's `room`. */
  room: GainNode;
};

let engine: Engine | null = null;
let armed = false;

function makeNoise(ac: AudioContext): AudioBuffer {
  const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** The room's tail, for its convolver: `seconds` of noise dying away,
 *  darker as it goes (a one-pole low-pass on the noise, and the decay
 *  itself), two channels that share nothing so the tail has width.
 *  Scaled to unit energy, so the send's gain is the wet level. */
function makeTail(ac: AudioContext, seconds: number): AudioBuffer {
  const n = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    let lp = 0;
    let energy = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      lp += (Math.random() * 2 - 1 - lp) * 0.22;
      const v = lp * (1 - t) ** 1.5 * Math.exp(-2.5 * t);
      data[i] = v;
      energy += v * v;
    }
    const k = 1 / Math.sqrt(energy || 1);
    for (let i = 0; i < n; i++) (data[i] as number) *= k;
  }
  return buffer;
}

/** Creates the context. Made once; whether it runs is the browser's
 *  call (see `prime` and `unlock`). */
function create(): Engine | null {
  if (engine) return engine;
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  const ac = new AudioContext();
  const master = ac.createGain();
  master.gain.value = muted ? 0 : store.get().master;
  master.connect(ac.destination);
  const room = ac.createGain();
  room.gain.value = store.get().room;
  const tail = ac.createConvolver();
  tail.buffer = makeTail(ac, ROOM_SECONDS);
  room.connect(tail);
  tail.connect(master);
  engine = { ac, master, noise: makeNoise(ac), room };
  return engine;
}

/** How long the room rings. */
const ROOM_SECONDS = 1.6;

function unlock() {
  const e = create();
  if (!e) return;
  if (e.ac.state !== "running") {
    e.ac.resume().catch(() => {});
  }
  applyMaster();
}

const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

/** Listens for the first gesture that can start audio. Idempotent; the
 *  listeners stay on (cheap) so a context the browser suspended later —
 *  iOS does after a while in the background — is resumed by the next
 *  touch too. */
function arm() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  for (const type of GESTURES) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
}

/** Makes the context at mount, ahead of any gesture. Where the browser
 *  lets a page start audio on its own (it has been clicked on before in
 *  this tab, or the site's media score is high) it runs at once and the
 *  first hover sounds; elsewhere it sits suspended until `unlock`. */
function prime() {
  arm();
  const e = create();
  if (!e || e.ac.state === "running") return;
  e.ac.resume().catch(() => {});
}

/** The engine once the browser is letting sound through, else null. */
function live(): Engine | null {
  return engine && engine.ac.state === "running" ? engine : null;
}

const MASTER_RAMP = 0.15;

function applyMaster() {
  if (!engine) return;
  const { ac, master } = engine;
  const target = muted ? 0 : store.get().master;
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(target, ac.currentTime, MASTER_RAMP / 3);
}

function applyRoom() {
  if (!engine) return;
  const { ac, room } = engine;
  room.gain.cancelScheduledValues(ac.currentTime);
  room.gain.setTargetAtTime(store.get().room, ac.currentTime, MASTER_RAMP / 3);
}

// Every store change re-aims the live nodes: the master for level and
// mute, the room's send for its slider.
function reaim() {
  applyMaster();
  applyRoom();
}
store.subscribe(reaim);
subscribeMuted(reaim);

// ---------------------------------------------------------- the one-shots

export type SoundName =
  "cut" | "tap" | "knock" | "slide" | "slideOut" | "letter";

/** Least ms between two plays of the same sound, so a fast walk doesn't
 *  pile ticks into a buzz. The tap's is short: the cue taps shut and
 *  open again inside a few ms when the pointer skims its edge, and the
 *  open must not be lost to the shut. The letters have none: several
 *  stamp at once on first contact and the caller spaces them itself
 *  (see `delay`). */
const MIN_GAP: Record<SoundName, number> = {
  cut: 30,
  tap: 25,
  knock: 80,
  slide: 100,
  slideOut: 100,
  letter: 0,
};

const lastPlayed: Partial<Record<SoundName, number>> = {};

const FLOOR = 0.0001;

/** A gain node with a percussive envelope: `attack` s up to `peak`,
 *  then an exponential fall over `decay` s. Returns the node and when
 *  it goes quiet. */
function envelope(
  e: Engine,
  t0: number,
  peak: number,
  attack: number,
  decay: number,
): { gain: GainNode; end: number } {
  const gain = e.ac.createGain();
  gain.gain.setValueAtTime(FLOOR, t0);
  gain.gain.linearRampToValueAtTime(Math.max(peak, FLOOR), t0 + attack);
  gain.gain.exponentialRampToValueAtTime(FLOOR, t0 + attack + decay);
  gain.connect(e.master);
  return { gain, end: t0 + attack + decay + 0.02 };
}

/** A slice of the noise buffer through a filter, into `into`. */
function noiseBurst(
  e: Engine,
  t0: number,
  end: number,
  filter: BiquadFilterNode,
  into: GainNode,
) {
  const src = e.ac.createBufferSource();
  src.buffer = e.noise;
  src.loop = true;
  // A random offset so two bursts never share a waveform.
  const offset = Math.random() * (e.noise.duration - 0.2);
  src.connect(filter);
  filter.connect(into);
  src.start(t0, offset);
  src.stop(end);
}

/** A sine that drops from `from` to `to` Hz over `glide` s — the
 *  "thump" body of a struck object. */
function thump(
  e: Engine,
  t0: number,
  end: number,
  from: number,
  to: number,
  glide: number,
  into: GainNode,
  type: OscillatorType = "sine",
) {
  const osc = e.ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + glide);
  osc.connect(into);
  osc.start(t0);
  osc.stop(end);
}

function filter(
  e: Engine,
  type: BiquadFilterType,
  frequency: number,
  q: number,
): BiquadFilterNode {
  const f = e.ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = q;
  return f;
}

/** ±`spread` around 1 — a hair of variation so repeats sound struck,
 *  not sampled. */
function vary(spread: number): number {
  return 1 + (Math.random() * 2 - 1) * spread;
}

// The wooden tick of a photo cut: a bright, very short noise crack with
// a small low body underneath.
function playCut(e: Engine, t0: number, level: number) {
  const p = store.get().pitch;
  const crack = envelope(e, t0, level * 0.9, 0.002, 0.028);
  noiseBurst(
    e,
    t0,
    crack.end,
    filter(e, "bandpass", 2300 * p * vary(0.08), 1.3),
    crack.gain,
  );
  const body = envelope(e, t0, level * 0.5, 0.001, 0.045);
  thump(e, t0, body.end, 170 * p * vary(0.05), 95 * p, 0.04, body.gain);
}

// The cardboard tap of a pointer landing on a sign: duller than a cut,
// a little longer, nothing bright in it.
function playTap(e: Engine, t0: number, level: number) {
  const p = store.get().pitch;
  const pad = envelope(e, t0, level * 0.6, 0.003, 0.04);
  noiseBurst(
    e,
    t0,
    pad.end,
    filter(e, "lowpass", 1100 * p * vary(0.1), 0.7),
    pad.gain,
  );
  const body = envelope(e, t0, level * 0.25, 0.001, 0.035);
  thump(e, t0, body.end, 220 * p * vary(0.06), 140 * p, 0.03, body.gain);
}

// The solid knock of wood on wood: a low thump with a bit of ring and a
// short knuckle of noise on the front.
function playKnock(e: Engine, t0: number, level: number) {
  const p = store.get().pitch;
  const body = envelope(e, t0, level * 0.9, 0.002, 0.11);
  thump(e, t0, body.end, 130 * p * vary(0.05), 62 * p, 0.08, body.gain);
  const ring = envelope(e, t0, level * 0.15, 0.002, 0.05);
  thump(
    e,
    t0,
    ring.end,
    520 * p * vary(0.04),
    480 * p,
    0.05,
    ring.gain,
    "triangle",
  );
  const knuckle = envelope(e, t0, level * 0.35, 0.001, 0.03);
  noiseBurst(
    e,
    t0,
    knuckle.end,
    filter(e, "bandpass", 900 * p, 0.8),
    knuckle.gain,
  );
}

// Paper sliding out: a swept noise whose center climbs as it goes, and a
// tap where it stops. `out` sweeps back down, quieter, no landing.
function playSlide(e: Engine, t0: number, level: number, out: boolean) {
  const p = store.get().pitch;
  const dur = out ? 0.12 : 0.14;
  const sweep = envelope(e, t0, level * (out ? 0.3 : 0.5), 0.06, dur - 0.04);
  const band = filter(e, "bandpass", (out ? 2200 : 700) * p, 1);
  band.frequency.setValueAtTime((out ? 2200 : 700) * p, t0);
  band.frequency.exponentialRampToValueAtTime((out ? 600 : 2600) * p, t0 + dur);
  noiseBurst(e, t0, sweep.end, band, sweep.gain);
  if (!out) playTap(e, t0 + dur - 0.01, level * 0.8);
}

// ------------------------------------------------------------ the letters

/**
 * The scale everything pitched is on: a major pentatonic over two
 * octaves, as ratios of the root. Any two of its notes agree, in any
 * order, so nothing the pointer does can land on a clash.
 */
const PENTATONIC = [
  1,
  9 / 8,
  5 / 4,
  3 / 2,
  5 / 3,
  2,
  9 / 4,
  5 / 2,
  3,
  10 / 3,
] as const;

const DEGREES = PENTATONIC.length;

/** Keeps a degree on the scale. */
const onScale = (d: number) => Math.min(DEGREES - 1, Math.max(0, d));

/**
 * The melody: where the tune is, as a degree of the scale, moved by
 * every main note. Nothing is fixed to a letter — the same word never
 * plays the same way twice — but every note is placed from the last, so
 * a sweep is a line, not a scatter.
 */
let melodyAt = 4;

/** A step of the melody from `from`: one or two degrees either way for
 *  the most part, a leap of three to five with the tuning's whimsy,
 *  leaning back toward the middle of the range from either end, and
 *  never the same degree twice running. */
function walk(from: number, whimsy: number): number {
  const mid = (DEGREES - 1) / 2;
  const up = 0.5 - ((from - mid) / mid) * 0.3;
  const dir = Math.random() < up ? 1 : -1;
  const size =
    Math.random() < whimsy
      ? 3 + Math.floor(Math.random() * 3)
      : 1 + Math.floor(Math.random() * 2);
  const to = from + dir * size;
  return onScale(to < 0 || to >= DEGREES ? from - dir * size : to);
}

/** A degree that goes with `at`, for the company: two or three off —
 *  on this scale, thirds, fourths, fifths and sixths — either side, or
 *  with a share of the whimsy one off, a second, for colour. */
function harmony(at: number, whimsy: number): number {
  const off =
    Math.random() < whimsy * 0.3 ? 1 : 2 + Math.floor(Math.random() * 2);
  const dir = Math.random() < 0.5 ? 1 : -1;
  const to = at + dir * off;
  return onScale(to < 0 || to >= DEGREES ? at - dir * off : to);
}

/** The roots of the scale, Hz: B3 for the letters, B2 for the bed —
 *  the recording the feel was taken from runs B3 to B5. */
const LETTER_ROOT = 246.94;
const BED_ROOT = 123.47;

/**
 * A felt-piano note at `f` Hz, ringing `ring` s: a soft hammer — a dull
 * thud of low-passed noise, gone in 30 ms — and four partials, each
 * fading at its own rate, the upper ones sooner and quieter as under
 * felt, stretched a hair sharp as a stiff string's are. Into the master
 * and the room both. Returns the note's own gain, for the voice cap.
 */
function piano(
  e: Engine,
  t0: number,
  f: number,
  level: number,
  ring: number,
): GainNode {
  const { ac } = e;
  const out = ac.createGain();
  out.connect(e.master);
  out.connect(e.room);
  const partials: [number, number][] = [
    [1, 1],
    [2, 0.45],
    [3, 0.18],
    [4, 0.08],
  ];
  partials.forEach(([ratio, share], k) => {
    const dur = ring / (1 + 0.7 * k);
    const attack = 0.004 + 0.002 * k;
    const g = ac.createGain();
    g.gain.setValueAtTime(FLOOR, t0);
    g.gain.linearRampToValueAtTime(Math.max(level * share, FLOOR), t0 + attack);
    g.gain.exponentialRampToValueAtTime(FLOOR, t0 + attack + dur);
    g.connect(out);
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f * ratio * (1 + 0.0006 * k * k);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + attack + dur + 0.05);
  });
  const hammer = ac.createGain();
  hammer.gain.setValueAtTime(FLOOR, t0);
  hammer.gain.linearRampToValueAtTime(
    Math.max(level * 0.35, FLOOR),
    t0 + 0.003,
  );
  hammer.gain.exponentialRampToValueAtTime(FLOOR, t0 + 0.03);
  hammer.connect(out);
  noiseBurst(
    e,
    t0,
    t0 + 0.05,
    filter(e, "lowpass", Math.min(f * 3, 1800), 0.7),
    hammer,
  );
  return out;
}

/** How many letters may ring at once. Past it the oldest is faded out
 *  in VOICE_FADE s, so a fast sweep is an arpeggio, never a wash. */
const MAX_VOICES = 6;
const VOICE_FADE = 0.12;

let voices: { out: GainNode; at: number }[] = [];

function takeVoice(e: Engine, out: GainNode, t0: number, ring: number) {
  const now = e.ac.currentTime;
  voices = voices.filter((v) => v.at + ring + 0.3 > now);
  voices.push({ out, at: t0 });
  while (voices.length > MAX_VOICES) {
    const old = voices.shift();
    if (!old) break;
    old.out.gain.cancelScheduledValues(now);
    old.out.gain.setTargetAtTime(0, now, VOICE_FADE / 3);
  }
}

/** How much of the ring a letter's company keeps. */
const SOFT_RING = 0.6;
/** A grace note: how soon after its main note, and how loud. */
const GRACE_AFTER = 0.07;
const GRACE_LEVEL = 0.45;

// A letter stamping. The main note moves the melody a step and plays
// there, ringing the tuning's `ring`, now and then with a grace note a
// degree above hard on its heels; company plays a harmony of where the
// melody is, shorter. Every level is varied a hair, as a hand would.
function playLetter(e: Engine, t0: number, level: number, soft: boolean) {
  const t = store.get();
  const root = LETTER_ROOT * t.pitch;
  if (soft) {
    const ring = t.ring * SOFT_RING;
    const f = root * (PENTATONIC[harmony(melodyAt, t.whimsy)] as number);
    takeVoice(e, piano(e, t0, f, level * vary(0.15), ring), t0, ring);
    return;
  }
  melodyAt = walk(melodyAt, t.whimsy);
  const f = root * (PENTATONIC[melodyAt] as number);
  takeVoice(e, piano(e, t0, f, level * vary(0.1), t.ring), t0, t.ring);
  if (Math.random() < t.whimsy * 0.4) {
    const g = root * (PENTATONIC[onScale(melodyAt + 1)] as number);
    const at = t0 + GRACE_AFTER;
    const ring = t.ring * SOFT_RING;
    takeVoice(e, piano(e, at, g, level * GRACE_LEVEL, ring), at, ring);
  }
}

export type PlayOptions = {
  /** Where this play is from: its own level in the tuning goes on top. */
  at?: Place;
  /** Seconds from now to strike, so a burst can be spaced by hand. */
  delay?: number;
  /** A letter's company: a harmony of the melody rather than a step
   *  of it, ringing shorter, so it sits under the main note. */
  soft?: boolean;
};

/**
 * Fires a sound now. A no-op before the first gesture, while muted, and
 * when the same sound fired within its MIN_GAP. `level` scales this
 * play only (a landing is a softer knock than a launch).
 */
export function play(name: SoundName, level = 1, opts: PlayOptions = {}) {
  if (!armed) arm();
  const e = live();
  if (!e || muted) return;
  const now = performance.now();
  const last = lastPlayed[name] ?? -Infinity;
  const gap = MIN_GAP[name];
  if (gap > 0 && now - last < gap) return;
  lastPlayed[name] = now;
  const t0 = e.ac.currentTime + (opts.delay ?? 0);
  const t = store.get();
  if (opts.at) level *= t[opts.at];
  switch (name) {
    case "cut":
      playCut(e, t0, level * t.cut);
      break;
    case "tap":
      playTap(e, t0, level * t.tap);
      break;
    case "knock":
      playKnock(e, t0, level * t.knock);
      break;
    case "slide":
      playSlide(e, t0, level * t.slide, false);
      break;
    case "slideOut":
      playSlide(e, t0, level * t.slide, true);
      break;
    case "letter":
      playLetter(e, t0, level * t.letter, !!opts.soft);
      break;
  }
}

// ---------------------------------------------------------------- the bed

/** How many mounted callers want the bed. It plays while > 0, the tab
 *  is visible and the context is unlocked. */
let bedWanted = 0;
let bedHidden = false;
let bedTimer: number | null = null;
/** Where the bed's own walk is on the scale. */
let bedAt = 4;

/** One note of the bed, then the next wait: the tuning's pace, give or
 *  take half of it. Until the context is unlocked it only looks in
 *  every so often, so the bed starts within a moment of the first
 *  gesture. */
function bedTick() {
  bedTimer = null;
  if (!bedWanted || bedHidden) return;
  const e = live();
  const t = store.get();
  if (e && !muted && t.bed > 0) {
    // The same walk as the melody's, an octave down and with half the
    // whimsy: a slow line under the letters.
    bedAt = walk(bedAt, t.whimsy * 0.5);
    const f = BED_ROOT * t.pitch * (PENTATONIC[bedAt] as number);
    piano(e, e.ac.currentTime, f, t.bed * 0.5 * vary(0.15), t.ring * 2.5);
  }
  const wait = e ? t.pace * 1000 * (0.5 + Math.random()) : 400;
  bedTimer = window.setTimeout(bedTick, wait);
}

/** ms before the bed's first note, so a pointer only brushing the
 *  words does not set it off. */
const BED_SETTLE = 250;

function startBed() {
  if (bedTimer === null) bedTimer = window.setTimeout(bedTick, BED_SETTLE);
}

function stopBed() {
  if (bedTimer === null) return;
  window.clearTimeout(bedTimer);
  bedTimer = null;
}

function onBedVisibility() {
  bedHidden = document.visibilityState === "hidden";
  if (bedHidden) stopBed();
  else startBed();
}

/** Asks for the bed. Returns the release; it plays while anyone asks.
 *  A note already ringing rings out on release; only the next is
 *  withheld. */
function wantBed(): () => void {
  arm();
  bedWanted++;
  if (bedWanted === 1 && typeof document !== "undefined") {
    bedHidden = document.visibilityState === "hidden";
    document.addEventListener("visibilitychange", onBedVisibility);
    startBed();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    bedWanted--;
    if (bedWanted > 0) return;
    document.removeEventListener("visibilitychange", onBedVisibility);
    stopBed();
  };
}

/** The bed while `on`: the greeting hands it its hover. */
export function useBed(on: boolean) {
  useEffect(() => {
    if (!on) return;
    return wantBed();
  }, [on]);
}

// ------------------------------------------------------------- the toggle

/** A speaker, waves out or a slash through. */
function SpeakerGlyph({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9.5v5h3.2L12 18.5v-13L7.2 9.5H4z" fill="currentColor" />
      {muted ? (
        <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
      ) : (
        <>
          <path d="M15.5 9.8a3.2 3.2 0 0 1 0 4.4" />
          <path d="M18 7.3a6.6 6.6 0 0 1 0 9.4" />
        </>
      )}
    </svg>
  );
}

/**
 * The mute switch. Mount it once on a page that should sound: its
 * mount primes the context (see `prime`), and its own click is a
 * gesture, so unmuting on a fresh page unlocks the context in the same
 * stroke. Unstyled beyond the glyph: pass `className` for placement
 * and colour.
 */
export function SoundToggle({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  /** Optional label next to the glyph. */
  children?: ReactNode;
}) {
  const isOff = useMuted();
  useEffect(prime, []);
  return (
    <button
      type="button"
      className={className}
      style={style}
      // A toggle button: one name, and the pressed state says whether
      // the mute is on. A name that flipped with it would read "Unmute
      // sounds, pressed".
      aria-pressed={isOff}
      aria-label="Mute sounds"
      title={isOff ? "Sound off" : "Sound on"}
      onClick={() => setMuted(!isOff)}
    >
      <SpeakerGlyph muted={isOff} />
      {children}
    </button>
  );
}
