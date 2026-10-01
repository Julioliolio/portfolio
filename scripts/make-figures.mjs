/**
 * LocalPal's figures for its project page (docs/media-plan.md), drawn
 * here in English from the thesis's data (source-assets/localpal-tfm/
 * REPORT.md) in LocalPal's own type and colours, and rendered to webp at
 * 2×. The thesis's figures are Spanish and A3-page sized; these are
 * set for a bento cell.
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
body { font-family: M, sans-serif; font-weight: 500; color: ${C.ink}; background: ${C.paper}; -webkit-font-smoothing: antialiased; letter-spacing: -0.01em; }
.fig { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.src { font-size: 13px; color: ${C.muted}; font-weight: 400; letter-spacing: 0; }
`;

/* ---------- the figures: [name, width, height, html] ---------- */

const W = 17;
const mainstream = [.92, .90, .88, .85, .80, .75, .69, .63, .57, .50, .43, .36, .30, .26, .22, .19, .18];
const niche = [.12, .13, .14, .15, .18, .22, .27, .33, .41, .50, .61, .70, .77, .83, .87, .89, .90];

function curve() {
  const w = 1600, h = 900;
  const L = 150, R = 1500, T = 210, B = 700;
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
  <style>text{font-family:M} .t{font-weight:500;font-size:24px;fill:${C.muted}} .l{font-weight:600;font-size:30px} .s{font-weight:500;font-size:23px;fill:${C.muted}}</style>
  <rect x="${x(6)}" y="${T - 40}" width="${x(12) - x(6)}" height="${B - T + 40}" fill="${C.lav}" opacity=".28" rx="14"/>
  <text x="${x(6) + 24}" y="${B - 56}" class="l" fill="${C.brand}">LocalPal's</text>
  <text x="${x(6) + 24}" y="${B - 22}" class="l" fill="${C.brand}">window</text>
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
  <text x="${x(0)}" y="${y(.92) - 74}" class="l" fill="${C.ink}">The obvious plans</text>
  <text x="${x(0)}" y="${y(.92) - 40}" class="s">welcome weeks, flat dinners, the big bars</text>
  <text x="${x(16)}" y="${y(.9) - 74}" text-anchor="end" class="l" fill="${C.brand}">The specific ones, and someone to go with</text>
  <text x="${x(16)}" y="${y(.9) - 40}" text-anchor="end" class="s">a climbing partner, a small show, a Sunday run</text>
  <path d="M${x(0)},${B + 128} v-12 H${x(5.5)} v12" fill="none" stroke="${C.muted}" stroke-width="2"/>
  <text x="${x(0)}" y="${B + 166}" class="s">sign-ups happen here: universities, ESN, arrival networks</text>
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

function platforms() {
  const factors = ["Mainstream plans", "Niche plans", "Both, layered", "Anyone can propose", "Short notice", "Trust and safety", "Locals and newcomers", "People nearby", "Polish", "Your account lasts"];
  const rows = [
    ["LocalPal", [3, 4, 4, 4, 4, 4, 4, 1, 4, 3]],
    ["Nomadtable", [1, 1, 0, 4, 4, 1, 0, 3, 3, 2]],
    ["Spontacts", [2, 2, 1, 5, 4, 2, 3, 1, 2, 1]],
    ["Couchsurfing Hangouts", [3, 1, 0, 5, 5, 3, 5, 3, 2, 0]],
    ["Timeleft", [2, 0, 1, 0, 1, 3, 3, 4, 4, 2]],
    ["Luma", [3, 3, 1, 2, 3, 1, 3, 4, 5, 3]],
  ];
  const cell = (v, me) => `<td><span class="d" style="width:${8 + v * 9}px;height:${8 + v * 9}px;background:${me ? C.brand : C.ink};opacity:${v ? (me ? 1 : 0.78) : 0.12}"></span></td>`;
  return [1600, 900, `<style>
  .w { position: absolute; inset: 56px 56px 48px; display: flex; flex-direction: column; justify-content: center; }
  table { border-collapse: separate; border-spacing: 0; width: 100%; }
  th { font-size: 19px; font-weight: 500; color: ${C.muted}; text-align: center; vertical-align: bottom; padding: 0 4px 22px; line-height: 1.1; width: 9%; }
  th:first-child { width: 19%; }
  td { height: 92px; text-align: center; border-top: 1px solid rgba(0,29,51,.1); }
  td:first-child { text-align: left; font-size: 25px; }
  tr.me td { background: rgba(165,159,255,.22); border-top-color: transparent; }
  tr.me td:first-child { color: ${C.brand}; font-weight: 600; border-radius: 22px 0 0 22px; padding-left: 22px; }
  tr.me td:last-child { border-radius: 0 22px 22px 0; }
  tr:not(.me) td:first-child { padding-left: 22px; }
  .d { display: inline-block; border-radius: 50%; vertical-align: middle; }
  .k { margin-top: 26px; display: flex; gap: 28px; align-items: center; }
  </style><div class="fig"><div class="w"><table><tr><th></th>${factors.map((f) => `<th>${f}</th>`).join("")}</tr>
  ${rows.map(([n, vs]) => `<tr class="${n === "LocalPal" ? "me" : ""}"><td>${n}</td>${vs.map((v) => cell(v, n === "LocalPal")).join("")}</tr>`).join("")}
  </table><div class="k src"><span>Scored 0–5 from the research. Bigger dot, better.</span><span>LocalPal is weakest on people nearby: a new map starts empty, which is why venues fill it first.</span></div></div></div>`];
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

/** Line icons for the five decisions, 64-unit grid, 4-unit stroke. */
const ICONS = {
  layers: `<path d="M32 10 L56 22 L32 34 L8 22 Z"/><path d="M8 32 L32 44 L56 32"/><path d="M8 42 L32 54 L56 42"/>`,
  propose: `<circle cx="32" cy="32" r="22"/><path d="M32 22 V42 M22 32 H42"/>`,
  group: `<circle cx="20" cy="24" r="7"/><circle cx="44" cy="24" r="7"/><circle cx="32" cy="18" r="7"/><path d="M8 50 C10 38 30 38 32 50 M32 50 C34 38 54 38 56 50"/>`,
  verify: `<path d="M32 8 L52 16 V30 C52 44 42 52 32 56 C22 52 12 44 12 30 V16 Z"/><path d="M23 32 L30 39 L42 26"/>`,
  free: `<rect x="10" y="18" width="44" height="28" rx="8"/><path d="M10 28 H54"/><path d="M14 54 L50 10"/>`,
};
function decision(i) {
  const d = [
    ["layers", "Venues fill the map from day one.", "People's own plans are why you stay."],
    ["propose", "Anyone can propose a plan.", "No organiser who approves who comes."],
    ["group", "Groups, never one-to-one.", "Every plan has a minimum size. It's not a dating app."],
    ["verify", "Verifying is a sign you'll show up.", "A uni email or a QR at an event, never a bank-style check."],
    ["free", "Free between people.", "Money only where paying is already normal: a ticket, a gym."],
  ][i];
  const blue = i === 0;
  return [800, 600, `<style>
  body { background: ${blue ? C.brand : C.white}; color: ${blue ? C.white : C.ink}; }
  .w { position: absolute; inset: 52px; display: flex; flex-direction: column; justify-content: space-between; }
  svg { width: 96px; height: 96px; fill: none; stroke: ${blue ? C.white : C.brand}; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
  .n { font-size: 22px; color: ${blue ? C.lav : C.muted}; margin-bottom: 14px; }
  .h { font-size: 46px; line-height: 1.05; letter-spacing: -0.025em; font-weight: 600; }
  .b { margin-top: 14px; font-size: 28px; line-height: 1.2; color: ${blue ? C.lav : C.muted}; }
  </style><div class="fig"><div class="w"><svg viewBox="0 0 64 64">${ICONS[d[0]]}</svg><div><div class="n">0${i + 1}</div><div class="h">${d[1]}</div><div class="b">${d[2]}</div></div></div></div>`];
}

function persona(i) {
  const p = [
    ["Giovanna", "22, product design, from Bologna", "The initiator", "Three weeks in and never a free night. At home she played football twice a week; here she hasn't touched a ball. She's waiting for an invite.", "Plans keep repeating. Too many WhatsApp groups.", "Miss nothing, and go home with stories."],
    ["Martim", "21, maths, from Porto", "The enthusiast", "A bouldering video hooked him a month ago. He's looked at two climbing gyms and doesn't know where to start; his friends aren't keen.", "Going alone intimidates him. Plans die in the group chat.", "Try new things and find the good spots."],
    ["Beatrice", "23, game design, from Belfast", "The cautious one", "Left out of her host university's activity group. Her social life is three people from her corridor, and she never joins plans.", "The plans she sees don't feel safe. She doesn't know who she'd meet.", "Do things on her own terms, and feel safe."],
  ][i];
  const tint = [C.brand, C.lav, C.ink][i];
  return [900, 1125, `<style>
  body { background: ${C.white}; }
  .w { position: absolute; inset: 60px; display: flex; flex-direction: column; }
  .av { width: 150px; height: 150px; border-radius: 46px; background: ${tint}; color: ${C.white}; font-weight: 600; font-size: 84px; display: grid; place-items: center; letter-spacing: -0.04em; }
  .tag { margin-top: 40px; display: inline-block; align-self: flex-start; font-size: 24px; padding: 8px 18px; border-radius: 999px; background: rgba(165,159,255,.28); color: ${C.brand}; }
  .n { margin-top: 22px; font-size: 76px; font-weight: 600; letter-spacing: -0.035em; line-height: 1; }
  .a { margin-top: 10px; font-size: 27px; color: ${C.muted}; }
  .s { margin-top: 44px; font-size: 40px; line-height: 1.16; letter-spacing: -0.02em; }
  .f { display: grid; grid-template-columns: 150px 1fr; gap: 6px 16px; font-size: 28px; line-height: 1.22; color: ${C.muted}; padding-top: 22px; border-top: 1px solid rgba(0,29,51,.12); }
  .f + .f { margin-top: 18px; } .first { margin-top: auto; } .f b { font-weight: 500; color: ${C.ink}; }
  </style><div class="fig"><div class="w"><div class="av">${p[0][0]}</div><div class="tag">${p[2]}</div><div class="n">${p[0]}</div><div class="a">${p[1]}</div><div class="s">${p[3]}</div><div class="f first"><b>Wants</b><span>${p[5]}</span></div><div class="f"><b>Stuck on</b><span>${p[4]}</span></div></div></div>`];
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
  <path d="${line(tobe)}" fill="none" stroke="${C.brand}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  ${asis.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="9" fill="${C.paper}" stroke="${C.ink}" stroke-opacity=".55" stroke-width="5"/>`).join("")}
  ${tobe.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="10" fill="${C.brand}"/>`).join("")}
  <text x="${x(4) - 36}" y="${y(1.25)}" text-anchor="end" class="l" fill="${C.ink}" fill-opacity=".6">Today: the plan dies in the chat</text>
  <text x="${x(5) - 24}" y="${y(5) - 26}" text-anchor="end" class="l" fill="${C.brand}">With LocalPal: they go</text>
</svg></div>`];
}

function logo() {
  const file = `${TFM}brand-logo-mark.svg`;
  const svg = existsSync(file) ? `<img src="data:image/svg+xml;base64,${readFileSync(file).toString("base64")}">` : "";
  return [1200, 900, `<style>body{background:${C.brand}} img{position:absolute;left:50%;top:50%;width:46%;transform:translate(-50%,-50%) rotate(-4deg);filter:brightness(0) invert(1)}</style><div class="fig">${svg}</div>`];
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
function compare() {
  const shot = `${ROOT}source-assets/recordings/convertr-portrait-settings-end.png`;
  const uri = (f) => (existsSync(f) ? `data:image/png;base64,${readFileSync(f).toString("base64")}` : "");
  const src = uri(shot);
  const frame = uri(`${ROOT}source-assets/recordings/clouds-frame.png`);
  const g = "#d9d6d0", g2 = "#ebe8e3";
  return [2000, 900, `<style>
  body { background: #f4f2ee; font-family: M; }
  .w { position: absolute; inset: 48px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 40px; }
  .p { display: flex; flex-direction: column; gap: 18px; }
  .t { font-size: 28px; color: #77716a; } .t b { color: #2b2722; font-weight: 500; }
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
  "fig-relevance-curve": curve,
  "fig-moment": moment,
  "fig-platforms": platforms,
  "fig-journey": journey,
  "fig-brand-logo": logo,
  "fig-brand-colours": colours,
  "fig-brand-type": type,
  ...Object.fromEntries([0, 1, 2].map((i) => [`fig-quote-${i + 1}`, () => quote(i)])),
  ...Object.fromEntries([0, 1, 2, 3, 4].map((i) => [`fig-decision-${i + 1}`, () => decision(i)])),
  ...Object.fromEntries([0, 1, 2].map((i) => [`fig-persona-${i + 1}`, () => persona(i)])),
};

// The thesis's own pictures, as they are: [out name, source, width].
const STILLS = [
  ...[1, 2, 3, 4, 5].map((n) => [`storyboard-${n}`, `storyboard-frame${n}.png`, 1400]),
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
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 88 }).toFile(`${OUT}${name}.webp`);
  await page.close();
  console.log(`${name}.webp  ${w}×${h}`);
}
await browser.close();

for (const [name, src, width] of STILLS) {
  if (!pick(name) || !existsSync(TFM + src)) continue;
  await sharp(TFM + src).flatten({ background: "#ffffff" }).resize({ width, withoutEnlargement: true }).webp({ quality: 86 }).toFile(`${OUT}${name}.webp`);
  console.log(`${name}.webp`);
}
