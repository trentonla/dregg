// Ghost target and trace scoring bridge.
import { outlineSvg } from "../outline.js";
import { traceScore } from "../grader.js";

export function traceGhost(outline, label = "Trace this outline") {
  return outlineSvg(outline, { className: "trace-ghost", label });
}

export function scoreTrace(outline, strokes) {
  return traceScore(strokes, outline.segments);
}
