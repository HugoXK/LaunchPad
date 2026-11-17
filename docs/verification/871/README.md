# #871 — settings data tables: caption and `th scope="col"`

Evidence for PR `Fixes #871`, captured from the real product pages with the Playwright harness
(`e2e/zz-w871-shots.spec.mjs`, run locally and not committed to the PR branch). Every image is a full-page capture at a
CSS width of 390 or 1440.

| Page | 390 | 1440 |
| --- | --- | --- |
| Installation detail (`#/settings/installations/github.com/123/77`) | `installation-390.png` | `installation-1440.png` |
| Account detail (`#/settings/accounts/<id>`) | `account-390.png` | `account-1440.png` |

## Written comparison

The change adds an accessible name and header scope to three existing tables and changes nothing that is drawn:

- **Captions.** Each of the three tables now carries a `<caption>` hidden with the console's existing `.sr-only`
  (`static/views.css:537`). Measured in the browser at both widths, the caption box is `1×1 px`, `position: absolute` —
  it is read by a screen reader and painted nowhere.
- **Header scope.** Every `<th>` in the three tables now has `scope="col"`. The header text is unchanged.
- **Narrow layout.** At 390 the header row is still `display: none`, and every body cell still prints its column name from
  `data-label` through `td::before`. The spec asserts each `data-label` equals the header text of the same column, so the
  two layouts cannot drift apart.
- **Geometry.** Element geometry is byte-identical before and after at both widths: the two installation tables sit at
  `y=792.4` / `y=877.4` (1440) and `y=876.6` / `y=981.6` (390) with unchanged widths, and the page height is `1157` and
  `1344` px in both runs. The account page likewise keeps its layout.
- **Pixel diff.** A naive pixel diff between the before and after captures shows a few thousand differing pixels inside the
  tables; the same diff between **two captures of the same tree** differs by the same amount (for example 4530 vs 4568
  pixels above the 32/255 threshold at 1440 on the account page). The difference is the fixture's live timestamps
  ("最近成功同步"/"读取时间"), not this change: no element moved and the caption is a 1×1 box.

## How it was captured

- Before: clean `1e9e371dd0ddde7e317184a10319bbde34ece63a` (live main at capture time) built in its own worktree.
- After: the PR branch tip, same fixture, same harness, same steps.
- Both runs: `identityFixture()` with one recorded delivery and one bound installation, logged in as the administrator,
  viewport 390×844 and 1440×900, `fullPage: true`, `waitForTimeout(250)` after the panel rendered.
