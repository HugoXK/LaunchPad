# #750 dark theme — hole-punched before/after comparison (live clock, not frozen)

Evidence for PR agent-CI-Infra/bot#1067, tip `f58e0bfe26b07fc3f75c1e2dbff85fc1cef355b9`.

## Why this exists

The 20 light-mode before/after pairs in evidence commit `21eb3adaae3adda8f3c18a838f67248bd141a4d7` were shot after freezing two live clocks
(`更新于 …` on the project list and `.task-elapsed-chip` on the task page) into the same string on both sides, so "0 px" there
proves colour, layout and box model did not change — it does not prove page content is static.

This folder is the second, weaker-assumption measurement: clocks are NOT frozen. Both sides are captured live, every
clock-shaped text node is located with `getBoundingClientRect()` at capture time (`*/boxes.json`, with the text that was on
screen), and those rectangles are punched out of the comparison before counting differing pixels.

## Method

- `base/` = tree at `b6b67bbf846ed9c56524c767e38f355600c3cd50` (base of the PR), `head/` = tree at `badcb5f1d2261aec664f3712e63f37671cfc96d1`.
  `static/` is byte-identical between `badcb5f1` and the PR tip `f58e0bfe` (`git diff --stat` empty), so the head frames are valid for the tip.
- Widths 390 / 768 / 1440, full-page screenshots, device scale factor 1.
- For each frame: every element matching the clock selectors is measured live, its rect is dilated to content-box bounds, and the
  union of those rects is excluded; the remaining pixels are compared channel-wise (`compare/clusters.json`).
- `repeat/` = the SAME head tree captured a second time minutes later, compared the same way against `head/`. That gives the
  noise floor: how many pixels one tree differs from itself when only live content moved.

## Result

| frame | base-vs-head diff (clocks punched out) | same-tree repeat noise |
| --- | --- | --- |
| project-390 | 86 px | – |
| project-768 | 84 px | – |
| project-1440 | 83 px | 206 px |
| project-detail-390 | 92 px (86 + 6) | – |
| project-detail-1440 | 86 px | 211 px |
| task-390 | not zero (page height differs 3093 vs 3342) | not zero |
| task-768 | 9287 px (9132 in one block) | – |
| task-1440 | 9343 px (9132 in one block) | 117 px |

So on the five frames that settle, base-vs-head differs by 83–92 px, all inside the `更新于 …` glyph box, which is **less than
the 206/211 px the same tree differs from itself**. The task page is NOT presented as a 0 px result: one 330x327 block differs
inside a collapsed `pre.output` raw-JSON body, and at 390 the page height itself differs between two captures.
