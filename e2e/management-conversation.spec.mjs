import { test,expect } from '@playwright/test';
import { rmSync } from 'node:fs';
import { managementFixture,query } from '../test/management-fixture.mjs';

const login=async(page,base,password)=>{
  await page.goto(base+'/#/management');
  await page.getByLabel('用户名',{exact:true}).fill('administrator');
  await page.getByLabel('密码',{exact:true}).fill(password);
  await page.getByRole('button',{name:'登录',exact:true}).click();
};

// #235 acceptance 6: a model sentence is not a receipt. The page may only call the work finished when the persisted
// command says so; a receipt that is still executing keeps the turn unconfirmed.
test('a receipt that is still executing keeps the turn unconfirmed even after the model says the work is done',async({page})=>{
  test.setTimeout(60000);
  const f=await managementFixture(),errors=[];let release;
  const gate=new Promise(resolve=>{release=resolve;});
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.setViewportSize({width:1440,height:1000});
    await login(page,f.h.admin,f.password);
    await page.getByLabel('当前管理作用域').selectOption('project:101');
    // The persisted receipt lags the reply: the re-read still says executing while the text already claims completion.
    await page.route('**/api/management/commands/*',async route=>{
      if(route.request().method()!=='GET')return route.continue();
      const response=await route.fetch(),body=await response.json();
      await gate;
      await route.fulfill({response,json:{...body,state:'executing',updated_at:new Date().toISOString()}});
    });
    const feed=page.getByRole('log',{name:'管理会话记录'});
    await page.getByLabel('管理消息',{exact:true}).fill('暂停这个任务');
    await page.getByRole('button',{name:'发送',exact:true}).click();
    await expect(feed).toContainText('任务已暂停，状态可以回读。');
    release();
    const receipt=feed.locator('.management-receipt').filter({hasText:'操作 暂停任务'});
    await expect(receipt).toContainText('执行中');
    await expect(receipt.getByRole('button',{name:'对账并回读',exact:true})).toBeVisible();
    const state=page.locator('.management-turn-state').last();
    await expect(state).not.toHaveText('已完成');
    await expect(state).toHaveText('结果待确认');
    expect(errors).toEqual([]);
  }finally{release?.();await page.unrouteAll({behavior:'wait'});await f.close();rmSync(f.h.directory,{recursive:true,force:true});}
});

// #235 acceptance 6: collapsing the window is not cancelling the submitted work, and reopening it must reuse the same
// conversation instead of starting another one.
test('collapsing the window keeps a submitted write running in the same conversation',async({page})=>{
  test.setTimeout(60000);
  const f=await managementFixture(),errors=[];let release;
  const conversations=()=>f.h.store.get("SELECT count(*) n FROM management_conversations WHERE scope='project:101'").n;
  const commands=()=>f.h.store.get('SELECT count(*) n FROM management_commands').n;
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(f.h.admin+'/#/projects');
    await page.getByLabel('用户名',{exact:true}).fill('administrator');
    await page.getByLabel('密码',{exact:true}).fill(f.password);
    await page.getByRole('button',{name:'登录',exact:true}).click();
    const before=commands();
    await page.getByRole('button',{name:'打开管理助手',exact:true}).click();
    await page.getByLabel('当前管理作用域').selectOption('project:101');
    f.modelState.gate=new Promise(resolve=>{release=resolve;});
    await page.getByLabel('管理消息',{exact:true}).fill('暂停这个任务');
    await page.getByRole('button',{name:'发送',exact:true}).click();
    await expect(page.getByRole('button',{name:'停止',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'收起管理助手',exact:true}).click();
    const launcher=page.getByRole('button',{name:'打开管理助手',exact:true});
    await expect(launcher).toContainText('正在处理');
    release();f.modelState.gate=null;
    await expect(launcher).toContainText('有新回复');
    await launcher.click();
    const feed=page.getByRole('log',{name:'管理会话记录'});
    await expect(feed).toContainText('操作 暂停任务 · 已执行');
    // The write ran to its receipt while the window was collapsed, inside the one conversation that already existed.
    expect(commands()).toBe(before+1);expect(conversations()).toBe(1);
    expect((await query(f.admin,'get_task',{project_id:'101',task_id:'blocked'})).value.task.status).toBe('paused');
    // Every card the screen reader meets is named: the step, its receipt, and the assistant's answer.
    await expect(feed.getByRole('group',{name:/执行步骤：暂停任务/})).toBeVisible();
    await expect(feed.getByRole('group',{name:/操作 暂停任务 · 已执行/})).toBeVisible();
    await expect(feed.getByRole('article',{name:'管理助手回答'}).first()).toBeVisible();
    expect(errors).toEqual([]);
  }finally{release?.();f.modelState.gate=null;await f.close();rmSync(f.h.directory,{recursive:true,force:true});}
});

// #235 acceptance 5: the composer is reachable from the keyboard, stays visible when a mobile keyboard shortens the
// viewport, and a long reply can be read to its last line.
test('the composer works from the keyboard, survives a short viewport, and long replies stay readable',async({page})=>{
  test.setTimeout(60000);
  const f=await managementFixture(),errors=[];const lines=Array.from({length:80},(_,index)=>'第 '+(index+1)+' 行：这是一段用于确认长回复可以完整阅读的正文。');
  f.modelState.respond=(body,res)=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({choices:[{message:{role:'assistant',content:lines.join('\n\n')}}],usage:{prompt_tokens:1,completion_tokens:1}}));};
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.setViewportSize({width:390,height:844});
    await login(page,f.h.admin,f.password);
    await page.getByLabel('当前管理作用域').selectOption('project:101');
    const message=page.getByLabel('管理消息',{exact:true}),send=page.getByRole('button',{name:'发送',exact:true});
    // A phone keyboard halves the viewport: the input and the send button must stay on screen together.
    await page.setViewportSize({width:390,height:430});
    await expect(message).toBeInViewport();await expect(send).toBeInViewport();
    await message.fill('给我一段长回复');
    await message.focus();await page.keyboard.press('Tab');
    await expect(send).toBeFocused();
    await page.keyboard.press('Enter');
    const feed=page.getByRole('log',{name:'管理会话记录'});
    await expect(feed).toContainText('第 80 行');
    const last=feed.getByText(/^第 80 行：/);
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
    // Reading stays possible: the feed scrolls instead of clipping the answer.
    expect(await feed.evaluate(node=>node.scrollHeight>node.clientHeight)).toBe(true);
    expect(errors).toEqual([]);
  }finally{await f.close();rmSync(f.h.directory,{recursive:true,force:true});}
});
