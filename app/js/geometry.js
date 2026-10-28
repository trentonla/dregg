// Small vector, Bézier, and path helpers. All geometry is in u units.

export const V = (x, y) => ({ x, y });
export const add = (a, b) => V(a.x + b.x, a.y + b.y);
export const sub = (a, b) => V(a.x - b.x, a.y - b.y);
export const scale = (a, k) => V(a.x * k, a.y * k);
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const length = (a) => Math.hypot(a.x, a.y);
export const dist = (a, b) => length(sub(a, b));
export const normalize = (a) => {
  const l = length(a);
  return l < 1e-9 ? V(1, 0) : V(a.x / l, a.y / l);
};
// Rotate -90°: the left normal for a horizontal stroke points up (SVG y down).
export const normal = (a) => V(a.y, -a.x);
export const rotate = (a, radians) =>
  V(a.x * Math.cos(radians) - a.y * Math.sin(radians), a.x * Math.sin(radians) + a.y * Math.cos(radians));

export const direction = (angleDeg) => {
  const r = (angleDeg * Math.PI) / 180;
  return V(Math.cos(r), Math.sin(r));
};

export const fmt = (n) => {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

export const pointPath = (p) => `${fmt(p.x)} ${fmt(p.y)}`;

export function pathLine(p0, p1) {
  return `M${pointPath(p0)} L${pointPath(p1)}`;
}

export function pathCubic(p0, c1, c2, p3) {
  return `M${pointPath(p0)} C${pointPath(c1)} ${pointPath(c2)} ${pointPath(p3)}`;
}

export function cubicPoint(p0, c1, c2, p3, t) {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return V(
    a * p0.x + b * c1.x + c * c2.x + d * p3.x,
    a * p0.y + b * c1.y + c * c2.y + d * p3.y,
  );
}

export function sampleCubic(p0, c1, c2, p3, steps = 12) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) points.push(cubicPoint(p0, c1, c2, p3, i / steps));
  return points;
}

export function sampleQuad(p0, c, p1, steps = 12) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    points.push(
      V(mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x, mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y),
    );
  }
  return points;
}

export function sampleEllipse(cx, cy, rx, ry, steps = 20) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    points.push(V(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry));
  }
  return points;
}

// A circle tangent to p, on the normal side. Starts and ends at p so the pen can continue.
export function tangentEllipsePath(p, sideNormal, rx, ry) {
  const end = add(p, scale(sideNormal, 2 * Math.max(rx, ry)));
  return {
    d: `M${pointPath(p)} A${fmt(rx)} ${fmt(ry)} 0 1 1 ${pointPath(end)} A${fmt(rx)} ${fmt(ry)} 0 1 1 ${pointPath(p)}`,
    points: sampleEllipse(p.x + sideNormal.x * rx, p.y + sideNormal.y * ry, rx, ry),
  };
}

const TAU = Math.PI * 2;

// A vowel circle written as a loop in the stroke: it leaves p, runs the long way
// round a circle of radius r toward `side`, and arrives at q ready for the next
// stroke. The pen never lifts and the next stroke starts on the far side.
export function loopArcPath(p, q, r, side) {
  const chord = sub(q, p);
  const len = Math.max(length(chord), 1e-6);
  const radius = Math.max(r, len / 2 + 1e-4);
  const mid = V((p.x + q.x) / 2, (p.y + q.y) / 2);
  const nc = normal(normalize(chord));
  const h = Math.sqrt(Math.max(radius * radius - (len * len) / 4, 0));
  const center = add(mid, scale(nc, dot(nc, side) < 0 ? -h : h));
  const a0 = Math.atan2(p.y - center.y, p.x - center.x);
  const a1 = Math.atan2(q.y - center.y, q.x - center.x);
  const ccw = ((a1 - a0) % TAU + TAU) % TAU;
  // Take the major arc so the sign reads as a circle, not a bump.
  const sweep = ccw > Math.PI ? ccw : ccw - TAU;
  const steps = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2)));
  const step = sweep / steps;
  const points = [];
  let d = "";
  for (let i = 0; i < steps; i += 1) {
    const from = a0 + step * i;
    const to = from + step;
    const k = (4 / 3) * Math.tan(step / 4);
    const p0 = V(center.x + radius * Math.cos(from), center.y + radius * Math.sin(from));
    const p3 = V(center.x + radius * Math.cos(to), center.y + radius * Math.sin(to));
    const c1 = V(p0.x - radius * k * Math.sin(from), p0.y + radius * k * Math.cos(from));
    const c2 = V(p3.x + radius * k * Math.sin(to), p3.y - radius * k * Math.cos(to));
    d += `${i === 0 ? `M${pointPath(p0)}` : ""} C${pointPath(c1)} ${pointPath(c2)} ${pointPath(p3)}`;
    points.push(...sampleCubic(p0, c1, c2, p3).slice(i === 0 ? 0 : 1));
  }
  return { d, points, center, radius };
}

export function bounds(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function translatePoints(points, delta) {
  return points.map((p) => add(p, delta));
}

export function distinctPoints(points, epsilon = 1e-6) {
  const out = [];
  for (const p of points) {
    if (!out.length || dist(out[out.length - 1], p) > epsilon) out.push(p);
  }
  return out;
}

export function polylinePath(points) {
  if (!points.length) return "";
  return `M${pointPath(points[0])} ${points
    .slice(1)
    .map((p) => `L${pointPath(p)}`)
    .join(" ")}`;
}
