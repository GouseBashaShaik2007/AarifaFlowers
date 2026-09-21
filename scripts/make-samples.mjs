// Draws placeholder garland illustrations with a transparent background.
// Run with: node scripts/make-samples.mjs
// The output goes to public/samples. Replace these with real photos from the admin panel.

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "samples");

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Number(n.toFixed(1));

// ---------- palettes: [outer, middle, inner] ----------
const P = {
  roseRed: ["#e8546b", "#c81d3a", "#8f0f27"],
  rosePink: ["#f9b5cc", "#ee7aa2", "#c94a78"],
  rosePeach: ["#ffd0b0", "#ff9d78", "#e0704a"],
  marigoldOrange: ["#ffb627", "#f58a07", "#c85a00"],
  marigoldYellow: ["#ffe066", "#ffc61a", "#e09a00"],
  orchidPurple: ["#d3a0fb", "#a25be0", "#5b1d99"],
  orchidWhite: ["#ffffff", "#f1e4ff", "#b06ad8"],
  jasmine: ["#ffffff", "#fffdf5", "#f2d16b"],
};

// ---------- flowers (drawn around 0,0) ----------
function petals(n, d, rx, ry, fill, offset, stroke, sw) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = offset + (360 / n) * i;
    s += `<ellipse cx="${f(d)}" cy="0" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(a)})" fill="${fill}" stroke="${stroke}" stroke-opacity=".28" stroke-width="${f(sw)}"/>`;
  }
  return s;
}

function rose(r, pal) {
  const [c1, c2, c3] = pal;
  const dark = "#5a0b1c";
  return (
    `<circle r="${f(r)}" fill="${c2}"/>` +
    petals(7, r * 0.52, r * 0.5, r * 0.4, c1, 0, dark, r * 0.03) +
    petals(6, r * 0.34, r * 0.38, r * 0.3, c2, 18, dark, r * 0.03) +
    petals(5, r * 0.18, r * 0.28, r * 0.22, c3, 40, dark, r * 0.03) +
    `<circle r="${f(r * 0.1)}" fill="${c3}" stroke="${dark}" stroke-opacity=".4" stroke-width="${f(r * 0.03)}"/>`
  );
}

function jasmine(r) {
  return (
    petals(6, r * 0.52, r * 0.5, r * 0.23, "#ffffff", 0, "#cfc8b0", r * 0.04) +
    `<circle r="${f(r * 0.16)}" fill="#f2d16b"/>`
  );
}

function marigold(r, pal) {
  const [c1, c2, c3] = pal;
  const dark = "#7a3a00";
  return (
    `<circle r="${f(r * 0.9)}" fill="${c2}"/>` +
    petals(16, r * 0.64, r * 0.34, r * 0.17, c1, 0, dark, r * 0.02) +
    petals(13, r * 0.46, r * 0.32, r * 0.16, c2, 10, dark, r * 0.02) +
    petals(10, r * 0.28, r * 0.26, r * 0.14, c3, 25, dark, r * 0.02) +
    `<circle r="${f(r * 0.12)}" fill="${c3}"/>`
  );
}

function orchid(r, pal) {
  const [c1, c2, c3] = pal;
  return (
    petals(3, r * 0.55, r * 0.55, r * 0.3, c2, -90, c3, r * 0.03) +
    petals(2, r * 0.5, r * 0.5, r * 0.34, c1, 20, c3, r * 0.03).replace(/rotate\(20/, "rotate(10") +
    `<ellipse cx="0" cy="${f(r * 0.28)}" rx="${f(r * 0.3)}" ry="${f(r * 0.24)}" fill="#ffffff" stroke="${c3}" stroke-width="${f(r * 0.04)}"/>` +
    `<circle cx="0" cy="${f(r * 0.3)}" r="${f(r * 0.08)}" fill="${c3}"/>` +
    `<circle cx="0" cy="${f(-r * 0.05)}" r="${f(r * 0.1)}" fill="#f2d16b"/>`
  );
}

function drawFlower(spec, x, y, rot) {
  let body;
  if (spec.k === "rose") body = rose(spec.r, spec.pal);
  else if (spec.k === "jasmine") body = jasmine(spec.r);
  else if (spec.k === "marigold") body = marigold(spec.r, spec.pal);
  else body = orchid(spec.r, spec.pal);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})" filter="url(#sh)">${body}</g>`;
}

