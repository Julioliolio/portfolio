/**
 * LocalPal's figures for its project page (docs/media-plan.md), drawn
 * here in English from the thesis's data (source-assets/localpal-tfm/
 * REPORT.md) in LocalPal's own type and colours, and rendered to webp at
 * 2×. The thesis's figures are Spanish and A3-page sized; these are
 * set for a bento cell. Rendered on transparency, so a figure sits on
 * the page's paper rather than in a box of its own.
 *
 *   node scripts/make-figures.mjs [name ...]
 *
 * Also converts the thesis's storyboard frames, brand sample and
 * moodboard (extracted to source-assets/localpal-tfm/) to webp.
 */
import { existsSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url).pathname;
const OUT = `${ROOT}apps/web/public/media/localpal/`;
const TFM = `${ROOT}source-assets/localpal-tfm/`;
const FONTS = `${ROOT}apps/demos/localpal/public/fonts/`;

const C = {
  brand: "#3121FF",
  deep: "#2C1EDF",
  pressed: "#2417C4",
  lav: "#A59FFF",
  lavDim: "#968FFB",
  ink: "#001D33",
  muted: "#6F6A8D",
  paper: "#F4F2EE",
  white: "#FEFEFE",
  land: "#EDEAE3",
  water: "#C7DBEF",
  park: "#DCE6CD",
};

/** A @font-face with the font inline: a setContent page can't fetch file://. */
const face = (cut, weight) =>
  `@font-face { font-family: M; font-weight: ${weight}; src: url(data:font/otf;base64,${readFileSync(`${FONTS}PPNeueMontreal-${cut}.otf`).toString("base64")}) format("opentype"); }`;

const BASE = `
${face("Regular", 400)}
${face("Medium", 500)}
${face("SemiBold", 600)}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; }
body { font-family: M, sans-serif; font-weight: 500; color: ${C.ink}; background: transparent; -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }
.fig { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.src { font-size: 13px; color: ${C.muted}; font-weight: 400; letter-spacing: 0; }
`;

/* ---------- the figures: [name, width, height, html] ---------- */

const W = 17;
const mainstream = [.92, .90, .88, .85, .80, .75, .69, .63, .57, .50, .43, .36, .30, .26, .22, .19, .18];
const niche = [.12, .13, .14, .15, .18, .22, .27, .33, .41, .50, .61, .70, .77, .83, .87, .89, .90];

