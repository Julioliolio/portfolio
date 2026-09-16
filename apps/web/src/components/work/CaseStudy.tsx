import type { Route } from "next";
import Link from "next/link";
import { asset } from "@portfolio/lab/asset";
import { Enter, MOTION_DEFAULTS } from "@portfolio/lab/motion";
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
 * content module (src/content/projects). The shape follows the long-form
 * pages Julio pointed at (estrellagracia.com, 2026-09-15): a title, a
 * one-line tagline, a block of label/value metadata, the hero, a table of
 * contents for the long ones, sections with sentence-style headings and
 * media in between, and a "next case study" at the foot.
 *
 * It wears the site's own clothes rather than the Tailwind defaults the
 * stubs had: the warm wall, the ink and the rope blue from the road
 * signs, PP Neue Montreal with the mono cut for labels, and the
 * stop-motion entrances from @portfolio/lab/motion on everything that
 * appears — the header drops in on a stagger at mount, and each block
 * plays its cut as it scrolls into view. The clay cursor reads the
 * data-cursor-label tags on the two navigation links.
 *
 * Images are not here yet. A `placeholder` figure renders a grey box
 * that says, in the box, which photo belongs there; the content modules
 * describe every one. Swap the figure's kind when the photo exists.
 */

/** The site's ink: headings and body. */
const INK = "#2b2722";
/** Captions, metadata values, the tagline. */
const MUTED = "#57514a";
/** The rope's blue: links, rules, the placeholder's outline. */
const BLUE = "#2f6df6";
/** The wall. */
const WALL = "#faf9f6";
/** A placeholder's grey — the card media's loading colour. */
const GREY = "#ecebe8";

