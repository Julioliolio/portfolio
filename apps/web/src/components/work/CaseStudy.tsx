"use client";

import { asset } from "@portfolio/lab/asset";
import { Enter, MOTION_DEFAULTS } from "@portfolio/lab/motion";
import { useWindowScroller } from "@portfolio/lab/window";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { DemoShell } from "@/components/demo/DemoShell";
import {
  projectAfter,
  type Block,
  type Figure,
  type Project,
  type Section,
} from "@/content/projects";

/**
 * The case-study page: one template for the three projects, fed by a
 * content module (src/content/projects). It is the page inside the
 * project window (@portfolio/lab/window) on the landing, and the whole
 * page at /work/<slug>.
 *
 * The shape is estrellagracia.com's case studies (measured 2026-09-17,
 * wavn2 and niva): one 800px reading column, the hero first, a blue
 * eyebrow over the title, the intro, a four-column block of label/value
 * metadata, then sections — each with a numbered eyebrow, a heading that
 * reads as a sentence, body text at a measure — and media between them:
 * rounded, frameless, full column or in captioned rows, plus a scope
 * timeline, a drag carousel that bleeds past the column, and a next
 * case study on a card in the next project's colour. A rail of the
 * sections sits sticky to the column's left where the page is wide
 * enough (a container query on the window's card, so it appears when
 * the window is expanded); narrower, the long pages get their numbered
 * list after the header instead. From yichenxie.com: the sections'
 * numbering and the space around everything.
 *
 * It wears the site's own clothes, in one family: PP Neue Montreal
 * throughout, the mono cut for eyebrows and labels, the ink and the
 * rope's blue from the road signs, and the stop-motion entrances from
 * @portfolio/lab/motion — the header stamps in on a stagger at mount,
 * and each block plays its cut as it scrolls into view inside the
 * window's scroller.
 *
 * Images are not here yet. A `placeholder` figure renders a grey box
 * that says, in the box, which photo belongs there; the content modules
 * describe every one. Swap the figure's kind when the photo exists.
 */

/** The site's ink: headings. */
const INK = "#2b2722";
/** Body text, captions, metadata values. */
const MUTED = "#57514a";
/** The rail's resting items, the timeline's months. */
const FAINT = "#8a847c";
/** The rope's blue: eyebrows, links, the active rail item. */
const BLUE = "#2f6df6";
/** The blue at a tenth: the active rail pill. */
const PALE = "rgba(47, 109, 246, 0.1)";
/** A placeholder's grey. */
const GREY = "#ecebe8";
/** The timeline's card. */
const CARD = "#f4f3f0";
/** The reading column and the rail beside it. */
const COL = 800;
const RAIL = 140;
const RAIL_GAP = 40;
/** From this container width the rail sits beside the column. */
const WIDE = 1100;

