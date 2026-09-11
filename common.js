// Shared constants, scoring helpers, chart renderer, starfield background, and
// file/PNG export helpers used by both index.html (the quiz) and compare.html
// (the party comparison page).

const AXIS_LABELS = {
  1: { neg: "Pragmatic", pos: "Idealistic", name: "Ideas & Circumstance" },
  2: { neg: "Pessimistic", pos: "Optimistic", name: "Optimism & Pessimism" },
};

const ARCHETYPES = {
  "1,1": {
    name: "The Visionary",
    blurb: "believes conviction can remake the world, and that the world tends to reward the attempt.",
  },
  "1,-1": {
    name: "The Cassandra",
    blurb: "believes ideas are what move history, but expects the truth to arrive too late to be welcomed.",
  },
  "-1,1": {
    name: "The Reformer",
    blurb: "trusts material conditions and incentives over doctrine, and believes patient, practical work pays off.",
  },
  "-1,-1": {
    name: "The Cynic",
    blurb: "trusts material conditions over doctrine, and expects old patterns to reassert themselves given time.",
  },
};

// Each axis totals -6..+6 from the raw scoring key (three questions, each worth
// -2..+2) — that natural range is also what's shown to players, so a maxed-out
// answer sheet reads as a 6, not something smaller. clampForDisplay is a safety
// clamp (e.g. against a hand-edited results file claiming an out-of-range score),
// not a narrowing cap.
const DISPLAY_CAP = 6;

// A fixed, ordered set of hues for telling characters apart on the compare chart.
// The first eight follow the studio's validated dark-surface categorical order;
// two extra hues are appended for parties of nine or ten. Every marker also
// carries a direct name label, so color is never the only way to tell them apart.
const CHARACTER_COLORS = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#4caf50", // green
  "#9085e9", // violet
  "#e66767", // red
  "#8fd694", // light green (9th)
  "#f2a65a", // tan (10th)
];

const SCHEMA_VERSION = "two-axis-worldview-quiz/v1";

// The chart SVG is later re-serialized standalone (via XMLSerializer) for PNG
// export, at which point it has no access to the page's external style.css —
// so its visual rules are embedded directly as a <style> block, in literal
// colors, rather than relying on classes defined only in style.css.
const CHART_STYLE = `
  .chart-surface { fill: rgba(20, 16, 36, 0.6); }
  .grid-line { stroke: rgba(167, 139, 250, 0.16); stroke-width: 1; }
  .axis-zero { stroke: rgba(199, 191, 227, 0.4); stroke-width: 1.5; }
  .tick-label { fill: #8b83ac; font-size: 11px; }
  .quadrant-label { fill: #8b83ac; font-size: 10px; letter-spacing: 0.06em; }
  .axis-title { fill: #c7bfe3; font-size: 11px; letter-spacing: 0.08em; font-weight: 600; }
  .marker { fill: #f2c879; filter: drop-shadow(0 0 6px rgba(242, 200, 121, 0.85)); }
  .marker-ring { fill: #171029; }
  .marker-label { fill: #f1ecff; font-size: 13px; font-weight: 600; }
  .marker-label.compact { font-size: 11px; }
  .marker-coords { fill: #c7bfe3; font-size: 11px; }
  text { font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif; }
`;

function clampForDisplay(score) {
  return Math.max(-DISPLAY_CAP, Math.min(DISPLAY_CAP, score));
}

// Each axis is split into 8 sections — 4 escalating qualifiers on each pole,
// covering raw magnitudes 1-6 — plus a 9th "Balanced" state at exactly 0 that
// belongs to neither pole. Still computed from the same 3 questions per axis;
// this only changes how that raw total is described.
function intensity(score) {
  const magnitude = Math.abs(score);
  if (magnitude === 0) return "Balanced";
  if (magnitude <= 2) return "Leans";
  if (magnitude === 3) return "Moderately";
  if (magnitude === 4) return "Firmly";
  return "Staunchly"; // 5-6
}

