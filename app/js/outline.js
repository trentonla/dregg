// Unit sequence -> deterministic SVG path, pen segments, and placement notes.
import {
  CORE_ALIAS,
  CORE_VOWEL_BY_FAMILY,
  UNIT_BY_ID,
  glyphFor,
  isDiphthong,
  isGlide,
  isVowel,
} from "./units.js";
import {
  isVowelLike,
  resolveUnits,
  selectGlideVariant,
  selectJoinVariant,
  selectVariant,
} from "./combinations.js";
import {
  add,
  bounds,
  direction,
  dist,
  fmt,
  loopArcPath,
  normal,
  normalize,
  pathCubic,
  pathLine,
  pointPath,
  rotate,
  sampleCubic,
  sampleEllipse,
  scale,
  sub,
  tangentEllipsePath,
} from "./geometry.js";

const PADDING = 0.35;
// Vowel marks sit below the sign, never on the side the circle happens to hang.
const MARK_BELOW = { x: 0, y: 1 };

function displayId(id, track) {
  const core = track === "core" ? CORE_ALIAS[id] || id : id;
  return CORE_VOWEL_BY_FAMILY[core] || core;
}

function glyphOf(id, track, variant) {
  return glyphFor(displayId(id, track), variant);
}

function sideLabel(vector) {
  if (Math.abs(vector.y) >= Math.abs(vector.x)) return vector.y < 0 ? "above" : "below";
  return vector.x < 0 ? "left" : "right";
}

function sideSign(vector) {
  return vector.y !== 0 ? (vector.y < 0 ? 1 : -1) : vector.x < 0 ? -1 : 1;
}

function makeSegment(unitId, kind, liftBefore, d, points) {
  return { unitId, kind, liftBefore, d, points };
}

function circleRadius(glyph) {
  return (glyph.rx + glyph.ry) / 2;
}

// The direction the next stroke leaves the joint, so a circle can end on its far side.
function nextStrokeDir(id, track) {
  if (!id) return null;
  const unit = UNIT_BY_ID[displayId(id, track)];
  if (!unit || (unit.kind !== "consonant" && unit.kind !== "blend")) return null;
  const glyph = unit.glyph;
  if (!glyph || glyph.type === "dot" || glyph.type === "ellipse") return null;
  return direction(glyph.angle || 0);
}

// Which side of the next stroke the loop hangs on: the side the previous stroke
// points toward, or the right of the next stroke when the two are in line.
function loopSide(prevDir, nextDir) {
  const right = { x: -nextDir.y, y: nextDir.x };
  if (!prevDir) return right;
  return prevDir.x * right.x + prevDir.y * right.y < 0 ? { x: -right.x, y: -right.y } : right;
}

function prevStrokeDir(prevId, track) {
  if (!prevId) return null;
  const unit = UNIT_BY_ID[displayId(prevId, track)];
  if (!unit || unit.kind !== "consonant") return null;
  const glyph = unit.glyph;
  if (!glyph || glyph.type === "dot" || glyph.type === "ellipse" || glyph.type === "composite") return null;
  return direction(glyph.angle || 0);
}

// The consonant the r circle attaches after, looking back over the vowel.
function precedingConsonant(seq, index, track) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const unit = UNIT_BY_ID[displayId(seq[i], track)];
    if (unit?.kind === "consonant") return unit.id;
  }
  return null;
}