const CSS = `
.cs { color: ${INK}; padding: 0 clamp(20px, 4vw, 56px) 12vh; }
/* The column: text at a reading measure, media out to the page's edge. */
.cs-col { width: 100%; max-width: 720px; margin: 0 auto; }
.cs-wide { width: 100%; max-width: 1080px; margin: 0 auto; }
.cs a { color: inherit; text-decoration: none; }

/* The top bar: home on the left, the project's name on the right, in
   the mono cut the cursor's label uses. */
.cs-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 22px 0; }
.cs-mono { font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; font-weight: 500; font-size: 11px; line-height: 1; letter-spacing: .08em; text-transform: uppercase; }
.cs-bar a { display: inline-flex; align-items: center; gap: 8px; color: ${BLUE}; padding: 6px 0; }
.cs-bar a svg { display: block; width: 12px; height: 12px; }
.cs-bar span { color: ${MUTED}; }

/* The header: the title as big as the wall allows, the tagline under
   it, then the metadata as label/value rows. */
.cs-head { padding: clamp(24px, 6vh, 64px) 0 clamp(28px, 5vh, 48px); }
.cs-title { margin: 0; font-weight: 600; font-size: clamp(48px, 9vw, 112px); line-height: .95; letter-spacing: -.03em; }
.cs-tagline { margin: 18px 0 0; max-width: 20ch; color: ${MUTED}; font-weight: 400; font-size: clamp(22px, 2.6vw, 32px); line-height: 1.2; letter-spacing: -.015em; }
.cs-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px 32px; margin: clamp(28px, 5vh, 48px) 0 0; padding-top: 22px; border-top: 1px solid ${BLUE}; }
.cs-meta div { display: grid; gap: 8px; }
.cs-meta dt { color: ${BLUE}; }
.cs-meta dd { margin: 0; font-size: 16px; line-height: 1.35; letter-spacing: -.01em; }
.cs-meta dd a { color: ${BLUE}; }

/* Contents: numbered, in the mono cut, on the long pages only. */
.cs-toc { margin: clamp(40px, 7vh, 72px) auto 0; }
.cs-toc ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.cs-toc li { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: baseline; }
.cs-toc a { font-size: 17px; line-height: 1.3; letter-spacing: -.012em; }
.cs-toc a:hover { color: ${BLUE}; }
.cs-toc .cs-mono { color: ${BLUE}; }

/* Sections: a heading that reads as a sentence, the text at 18px. */
.cs-section { margin-top: clamp(56px, 10vh, 112px); scroll-margin-top: 32px; }
.cs-h { margin: 0 0 26px; font-weight: 600; font-size: clamp(28px, 3.4vw, 40px); line-height: 1.08; letter-spacing: -.025em; }
.cs-p { margin: 0 0 22px; font-size: 18px; line-height: 1.5; letter-spacing: -.008em; }
.cs-lede { margin: 0 0 26px; font-size: clamp(20px, 2vw, 24px); line-height: 1.35; letter-spacing: -.015em; }
.cs-list { margin: 4px 0 26px; padding: 0; list-style: none; counter-reset: cs; display: grid; gap: 18px; }
.cs-list li { position: relative; padding-left: 40px; font-size: 18px; line-height: 1.5; letter-spacing: -.008em; }
.cs-list li::before { position: absolute; left: 0; top: .35em; color: ${BLUE}; font-family: var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace; font-weight: 500; font-size: 12px; letter-spacing: .06em; }
.cs-list.is-numbered li { counter-increment: cs; }
.cs-list.is-numbered li::before { content: counter(cs, decimal-leading-zero); }
.cs-list.is-bulleted li::before { content: "—"; }
.cs-list b { font-weight: 600; }
.cs-quote { margin: 8px 0 30px; padding-left: 22px; border-left: 2px solid ${BLUE}; }
.cs-quote p { margin: 0; font-size: clamp(22px, 2.2vw, 28px); line-height: 1.25; letter-spacing: -.02em; }
.cs-quote cite { display: block; margin-top: 12px; color: ${MUTED}; font-style: normal; }

/* Figures: full column, or a row that wraps on a phone. A hairline in
   the rope's blue around media, as on the road-sign cards. */
.cs-fig { margin: 8px auto 34px; }
.cs-figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px; align-items: start; margin: 8px auto 34px; }
/* A row of phone screens: narrower columns, centred, so three portrait
   frames don't tower over the text. */
.cs-figs.is-tall { grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 280px)); justify-content: center; }
.cs-media { position: relative; width: 100%; overflow: hidden; background: ${GREY}; outline: 1px solid ${BLUE}; outline-offset: -1px; }
.cs-media img, .cs-media video { display: block; width: 100%; height: 100%; object-fit: cover; }
.cs-media video { background: #000; }
.cs-cap { margin: 10px 0 0; color: ${MUTED}; font-size: 14px; line-height: 1.4; letter-spacing: -.005em; }
/* The grey box: what goes here, said in the box. Dashed so it never
   passes for a finished frame. */
.cs-ph { display: grid; align-content: start; gap: 12px; padding: 16px; outline-style: dashed; }
.cs-ph-tag { display: inline-flex; width: max-content; align-items: center; min-height: 22px; padding: 4px 8px; border: 1px solid ${BLUE}; border-radius: 999px; color: ${BLUE}; }
.cs-ph p { margin: 0; color: ${MUTED}; font-size: 14px; line-height: 1.4; letter-spacing: -.005em; }
/* Demos keep DemoShell's own frame; the caption sits under it. */
.cs-demo { margin: 8px auto 34px; }

/* The foot: the next case study, big, and the way home. */
.cs-foot { margin-top: clamp(72px, 14vh, 140px); padding-top: 26px; border-top: 1px solid ${BLUE}; }
.cs-foot .cs-mono { color: ${BLUE}; }
.cs-next { display: inline-flex; align-items: baseline; gap: .3em; margin-top: 14px; font-weight: 600; font-size: clamp(40px, 7vw, 88px); line-height: 1; letter-spacing: -.03em; }
.cs-next svg { width: .55em; height: .55em; flex: none; transition: transform .17s steps(2); }
.cs-next:hover svg { transform: translateX(.15em); }
.cs-next-tag { display: block; margin-top: 12px; color: ${MUTED}; font-size: 18px; line-height: 1.4; letter-spacing: -.01em; }
.cs-home { display: inline-flex; align-items: center; gap: 8px; margin-top: 40px; color: ${BLUE}; }
.cs-home svg { display: block; width: 12px; height: 12px; }
@media (prefers-reduced-motion: reduce) { .cs-next svg { transition: none; } }
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

export function CaseStudy({ project }: { project: Project }) {
  const next = projectAfter(project.slug);

  return (
    <main className="cs">
      {/* The wall, on the root so nothing dark shows on overscroll. */}
      <style>{`html { background: ${WALL}; } body { background: ${WALL}; color: ${INK}; }`}</style>
      <style>{CSS}</style>

      <div className="cs-wide">
        <nav className="cs-bar cs-mono" aria-label="Site">
          <Link href="/" data-cursor-label="home">
            {ARROW_LEFT}
            Julio Romero
          </Link>
          <span>{project.title}</span>
        </nav>

        <header className="cs-head">
          <Enter kind="stamp" gate="mount" delay={LEAD}>
            <h1 className="cs-title">{project.title}</h1>
          </Enter>
          <Enter kind="drop" gate="mount" delay={LEAD + STEP}>
            <p className="cs-tagline">{project.tagline}</p>
          </Enter>
          <Enter kind="rule" gate="mount" delay={LEAD + 2 * STEP}>
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

        <Enter kind="pop" gate="mount" delay={LEAD + 3 * STEP}>
          <FigureView figure={project.hero} wide />
        </Enter>
      </div>

      {project.contents && (
        <nav className="cs-col cs-toc" aria-label="Contents">
          <ol>
            {project.sections.map((s, i) => (
              <Enter kind="slide" as="li" key={s.id} delay={i * 40}>
                <span className="cs-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a href={`#${s.id}`}>{s.heading}</a>
              </Enter>
            ))}
          </ol>
        </nav>
      )}

      {project.sections.map((s) => (
        <SectionView key={s.id} section={s} />
      ))}

      <footer className="cs-wide cs-foot">
        <Enter kind="rule">
          <span className="cs-mono">Next case study</span>
        </Enter>
        <Enter kind="stamp" delay={STEP}>
          <Link
            href={`/work/${next.slug}` as Route}
            className="cs-next"
            data-cursor-label="next"
          >
            {next.title}
            {ARROW_RIGHT}
          </Link>
          <span className="cs-next-tag">{next.tagline}</span>
        </Enter>
        <Enter kind="slide" delay={2 * STEP}>
          <Link href="/" className="cs-home cs-mono" data-cursor-label="home">
            {ARROW_LEFT}
            Back to the signs
          </Link>
        </Enter>
      </footer>
    </main>
  );
}

