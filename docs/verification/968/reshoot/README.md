# #968 — re-shot evidence for tip `456f0c4`

The first evidence commit (`0356041`) was captured before the rebase: its "after" pictures came from `d4833629`, which did
not carry the `browser_evidence` row that `1e9e371d` added to the data-disk table. These pictures replace them for the
rebase tip.

- **Before**: clean `1e9e371dd0ddde7e317184a10319bbde34ece63a` (live main at capture time), built in its own worktree.
- **After**: PR branch tip **`456f0c4`** (tree `43dd95f0`), which is `0b72c247` plus the wording-only commit; the UI is the
  same as `0b72c247`, and the caption under the table now spells out which labelled volumes stay in "other".
- Both runs: `identityFixture()` with `/api/storage` mocked with the same numbers as `e2e/storage-docker-rows.spec.mjs`
  (`images 644245094`, `containers 73400320`, `build_cache 231928258`, `volumes 12582912`, `assistant_homes 8388608`),
  logged in as the administrator, full-page capture with `animations: 'disabled'`.

## Written comparison

| width | before (px) | after (px) | what changed |
| --- | --- | --- | --- |
| 1440 | 1440×3661 | 1440×3793 | the data-disk table gains "Docker 卷（未被计入的部分）" (12 MiB) and "助手电脑 HOME（assistant-homes 卷）" (8 MiB); "其他" drops by their sum |
| 768 | 768×4492 | 768×4686 | same two rows, same numbers |
| 390 | 390×4795 | 390×5013 | narrow layout: the two rows print their `data-label` like every other row |
| 320 | 320×5483 | 320×5765 | no sideways scroll: `documentElement.scrollWidth === innerWidth` at 320 in the after run |

In the before pictures the Docker volumes are not in the table at all (they sat in "other"), so the two runs differ by
exactly the two added rows; every existing row keeps its place and value.