function poleLabel(axis, score) {
  const labels = AXIS_LABELS[axis];
  if (score === 0) return "Balanced";
  return score > 0 ? labels.pos : labels.neg;
}

function describeAxis(axis, score) {
  const word = intensity(score);
  const pole = poleLabel(axis, score);
  if (score === 0) return "Perfectly balanced";
  return word ? `${word} ${pole}` : pole;
}

function archetypeFor(axis1, axis2) {
  const key = `${axis1 === 0 ? 0 : Math.sign(axis1)},${axis2 === 0 ? 0 : Math.sign(axis2)}`;
  if (ARCHETYPES[key]) return ARCHETYPES[key];
  return {
    name: "The Unaligned",
    blurb: "sits on the fence between these forces, tilting with circumstance rather than settling into a pole.",
  };
}

function formatScore(score) {
  return score > 0 ? `+${score}` : `${score}`;
}

// ---------------------------------------------------------------------------
// Chart geometry & rendering
//
// Vertical = Axis I (Pragmatic at bottom, Idealistic at top).
// Horizontal = Axis II (Pessimistic at left, Optimistic at right).
// ---------------------------------------------------------------------------

function chartGeometry() {
  const size = 520;
  const left = 70;
  const right = size - 20;
  const top = 20;
  const bottom = size - 70;
  const range = DISPLAY_CAP * 2;
  return {
    size,
    left,
    right,
    top,
    bottom,
    plotW: right - left,
    plotH: bottom - top,
    scaleX: (v) => left + ((v + DISPLAY_CAP) / range) * (right - left),
    scaleY: (v) => top + ((DISPLAY_CAP - v) / range) * (bottom - top),
    ticks: [-DISPLAY_CAP, -DISPLAY_CAP / 2, 0, DISPLAY_CAP / 2, DISPLAY_CAP],
  };
}

function gridAndTicksSVG(geo) {
  let gridLines = "";
  geo.ticks.forEach((t) => {
    const cls = t === 0 ? "axis-zero" : "grid-line";
    const x = geo.scaleX(t);
    const y = geo.scaleY(t);
    gridLines += `<line class="${cls}" x1="${x}" y1="${geo.top}" x2="${x}" y2="${geo.bottom}" />`;
    gridLines += `<line class="${cls}" x1="${geo.left}" y1="${y}" x2="${geo.right}" y2="${y}" />`;
  });

  let xTickLabels = "";
  let yTickLabels = "";
  geo.ticks.forEach((t) => {
    xTickLabels += `<text class="tick-label" x="${geo.scaleX(t)}" y="${geo.bottom + 18}" text-anchor="middle">${t}</text>`;
    yTickLabels += `<text class="tick-label" x="${geo.left - 10}" y="${geo.scaleY(t) + 4}" text-anchor="end">${t}</text>`;
  });

  return gridLines + xTickLabels + yTickLabels;
}

function quadrantLabelsSVG(geo, occupiedCorners) {
  const corners = [
    { key: "1,-1", label: "IDEALISTIC PESSIMIST", x: geo.left + 10, y: geo.top + 20, anchor: "start" },
    { key: "1,1", label: "IDEALISTIC OPTIMIST", x: geo.right - 10, y: geo.top + 20, anchor: "end" },
    { key: "-1,-1", label: "PRAGMATIC PESSIMIST", x: geo.left + 10, y: geo.bottom - 10, anchor: "start" },
    { key: "-1,1", label: "PRAGMATIC OPTIMIST", x: geo.right - 10, y: geo.bottom - 10, anchor: "end" },
  ];
  return corners
    .filter((c) => !occupiedCorners.has(c.key))
    .map((c) => `<text class="quadrant-label" x="${c.x}" y="${c.y}" text-anchor="${c.anchor}">${c.label}</text>`)
    .join("\n    ");
}

