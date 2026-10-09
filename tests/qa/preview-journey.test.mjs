// Independent UI regression. The preview fixture is dynamic HTML, NOT a Taro build.
// Prerequisite: npm run build (explicitly, before running this test).
// Run: node --test --test-timeout=60000 tests/qa/preview-journey.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {APP_ROOT} from '../../server/store.mjs';
import {startStudio} from '../../server/index.mjs';
import {approvedJourney} from '../../scripts/studio-qa-ui.mjs';

async function uiPrerequisite(){
  const html=await fs.readFile(path.join(APP_ROOT,'dist/index.html'),'utf8').catch(()=>null);
  if(!html)return 'Missing Vite dist/index.html. Run npm run build explicitly; this test never builds.';
  const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map(m=>m[1]);
  if(!assets.some(name=>name.endsWith('.js')))return 'Vite dist has no JS asset. Run npm run build explicitly.';
  const manifest=[];
  for(const file of ['src/main.jsx','src/style.css','scripts/studio-qa-ui.mjs','dist/index.html',...assets.map(name=>'dist'+name)]){
    const bytes=await fs.readFile(path.join(APP_ROOT,file)).catch(()=>null);
    if(!bytes)return `Missing ${file}. Run npm run build explicitly; this test never builds.`;
    manifest.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});
  }
  return manifest;
}
async function fixtureArtifact(dir){
  const dest=path.join(dir,'dist/h5');await fs.mkdir(dest,{recursive:true});
  await fs.writeFile(path.join(dest,'index.html'),`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}label,input,button,output{display:block;margin:12px}button{margin-top:560px}</style></head><body><label>QA 文本<input aria-label="QA 文本"></label><button id="apply">应用输入</button><output aria-label="QA 结果"></output><script>document.querySelector('#apply').onclick=()=>document.querySelector('output').textContent=document.querySelector('input').value;</script></body></html>`);
}

