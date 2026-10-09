// Independent QA fixture. Importing this module starts no product or browser.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

export function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});promise.catch(()=>{});return {promise,resolve,reject};}
// Bounded condition polling, not fixed sleeps used to infer response order.
export const expect={async poll(probe,expected,label,{timeout=12000}={}){const end=Date.now()+timeout;let actual,last;do{try{actual=await probe();assert.deepEqual(actual,expected,label);return actual;}catch(e){last=e;}await delay(20);}while(Date.now()<end);throw new Error(`${label}: condition did not reach expected value`,{cause:last});}};
const repository=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export function validateManifest(manifest,{root,sha,referenced}){
  assert.equal(manifest.sourceCommit,sha);assert.equal(path.resolve(manifest.root).toLowerCase(),path.resolve(root).toLowerCase(),'Manifest source root mismatch');
  assert.equal(referenced.length,2,'Require one JS and one CSS asset');assert.ok(referenced.some(x=>x.endsWith('.js'))&&referenced.some(x=>x.endsWith('.css')));
  const expected=['dist/index.html',...referenced].sort();assert.deepEqual(manifest.files.map(x=>x.file.replaceAll('\\','/')).sort(),expected,'Manifest must bind the complete referenced dist');
  for(const item of manifest.files)assert.match(item.sha256,/^[a-f0-9]{64}$/);
  return expected;
}
export function verifyHash(bytes,expected,label){assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,`Frozen asset mismatch ${label}`);}
export async function approvedTarget(){
  for(const key of ['STUDIO_URL','STUDIO_ROOT','STUDIO_WORKSPACE','SPROUT_TEST_PACKAGE','SPROUT_CONFIG_DIR','ELECTRON_USER_DATA_DIR'])assert.ok(!process.env[key],`Refuse ambient profile/attachment ${key}`);
  const {SPROUT_SESSION_QA_ROOT:root,SPROUT_SESSION_QA_SHA:sha,SPROUT_SESSION_QA_DIST_MANIFEST:manifestPath}=process.env;
  if(!root&&!sha&&!manifestPath)return null;
  assert.ok(path.isAbsolute(root||'')&&path.isAbsolute(manifestPath||''),'Explicit absolute frozen root and manifest required');assert.match(sha||'',/^[a-f0-9]{40}$/,'Full frozen source SHA required');
  const real=await fs.realpath(root),allowed=await fs.realpath(path.join(repository,'.worktrees/studio-002-session-navigation'));
  assert.equal(real.toLowerCase(),allowed.toLowerCase(),'Refuse unknown source root or main/old dist');
  const git=(...args)=>execFileSync('git',args,{cwd:real,encoding:'utf8',windowsHide:true}).trim();
  assert.equal(git('rev-parse','HEAD'),sha,'Frozen source HEAD mismatch');assert.equal(git('diff','HEAD','--name-only'),'','Tracked worktree must be frozen');
  assert.equal(git('ls-files','--others','--exclude-standard','--','src','server'),'','Reject untracked product modules outside the frozen commit');
  const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));assert.equal(manifest.sourceCommit,sha);assert.equal((await fs.realpath(manifest.root)).toLowerCase(),real.toLowerCase());
  const html=await fs.readFile(path.join(real,'dist/index.html'),'utf8');
  const referenced=[...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map(m=>'dist'+m[1]);
  const expected=validateManifest(manifest,{root:real,sha,referenced});
  const checked=[];for(const item of manifest.files){const name=item.file.replaceAll('\\','/');assert.ok(expected.includes(name));verifyHash(await fs.readFile(path.join(real,name)),item.sha256,name);checked.push({file:name,sha256:item.sha256});}
  const sources=git('ls-files','src','server').split(/\r?\n/).filter(Boolean),sourceHashes=[];
  for(const name of sources)sourceHashes.push({file:name,sha256:createHash('sha256').update(await fs.readFile(path.join(real,name))).digest('hex')});
  return {root:real,sha,manifest:checked,sourceHashes};
}
export async function dynamicHtml(dir,label){
  await fs.mkdir(path.join(dir,'dist/h5'),{recursive:true});
  await fs.writeFile(path.join(dir,'dist/h5/index.html'),`<!doctype html><html><head><meta charset="utf-8"></head><body><h1>${label}</h1><label>夹具输入<input aria-label="夹具输入"></label><button id="apply">应用输入</button><output aria-label="夹具结果"></output><script>document.querySelector('#apply').onclick=()=>document.querySelector('output').textContent=document.querySelector('input').value;</script></body></html>`);
}
export async function isolatedStudio(target,run){
  // Product imports happen only here, after approvedTarget checks the frozen root.
  const {Store}=await import(pathToFileURL(path.join(target.root,'server/store.mjs')).href);
  const {startStudio}=await import(pathToFileURL(path.join(target.root,'server/index.mjs')).href);
  const {chromium}=await import('playwright-core');
  const tempBase=await fs.realpath(os.tmpdir()),root=await fs.mkdtemp(path.join(tempBase,'sprout-session-navigation-'));
  let studio,browser;const runs=[],stopIds=[],startIds=[],newBuilds=[];
  try{
    const store=new Store(root);await store.init();const projects={};
    for(const title of ['QA 项目 A','QA 项目 B']){const p=await store.create(title);const draft=await store.draft(p.id);await fs.writeFile(path.join(draft,'src/pages/index/index.jsx'),`export default function Index(){return ${JSON.stringify(title+' SOURCE')};}`);await dynamicHtml(draft,title);await store.commit(p,draft,'QA dynamic HTML, not Taro');await fs.rm(draft,{recursive:true,force:true});projects[title.endsWith('A')?'a':'b']=p;}
    studio=await startStudio({root,port:0,seed:false,production:true,
      build:async(dir,{signal})=>{const gate=deferred();newBuilds.push({dir,gate});const aborted=deferred();if(signal.aborted)aborted.reject(signal.reason);else signal.addEventListener('abort',()=>aborted.reject(signal.reason),{once:true});await Promise.race([gate.promise,aborted.promise]);signal.throwIfAborted();await dynamicHtml(dir,'QA 新建 C');},
      agent:async({project,prompt,emit,signal})=>{const finish=deferred(),record={id:project.id,prompt,emit,finish,signal};runs.push(record);const aborted=deferred();if(signal.aborted)aborted.reject(signal.reason);else signal.addEventListener('abort',()=>aborted.reject(signal.reason),{once:true});await Promise.race([finish.promise,aborted.promise]);project.messages.push({role:'assistant',text:`QA 完成 ${project.title}`,time:Date.now()});return project;}
    });
    const headers={'X-Studio-Token':studio.token,'Content-Type':'application/json'};
    const response=await fetch(studio.url+'/api/settings',{method:'POST',headers,body:JSON.stringify({baseUrl:'http://localhost',model:'qa-injected-agent',apiKey:'qa-placeholder-only'})});assert.equal(response.status,200);
    browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
    await page.addInitScript(()=>{
      // QA-only receipt evidence: parsing + two rendering opportunities after the
      // caller's promise continuation, not just route.fulfill having returned.
      const original=globalThis.fetch;globalThis.__qaReceipt={consumed:[],rendered:[]};
      globalThis.fetch=async(...args)=>{const response=await original(...args),id=response.headers.get('x-qa-receipt');if(id){const json=response.json.bind(response);response.json=async()=>{const value=await json();globalThis.__qaReceipt.consumed.push(id);queueMicrotask(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>globalThis.__qaReceipt.rendered.push(id))));return value;};}return response;};
    });
    page.on('request',request=>{const url=new URL(request.url());if(url.origin!==studio.url)return;if(request.method()==='POST'&&/\/stop$/.test(url.pathname))stopIds.push(url.pathname.split('/').at(-2));if(request.method()==='POST'&&/\/run$/.test(url.pathname))startIds.push(url.pathname.split('/').at(-2));});
    await page.goto(studio.url);await page.locator('.composer textarea').waitFor();
    // Stop periodic browser timers at a known point; tests advance polling deliberately.
    await page.clock.install();await page.clock.pauseAt(new Date());
    await run({studio,store,page,projects,runs,stopIds,startIds,newBuilds,headers});
  }finally{
    try{await browser?.close();}finally{try{await studio?.close();}finally{
      const real=await fs.realpath(root),rel=path.relative(tempBase,real);assert.ok(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel)&&path.basename(real).startsWith('sprout-session-navigation-'));await fs.rm(real,{recursive:true,force:true});
    }}
  }
}
let receiptSequence=0;
export async function responseGate(page,origin,match,{beforeFetch=false,failure=null}={}){
  const pending=[],entered=deferred();let armed=true;
  const handler=async route=>{const request=route.request();if(new URL(request.url()).origin!==origin||!armed||!match(request))return route.continue();const release=deferred(),delivered=deferred(),item={request,response:null,release,delivered,id:`session-qa-${++receiptSequence}`,serviceReceived:false};pending.push(item);try{
    if(beforeFetch){entered.resolve();await release.promise;}
    if(failure==='http'){await route.fulfill({status:400,headers:{'content-type':'application/json','x-qa-receipt':item.id},body:JSON.stringify({error:'QA rejection before run headers'})});return;}
    if(failure==='network'){await route.abort('failed');return;}
    item.response=await route.fetch();item.serviceReceived=true;if(!beforeFetch){entered.resolve();await release.promise;}
    await route.fulfill({response:item.response,headers:{...item.response.headers(),'x-qa-receipt':item.id}});
  }catch{await route.abort().catch(()=>{});}finally{delivered.resolve();}};
  await page.route('**/api/**',handler);
  const release=async()=>{armed=false;for(const item of pending)item.release.resolve();await Promise.all(pending.map(item=>item.delivered.promise));await page.unroute('**/api/**',handler);};
  return {pending,entered:entered.promise,release,async releaseAndConsume(){await release();const ids=pending.filter(item=>failure!=='network').map(item=>item.id);assert.ok(ids.length,'Must actually delay at least one response');await expect.poll(()=>page.evaluate(ids=>ids.every(id=>globalThis.__qaReceipt?.consumed.includes(id)),ids),true,'Delayed response JSON consumed');await page.clock.runFor(40);await expect.poll(()=>page.evaluate(ids=>ids.every(id=>globalThis.__qaReceipt?.rendered.includes(id)),ids),true,'Two render frames after response consumption');}};
}
export async function select(page,title){const item=page.locator('.project-item').filter({has:page.getByText(title,{exact:true})});assert.equal(await item.count(),1);assert.equal(await item.isEnabled(),true);await item.click();await expect.poll(()=>page.locator('.breadcrumb strong').textContent(),title,'Selected project title');}
export async function assertSelected(page,title,draft){await expect.poll(()=>page.locator('.breadcrumb strong').textContent(),title,'Late response must not take active project');if(draft!==undefined)assert.equal(await page.locator('.composer textarea').inputValue(),draft);}
export async function send(page,text){await page.locator('.composer textarea').fill(text);await page.getByTitle('发送消息',{exact:true}).click();}
export async function runForProject(ctx,id,count=1){await expect.poll(()=>ctx.runs.filter(x=>x.id===id).length,count,'Expected injected agent run');return ctx.runs.filter(x=>x.id===id).at(-1);}

