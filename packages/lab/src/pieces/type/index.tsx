"use client";

import { Fragment, useState } from "react";
import { asset } from "../../asset";
import { BENCH_CSS, btn, mono } from "../../bench";
import { Arrow, BottomBlur, FitTitle, Reveal, TypeStyles } from "../../type";

/**
 * The type specimen: the project pages' type (type.tsx) set on real
 * words at the size it will live at — Camper's page, top to foot, in a
 * sheet as wide as the project window's, beside a rail as wide as the
 * signs'. It is here to be judged by eye against the references, and to
 * be lifted from: the page's structure is being rebuilt elsewhere, and
 * this is the type it will wear.
 *
 * Two left edges and no more: the sheet's (the title, the margin notes,
 * the wide pictures) and the text's, three columns in (every paragraph
 * and every picture that belongs to one). The rail already lists the
 * sections, so the page doesn't number or announce them: a small grey
 * note in the margin, and the heading is the text's first line, in ink.
 *
 * One switch: the title fitted to the width, or at the fixed scale. The
 * three names are here because a fitted title is a different size for
 * each.
 */

type Name = { title: string; year: string; tagline: string };

const CAMPER: Name = {
  title: "Camper",
  year: "2026",
  tagline: "Everyone is equal in their feet.",
};

const PROJECTS: Name[] = [
  CAMPER,
  {
    title: "LocalPal",
    year: "2025–2026",
    tagline: "Finding and organising the plans a city doesn't show you.",
  },
  {
    title: "Convertr",
    year: "2026",
    tagline: "A video converter where the box is the whole interface.",
  },
];

const SUMMARY =
  "A sixty-second proposal film for Camper, made end to end with generative AI at 2894 Studio: concept, storyboard, every still and every shot.";

const FACTS = [
  { label: "Type", value: "Proposal film" },
  { label: "Studio", value: "2894 Studio" },
  { label: "Fields", value: "Concept, storyboard, AI image and video, edit" },
  { label: "Role", value: "All of it" },
  { label: "Length", value: "60 seconds" },
];

const SECTIONS = [
  {
    label: "The idea",
    heading: "One brand, every kind of feet.",
    body: [
      "A proposal for Camper made at my last job, 2894 Studio, where I did all of it: the concept, the storyboard, every generated still and every generated shot, and the edit.",
      "The idea is simple and it is the whole film: Camper is a brand that everyone can wear and everyone does wear. A kid, a grandmother, a chef, a skater, someone on their way to a wedding — the faces, the places and the lives could not be more different, and the shoes are the same. Whatever else separates people, they are equal in their feet.",
    ],
    figures: [
      "One of the unexpected wearers, feet in frame.",
      "A contrasting wearer, same shoe, same framing.",
    ],
  },
  {
    label: "Process",
    heading: "From a storyboard to sixty seconds.",
    body: [
      "It started on paper. I storyboarded the full minute first — who appears, in what order, where the cuts land on the music — so that generating anything had a target. Then each frame became a still: prompts written and rewritten across a mix of image models until the person, the light and the shoe matched the board.",
      "Working this way, the design work is in the choosing. A model will give you a hundred plausible people; the film only works if every one of them feels like a real person you'd pass on the street. Most of the time went on the discarding.",
    ],
    figures: ["The canvas where the stills were generated."],
  },
  {
    label: "Learnings",
    heading: "What it taught me.",
    body: [
      "That a concept has to be one sentence before it is a hundred prompts. Every time a shot drifted, it was because I had lost the sentence, not because the model was wrong.",
    ],
    figures: [],
  },
];

/** The captions' numbers run down the whole page, not per section. */
const FIRST_FIG = SECTIONS.map((_, i) =>
  SECTIONS.slice(0, i).reduce((n, s) => n + s.figures.length, 0),
);

/** The rail's width beside the sheet: sheetLayout.ts's, in the web app. */
const RAIL = "calc(2.4vw + 21.4vh)";

const STAGE_CSS = `
.tb-wall { position: fixed; inset: 0; z-index: 1; background: #faf9f6; color: #8a847c; }
.tb-rail { display: none; }
.tb-sheet { position: absolute; inset: 0; overflow-y: auto; }
@media (min-width: 701px) {
  .tb-rail { display: grid; gap: 6px; align-content: start; position: absolute; left: 0; top: 0; width: ${RAIL}; padding: 24px; font-size: 13px; }
  .tb-sheet { left: ${RAIL}; border-left: 1px solid rgba(43, 39, 34, .12); }
}
/* The header: the first screen, the name at its top and the words at its
   foot. */
.tb-head { display: flex; flex-direction: column; justify-content: space-between; gap: calc(4 * var(--ty-u)); min-height: 100vh; padding-top: calc(1.5 * var(--ty-u)); padding-bottom: calc(5 * var(--ty-u)); }
.tb-intro { grid-column: 1 / span 7; }
.tb-facts { grid-column: 9 / -1; align-self: end; }
.tb-note { grid-column: 1 / span 3; padding-top: .5em; }
.tb-text { grid-column: 4 / span 8; }
.tb-figs { grid-column: 4 / -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--ty-u); }
.tb-cap { margin-top: calc(.5 * var(--ty-u)); }
.tb-media { display: block; width: 100%; background: #ecebe8; object-fit: cover; }
.tb-body { padding-bottom: calc(8 * var(--ty-u)); }
.tb-foot { padding-bottom: calc(6 * var(--ty-u)); }
@container (max-width: 700px) {
  .tb-intro, .tb-facts, .tb-note, .tb-text, .tb-figs { grid-column: 1 / -1; }
  .tb-facts { margin-top: calc(2 * var(--ty-u)); }
  .tb-note { padding: 0 0 var(--ty-u); }
}
.tb-panel { position: fixed; left: 16px; bottom: 16px; z-index: 10; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; max-width: calc(100vw - 32px); padding: 8px 10px; border-radius: 12px; border: 1px solid rgba(23, 23, 23, .12); background: rgba(255, 255, 255, .92); color: #171717; backdrop-filter: blur(8px); }
.tb-panel span { padding: 0 4px; opacity: .6; }
`;

