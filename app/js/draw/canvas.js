// Pointer-captured ink canvas with DPR scaling. Coordinates are CSS pixels;
// the scorer normalizes them, so canvas size does not matter.
export function mountCanvas(container, { onChange, label = "Drawing area", initialStrokes = [] } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "ink-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const strokes = initialStrokes.map((stroke) => stroke.map((point) => ({ ...point })));
  let current = null;
  let drawing = false;
  let cssWidth = 1;
  let cssHeight = 1;

  const ink = () => {
    const color = getComputedStyle(canvas).color;
    return color && color !== "rgba(0, 0, 0, 0)" ? color : "#1C1B18";
  };

  function drawStroke(stroke) {
    if (!stroke.length) return;
    ctx.beginPath();
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = ink();
    if (stroke.length === 1) {
      ctx.arc(stroke[0].x, stroke[0].y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = ink();
      ctx.fill();
      return;
    }
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i].x, stroke[i].y);
    ctx.stroke();
  }

  function redraw() {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    for (const stroke of strokes) drawStroke(stroke);
    if (current) drawStroke(current);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width);
    cssHeight = Math.max(1, rect.height);
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    canvas.height = Math.max(1, Math.round(cssHeight * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function pointOf(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function addPoint(event) {
    if (!current) return;
    for (const sample of event.getCoalescedEvents?.() || [event]) {
      const point = pointOf(sample);
      const last = current[current.length - 1];
      if (!last || Math.hypot(point.x - last.x, point.y - last.y) > 0.4) current.push(point);
    }
  }

  const onDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    drawing = true;
    current = [pointOf(event)];
    redraw();
  };
  const onMove = (event) => {
    if (!drawing) return;
    event.preventDefault();
    addPoint(event);
    redraw();
  };
  const onUp = (event) => {
    if (!drawing) return;
    event.preventDefault();
    addPoint(event);
    if (current && current.length > 1) strokes.push(current);
    current = null;
    drawing = false;
    redraw();
    onChange?.(strokes);
  };
  const onCancel = () => {
    drawing = false;
    current = null;
    redraw();
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.addEventListener("pointerleave", onUp);

  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  observer?.observe(canvas);
  requestAnimationFrame(resize);

  return {
    canvas,
    get strokes() {
      return strokes;
    },
    clear() {
      strokes.length = 0;
      current = null;
      redraw();
      onChange?.(strokes);
    },
    undo() {
      strokes.pop();
      redraw();
      onChange?.(strokes);
    },
    redraw,
    resize,
    destroy() {
      observer?.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerleave", onUp);
      canvas.remove();
    },
  };
}