function placeConsonant(id, pen, variant, track, join = null) {
  const glyph = glyphOf(id, track, variant);
  if (!glyph) return null;

  if (glyph.type === "dot") {
    const d = `M${pointPath(add(pen, { x: -glyph.r, y: 0 }))} A${fmt(glyph.r)} ${fmt(glyph.r)} 0 1 1 ${pointPath(add(pen, { x: glyph.r, y: 0 }))} A${fmt(glyph.r)} ${fmt(glyph.r)} 0 1 1 ${pointPath(add(pen, { x: -glyph.r, y: 0 }))}`;
    return {
      segment: makeSegment(id, "dot", true, d, sampleEllipse(pen.x, pen.y, glyph.r, glyph.r)),
      placement: {
        unitId: id,
        rule: "on-straight",
        side: "above",
        anchorUnitId: null,
        note: "The h dot sits at the vowel.",
      },
      end: pen,
      dir: { x: 1, y: 0 },
      bulge: 0,
    };
  }

  if (glyph.type === "ellipse") {
    const up = { x: 0, y: -1 };
    const side = join?.side || up;
    const r = circleRadius(glyph);
    if (join?.dir && join.final) {
      // A final r circle sits on the line like a loop in the stroke (scan p55),
      // so the circle is tangent along the preceding stroke, not below it.
      const placed = tangentEllipsePath(pen, join.dir, glyph.rx, glyph.ry);
      return {
        segment: makeSegment(id, "circle", true, placed.d, placed.points),
        placement: {
          unitId: id,
          rule: "final",
          side: sideLabel(join.dir),
          anchorUnitId: null,
          note: "Post-vocalic r is a small circle at the end of the stroke.",
        },
        end: add(pen, scale(join.dir, r * 2)),
        dir: join.dir,
        bulge: 0,
      };
    }
    if (join?.dir) {
      const end = add(pen, scale(join.dir, r));
      const loop = loopArcPath(pen, end, r, side);
      return {
        segment: makeSegment(id, "circle", false, loop.d, loop.points),
        placement: {
          unitId: id,
          rule: "join",
          side: sideLabel(side),
          anchorUnitId: null,
          note: "Post-vocalic r is a small circle; the next stroke starts on its far side.",
        },
        end,
        dir: join.dir,
        bulge: 0,
      };
    }
    const placed = tangentEllipsePath(pen, side, glyph.rx, glyph.ry);
    return {
      segment: makeSegment(id, "circle", true, placed.d, placed.points),
      placement: {
        unitId: id,
        rule: "final",
        side: sideLabel(side),
        anchorUnitId: null,
        note: "Post-vocalic r is a small circle.",
      },
      end: pen,
      dir: up,
      bulge: 0,
    };
  }

  if (glyph.type === "composite") {
    return placeComposite(id, glyph, pen, { x: 0, y: -1 }, 1);
  }

  const dir = direction(glyph.angle || 0);
  const n = normal(dir);
  const length = glyph.length || 1;
  const bulge = glyph.bulge || 0;
  const end = add(pen, scale(dir, length));
  let d;
  let points;
  let kind = "stroke";

  if (glyph.type === "line") {
    d = pathLine(pen, end);
    points = [pen, end];
  } else if (glyph.type === "dash") {
    d = pathLine(pen, end);
    points = [pen, end];
    kind = "dash";
  } else if (glyph.type === "hook") {
    const c1 = add(add(pen, scale(dir, length * 0.35)), scale(n, bulge));
    const c2 = add(add(pen, scale(dir, length * 0.85)), scale(n, bulge * 0.6));
    d = pathCubic(pen, c1, c2, end);
    points = sampleCubic(pen, c1, c2, end);
    kind = "hook";
  } else if (glyph.type === "curve") {
    if (glyph.sCurve) {
      const sign = glyph.mirror ? -1 : 1;
      const c1 = add(add(pen, scale(dir, length * 0.3)), scale(n, 0.2 * sign));
      const c2 = add(add(pen, scale(dir, length * 0.7)), scale(n, -0.2 * sign));
      d = pathCubic(pen, c1, c2, end);
      points = sampleCubic(pen, c1, c2, end);
    } else {
      const bend = bulge * length * 1.35;
      const c1 = add(add(pen, scale(dir, length / 3)), scale(n, bend));
      const c2 = add(add(pen, scale(dir, (length * 2) / 3)), scale(n, bend));
      d = pathCubic(pen, c1, c2, end);
      points = sampleCubic(pen, c1, c2, end);
    }
  } else {
    d = pathLine(pen, end);
    points = [pen, end];
  }

  const placement = {
    unitId: id,
    rule: bulge !== 0 ? "inside-curve" : "on-straight",
    side: sideLabel(n),
    anchorUnitId: null,
    note: bulge !== 0 ? "Stroke keeps its absolute orientation." : "Straight stroke.",
  };
  return { segment: makeSegment(id, kind, false, d, points), placement, end, dir, bulge };
}

