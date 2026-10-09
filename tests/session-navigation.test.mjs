// Development regression: own service/root, fake compiler and controlled agent.
// No real model, native application, production profile, or existing service.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {APP_ROOT} from '../server/store.mjs';
import {startStudio} from '../server/index.mjs';
import {approvedJourney} from '../scripts/studio-qa-ui.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let i=0;i<150;i++){const v=await check();if(v)return v;await pause(30);}throw new Error('navigation gate timed out');}
async function artifact(dir,title='已保存的预览'){
  await fs.mkdir(path.join(dir,'dist/h5'),{recursive:true});
  await fs.writeFile(path.join(dir,'dist/h5/index.html'),`<html><head></head><body><h1>${title}</h1><button id="old-button" onclick="this.textContent='旧版仍可交互'">点旧版</button></body></html>`);
}
test('project navigation preserves ownership through preflight, late streams, completion, failures and explicit stop',{timeout:90000},async t=>{
  for(const name of ['STUDIO_URL','STUDIO_ROOT','SPROUT_TEST_PACKAGE'])assert.ok(!process.env[name],`Refuse external ${name}`);
  await fs.access(path.join(APP_ROOT,'dist/index.html'));
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-navigation-')),contexts=new Map(),stopIds=[];
  async function check(name,fn){let failure;await t.test(name,async()=>{try{await fn();}catch(e){failure=e;t.diagnostic(e.stack);throw e;}});if(failure)throw failure;}
  const report={sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:APP_ROOT,encoding:'utf8',windowsHide:true}).trim(),root,kind:'isolated Edge + controlled agent and compiler; no model',checks:[]};
  let studio,browser,releaseSettings,releaseFinal,holdingSettings=false,finalHeld=false,finalGateEnabled=false;
  const settingsGate=new Promise(r=>{releaseSettings=r;}),finalGate=new Promise(r=>{releaseFinal=r;});
  try{
    studio=await startStudio({root,port:0,production:true,seed:false,
      build:async(_dir,{signal})=>{await new Promise((resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});},
      agent:async args=>{
        const {project,prompt,emit,signal,store,onPublish}=args;
        let finish;const gate=new Promise((resolve,reject)=>{finish=resolve;signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
        contexts.set(prompt,{...args,finish});
        if(!prompt.includes('静默'))emit({type:'status',text:`正在编译 ${project.title}`});
        const outcome=await gate;if(outcome==='error')throw new Error(`专属失败 ${prompt}`);
        const draft=await store.draft(project.id);await artifact(draft,project.title+' 新版');await store.commit(project,draft,'模拟制作 '+prompt,{signal,beforePublish:onPublish});
        project.messages.push({role:'assistant',text:'专属完成 '+prompt,time:Date.now()});await store.save(project);return project;
      }});
    const headers={'X-Studio-Token':studio.token,'Content-Type':'application/json'},post=async(route,value)=>{const response=await fetch(studio.url+'/api'+route,{method:'POST',headers,body:JSON.stringify(value)});assert.equal(response.status,200,await response.clone().text());return response.json();};
    const a=await post('/projects',{title:'导航项目 A'}),b=await studio.store.create('导航项目 B');
    const draft=await studio.store.draft(b.id);await artifact(draft,'B 已保存版本');await studio.store.commit(b,draft,'已就绪基线');
    await post('/settings',{baseUrl:'http://localhost',model:'controlled-navigation',apiKey:'navigation-fixture-only'});
    browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
    page.on('request',request=>{const match=request.url().match(/\/api\/projects\/([^/]+)\/stop$/);if(match)stopIds.push(match[1]);});
    const composer=page.locator('.composer textarea'),selected=()=>page.locator('.project-item.active strong'),pick=title=>page.locator('.project-item').filter({has:page.locator('strong',{hasText:title})}).click();
    await page.goto(studio.url);await composer.waitFor();await pick('导航项目 A');
    const journey=approvedJourney(page,{origin:studio.url,version:report.sourceHead});assert.equal((await journey.observe()).composerEnabled,true);
    await page.route('**/api/settings',async route=>{if(holdingSettings&&route.request().method()==='GET')await settingsGate;await route.continue();});
    await page.route(`**/api/projects/${a.id}`,async route=>{
      if(finalGateEnabled&&(await studio.store.get(a.id)).tasks.at(-1)?.state==='completed'){
        finalGateEnabled=false;const response=await route.fetch();finalHeld=true;await finalGate;await route.fulfill({response});
      }else await route.continue();
    });
    await check('preflight switch captures A and preserves B draft; duplicate key events make one run',async()=>{
      holdingSettings=true;await composer.fill('A 首轮');
      await composer.evaluate(element=>{for(let i=0;i<2;i++)element.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});
      await page.getByTitle('停止制作',{exact:true}).waitFor();await pick('导航项目 B');await composer.fill('B 未发送草稿');
      holdingSettings=false;releaseSettings();await until(()=>contexts.has('A 首轮'));
      assert.equal(await selected().textContent(),'导航项目 B');assert.equal(await composer.inputValue(),'B 未发送草稿');
      assert.equal(contexts.size,1);assert.equal((await studio.store.get(a.id)).messages.filter(m=>m.role==='user'&&m.text==='A 首轮').length,1);
      assert.equal((await studio.store.get(b.id)).messages.some(m=>m.text==='A 首轮'),false);report.checks.push('preflight A ownership, B draft, duplicate dispatch guard');
    });
    await check('A late text and progress stay with A; new C is available while A produces',async()=>{
      contexts.get('A 首轮').emit({type:'text',text:'只属于 A 的流式内容'});contexts.get('A 首轮').emit({type:'status',text:'A 仍在真实流程中编译'});
      await pick('导航项目 A');await page.locator('.streaming').getByText('只属于 A 的流式内容',{exact:true}).waitFor();await page.locator('.progress-line').getByText('A 仍在真实流程中编译',{exact:true}).waitFor();
      await page.locator('.preview-loading').getByText('正在制作首个可用版本',{exact:true}).waitFor();assert.equal(await page.getByText('预览准备已中断',{exact:true}).count(),0);
      await pick('导航项目 B');assert.equal(await composer.inputValue(),'B 未发送草稿');assert.equal(await page.locator('.streaming').count(),0);
      const started=Date.now();await page.getByRole('button',{name:/新建小程序/}).click();await page.getByPlaceholder('给你的想法起个名字').fill('导航项目 C');await page.getByRole('button',{name:'创建项目',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await until(async()=>await selected().textContent()==='导航项目 C');await composer.fill('C 独立草稿');const created={inputMs:Date.now()-started};assert.ok(created.inputMs<5000);
      assert.equal(await selected().textContent(),'导航项目 C');assert.equal(await page.getByRole('button',{name:'模型与设置',exact:true}).isEnabled(),false);report.newProjectInputMs=created.inputMs;report.checks.push('A progress/stream isolated; C creation enabled; settings globally protected');
    });
    await check('A done and delayed finally read never navigate away from C',async()=>{
      finalGateEnabled=true;contexts.get('A 首轮').finish();await until(()=>finalHeld);
      assert.equal(await selected().textContent(),'导航项目 C');assert.equal(await composer.inputValue(),'C 独立草稿');
      releaseFinal();await until(async()=>(await studio.store.get(a.id)).tasks.at(-1).state==='completed');await pause(80);
      assert.equal(await selected().textContent(),'导航项目 C');assert.equal(await composer.inputValue(),'C 独立草稿');await pick('导航项目 A');await page.frameLocator('iframe').getByRole('heading',{name:'导航项目 A 新版',exact:true}).waitFor();report.checks.push('late done/finally update A cache without changing selected C');
    });
    await check('old A preview remains interactive during another run; late error stays with A',async()=>{
      await composer.fill('A 失败');await page.getByTitle('发送消息',{exact:true}).click();await until(()=>contexts.has('A 失败'));
      await page.locator('.preview-bottom').getByText('正在制作 · 当前预览为已保存版本 1',{exact:true}).waitFor();await page.frameLocator('iframe').getByRole('button',{name:'点旧版',exact:true}).click();await page.frameLocator('iframe').getByRole('button',{name:'旧版仍可交互',exact:true}).waitFor();
      await pick('导航项目 B');contexts.get('A 失败').emit({type:'text',text:'只属于 A 的失败前内容'});contexts.get('A 失败').finish('error');await until(async()=>(await studio.store.get(a.id)).tasks.at(-1).state==='failed');
      await pause(80);assert.equal(await selected().textContent(),'导航项目 B');assert.equal(await composer.inputValue(),'B 未发送草稿');assert.equal(await page.locator('.error-card').count(),0);
      await pick('导航项目 A');await page.locator('.error-card').getByText('专属失败 A 失败',{exact:true}).waitFor();assert.equal(await page.locator('iframe').count(),1);report.checks.push('saved preview remains interactive; failed stream/error stays with originating A');
    });
    await check('two projects can run under existing service rules; stop affects the selected id only',async()=>{
      await composer.fill('A 后台');await page.getByTitle('发送消息',{exact:true}).click();await until(()=>contexts.has('A 后台'));
      await pick('导航项目 B');await composer.fill('B 静默');await page.getByTitle('发送消息',{exact:true}).click();await until(()=>contexts.has('B 静默'));
      await page.getByTitle('停止制作',{exact:true}).click();await until(async()=>(await studio.store.get(b.id)).tasks.at(-1).state==='stopped');
      assert.equal((await studio.store.get(a.id)).tasks.at(-1).state,'running');assert.equal(stopIds.at(-1),b.id);
      await pick('导航项目 A');await page.getByTitle('停止制作',{exact:true}).click();await until(async()=>(await studio.store.get(a.id)).tasks.at(-1).state==='stopped');assert.equal(stopIds.at(-1),a.id);report.checks.push('separate active jobs; header-only silent run stoppable; stop bound to selected project');
    });
    await check('delayed stop request and response block the next round until both settle',async()=>{
      await until(async()=>await composer.isEnabled());await composer.fill('A 停止竞态');await page.getByTitle('发送消息',{exact:true}).click();await until(()=>contexts.has('A 停止竞态'));
      let releaseRequest,releaseResponse,requestHeld=false,responseHeld=false;
      const requestGate=new Promise(r=>{releaseRequest=r;}),responseGate=new Promise(r=>{releaseResponse=r;});
      await page.route(`**/api/projects/${a.id}/stop`,async route=>{requestHeld=true;await requestGate;const response=await route.fetch();responseHeld=true;await responseGate;await route.fulfill({response});});
      try{
        await page.getByTitle('停止制作',{exact:true}).click();await until(()=>requestHeld);contexts.get('A 停止竞态').finish();await until(async()=>(await studio.store.get(a.id)).tasks.at(-1).state==='completed');await pause(100);
        assert.equal(await composer.isEnabled(),false);await composer.evaluate(el=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));assert.equal(contexts.has('A 下一轮'),false);
        releaseRequest();await until(()=>responseHeld);assert.equal(await composer.isEnabled(),false);
        releaseResponse();await until(async()=>await composer.isEnabled());await composer.fill('A 下一轮');await page.getByTitle('发送消息',{exact:true}).click();await until(()=>contexts.has('A 下一轮'));
        assert.equal((await studio.store.get(a.id)).tasks.at(-1).state,'running');contexts.get('A 下一轮').finish();await until(async()=>await composer.isEnabled());
        report.checks.push('stop request and response gate next round; old stop cannot stop the subsequent task');
      }finally{releaseRequest();releaseResponse();await page.unroute(`**/api/projects/${a.id}/stop`);}
    });
    await check('HTTP rejection before accepted headers preserves the unsent draft',async()=>{
      await page.route(`**/api/projects/${a.id}/run`,route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'测试服务未接受'})}));
      await composer.fill('拒绝时保留的草稿');await page.getByTitle('发送消息',{exact:true}).click();await page.locator('.error-card').getByText('测试服务未接受',{exact:true}).waitFor();await until(async()=>await composer.isEnabled());
      assert.equal(await composer.inputValue(),'拒绝时保留的草稿');await page.unroute(`**/api/projects/${a.id}/run`);report.checks.push('unaccepted HTTP run retains draft');
    });
    await check('late initial active read cannot overwrite a no-task terminal initialization poll',async()=>{
      const d=await studio.store.create('导航项目 D');d.initialization={state:'preparing',phase:'旧准备阶段'};await studio.store.save(d);
      await until(async()=>await page.locator('.project-item strong').getByText(d.title,{exact:true}).count());
      let releaseRead,readHeld=false;const readGate=new Promise(r=>{releaseRead=r;});
      await page.route(`**/api/projects/${d.id}`,async route=>{const response=await route.fetch();readHeld=true;await readGate;await route.fulfill({response});});
      try{
        await pick(d.title);await until(()=>readHeld);d.initialization={state:'failed',error:'受控准备失败'};await studio.store.save(d);
        await page.locator('.preview-loading').getByText('预览准备失败',{exact:true}).waitFor();releaseRead();await pause(150);
        await page.locator('.preview-loading').getByText('预览准备失败',{exact:true}).waitFor();assert.equal(await page.getByText('旧准备阶段',{exact:true}).count(),0);report.checks.push('no-task same-revision terminal initialization survives late active GET');
      }finally{releaseRead();await page.unroute(`**/api/projects/${d.id}`);}
    });
    report.passed=true;
  }catch(e){report.passed=false;report.error=e.stack;throw e;}
  finally{holdingSettings=false;releaseSettings();releaseFinal();await browser?.close();await studio?.close();report.closed=true;await fs.mkdir(path.join(APP_ROOT,'test-results'),{recursive:true});await fs.writeFile(path.join(APP_ROOT,'test-results/session-navigation-report.json'),JSON.stringify(report,null,2));t.diagnostic(JSON.stringify(report));}
});
