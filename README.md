# #750 final evidence — retaken surfaces at tip `66f0993`

This commit proves two things about the second-review fix, and nothing else:

1. the three dark gaps that were still open (`.step-fold-body`, `.step-fold-stat`, `.confirm-status.progress`) are
   closed, and the two surfaces they appear on were **re-shot** at 390/768/1440 in both themes;
2. on those two surfaces the light theme did not move, measured against the same fixture on `b6b67bbf`.

Provenance: this orphan commit was created through the GitHub REST git-data API after two direct `git push` attempts
failed with `GnuTLS recv error (-110)` / a 130 s connection timeout to port 443. Every blob below came from the same
tree that carries the fix (tree `ca8b9e9b6f962d3144e5492b273e553467b68a7e`).

## Frames (`frames/`, 24 PNG)

`*-before` = the same fixture on `b6b67bbf` (base, no dark theme: every `-dark-before` frame is a light render by
construction). `*-after` = tip `66f0993bc9ff8a19cf9902d2a72a290f71e0d830`. Same routes, same fixture, same viewports,
full page.

- `750-task-*` — `#/tasks/t-750`, every fold opened, one `read_file` log with `result.bytes` (so `.step-fold-stat` and
  the muted line inside `.step-fold-body` exist) and no `result.content` (so the muted line, not a `pre.output`,
  carries the 2.10:1 reading the reviewer measured).
- `750-confirm-*` — the confirm dialog in its **progress** state: the action never settles, so
  `.confirm-status.progress` stays on screen. Nothing else is on that surface.

## Masked regions — declared, not inferred

Per the standing rule for any cross-capture pixel comparison, this is the complete list of regions cut out of the
comparison, all three of them request-generated readouts on the task page:

| region | how it is located | why it is a live value |
|---|---|---|
| `.task-elapsed-chip` | element `getBoundingClientRect()` | `已运行 49h 57m` — grows with the clock |
| `.role-run-duration` | element `getBoundingClientRect()` | `10m` — computed from the run's timestamps |
| `.console-scope-trigger` | element `getBoundingClientRect()` | its label carries the project's live task count |

Every rectangle is dilated by 2 px, the same margin on both sides. **No other region is masked**, and the confirm
dialog has no live value at all (`masks-*.json` records an empty list for its six frames). Anything else that moved
would appear in the `outside` column below.

## Measured (full-page pixels, `diff.json`)

| frame | before | after | differing px | inside masks | outside masks | mask rects | luma before → after |
|---|---|---|---|---|---|---|---|
| `confirm-1440-dark` | 1440×900 | 1440×900 | 1296000 | 0 | 1296000 | 0 | 150.98 → 16.68 |
| `confirm-1440-light` | 1440×900 | 1440×900 | 0 | 0 | 0 | 0 | 150.98 → 150.98 |
| `confirm-390-dark` | 390×1279 | 390×1279 | 498446 | 0 | 498446 | 0 | 249.22 → 30.35 |
| `confirm-390-light` | 390×1279 | 390×1279 | 0 | 0 | 0 | 0 | 249.22 → 249.22 |
| `confirm-768-dark` | 768×900 | 768×900 | 691200 | 0 | 691200 | 0 | 157.88 → 17.01 |
| `confirm-768-light` | 768×900 | 768×900 | 0 | 0 | 0 | 0 | 157.88 → 157.88 |
| `task-1440-dark` | 1440×2619 | 1440×2619 | 3753250 | 14395 | 3738855 | 8 | 248.68 → 32.37 |
| `task-1440-light` | 1440×2619 | 1440×2619 | 116 | 56 | 60 | 8 | 248.68 → 248.68 |
| `task-390-dark` | 390×3801 | 390×3801 | 1478553 | 24720 | 1453833 | 8 | 245.63 → 36.53 |
| `task-390-light` | 390×3801 | 390×3801 | 116 | 56 | 60 | 8 | 245.62 → 245.63 |
| `task-768-dark` | 768×3074 | 768×3074 | 2345802 | 12507 | 2333295 | 8 | 246.49 → 33.58 |
| `task-768-light` | 768×3074 | 768×3074 | 116 | 56 | 60 | 8 | 246.49 → 246.49 |

Reading the table:

- **confirm, light: 0 px at all three layouts**, no mask at all — the dialog is byte-identical between base and tip.
- **task, light: 116 px differ, 56 inside the declared masks and 60 outside** at each of the three layouts. Those 60 px
  are one 8×8 glyph in link colour; the largest per-channel difference is 8/255. It is not a colour, border or layout
  change, and it is why the task page contributes no "0 px" claim: only its computed values are pinned.
- **dark: whole-page change**, luma 245–249 → 32–37 on the task page and 151–249 → 17–30 on the dialog. That is the
  point of the fix; the dark frames are evidence of the new rendering, not of equality.

## Why the other pages were not re-shot

The three new rules match selectors that exist on exactly one surface each. Node counts on the console pages at 1440
(same fixture, tip tree, `selectors-tip.json`; the base tree gives the same counts in `selectors-base.json`):

| page | `.step-fold-body` | `.step-fold-stat` | `.confirm-status` | `.confirm-status.progress` |
|---|---|---|---|---|
| `projects` | 0 | 0 | 0 | 0 |
| `overview` | 0 | 0 | 0 | 0 |
| `tasks` | 0 | 0 | 0 | 0 |
| `settings` | 0 | 0 | 0 | 0 |
| `audit` | 0 | 0 | 0 | 0 |
| `task` | 2 | 1 | 0 | 0 |

The dialog's `.confirm-status` exists only while a `confirmDialog()` is open, so it is not counted on any page above.
So login / projects / project detail / settings / audit cannot change pixels from these three rules, and the 80 frames
of the earlier evidence set (`21eb3adaae3adda8f3c18a838f67248bd141a4d7`, pages that did not change) still stand.

## Files

- `frames/` — 24 PNG (`750-{task,confirm}-{390,768,1440}-{light,dark}-{before,after}.png`)
- `masks-after.json`, `masks-before.json` — dilated mask rects per frame, with the text that produced them
- `selectors-tip.json`, `selectors-base.json` — selector counts per page
- `diff.json`, `diff-table.md` — the numbers above, machine-readable and rendered

The separate live-clock residuals for projects / project detail / tasks are not duplicated here: they live at
`0da121d4e9c6b850fbede4cb0aad27097e81d3f6` (`lp-assets/750-holes2`), with their masks declared in that README.
