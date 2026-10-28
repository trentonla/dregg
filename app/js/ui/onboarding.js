// Three short onboarding steps. No account, no permissions.
import { escapeHtml, unitGlyph } from "./components.js";

export function renderOnboarding(root, store) {
  let step = 0;
  const goals = [5, 10, 15];

  function render() {
    const pages = [
      {
        eyebrow: "Dregg",
        title: "Write by sound, not spelling.",
        body: "Gregg shorthand is a phonemic script. You learn a small set of strokes, then read and write real words with only the strokes you know.",
        art: `<div class="onboarding-art">${unitGlyph("t", "core")}${unitGlyph("e1", "core")}${unitGlyph("m", "core")}</div>`,
      },
      {
        eyebrow: "The vowel system",
        title: "Four shapes now. Marks later.",
        body: "Core uses four vowel shapes: A, E, O, and U. Precision adds a dot or tick to each shape for the full twelve-sign Anniversary matrix. You can switch when Core is complete.",
        art: `<div class="vowel-row">${["a1", "e1", "o1", "u1"]
          .map((id) => `<div class="vowel-demo">${unitGlyph(id, "core")}<span>${id[0].toUpperCase()}</span></div>`)
          .join("")}</div>`,
      },
      {
        eyebrow: "Your practice",
        title: "Five minutes is enough.",
        body: "Sessions are short and adaptive. Progress stays on this device. If you install the app from Safari, it keeps working offline.",
        art: `<div class="install-note"><p class="eyebrow">Install on iPhone</p><p>Share <span aria-hidden="true">→</span> Add to Home Screen <span aria-hidden="true">→</span> Open as Web App.</p></div>`,
      },
    ];
    const page = pages[step];
    root.innerHTML = `<section class="onboarding">
      <div class="onboarding-copy">
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p class="lead">${escapeHtml(page.body)}</p>
        ${page.art}
      </div>
      <div class="onboarding-actions">
        ${
          step === 2
            ? `<fieldset class="goal-field"><legend>Daily goal</legend><div class="segmented">${goals
                .map(
                  (goal) =>
                    `<label><input type="radio" name="goal" value="${goal}" ${goal === 10 ? "checked" : ""}><span>${goal} min</span></label>`,
                )
                .join("")}</div></fieldset>`
            : ""
        }
        <button class="btn btn--primary" data-next>${step === 2 ? "Start learning" : "Continue"}</button>
        <button class="btn btn--ghost" data-skip>Skip</button>
        <p class="step-count">${step + 1} / 3</p>
      </div>
    </section>`;

    root.querySelector("[data-next]").addEventListener("click", () => {
      if (step < 2) {
        step += 1;
        render();
        return;
      }
      const goal = Number(root.querySelector('input[name="goal"]:checked')?.value || 10);
      store.markOnboardingDone(goal);
    });
    root.querySelector("[data-skip]").addEventListener("click", () => store.markOnboardingDone(10));
  }

  render();
}
