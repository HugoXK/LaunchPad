# #750 dark theme — live-content before/after comparison with the two named clocks masked

Evidence for PR agent-CI-Infra/bot#1067.

Trees: `base/` = `b6b67bbf846ed9c56524c767e38f355600c3cd50` (PR base), `head/` = `f58e0bfe26b07fc3f75c1e2dbff85fc1cef355b9` (PR tip),
`head2/` = the same head tree captured a second time, minutes later, as the noise floor.
`static/` is byte-identical between `badcb5f1` (where the 92 style screenshots were shot) and the tip, so those remain valid.

## What is masked, and nothing else

Only the two clocks named in the PR discussion:

1. `更新于 …` — the substring is located with a DOM `Range` over the text node (not a hard-coded box);
   when the line wraps, every client rect of that range is recorded separately (that is why 768 has two boxes).
2. `.task-elapsed-chip` — the element's own `getBoundingClientRect()`.

Every rect is dilated by 2 px on all four sides, on both sides of a pair, and the union is cut out before counting
differing pixels. Nothing else is masked, so any other live value shows up in the residual instead of being hidden.
Masks actually used are in `base/boxes.json` and `head/boxes.json` (`dilated`).

Capture: `capture-holes2.mjs` (run inside each tree; Playwright, `locale=zh-CN`, viewport 390x844 / 768x900 / 1440x900,
full-page screenshot after `networkidle` plus a 3-sample stability check and every `details` opened).

## Result — base vs head, outside the mask

| frame | inside mask | outside mask | outside bbox |
| --- | --- | --- | --- |
| project-390 | 96 | **0** | – |
| project-768 | 101 | **0** | – |
| project-1440 | 99 | **0** | – |
| project-detail-390 | 99 | **0** | – |
| project-detail-768 | 99 | **0** | – |
| project-detail-1440 | 99 | **0** | – |
| task-390 | 49 | 116 | (27,1380)-(83,2841) |
| task-768 | 49 | 9250 | (233,1097)-(573,2917) |
| task-1440 | 49 | 9250 | (277,876)-(905,2463) |

Noise floor, same head tree captured twice (`head/` vs `head2/`), same mask rule:

| frame | outside mask |
| --- | --- |
| project-390 / -768 / -1440 | 0 / 0 / 0 |
| project-detail-390 / -768 / -1440 | 6 / 0 / 0 |
| task-390 / -768 / -1440 | 60 / 60 / 60 |

## The task page is NOT a pixel-equality result, and here is exactly why

The residual on `#/tasks/t-750` is not clock text. `compare/task-text.diff` is the whole textual difference between the
two renders (`compare/task-text-base.txt` vs `compare/task-text-head.txt`, produced by `probe-task-text.mjs`):
the page prints a raw-JSON panel that contains two live values generated per request —

- `"runtime_ms": 2659` vs `2683`
- `"created_at": "2026-11-20T08:15:48.361Z"` vs `"2026-11-20T08:15:54.683Z"`

Everything else in the 7049-character page text is identical. So those 116 / 9250 / 9250 px are two live numbers inside
a JSON dump, not a colour or layout change, and they cannot be masked without touching more than the named clocks.
The task page therefore rests on computed-value assertions in `test/e2e/console/theme.spec.mjs` only, not on pixels.

## How to re-run

```
# inside a checkout of each tree
node capture-holes2.mjs <outDir>          # writes <outDir>/*.png and <outDir>/boxes.json
node probe-task-text.mjs <outDir>         # writes <outDir>/task-1440.txt
# then compare pixel-wise, subtracting the union of base+head dilated rects (see compare/results.json)
```

`compare/results.json` holds every number above, with the rects used for each frame.
