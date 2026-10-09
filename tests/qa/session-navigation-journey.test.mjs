// Prepared independently before product freeze. No old dist/profile/model is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedTarget,isolatedStudio,responseGate,expect,select,assertSelected,send,runForProject} from './session-navigation-fixture.mjs';

const composer=page=>page.locator('.composer textarea');
const pathname=request=>new URL(request.url()).pathname;
async function createC(page){await page.getByRole('button',{name:/新建小程序/}).click();const dialog=page.getByRole('dialog');assert.equal(await dialog.count(),1);await dialog.getByRole('textbox').fill('QA 项目 C');await dialog.getByRole('button',{name:'创建项目',exact:true}).click();await dialog.waitFor({state:'hidden'});await assertSelected(page,'QA 项目 C');}
async function pendingRun(ctx,project,text){await select(ctx.page,project.title);await send(ctx.page,text);return runForProject(ctx,project.id);}
async function noSidebarRun(page,title){await expect.poll(async()=>{const row=page.locator('.project-item').filter({has:page.getByText(title,{exact:true})});assert.equal(await row.count(),1);return (await row.locator('small').textContent()).includes('制作中');},false,'Finished project sidebar must leave running state');}
async function exerciseOldFrame(page,text){const frame=page.locator('iframe[title="小程序交互预览"]');assert.equal(await frame.count(),1);await frame.contentFrame().getByLabel('夹具输入',{exact:true}).fill(text);await frame.contentFrame().getByRole('button',{name:'应用输入',exact:true}).click();assert.equal(await frame.contentFrame().getByLabel('夹具结果',{exact:true}).textContent(),text);}