// Renders a single character's result: the marker carries both a name label and
// a coordinates line beneath it, flipped/anchored to avoid clipping plot edges.
function buildSingleChartSVG(axis1, axis2, characterName) {
  const geo = chartGeometry();
  const inDeepCorner = Math.abs(axis1) >= DISPLAY_CAP - 1 && Math.abs(axis2) >= DISPLAY_CAP - 1;
  const occupied = new Set(inDeepCorner ? [`${Math.sign(axis1)},${Math.sign(axis2)}`] : []);

  const cx = geo.scaleX(axis2);
  const cy = geo.scaleY(axis1);

  const roomAbove = cy - geo.top;
  const roomBelow = geo.bottom - cy;
  let nameY;
  let coordsY;
  if (roomAbove < 40) {
    nameY = cy + 22;
    coordsY = cy + 40;
  } else if (roomBelow < 40) {
    nameY = cy - 30;
    coordsY = cy - 12;
  } else {
    nameY = cy - 16;
    coordsY = cy + 24;
  }

  let labelAnchor = "middle";
  if (cx - geo.left < 55) labelAnchor = "start";
  else if (geo.right - cx < 55) labelAnchor = "end";

  const name = characterName || "Your character";

  return `
  <svg viewBox="0 0 ${geo.size} ${geo.size}" role="img" aria-labelledby="chart-title chart-desc" class="chart-svg">
    <title id="chart-title">Two axis worldview chart</title>
    <desc id="chart-desc">A point plotted at Axis I ${axis1} (Pragmatic to Idealistic, vertical) and Axis II ${axis2} (Pessimistic to Optimistic, horizontal).</desc>
    <style>${CHART_STYLE}</style>
    <rect class="chart-surface" x="${geo.left}" y="${geo.top}" width="${geo.plotW}" height="${geo.plotH}" />
    ${gridAndTicksSVG(geo)}
    ${quadrantLabelsSVG(geo, occupied)}
    <text class="axis-title" x="${(geo.left + geo.right) / 2}" y="${geo.size - 12}" text-anchor="middle">AXIS II: PESSIMISTIC ↔ OPTIMISTIC</text>
    <text class="axis-title" x="18" y="${(geo.top + geo.bottom) / 2}" text-anchor="middle" transform="rotate(-90 18 ${(geo.top + geo.bottom) / 2})">AXIS I: PRAGMATIC ↔ IDEALISTIC</text>
    <circle class="marker-ring" cx="${cx}" cy="${cy}" r="9" />
    <circle class="marker" cx="${cx}" cy="${cy}" r="7" />
    <text class="marker-label" x="${cx}" y="${nameY}" text-anchor="${labelAnchor}">${escapeXML(name)}</text>
    <text class="marker-coords" x="${cx}" y="${coordsY}" text-anchor="${labelAnchor}">(I ${axis1}, II ${axis2})</text>
  </svg>`;
}