function leaf(x, y, ang, len, shade) {
  const w = len * 0.36;
  const fill = shade ? "#2c7a3a" : "#3f9a4b";
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">` +
    `<path d="M0 0 C ${f(len * 0.3)} ${f(-w)}, ${f(len * 0.75)} ${f(-w)}, ${f(len)} 0 C ${f(len * 0.75)} ${f(w)}, ${f(len * 0.3)} ${f(w)}, 0 0 Z" fill="${fill}" stroke="#1f5a2a" stroke-opacity=".5" stroke-width="1.5"/>` +
    `<path d="M0 0 L ${f(len * 0.92)} 0" stroke="#1f5a2a" stroke-opacity=".45" stroke-width="2" fill="none"/>` +
    `</g>`
  );
}

// ---------- curves ----------
function curveFromFn(fn, n = 600) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(fn(i / n));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, cum, total: cum[cum.length - 1] };
}

function at(curve, s) {
  const { pts, cum } = curve;
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const t = (s - cum[lo]) / seg;
  const [x0, y0] = pts[lo];
  const [x1, y1] = pts[hi];
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, ang: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI };
}

const uCurve = (x0, x1, top, sag) => curveFromFn((t) => [x0 + (x1 - x0) * t, top + sag * (1 - (2 * t - 1) ** 2)]);
const swagCurve = (x0, x1, top, sag) =>
  curveFromFn((t) => {
    const u = (t * 2) % 1 || (t === 1 ? 1 : 0);
    return [x0 + (x1 - x0) * t, top + sag * (1 - (2 * u - 1) ** 2)];
  });
const lineCurve = (x0, y0, x1, y1) => curveFromFn((t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t], 50);

// ---------- strand builder ----------
// A strand is a curve with a repeating pattern of flowers along it.
function buildStrand(curve, pattern, opts, rand) {
  const { margin = 40, leaves = true, tip = false } = opts;
  const flowers = [];
  const leafList = [];
  let s = margin;
  let prevR = pattern[0].r * 0.4;
  let i = 0;
  while (true) {
    const spec = pattern[i % pattern.length];
    s += (prevR + spec.r) * 0.76;
    if (s > curve.total - margin) break;
    const p = at(curve, s);
    const perp = ((p.ang + 90) * Math.PI) / 180;
    const j = (rand() - 0.5) * 6;
    flowers.push({ spec, x: p.x + Math.cos(perp) * j, y: p.y + Math.sin(perp) * j, rot: rand() * 360 });
    if (leaves) {
      const side = i % 2 === 0 ? 1 : -1;
      const off = spec.r * 0.8;
      const lp = at(curve, Math.max(0, s - spec.r * 0.9));
      const lperp = ((lp.ang + 90) * Math.PI) / 180;
      leafList.push({
        x: lp.x + Math.cos(lperp) * off * side * 0.5,
        y: lp.y + Math.sin(lperp) * off * side * 0.5,
        ang: lp.ang + side * (48 + rand() * 20),
        len: 44 + rand() * 26,
        shade: rand() > 0.5,
      });
    }
    prevR = spec.r;
    i++;
  }
  if (tip) {
    const end = at(curve, curve.total - 2);
    leafList.push({ x: end.x, y: end.y, ang: end.ang, len: 90, shade: false });
    leafList.push({ x: end.x, y: end.y, ang: end.ang + 28, len: 64, shade: true });
    leafList.push({ x: end.x, y: end.y, ang: end.ang - 28, len: 64, shade: true });
  }
  return { flowers, leaves: leafList, curve };
}

