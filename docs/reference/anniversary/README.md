# Anniversary Edition scan references

These are page images from *Gregg Shorthand (Anniversary Edition)*, John Robert Gregg, 1929.
They are the visual model for Dregg's outline generator. The Wikisource transcription used in
[`COMBINATIONS.md`](../../COMBINATIONS.md) has the rules but strips the shorthand illustrations; these
pages supply the missing geometry.

**Source:** `https://commons.wikimedia.org/wiki/File:Gregg_Shorthand,_Anniversary_Edition.djvu`

**License:** the Commons file is marked **PD-US-expired** and **PD-old-70**. The 1929 edition is public
domain in the United States. Cite the book and the Commons file when reproducing a page.

**Scan vs printed page:** the filenames use the scan page number (`p17`), not the printed page number.
Printed page numbers are in the page header. Chapter 1 starts at scan p17 / printed p1.

## Page index

| File | Scan page | Printed page | What it shows |
| --- | --- | --- | --- |
| `p17-consonants.jpg` | 17 | 1 | K G R L N M T D TH; H dot; I and he circles; the basic proportions |
| `p18-phrasing-punctuation.jpg` | 18 | 2 | Phrasing, punctuation, a connected sentence drill |
| `p19-vowels-ae.jpg` | 19 | 3 | A and E vowel groups; *mat, calm, came, kit, get, need* |
| `p21-circles-single-strokes.jpg` | 21 | 5 | Circle at the start/end of a single stroke; *eke, ear, aim, tea, ham, heat* |
| `p23-circles-between-strokes.jpg` | 23 | 7 | Circle outside an angle, inside a curve; *make, rain, team, writ, raid* |
| `p24-circles-direction-kr-gl.jpg` | 24 | 8 | Same-direction straights, opposite curves, `kr`/`gl` |
| `p25-gr-kl-rk-lk-th.jpg` | 25 | 9 | `gr`/`kl`, `rk`/`lk`, the two `th` forms |
| `p27-connected-text.jpg` | 27 | 11 | Connected reading practice; real spacing and slant |
| `p28-blends-ted-men.jpg` | 28 | 12 | `ted`/`ded`/`det`, `men`/`mem` blends |
| `p29-word-drill-vowels-r.jpg` | 29 | 13 | Word drill: vowel placement, `r` circle, *her, here, air* |
| `p34-downward-signs.jpg` | 34 | 18 | P B F V CH J S SH; the very small `sh` and the two `s` signs |
| `p35-pr-pl-br-bl.jpg` | 35 | 19 | `pr`/`pl`, `br`/`bl` loop variants |
| `p36-fr-fl-word-drill.jpg` | 36 | 20 | `fr`/`fl` loop variants and frequent-word drill |
| `p50-o-hook.jpg` | 50 | 33 | O-hook sign table: ŏ, aw, ō |
| `p51-o-hook-drill.jpg` | 51 | 35 | O-hook in words: *auto, hope, show, dog, open* |
| `p55-r-circle.jpg` | 55 | 39 | Post-vocalic `r` circle and word drill |
| `p56-s-after-r-er.jpg` | 56 | 40 | `s` after a left-motion circle; disjoined `-er`/`-or` |
| `p64-oo-hook.jpg` | 64 | 47 | ōō-hook sign table: ŭ, ŏŏ, ōō |
| `p65-oo-hook-drill.jpg` | 65 | 49 | ōō-hook in words: *plus, pull, food, cut, us* |
| `p69-w-wh.jpg` | 69 | 53 | Initial/final `w`, `wh`, medial `w` dash, `sw` hook |
| `p89-nt-nd-mt-md.jpg` | 89 | 73 | `-nt`/`-nd` and `-mt`/`-md` upward-curve blends |
| `p90-ld.jpg` | 90 | 74 | `-ld` upward terminal and blend word drill |

## Additional pages to fetch if a rule needs more evidence

- `p39`, `p40` — the two `s` signs and the initial/final `s` distribution.
- `p41` — `s` between strokes, `ses`, `x`, `-tion`, past tense.
- `p52` — the modified `o`-hook in context.
- `p71` — `y`, `ng`, `nk` (the y/ng/nk sign table is earlier; check 68–71).
- `p77`–`p88` — diphthongs, vowel combinations, omission rules, joined prefixes/suffixes.
- `p91`–`p99` — `jent`/`pent`, `def`/`tive`, `be`/`de`/`re`/`dis`/`mis`.
- `p100`–`p112` — `ten`/`den`, `tem`/`dem`, `r` details, `-ther`, prefixes/suffixes.
- `p113`–`p178` — advanced word-beginnings/endings, phrasing, states/cities, vocabulary.

Fetch pattern:

```
https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/
Gregg_Shorthand%2C_Anniversary_Edition.djvu/pageNN-1920px-
Gregg_Shorthand%2C_Anniversary_Edition.djvu.jpg
```

Replace `NN` with the scan page. The full scan is also available as a DjVu/PDF from Commons.

These pages are reference material. Do not ship them in the app bundle; they are not part of the offline
PWA.
