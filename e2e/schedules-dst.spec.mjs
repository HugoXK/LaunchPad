import { test, expect } from '@playwright/test';
import { channelFixture, privateChat, registerDestination } from '../test/channel-fixture.mjs';

async function environment() {
  let now = Date.now(), worker;
  const f = await channelFixture(undefined, { schedules: { automatic: false, clock: () => now }, onSchedules: s => { worker = s; } });
  now = Date.now(); f.worker = worker; f.advance = ms => { now += ms; };
  f.destination = await registerDestination(f.admin, await privateChat(f));
  await f.service.tick(); return f;
}
async function login(page, f) {
  await page.goto(f.h.admin + '/#/management');
  await page.getByLabel('用户名', { exact: true }).fill('administrator');
  await page.getByLabel('密码', { exact: true }).fill(f.password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.getByLabel('当前管理作用域').selectOption('project:101');
  await page.getByRole('button', { name: '快捷操作', exact: true }).click();
  await expect(page.getByRole('button', { name: '预览日报计划', exact: true })).toBeVisible();
}
const futureLines = async page => {
  const text = await page.getByLabel('计划预览').textContent();
  const part = (text.split('未来触发：')[1] || '').split('以下为当前时间的样例日报')[0];
  return part.split('\n').map(line => line.trim()).filter(line => /\d{1,2}:\d{2}/.test(line) && line.includes(' · '));
};
// Each preview line is rendered by static/schedules.js:138 as <local wall clock> + ' · ' + <zone>.
// Read the wall-clock hour from the text instead of pinning a locale-specific layout.
const localHour = line => {
  const wall = line.split(' · ')[0];
  const m = wall.match(/(\d{1,2}):(\d{2})/);
  if (!m) throw new Error('no wall clock in preview line: ' + line);
  let hour = Number(m[1]);
  if (/\bPM\b/i.test(wall) && hour !== 12) hour += 12;
  if (/\bAM\b/i.test(wall) && hour === 12) hour = 0;
  return hour;
};

// #234 验收要求「时区/夏令时…与服务器一致」和「390px 长时区…可完整阅读」。每日 09:00 的计划跨过美国秋季
// 夏令时切换后，本地触发时间必须还是 09:00（UTC 偏移从 13:00Z 变成 14:00Z）；把偏移当固定值的实现会在切换后
// 显示 08:00，用户会以为计划被改早了。
test('a daily 09:00 plan keeps 09:00 local across the DST switch, and a long zone stays readable at 390', async ({ page }) => {
  test.setTimeout(120000);
  const f = await environment(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await login(page, f);
    await page.getByLabel('计划名称', { exact: true }).fill('跨夏令时日报');
    await page.getByLabel('计划时区', { exact: true }).fill('America/New_York');
    // Keep the validity window open before both probe instants, so each preview really is computed at the clock we set.
    await page.getByLabel('有效期开始', { exact: true }).fill('2026-10-01T00:00:00Z');
    await page.getByText('高级时间规则（Cron / 固定周期）', { exact: true }).click();
    await page.getByLabel('Cron 表达式', { exact: true }).fill('0 9 * * *');
    // Before the US fall-back (2026-11-01): 09:00 America/New_York is 13:00Z.
    f.advance(Date.parse('2026-10-30T12:00:00Z') - Date.now());
    await page.getByRole('button', { name: '预览日报计划', exact: true }).click();
    const preview = page.getByLabel('计划预览');
    await expect(preview).toContainText('时区：America/New_York');
    await expect.poll(async () => (await futureLines(page)).length).toBeGreaterThan(1);
    const before = await futureLines(page);
    for (const line of before) expect(localHour(line)).toBe(9);

    // After the fall-back: the same 09:00 local must survive on the other side of the switch.
    f.advance(Date.parse('2026-11-03T12:00:00Z') - Date.parse('2026-10-30T12:00:00Z'));
    await page.getByRole('button', { name: '预览日报计划', exact: true }).click();
    await expect.poll(async () => (await futureLines(page)).length).toBeGreaterThan(1);
    const after = await futureLines(page);
    for (const line of after) expect(localHour(line)).toBe(9);
    // The two previews are different future instants, so this is not comparing one cached render with itself.
    expect(after[0]).not.toBe(before[0]);

    // 390 with a long IANA zone: the preview stays readable, nothing scrolls sideways.
    await page.getByLabel('计划时区', { exact: true }).fill('America/Argentina/Buenos_Aires');
    await page.getByRole('button', { name: '预览日报计划', exact: true }).click();
    await expect(preview).toContainText('时区：America/Argentina/Buenos_Aires');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(preview).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    for (const line of await futureLines(page)) expect(localHour(line)).toBe(9);
    expect(errors).toEqual([]);
  } finally { await f.close(); }
});