// The o/oo signs are half an ellipse: the pen starts on one tip, runs the
// curve, and stops on the other tip. `open` is the side the two tips face.
// `at` is the starting tip so the sign touches the stroke it hangs on.
function halfEllipsePath(at, glyph, baseDeg = 0) {
  const open = glyph.open;
  const rx = glyph.rx ?? 0.22;
  const ry = glyph.ry ?? 0.18;
  const deg = baseDeg + (glyph.angle || 0);
  const rad = (deg * Math.PI) / 180;
  const sign = open === "up" ? 1 : -1;
  const local = (t) => ({ x: rx * Math.cos(t), y: sign * ry * Math.sin(t) });
  const center = sub(at, rotate(local(Math.PI), rad));
  const place = (p) => add(center, rotate(p, rad));
  const start = at;
  const end = place(local(0));
  const sweep = open === "up" ? 0 : 1;
  const d = `M${pointPath(start)} A${fmt(rx)} ${fmt(ry)} ${fmt(deg)} 0 ${sweep} ${pointPath(end)}`;
  const points = [];
  for (let i = 0; i <= 16; i += 1) points.push(place(local(Math.PI - (Math.PI * i) / 16)));
  const dir = rotate({ x: 0, y: -sign }, rad);
  return { d, points, end, dir, start, center, rx, ry };
}

function placeComposite(id, glyph, pen, n, side) {
  const segments = [];
  const placements = [];
  let end = pen;
  let prev = null;
  for (const part of glyph.parts || []) {
    const g = part.glyph;
    let at = pen;
    let outward = n;
    let baseDeg = 0;
    if (prev) {
      if (part.attach === "rim" && prev.type === "ellipse") {
        // Attach at the upper-right of the previous circle, tangent to it.
        const dir = rotate(prev.normal, Math.PI / 4);
        at = add(prev.center, { x: prev.rx * dir.x, y: prev.ry * dir.y });
        outward = dir;
        baseDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
      } else {
        at = prev.end;
        outward = prev.dir;
        baseDeg = (Math.atan2(outward.y, outward.x) * 180) / Math.PI;
      }
    }
    if (g.type === "ellipse") {
      const placed = tangentEllipsePath(at, outward, g.rx, g.ry);
      segments.push(makeSegment(id, "circle", true, placed.d, placed.points));
      prev = {
        type: "ellipse",
        center: add(at, { x: outward.x * g.rx, y: outward.y * g.ry }),
        rx: g.rx,
        ry: g.ry,
        normal: outward,
        end: at,
        dir: outward,
      };
      end = at;
    } else if (g.type === "half-ellipse") {
      const placed = halfEllipsePath(at, g, baseDeg);
      segments.push(makeSegment(id, "hook", true, placed.d, placed.points));
      prev = {
        type: "half-ellipse",
        center: placed.center,
        rx: placed.rx,
        ry: placed.ry,
        normal: outward,
        end: placed.end,
        dir: placed.dir,
      };
      end = placed.end;
    } else {
      const dir = direction(g.angle || 0);
      const nn = normal(dir);
      const len = g.length || 0.4;
      const p3 = add(at, scale(dir, len));
      const bulge = (g.bulge ?? 0.18) * side;
      const c1 = add(add(at, scale(dir, len * 0.3)), scale(nn, bulge));
      const c2 = add(add(at, scale(dir, len * 0.8)), scale(nn, bulge * 0.6));
      segments.push(makeSegment(id, "hook", true, pathCubic(at, c1, c2, p3), sampleCubic(at, c1, c2, p3)));
      prev = { type: "hook", end: p3, dir };
      end = p3;
    }
  }
  placements.push({
    unitId: id,
    rule: "inside-curve",
    side: sideLabel(n),
    anchorUnitId: null,
    note: "Diphthong is placed as one composite glyph.",
  });
  return { segments, placements, end };
}

