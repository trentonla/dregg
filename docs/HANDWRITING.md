# Dregg — Handwriting Scoring and Recognition

**Question:** can Dregg automatically recognise and score whether a hand-drawn Gregg word is legible?

**Short answer:** *Prompted-word* legibility scoring is doable and useful. *Unconstrained* recognition of
arbitrary handwritten Gregg is a research problem, not a v1 feature. The practical path is to score
the learner's ink against the outline we asked them to write, using the captured stroke sequence and
an explainable geometric rubric — not image OCR and not a black-box model.

This document records the evidence, the proposed approach, the data we can use, and the validation
plan. It is a research/planning document; no scoring code exists yet.

---

## 1. Three different problems

| Problem | Input | Output | Difficulty | Dregg scope |
| --- | --- | --- | --- | --- |
| **Trace conformity** | Ghost outline + user traces | Per-stroke shape/direction score | Low | v1 |
| **Prompted free-write conformity** | Prompted word + user ink | “Does this match the taught outline, and where does it differ?” | Medium | v1.5 research |
| **Unconstrained recognition** | Arbitrary handwritten Gregg | The word/text | Research | Not planned |

“Legible” is ambiguous. A human reader uses context, vocabulary, and Gregg conventions; a score that
only compares shapes is not the same thing. Dregg should say **“matches the taught outline”** or
**“a reader may confuse these strokes”**, not “this is objectively legible.”

Crucially, the app captures **online ink**: ordered strokes with direction, timing, and possibly
pressure. That is much more informative than a bitmap, and it is the main reason prompted scoring is
tractable.

---

## 2. What the research says

The literature is small but clear about the difficulty:

- **Gregg-1916 (Zhai et al., 2018).** A dataset of about 16,000 common English words, with **15,711
  word images** extracted from a printed Gregg dictionary, plus a CNN + RNN + word-retrieval pipeline.
  This is printed shorthand, not handwriting, and it is the best public word-level Gregg reference.
  Repository: `anonimously/Gregg1916-Recognition`.
