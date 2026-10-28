// "Show me" ink animation. Reduced motion makes it instant.
export function animateOutline(svg, { duration = 700 } = {}) {
  if (!svg) return;
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const paths = svg.querySelectorAll("path");
  if (reduced || !paths.length) return;
  for (const path of paths) {
    if (typeof path.getTotalLength !== "function") continue;
    const length = path.getTotalLength();
    if (!length) continue;
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
    path.style.strokeDashoffset = "0";
    setTimeout(() => {
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
      path.style.transition = "";
    }, duration + 60);
  }
}