function curve(narrow = false) {
  const [w, h] = narrow ? [900, 1000] : [1600, 900];
  const [L, R, T, B] = narrow ? [96, 860, 330, 760] : [150, 1500, 210, 700];
  const x = (wk) => L + (wk / 16) * (R - L);
  const y = (v) => B - v * (B - T);
  // Catmull-Rom through the samples, as a smooth path.
  const path = (vs) => {
    const p = vs.map((v, i) => [x(i), y(v)]);
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1},${c2},${p2}`;
    }
    return d;
  };
  const ticks = [0, 4, 8, 12, 16].map((wk) => `<text x="${x(wk)}" y="${B + 40}" text-anchor="middle" class="t">${wk}</text>`).join("");
  return [w, h, `<div class="fig"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <style>text{font-family:M} .t{font-weight:500;font-size:${narrow ? 30 : 24}px;fill:${C.muted}} .l{font-weight:600;font-size:${narrow ? 36 : 30}px} .s{font-weight:500;font-size:${narrow ? 28 : 23}px;fill:${C.muted}}</style>
  <rect x="${x(6)}" y="${T - 40}" width="${x(12) - x(6)}" height="${B - T + 40}" fill="${C.lav}" opacity=".28" rx="14"/>
  <text x="${x(6) + 16}" y="${narrow ? T : B - 56}" class="l" fill="${C.brand}">LocalPal's</text>
  <text x="${x(6) + 16}" y="${narrow ? T + 38 : B - 22}" class="l" fill="${C.brand}">window</text>
  <line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${C.ink}" stroke-opacity=".25" stroke-width="2"/>
  ${[0, 4, 12, 16].map((wk) => `<text x="${x(wk)}" y="${B + 40}" text-anchor="middle" class="t">${wk}</text>`).join("")}
  <line x1="${x(9)}" y1="${y(.5) + 18}" x2="${x(9)}" y2="${B}" stroke="${C.brand}" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>
  <text x="${x(9)}" y="${B + 40}" text-anchor="middle" class="l" fill="${C.brand}">week 9</text>
  <text x="${(L + R) / 2}" y="${B + 92}" text-anchor="middle" class="s">weeks since arriving in the city</text>
  <text x="${L - 30}" y="${T + 10}" text-anchor="end" class="s">a lot</text>
  <text x="${L - 30}" y="${B}" text-anchor="end" class="s">little</text>
  <path d="${path(mainstream)}" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
  <path d="${path(niche)}" fill="none" stroke="${C.brand}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="${x(9)}" cy="${y(.5)}" r="15" fill="${C.white}" stroke="${C.brand}" stroke-width="6"/>
  ${narrow ? `
  <text x="${L - 60}" y="70" class="l" fill="${C.ink}">— The obvious plans</text>
  <text x="${L - 60}" y="108" class="s">welcome weeks, flat dinners, the big bars</text>
  <text x="${L - 60}" y="170" class="l" fill="${C.brand}">— The specific ones, and company</text>
  <text x="${L - 60}" y="208" class="s">a climbing partner, a small show, a Sunday run</text>` : `
  <text x="${x(0)}" y="${y(.92) - 74}" class="l" fill="${C.ink}">The obvious plans</text>
  <text x="${x(0)}" y="${y(.92) - 40}" class="s">welcome weeks, flat dinners, the big bars</text>
  <text x="${x(16)}" y="${y(.9) - 74}" text-anchor="end" class="l" fill="${C.brand}">The specific ones, and someone to go with</text>
  <text x="${x(16)}" y="${y(.9) - 40}" text-anchor="end" class="s">a climbing partner, a small show, a Sunday run</text>`}
  <path d="M${x(0)},${B + 128} v-12 H${x(5.5)} v12" fill="none" stroke="${C.muted}" stroke-width="2"/>
  <text x="${x(0)}" y="${B + 166}" class="s">sign-ups happen here${narrow ? "" : ": universities, ESN, arrival networks"}</text>
  <text x="${narrow ? x(0) : x(16)}" y="${narrow ? B + 214 : B + 166}" text-anchor="${narrow ? "start" : "end"}" class="s">a model from 6 interviews and 526 posts, not a measurement</text>
</svg></div>`];
}

function moment() {
  const cards = [
    ["35%", "of Europeans feel lonely at least some of the time", "JRC, 25,646 people", C.brand, C.white],
    ["−37%", "nightclubs in the UK, in four years", "NTIA, 2024", C.white, C.ink],
    ["71.6M", "gym members in Europe in 2024, a record", "EuropeActive & Deloitte, 2025", C.white, C.ink],
    ["+59%", "running clubs on Strava in 2024; 58% made friends in one", "Strava, Year in Sport 2024", C.white, C.ink],
  ];
  return [1600, 900, `<style>
  .g { position: absolute; inset: 40px; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 24px; }
  .c { border-radius: 36px; padding: 40px 44px; display: flex; flex-direction: column; justify-content: space-between; }
  .n { font-weight: 600; font-size: 132px; line-height: .9; letter-spacing: -0.045em; }
  .d { font-size: 30px; line-height: 1.15; max-width: 560px; }
  .c .src { margin-top: 10px; }
  .c.blue .src { color: ${C.lav}; }
  </style><div class="fig"><div class="g">${cards.map(([n, d, s, bg, fg]) => `<div class="c${bg === C.brand ? " blue" : ""}" style="background:${bg};color:${fg}"><div class="n">${n}</div><div><div class="d">${d}</div><div class="src">${s}</div></div></div>`).join("")}</div></div>`];
}

/**
 * Five platforms that tried, on the three things LocalPal needs at once
 * (scores 0–5 from Julio's May radar, from the research), and LocalPal's
 * intended row, dashed: designed for, untested. `narrow` is the phone cut.
 */
function platforms(narrow = false) {
  const factors = ["Niche plans", "Anyone can propose", "Trust and safety"];
  const rows = [
    ["Nomadtable", [1, 4, 1], "drifted into dating"],
    ["Spontacts", [2, 5, 2], "German-speaking only"],
    ["Couchsurfing Hangouts", [1, 5, 3], "closed, 2020 paywall"],
    ["Timeleft", [0, 0, 3], "dinners assigned by algorithm"],
    ["Luma", [3, 2, 1], "organisers, not people"],
  ];
  const me = ["LocalPal", [4, 4, 4], "what it's built for"];
  const k = narrow ? 1.35 : 1;
  const cell = (v, mine) => `<td><span class="d${mine ? " me" : ""}" style="width:${(14 + v * 14) * k}px;height:${(14 + v * 14) * k}px;opacity:${v ? 0.85 : 0.14}"></span><span class="v">${v}</span></td>`;
  const [W, H] = narrow ? [900, 1240] : [1200, 960];
  return [W, H, `<style>
  .w { position: absolute; inset: ${narrow ? "40px 28px" : "52px 60px 48px"}; display: flex; flex-direction: column; justify-content: center; }
  table { border-collapse: separate; border-spacing: 0; width: 100%; }
  th { font-size: ${26 * k}px; font-weight: 500; color: ${C.brand}; text-align: center; vertical-align: bottom; padding: 0 6px 22px; line-height: 1.1; width: ${narrow ? 17 : 18}%; }
  th:first-child { width: ${narrow ? 49 : 46}%; }
  td { height: ${narrow ? 136 : 108}px; text-align: center; border-top: 1px solid rgba(0,29,51,.1); position: relative; }
  td:not(:first-child) { background: rgba(165,159,255,.16); }
  td:first-child { text-align: left; font-size: ${34 * k}px; letter-spacing: -0.02em; line-height: 1.05; }
  td:first-child small { display: block; font-size: ${22 * k}px; color: ${C.muted}; margin-top: 4px; letter-spacing: 0; }
  tr.me td { border-top: 2px dashed ${C.brand}; }
  tr.me td:first-child { color: ${C.brand}; }
  .d { display: inline-block; border-radius: 50%; vertical-align: middle; background: ${C.ink}; }
  .d.me { background: none; border: 3px dashed ${C.brand}; box-sizing: border-box; opacity: 1 !important; }
  .v { position: absolute; right: 10px; bottom: 8px; font-size: ${18 * k}px; color: ${C.muted}; }
  .k { margin-top: 30px; font-size: ${34 * k}px; line-height: 1.18; letter-spacing: -0.015em; }
  .k b { color: ${C.brand}; font-weight: 600; }
  .k small { display: block; margin-top: 10px; font-size: ${21 * k}px; color: ${C.muted}; letter-spacing: 0; }
  </style><div class="fig"><div class="w"><table><tr><th></th>${factors.map((f) => `<th>${f}</th>`).join("")}</tr>
  ${rows.map(([n, vs, note]) => `<tr><td>${n}<small>${note}</small></td>${vs.map((v) => cell(v)).join("")}</tr>`).join("")}
  <tr class="me"><td>${me[0]}<small>${me[2]}</small></td>${me[1].map((v) => cell(v, true)).join("")}</tr>
  </table><div class="k"><b>The gap.</b> Each gets one or two of the three. None gets all of them.<small>Scored 0–5 from the research; bigger dot, better.</small></div></div></div>`];
}

/**
 * The answer to week nine, from the thesis's service blueprint: a loop
 * that closes every plan with a check-in and feeds the map. Not built in
 * the prototype — the figure says so.
 */
function loop() {
  const w = 1600, h = 900, cx = 800, cy = 420, rx = 540, ry = 290;
  const steps = [
    ["Week one", "sign up through the university or ESN"],
    ["The map", "venues from day one, then people's plans"],
    ["Join a plan", "a group, never one-to-one"],
    ["Go", "confirm on the day; see who else did"],
    ["Check in", "“did you go?” — no penalty if not"],
    ["Again?", "“want to go again?” tunes the map"],
  ];
  const pts = steps.map((_, i) => {
    const a = -Math.PI / 2 + (i / steps.length) * Math.PI * 2;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
  const arrows = pts.map(([x1, y1], i) => {
    const [x2, y2] = pts[(i + 1) % pts.length];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ox = (mx - cx) * 0.16, oy = (my - cy) * 0.16;
    return `<path d="M${x1},${y1} Q${mx + ox},${my + oy} ${x2},${y2}" fill="none" stroke="${C.lav}" stroke-width="5" stroke-linecap="round" marker-end="url(#a)"/>`;
  });
  return [w, h, `<div class="fig"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <style>text{font-family:M} .h{font-weight:600;font-size:42px} .b{font-weight:500;font-size:27px;fill:${C.muted}} .c{font-weight:600;font-size:54px;fill:${C.brand}} .n{font-weight:500;font-size:24px;fill:${C.muted}}</style>
  <defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.lav}"/></marker></defs>
  ${arrows.join("")}
  <text x="${cx}" y="${cy - 10}" text-anchor="middle" class="c">Week nine</text>
  <text x="${cx}" y="${cy + 36}" text-anchor="middle" class="b">the map already knows what you like</text>
  ${pts.map(([x, y], i) => `<g><rect x="${x - 245}" y="${y - 64}" width="490" height="128" rx="38" fill="${i === 4 || i === 5 ? C.brand : C.white}" stroke="rgba(0,29,51,.08)"/>
    <text x="${x}" y="${y - 4}" text-anchor="middle" class="h" fill="${i === 4 || i === 5 ? C.white : C.ink}">${steps[i][0]}</text>
    <text x="${x}" y="${y + 36}" text-anchor="middle" class="b" style="${i === 4 || i === 5 ? `fill:${C.lav}` : ""}">${steps[i][1]}</text></g>`).join("")}