- **LION (Heil & Nauwerck, 2024/2025).** The first substantial **handwritten stenography** dataset
  (Swedish Melin, 2,900 lines from Astrid Lindgren's notebooks). A modern HTR baseline reaches
  **29.81% CER / 55.14% WER**; with stenography-aware encodings and synthetic pretraining, **24.5–26%
  CER / 44.8–48.2% WER**. This is the clearest evidence that open-vocabulary handwritten shorthand
  recognition is hard, even with a dedicated dataset and modern models.
- **Weimer (2025).** A Gated-CNN approach to handwritten Gregg reports **40.04% accuracy** after
  minimal training. Promising as a research direction, not a product-grade recogniser.
- **GreggBF (Silva, 2025).** **3,753 handwritten brief-form samples**, 139 classes, 27 participants;
  CNN classification (AlexNet, Inception-V3, EfficientNetB0). Isolated brief forms, not continuous
  words; the author notes the data is not formally validated for symbol accuracy. Useful for
  research, not a shipped model.
- **Pitman online recognition.** A mature line of work (Leedham & Downton 1986; Zhu et al. 2002; Ma
  et al. 2008) uses pen trajectories and phonetic primitives. It supports the general idea that
  online shorthand recognition is feasible with stroke-level features, but it does not give us a
  Gregg model.
- **Isolated Gregg classification.** Padilla et al. (2020) classify 135 legal Gregg terms with
  Inception-V3. Closed-set classification is much easier than open-vocabulary recognition.
- **Pen-centric shorthand interfaces.** Tappert & Ward (2007) frames shorthand as an input method for
  pen computers; again, online ink is the useful signal.

**Conclusion:** closed-set/isolated symbol classification is feasible; prompted word conformity is a
reasonable engineering problem; open-vocabulary handwritten Gregg is not something to promise.

---

## 3. Proposed approach: constrained conformity scoring

We know the target word, the expected unit sequence, and the expected outline. We do **not** need to
recognise arbitrary Gregg. We compare the learner's ink to the expected outline and explain the
differences.

### 3.1 Capture

- Pointer Events: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`.
- Record `x`, `y`, `t`, `pressure` (if available), `pointerType`, and a stroke index.
- Resample each stroke to a fixed number of points; simplify for rendering but keep the resampled
  version for scoring.
- Preserve stroke order and pen lifts. Users may write the whole word in one stroke; do not assume a
  one-stroke-per-unit mapping.

### 3.2 Expected outline

The renderer already returns `segments` and `placements` (see `SPEC.md` §11). Each segment has a unit
ID, point sequence, and whether the pen lifts. The scorer consumes that, not an SVG string.

Accept a **set** of valid outlines for a word:

- joined vs disjoined variants (`-ed`, `-er`, `r` circle);
- vowel marks included or omitted;
- brief-form variants (post-v1);
- edition variants (Core vs Precision).

Score against the best-matching variant and report which one matched. The rulebook for which variants
are legitimate is [`COMBINATIONS.md`](COMBINATIONS.md); do not accept an arbitrary path just because it
is close. A variant should be documented there or in an audited word override.

### 3.3 Normalisation

- Translate to the outline's origin.
- Scale uniformly to a fixed bounding box; never stretch x and y independently.
- Optionally deskew using the learner's calibrated slant; do not rotate freely — Gregg orientation
  matters.
- Normalise stroke time only for speed/fluency feedback, not for shape.

### 3.4 Alignment

- Flatten all strokes into one ordered point sequence, dropping pen lifts.
- Use **Dynamic Time Warping (DTW)** or Fréchet distance to align the learner's sequence to the
  expected sequence. This tolerates different speeds, small pauses, and merged strokes.
- If the user lifts the pen, optionally run a stroke-level alignment first to detect missing/extra
  strokes; then run point-level DTW within matched strokes.
- Keep a mapping from expected segments to learner points for per-unit feedback.

### 3.5 Feature rubric

Score each feature separately; do not hide everything in one number.

| Feature | What it catches | Suggested weight |
| --- | --- | --- |
| Stroke/segment coverage | Missing or extra strokes | Hard gate |
| Order | Strokes written in the wrong sequence | Hard gate |
| Tangent direction | Wrong direction (`t` vs `d`, `p` vs `b`) | High |
| Relative length | Short/long confusion (`n`/`m`, `t`/`d`, `k`/`g`) | High |
| Curvature | Straight vs curve (`n` vs `k`, `s` vs line) | High |
| Join continuity | Gaps, unintended pen lifts, sharp corners | Medium |
| Vowel side | Circle inside/outside the curve or angle | High |
| Vowel shape/mark | Large vs small circle, O vs U hook, dot/tick | High |
| Proportions | Circle size vs stroke length, hook size | Medium |
| Slant/rotation | Global slant drift | Low–medium |
| Completeness | Started/ended in the right place | Medium |

**Hard gates** are conditions that make the outline unreadable regardless of the overall score:
missing a consonant, wrong vowel family, long/short inversion on a distinguishing pair, vowel on the
wrong side of a curve. When a hard gate fails, return a specific issue rather than a low percentage.

### 3.6 Scoring and feedback

```
overall = weighted mean(feature scores) * confidence
```

- `confidence` reflects capture quality (enough points, not a single tap, canvas size).
- Return `{ overall, passed, features, issues[], hints[], matchedVariant }`.
- Feedback examples:
  - “Your `m` is about the same length as `n`; a long stroke should be roughly twice as long.”
  - “The `a` circle sits outside the `r` curve; it belongs inside.”
  - “The `t` should start at the baseline and rise; yours starts high and falls.”
  - “You lifted the pen between `t` and `e`; this outline is written continuously.”
  - “This looks close. The only issue is the `oo` hook opening in the wrong direction.”
- Never show only a percentage. Show what matched, what did not, and one next action.
- If the score is near the threshold, say so and offer self-grading. Do not block progression on a
  uncertain automatic judgment.

### 3.7 Personal calibration

The user is the sole user, which is an advantage. After 10–20 traced words, learn:

- the user's short/long length ratio;
- typical slant;
- circle and hook sizes relative to stroke length;
- writing speed and pause patterns;
- tolerance for hand tremor.

Store calibration locally. Use z-scores relative to the user's own baseline, not a universal
threshold. Recalibrate if the device or hand position changes drastically.

### 3.8 Ambiguity and multiple valid outlines

Gregg allows variants. The scorer must not punish a valid alternative:

- `r` as a stroke vs the post-vocalic left-motion circle;
- `s` as a loop after a left-motion circle;
- `th` left vs right motion;
- `-ed` joined vs disjoined;
- optional vowel marks;
- brief forms once they exist.

This is also why a single reference path is insufficient. Store a small set of expected variants per
word and report the best match.

### 3.9 What not to do

- **Do not start with OCR on a canvas bitmap.** It throws away stroke order and direction, the two
  signals Gregg depends on most.
- **Do not train a black-box classifier first.** There is no large handwritten Gregg word corpus, the
  model would be unexplainable, and a confident wrong score is worse than no score.
- **Do not claim general recognition.** “This matches the taught outline” is honest; “Dregg can read
  your shorthand” is not.
- **Do not make auto-score mandatory.** Self-grade must remain available, especially for stylus/paper
  users and when confidence is low.

---

## 4. Data strategy

| Source | What it is | Use | Caveat |
| --- | --- | --- | --- |
| **Gregg-1916** | ~15,711 printed word images from a 1916 Gregg dictionary | Reference outlines, stroke geometry, combination verification, synthetic pretraining | Printed, not handwritten; check repository license/attribution |
| **GreggBF** | 3,753 handwritten brief-form images, 139 classes | Research on isolated brief-form classification; variant shapes | Undergraduate dataset, not formally validated; external Dropbox hosting; cite the author; do not assume a permissive license |
| **LION** | 2,900 handwritten Melin shorthand lines (Swedish) | Methods, difficulty calibration, HTR baselines | Not Gregg; different script; do not train a Gregg model on it |
| **Pitman online-recognition literature** | Pen-trajectory studies | Feature design (direction, curvature, primitives) | Not Gregg |
| **text2Gregg** (`steno.tu-clausthal.de`) | Server-side text→Gregg generator; SVG/GIF export; site samples point to Centennial | Visual cross-check of whole-word outlines | Typeset, not handwritten; no explicit license; do not scrape or ship output; edition mismatch |
| **Personal corpus** | The user's own prompted words, with consent | Calibration, threshold tuning, rubric validation | Small; local-only; no cloud upload |

**Recommendation:** use Gregg-1916 as the visual/reference corpus and the user's own samples as the
calibration corpus. Do not ship GreggBF or LION data. If a learned model is ever added, train on
synthetic outlines rendered by our engine plus the user's consented samples, and evaluate on held-out
personal samples. text2Gregg is a secondary visual check only; it is not handwriting data and cannot
stand in for a handwriting corpus.

Synthetic variation for testing the scorer:

- scale, slant, rotation within tolerance;
- point noise and tremor;
- stroke order swaps where Gregg allows them;
- merged strokes and extra pen lifts;
- long/short ratio drift;
- circle/hook size drift;
- truncated or overshot strokes.

---

## 5. Validation plan

### R0 — Feasibility spike (1–2 days)

- Capture 20 prompted words (mix of CV, CVC, vowel, and blend).
- Implement the feature extraction and a rough weighted score.
- Compare pass/fail with the user's own judgment.
- Output: go/no-go and a list of features that are noisy or unhelpful.

**Go criteria:** the scorer can distinguish a deliberately wrong outline (e.g., `m` for `n`, vowel on
the wrong side) from a reasonable one in at least 18/20 cases; the user finds the feedback useful.

### R1 — Calibration and rubric (3–5 days)

- 100 prompted words across the core curriculum.
- Calibrate scale/slant/length ratios.
- Label pass/fail and error type; measure agreement.
- Target: **≥85% pass/fail agreement**, **<10% false negatives** (don't fail a good outline), and
  per-issue precision high enough that feedback is rarely misleading.

### R2 — Integration (3–5 days)

- Integrate into Write mode as an advisory check; keep self-grade.
- Add overlay highlighting for the worst feature.
- 300-word evaluation; latency budget <100 ms on an iPhone.
- If targets are not met, ship trace-only auto-score + self-grade, and keep the rubric as a “check”
  rather than a gate.

### Metrics

- Pass/fail agreement with human judgment.
- Score correlation with a 1–5 human legibility rating.
- False negatives (good outlines marked bad) — the most damaging error.
- Per-issue precision/recall for length, direction, curvature, vowel side, missing stroke.
- Latency and capture quality.

---

## 6. If a learned model is needed later

Options, in order of complexity:

1. **Feature classifier** (logistic regression / SVM / small MLP) on the rubric features. Small,
   explainable, runs in JS. Good next step if hand-tuned weights are unstable.
2. **Sequence model** (CNN/CRNN/CTC) on rendered or captured ink. Needs substantially more data;
   ONNX Runtime Web or TensorFlow.js; larger download and slower inference.
3. **Full recognition** (line/word HTR). Research; not planned.

Even a learned model should output per-feature issues, not just a score. The user needs to know what
to fix.

---

## 7. Privacy

- Ink samples stay on the device by default.
- Any sample export is explicit and user-initiated, with a clear filename and no network upload.
- If a training corpus is ever assembled, it is opt-in, local, and described in plain language.
- No cloud sync, no accounts.

---

## 8. Decision

- **v1:** guided trace auto-scoring plus self-graded free writing. No claim of general recognition.
- **v1.5:** prompted free-write conformity scoring, advisory, with personal calibration and
  explainable feedback.
- **Research/out of scope:** unconstrained recognition of arbitrary handwritten Gregg.

---

## 9. Sources

- Zhai, F., Fan, Y., Verma, T., Sinha, R., Klakow, D. (2018). *A Dataset and a Novel Neural Approach
  for Optical Gregg Shorthand Recognition.* TSD 2018, LNCS 11107, 222–230.
  doi:10.1007/978-3-030-00794-2_24. Dataset: `anonimously/Gregg1916-Recognition`.
- Heil, R., Nauwerck, M. (2024/2025). *Handwritten stenography recognition and the LION dataset.*
  IJDAR 28, 3–18. doi:10.1007/s10032-024-00479-6. Open access.
- Weimer, A. (2025). *Error-corrected deep learning approach to handwritten text recognition of Gregg
  shorthand.* JYSE 13(11). doi:10.31224/4661.
- Silva, L. (2025). *Handwritten Gregg Shorthand Brief Forms Recognition Using Convolutional Neural
  Networks.* GreggBF dataset; `lyshasilva/GreggBF`.
- Padilla, D.A., Vitug, N.K.U., Marquez, J.B.S. (2020). *Deep learning approach in Gregg shorthand
  word to English-word conversion.* ICIVC 2020, 204–210.
- Leedham, C.G., Downton, A.C. (1986). *On-line recognition of Pitman's handwritten shorthand.*
  International Journal of Man-Machine Studies 24(4), 375–393.
- Zhu, M., Chi, Z., Wang, X. (2002). *Segmentation and recognition of on-line Pitman shorthand
  outlines using neural networks.* ICONIP 2002.
- Ma, Y., Leedham, G., Higgins, C., Htwe, S.M. (2008). *Segmentation and recognition of phonetic
  features in handwritten Pitman shorthand.* Pattern Recognition 41, 1280–1294.
- Tappert, C.C., Ward, J.R. (2007). *Pen-Centric Shorthand Handwriting Recognition Interfaces.*
  PLT 2007.
