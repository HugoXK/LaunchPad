# #691 — mutation proof for the e2e oracle and for the UT gate

Scope: `#1071` (`lp/dev-1/691-time-format`) against `agent-CI-Infra/bot`.
Code author: LaunchPad Dev-1. Executor of every mutation below: **LaunchPad Test** (independent verifier). Test writes nothing to GitHub, so each line was reported to LaunchPad Lead and is transcribed here unchanged; Lead only adds the framing sentences.

This file is evidence. It changes no source file, no test, no workflow.

## 0. Which tip the mutations ran on

- Mutations ran on `0e0bc660e9f9c8f99bb74349a14a605d6c3b1fd1` (parent `3fb5be24`), in a throwaway tree built with `npm run build` (exit 0).
- The PR tip is now `d040f04121bb51a99e93c052f15e85ab2b9fc736`. `0e0bc660..d040f041` is exactly one file: `test/ut/static/time-format.test.mjs`, modified `+15 −0` (one fixed-instant unit test). It touches neither `static/app/boot.js`, nor `test/e2e/schedules/schedules.spec.mjs`, nor `stamped()`, so both mutations below still address the code this PR ships. Test's own PASS line stays on the sha it actually ran.

## 1. The oracle this PR replaces

Base `886442b594802fc00ae89511b1a3800cc35ad8fc` had, at `test/e2e/schedules/schedules.spec.mjs:319`:

```
new Date(ts).toLocaleString(undefined, { timeZone: zone }) + ' · ' + zone
```

That line was independent of the application. An earlier revision of this PR changed it into the page's own `timestampAt(...)`, which made `expect(ui).toEqual(expected)` page A checked against page A. The shipped revision builds `clockAt(ts, zone)` inside the test (`Intl.DateTimeFormat('en-CA', { timeZone, hourCycle: 'h23' })` plus `formatToParts`, at `:321-326`) and compares at `:327`. The mutation below exists to show that this new oracle can fail.

## 2. Mutation A — `static/app/boot.js:24`, `timeZone:zone` → `timeZone:'UTC'`

One token changed, occurrences 1 → 1. Command:

```
npx playwright test -c test/e2e/playwright.config.mjs schedules/schedules.spec.mjs -g "schedule preview matches the server"
```

Result: **1 failed**, original output:

```
-   "2026-11-19 09:00:00 · Europe/Berlin"
+   "2026-11-19 08:00:00 · Europe/Berlin"
   ... 5 lines, one per day 11-19 .. 11-23, each off by one hour
> 327 |     expect(ui).toEqual(expected);
```

Berlin is one hour ahead of UTC, so reading the stored zone as UTC makes every preview line one hour short. The independent oracle catches it at `:327`.

## 3. Mutation B — `stamped()` suffix hard-written to `' · UTC'`

The suffix in `stamped(value, zone)` was replaced by `reading + ' · UTC'` instead of `reading + ' · ' + zone`.

Result: **1 failed**, same assertion `:327`, diff `+ Array []` — the filtered preview rows no longer contain `Europe/Berlin`, so `ui` filters down to nothing and cannot equal the expected literals.

## 4. Restore check

`git checkout` on `static/app/boot.js`; the file's md5 is back to `bddea5002961f937789c2bdafb9f73c2`, identical to the pristine `.verify/v0e` tree, and the same case returns to green: **1 passed (6.0s)**. Red → green → red → green is closed, so the mutations hit a load-bearing line rather than an assertion.

## 5. The same UT file on base `886442b5` still fails

The `test/ut/static/time-format.test.mjs` as it stood at `0e0bc660` (4 tests) was copied onto a base `886442b5` tree and run there. `d040f041` then adds a fifth test (the fixed-instant one, +15 −0), so the file at the PR tip has 5 tests; the base run below belongs to the 4-test version and was not repeated for the fifth.

```
# tests 4
# pass 1
# fail 3
not ok 1 - no console page formats a displayed time with the browser locale or a 12-hour clock
  error: 'knowledge.js: toLocaleString()'
not ok 3 - every displayed time calls the shared clock helper, and knowledge uses it instead of a local one
  error: 'knowledge.js: "function metadata(file)" must call /timeText\(file\.created_at, '时间未提供'\)/ (row 151)'
not ok 4 - an unreadable time gets its own text instead of a bare zone suffix
  error: 'timestampAt is not defined'
```

So the gate is not loosened: it is red on the code it is meant to gate, and green only on the tip. (An earlier revision of the same file, before the rule was tightened, reported `# pass 1 / # fail 2` on base — that number belongs to that revision, not to this one.)

## 6. What this proves, and what it does not

- It proves the e2e oracle is no longer self-referential: an implementation that reads the wrong zone, or that drops the zone suffix, turns the shipped case red at `:327`.
- The exact-value layer for the shared clock itself is the fixed-instant unit test added in `d040f041` (`1795050000000` → Shanghai `2026-11-19 09:00:00`, UTC `2026-11-19 01:00:00`, New York `2026-11-18 20:00:00`; `1763481600000` → Shanghai `2025-11-19 00:00:00`, which fails if `hourCycle:'h23'` degrades to `h24`).
- It does not claim that `time-format.spec.mjs` alone would catch a pure offset error: its three assertions are shape matches, which is why the literals above were added instead of relying on them.

Written-by: LaunchPad Lead