if(process.argv.includes('--self-check')&&path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url)){
  const a=deferred(),b=deferred();let owner='B';a.promise.then(()=>{owner='A completed';});b.resolve();assert.equal(owner,'B');a.resolve();await a.promise;assert.equal(owner,'A completed');await expect.poll(()=>owner,'A completed','Pure deferred self-check');
  const refs=['dist/assets/fixture.js','dist/assets/fixture.css'],sha='a'.repeat(40),bytes=Buffer.from('fixture'),hash=createHash('sha256').update(bytes).digest('hex'),manifest={sourceCommit:sha,root:repository,files:['dist/index.html',...refs].map(file=>({file,sha256:hash}))};
  validateManifest(manifest,{root:repository,sha,referenced:refs});verifyHash(bytes,hash,'pure fixture');
  assert.throws(()=>validateManifest({...manifest,sourceCommit:'b'.repeat(40)},{root:repository,sha,referenced:refs}));
  assert.throws(()=>validateManifest({...manifest,root:path.join(repository,'unknown')},{root:repository,sha,referenced:refs}));
  assert.throws(()=>validateManifest({...manifest,files:[...manifest.files,{file:'../old.js',sha256:hash}]},{root:repository,sha,referenced:refs}));assert.throws(()=>verifyHash(bytes,'0'.repeat(64),'mismatch'));
  let handler,fulfilled=false;const fetchGate=deferred();const fakePage={async route(pattern,fn){handler=fn;},async unroute(){}};
  const gate=await responseGate(fakePage,'http://127.0.0.1:12345',()=>true);
  const handling=handler({request:()=>({url:()=> 'http://127.0.0.1:12345/api/settings'}),fetch:()=>fetchGate.promise,async fulfill(){fulfilled=true;},async abort(){},async continue(){}});
  assert.equal(gate.pending.length,1);const releasing=gate.release();assert.equal(fulfilled,false);fetchGate.resolve({headers:()=>({})});await Promise.all([handling,releasing]);assert.equal(fulfilled,true);
  let fetched=false;const before=await responseGate(fakePage,'http://127.0.0.1:12345',()=>true,{beforeFetch:true});const handledBefore=handler({request:()=>({url:()=> 'http://127.0.0.1:12345/api/stop'}),async fetch(){fetched=true;return {headers:()=>({})};},async fulfill(){},async abort(){},async continue(){}});await before.entered;assert.equal(fetched,false);await before.release();await handledBefore;assert.equal(fetched,true);
  console.log('Pure fixture deferred/poll/manifest rejection/hash/release-during-fetch self-check passed; no product/browser/server imports.');
}