const CSS = `
.cs { --cs-gutter: clamp(20px, 4cqw, 56px); --cs-bleed: calc((100cqw - min(${COL}px, 100cqw)) / 2 + var(--cs-gutter)); container-type: inline-size; color: ${INK}; padding: 64px var(--cs-gutter) 14vh; }
.cs a { color: inherit; text-decoration: none; }
.cs-mono { font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; font-weight: 500; font-size: 11px; line-height: 1; letter-spacing: .1em; text-transform: uppercase; }
/* The body: the column, centred, with the rail's column to its left
   once there is room for both. */
.cs-body { display: grid; grid-template-columns: minmax(0, ${COL}px); justify-content: center; column-gap: ${RAIL_GAP}px; }
.cs-col { min-width: 0; }
.cs-rail { display: none; }
@container (min-width: ${WIDE}px) {
  .cs { --cs-bleed: calc((100cqw - ${RAIL + RAIL_GAP + COL}px) / 2 + var(--cs-gutter)); }
  .cs-body { grid-template-columns: ${RAIL}px minmax(0, ${COL}px); }
  .cs-rail { display: block; position: sticky; top: 24px; align-self: start; }
  .cs-toc { display: none; }
}
.cs-rail ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.cs-rail a { display: block; padding: 6px 10px; border-radius: 999px; font-size: 13px; line-height: 1.3; letter-spacing: -.005em; color: ${FAINT}; transition: color .12s steps(2, end); }
.cs-rail a:hover { color: ${INK}; }
.cs-rail a.is-active { background: ${PALE}; color: ${BLUE}; }

/* The top bar, on the page of its own: the way home. */
.cs-bar { margin: -24px 0 28px; color: ${BLUE}; }
.cs-bar a { display: inline-flex; align-items: center; gap: 8px; }
.cs-bar svg { display: block; width: 12px; height: 12px; }

/* The header: the hero, the eyebrow, the title, the intro, the
   metadata in columns under a hairline. */
.cs-hero { margin: 0 0 32px; }
.cs-kicker { color: ${BLUE}; }
.cs-title { margin: 10px 0 0; font-weight: 600; font-size: clamp(34px, 4.6cqw, 46px); line-height: 1.04; letter-spacing: -.03em; }
.cs-intro { margin: 14px 0 0; max-width: 640px; color: ${MUTED}; font-size: 17px; line-height: 1.4; letter-spacing: -.01em; }
.cs-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 18px 20px; margin: 32px 0 0; padding-top: 22px; border-top: 1px solid rgba(43, 39, 34, .12); }
.cs-meta div { display: grid; gap: 7px; align-content: start; }
.cs-meta dt { color: ${INK}; }
.cs-meta dd { margin: 0; color: ${MUTED}; font-size: 14px; line-height: 1.4; letter-spacing: -.005em; }
.cs-meta dd a { color: ${BLUE}; }

/* Contents: numbered, in the mono cut, on the long pages when there is
   no rail. */
.cs-toc { margin: 56px 0 0; }
.cs-toc ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.cs-toc li { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: baseline; }
.cs-toc a { font-size: 15px; line-height: 1.3; letter-spacing: -.01em; }
.cs-toc a:hover { color: ${BLUE}; }
.cs-toc .cs-mono { color: ${BLUE}; }

/* Sections: the numbered eyebrow, a heading that reads as a sentence,
   body at a measure. */
.cs-section { margin-top: clamp(72px, 9cqw, 104px); scroll-margin-top: 24px; }
.cs-eyebrow { color: ${BLUE}; }
.cs-h { margin: 10px 0 18px; max-width: 620px; font-weight: 600; font-size: clamp(22px, 2.6cqw, 26px); line-height: 1.2; letter-spacing: -.02em; }
.cs-p { margin: 0 0 18px; max-width: 600px; color: ${MUTED}; font-size: 15px; line-height: 1.55; letter-spacing: -.005em; }
.cs-lede { margin: 0 0 22px; max-width: 640px; color: ${INK}; font-size: 19px; line-height: 1.4; letter-spacing: -.012em; }
.cs-list { margin: 4px 0 22px; padding: 0; max-width: 620px; list-style: none; counter-reset: cs; display: grid; gap: 14px; }
.cs-list li { position: relative; padding-left: 36px; color: ${MUTED}; font-size: 15px; line-height: 1.55; letter-spacing: -.005em; }
.cs-list li::before { position: absolute; left: 0; top: .4em; color: ${BLUE}; font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; font-weight: 500; font-size: 11px; letter-spacing: .06em; }
.cs-list.is-numbered li { counter-increment: cs; }
.cs-list.is-numbered li::before { content: counter(cs, decimal-leading-zero); }
.cs-list.is-bulleted li::before { content: "—"; }
.cs-list b { color: ${INK}; font-weight: 600; }
.cs-quote { margin: 8px 0 26px; max-width: 640px; padding-left: 20px; border-left: 2px solid ${BLUE}; }
.cs-quote p { margin: 0; font-size: 21px; line-height: 1.3; letter-spacing: -.015em; }
.cs-quote cite { display: block; margin-top: 10px; color: ${FAINT}; font-style: normal; font-size: 13px; }

/* Media: rounded and frameless, full column or in rows; each with its
   caption under it. */
.cs-fig { margin: 8px 0 32px; }
.cs-figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 16px; align-items: start; margin: 8px 0 32px; }
.cs-figs.is-tall { grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); }
.cs-media { position: relative; width: 100%; overflow: hidden; border-radius: 12px; background: ${GREY}; }
.cs-media img, .cs-media video { display: block; width: 100%; height: 100%; object-fit: cover; }
.cs-media video { background: #000; }
.cs-cap { margin: 10px 0 0; color: ${FAINT}; font-size: 13px; line-height: 1.4; letter-spacing: -.005em; }
/* The grey box: what goes here, said in the box. Dashed so it never
   passes for a finished frame. */
.cs-ph { display: grid; align-content: start; gap: 10px; padding: 14px; outline: 1px dashed rgba(47, 109, 246, .55); outline-offset: -1px; }
.cs-ph-tag { display: inline-flex; width: max-content; align-items: center; min-height: 20px; padding: 3px 7px; border: 1px solid ${BLUE}; border-radius: 999px; color: ${BLUE}; }
.cs-ph p { margin: 0; color: ${MUTED}; font-size: 13px; line-height: 1.4; }
/* Demos keep DemoShell's own frame; the caption sits under it. */
.cs-demo { margin: 8px 0 32px; }

/* The timeline: months across the top, a bar per phase. */
.cs-tl { margin: 8px 0 32px; padding: 18px 20px 16px; border-radius: 12px; background: ${CARD}; }
.cs-tl-months, .cs-tl-row { display: grid; grid-template-columns: minmax(96px, 180px) 1fr; align-items: center; }
.cs-tl-months { margin-bottom: 8px; }
.cs-tl-scale { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; color: ${FAINT}; }
.cs-tl-scale span { font-size: 10px; letter-spacing: .08em; }
.cs-tl-row + .cs-tl-row { margin-top: 8px; }
.cs-tl-label { padding-right: 12px; color: ${INK}; font-size: 13px; line-height: 1.3; letter-spacing: -.005em; }
.cs-tl-track { position: relative; height: 22px; background-image: linear-gradient(to right, rgba(43, 39, 34, .1) 1px, transparent 1px); background-size: var(--cs-tl-month) 100%; }
.cs-tl-bar { position: absolute; top: 0; bottom: 0; border-radius: 999px; background: ${BLUE}; }
.cs-tl-note { margin: 14px 0 0; color: ${FAINT}; font-size: 13px; line-height: 1.4; }

/* The carousel: a row wider than the column, out to the card's edge,
   dragged through. */
.cs-carousel { margin: 8px 0 32px; }
.cs-carousel-row { display: flex; gap: 16px; align-items: flex-start; width: calc(100% + var(--cs-bleed)); padding-right: var(--cs-bleed); overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; cursor: grab; touch-action: pan-y; }
.cs-carousel-row::-webkit-scrollbar { display: none; }
.cs-carousel-row.is-dragging { cursor: grabbing; scroll-snap-type: none; }
.cs-carousel-row.is-dragging * { pointer-events: none; }
/* Each figure sits in its entrance wrapper, which is the row's item. */
.cs-carousel-row > * { flex: none; width: min(360px, 78%); scroll-snap-align: start; }
.cs-carousel-row figure { margin: 0; }
.cs-carousel-hint { margin: 10px 0 0; color: ${BLUE}; }

/* The foot: the next case study on a card in its colour, and the way
   home. */
.cs-foot { margin-top: clamp(80px, 10cqw, 120px); }
.cs-next { display: grid; place-items: center; height: 180px; margin-top: 12px; border-radius: 32px; background: linear-gradient(135deg, var(--cs-accent), color-mix(in oklab, var(--cs-accent) 55%, white)); }
.cs-next-pill { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 18px; border-radius: 999px; background: #fff; color: ${INK}; font-size: 14px; letter-spacing: -.01em; transition: transform .16s steps(2, end); }
.cs-next:hover .cs-next-pill { transform: translateY(-3px); }
.cs-next-pill svg { width: 12px; height: 12px; }
.cs-next-tag { margin: 12px 0 0; color: ${MUTED}; font-size: 14px; line-height: 1.4; }
.cs-home { display: inline-flex; align-items: center; gap: 8px; margin-top: 36px; color: ${BLUE}; }
.cs-home svg { display: block; width: 12px; height: 12px; }
@media (prefers-reduced-motion: reduce) { .cs-next-pill, .cs-rail a { transition: none; } }
`;

