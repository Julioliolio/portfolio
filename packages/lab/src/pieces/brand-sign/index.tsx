"use client";

import { useState, type MouseEvent, type Ref } from "react";
import { asset } from "../../asset";
import { BENCH_CSS, CopyValues, Group, btn, type Field } from "../../bench";
import {
  BrandStyles,
  resetBrandTuning,
  setBrandTuning,
  useBrandTuning,
  type BrandTuning,
} from "../../brand";

/**
 * The brand plate — the small "Julio(liolio)" lightbox, the site's home
 * mark, fixed in the upper-left (see ../../brand for where and how big).
 * A link home: on the landing it scrolls back up to the hello screen,
 * on a project page it is a link to the landing. It stamps in with the
 * site's drop (`entrance`), or is put there by the sign's travel with
 * no entrance of its own, the plate simply being there once the
 * travelling sign has landed (`shown`, flipped by the landing). Under
 * the pointer it lights up: a photo of it switched on, cut in over it.
 *
 * The bench (/lab/brand-sign, `controls`): the plate in its corner with
 * the knobs floating over it — its size, its place, its shadow — and a
 * button to drop it in again.
 */

const PLATE = asset("/brand/front.webp");
/** The same lightbox switched on, over the plate while it's hovered. */
const LIT = asset("/brand/lit.webp");

const PLACE: Field<BrandTuning>[] = [
  {
    key: "height",
    label: "Height",
    min: 3,
    max: 16,
    step: 0.1,
    unit: "vh",
    hint: "the plate's height; its width follows the photo",
  },
  {
    key: "top",
    label: "Down",
    min: 0,
    max: 12,
    step: 0.1,
    unit: "vh",
    hint: "its top edge from the screen's",
  },
  {
    key: "left",
    label: "In",
    min: 0,
    max: 12,
    step: 0.1,
    unit: "vw",
    hint: "its left edge from the screen's — the window rail's inset lines up with it",
  },
  {
    key: "gap",
    label: "Gap",
    min: 0,
    max: 60,
    step: 1,
    unit: "px",
    hint: "the room under it before a page's contents",
  },
];

const SHADOW: Field<BrandTuning>[] = [
  { key: "shadowX", label: "Across", min: -20, max: 20, step: 0.5, unit: "%" },
  { key: "shadowY", label: "Down", min: -20, max: 20, step: 0.5, unit: "%" },
  { key: "shadowBlur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "%" },
  { key: "shadowAlpha", label: "Dark", min: 0, max: 1, step: 0.01 },
];

export default function BrandSign({
  controls = true,
  href = asset("/"),
  onClick,
  shown = true,
  entrance = true,
  replay = 0,
  ref,
}: {
  /** Show the bench's knobs. */
  controls?: boolean;
  /** Where home is. */
  href?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  /** Out of sight, but in place (the landing measures it for the
   *  travel, and shows it once the sign has landed). */
  shown?: boolean;
  /** Stamp in on mount (and on every `replay` bump). Off for a plate
   *  the travel puts there. */
  entrance?: boolean;
  replay?: number;
  ref?: Ref<HTMLAnchorElement>;
}) {
  const values = useBrandTuning();
  const [run, setRun] = useState(0);

  return (
    <>
      <BrandStyles />
      <a
        key={`${replay}-${run}`}
        ref={ref}
        href={href}
        onClick={onClick}
        aria-label="Home"
        data-cursor-label="home"
        className={[
          "brand-sign",
          "sm-hover-lift",
          "sm-press",
          entrance && "brand-enter",
          !shown && "is-hidden",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized WebP; the Next optimizer adds nothing here */}
        <img
          src={PLATE}
          alt="Julio(liolio) — the way home"
          draggable={false}
          decoding="async"
          fetchPriority="low"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- as above */}
        <img
          className="brand-lit"
          src={LIT}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="low"
        />
      </a>
      {controls && (
        <div className="bench-panel">
          <style>{BENCH_CSS}</style>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <strong>Brand plate</strong>
            <button
              type="button"
              style={btn}
              onClick={() => setRun((r) => r + 1)}
            >
              ▶ Drop in again
            </button>
          </div>
          <Group
            title="Place"
            fields={PLACE}
            values={values}
            set={setBrandTuning}
          />
          <Group
            title="Shadow"
            fields={SHADOW}
            values={values}
            set={setBrandTuning}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
            }}
          >
            <button type="button" style={btn} onClick={resetBrandTuning}>
              Reset
            </button>
            <CopyValues values={values} />
          </div>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.6, lineHeight: 1.5 }}>
            Applies to the site in this browser until Reset. Lock it in by
            pasting into BRAND_DEFAULTS in packages/lab/src/brand.tsx.
          </p>
        </div>
      )}
    </>
  );
}