test('independent preview user journey: immediate input, honest preparation, scaled interaction and resume policy', {timeout:60000}, async t=>{
  for(const name of ['STUDIO_URL','STUDIO_ROOT','SPROUT_TEST_PACKAGE'])assert.ok(!process.env[name],`Refusing external attachment/profile via ${name}; run in a clean environment.`);
  const prerequisite=await uiPrerequisite();
  if(typeof prerequisite==='string'){t.skip(prerequisite);return;}
  const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:APP_ROOT,encoding:'utf8',windowsHide:true}).trim();
  t.diagnostic(JSON.stringify({sourceHead,kind:'independent Edge + simulated initialization; dynamic HTML preview, not Taro',uiManifest:prerequisite}));
  const tempBase=await fs.realpath(os.tmpdir());
  const root=await fs.mkdtemp(path.join(tempBase,'sprout-independent-preview-'));
  const relative=path.relative(tempBase,await fs.realpath(root));
  assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'QA root must remain inside OS temp');
  let studio,browser,releaseSeed,rejectNew,enteredNew=false,agentCalls=0,buildCalls=0;
  const seedGate=new Promise(resolve=>{releaseSeed=resolve;});
  const newGate=new Promise((resolve,reject)=>{rejectNew=reject;});newGate.catch(()=>{});
  try{
    studio=await startStudio({root,port:0,production:true,seed:true,
      build:async(dir,{signal})=>{
        const gate=++buildCalls===1?seedGate:(enteredNew=true,newGate);
        await Promise.race([gate,new Promise((resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});})]);
        signal.throwIfAborted();await fixtureArtifact(dir);
      },
      agent:async({project,emit})=>{agentCalls++;emit({type:'status',text:'QA 模拟制作已接收'});return project;}
    });
    const headers={'X-Studio-Token':studio.token,'Content-Type':'application/json'};
    const post=async(url,body)=>{const response=await fetch(studio.url+'/api'+url,{method:'POST',headers,body:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();};
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1280,height:900}}),composer=page.locator('.composer textarea');
    const bootstrapStarted=Date.now();await page.goto(studio.url);await composer.fill('后台准备中即可输入');
    const journey=approvedJourney(page,{origin:studio.url,version:sourceHead});
    const bootstrapInputMs=Date.now()-bootstrapStarted;assert.ok(bootstrapInputMs<5000);assert.equal(buildCalls,1);assert.equal(await page.locator('iframe').count(),0);
    releaseSeed();await page.locator('iframe[title="小程序交互预览"]').waitFor();
    const measurements=[];
    for(const viewport of [{width:960,height:700},{width:1280,height:900}]){
      await page.setViewportSize(viewport);
      const frame=page.locator('iframe[title="小程序交互预览"]');
      await page.waitForFunction(()=>{const e=document.querySelector('iframe'),s=e?.closest('.phone-stage');if(!e||!s)return false;const a=e.getBoundingClientRect(),b=s.getBoundingClientRect(),expected=Math.min(1,s.clientWidth/389,s.clientHeight/784);return Math.abs(a.width/e.offsetWidth-expected)<.002&&a.left>=b.left-.2&&a.right<=b.right+.2&&a.top>=b.top-.2&&a.bottom<=b.bottom+.2;});
      assert.deepEqual(await frame.contentFrame().locator('body').evaluate(()=>({width:innerWidth,height:innerHeight})),{width:375,height:720});
      const helperGeometry=await journey.previewGeometry();
      assert.equal(helperGeometry.version,sourceHead);assert.deepEqual(helperGeometry.logicalSize,{width:375,height:720});
      assert.deepEqual(helperGeometry.viewport,viewport);assert.ok(helperGeometry.physicalBox?.width>0&&helperGeometry.physicalBox?.height>0);
      assert.ok(helperGeometry.scale>0&&helperGeometry.scale<=1);
      const text=`缩放后实际输入 ${viewport.width}`;await frame.contentFrame().getByLabel('QA 文本',{exact:true}).fill(text);await frame.contentFrame().getByRole('button',{name:'应用输入',exact:true}).click();assert.equal(await frame.contentFrame().getByLabel('QA 结果',{exact:true}).textContent(),text);
      await composer.fill(text);assert.equal(await composer.inputValue(),text);
      measurements.push({viewport,helperGeometry,...await frame.evaluate(e=>{const a=e.getBoundingClientRect();return {renderWidth:a.width,renderHeight:a.height,scale:a.width/e.offsetWidth};})});
    }
    await page.getByRole('button',{name:/新建小程序/}).click();await page.getByRole('dialog').getByRole('textbox').fill('独立轨迹项目');
    const newStarted=Date.now();await page.getByRole('dialog').getByRole('button',{name:'创建项目',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await composer.fill('新建后立刻输入');
    const newInputMs=Date.now()-newStarted;assert.ok(newInputMs<5000);assert.equal(await page.locator('iframe').count(),0);
    await t.test('background failure automatically appears and creation remains possible',async()=>{
      for(let i=0;i<100&&!enteredNew;i++)await new Promise(resolve=>setTimeout(resolve,20));assert.equal(enteredNew,true);
      rejectNew(new Error('QA controlled initialization failure'));
      await page.locator('.preview-loading').getByText('预览准备失败',{exact:true}).waitFor();assert.equal(await page.locator('iframe').count(),0);await composer.fill('失败之后仍可制作');
      // Memory-only placeholder, injected agent: no network model and no credential store.
      await post('/settings',{baseUrl:'http://localhost',model:'qa-simulated',apiKey:'qa-placeholder-only'});await page.reload();await composer.fill('失败之后仍可制作');await page.getByTitle('发送消息',{exact:true}).click();await page.locator('.security-note').getByText('答复已完成',{exact:true}).waitFor();assert.equal(agentCalls,1);
    });
    const summary=await studio.store.list(),project=await studio.store.get(summary.find(p=>p.title==='独立轨迹项目').id);
    for(const state of ['interrupted','failed','stopped']){
      project.tasks=[{id:'qa-'+state,state,phase:'QA '+state,resumable:false,events:[]}];await studio.store.save(project);await page.reload();await composer.waitFor();assert.equal(await page.getByRole('button',{name:'核对源码并继续',exact:true}).count(),0);
      project.tasks[0].resumable=true;await studio.store.save(project);await page.reload();await page.getByRole('button',{name:'核对源码并继续',exact:true}).waitFor();
    }
    t.diagnostic(JSON.stringify({bootstrapInputMs,newInputMs,measurements,agentCalls,buildCalls,realTaroBuilds:0,realModelRequests:0}));
  }finally{
    releaseSeed();rejectNew(new Error('QA cleanup'));
    try{await browser?.close();}finally{try{await studio?.close();}finally{
      // Delete only this test's verified, freshly allocated temp root; never user paths.
      const resolved=await fs.realpath(root),rel=path.relative(tempBase,resolved);
      assert.ok(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel)&&path.basename(resolved).startsWith('sprout-independent-preview-'));
      await fs.rm(resolved,{recursive:true,force:true});
    }}
  }
});
