# #1313 evidence — Feishu service steps: identity and measured duration

Real product page `#/conversations/<id>`, one fixture: the assistant calls the same tool
(`list_projects`) twice in a row, and one extra step row is inserted exactly as a pre-migration
database stores it (no call id, no clock readings). `before/` is the base tree
`96fc40c269a0e4a82e7fcdd80e8cb292f8061278`, `after/` is the final PR tip. Both runs use the same
fixture, route and viewport, full page.

| viewport | before | after |
|---|---|---|
| 390 | steps-390.png | steps-390.png |
| 768 | steps-768.png | steps-768.png |
| 1440 | steps-1440.png | steps-1440.png |

Before: three call lines, none carries a duration. After: two lines each carry their own measured
duration, and the pre-migration row reads 耗时未记录.