function placeOrnament(id, pen, prevId, nextId, track, index, total, word, loopDir = null, final = false) {
  const segments = [];
  const placements = [];
  const prevUnit = prevId ? UNIT_BY_ID[displayId(prevId, track)] : null;
  const nextUnit = nextId ? UNIT_BY_ID[displayId(nextId, track)] : null;
  // The dot or tick lives on the unit, not the glyph definition.
  const mark = UNIT_BY_ID[displayId(id, track)]?.mark;

  let n = { x: 0, y: -1 };
  let side = 1;
  let rule = "initial";
  let note = "Vowel at the start of the outline.";

  if (prevUnit && prevUnit.kind === "consonant") {
    const prevDir = direction(prevUnit.glyph.angle || 0);
    n = normal(prevDir);
    const bulge = prevUnit.glyph.bulge || 0;
    if (bulge !== 0) {
      side = -Math.sign(bulge);
      rule = "inside-curve";
      note = `Vowel sits inside the ${prevUnit.label} curve.`;
    } else if (nextUnit && nextUnit.kind === "consonant") {
      const nextDir = direction(nextUnit.glyph.angle || 0);
      const cross = prevDir.x * nextDir.y - prevDir.y * nextDir.x;
      if (Math.abs(cross) > 0.25) {
        side = cross > 0 ? 1 : -1;
        rule = "outside-angle";
        note = "Vowel sits outside the angle.";
      } else {
        rule = "on-straight";
        note = "Vowel sits on top of the straight stroke.";
      }
    } else {
      rule = "on-straight";
      note = "Vowel sits on top of the straight stroke.";
    }
  } else if (prevId) {
    n = { x: 0, y: -1 };
    rule = "inside-curve";
    note = "Vowel follows another vowel sign.";
  }

  const placement = {
    unitId: id,
    rule,
    side: sideLabel(scale(n, side)),
    anchorUnitId: prevId,
    note,
  };
  const nextDir = nextStrokeDir(nextId, track);
  const joinDir = loopDir || nextDir;
  const prevDir = prevStrokeDir(prevId, track);
  const sideVec =
    prevUnit && prevUnit.kind === "consonant" && prevUnit.glyph.bulge
      ? scale(n, side)
      : joinDir
        ? loopSide(prevDir, joinDir)
        : prevDir || { x: 1, y: 0 };

  if (isGlide(id)) {
    const unit = UNIT_BY_ID[id];
    const variant = selectGlideVariant(id, index, total, prevId, nextId);
    const glyph = unit.variants?.[variant] || unit.glyph;
    if (glyph.type === "dash") {
      const dir = { x: 1, y: 0 };
      const at = add(pen, scale(n, side * 0.1));
      const end = add(at, scale(dir, glyph.length));
      segments.push(makeSegment(id, "dash", true, pathLine(at, end), [at, end]));
      placements.push({ ...placement, rule: "initial", note: "Medial w is a dash under the vowel." });
      return { segments, placements };
    }
    if (glyph.type === "ellipse") {
      const placed = tangentEllipsePath(pen, scale(n, side), glyph.rx, glyph.ry);
      segments.push(makeSegment(id, "circle", true, placed.d, placed.points));
      placements.push(placement);
      const radius = Math.max(glyph.rx, glyph.ry);
      return { segments, placements, end: add(pen, scale(nextDir || { x: 1, y: 0 }, radius * 2)) };
    }
    const dir = direction(glyph.angle || 0);
    const nn = normal(dir);
    const len = glyph.length || 0.4;
    const p3 = add(pen, scale(dir, len));
    const c1 = add(add(pen, scale(dir, len * 0.3)), scale(nn, (glyph.bulge || 0.18) * side));
    const c2 = add(add(pen, scale(dir, len * 0.8)), scale(nn, (glyph.bulge || 0.18) * side * 0.6));
    segments.push(makeSegment(id, "hook", true, pathCubic(pen, c1, c2, p3), sampleCubic(pen, c1, c2, p3)));
    placements.push(placement);
    return { segments, placements, end: p3 };
  }

  const glyph = glyphOf(id, track);
  if (!glyph) return { segments, placements };

  if (glyph.type === "composite") {
    const composite = placeComposite(id, glyph, pen, scale(n, side), side);
    segments.push(...composite.segments);
    placements.push(placement);
    return { segments, placements, end: composite.end };
  }

  if (glyph.type === "ellipse") {
    const r = circleRadius(glyph);
    if (final && joinDir) {
      // A final r that the vowel circle carries is a small closed circle at the
      // end of the stroke, not an open loop (scans p29/p55).
      const placed = tangentEllipsePath(pen, joinDir, glyph.rx, glyph.ry);
      const radius = Math.max(glyph.rx, glyph.ry);
      segments.push(makeSegment(id, "circle", true, placed.d, placed.points));
      if (mark === "dot" || mark === "tick") {
        segments.push(markSegment(id, add(pen, scale(joinDir, radius)), MARK_BELOW, mark, radius));
      }
      placements.push({
        ...placement,
        rule: "final",
        note: "Final r is a small closed circle at the end of the stroke.",
      });
      return { segments, placements, end: add(pen, scale(joinDir, radius * 2)) };
    }
    if (joinDir) {
      const end = add(pen, scale(joinDir, r));
      const loop = loopArcPath(pen, end, r, sideVec);
      segments.push(makeSegment(id, "circle", false, loop.d, loop.points));
      if (mark === "dot" || mark === "tick") {
        segments.push(markSegment(id, loop.center, MARK_BELOW, mark, r));
      }
      placements.push({
        ...placement,
        rule: "join",
        note: loopDir
          ? `${note} The circle is written as a loop and carries the r.`
          : `${note} The circle is written as a loop into the next stroke.`,
      });
      return { segments, placements, end };
    }
    const placed = tangentEllipsePath(pen, sideVec, glyph.rx, glyph.ry);
    segments.push(makeSegment(id, "circle", true, placed.d, placed.points));
    const radius = Math.max(glyph.rx, glyph.ry);
    const center = add(pen, scale(sideVec, radius));
    if (mark === "dot" || mark === "tick") {
      segments.push(markSegment(id, center, MARK_BELOW, mark, radius));
    }
    placements.push(placement);
    // A following circle consonant (r after a vowel) starts on the far side of
    // this circle instead of piling up on the same point.
    const nextIsCircle = nextUnit && nextUnit.kind === "consonant" && nextUnit.glyph?.type === "ellipse";
    const end = nextIsCircle ? add(pen, scale(sideVec, radius * 2)) : undefined;
    return { segments, placements, end };
  }

  if (glyph.type === "half-ellipse") {
    const placed = halfEllipsePath(pen, glyph);
    segments.push(makeSegment(id, "hook", true, placed.d, placed.points));
    if (mark === "dot" || mark === "tick") {
      segments.push(markSegment(id, placed.center, MARK_BELOW, mark, placed.ry));
    }
    placements.push(placement);
    return { segments, placements, end: placed.end };
  }

  if (glyph.type === "hook") {
    const dir = direction(glyph.angle || 0);
    const nn = normal(dir);
    const len = glyph.length || 0.45;
    const p3 = add(pen, scale(dir, len));
    const c1 = add(add(pen, scale(dir, len * 0.3)), scale(nn, (glyph.bulge || 0.18) * side));
    const c2 = add(add(pen, scale(dir, len * 0.8)), scale(nn, (glyph.bulge || 0.18) * side * 0.6));
    segments.push(makeSegment(id, "hook", true, pathCubic(pen, c1, c2, p3), sampleCubic(pen, c1, c2, p3)));
    if (mark === "dot" || mark === "tick") {
      segments.push(markSegment(id, pen, MARK_BELOW, mark, 0.32));
    }
    placements.push(placement);
    return { segments, placements };
  }

  if (glyph.type === "dot") {
    segments.push(
      makeSegment(
        id,
        "dot",
        true,
        `M${pointPath(add(pen, { x: -glyph.r, y: 0 }))} A${fmt(glyph.r)} ${fmt(glyph.r)} 0 1 1 ${pointPath(add(pen, { x: glyph.r, y: 0 }))} A${fmt(glyph.r)} ${fmt(glyph.r)} 0 1 1 ${pointPath(add(pen, { x: -glyph.r, y: 0 }))}`,
        sampleEllipse(pen.x, pen.y, glyph.r, glyph.r),
      ),
    );
    placements.push(placement);
  }

  return { segments, placements };
}

