# #750 evidence frame brightness (machine check, PR agent-CI-Infra/bot#1067)

Source frames: evidence commit `21eb3adaae3adda8f3c18a838f67248bd141a4d7` (92 PNG, orphan).
Method: see `mean-luma.py` -- Rec.601 luma `0.299R+0.587G+0.114B` on the stored sRGB values,
no linearisation, then the mean over the whole frame. `brightness.json` holds every value.

Counts and ranges as produced by that script:

| group | n | min luma | max luma |
| --- | --- | --- | --- |
| `-dark-after.png` | 20 | 18.67 | 67.75 |
| `-dark-before.png` (base has no dark mode, so these are the light render) | 20 | 148.91 | 250.71 |
| `-light-after.png` | 20 | 148.91 | 250.71 |
| `-light-after.png` excluding the three `confirm` frames | 17 | 239.54 | 250.71 |

The three light `confirm` frames read 148.91 (1440), 152.71 (768), 248.59 (390) -- the dialog
overlay really does darken the page, which is why they are called out separately instead of
being folded into the 239.54-250.71 range of the other light frames.

Frame luma is a LOWER-BOUND check ("did this frame actually render dark"), not a contrast
proof: the per-element contrast values in the PR body come from computed styles in
`test/e2e/console/theme.spec.mjs`, not from these means.
