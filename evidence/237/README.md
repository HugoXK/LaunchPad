# #356 片 A：账号详情页点名它的关联安装

真控制台页面 `#/settings/accounts/<id>`（不是原型图），同一份 fixture 拍的 before/after。

- base：`e146d8d`（live main，`#350` 页面壳与 `#358` 都已合入）
- tip：本分支（只改 `static/settings.js` 的 `accountDetailBody`）
- fixture：`test/identity-fixture.mjs` —— GitHub App 账号 `Test account`（App ID 123）、安装 `77`（目标 `fixture`、全部仓库、有效），同步里记录了 1 个仓库（`fixture/project-101`）；另有一个登记项目。截图前用 `UPDATE installed_repositories SET installation_id='77' ...` 补上真实同步会写入的安装号（控制台侧的 fixture 本来不写这一列）。

| 宽度 | before（base `e146d8d`） | after（tip） |
| --- | --- | --- |
| 1440 CSS px | `docs/verification/237/t2b/before/account-1440.png` | `docs/verification/237/t2b/after/account-1440.png` |
| 768 CSS px | `docs/verification/237/t2b/before/account-768.png` | `docs/verification/237/t2b/after/account-768.png` |
| 390 CSS px | `docs/verification/237/t2b/before/account-390.png` | `docs/verification/237/t2b/after/account-390.png` |

## 对比

- **before**：「使用项目（2）」直接接到「Webhook 入口」——账号页完全不提这个凭据能到哪个 GitHub 安装。要看目标组织、是否还装着、仓库数、缺哪些权限/事件、这些缺口挡住哪些功能，得回「安装档案」逐条翻，还得自己猜哪一条属于这个账号。
- **after**：多出「关联安装（1）」表，六列：`安装`（安装号即链接，进 `#/settings/installations/github.com/123/77`）、`目标`、`状态`（仍在安装里 / GitHub 已移除，保留为历史）、`仓库`、`缺什么`、`会挡住什么`。
  - 授权读不到时「缺什么」写「授权未读取，缺什么无法判断」，「会挡住什么」写「不知道」——**不当成「没有缺口」**；表下再用 `endpoint-warning` 点名哪些安装还没读到授权。
  - 有读数但已过期时，表下说明「安装 N 的授权是 <时间> 读到的，之后可能在 GitHub 上改过」，并指向重新同步。
- **390 px**：表格在自己的容器里横向滚动（`.rule-table-wrap`），页面 `scrollWidth == innerWidth`，无横向滚动；整页高度 1119 → 1352 就是这段新增内容。
- 两个空态也画出来，不留白：Token 账号「关联安装（0）」并说明用户 Token 不经过安装；App 账号没有安装时说明同步后会出现、零仓库安装也会保留。

## 复现

```bash
git checkout e146d8d -- static/settings.js
node e2e/account-installations.evidence.mjs docs/verification/237/t2b/before
git checkout HEAD -- static/settings.js
node e2e/account-installations.evidence.mjs docs/verification/237/t2b/after
```

每个宽度用独立 context（创建时就是目标尺寸），不在一个页面里 resize——一个页面 resize 后再拍会把没排完的中间状态拍进去。

## 断言（`e2e/account-installations.spec.mjs`）

1. 详情页显示「使用项目（2）」「关联安装（1）」，安装行有 `fixture`、`仍在安装里`、`1 个`、`授权未读取，缺什么无法判断`、`不知道`，安装号链接指向 `#/settings/installations/github.com/123/77`；整页 `/api/accounts/<id>` 只读一次、**没有任何 `/api/installations/archive` 请求**；390 px 下 `scrollWidth <= innerWidth`。
2. 安装被 GitHub 移除后仍留在页面上：`GitHub 已移除，保留为历史`、`0 个`。
3. Token 账号显示「关联安装（0）」并说明用户 Token 没有 GitHub 安装；「使用项目（0）」。