function threadPath(curve) {
  const step = Math.max(1, Math.floor(curve.pts.length / 80));
  let d = "";
  curve.pts.forEach(([x, y], idx) => {
    if (idx % step === 0 || idx === curve.pts.length - 1) d += `${d ? "L" : "M"}${f(x)} ${f(y)} `;
  });
  return `<path d="${d}" fill="none" stroke="#7a5a30" stroke-width="5" stroke-linecap="round"/>`;
}

function knot(x, y, ang) {
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})">` +
    `<path d="M0 0 C 20 -26, 46 -22, 40 4 C 36 24, 10 14, 0 0 Z M0 0 C -20 -26, -46 -22, -40 4 C -36 24, -10 14, 0 0 Z" fill="#d4a017" stroke="#8a6508" stroke-width="2"/>` +
    `<circle r="10" fill="#f2c94c" stroke="#8a6508" stroke-width="2"/></g>`
  );
}

// ---------- designs ----------
const R = (r, pal) => ({ k: "rose", r, pal });
const J = (r) => ({ k: "jasmine", r });
const M = (r, pal) => ({ k: "marigold", r, pal });
const O = (r, pal) => ({ k: "orchid", r, pal });

const DESIGNS = {
  "rose-jasmine-bridal": {
    seed: 11,
    shape: () => [{ curve: uCurve(150, 1050, 170, 760), pattern: [R(48, P.rosePink), J(24), J(24), R(44, P.roseRed), J(24), J(24)], knots: true }],
    zoom: [
      "300 600 600 600",
      "120 60 500 500",
    ],
  },
  "red-rose-varmala": {
    seed: 22,
    shape: () => [
      { curve: uCurve(70, 570, 200, 620), pattern: [R(42, P.roseRed), J(20), R(38, P.rosePink), J(20)], knots: true },
      { curve: uCurve(630, 1130, 200, 620), pattern: [R(42, P.roseRed), J(20), R(38, P.rosePink), J(20)], knots: true },
    ],
    zoom: ["60 540 520 520", "660 120 480 480"],
  },
  "marigold-rose-groom": {
    seed: 33,
    shape: () => [{ curve: uCurve(150, 1050, 170, 740), pattern: [M(40, P.marigoldOrange), R(34, P.roseRed), M(34, P.marigoldYellow), R(30, P.rosePeach)], knots: true }],
    zoom: ["330 620 540 540", "760 160 440 440"],
  },
  "jasmine-pooja": {
    seed: 44,
    shape: () => [{ curve: uCurve(230, 970, 210, 640), pattern: [J(24), J(20), J(26), J(20)], leaves: false, knots: true }],
    zoom: ["360 660 480 480", "200 160 420 420"],
  },
  "marigold-temple": {
    seed: 55,
    shape: () => [{ curve: uCurve(170, 1030, 190, 700), pattern: [M(36, P.marigoldOrange), M(34, P.marigoldYellow)], knots: true }],
    zoom: ["330 600 540 540", "140 160 460 460"],
  },
  "marigold-toran": {
    seed: 66,
    shape: () => {
      const band = curveFromFn((t) => [90 + 1020 * t, 230 + 34 * Math.sin(t * Math.PI * 6)]);
      const strands = [{ curve: band, pattern: [M(34, P.marigoldOrange), M(32, P.marigoldYellow)], leaves: true }];
      for (let i = 0; i < 9; i++) {
        const x = 150 + i * 112;
        const len = i % 2 === 0 ? 620 : 400;
        strands.push({
          curve: lineCurve(x, 250, x, 250 + len),
          pattern: [M(26, i % 2 ? P.marigoldYellow : P.marigoldOrange), M(24, i % 2 ? P.marigoldOrange : P.marigoldYellow)],
          margin: 30,
          leaves: false,
          tip: true,
        });
      }
      return strands;
    },
    zoom: ["80 150 560 560", "520 150 560 560"],
  },
  "wedding-car": {
    seed: 77,
    shape: () => [{ curve: swagCurve(80, 1120, 320, 420), pattern: [R(40, P.rosePink), J(21), R(36, P.roseRed), J(21), R(36, P.rosePink), J(21)], knots: true }],
    zoom: ["80 420 560 560", "560 420 560 560"],
  },
  "stage-backdrop": {
    seed: 88,
    shape: () => {
      const strands = [];
      for (let i = 0; i < 11; i++) {
        const x = 100 + i * 100;
        const len = 640 + ((i * 137) % 5) * 90;
        const pats = [
          [R(30, P.rosePink), J(20), J(20)],
          [J(22), M(28, P.marigoldYellow), J(22)],
          [R(28, P.roseRed), J(20), J(20)],
        ];
        strands.push({ curve: lineCurve(x, 150, x, 150 + len), pattern: pats[i % 3], margin: 20, leaves: i % 2 === 0 });
      }
      return strands;
    },
    bar: { x0: 60, x1: 1140, y: 140 },
    zoom: ["100 120 520 520", "500 500 520 520"],
  },
  "birthday-mix": {
    seed: 99,
    shape: () => [{ curve: uCurve(160, 1040, 180, 720), pattern: [R(38, P.rosePink), M(34, P.marigoldYellow), R(32, P.rosePeach), M(30, P.marigoldOrange), J(20)], knots: true }],
    zoom: ["320 620 560 560", "130 160 460 460"],
  },
  "orchid-designer": {
    seed: 111,
    shape: () => [{ curve: uCurve(150, 1050, 180, 730), pattern: [O(46, P.orchidPurple), J(20), O(46, P.orchidWhite), J(20)], knots: true }],
    zoom: ["330 620 540 540", "740 160 440 440"],
  },
};

