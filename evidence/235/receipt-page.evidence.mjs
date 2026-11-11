// Screenshot evidence for #235 command-receipt pages. Not a test: Playwright only collects *.spec.mjs.
//
//   node e2e/receipt-page.evidence.mjs docs/verification/235/receipt-page/after
//
// Every width gets its own context, created at that size: resizing one page from 1440 down to 390 captures an intermediate
// layout that no phone ever renders.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { managementFixture, command } from '../test/management-fixture.mjs';

const out = resolve(process.argv[2] || '.tmp/receipt-page-evidence');
mkdirSync(out, { recursive: true });
const f = await managementFixture();
const widths = [1920, 1440, 1024, 768, 390];
try {
  const saved = (await command(f.admin, 'workflow.update', { project_id: '101', workflow_id: 'review.issue' }, { prompt: 'Inspect evidence and cite the original logs.' })).value;
  // A delivered task cannot be paused again, so the server records a real refusal on the second receipt.
  f.h.store.run("UPDATE tasks SET status='completed' WHERE id='blocked'");
  const refused = (await command(f.admin, 'task.pause', { project_id: '101', task_id: 'blocked' }, {})).value;
  const pages = [['receipt-succeeded', saved.id], ['receipt-failed', refused.id]];
  const browser = await chromium.launch();
  try {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: width < 700 ? 900 : 1100 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(f.h.admin + '/#/management');
      await page.getByLabel('用户名', { exact: true }).fill('administrator');
      await page.getByLabel('密码', { exact: true }).fill(f.password);
      await page.getByRole('button', { name: '登录', exact: true }).click();
      // The signed-in console is what both versions have in common; the tab strip itself is laid out differently per width.
      await page.waitForFunction(() => { const workspace = document.getElementById('workspace'); return workspace && !workspace.hidden && !document.getElementById('boot')?.offsetParent; }, null, { timeout: 10000 }).catch(() => {});
      for (const [name, id] of pages) {
        await page.goto(f.h.admin + '/#/management/commands/' + id);
        // The branch renders the record; the base falls back to the assistant, whose panel is what gets captured there.
        await page.locator('#management-receipt-page, #management-chat').first().waitFor({ timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
      }
      await context.close();
    }
  } finally { await browser.close(); }
} finally { await f.close(); }
