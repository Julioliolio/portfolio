"use client";

import { asset } from "@portfolio/lab/asset";
import { Contents } from "@portfolio/lab/contents";
import {
  Arrow,
  BottomBlur,
  FitTitle,
  Reveal,
  TYPE_CSS,
} from "@portfolio/lab/type";
import { useWindowRail, useWindowScroller } from "@portfolio/lab/window";
import {
  Suspense,
  lazy,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { DemoShell } from "@/components/demo/DemoShell";
import { OPENINGS } from "./openings";
import {
  projectAfter,
  type Block,
  type Figure,
  type Project,
  type Section,
} from "@/content/projects";

/**
 * The case-study page: one template for every project, fed by a content
 * module (src/content/projects). It is the page inside the project
 * window (@portfolio/lab/window) on the landing, and the whole page at
 * /work/<slug>.
 *
 * It is set in the project pages' type (@portfolio/lab/type, tried out
 * at /lab/type — read that file first): three sizes, one weight under
 * the title, one unit of space, twelve columns, and no rules, eyebrows,
 * capitals or section numbers. The page has two left edges: the sheet's
 * (the title, a section's small grey note, the hero) and the text's,
 * three columns in (everything a section says or shows).
 *
 *   header    the first screen, one blue field: the name fitted to the
 *             width at its top; the tagline, the summary and the facts
 *             at its foot. A project with an opening of its own (see
 *             openings.ts — Camper's film) opens on that instead, and
 *             the header follows on the paper, its name in the blue.
 *   hero      edge to edge under the header, unless it is something
 *             with a frame of its own (a demo, a film).
 *   sections  the label as a note in the margin; the heading is the
 *             first line of the text, ink over grey at one size; text
 *             blocks that follow one another are one run, paragraphs
 *             indented, not spaced; media sits on the text's edge.
 *   foot      blue again: the next project's name, as big as a title.
 *
 * The contents are a path of stops (@portfolio/lab/contents) — the
 * chapters on a long page, the sections on a short one — and not in the
 * page: it stands in the window's rail, beside the sheet
 * (`useWindowRail()`), where it follows the reading; on a phone, where
 * the window has no rail, the long pages get the path open after the
 * header instead.
 *
 * Nothing here arrives in stop-motion cuts (Julio, 2026-09-21: a page
 * full of them was too heavy) — that is the landing's and the window's.
 * Things fade up once (<Reveal>), a run or a picture at a time, and the
 * page goes out of focus along the sheet's bottom edge (<BottomBlur>).
 * One blue, the rope's, for every project: `accent` no longer tints a
 * page.
 *
 * Images are not here yet. A `placeholder` figure renders a grey box
 * that says, in the box, which photo belongs there; the content modules
 * describe every one. Swap the figure's kind when the photo exists.
 */

/** The film's player is a chunk of its own: only Camper has a film, and
 *  the work pages sit close to the JS budget (scripts/check-budget.mjs). */
const FilmPlayer = lazy(() => import("./FilmPlayer"));

/** A placeholder's grey, and a picture's before it loads. */
const GREY = "#ecebe8";
const MONO = "var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace";
/** ms between neighbours arriving together. */
const BEAT = 70;

const CSS = `
/* --cs-gutter: the openings bleed by it, and the grounds carry the
   page's padding now, so there is none to bleed past. */
.cs { --cs-gutter: 0px; --cs-pad: calc(1.5 * var(--ty-u)); counter-reset: cs-fig; }

/* The header. As the first screen it is as tall as what the window
   shows (--cs-vh), and its foot clears the blur. */
.cs-head { display: flex; flex-direction: column; justify-content: space-between; gap: calc(4 * var(--ty-u)); padding-top: var(--cs-pad); }
.cs-head.is-screen { min-height: var(--cs-vh, 100dvh); padding-bottom: calc(5 * var(--ty-u)); }
.cs-head:not([data-ground]) .ty-title { color: var(--ty-blue); }
.cs-intro { grid-column: 1 / span 7; }
.cs-intro p + p { text-indent: 0; }
.cs-facts { grid-column: 9 / -1; align-self: end; }
.cs-facts a { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .15em; }
/* The way home, on a phone; with a rail (the window's 701px line) Home
   is there, and so are the contents. */
.cs-bar { display: inline-flex; align-items: center; gap: .5em; margin-bottom: calc(2 * var(--ty-u)); }
@media (min-width: 701px) { .cs-bar, .cs-toc { display: none; } }
.cs-toc { margin-top: calc(2 * var(--ty-u)); }

.cs-hero figcaption { padding: 0 var(--cs-pad); }
.cs-hero.is-framed { padding: calc(2 * var(--ty-u)) var(--cs-pad) 0; }
.cs-hero.is-framed figcaption { padding: 0; }
.cs-opening-hold { height: min(var(--cs-vh, 100dvh), 75cqw); background: #000; }

/* Sections: the note on the sheet's edge, everything else on the
   text's. The text keeps a column free on its right; media takes it. */
.cs-body { padding-bottom: calc(8 * var(--ty-u)); }
.cs-section { margin-top: calc(8 * var(--ty-u)); scroll-margin-top: calc(2 * var(--ty-u)); }
.cs-section:first-of-type { margin-top: calc(4 * var(--ty-u)); }
.cs-note { grid-column: 1 / span 3; padding-top: .5em; }
.cs-main { grid-column: 4 / -1; min-width: 0; }
.cs-main > * + * { margin-top: calc(2 * var(--ty-u)); }
.cs-text { width: calc((100% - 8 * var(--ty-u)) / 9 * 8 + 7 * var(--ty-u)); }
.cs-text > :first-child { margin-top: 0; }
.cs-text > :last-child { margin-bottom: 0; }
.cs-text h2 { font: inherit; letter-spacing: inherit; }
.cs-list { list-style: none; margin: var(--ty-u) 0; padding: 0; display: grid; gap: calc(.5 * var(--ty-u)); counter-reset: cs-li; color: var(--ty-dim); }
.cs-list li { display: grid; grid-template-columns: 2.2em minmax(0, 1fr); }
.cs-list li::before { padding-top: .42em; font-family: ${MONO}; font-size: 13px; line-height: 1; letter-spacing: 0; }
.cs-list.is-numbered li { counter-increment: cs-li; }
.cs-list.is-numbered li::before { content: counter(cs-li, decimal-leading-zero); }
.cs-list.is-bulleted li::before { content: "—"; }
/* One weight: a list's title is told by its ink. (globals.css hands
   <b> the Medium family.) */
.cs-list b { font-family: inherit; font-weight: inherit; color: var(--ty-fg); }
.cs-quote { margin: var(--ty-u) 0; padding-left: 2.2em; }
.cs-quote cite { display: block; margin-top: calc(.5 * var(--ty-u)); font-style: normal; }
@container (max-width: 700px) {
  .cs-intro, .cs-facts, .cs-note, .cs-main { grid-column: 1 / -1; }
  .cs-facts { margin-top: calc(2 * var(--ty-u)); }
  .cs-note { padding: 0 0 var(--ty-u); }
  .cs-text { width: auto; }
}

/* Media: square and frameless, each with its caption under it, the
   captions numbered down the page. */
.cs-figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--ty-u); align-items: start; }
.cs-figs.is-tall { grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); }
.cs-media { position: relative; width: 100%; overflow: hidden; background: ${GREY}; }
.cs-media img, .cs-media video { display: block; width: 100%; height: 100%; object-fit: cover; }
.cs-media video { background: #000; }
.cs-cap { margin-top: calc(.5 * var(--ty-u)); }
.cs-cap::before { counter-increment: cs-fig; content: counter(cs-fig, decimal-leading-zero) "\\2002"; font-family: ${MONO}; }
/* The grey box: what goes here, said in the box. Dashed so it never
   passes for a finished frame. */
.cs-ph { display: grid; align-content: end; padding: calc(.75 * var(--ty-u)); outline: 1px dashed rgba(43, 39, 34, .28); outline-offset: -1px; }

/* The timeline: months across the top, a bar per phase. */
.cs-tl-months, .cs-tl-row { display: grid; grid-template-columns: minmax(96px, 1fr) 3fr; column-gap: var(--ty-u); align-items: center; }
.cs-tl-months { margin-bottom: calc(.5 * var(--ty-u)); }
.cs-tl-scale { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; font-family: ${MONO}; font-size: 11px; }
.cs-tl-row + .cs-tl-row { margin-top: 6px; }
.cs-tl-track { position: relative; height: 18px; background-image: linear-gradient(to right, rgba(43, 39, 34, .12) 1px, transparent 1px); background-size: var(--cs-tl-month) 100%; }
.cs-tl-bar { position: absolute; top: 0; bottom: 0; background: var(--ty-blue); }
.cs-tl-note { margin-top: var(--ty-u); }

/* The carousel: a row wider than the text, out to the sheet's edge,
   dragged through. */
.cs-carousel-row { display: flex; gap: var(--ty-u); align-items: flex-start; width: calc(100% + var(--cs-pad)); padding-right: var(--cs-pad); overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; cursor: grab; touch-action: pan-y; }
.cs-carousel-row::-webkit-scrollbar { display: none; }
.cs-carousel-row.is-dragging { cursor: grabbing; scroll-snap-type: none; }
.cs-carousel-row.is-dragging * { pointer-events: none; }
/* Each figure sits in its entrance wrapper, which is the row's item. */
.cs-carousel-row > * { flex: none; width: min(360px, 78%); scroll-snap-align: start; }
.cs-carousel-hint { display: flex; align-items: center; gap: .5em; margin-top: calc(.5 * var(--ty-u)); }

/* The foot: the way on, and the way home. */
.cs-foot { padding-bottom: calc(6 * var(--ty-u)); }
.cs-home { display: inline-flex; align-items: center; gap: .5em; margin-top: calc(4 * var(--ty-u)); }
`;

/** Blocks that are read, not looked at: neighbours are set as one run. */
type TextBlock = Extract<Block, { type: "p" | "lede" | "list" | "quote" }>;
const isText = (b: Block): b is TextBlock =>
  b.type === "p" ||
  b.type === "lede" ||
  b.type === "list" ||
  b.type === "quote";

/** Media with a frame of its own keeps the page's margin around it. */
const isFramed = (f: Figure) =>
  f.kind === "demo" || (f.kind === "video" && f.mode === "film");

export function CaseStudy({
  project,
  home = false,
}: {
  project: Project;
  /** The page of its own: show the way home at the top (on a phone) and
   *  foot. In the window the rail and the close are the navigation. */
  home?: boolean;
}) {
  const next = projectAfter(project.slug);
  const stops = contentsStops(project.sections);
  const scroller = useWindowScroller();
  const rail = useWindowRail();
  const Opening = OPENINGS[project.slug];
  const page = useRef<HTMLElement>(null);
  // The first screen — an opening, or the header — is as tall as what
  // the window shows: --cs-vh is its scroller's height, not the
  // viewport's, kept in step with it.
  useLayoutEffect(() => {
    const el = page.current;
    if (!el || !scroller) return;
    const read = () =>
      el.style.setProperty("--cs-vh", `${scroller.clientHeight}px`);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [scroller]);

  return (
    <article ref={page} className="ty cs">
      <style>{TYPE_CSS + CSS}</style>

      {Opening && (
        <Suspense fallback={<div className="cs-opening-hold" />}>
          <Opening project={project} />
        </Suspense>
      )}

      {rail &&
        createPortal(<Contents stops={stops} scroller={scroller} />, rail)}

      <header
        className={
          Opening ? "ty-ground cs-head" : "ty-ground cs-head is-screen"
        }
        data-ground={Opening ? undefined : "blue"}
      >
        <div>
          {home && (
            <nav className="ty-small" aria-label="Site">
              <a
                href={asset("/#projects")}
                className="cs-bar"
                data-cursor-label="home"
              >
                <Arrow to="left" />
                Julio Romero
              </a>
            </nav>
          )}
          <Reveal gate="mount">
            <FitTitle>{project.title}</FitTitle>
          </Reveal>
        </div>
        <div className="ty-grid">
          <Reveal gate="mount" delay={BEAT} className="ty-read cs-intro">
            <p>{project.tagline}</p>
            <p className="ty-dim">{project.summary}</p>
          </Reveal>
          <Reveal
            as="dl"
            gate="mount"
            delay={2 * BEAT}
            className="ty-small ty-facts cs-facts"
          >
            {project.meta.map((m) => (
              <FactRow key={m.label} label={m.label}>
                {m.href ? (
                  <a
                    href={m.href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor-label="open"
                  >
                    {m.value}
                  </a>
                ) : (
                  m.value
                )}
              </FactRow>
            ))}
          </Reveal>
        </div>
      </header>

      {/* A project's own opening stands in for the hero. */}
      {!Opening && (
        <Reveal
          className={isFramed(project.hero) ? "cs-hero is-framed" : "cs-hero"}
        >
          <FigureView figure={project.hero} />
        </Reveal>
      )}

      <div className="ty-ground cs-body">
        {project.contents && (
          <div className="cs-toc">
            <Contents stops={stops} scroller={scroller} pinned />
          </div>
        )}

        {project.sections.map((s) => (
          <SectionView key={s.id} section={s} />
        ))}
      </div>

      <footer className="ty-ground cs-foot" data-ground="blue">
        <Reveal>
          <p className="ty-small ty-dim">Next</p>
          <a
            href={asset(`/work/${next.slug}/`)}
            className="ty-title ty-next ty-gap-1"
            data-cursor-label="next"
            aria-label={`Next case study: ${next.title}`}
          >
            {next.title}
            <Arrow />
          </a>
          {home && (
            <a
              href={asset("/#projects")}
              className="ty-small cs-home"
              data-cursor-label="home"
            >
              <Arrow to="left" />
              Back to the signs
            </a>
          )}
        </Reveal>
      </footer>

      <BottomBlur />
    </article>
  );
}

/** The contents' stops: the chapters where a page names them, each
 *  leading to the section it starts at; otherwise every section. */
function contentsStops(sections: Section[]) {
  const chapters = sections.filter((s) => s.chapter);
  return (chapters.length ? chapters : sections).map((s) => ({
    id: s.id,
    label: s.chapter ?? s.label,
  }));
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

/**
 * A section: its label in the margin, and its blocks on the text's
 * edge — text blocks that follow one another as one run, the heading
 * the first line of the first, each run and each picture arriving on
 * its own.
 */
function SectionView({ section }: { section: Section }) {
  const runs: (TextBlock[] | Exclude<Block, TextBlock>)[] = [];
  for (const b of section.blocks) {
    const last = runs[runs.length - 1];
    if (!isText(b)) runs.push(b);
    else if (Array.isArray(last)) last.push(b);
    else runs.push([b]);
  }
  // The heading needs a run to lead, even where a picture comes first.
  if (!Array.isArray(runs[0])) runs.unshift([]);

  return (
    <section className="ty-grid cs-section" id={section.id}>
      {/* Not where it would only say the heading twice. */}
      {section.label !== section.heading && (
        <Reveal as="p" className="ty-small ty-dim cs-note">
          {section.label}
        </Reveal>
      )}
      <div className="cs-main">
        {runs.map((run, i) =>
          Array.isArray(run) ? (
            <Reveal key={i} delay={i ? 0 : BEAT} className="ty-read cs-text">
              {i === 0 && <h2>{section.heading}</h2>}
              {run.map((b, j) => (
                <TextView key={j} block={b} />
              ))}
            </Reveal>
          ) : (
            <MediaView key={i} block={run} />
          ),
        )}
      </div>
    </section>
  );
}

function TextView({ block }: { block: TextBlock }) {
  switch (block.type) {
    case "p":
      return <p className="ty-dim">{block.text}</p>;
    case "lede":
      return <p>{block.text}</p>;
    case "list":
      return (
        <ol className={`cs-list is-${block.style}`}>
          {block.items.map((item, i) => (
            <li key={i}>
              <span>
                <b>{item.title}</b> {item.body}
              </span>
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="cs-quote">
          <p>{block.text}</p>
          {block.source && (
            <cite className="ty-small ty-dim">{block.source}</cite>
          )}
        </blockquote>
      );
  }
}

function MediaView({ block }: { block: Exclude<Block, TextBlock> }) {
  switch (block.type) {
    case "figure":
      return (
        <Reveal>
          <FigureView figure={block.figure} />
        </Reveal>
      );
    case "figures": {
      const tall = block.figures.every(
        (f) => f.kind !== "demo" && f.aspect < 1,
      );
      return (
        <div className={tall ? "cs-figs is-tall" : "cs-figs"}>
          {block.figures.map((f, i) => (
            <Reveal key={i} delay={i * BEAT}>
              <FigureView figure={f} />
            </Reveal>
          ))}
        </div>
      );
    }
    case "timeline": {
      const count = block.months.length;
      const pct = (v: number) => `${(v / count) * 100}%`;
      return (
        <Reveal
          className="ty-small"
          style={{ "--cs-tl-month": pct(1) } as CSSProperties}
        >
          <div className="cs-tl-months ty-dim" aria-hidden="true">
            <span />
            <div className="cs-tl-scale">
              {block.months.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </div>
          {block.phases.map((p) => (
            <div className="cs-tl-row" key={p.label}>
              <span>{p.label}</span>
              <div
                className="cs-tl-track"
                role="img"
                aria-label={`${p.label}: ${block.months[Math.floor(p.from)]} to ${block.months[Math.min(count - 1, Math.ceil(p.to) - 1)]}`}
              >
                <span
                  className="cs-tl-bar"
                  style={{ left: pct(p.from), width: pct(p.to - p.from) }}
                />
              </div>
            </div>
          ))}
          {block.note && <p className="cs-tl-note ty-dim">{block.note}</p>}
        </Reveal>
      );
    }
    case "carousel":
      return <Carousel figures={block.figures} hint={block.hint} />;
  }
}

/**
 * A row of figures dragged through sideways. Native horizontal scroll
 * with snapping, plus the pointer: press and pull to scroll, so a mouse
 * can do what a trackpad does. A pull swallows the click it ends on.
 */
function Carousel({ figures, hint }: { figures: Figure[]; hint?: string }) {
  const row = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch" || e.button !== 0) return;
    const el = row.current;
    if (!el) return;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  }
  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = row.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 4) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    el.scrollLeft = d.left - dx;
  }
  function up(e: ReactPointerEvent<HTMLDivElement>) {
    const el = row.current;
    if (el?.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
  }

  return (
    <div className="cs-carousel">
      <div
        ref={row}
        className={dragging ? "cs-carousel-row is-dragging" : "cs-carousel-row"}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          if (dragging) e.preventDefault();
        }}
      >
        {figures.map((f, i) => (
          <Reveal key={i} delay={i * BEAT}>
            <FigureView figure={f} />
          </Reveal>
        ))}
      </div>
      {hint && (
        <p className="ty-small ty-dim cs-carousel-hint">
          {hint}
          <Arrow />
        </p>
      )}
    </div>
  );
}

function FigureView({ figure }: { figure: Figure }) {
  const cap = figure.caption && (
    <figcaption className="ty-small ty-dim cs-cap">{figure.caption}</figcaption>
  );
  switch (figure.kind) {
    case "placeholder":
      return (
        <figure>
          <div
            className="cs-media cs-ph"
            style={{ aspectRatio: figure.aspect }}
            role="img"
            aria-label={`Image to come: ${figure.need}`}
          >
            <p className="ty-small ty-dim">Photo needed: {figure.need}</p>
          </div>
          {cap}
        </figure>
      );
    case "image":
      return (
        <figure>
          <div className="cs-media" style={{ aspectRatio: figure.aspect }}>
            {/* Plain <img>: the static export has no image optimizer, and
                every public/ path goes through asset() for the basePath. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(figure.src)} alt={figure.alt} />
          </div>
          {cap}
        </figure>
      );
    case "video":
      // A film has sound and the site's player; a loop plays itself,
      // muted.
      return (
        <figure>
          {figure.mode === "film" ? (
            <Suspense
              fallback={
                <div
                  className="cs-media"
                  style={{ aspectRatio: figure.aspect }}
                />
              }
            >
              <FilmPlayer
                src={figure.src}
                poster={figure.poster}
                aspect={figure.aspect}
              />
            </Suspense>
          ) : (
            <div className="cs-media" style={{ aspectRatio: figure.aspect }}>
              <video
                src={asset(figure.src)}
                poster={figure.poster && asset(figure.poster)}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
          )}
          {cap}
        </figure>
      );
    case "demo":
      return (
        <figure>
          <DemoShell
            demo={figure.demo}
            title={figure.title}
            variant={figure.variant}
            query={figure.query}
            autoload
          />
          {cap}
        </figure>
      );
  }
}
