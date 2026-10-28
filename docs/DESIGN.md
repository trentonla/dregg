# Dregg — Design Direction

**Status:** Approved direction, tokens are starting values to tune on device.
**Related:** [`SPEC.md`](SPEC.md) §9–§10, [`PLAN.md`](PLAN.md) M1/M5.

---

## 1. The idea

Take monkeytype’s **discipline**, not its skin: a quiet, mostly monochrome surface, one restrained
accent, generous whitespace, and a practice area that is the whole point of the screen. Then give it
a **bookish** voice with a retro serif and a near-white paper ground.

The result should feel like a clean reading room: ink on paper, not a stationery catalogue. The
outline is the hero; the interface recedes.

Three rules:

1. **Paper, not cream.** The background is almost white with a hint of warmth, not a sepia wash.
2. **One accent, used rarely.** Ink is the default; rust appears on focus, active states, and misses.
3. **Hairlines and whitespace instead of cards and shadows.** Structure comes from spacing and
   rules, not boxes.

---

## 2. Color

Starting values. Tune for contrast on an actual iPhone screen; do not introduce additional hues.

### Light

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#FBFAF7` | App background; near-white, barely warm |
| `--surface` | `#FFFFFF` | Canvas, sheets, raised surfaces |
| `--ink` | `#1C1B18` | Primary text, outlines, primary buttons |
| `--ink-2` | `#3A3833` | Secondary strong text |
| `--muted` | `#6B6861` | Captions, hints, phonemes |
| `--faint` | `#969188` | Disabled, locked labels |
| `--line` | `#E7E4DC` | Hairlines, dividers, borders |
| `--line-strong` | `#D2CEC4` | Inputs, canvas border, active divider |
| `--accent` | `#9E4A38` | Focus, active tab, misses, “new” |
| `--accent-strong` | `#843B2C` | Pressed accent |
| `--accent-soft` | `#F3E7E2` | Selection, subtle highlight |
| `--success` | `#406A4E` | Correct feedback, mastered units |
| `--error` | `#9C3F33` | Errors; distinct from accent in context |
| `--hover` | `rgba(28, 27, 24, 0.04)` | Quiet hover/press wash |

### Dark

| Token | Value |
| --- | --- |
| `--paper` | `#151412` |
| `--surface` | `#1D1B18` |
| `--ink` | `#EDEAE2` |
| `--ink-2` | `#D0CBC0` |
| `--muted` | `#9A9489` |
| `--faint` | `#6F6A61` |
| `--line` | `#2E2B26` |
| `--line-strong` | `#433F38` |
| `--accent` | `#D9856F` |
| `--accent-strong` | `#E39A86` |
| `--accent-soft` | `#33231E` |
| `--success` | `#7FB08B` |
| `--error` | `#D9857A` |
| `--hover` | `rgba(237, 234, 226, 0.05)` |

Never use pure black (`#000`) or pure white text on dark. Do not tint the whole UI with the accent.

---

## 3. Typography

Use system stacks. No runtime font requests; no Google Fonts.

```css
--font-serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua",
              "URW Palladio L", Georgia, "Times New Roman", serif;
--font-ui: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
           "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas,
             "Liberation Mono", monospace;
```

- **Serif** carries words, headings, unit names, and the outline’s companion text. Iowan Old Style is
  the iOS target; Palatino/Georgia are the fallbacks.
- **Sans** carries controls, labels, explanations, and navigation.
- **Mono** carries phonemes, counts, phase numbers, and keyboard hints. Use it small and muted.

Scale (rem, 16px base):

| Token | Size | Use |
| --- | --- | --- |
| `--text-xs` | 0.75rem | Phase labels, keyboard hints |
| `--text-sm` | 0.8125rem | Captions, unit labels |
| `--text-ui` | 0.875rem | Buttons, nav, form labels |
| `--text-body` | 1rem | Body copy |
| `--text-lead` | 1.125rem | Lead paragraph |
| `--text-h3` | 1.375rem | Section headings |
| `--text-h2` | 1.75rem | Screen headings |
| `--text-h1` | 2.25rem | Onboarding/Today |
| `--text-word` | clamp(2rem, 8vw, 3.25rem) | Word in Write mode |
| `--text-outline` | clamp(1.5rem, 5vw, 2rem) | Outline caption, if needed |

- Body line-height 1.55; headings 1.15; word display 1.05.
- Serif display: weight 400–500, `letter-spacing: -0.01em`.
- UI labels: weight 500; avoid 700 except for a single strong state.
- Small labels may use uppercase with `letter-spacing: 0.08em` and `--text-xs`; use sparingly.
- Never justify text. Avoid long line lengths: 60–70 characters for prose.

Optional: if cross-platform consistency later matters more than zero requests, self-host **EB
Garamond** or **Spectral** (SIL OFL) as a subsetted woff2 and precache it. Do not load it at runtime
from a CDN.

