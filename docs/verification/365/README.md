# #365 控制台页不再按 tab 名请求列表接口

真 Chromium、真实控制台页面（登录后的 `#/more`），同一份分支代码。

- `more-390.png`：390×844，移动导航（⌂总览 / ▤任务 / ◷待处理 / ⋯更多）在页内可见，主区是「更多功能」。
- `more-1440.png`：1440×900，桌面侧栏可见，同一页。

复现方式见 `e2e/console-more-race.spec.mjs` 第二条：把 `GET /api/integrations` 压住 400 毫秒，从 `#/projects` 切到 `#/more`，六轮。修前该读在后头按当时的 `tab` 拼地址，发出 `GET /api/more`（无此端点，404），登录路径上被 `showBootFailure()` 接住后 `#workspace` 隐藏，`syncConsoleShell()` 于是把 `#console-mobile-nav` 留在 hidden；修后六轮都没有该请求，导航一直可见。
