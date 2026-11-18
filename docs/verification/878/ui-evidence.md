# #878 UI evidence — the Actions check status after a failed refresh

Four states, each before (`f91409ba5b48e682095f82b431cd3e8ac804da0f`, live `main`) and after
(the branch tip that adds the stale marker): the failed `GET /api/repositories/:id` (500) and the recovered
read, at 1440×900 and 390×844. Every shot is `page.screenshot({ fullPage: true })` of
`#/projects/101/triggers` with the Actions event source switched on, taken only after the card's own text was
read back and asserted:

- failed state, after: contains `读取失败，显示上次结果` and `上次成功读取：YYYY-MM-DD HH:mm:ss`
- failed state, before, and both recovered states: contains `配置检查通过后`, contains no `读取失败`

Raw URLs are pinned to `16156b25537b4982385385bbb91b2f50734660fe` on `evidence/878`.

| File | Bytes | Width × height | SHA-256 |
| --- | --- | --- | --- |
| [`before-stale-1440.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/before-stale-1440.png) | 270736 | 1440 × 1604 | `6aeb9f893fb2b7068a29b1174eb3d38a4a8722168f7b8083f3e0e61ddfe51829` |
| [`after-stale-1440.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/after-stale-1440.png) | 276313 | 1440 × 1604 | `b1c3fe47423f57ea7cf94c28fc558fce81e0cd92495b53ad3737e622d7e3123b` |
| [`before-stale-390.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/before-stale-390.png) | 216531 | 390 × 2247 | `d31eff8908268f0e03008354942c30fdfc39886e73ce6050ff1ef43dc6e2933a` |
| [`after-stale-390.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/after-stale-390.png) | 225344 | 390 × 2290 | `3273087d1c511bf253f886d2a66e27588b0111f0661901a8cd5f7bf3f2239dde` |
| [`before-recovered-1440.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/before-recovered-1440.png) | 270736 | 1440 × 1604 | `6aeb9f893fb2b7068a29b1174eb3d38a4a8722168f7b8083f3e0e61ddfe51829` |
| [`after-recovered-1440.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/after-recovered-1440.png) | 270736 | 1440 × 1604 | `6aeb9f893fb2b7068a29b1174eb3d38a4a8722168f7b8083f3e0e61ddfe51829` |
| [`before-recovered-390.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/before-recovered-390.png) | 216531 | 390 × 2247 | `d31eff8908268f0e03008354942c30fdfc39886e73ce6050ff1ef43dc6e2933a` |
| [`after-recovered-390.png`](https://raw.githubusercontent.com/HugoXK/LaunchPad/16156b25537b4982385385bbb91b2f50734660fe/docs/verification/878/after-recovered-390.png) | 216531 | 390 × 2247 | `d31eff8908268f0e03008354942c30fdfc39886e73ce6050ff1ef43dc6e2933a` |

## What the pairs show

- The recovered state renders identically before and after (same bytes, same SHA-256): the fix only adds a marker
  while a refresh is failing, and takes it away again on the next success.
- `before-stale` equals `after-recovered` for the same reason: before the fix a 500 left the old status standing as
  if it were current, which is exactly what `#878` reports.
- The 1440 pair differs only in one band: a pixel diff of `before-stale-1440` against `after-stale-1440` has its
  bounding box at x 783–1263, y 1386–1399 — the 13px line the marker adds at the end of the existing sentence.
  The page does not grow (1604 → 1604).
- At 390 the marker wraps, so the page grows by 43px (2247 → 2290) and everything below the card shifts down.

## How they were taken

A throwaway spec (not committed) drove the page the same way the two `#878` e2e cases do: log in as the project
administrator, switch the Actions event source on, wait for `配置检查通过后`, then answer `GET /api/repositories/101`
with 500. The before tree is a worktree of `f91409ba`, the after tree is the PR tip; both were built with
`npm run build` before the shots.