// Renders every character in `entries` ({axis1, axis2, name, color}) on one chart.
// Entries sharing an identical (axis1, axis2) pair are nudged into a small ring
// around their true point (in pixel space) so every dot stays visible.
function buildCompareChartSVG(entries) {
  const geo = chartGeometry();

  const occupied = new Set();
  const groups = new Map();
  entries.forEach((entry) => {
    const key = `${entry.axis1},${entry.axis2}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);

    if (Math.abs(entry.axis1) >= DISPLAY_CAP - 1 && Math.abs(entry.axis2) >= DISPLAY_CAP - 1) {
      occupied.add(`${Math.sign(entry.axis1)},${Math.sign(entry.axis2)}`);
    }
  });

  // Markers are drawn at r=6 (12px diameter). Overlapping entries cascade along a
  // diagonal — each one nudged the same distance right as it is up from the one
  // before it — so adjacent markers overlap by about half rather than fully
  // separating. The cascade is centered on the true point, and the entry that
  // paints last (frontmost / on top, i.e. last in the group) sits furthest up-right.
  const MARKER_RADIUS = 6;
  const STEP = MARKER_RADIUS / Math.SQRT2; // diagonal step length == MARKER_RADIUS
  const positioned = [];
  groups.forEach((group) => {
    const baseX = geo.scaleX(group[0].axis2);
    const baseY = geo.scaleY(group[0].axis1);
    const n = group.length;
    group.forEach((entry, i) => {
      const offsetIndex = i - (n - 1) / 2;
      const cx = baseX + offsetIndex * STEP;
      const cy = baseY - offsetIndex * STEP;
      positioned.push({ ...entry, cx, cy });
    });
  });

  const markers = positioned
    .map((p) => {
      const roomAbove = p.cy - geo.top;
      const roomBelow = geo.bottom - p.cy;
      const labelY = roomAbove < 28 ? p.cy + 20 : p.cy - 13;
      let anchor = "middle";
      if (p.cx - geo.left < 55) anchor = "start";
      else if (geo.right - p.cx < 55) anchor = "end";
      return `
    <circle class="marker-ring" cx="${p.cx}" cy="${p.cy}" r="8" />
    <circle cx="${p.cx}" cy="${p.cy}" r="6" fill="${p.color}" />
    <text class="marker-label compact" x="${p.cx}" y="${labelY}" text-anchor="${anchor}">${escapeXML(p.name)}</text>`;
    })
    .join("\n");

  const desc = positioned
    .map((p) => `${p.name}: Axis I ${p.axis1}, Axis II ${p.axis2}`)
    .join("; ");

  return `
  <svg viewBox="0 0 ${geo.size} ${geo.size}" role="img" aria-labelledby="compare-chart-title compare-chart-desc" class="chart-svg">
    <title id="compare-chart-title">Party worldview comparison chart</title>
    <desc id="compare-chart-desc">${entries.length ? escapeXML(desc) : "No characters added yet."}</desc>
    <style>${CHART_STYLE}</style>
    <rect class="chart-surface" x="${geo.left}" y="${geo.top}" width="${geo.plotW}" height="${geo.plotH}" />
    ${gridAndTicksSVG(geo)}
    ${quadrantLabelsSVG(geo, occupied)}
    <text class="axis-title" x="${(geo.left + geo.right) / 2}" y="${geo.size - 12}" text-anchor="middle">AXIS II: PESSIMISTIC ↔ OPTIMISTIC</text>
    <text class="axis-title" x="18" y="${(geo.top + geo.bottom) / 2}" text-anchor="middle" transform="rotate(-90 18 ${(geo.top + geo.bottom) / 2})">AXIS I: PRAGMATIC ↔ IDEALISTIC</text>
    ${markers}
  </svg>`;
}

function escapeXML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  }[c]));
}

// ---------------------------------------------------------------------------
// File save / read helpers
// ---------------------------------------------------------------------------

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeFileName(name) {
  return (name || "character")
    .trim()
    .replace(/[^a-z0-9\- ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "character";
}

function buildResultRecord(characterName, rawAxis1, rawAxis2) {
  const axis1 = clampForDisplay(rawAxis1);
  const axis2 = clampForDisplay(rawAxis2);
  return {
    schema: SCHEMA_VERSION,
    characterName: characterName || "Your character",
    generatedAt: new Date().toISOString(),
    axis1Raw: rawAxis1,
    axis2Raw: rawAxis2,
    axis1,
    axis2,
    archetype: archetypeFor(axis1, axis2).name,
  };
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsText(file);
  });
}

// Accepts a parsed JSON object from a saved results file and returns a normalized
// { characterName, axis1, axis2 } using the raw totals when present (re-deriving
// the display cap here keeps this the single source of truth for that rule).
function normalizeResultRecord(data) {
  if (!data || typeof data !== "object") throw new Error("Not a valid results file.");
  const rawAxis1 = Number.isFinite(data.axis1Raw) ? data.axis1Raw : data.axis1;
  const rawAxis2 = Number.isFinite(data.axis2Raw) ? data.axis2Raw : data.axis2;
  if (!Number.isFinite(rawAxis1) || !Number.isFinite(rawAxis2)) {
    throw new Error("This file doesn't contain Axis I / Axis II scores.");
  }
  return {
    characterName: (data.characterName || "Unnamed character").toString(),
    axis1: clampForDisplay(rawAxis1),
    axis2: clampForDisplay(rawAxis2),
  };
}

// ---------------------------------------------------------------------------
// PNG export — composites a title, optional subtitle/legend, and the chart SVG
// onto a canvas, then triggers a download.
// ---------------------------------------------------------------------------

async function exportChartPNG({ svgElement, filename, title, subtitle, legend }) {
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgDataUrl = "data:image/svg+xml;charset=utf-8;base64," + btoa(unescape(encodeURIComponent(svgString)));

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("Could not rasterize chart"));
    img.src = svgDataUrl;
  });

  const scale = 2;
  const chartSize = 520 * scale;
  const marginX = 50 * scale;
  const headerH = subtitle ? 150 * scale : 110 * scale;
  const legendRowH = 30 * scale;
  const legendH = legend && legend.length ? legend.length * legendRowH + 40 * scale : 0;
  const canvasW = chartSize + marginX * 2;
  const canvasH = headerH + chartSize + legendH + 40 * scale;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");

  // Background: deep mystical gradient plus a scattering of static stars, echoing
  // the site's theme in the exported image.
  const bg = ctx.createLinearGradient(0, 0, 0, canvasH);
  bg.addColorStop(0, "#100c1c");
  bg.addColorStop(1, "#1a1330");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  const starCount = Math.floor((canvasW * canvasH) / 9000);
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * canvasW;
    const y = Math.random() * canvasH;
    const r = Math.random() * 1.4 * scale;
    ctx.globalAlpha = 0.15 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.fillStyle = "#f2c879";
  ctx.font = `600 ${34 * scale}px Georgia, serif`;
  ctx.fillText(title, canvasW / 2, 56 * scale);

  if (subtitle) {
    ctx.fillStyle = "#c9c0e0";
    ctx.font = `${18 * scale}px system-ui, sans-serif`;
    ctx.fillText(subtitle, canvasW / 2, 92 * scale);
  }

  ctx.drawImage(img, marginX, headerH, chartSize, chartSize);

  if (legend && legend.length) {
    let ly = headerH + chartSize + 34 * scale;
    const columns = legend.length > 5 ? 2 : 1;
    const colW = canvasW / (columns + 1);
    legend.forEach((entry, i) => {
      const col = columns === 2 ? i % 2 : 0;
      const row = columns === 2 ? Math.floor(i / 2) : i;
      const x = columns === 2 ? colW * (col + 0.85) : canvasW / 2 - 90 * scale;
      const y = ly + row * legendRowH;
      ctx.beginPath();
      ctx.fillStyle = entry.color;
      ctx.arc(x, y - 6 * scale, 7 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = "left";
      ctx.fillStyle = "#e8e3f5";
      ctx.font = `${16 * scale}px system-ui, sans-serif`;
      ctx.fillText(entry.label, x + 16 * scale, y);
    });
  }

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------------------------------------------------------------------------
// Starfield background
// ---------------------------------------------------------------------------

function initStarfield() {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let stars = [];
  let width;
  let height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.floor((width * height) / 4500);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
      baseAlpha: 0.3 + Math.random() * 0.5,
    }));
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((s) => {
      const twinkle = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(time * 0.001 * s.speed + s.phase);
      ctx.globalAlpha = s.baseAlpha * twinkle;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

document.addEventListener("DOMContentLoaded", initStarfield);
