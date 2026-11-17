# #914 — the management launcher's accessible name

`static/management/window.js:32` used to set `aria-label="打开管理助手"` on `#management-launcher`, while the button shows
`管理助手` plus one of three states (`随时唤起`, `正在处理…`, `有新回复`). An `aria-label` replaces the visible text, so the
accessible name never contained what the reader sees — axe reports `label-content-name-mismatch`, and voice control cannot
say the words on screen.

The fix deletes that `aria-label` and keeps `aria-controls` / `aria-expanded`. Nothing else changes: no CSS, no text, no
open/close or focus behaviour.

## Accessible name, measured in the same harness

| state | before (`daac402e`) | after (`da3e876`) |
| --- | --- | --- |
| default | `打开管理助手` | `管理助手 随时唤起` |
| running | `打开管理助手` | `管理助手 正在处理…` |
| unread | `打开管理助手` | `管理助手 有新回复` |

`aria-label` attribute read in the browser: before `打开管理助手` at both widths, after `null` at both widths.

## Screenshots — no visual change

Full pages at 1440×900 and 390×844, before (`daac402e`) and after (`da3e876`), byte-identical:

| width | before | after | bytes |
| --- | --- | --- | --- |
| 1440 | [page-1440](before/page-1440.png) | [page-1440](after/page-1440.png) | 149174 / 149174, sha256 `4ef73c2f6dde…` both |
| 390 | [page-390](before/page-390.png) | [page-390](after/page-390.png) | 125324 / 125324, sha256 `de853a2e8c92…` both |

Page heights are identical as well (1440×973, 390×1720), which is expected: only an attribute that is never rendered
changed.
