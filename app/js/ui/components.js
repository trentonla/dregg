// Small render helpers shared by screens. Strings only; no framework.
import { UNIT_FRAME, outlineForUnit, outlineForWord, outlineSvg, referenceViewBox } from "../outline.js";
import { unitFor } from "../units.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function unitLabel(id) {
  return unitFor(id)?.label || id;
}

export function unitGlyph(id, track = "core", { className = "glyph", label = unitLabel(id), viewBox, frame = UNIT_FRAME } = {}) {
  const outline = outlineForUnit(id, track);
  return outlineSvg(outline, {
    className,
    label,
    viewBox: viewBox === undefined ? referenceViewBox(outline, frame) : viewBox,
  });
}

export function wordOutline(record, track = "core", { className = "outline outline--large", label, viewBox, ...options } = {}) {
  const outline = outlineForWord(record, track, options);
  return outlineSvg(outline, {
    className,
    label: label || `Outline for ${record.w}`,
    viewBox: viewBox === undefined ? referenceViewBox(outline) : viewBox,
  });
}

export function unitChip(id, track = "core", { glyph = true } = {}) {
  // Chips are tiny decorative icons; a fixed frame would shrink them to dots.
  return `<span class="chip">${glyph ? unitGlyph(id, track, { className: "chip-glyph", viewBox: null }) : ""}<span>${escapeHtml(unitLabel(id))}</span></span>`;
}

export function breakdown(units, track = "core") {
  if (!units?.length) return "";
  return `<div class="breakdown" aria-label="Stroke breakdown">${units.map((unit) => unitChip(unit, track)).join("")}</div>`;
}

export function progressBar(value, max = 1, label = "Progress") {
  const safeMax = max || 1;
  return `<progress class="bar" value="${Math.max(0, Math.min(safeMax, value))}" max="${safeMax}" aria-label="${escapeHtml(label)}"></progress>`;
}

export function ring(value, { label = "Mastery", size = 44 } = {}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, value)));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 36 36" role="img" aria-label="${escapeHtml(label)}: ${Math.round(value * 100)}%">
    <circle class="ring-track" cx="18" cy="18" r="${radius}"></circle>
    <circle class="ring-fill" cx="18" cy="18" r="${radius}" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>
  </svg>`;
}

export function pageHeader(title, subtitle = "", { eyebrow = "" } = {}) {
  return `<header class="page-head">
    ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="lead">${escapeHtml(subtitle)}</p>` : ""}
  </header>`;
}

export function phonemes(record) {
  const phones = (record?.arpabet || []).join(" ");
  return phones ? `<p class="phonemes" aria-label="Phonemes">${escapeHtml(phones)}</p>` : "";
}

export function emptyState(title, body, action = "") {
  return `<div class="empty"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>${action}</div>`;
}

export function modeLabel(mode) {
  return { read: "Read", write: "Write", trace: "Trace", drill: "Drill", dictation: "Dictation" }[mode] || mode;
}

export function percent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}