---

## 4. Space, shape, motion

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radii: 6px (small controls), 10px (standard), 14px (large stage/sheet). No pills except chips.
- Borders: 1px `--line`; 2px `--accent` for focus. Use `--line-strong` for inputs and the canvas.
- Shadows: none by default. A toast may use `0 2px 8px rgba(0,0,0,.08)`.
- Motion: 120ms ease-out (hover), 180ms (state change), 240ms (sheet/panel), 400–600ms (ink draw).
  Respect `prefers-reduced-motion`; disable the draw animation entirely.
- No gradients, no glass, no paper grain/noise textures. The paper is a flat color.

---

## 5. Layout

- App shell: max-width 1040px, centered; page padding 20px mobile / 32px desktop.
- Practice: content max-width 680px; the outline stage gets at least 240px of vertical breathing
  room; the answer sits below a hairline.
- Today: max-width 680px; one primary action, at most three secondary modules.
- Chart: up to 1040px; grid of unit tiles.
- Mobile: bottom navigation with safe-area padding; primary action sticky above the home indicator.
- Desktop: left sidebar, 220px; content centered in the remaining space.
- Never stack more than two levels of cards. Prefer hairlines.

---

## 6. Components

### Buttons

| Variant | Look |
| --- | --- |
| Primary | `--ink` background, `--paper` text, 8px radius, min-height 44px, padding 10×16 |
| Secondary | Transparent, 1px `--line-strong`, `--ink` text |
| Ghost | No border, `--muted` text; hover `--ink` |
| Destructive | Ghost in `--error`, or secondary with error text; no filled red |

No icons unless they replace a label unambiguously. Pressed state darkens/lightens by one step.

### Inputs

- Read answer: no box; transparent background; centered serif 1.4rem; bottom 1px `--line-strong`;
  focus bottom 2px `--accent`. Placeholder in `--faint`.
- Settings fields: 1px `--line-strong`, `--surface`, 8px radius, 44px height, sans 0.9rem.
- No inner shadows, no floating labels.

### Navigation

- Desktop sidebar: text links, 0.9rem sans; active is `--ink` with a 2px `--accent` left rule.
- Mobile bottom bar: 5 items max, 24px line icons + 11px labels; `--paper` background with a top
  hairline; active `--ink`/`--accent`; inactive `--muted`; safe-area padding.
- No tab bars with filled pill backgrounds.

### Progress and mastery

- Linear progress: 2–3px track in `--line`, fill `--ink` (or `--success` for mastered).
- Mastery ring: 2px stroke, `--ink` on `--line`; small (16–20px) next to unit labels.
- Locked units: 35% opacity plus a phase label, not a padlock-only signal.

### Cards and tiles

- Card: `--surface`, 1px `--line`, 10px radius, 20–24px padding; no shadow.
- Unit tile: 80–96px square, surface, 1px line, 10px radius; glyph ~40px; serif label 0.8125rem;
  3px mastery bar at the bottom.
- Use cards for chart tiles and sheets, not for every section of the page.

### Feedback

- Correct: small check + “Correct.” in `--success`; no green background.
- Incorrect: “Not quite.” in `--accent`; the correct word in serif; one sentence of explanation in
  `--muted` sans.
- Toast: `--ink` background, `--paper` text, 8px radius, bottom-centered, max-width 90%, 4s.
- Avoid exclamation marks and gamified praise.

### Canvas

- Surface `--surface`, 1px `--line-strong`, 12px radius.
- Baseline guide: 1px dashed `--line` at 60% height.
- Ink stroke: 2px, `--ink`, round caps/joins.
- Start dot: 3px `--accent`.
- Ghost target (trace): 1.5px dashed `--accent` at 35% opacity; no fill.
- Undo/clear: ghost buttons below the canvas; clear asks only if strokes exist.

---

## 7. Screen notes

### Onboarding

- One idea per screen. Serif heading, sans body, one primary action, one ghost skip.
- Show a single real outline as the only illustration; no mascots.
- Track choice (Core vs Precision) is a two-option list, not a marketing comparison.
- Install instructions use the actual Safari share-sheet wording.

### Today

- `Today` in serif h2; one sentence of status (“You’re 2 strokes from a new unit.”).
- Primary: **Continue**.
- Secondary: a short “Weak spots” list (three rows with 3px bars) and a streak line.
- No grid of stats, no badges, no confetti.

### Practice

- Top: exit (ghost), mode + count in mono, thin progress line.
- Center: outline on paper, no card. Give it space.
- Below: hairline, answer input (Read) or canvas (Write/Trace).
- Bottom: primary action; “Give up” as a quiet text button.
- Keyboard hints only on devices with a keyboard; hide on touch.
- After an answer, show feedback in place; do not navigate to a new screen.

### Chart

