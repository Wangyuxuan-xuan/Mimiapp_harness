import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {APP_ROOT} from '../server/store.mjs';
import {startStudio} from '../server/index.mjs';
import {buildProject} from '../server/builder.mjs';
const reuseIndex=process.argv.indexOf('--reuse-root'),reuse=reuseIndex>=0;
const root=reuse?path.resolve(process.argv[reuseIndex+1]):await fs.mkdtemp(path.join(APP_ROOT,'.test-data-preview-ui-'));
const report={createdAt:new Date().toISOString(),root,kind:'real Edge UI; seed preparation held by gate; new project actual Taro H5+Weapp build; no model or credentials',checks:[],sizes:[]};
let builds=0,sampleStarted=false;
const started=Date.now();
const studio=await startStudio({root,port:0,production:true,seed:!reuse,build:async(dir,options)=>{
  if(++builds===1){sampleStarted=true;await new Promise((resolve,reject)=>{if(options.signal.aborted)return reject(options.signal.reason);options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true});});}
  else await buildProject(dir,options);
}});
report.listeningMs=Date.now()-started;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),input=page.locator('.composer textarea');
  let t=Date.now();await page.goto(studio.url);await input.waitFor();
  if(!reuse){await input.fill('首次打开时立即输入');report.firstInputMs=Date.now()-t;assert.equal(sampleStarted,true);assert.ok(report.firstInputMs<5000);assert.equal(await page.locator('iframe').count(),0);report.checks.push('first-start input usable while seed build is blocked, no fake iframe');
  await page.getByRole('button',{name:/新建小程序/}).click();await page.getByRole('dialog').getByRole('textbox').fill('真实后台预览');t=Date.now();await page.getByRole('dialog').getByRole('button',{name:'创建项目',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await input.fill('新项目构建时立即输入');report.newProjectInputMs=Date.now()-t;assert.ok(report.newProjectInputMs<5000);assert.equal(await page.locator('iframe').count(),0);report.checks.push('new-project modal closes and composer accepts text while actual build runs');
  await page.locator('iframe').waitFor({timeout:240000});report.actualPreviewMs=Date.now()-t;
  }else{const prior=JSON.parse(await fs.readFile(path.join(APP_ROOT,'test-results/studio-preview-ui-first-attempt.json'),'utf8'));report.priorEvidence='studio-preview-ui-first-attempt.json';for(const key of ['firstInputMs','newProjectInputMs','actualPreviewMs'])report[key]=prior[key];report.checks.push(...prior.checks);report.reusedActualBuild=true;}
  await page.locator('iframe').waitFor();await page.locator('iframe').contentFrame().locator('body').waitFor();
  for(const viewport of [{width:1280,height:900},{width:900,height:650},{width:1600,height:1000}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(1200);
    const size=await page.locator('iframe').evaluate(frame=>{const stage=frame.closest('.phone-stage').getBoundingClientRect(),rect=frame.getBoundingClientRect();return {stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},renderWidth:rect.width,renderHeight:rect.height,scale:rect.width/frame.offsetWidth,inside:rect.left>=stage.left-.1&&rect.right<=stage.right+.1&&rect.top>=stage.top-.1&&rect.bottom<=stage.bottom+.1};});
    Object.assign(size,await page.locator('iframe').contentFrame().locator('body').evaluate(()=>({contentWidth:innerWidth,contentHeight:innerHeight})));
    report.sizes.push({viewport,...size});assert.equal(size.contentWidth,375);assert.equal(size.contentHeight,720);assert.equal(size.inside,true);assert.ok(size.scale<=1);
  }
  await page.getByLabel('预览尺寸').selectOption('320');await page.waitForTimeout(1200);const small=await page.locator('iframe').contentFrame().locator('body').evaluate(()=>({width:innerWidth,height:innerHeight}));assert.equal(small.width,320);assert.equal(small.height,720);report.checks.push('375x720 and 320x720 content viewport retained across container resize, shell scales to fit');
  report.passed=true;
}catch(e){report.passed=false;report.error=e.stack;throw e;}
finally{await browser.close();await studio.close();report.closed=true;await fs.mkdir(path.join(APP_ROOT,'test-results'),{recursive:true});await fs.writeFile(path.join(APP_ROOT,'test-results/studio-preview-ui-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