function SectionView({ section }: { section: Section }) {
  return (
    <section className="cs-section" id={section.id}>
      <div className="cs-col">
        <Enter kind="stamp">
          <h2 className="cs-h">{section.heading}</h2>
        </Enter>
      </div>
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
        <div className="cs-col">
          <Enter kind="slide" as="p" className="cs-p">
            {block.text}
          </Enter>
        </div>
      );
    case "lede":
      return (
        <div className="cs-col">
          <Enter kind="drop" as="p" className="cs-lede">
            {block.text}
          </Enter>
        </div>
      );
    case "list":
      return (
        <div className="cs-col">
          <ol className={`cs-list is-${block.style}`}>
            {block.items.map((item, i) => (
              <Enter kind="slide" as="li" key={i} delay={i * 60}>
                <b>{item.title}</b> {item.body}
              </Enter>
            ))}
          </ol>
        </div>
      );
    case "quote":
      return (
        <div className="cs-col">
          <Enter kind="unfold" as="blockquote" className="cs-quote">
            <p>{block.text}</p>
            {block.source && <cite className="cs-cap">{block.source}</cite>}
          </Enter>
        </div>
      );
    case "figure":
      return (
        <Enter kind="pop" className="cs-wide">
          <FigureView figure={block.figure} wide />
        </Enter>
      );
    case "figures": {
      const tall = block.figures.every(
        (f) => f.kind !== "demo" && f.aspect < 1,
      );
      return (
        <div className={tall ? "cs-wide cs-figs is-tall" : "cs-wide cs-figs"}>
          {block.figures.map((f, i) => (
            <Enter kind="pop" key={i} delay={i * 60}>
              <FigureView figure={f} />
            </Enter>
          ))}
        </div>
      );
    }
  }
}

function FigureView({ figure, wide }: { figure: Figure; wide?: boolean }) {
  const cls = wide ? "cs-fig" : undefined;
  switch (figure.kind) {
    case "placeholder":
      return (
        <figure className={cls} style={{ margin: wide ? undefined : 0 }}>
          <div
            className="cs-media cs-ph"
            style={{ aspectRatio: figure.aspect }}
            role="img"
            aria-label={`Image to come: ${figure.need}`}
          >
            <span className="cs-ph-tag cs-mono">Photo needed</span>
            <p>{figure.need}</p>
          </div>
          {figure.caption && (
            <figcaption className="cs-cap">{figure.caption}</figcaption>
          )}
        </figure>
      );
    case "image":
      return (
        <figure className={cls} style={{ margin: wide ? undefined : 0 }}>
          <div className="cs-media" style={{ aspectRatio: figure.aspect }}>
            {/* Plain <img>: the static export has no image optimizer, and
                every public/ path goes through asset() for the basePath. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(figure.src as `/${string}`)} alt={figure.alt} />
          </div>
          {figure.caption && (
            <figcaption className="cs-cap">{figure.caption}</figcaption>
          )}
        </figure>
      );
    case "video":
      return (
        <figure className={cls} style={{ margin: wide ? undefined : 0 }}>
          <div className="cs-media" style={{ aspectRatio: figure.aspect }}>
            {figure.mode === "film" ? (
              <video
                src={asset(figure.src as `/${string}`)}
                poster={
                  figure.poster
                    ? asset(figure.poster as `/${string}`)
                    : undefined
                }
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <video
                src={asset(figure.src as `/${string}`)}
                poster={
                  figure.poster
                    ? asset(figure.poster as `/${string}`)
                    : undefined
                }
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
          </div>
          {figure.caption && (
            <figcaption className="cs-cap">{figure.caption}</figcaption>
          )}
        </figure>
      );
    case "demo":
      return (
        <figure className="cs-demo" style={{ margin: wide ? undefined : 0 }}>
          <DemoShell
            demo={figure.demo}
            title={figure.title}
            variant={figure.variant}
            query={figure.query}
            autoload
          />
          {figure.caption && (
            <figcaption className="cs-cap">{figure.caption}</figcaption>
          )}
        </figure>
      );
  }
}