function render(design, viewBox) {
  const rand = rng(design.seed);
  const strands = design.shape().map((s) => ({ ...s, ...buildStrand(s.curve, s.pattern, s, rand) }));

  let body = "";
  if (design.bar) {
    const b = design.bar;
    body += `<path d="M${b.x0} ${b.y} L${b.x1} ${b.y}" stroke="#6b4a26" stroke-width="18" stroke-linecap="round"/>`;
  }
  strands.forEach((s) => (body += threadPath(s.curve)));
  strands.forEach((s) => s.leaves.forEach((l) => (body += leaf(l.x, l.y, l.ang, l.len, l.shade))));
  strands.forEach((s) => s.flowers.forEach((fl) => (body += drawFlower(fl.spec, fl.x, fl.y, fl.rot))));
  strands.forEach((s) => {
    if (s.knots) {
      const a = at(s.curve, 4);
      const z = at(s.curve, s.curve.total - 4);
      body += knot(a.x, a.y, a.ang - 90) + knot(z.x, z.y, z.ang + 90);
    }
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="${viewBox}">` +
    `<defs><filter id="sh" x="-30%" y="-30%" width="160%" height="170%">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="3.2"/><feOffset dx="1.5" dy="4" result="o"/>` +
    `<feComponentTransfer><feFuncA type="linear" slope=".38"/></feComponentTransfer>` +
    `<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
    body +
    `</svg>`
  );
}

async function writeWebp(svg, name) {
  let png = await sharp(Buffer.from(svg), { density: 96 }).png().toBuffer();
  // Crop away empty transparent space, then add a small even margin.
  const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.04);
  png = await sharp(trimmed.data).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const full = await sharp(png).resize({ width: 1000, height: 1000, fit: "inside" }).webp({ quality: 84, alphaQuality: 90 }).toBuffer();
  const thumb = await sharp(png).resize({ width: 560, height: 560, fit: "inside" }).webp({ quality: 78, alphaQuality: 85 }).toBuffer();
  await fs.writeFile(path.join(OUT, `${name}.webp`), full);
  await fs.writeFile(path.join(OUT, `${name}-t.webp`), thumb);
}

await fs.mkdir(OUT, { recursive: true });
for (const [id, design] of Object.entries(DESIGNS)) {
  await writeWebp(render(design, "0 0 1200 1200"), `${id}-1`);
  await writeWebp(render(design, design.zoom[0]), `${id}-2`);
  console.log("made", id);
}