function markSegment(unitId, center, outward, mark, radius) {
  const at = add(center, scale(outward, radius + 0.16));
  if (mark === "dot") {
    const r = 0.05;
    return makeSegment(
      unitId,
      "mark",
      true,
      `M${pointPath(add(at, { x: -r, y: 0 }))} A${fmt(r)} ${fmt(r)} 0 1 1 ${pointPath(add(at, { x: r, y: 0 }))} A${fmt(r)} ${fmt(r)} 0 1 1 ${pointPath(add(at, { x: -r, y: 0 }))}`,
      sampleEllipse(at.x, at.y, r, r),
    );
  }
  const d = direction(45);
  const p1 = add(at, scale(d, -0.12));
  const p2 = add(at, scale(d, 0.13));
  return makeSegment(unitId, "mark", true, pathLine(p1, p2), [p1, p2]);
}

function dotAt(unitId, at, note) {
  const r = 0.05;
  return makeSegment(
    unitId,
    "dot",
    true,
    `M${pointPath(add(at, { x: -r, y: 0 }))} A${fmt(r)} ${fmt(r)} 0 1 1 ${pointPath(add(at, { x: r, y: 0 }))} A${fmt(r)} ${fmt(r)} 0 1 1 ${pointPath(add(at, { x: -r, y: 0 }))}`,
    sampleEllipse(at.x, at.y, r, r),
  );
}