const ARROW_LEFT = (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M7.5 1.5 3 6l4.5 4.5M3 6h8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

const ARROW_RIGHT = (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M4.5 1.5 9 6l-4.5 4.5M9 6H1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

/** The beat between the header's parts, from the motion defaults — the
 *  server can't read the bench's store, and the header plays at mount. */
const STEP = MOTION_DEFAULTS.stagger;
const LEAD = MOTION_DEFAULTS.lead;

const two = (i: number) => String(i + 1).padStart(2, "0");

export function CaseStudy({
  project,
  home = false,
}: {
  project: Project;
  /** The page of its own: show the way home at the top and foot. In
   *  the window the pills and the close are the navigation. */
  home?: boolean;
}) {
  const next = projectAfter(project.slug);
  const scroller = useWindowScroller();
  const active = useActiveSection(
    project.sections.map((s) => s.id),
    scroller,
  );

  // A rail or contents click scrolls the window's scroller, not the
  // page behind it.
  function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ block: "start" });
  }

  return (
    <article
      className="cs"
      style={{ "--cs-accent": next.accent } as CSSProperties}
    >
      <style>{CSS}</style>

      <div className="cs-body">
        <nav className="cs-rail" aria-label="Sections">
          <ol>
            {project.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={s.id === active ? "is-active" : undefined}
                  aria-current={s.id === active ? "location" : undefined}
                  onClick={(e) => jump(e, s.id)}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="cs-col">
          {home && (
            <nav className="cs-bar cs-mono" aria-label="Site">
              <a href={asset("/")} data-cursor-label="home">
                {ARROW_LEFT}
                Julio Romero
              </a>
            </nav>
          )}

          <header className="cs-head">
            <Enter kind="pop" gate="mount" delay={LEAD}>
              <FigureView figure={project.hero} className="cs-hero" />
            </Enter>
            <Enter kind="slide" gate="mount" delay={LEAD + STEP}>
              <p className="cs-kicker cs-mono">{project.kicker}</p>
            </Enter>
            <Enter kind="stamp" gate="mount" delay={LEAD + 2 * STEP}>
              <h1 className="cs-title">{project.title}</h1>
            </Enter>
            <Enter kind="drop" gate="mount" delay={LEAD + 3 * STEP}>
              <p className="cs-intro">{project.tagline}</p>
            </Enter>
            <Enter kind="rule" gate="mount" delay={LEAD + 4 * STEP}>
              <dl className="cs-meta">
                {project.meta.map((m) => (
                  <div key={m.label}>
                    <dt className="cs-mono">{m.label}</dt>
                    <dd>
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
                    </dd>
                  </div>
                ))}
              </dl>
            </Enter>
          </header>

          {project.contents && (
            <nav className="cs-toc" aria-label="Contents">
              <ol>
                {project.sections.map((s, i) => (
                  <Enter kind="slide" as="li" key={s.id} delay={i * 40}>
                    <span className="cs-mono">{two(i)}</span>
                    <a href={`#${s.id}`} onClick={(e) => jump(e, s.id)}>
                      {s.heading}
                    </a>
                  </Enter>
                ))}
              </ol>
            </nav>
          )}

          {project.sections.map((s, i) => (
            <SectionView key={s.id} section={s} index={i} />
          ))}

          <footer className="cs-foot">
            <Enter kind="rule">
              <span className="cs-mono cs-eyebrow">Next case study</span>
            </Enter>
            <Enter kind="pop" delay={STEP}>
              <a
                href={asset(`/work/${next.slug}/`)}
                className="cs-next"
                data-cursor-label="next"
                aria-label={`Next case study: ${next.title}`}
              >
                <span className="cs-next-pill font-medium">
                  {next.title}
                  {ARROW_RIGHT}
                </span>
              </a>
              <p className="cs-next-tag">{next.tagline}</p>
            </Enter>
            {home && (
              <Enter kind="slide" delay={2 * STEP}>
                <a
                  href={asset("/")}
                  className="cs-home cs-mono"
                  data-cursor-label="home"
                >
                  {ARROW_LEFT}
                  Back to the signs
                </a>
              </Enter>
            )}
          </footer>
        </div>
      </div>
    </article>
  );
}

