// Capture the light surfaces with LIVE content, and record ONLY the two named live clocks as masks:
//   - the "更新于 <relative time>" segment, located with a DOM Range (text node, exact substring)
//   - the .task-elapsed-chip element rect
// Nothing else is masked. Any other live value on the page therefore shows up in the residual,
// which is the point: the residual has to be reported, not engineered away.
// Run from a checked-out tree:  node <this file> <outDir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { harness, setup, account, repository } from './test/fixtures/helpers.mjs';

const out = resolve(process.argv[2] || '.tmp/holes2');
mkdirSync(out, { recursive: true });

const h = await harness();
const { admin, password } = await setup(h);
const a = await account(admin);
await repository(admin, a.id, '101');
h.store.run("UPDATE repositories SET full_name=?, owner_id=? WHERE id=?", 'fixture/project-101', '20', '101');
h.store.run("INSERT INTO tasks(id,repository_id,kind,status,priority,summary,object_number,phase,result,created_at,updated_at) VALUES('t-750','101','development.issue','running','P1','控制台深色主题：跟随系统与手动三态',750,'model',?,'2026-11-18T08:00:00Z','2026-11-18T08:12:00Z')",
  JSON.stringify({ pr_number: 1067, branch: 'feat/theme-750', sha: '4'.repeat(40) }));
h.store.run("INSERT INTO task_runs(id,task_id,kind,attempt,revision,started_at,ended_at,status,context_snapshot,config_snapshot,role) VALUES('run-1','t-750','execution',1,1,'2026-11-18T08:00:00Z','2026-11-18T08:10:00Z','done','{}','{}','dev')");
h.store.run("INSERT INTO task_logs(id,task_id,content,created_at,run_id,role) VALUES('l-750','t-750',?,?, 'run-1','dev')",
  JSON.stringify({ type: 'tool', name: 'read', summary: '读取 static/views.css', ok: true }), '2026-11-18T08:05:00Z');

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'zh-CN' });
const page = await ctx.newPage();

async function signIn() {
  await page.goto(h.admin + '/#/projects');
  await page.getByLabel('用户名', { exact: true }).fill('administrator');
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
}

const PAGES = {
  project: '#/projects/101/overview',
  'project-detail': '#/projects/101/overview/tasks.active',
  task: '#/tasks/t-750',
};
const report = {};
await signIn();
for (const [name, hash] of Object.entries(PAGES)) {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(h.admin + '/' + hash);
    await page.waitForFunction(() => (document.getElementById('console-page')?.innerText || document.querySelector('#workspace')?.innerText || '').trim().length > 0).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.querySelectorAll('details').forEach((n) => { n.open = true; }));
    let last = '';
    for (let i = 0; i < 30; i += 1) {
      const sig = await page.evaluate(() => `${document.body.scrollHeight}|${(document.body.innerText || '').length}`);
      if (sig === last) { if (i > 2) break; } else { last = sig; }
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(300);
    const boxes = await page.evaluate(() => {
      const rects = [];
      const add = (label, r, text) => {
        if (!r || r.width <= 0 || r.height <= 0) return;
        rects.push({
          label,
          x: Math.floor(r.left + scrollX), y: Math.floor(r.top + scrollY),
          w: Math.ceil(r.width), h: Math.ceil(r.height), text: (text || '').trim().slice(0, 40),
        });
      };
      // 1) "更新于 …" — exact substring, located in text nodes with a Range.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const re = /更新于\s*[^\n·|]{1,32}/;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const value = node.nodeValue || '';
        let m;
        const rx = new RegExp(re.source, 'g');
        while ((m = rx.exec(value))) {
          const r = document.createRange();
          r.setStart(node, m.index);
          r.setEnd(node, m.index + m[0].length);
          const box = r.getBoundingClientRect();
          // A wrapped line yields a single bounding box covering both lines; record client rects instead.
          const rectsOfRange = Array.from(r.getClientRects());
          if (rectsOfRange.length > 1) {
            for (const rr of rectsOfRange) add('updated', rr, m[0]);
          } else {
            add('updated', box, m[0]);
          }
        }
      }
      // 2) The elapsed chip element.
      const chip = document.querySelector('.task-elapsed-chip');
      if (chip) add('elapsed', chip.getBoundingClientRect(), chip.textContent);
      return rects;
    });
    // Dilate every mask rect by 2 px, the same margin on both sides.
    const dilated = boxes.map((b) => ({ ...b, x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 }));
    report[`${name}-${width}`] = { boxes, dilated };
    await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
  }
}
writeFileSync(`${out}/boxes.json`, JSON.stringify(report, null, 1));
await browser.close();
await h.stop();
console.log('captured', Object.keys(report).length, 'frames into', out);
