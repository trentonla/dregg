// Answer normalization and trace similarity. Pure functions; no DOM.
import { resolveUnits } from "./combinations.js";
import { UNIT_BY_ID } from "./units.js";

export function normalizeAnswer(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z]/g, "");
}

function unitsFor(record, track) {
  if (!record) return [];
  return track === "core" ? record.core || [] : record.full || record.core || [];
}

function sameUnits(a, b) {
  return a.length === b.length && a.every((unit, index) => unit === b[index]);
}

function drawnFor(record, track, blends) {
  return resolveUnits(unitsFor(record, track), record?.w || "", { blends }).units;
}

// Learner-specific read answers that sit outside the Gregg homophone rule but
// should still be accepted (e.g. the learner says "eddy", the answer is "eddie").
export const READ_ANSWER_OVERRIDES = Object.freeze({
  eddie: Object.freeze(["eddy"]),
});

// Read mode accepts any spelling whose active-track outline matches. That is
// the Gregg homophone rule, not a loophole: team/teem share one outline. The
// optional overrides map accepts a manual spelling for a word (e.g. the learner
// says "eddy", the answer is "eddie").
export function acceptedAnswers(item, lexicon = [], overrides = {}) {
  const track = item.track || "core";
  const blends = new Set((item.units || []).filter((id) => UNIT_BY_ID[id]?.kind === "blend"));
  const units = item.units || drawnFor(item.word, track, blends);
  const accepted = lexicon
    .filter((record) => sameUnits(drawnFor(record, track, blends), units))
    .map((record) => record.w);
  const manual = [...(overrides?.[item.word?.w] || []), ...(READ_ANSWER_OVERRIDES[item.word?.w] || [])];
  for (const word of manual) if (word && !accepted.includes(word)) accepted.push(word);
  if (item.word?.w && !accepted.includes(item.word.w)) accepted.unshift(item.word.w);
  return [...new Set(accepted)];
}

export function gradeRead(answer, item, lexicon = [], overrides = {}) {
  const accepted = acceptedAnswers(item, lexicon, overrides);
  const normalized = normalizeAnswer(answer);
  const correct = Boolean(normalized) && accepted.some((word) => normalizeAnswer(word) === normalized);
  return {
    correct,
    expected: item.word?.w || "",
    accepted,
    normalized,
  };
}

export function gradeDrill(answer, item) {
  const expected = item.drill?.answer || item.word?.w || "";
  return {
    correct: String(answer) === String(expected),
    expected,
  };
}

function flatten(strokes) {
  const out = [];
  for (const stroke of strokes || []) {
    for (const point of stroke || []) {
      if (Number.isFinite(point?.x) && Number.isFinite(point?.y)) out.push({ x: point.x, y: point.y });
    }
  }
  return out;
}

function normalizePoints(points) {
  if (!points.length) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const scale = 1 / Math.max(maxX - minX, maxY - minY, 1e-6);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return points.map((point) => ({ x: (point.x - cx) * scale, y: (point.y - cy) * scale }));
}

function resample(points, count = 64) {
  if (points.length < 2) return points.slice();
  const distances = [0];
  for (let i = 1; i < points.length; i += 1) {
    distances.push(distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const total = distances[distances.length - 1];
  if (total < 1e-9) return Array.from({ length: count }, () => ({ ...points[0] }));
  const out = [];
  let index = 0;
  for (let i = 0; i < count; i += 1) {
    const target = (i / (count - 1)) * total;
    while (index < distances.length - 2 && distances[index + 1] < target) index += 1;
    const span = distances[index + 1] - distances[index] || 1e-9;
    const t = (target - distances[index]) / span;
    out.push({
      x: points[index].x + (points[index + 1].x - points[index].x) * t,
      y: points[index].y + (points[index + 1].y - points[index].y) * t,
    });
  }
  return out;
}

function dtw(a, b) {
  const rows = a.length;
  const cols = b.length;
  if (!rows || !cols) return Infinity;
  let previous = new Array(cols + 1).fill(Infinity);
  let current = new Array(cols + 1).fill(Infinity);
  previous[0] = 0;
  for (let i = 1; i <= rows; i += 1) {
    current[0] = Infinity;
    for (let j = 1; j <= cols; j += 1) {
      const cost = Math.hypot(a[i - 1].x - b[j - 1].x, a[i - 1].y - b[j - 1].y);
      current[j] = cost + Math.min(previous[j], current[j - 1], previous[j - 1]);
    }
    [previous, current] = [current, previous];
  }
  return previous[cols] / Math.max(rows, cols);
}

function directionOf(points) {
  if (points.length < 2) return { x: 0, y: 0 };
  const first = points[0];
  const last = points[points.length - 1];
  const length = Math.hypot(last.x - first.x, last.y - first.y) || 1;
  return { x: (last.x - first.x) / length, y: (last.y - first.y) / length };
}

// Trace conformity: compare the learner's ordered ink with the taught outline.
// Normalized, resampled, DTW-aligned; direction is a separate hard-ish penalty.
export function traceScore(userStrokes, targetSegments) {
  const user = flatten(userStrokes);
  const target = flatten((targetSegments || []).map((segment) => segment.points || []));
  if (user.length < 8 || target.length < 8) {
    return {
      score: 0,
      passed: false,
      confidence: user.length / 8,
      issues: ["Not enough ink to score. Trace the whole outline."],
      matchedVariant: "taught",
    };
  }

  const a = resample(normalizePoints(user));
  const b = resample(normalizePoints(target));
  const distance = dtw(a, b);
  const direction = directionOf(a);
  const expected = directionOf(b);
  const alignment = direction.x * expected.x + direction.y * expected.y;
  const directionPenalty = alignment < -0.25 ? 0.18 : alignment < 0.2 ? 0.08 : 0;
  const score = Math.max(0, Math.min(1, 1 - distance / 0.35 - directionPenalty));
  const confidence = Math.min(1, user.length / 24);
  const issues = [];
  if (alignment < 0.2) issues.push("The direction of the trace looks reversed.");
  if (distance > 0.16) issues.push("The shape drifts from the taught outline.");
  return {
    score,
    passed: score >= 0.62 && confidence >= 0.5,
    confidence,
    issues,
    matchedVariant: "taught",
  };
}

export { flatten as flattenStrokes, normalizePoints, resample };