</svg></div>`];
}

function quote(i) {
  const q = [
    ["What I find hardest is finding something, or someone, to do things that aren't the standard ones. Nobody tells me to go to Matadero. But I knew everything about every party.", "Erasmus student, Madrid"],
    ["People say they go and then they don't. If I say I go, then I will go.", "Erasmus student, Finland"],
    ["I'll wait to be invited. I'm not going to play alone.", "Erasmus student, Madrid, on football"],
  ][i];
  const blue = i === 1;
  return [900, 1125, `<style>
  body { background: ${blue ? C.brand : C.white}; color: ${blue ? C.white : C.ink}; }
  .w { position: absolute; inset: 64px; display: flex; flex-direction: column; justify-content: space-between; }
  .m { font-weight: 600; font-size: 160px; line-height: .6; color: ${blue ? C.lav : C.brand}; height: 80px; }
  .q { font-size: ${q[0].length > 120 ? 50 : 66}px; line-height: 1.08; letter-spacing: -0.025em; font-weight: 500; }
  .who { font-size: 26px; color: ${blue ? C.lav : C.muted}; }
  </style><div class="fig"><div class="w"><div class="m">“</div><div class="q">${q[0]}</div><div class="who">${q[1]}</div></div></div>`];
}



function journey() {
  const steps = ["Feels like doing something", "Looks for it", "Works out the logistics", "Looks for company", "Pins it down", "Goes, or doesn't"];
  const asis = [4, 4.5, 3, 4, 2.5, 1];
  const tobe = [4, 5, 3.5, 4.5, 4, 5];
  const w = 1600, h = 900, L = 120, R = 1500, T = 120, B = 640;
  const x = (i) => L + (i / 5) * (R - L);
  const y = (v) => B - ((v - 1) / 4) * (B - T);
  const line = (vs) => vs.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return [w, h, `<div class="fig"><svg viewBox="0 0 ${w} ${h}" width="100%" height="100%">
  <style>text{font-family:M} .t{font-weight:500;font-size:24px;fill:${C.muted}} .l{font-weight:600;font-size:30px}</style>
  ${steps.map((s, i) => `<line x1="${x(i)}" y1="${T - 20}" x2="${x(i)}" y2="${B + 20}" stroke="${C.ink}" stroke-opacity=".08" stroke-width="2"/><foreignObject x="${x(i) - 110}" y="${B + 44}" width="220" height="90"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:M;font-weight:500;font-size:23px;color:${C.muted};text-align:center;line-height:1.15">${s}</div></foreignObject>`).join("")}
  <text x="${L - 24}" y="${T + 8}" text-anchor="end" class="t">great</text>
  <text x="${L - 24}" y="${B + 8}" text-anchor="end" class="t">awful</text>
  <path d="${line(asis)}" fill="none" stroke="${C.ink}" stroke-opacity=".55" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${line(tobe)}" fill="none" stroke="${C.brand}" stroke-width="7" stroke-dasharray="18 12" stroke-linecap="round" stroke-linejoin="round"/>
  ${asis.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="9" fill="${C.paper}" stroke="${C.ink}" stroke-opacity=".55" stroke-width="5"/>`).join("")}
  ${tobe.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="10" fill="${C.brand}"/>`).join("")}
  <text x="${x(4) - 36}" y="${y(1.25)}" text-anchor="end" class="l" fill="${C.ink}" fill-opacity=".6">Today: the plan dies in the chat</text>
  <text x="${x(5) - 24}" y="${y(5) - 26}" text-anchor="end" class="l" fill="${C.brand}">With LocalPal: they go</text>