export function renderOutline(unitIds, track = "core", options = {}) {
  const word = options.word || "";
  const resolved = resolveUnits(unitIds, word, {
    contractions: options.contractions !== false,
    // `undefined` means "default (on)"; a Set (possibly empty) means "only these".
    blends: options.blends === undefined ? true : options.blends,
  });
  const seq = resolved.units;
  const contractionResult = { contractions: resolved.contractions };
  const segments = [];
  const placements = [];
  let pen = { x: 0, y: 0 };
  let prevId = null;

  for (let i = 0; i < seq.length; i += 1) {
    const id = seq[i];
    const nextId = seq[i + 1];
    const unit = UNIT_BY_ID[id] || (CORE_VOWEL_BY_FAMILY[id] ? UNIT_BY_ID[CORE_VOWEL_BY_FAMILY[id]] : null);
    if (!unit) continue;

    if (unit.kind === "blend") {
      const placed = placeConsonant(id, pen, null, track);
      if (placed) {
        segments.push(placed.segment);
        placements.push({ ...placed.placement, rule: "blend", note: "Blended join." });
        pen = placed.end;
        prevId = id;
      }
      continue;
    }

    if (isVowel(id) && nextId === "r" && glyphOf(id, track)?.type === "ellipse" && selectVariant("r", id, seq[i + 2], word) === "circle") {
      // Scans p29/p55: r after a circle vowel is the same left-motion circle, so
      // the vowel is written as one loop that carries the r (and a final s).
      const afterR = seq[i + 2];
      const sFinal = afterR === "s" && i + 3 === seq.length;
      const finalR = afterR == null;
      const beforeId = precedingConsonant(seq, i, track);
      const loopDir = (sFinal ? null : nextStrokeDir(afterR, track)) || prevStrokeDir(beforeId, track) || { x: 1, y: 0 };
      const placed = placeOrnament(id, pen, prevId, nextId, track, i, seq.length, word, loopDir, finalR);
      segments.push(...placed.segments);
      placements.push(...placed.placements);
      if (placed.end) pen = placed.end;
      prevId = sFinal ? "s" : "r";
      i += sFinal ? 2 : 1;
      continue;
    }

    if (unit.kind === "consonant") {
      const variant = selectVariant(id, prevId, nextId, word) || selectJoinVariant(id, nextId);
      const before = variant === "circle" ? precedingConsonant(seq, i, track) : null;
      const circleSide = before === "p" || before === "b" ? { x: 0, y: -1 } : { x: 0, y: 1 };
      const nextDir = variant === "circle" ? nextStrokeDir(nextId, track) : null;
      const beforeDir = variant === "circle" ? prevStrokeDir(before, track) : null;
      // Scan p56: s added to a final left-motion circle on a straight stroke
      // turns the circle into a loop, so r + s is one loop, not two circles.
      if (variant === "circle" && nextId === "s" && i + 2 === seq.length) {
        const glyph = glyphOf(id, track, variant);
        const r = circleRadius(glyph);
        const dir = beforeDir || { x: 1, y: 0 };
        const end = add(pen, scale(dir, r * 2));
        const loop = loopArcPath(pen, end, r, circleSide);
        segments.push(makeSegment(id, "circle", false, loop.d, loop.points));
        placements.push({ unitId: id, rule: "join", side: sideLabel(circleSide), anchorUnitId: before, note: "s after a final r circle becomes a loop." });
        pen = end;
        prevId = "s";
        i += 1;
        continue;
      }
      const join = variant === "circle" ? { dir: nextDir || beforeDir || { x: 1, y: 0 }, side: circleSide, final: !nextDir } : null;
      const placed = placeConsonant(id, pen, variant, track, join);
      if (!placed) continue;
      segments.push(placed.segment);
      placements.push(placed.placement);
      pen = placed.end;
      prevId = id;
      continue;
    }

    const placed = placeOrnament(id, pen, prevId, nextId, track, i, seq.length, word);
    segments.push(...placed.segments);
    placements.push(...placed.placements);
    if (placed.end) pen = placed.end;
    prevId = id;
  }

  for (const contraction of contractionResult.contractions) {
    if (contraction.rule === "-ing") segments.push(dotAt("ng", pen, contraction.note));
    if (contraction.rule === "-ly") {
      const r = 0.14;
      const placed = tangentEllipsePath(pen, { x: 0, y: -1 }, r, r);
      segments.push(makeSegment("l", "circle", true, placed.d, placed.points));
    }
  }

  const allPoints = segments.flatMap((segment) => segment.points);
  const box = bounds(allPoints);
  const viewBox = [
    box.minX - PADDING,
    box.minY - PADDING,
    Math.max(box.width + PADDING * 2, 1),
    Math.max(box.height + PADDING * 2, 1),
  ];

  return {
    d: segments.map((segment) => segment.d).filter(Boolean).join(" "),
    viewBox,
    segments,
    placements,
    contractions: contractionResult.contractions,
  };
}

export function outlineForWord(word, track = "core", options = {}) {
  const units = track === "core" ? word.core : word.full;
  return renderOutline(units, track, { word: word.w, ...options });
}

export function outlineForUnit(unitId, track = "core") {
  return renderOutline([unitId], track, { word: "" });
}

export function segmentsForTrace(outline) {
  return outline.segments.filter((segment) => segment.kind !== "dot" && segment.kind !== "mark");
}

export function outlineSvg(outline, { label = "Gregg outline", className = "outline", viewBox } = {}) {
  const [x, y, w, h] = viewBox || outline.viewBox;
  return `<svg class="${className}" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${escapeAttr(label)}" fill="none" stroke="currentColor" stroke-width="0.055" stroke-linecap="round" stroke-linejoin="round"><path d="${outline.d}"/></svg>`;
}

export function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export { dist, normalize };
