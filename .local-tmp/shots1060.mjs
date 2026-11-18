// Evidence capture for #1060, run by hand on the base tree and on the branch tip.
// Usage: node .local-tmp/shots1060.mjs <base|tip>
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { harness, setup, account, repository } from '../test/fixtures/helpers.mjs';

const tag = process.argv[2] ?? 'tip';
const widths = (process.argv.slice(3).length ? process.argv.slice(3) : ['390', '1440']).map(Number);
const out = '/home/xuke/work/launchpad-dev-1/.local/ev1060';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const records = [];
for (const width of widths) {
  const h = await harness();
  try {
    const { admin, password } = await setup(h), owner = await account(admin);
    for (const id of ['101', '202', '303']) await repository(admin, owner.id, id);
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, locale: 'zh-CN' });
    const page = await context.newPage();
    await page.goto(h.admin + '/#/board');
    await page.getByLabel('用户名', { exact: true }).fill('administrator');
    await page.getByLabel('密码', { exact: true }).fill(password);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await page.locator('#access').waitFor({ state: 'hidden' });
    const selector = width === 390 ? '#console-mobile-project' : '#console-project';
    for (const [route, slug] of [['#/board', 'board'], ['#/settings/storage', 'settings-storage']]) {
      await page.goto(h.admin + '/' + route);
      const trigger = page.locator(selector + ':visible');
      await trigger.waitFor({ state: 'visible' });
      await page.waitForTimeout(250);
      const reading = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        const normalize = value => (value || '').replace(/\s+/g, ' ').trim();
        const label = (el.getAttribute('aria-label') || '').trim();
        const visible = normalize(el.innerText);
        return {
          selector, label, visible,
          violations: label && !normalize(label).toLowerCase().includes(visible.toLowerCase()) ? 1 : 0,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      }, selector);
      const snapshot = await trigger.ariaSnapshot();
      const file = `${out}/1060-${slug}-${width}-${tag}.png`;
      await page.screenshot({ path: file, fullPage: true });
      records.push({ width, route, slug, ...reading, snapshot: snapshot.replace(/\n/g, ' | '), file, sha256: createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16) });
    }
    await context.close();
  } finally { await h.stop(); }
}
await browser.close();
console.log(JSON.stringify(records, null, 2));