</svg></div>`];
}


function colours() {
  const sw = [["Brand", C.brand, C.white], ["Deep", C.deep, C.white], ["Pressed", C.pressed, C.white], ["Lavender", C.lav, C.ink], ["Ink", C.ink, C.white]];
  const map = [["Land", C.land], ["Water", C.water], ["Park", C.park], ["Road", "#FFFFFF"]];
  return [1600, 900, `<style>
  .w { position: absolute; inset: 48px; display: grid; grid-template-rows: 1.6fr 1fr; gap: 20px; }
  .r { display: grid; gap: 20px; }
  .s { border-radius: 34px; padding: 26px 30px; display: flex; flex-direction: column; justify-content: flex-end; font-size: 26px; }
  .s small { display: block; font-size: 19px; opacity: .7; margin-top: 4px; font-weight: 400; }
  </style><div class="fig"><div class="w"><div class="r" style="grid-template-columns:1.6fr 1fr 1fr 1fr 1fr">${sw.map(([n, c, f]) => `<div class="s" style="background:${c};color:${f}">${n}<small>${c}</small></div>`).join("")}</div>
  <div class="r" style="grid-template-columns:repeat(4,1fr)">${map.map(([n, c]) => `<div class="s" style="background:${c};box-shadow:inset 0 0 0 1px rgba(0,29,51,.06)">${n}<small>${c} · the map, inverted</small></div>`).join("")}</div></div></div>`];
}

function type() {
  return [1200, 900, `<style>body{background:${C.brand};color:${C.white}} .w{position:absolute;inset:64px;display:flex;flex-direction:column;justify-content:space-between}
  .h{font-weight:600;font-size:118px;line-height:.92;letter-spacing:-0.045em} .a{display:flex;justify-content:space-between;align-items:flex-end;color:${C.lav};font-size:26px}
  .a b{font-weight:500;font-size:88px;color:${C.white};letter-spacing:-0.03em}</style>
  <div class="fig"><div class="w"><div class="h">Stop scrolling.<br>Start showing up.</div><div class="a"><span>PP Neue Montreal<br>one family, four weights</span><b>Aa</b></div></div></div>`];
}

/**
 * Convertr: the same vertical video in a typical converter — drawn as a
 * neutral wireframe, no product named — and in Convertr (the end frame
 * of the portrait-settings recording, scripts/record-media.mjs).
 */
function compare(narrow = false) {
  const shot = `${ROOT}source-assets/recordings/convertr-portrait-settings-end.png`;
  const uri = (f) => (existsSync(f) ? `data:image/png;base64,${readFileSync(f).toString("base64")}` : "");
  const src = uri(shot);
  const frame = uri(`${ROOT}source-assets/recordings/clouds-frame.png`);
  const g = "#d9d6d0", g2 = "#ebe8e3";
  return [narrow ? 1000 : 2000, narrow ? 1500 : 900, `<style>
  body { background: transparent; font-family: M; }
  .w { position: absolute; inset: ${narrow ? 24 : 48}px; display: grid; ${narrow ? "grid-template-rows: 1fr 1fr" : "grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)"}; gap: 40px; }
  .p { display: flex; flex-direction: column; gap: 18px; }
  .t { font-size: ${narrow ? 44 : 38}px; line-height: 1.15; color: #77716a; } .t b { color: #2b2722; font-weight: 500; }
  .win { flex: 1; min-height: 0; border-radius: 18px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 18px 40px -20px rgba(0,0,0,.3); display: flex; flex-direction: column; }
  .bar { height: 34px; background: ${g2}; display: flex; gap: 8px; align-items: center; padding: 0 14px; }
  .bar i { width: 11px; height: 11px; border-radius: 50%; background: ${g}; }
  .body { flex: 1; display: grid; grid-template-columns: 260px 1fr; }
  .side { background: #f7f6f3; border-right: 1px solid ${g2}; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
  .row { height: 34px; border-radius: 8px; background: ${g2}; }
  .row.s { width: 60%; height: 14px; background: ${g}; }
  .main { padding: 26px; display: flex; flex-direction: column; gap: 18px; }
  .prev { position: relative; height: 260px; border-radius: 10px; background: #1d1b19; display: grid; place-items: center; }
  .prev { overflow: hidden; } .prev img { display: block; height: 260px; width: auto; }
  .drop { flex: 1; border: 2px dashed ${g}; border-radius: 12px; }
  .btn { align-self: flex-end; width: 180px; height: 48px; border-radius: 10px; background: ${g}; }
  .real { flex: 1; border-radius: 18px; overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 18px 40px -20px rgba(0,0,0,.3); background: #f7f7f7 url(${src}) center / contain no-repeat; }
  </style><div class="fig"><div class="w">
  <div class="p"><div class="t"><b>A typical converter.</b> Fixed panels; the video shrinks to fit a preview.</div>
    <div class="win"><div class="bar"><i></i><i></i><i></i></div><div class="body"><div class="side">${'<div class="row s"></div><div class="row"></div>'.repeat(5)}</div>
    <div class="main"><div class="prev"><img src="${frame}"></div><div class="drop"></div><div class="btn"></div></div></div></div></div>
  <div class="p"><div class="t"><b>Convertr.</b> The box is the video, and the settings take its other side.</div><div class="real"></div></div>
  </div></div>`];
}

const FIGURES = {
  "../convertr/fig-compare": compare,
  "../convertr/fig-compare-narrow": () => compare(true),
  "fig-loop": loop,
  "fig-platforms-narrow": () => platforms(true),
  "fig-relevance-curve-narrow": () => curve(true),
  "fig-relevance-curve": curve,
  "fig-moment": moment,
  "fig-platforms": platforms,
  "fig-journey": journey,
  "fig-brand-colours": colours,
  "fig-brand-type": type,
  ...Object.fromEntries([0, 1, 2].map((i) => [`fig-quote-${i + 1}`, () => quote(i)])),
};

// The thesis's own pictures, as they are: [out name, source, width].
// Transparency kept — the storyboard from its vector, the collages with
// their rounded corners — so they sit on the page's paper, no box.
const STILLS = [
  ...[1, 4, 5].map((n) => [`storyboard-${n}`, `storyboard-frame${n}.svg`, 1400]),
  ["brand-sample", "fig11-brand-sample.png", 972],
  ["moodboard", "fig09-moodboard.png", 1600],
];

const want = process.argv.slice(2);
const pick = (n) => !want.length || want.some((w) => n.includes(w));

const browser = await chromium.launch();
for (const [name, make] of Object.entries(FIGURES)) {
  if (!pick(name)) continue;
  const [w, h, html] = make();
  // The CSS above is in 2× units: a figure is drawn at its pixel size.
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${BASE}</style>${html}`, { waitUntil: "load" });
  // SVG text doesn't pull a face in by itself: load all three first.
  await page.evaluate(async () => {
    await Promise.all(["400", "500", "600"].map((w) => document.fonts.load(`${w} 24px M`)));
    await document.fonts.ready;
  });
  await page.waitForTimeout(150);
  // Transparent: the figure sits on the page's paper, no box around it.
  const png = await page.screenshot({ omitBackground: true });
  await sharp(png).webp({ quality: 88 }).toFile(`${OUT}${name}.webp`);
  await page.close();
  console.log(`${name}.webp  ${w}×${h}`);
}
await browser.close();

for (const [name, src, width] of STILLS) {
  if (!pick(name) || !existsSync(TFM + src)) continue;
  const input = src.endsWith(".svg") ? sharp(TFM + src, { density: 300 }) : sharp(TFM + src);
  await input.resize({ width, withoutEnlargement: !src.endsWith(".svg") }).webp({ quality: 86, alphaQuality: 90 }).toFile(`${OUT}${name}.webp`);
  console.log(`${name}.webp`);
}
