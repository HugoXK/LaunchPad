# #875 evidence (PR #889)

`fullPage` screenshots of the real costs page, same fixture as `e2e/costs-usage.spec.mjs`
(clock fixed at 2026-11-11T02:00:00Z, Asia/Shanghai), `details.cost-chart-table` expanded.

| viewport | before (base `0529ce5f` tree) | after (`124ef030f3a6d71983b22065a51bd1221075956d`) |
| --- | --- | --- |
| 390 | chart-390-before.png (390×3456) | chart-390-after.png (390×3665) |
| 768 | chart-768-before.png (768×3194) | chart-768-after.png (768×3379) |
| 1440 | chart-1440-before.png (1440×2347) | chart-1440-after.png (1440×2531) |

The before captures are the same base render the maintainer already accepted (#889); the after captures
are this PR's head with the date × project table and the 日期（本地） column.