test('independent project session navigation against explicitly frozen source and dist', {timeout:120000},async t=>{
  const target=await approvedTarget();if(!target){t.skip('Await B frozen worktree SHA and dist manifest: set SPROUT_SESSION_QA_ROOT, SPROUT_SESSION_QA_SHA, SPROUT_SESSION_QA_DIST_MANIFEST. This test never builds or attaches.');return;}
  const focusedCase=process.env.SPROUT_SESSION_QA_CASE;
  assert.ok(!focusedCase||focusedCase==='stop-before-service','Unknown QA case filter');
  const subtest=(name,fn)=>t.test(name,{skip:focusedCase&&name!=='stop in-flight blocks next run: request not at service'?'Explicit targeted retry: first-run passed scenario evidence retained, not repeated':false},fn);
  t.diagnostic(JSON.stringify({sourceCommit:target.sha,root:target.root,dist:target.manifest,sourceHashes:target.sourceHashes,preview:'QA dynamic HTML, not Taro',agent:'injected local agent, no model requests'}));
  await subtest('preflight ownership, drafts, new C, late text/done/finally, and old ready interaction',async()=>isolatedStudio(target,async ctx=>{
    const {page,projects,studio,startIds,stopIds}=ctx;await select(page,projects.a.title);
    const settingsGate=await responseGate(page,studio.url,r=>r.method()==='GET'&&pathname(r)==='/api/settings');
    try{
      const started=Date.now();await send(page,'A 原始需求');await settingsGate.entered;assert.deepEqual(startIds,[],'No run may start before settings gate is released');
      await select(page,projects.b.title);await composer(page).fill('B 专属草稿');await assertSelected(page,projects.b.title,'B 专属草稿');
      await createC(page);await composer(page).fill('C 专属草稿');assert.equal(await composer(page).isEnabled(),true);await settingsGate.release();
      const run=await runForProject(ctx,projects.a.id);assert.equal(run.prompt,'A 原始需求');await assertSelected(page,'QA 项目 C','C 专属草稿');assert.deepEqual(stopIds,[],'Navigation does not stop the background project');
      await select(page,projects.b.title);await assertSelected(page,projects.b.title,'B 专属草稿');
      run.emit({type:'text',text:'A_ONLY_STREAM'});run.emit({type:'status',text:'A_ONLY_PROGRESS'});
      await select(page,projects.a.title);await expect.poll(()=>page.locator('.streaming').textContent(),'A_ONLY_STREAM','A owns its streamed text');await expect.poll(()=>page.locator('.progress-line').textContent(),'A_ONLY_PROGRESS','A owns its progress');
      await exerciseOldFrame(page,'A旧版仍交互');assert.match(await page.locator('.preview-caption').textContent(),/已保存版本/);assert.doesNotMatch(await page.locator('.preview-bottom').textContent(),/准备.*中断/);
      await select(page,projects.b.title);await assertSelected(page,projects.b.title,'B 专属草稿');
      const finalGate=await responseGate(page,studio.url,r=>r.method()==='GET'&&pathname(r)===`/api/projects/${projects.a.id}`);
      try{run.finish.resolve();await finalGate.entered;await assertSelected(page,projects.b.title,'B 专属草稿');await createCReuse(page);await finalGate.release();await noSidebarRun(page,projects.a.title);await assertSelected(page,'QA 项目 C','C 专属草稿');}finally{await finalGate.release();}
      await select(page,projects.a.title);assert.match(await page.locator('.chat-scroll').textContent(),/QA 完成 QA 项目 A/);assert.doesNotMatch(await page.locator('.chat-scroll').textContent(),/B 专属草稿|C 专属草稿/);
      t.diagnostic(JSON.stringify({group:'preflight/late completion',elapsedMs:Date.now()-started}));
    }finally{await settingsGate.release();}
  }));
  await subtest('independent project locks, duplicate gate, selected stop, late error and finally',async()=>isolatedStudio(target,async ctx=>{
    const {page,projects,studio,stopIds,startIds}=ctx;
    const a=await pendingRun(ctx,projects.a,'A 并行需求');await select(page,projects.b.title);
    // Two real keyboard submits; no wait on a now-disabled textarea for the second.
    await composer(page).fill('B 并行需求');await composer(page).press('Enter');await page.keyboard.press('Enter');const b=await runForProject(ctx,projects.b.id);assert.deepEqual(startIds,[projects.a.id,projects.b.id]);
    await expect.poll(()=>composer(page).isDisabled(),true,'B composer has its own running lock');
    await select(page,projects.a.title);await expect.poll(()=>composer(page).isDisabled(),true,'Switching back recovers A lock');await exerciseOldFrame(page,'A后台制作旧版输入');
    await select(page,projects.b.title);assert.deepEqual(stopIds,[]);const stop=page.getByTitle('停止制作',{exact:true});assert.equal(await stop.count(),1);await stop.click();await expect.poll(()=>stopIds,[projects.b.id],'Stop must target B only');await expect.poll(()=>b.signal.aborted,true,'B observes explicit stop');assert.equal(a.signal.aborted,false);
    await noSidebarRun(page,projects.b.title);await composer(page).fill('B 停止后草稿');
    const finalGate=await responseGate(page,studio.url,r=>r.method()==='GET'&&pathname(r)===`/api/projects/${projects.a.id}`);
    try{a.finish.reject(new Error('QA A_ONLY_FAILURE'));await finalGate.entered;await assertSelected(page,projects.b.title,'B 停止后草稿');await finalGate.release();await noSidebarRun(page,projects.a.title);await assertSelected(page,projects.b.title,'B 停止后草稿');assert.doesNotMatch((await page.locator('.error-card').allTextContents()).join(''),/A_ONLY_FAILURE/);await select(page,projects.a.title);await expect.poll(async()=>(await page.locator('.error-card').allTextContents()).join('').includes('A_ONLY_FAILURE'),true,'A retains its own error');}finally{await finalGate.release();}
  }));
  await subtest('late files, runtime receipt and project polling preserve active B and code ownership',async()=>isolatedStudio(target,async ctx=>{
    const {page,projects,studio}=ctx;await select(page,projects.a.title);
    const files=await responseGate(page,studio.url,r=>r.method()==='GET'&&pathname(r)===`/api/projects/${projects.a.id}/files`);
    try{await page.getByRole('button',{name:'代码',exact:true}).click();await files.entered;await select(page,projects.b.title);await page.getByRole('button',{name:'代码',exact:true}).click();await expect.poll(async()=>(await page.locator('pre').textContent()).includes('QA 项目 B SOURCE'),true,'B code loaded');await files.releaseAndConsume();await assertSelected(page,projects.b.title);assert.match(await page.locator('pre').textContent(),/QA 项目 B SOURCE/);assert.doesNotMatch(await page.locator('pre').textContent(),/QA 项目 A SOURCE/);}finally{await files.release();}
    await select(page,projects.a.title);
    const runtime=await responseGate(page,studio.url,r=>r.method()==='POST'&&pathname(r)===`/api/projects/${projects.a.id}/runtime-error`);
    try{const handle=await page.locator('iframe[title="小程序交互预览"]').elementHandle();assert.ok(handle);const frame=await handle.contentFrame();assert.ok(frame);await frame.evaluate(({id,revision})=>parent.postMessage({type:'sprout-runtime-error',projectId:id,revision,message:'QA_RUNTIME_A_ONLY',source:'qa',line:1},'*'),{id:projects.a.id,revision:projects.a.revision});await runtime.entered;await select(page,projects.b.title);await composer(page).fill('B runtime隔离草稿');await runtime.releaseAndConsume();await assertSelected(page,projects.b.title,'B runtime隔离草稿');assert.doesNotMatch((await page.locator('.error-card').allTextContents()).join(''),/QA_RUNTIME_A_ONLY/);}finally{await runtime.release();}
    const poll=await responseGate(page,studio.url,r=>r.method()==='GET'&&pathname(r)==='/api/projects');
    try{await select(page,projects.a.title);await page.clock.runFor(1000);await poll.entered;await select(page,projects.b.title);await poll.releaseAndConsume();await assertSelected(page,projects.b.title,'B runtime隔离草稿');await select(page,projects.a.title);await expect.poll(async()=>(await page.locator('.error-card').allTextContents()).join('').includes('QA_RUNTIME_A_ONLY'),true,'A retains runtime ownership');}finally{await poll.release();}
  }));
  await subtest('first-version working overrides interrupted initialization without pretending ready',async()=>isolatedStudio(target,async ctx=>{
    const {page,studio}=ctx;await createC(page);assert.equal(await page.locator('iframe').count(),0);assert.match(await page.locator('.preview-loading').textContent(),/准备|构建/);
    const list=await studio.store.list(),c=list.find(p=>p.title==='QA 项目 C');assert.ok(c);assert.equal(c.ready,false);assert.equal(c.initialization.state,'preparing');await send(page,'C 首版制作');const run=await runForProject(ctx,c.id);run.emit({type:'status',text:'QA 首版仍在制作'});
    await expect.poll(async()=>(await page.locator('.progress-line').textContent()).includes('QA 首版仍在制作'),true,'First run progress received');assert.equal(await page.locator('iframe').count(),0);assert.match(await page.locator('.preview-loading').textContent(),/制作/);assert.doesNotMatch(await page.locator('.preview-loading').textContent(),/预览准备已中断/);assert.match(await page.locator('.preview-bottom').textContent(),/制作/);assert.doesNotMatch(await page.locator('.preview-bottom').textContent(),/预览已就绪|已保存版本/);
    const persisted=await studio.store.get(c.id);assert.equal(persisted.ready,false);assert.equal(persisted.initialization.state,'interrupted');
    run.finish.reject(new Error('QA first version failure'));await noSidebarRun(page,'QA 项目 C');assert.equal(await page.locator('iframe').count(),0);assert.match(await page.locator('.preview-loading').textContent(),/未完成|无可用/);
  }));
  for(const beforeFetch of [true,false])await subtest(`stop in-flight blocks next run: ${beforeFetch?'request not at service':'service processed, response delayed'}`,async()=>isolatedStudio(target,async ctx=>{
    const {page,projects,studio,stopIds,startIds,store}=ctx,a=await pendingRun(ctx,projects.a,'A 旧任务');
    const stopping=await responseGate(page,studio.url,r=>r.method()==='POST'&&pathname(r)===`/api/projects/${projects.a.id}/stop`,{beforeFetch});
    try{
      const stop=page.getByTitle('停止制作',{exact:true});assert.equal(await stop.count(),1);await stop.click();await stopping.entered;
      if(beforeFetch){assert.equal(stopping.pending[0].serviceReceived,false);assert.equal(a.signal.aborted,false);a.finish.resolve();await expect.poll(async()=>(await store.get(projects.a.id)).tasks.at(-1).state,'completed','Old run completes before delayed stop reaches service');await expect.poll(async()=>(await page.locator('.chat-scroll').textContent()).includes('QA 完成 QA 项目 A'),true,'Old completion consumed while stop request remains held');}
      else{assert.equal(stopping.pending[0].serviceReceived,true);await expect.poll(()=>a.signal.aborted,true,'Service processed old stop');await expect.poll(async()=>(await store.get(projects.a.id)).tasks.at(-1).state,'stopped','Old run stopped before delayed response');}
      await select(page,projects.b.title);await composer(page).fill('B 停止期间独立草稿');assert.equal(await composer(page).isEnabled(),true);await select(page,projects.a.title);
      // Final contract: session.stopping disables this project's composer. Navigation
      // remains live; a keyboard attempt must not send a replacement run underneath it.
      assert.equal(await composer(page).isDisabled(),true);await page.keyboard.press('Enter');assert.deepEqual(startIds,[projects.a.id]);assert.deepEqual(stopIds,[projects.a.id]);
      await stopping.releaseAndConsume();await expect.poll(()=>composer(page).isEnabled(),true,'Stop settlement unlocks A');
      if(beforeFetch){await composer(page).fill('A 下一任务');await composer(page).press('Enter');}else await send(page,'A 下一任务');
      const next=await runForProject(ctx,projects.a.id,2);assert.equal(next.prompt,'A 下一任务');assert.equal(next.signal.aborted,false);assert.deepEqual(startIds,[projects.a.id,projects.a.id]);assert.deepEqual(stopIds,[projects.a.id]);
      next.emit({type:'status',text:'A_NEW_RUN_PROGRESS'});await expect.poll(()=>page.locator('.progress-line').textContent(),'A_NEW_RUN_PROGRESS','Old stop cannot overwrite new entry status');await exerciseOldFrame(page,'下一任务旧版本交互');
      await select(page,projects.b.title);await assertSelected(page,projects.b.title,'B 停止期间独立草稿');next.finish.resolve();
    }finally{await stopping.release();}
  }));
  for(const failure of ['http','network'])await subtest(`run rejected before headers preserves draft and later edit: ${failure}`,async()=>isolatedStudio(target,async ctx=>{
    const {page,projects,studio,runs}=ctx;await select(page,projects.a.title);
    const rejected=await responseGate(page,studio.url,r=>r.method()==='POST'&&pathname(r)===`/api/projects/${projects.a.id}/run`,{beforeFetch:true,failure});
    let finalGate;
    try{
      await send(page,'  A 未接收的原草稿  ');await rejected.entered;assert.equal(runs.length,0,'Rejected request never reaches injected agent');
      await select(page,projects.b.title);await composer(page).fill('B 拒绝期间草稿');
      finalGate=await responseGate(page,studio.url,r=>r.method()==='GET'&&pathname(r)===`/api/projects/${projects.a.id}`);
      await rejected.release();await finalGate.entered;await assertSelected(page,projects.b.title,'B 拒绝期间草稿');assert.equal(runs.length,0);
      await select(page,projects.a.title);await expect.poll(()=>composer(page).isEnabled(),true,'A returns to editable after pre-header rejection');assert.equal(await composer(page).inputValue(),'  A 未接收的原草稿  ','onStarted never fired; preserve exact whitespace in original draft');
      await composer(page).fill('A 用户后来编辑的新草稿');await finalGate.releaseAndConsume();await assertSelected(page,projects.a.title,'A 用户后来编辑的新草稿');
      assert.ok((await page.locator('.error-card').allTextContents()).join('').length>0,'A shows a real rejection/network error');await select(page,projects.b.title);await assertSelected(page,projects.b.title,'B 拒绝期间草稿');assert.equal(runs.length,0);
    }finally{await rejected.release();await finalGate?.release();}
  }));
  for(const terminal of ['failed','interrupted'])await subtest(`no-task same-revision delayed preparing GET cannot regress ${terminal} initialization`,async()=>isolatedStudio(target,async ctx=>{
    const {page,studio,projects,newBuilds,store,headers,runs}=ctx;
    const stale=await responseGate(page,studio.url,r=>r.method()==='GET'&&/^\/api\/projects\/[a-f0-9-]{36}$/.test(pathname(r))&&![`/api/projects/${projects.a.id}`,`/api/projects/${projects.b.id}`].includes(pathname(r)));
    let freshPoll;
    try{
      await createC(page);await stale.entered;assert.equal(stale.pending.length,1);const old=await stale.pending[0].response.json();assert.equal(old.ready,false);assert.equal(old.revision,0);assert.equal(old.tasks.length,0);assert.equal(old.initialization.state,'preparing');
      await expect.poll(()=>newBuilds.length,1,'New initialization entered deterministic build gate');
      if(terminal==='failed')newBuilds[0].gate.reject(new Error('QA controlled initialization failure'));
      else{
        // Existing run route cancels preparation before rejecting an empty prompt;
        // this reaches a genuine aborted initialization without creating any task.
        const rejected=await fetch(studio.url+`/api/projects/${old.id}/run`,{method:'POST',headers,body:JSON.stringify({prompt:''})});assert.equal(rejected.status,400);assert.equal(runs.length,0);
      }
      await expect.poll(async()=>(await store.get(old.id)).initialization.state,terminal,'Real preparation records terminal state with same revision');
      freshPoll=await responseGate(page,studio.url,r=>r.method()==='GET'&&pathname(r)==='/api/projects');await page.clock.runFor(1000);await freshPoll.entered;
      const fresh=(await freshPoll.pending[0].response.json()).find(p=>p.id===old.id);assert.equal(fresh.initialization.state,terminal);assert.equal(fresh.revision,old.revision);assert.equal(fresh.tasks.length,0);await freshPoll.releaseAndConsume();
      const semantic=terminal==='failed'?/预览准备失败/:/尚无可用预览|无可用/;
      await expect.poll(async()=>semantic.test(await page.locator('.preview-loading').textContent()),true,'Fresh terminal state rendered before old response release');
      await stale.releaseAndConsume();assert.match(await page.locator('.preview-loading').textContent(),semantic);assert.doesNotMatch(await page.locator('.preview-loading').textContent(),/正在后台构建/);assert.equal(await page.locator('iframe').count(),0);await assertSelected(page,'QA 项目 C');
      const persisted=await store.get(old.id);assert.equal(persisted.ready,false);assert.equal(persisted.revision,0);assert.equal(persisted.tasks.length,0);assert.equal(persisted.initialization.state,terminal);
    }finally{await stale.release();await freshPoll?.release();}
  }));
});
async function createCReuse(page){await select(page,'QA 项目 C');}