/**
 * Which section the reader is in: the last one whose top has crossed
 * a line a third of the way down the scroller (the window's card, or
 * the viewport). Read on every scroll, and once at mount.
 */
function useActiveSection(ids: string[], scroller: HTMLElement | null) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join("|");
  useEffect(() => {
    const target: HTMLElement | Window = scroller ?? window;
    let raf = 0;
    const read = () => {
      raf = 0;
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const line =
        top + (scroller ? scroller.clientHeight : window.innerHeight) * 0.33;
      let current: string | null = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the ids as one key
  }, [key, scroller]);
  return active;
}

function SectionView({ section, index }: { section: Section; index: number }) {
  return (
    <section className="cs-section" id={section.id}>
      <Enter kind="slide">
        <p className="cs-eyebrow cs-mono">
          {two(index)} · {section.label}
        </p>
      </Enter>
      <Enter kind="stamp" delay={STEP}>
        <h2 className="cs-h">{section.heading}</h2>
      </Enter>
      {section.blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </section>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return (
        <Enter kind="slide" as="p" className="cs-p">
          {block.text}
        </Enter>
      );
    case "lede":
      return (
        <Enter kind="drop" as="p" className="cs-lede">
          {block.text}
        </Enter>
      );
    case "list":
      return (
        <ol className={`cs-list is-${block.style}`}>
          {block.items.map((item, i) => (
            <Enter kind="slide" as="li" key={i} delay={i * 60}>
              <b>{item.title}</b> {item.body}
            </Enter>
          ))}
        </ol>
      );
    case "quote":
      return (
        <Enter kind="unfold" as="blockquote" className="cs-quote">
          <p>{block.text}</p>
          {block.source && <cite>{block.source}</cite>}
        </Enter>
      );
    case "figure":
      return (
        <Enter kind="pop">
          <FigureView figure={block.figure} className="cs-fig" />
        </Enter>
      );
    case "figures": {
      const tall = block.figures.every(
        (f) => f.kind !== "demo" && f.aspect < 1,
      );
      return (
        <div className={tall ? "cs-figs is-tall" : "cs-figs"}>
          {block.figures.map((f, i) => (
            <Enter kind="pop" key={i} delay={i * 60}>
              <FigureView figure={f} />
            </Enter>
          ))}
        </div>
      );
    }
    case "timeline": {
      const count = block.months.length;
      const pct = (v: number) => `${(v / count) * 100}%`;
      return (
        <Enter kind="unfold">
          <div
            className="cs-tl"
            style={{ "--cs-tl-month": pct(1) } as CSSProperties}
          >
            <div className="cs-tl-months" aria-hidden="true">
              <span />
              <div className="cs-tl-scale cs-mono">
                {block.months.map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </div>
            </div>
            {block.phases.map((p) => (
              <div className="cs-tl-row" key={p.label}>
                <span className="cs-tl-label">{p.label}</span>
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
            {block.note && <p className="cs-tl-note">{block.note}</p>}
          </div>
        </Enter>
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
          <Enter kind="pop" key={i} delay={i * 60}>
            <FigureView figure={f} />
          </Enter>
        ))}
      </div>
      {hint && <p className="cs-carousel-hint cs-mono">{hint} →</p>}
    </div>
  );
}

function FigureView({
  figure,
  className,
}: {
  figure: Figure;
  className?: string;
}) {
  const style = className ? undefined : { margin: 0 };
  const cap = figure.caption && (
    <figcaption className="cs-cap">{figure.caption}</figcaption>
  );
  switch (figure.kind) {
    case "placeholder":
      return (
        <figure className={className} style={style}>
          <div
            className="cs-media cs-ph"
            style={{ aspectRatio: figure.aspect }}
            role="img"
            aria-label={`Image to come: ${figure.need}`}
          >
            <span className="cs-ph-tag cs-mono">Photo needed</span>
            <p>{figure.need}</p>
          </div>
          {cap}
        </figure>
      );
    case "image":
      return (
        <figure className={className} style={style}>
          <div className="cs-media" style={{ aspectRatio: figure.aspect }}>
            {/* Plain <img>: the static export has no image optimizer, and
                every public/ path goes through asset() for the basePath. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(figure.src)} alt={figure.alt} />
          </div>
          {cap}
        </figure>
      );
    case "video": {
      // A film has controls and sound; a loop plays itself, muted.
      const loop = figure.mode === "loop";
      return (
        <figure className={className} style={style}>
          <div className="cs-media" style={{ aspectRatio: figure.aspect }}>
            <video
              src={asset(figure.src)}
              poster={figure.poster && asset(figure.poster)}
              controls={!loop}
              autoPlay={loop}
              muted={loop}
              loop={loop}
              playsInline
              preload="metadata"
            />
          </div>
          {cap}
        </figure>
      );
    }
    case "demo":
      return (
        <figure className={className ?? "cs-demo"} style={style}>
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