/** ms between neighbours arriving together. */
const BEAT = 70;

const two = (i: number) => String(i + 1).padStart(2, "0");

export default function TypeBench() {
  const [fit, setFit] = useState(true);
  const [which, setWhich] = useState(0);
  const project = PROJECTS[which] ?? CAMPER;
  const next = PROJECTS[(which + 1) % PROJECTS.length] ?? CAMPER;

  return (
    <div className="tb-wall">
      {/* The type first: the specimen's layout sets margins over it. */}
      <TypeStyles />
      <style>{BENCH_CSS + STAGE_CSS}</style>

      {/* Where the signs and the contents are, on the real page. */}
      <div className="tb-rail" aria-hidden="true">
        <span style={{ fontFamily: mono, fontSize: 11 }}>← Home</span>
        {SECTIONS.map((s) => (
          <span key={s.label}>{s.label}</span>
        ))}
      </div>

      <article className="ty tb-sheet">
        <header className="ty-ground tb-head" data-ground="blue">
          <Reveal gate="mount" key={project.title}>
            {fit ? (
              <FitTitle>{project.title}</FitTitle>
            ) : (
              <h1 className="ty-title">{project.title}</h1>
            )}
          </Reveal>
          <div className="ty-grid">
            <Reveal gate="mount" delay={BEAT} className="ty-read tb-intro">
              <p>{project.tagline}</p>
              <p className="ty-dim" style={{ textIndent: 0 }}>
                {SUMMARY}
              </p>
            </Reveal>
            <Reveal
              as="dl"
              gate="mount"
              delay={2 * BEAT}
              className="ty-small ty-facts tb-facts"
            >
              {FACTS.map((f) => (
                <Fragment key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </Fragment>
              ))}
              <dt>Year</dt>
              <dd className="ty-num">{project.year}</dd>
            </Reveal>
          </div>
        </header>

        {/* The film, edge to edge: the first thing on the paper. */}
        <Reveal as="figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="tb-media"
            style={{ aspectRatio: 16 / 9 }}
            src={asset("/media/camper-poster.webp")}
            alt="A still from the Camper film"
          />
        </Reveal>

        <div className="ty-ground tb-body">
          {SECTIONS.map((s, i) => (
            <section
              className={i ? "ty-grid ty-gap-8" : "ty-grid ty-gap-4"}
              key={s.label}
            >
              <Reveal as="p" className="ty-small ty-dim tb-note">
                {s.label}
              </Reveal>
              <Reveal delay={BEAT} className="ty-read tb-text">
                <h2 style={{ font: "inherit", letterSpacing: "inherit" }}>
                  {s.heading}
                </h2>
                {s.body.map((text, j) => (
                  <p className="ty-dim" key={j}>
                    {text}
                  </p>
                ))}
              </Reveal>
              {s.figures.length > 0 && (
                <div className="tb-figs ty-gap-2">
                  {s.figures.map((need, j) => (
                    <Reveal as="figure" key={need} delay={j * BEAT}>
                      <div
                        className="tb-media"
                        style={{ aspectRatio: 16 / 9 }}
                      />
                      <figcaption className="ty-small ty-dim tb-cap">
                        <span className="ty-num">
                          {two((FIRST_FIG[i] ?? 0) + j)}
                        </span>
                        {" "}
                        {need}
                      </figcaption>
                    </Reveal>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <footer className="ty-ground tb-foot" data-ground="blue">
          <p className="ty-small ty-dim">Next</p>
          {/* On the bench the way on only changes the name. */}
          <a
            href="#"
            className="ty-title ty-next ty-gap-1"
            onClick={(e) => {
              e.preventDefault();
              setWhich((which + 1) % PROJECTS.length);
            }}
          >
            {next.title}
            <Arrow />
          </a>
        </footer>
        <BottomBlur />
      </article>

      <div className="tb-panel" style={{ fontFamily: mono, fontSize: 12 }}>
        <span>title</span>
        <button
          type="button"
          style={{ ...btn, opacity: fit ? 1 : 0.5 }}
          aria-pressed={fit}
          onClick={() => setFit(true)}
        >
          fills the width
        </button>
        <button
          type="button"
          style={{ ...btn, opacity: fit ? 0.5 : 1 }}
          aria-pressed={!fit}
          onClick={() => setFit(false)}
        >
          fixed scale
        </button>
        <span>name</span>
        {PROJECTS.map((p, i) => (
          <button
            key={p.title}
            type="button"
            style={{ ...btn, opacity: i === which ? 1 : 0.5 }}
            aria-pressed={i === which}
            onClick={() => setWhich(i)}
          >
            {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}