- Group headings in serif: “Circles”, “Hooks”, “Forward strokes”, “Downward strokes”, “Diphthongs”,
  “Blends”.
- Tiles are calm; locked tiles are dimmed, not hidden.
- Tapping opens a detail sheet with glyph, name, sound, description, examples, and “Practice this.”

### Progress

- A simple list/grid of units sorted by weakest; each row: glyph, name, mastery bar, attempts.
- One small 14-day accuracy sparkline; no dashboards.
- Export/import and reset live in Settings, linked from here.

### Settings

- List rows separated by hairlines; label left, control right.
- Sections: Practice, Vowels, Appearance, Data, About.
- Storage status (“Persistent” / “Best effort”), last saved time, export backup.
- Theme: System / Light / Dark; never a color picker.

---

## 8. Icon and app mark

- Flat, ink on paper. No gradients, no text in the icon.
- Suggested mark: a large circle with a small circle attached at the upper right — the vowel/diphthong
  motif — drawn with a 2px-equivalent stroke. Alternatively, a single `g`-like stroke.
- Provide 192×192, 512×512, and a 512×512 maskable icon with 10% padding.
- `theme_color`: `--paper`; `background_color`: `--paper`.

---

## 9. Copy voice

- Short, calm, declarative.
- “Correct.” / “Not quite.” / “The circle sits inside the `r` curve.”
- “New stroke: `p`. Long downward curve, as in *put*.”
- “Ready offline.” / “Update ready. Reload when convenient.”
- “Progress is saved on this device.”
- No exclamation marks, no “Awesome!”, no loss-framing (“Don’t break your streak!”).

---

## 10. What to avoid

- The prototype’s cream `#F6F1E7` and bright `#B5402A` at full strength.
- Card shadows, gradients, glassmorphism, paper textures, noise overlays.
- Multiple accent colors; success green and accent rust are the only chromatic notes.
- Pill buttons everywhere; 8–10px radii are enough.
- Hero illustrations, mascots, confetti, badges.
- Dense dashboards and stat grids.
- Hiding critical controls behind hover.
- Pure black dark mode or pure white light mode.

---

## 11. Accessibility

- Text contrast: `--ink` on `--paper` is comfortably AAA; `--muted` must be ≥4.5:1.
- Accent on paper must be ≥4.5:1 for text; if used as a large glyph stroke, ≥3:1.
- Focus ring: 2px `--accent`, 2px offset, visible on all controls.
- Touch targets ≥44×44px.
- Do not encode state with color alone; pair with text, opacity, or a rule.
- Respect reduced motion and increased contrast.
- Test the theme in direct sunlight and at low brightness on the actual phone.

---

## 12. CSS token starter

```css
:root {
  --paper: #FBFAF7;
  --surface: #FFFFFF;
  --ink: #1C1B18;
  --ink-2: #3A3833;
  --muted: #6B6861;
  --faint: #969188;
  --line: #E7E4DC;
  --line-strong: #D2CEC4;
  --accent: #9E4A38;
  --accent-strong: #843B2C;
  --accent-soft: #F3E7E2;
  --success: #406A4E;
  --error: #9C3F33;
  --hover: rgba(28, 27, 24, 0.04);

  --font-serif: "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua",
                "URW Palladio L", Georgia, "Times New Roman", serif;
  --font-ui: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas,
               "Liberation Mono", monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.8125rem;
  --text-ui: 0.875rem;
  --text-body: 1rem;
  --text-lead: 1.125rem;
  --text-h3: 1.375rem;
  --text-h2: 1.75rem;
  --text-h1: 2.25rem;
  --text-word: clamp(2rem, 8vw, 3.25rem);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;

  --duration-fast: 120ms;
  --duration: 180ms;
  --duration-slow: 240ms;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #151412;
    --surface: #1D1B18;
    --ink: #EDEAE2;
    --ink-2: #D0CBC0;
    --muted: #9A9489;
    --faint: #6F6A61;
    --line: #2E2B26;
    --line-strong: #433F38;
    --accent: #D9856F;
    --accent-strong: #E39A86;
    --accent-soft: #33231E;
    --success: #7FB08B;
    --error: #D9857A;
    --hover: rgba(237, 234, 226, 0.05);
  }
}

:root[data-theme="dark"] {
  --paper: #151412;
  --surface: #1D1B18;
  --ink: #EDEAE2;
  --ink-2: #D0CBC0;
  --muted: #9A9489;
  --faint: #6F6A61;
  --line: #2E2B26;
  --line-strong: #433F38;
  --accent: #D9856F;
  --accent-strong: #E39A86;
  --accent-soft: #33231E;
  --success: #7FB08B;
  --error: #D9857A;
  --hover: rgba(237, 234, 226, 0.05);
}
```

Tune the values on the actual phone. The structure matters more than the exact hex values: near-white
paper, near-black ink, hairlines, one muted accent, serif for the content.
