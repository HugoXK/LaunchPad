# #527 — 设置页 `.facts` 值列在 390 / 320 下的截图证据

Part of #527。这 4 张图只证明一件事：`static/views.css` 里 `.facts` 的两列在窄屏下把值列从 70 px 抬到 >= 140 px。

## 两颗树

- **before**：`5dd763d1923d58704fb194aba898cb2f8fd6ff74`（live main，未加任何东西）。
- **after**：同一颗 `5dd763d1` 上加下面这一处、且**只有**这一处（`+4 −0`，`static/views.css` 单文件）：

```
/* #527: at 390px a 216px label ("最近一次 manager 重复正文清理") left the value column 70px and every value wrapped
   one character per line. Below 560px the label wraps instead and the value column keeps at least 140px; wider
   widths keep today's single-line labels. */
@media(max-width:560px){.facts{grid-template-columns:minmax(0,max-content) minmax(140px,1fr)}.facts dt{white-space:normal;overflow-wrap:anywhere}}
```

这两颗树是自描述的：把上面 4 行插进 `5dd763d1` 的 `static/views.css`（`.facts dd` 那条规则之后），就得到拍 after 的那颗树。

## 拍摄口径

- 页面：设置页（`#/settings/work-computers`），展开「查看采集、回收与项目明细」后再拍，按卡片 `getBoundingClientRect()` 裁切——不拍整页。
- 视口：390 与 320 两档，`deviceScaleFactor` 与两次拍摄相同。
- 同一台机器、同一份 fixture、连拍；没有换字体、没有改 locale。
- 只裁卡片，不含页头；尺寸差异本身即证据（见下）。

## 文件（在 `frames/` 子目录）

| 文件 | 尺寸 | md5 |
|---|---|---|
| `frames/visible-before-390.png` | 352×902 | `dd2e644486af4f879d18922395f8f27d` |
| `frames/visible-after-390.png` | 352×934 | `e1fa8a7d2e775ab021e432f2a0e578cd` |
| `frames/visible-before-320.png` | 282×998 | `54e5d55485517651e27fc030a1749657` |
| `frames/visible-after-320.png` | 282×966 | `3c071df7f744259a260857f064f8f25a` |

390 档 after 比 before 高 32 px、320 档矮 32 px：前者是标签换行后多出的两行，后者是值不再一个字一行之后的收缩。两者都不是布局回归。

## 链接写法

PNG 在 **`frames/`** 子目录，**正文里的链接必须带 `/frames/`**：

`https://raw.githubusercontent.com/HugoXK/LaunchPad/<this-commit>/frames/visible-after-390.png`

不带 `/frames/` 会 404（#1067 上已经犯过一次）。
