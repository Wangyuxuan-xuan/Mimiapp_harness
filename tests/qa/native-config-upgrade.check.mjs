// Manual/native tier: node tests/qa/native-config-upgrade.check.mjs
// Windows, existing studio2-r1 package and interactive desktop required.
// No compiler or real model; two ready dynamic HTML projects are explicit fixtures.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';

const repo=fileURLToPath(new URL('../../',import.meta.url));
const packageDir=path.join(repo,'release-harness-20261009-studio2-r1');
const expectedProduct='ccae82b131abe30a7b9cc682c1b18712830d8dce';
const manifest=JSON.parse(await fs.readFile(path.join(packageDir,'build-manifest.json'),'utf8'));
const sourceRuntime=path.join(packageDir,'win-unpacked');
const root=path.resolve(await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qa-native-upgrade-')));
const artifacts=path.join(repo,'test-results','native-config-upgrade-'+Date.now());await fs.mkdir(artifacts,{recursive:true});
const key=randomBytes(24).toString('hex'),profile=path.join(root,'profile'),workspace=path.join(root,'workspace');
const report={at:new Date().toISOString(),testHead:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),productBase:manifest.baseCommit,root,artifacts,checks:[],commands:[],runtimes:[],boundary:{sameProductDifferentExeDirectories:true,differentProductUpgrade:false,projects:'ready dynamic HTML fixtures, not generated/compiled',credentials:'random placeholder via stdin once, real Windows safeStorage',realModel:false,taro:false,defaultProfile:false}};
const children=new Set(),desktops=new Set(),browsers=new Set();let saves=0;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,timeout=25000){const deadline=Date.now()+timeout;while(Date.now()<deadline){const result=await check();if(result)return result;await delay(100);}throw new Error('Native configuration journey timed out');}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const passed=(name,details={})=>report.checks.push({name,passed:true,...details});
function inside(file){const relative=path.relative(root,path.resolve(file));assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Native journey path must stay inside its own temporary root');}
function isolatedEnv(exe,userData=profile,work=workspace){
 for(const value of [exe,userData,work]){assert(path.isAbsolute(value));inside(value);}
 const env={...process.env,STUDIO_EXECUTABLE:exe,STUDIO_USER_DATA_DIR:userData,STUDIO_WORKSPACE_DIR:work};
 for(const name of ['STUDIO_URL','ELECTRON_RUN_AS_NODE','STUDIO_CLI_LEASE','STUDIO_CLI_PARENT_PID'])delete env[name];return env;
}
function start(file,args,env,role){
 assert(!env.STUDIO_URL);for(const name of ['STUDIO_EXECUTABLE','STUDIO_USER_DATA_DIR','STUDIO_WORKSPACE_DIR']){assert(path.isAbsolute(env[name]));inside(env[name]);}
 assert.equal(file===process.execPath||file===env.STUDIO_EXECUTABLE,true);
 const child=spawn(file,args,{env,windowsHide:true,stdio:['pipe','pipe','pipe']});children.add(child);
 let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.stdin.on('error',()=>{});
 const result=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',(code,signal)=>{children.delete(child);assert(!stdout.includes(key)&&!stderr.includes(key),'Placeholder reached native process output');resolve({code,signal,stdout,stderr,pid:child.pid,role});});});
 return {child,result};
}
async function ownSession(userData=profile){
 inside(userData);try{const session=JSON.parse(await fs.readFile(path.join(userData,'studio-session-v1.json'),'utf8'));assert.equal(session.workspace,path.resolve(userData===profile?workspace:path.join(userData,'workspace')));assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(session.url));return session;}catch(error){if(error.code==='ENOENT')return null;throw error;}
}
async function waitClean(userData=profile){await until(async()=>{const names=await fs.readdir(userData).catch(e=>e.code==='ENOENT'?[]:Promise.reject(e));return !names.some(name=>name==='studio-session-v1.json'||name.startsWith('.cli-lease-'));});}
async function cli(exe,args,{input='',userData=profile,work=workspace,attachPid,allowStart=false}={}){
 const env=isolatedEnv(exe,userData,work);if(!allowStart){assert(attachPid,'Native CLI requires an explicit expected GUI PID');assert.equal((await ownSession(userData))?.pid,attachPid);}
 if(args[0]==='config'&&args[1]==='save'){saves++;assert.equal(saves,1,'Configuration must be saved only once');assert(input);}
 const task=start(process.execPath,[await fs.realpath(path.join(path.dirname(exe),'resources/app/cli/studio.mjs')),...args],env,'packaged-cli');task.child.stdin.end(input);
 let timer;const result=await Promise.race([task.result,new Promise((_,reject)=>{timer=setTimeout(()=>{task.child.kill();reject(new Error('Native CLI timeout'));},45000);})]).finally(()=>clearTimeout(timer));
 report.commands.push({args,exe,pid:result.pid,code:result.code,signal:result.signal});assert.equal(result.code,0,'Native CLI command failed; diagnostic text deliberately not echoed');
 if(attachPid)assert.equal((await ownSession(userData))?.pid,attachPid,'CLI did not remain attached to expected GUI');
 return JSON.parse(result.stdout);
}
async function runtime(name){
 const destination=path.join(root,name);await fs.mkdir(destination);const linked=[];
 for(const entry of await fs.readdir(sourceRuntime,{withFileTypes:true})){
  if(entry.name==='debug.log')continue;
  const from=path.join(sourceRuntime,entry.name),to=path.join(destination,entry.name);
  if(entry.isDirectory()){await fs.symlink(from,to,'junction');linked.push({name:entry.name,kind:'read-only reuse by test contract'});}
  else if(entry.isFile()){try{await fs.link(from,to);linked.push({name:entry.name,kind:'hardlink'});}catch(error){if(!['EXDEV','EPERM','ENOTSUP'].includes(error.code))throw error;await fs.copyFile(from,to);linked.push({name:entry.name,kind:'copy'});}}
 }
 const exe=path.join(destination,'Sprout Studio.exe');
 const resourceHashes={};for(const [relative,expected] of Object.entries(manifest.files)){const actual=hash(await fs.readFile(path.join(destination,'resources/app',relative)));assert.equal(actual,expected,relative);resourceHashes[relative]=actual;}
 const exeHash=hash(await fs.readFile(exe));assert.equal(exeHash,hash(await fs.readFile(path.join(sourceRuntime,'Sprout Studio.exe'))));
 report.runtimes.push({exe,exeHash,resourceHashes,linked});return exe;
}
async function port(){const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const value=listener.address().port;await new Promise(r=>listener.close(r));return value;}
async function gui(exe){
 const debugPort=await port(),env=isolatedEnv(exe);const task=start(exe,[`--remote-debugging-port=${debugPort}`],env,'normal-gui');desktops.add(task);task.child.stdin.end();
 await until(async()=>{const session=await ownSession();return session?.pid===task.child.pid;});
 const browser=await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);browsers.add(browser);await until(()=>browser.contexts()[0]?.pages().length===1);return {task,browser};
}
async function closeGui(instance){
 for(const page of [...instance.browser.contexts()[0].pages()])await page.close();await until(()=>instance.task.child.exitCode!==null);assert.equal((await instance.task.result).code,0);await instance.browser.close();browsers.delete(instance.browser);desktops.delete(instance.task);await waitClean();
}
async function publicState(page){return page.evaluate(async()=>{const token=document.querySelector('meta[name="studio-token"]').content;const r=await fetch('/api/bootstrap',{headers:{'X-Studio-Token':token}});const body=await r.json();return {settings:body.settings,projects:body.projects.map(p=>({id:p.id,title:p.title,revision:p.revision,ready:p.ready})),initialError:body.initialError};});}
async function checkPage(page,ids,label){
 await page.locator('textarea').waitFor();const state=await publicState(page);assert.equal(state.initialError,'');assert.equal(state.settings.hasKey,true);assert.equal(state.settings.keyStorage.mode,'encrypted');assert.equal(state.settings.keyStorage.persisted,true);assert.equal(state.settings.model,'native-upgrade-fixture');assert(!JSON.stringify(state).includes(key));
 for(const id of ids)assert(state.projects.some(p=>p.id===id&&p.ready&&p.revision===1));
 await page.locator('.settings-link').click();assert.equal(await page.locator('input[type=password]').inputValue(),'');await page.locator('.modal-close').click();
 for(const title of ['跨目录轨迹项目一','跨目录轨迹项目二']){await page.locator('.project-item').filter({hasText:title}).click();await until(async()=>{try{return await page.frameLocator('iframe').locator('#fixture-title').textContent()===title;}catch{return false;}});}
 await page.frameLocator('iframe').locator('#fixture-button').click();assert.equal(await page.frameLocator('iframe').locator('#fixture-count').textContent(),'1');
 await page.screenshot({path:path.join(artifacts,label+'.png'),fullPage:true});return state;
}

try{
 assert.equal(process.platform,'win32');assert.equal(manifest.baseCommit,expectedProduct);assert.equal(await fs.realpath(root),root);
 const exeA=await runtime('runtime-A'),exeB=await runtime('runtime-B');assert.notEqual(exeA,exeB);assert.equal(report.runtimes[0].exeHash,report.runtimes[1].exeHash);assert.deepEqual(report.runtimes[0].resourceHashes,report.runtimes[1].resourceHashes);passed('different exe paths, identical fixed product resources and executable hashes');
 const {Store}=await import(pathToFileURL(path.join(sourceRuntime,'resources/app/server/store.mjs')).href);const store=new Store(workspace);await store.init();const ids=[];
 for(const title of ['跨目录轨迹项目一','跨目录轨迹项目二']){
  const p=await store.create(title,false),draft=await store.draft(p.id);await fs.mkdir(path.join(draft,'dist/h5'),{recursive:true});await fs.mkdir(path.join(draft,'dist/weapp'),{recursive:true});
  await fs.writeFile(path.join(draft,'dist/h5/index.html'),`<html><head></head><body><h1 id="fixture-title">${title}</h1><button id="fixture-button" onclick="document.querySelector('#fixture-count').textContent=String(Number(document.querySelector('#fixture-count').textContent)+1)">计数</button><p id="fixture-count">0</p></body></html>`);await fs.writeFile(path.join(draft,'dist/weapp/app.js'),'// fixture only, not compiled');await store.commit(p,draft,'ready native test fixture');await fs.rm(draft,{recursive:true,force:true});ids.push(p.id);
 }
 report.projectIds=ids;
 const configured=await cli(exeA,['config','save'],{allowStart:true,input:JSON.stringify({provider:'custom',baseUrl:'https://example.test/v1',model:'native-upgrade-fixture',apiKey:key})});assert.equal(configured.hasKey,true);assert.equal(configured.keyStorage.persisted,true);assert.equal(configured.keyStorage.mode,'encrypted');await waitClean();
 const ownVault=await fs.readFile(path.join(profile,'model-credentials-v1.bin'));assert(!ownVault.includes(Buffer.from(key)));passed('one stdin save using packaged Electron DPAPI; native exit cleaned discovery/leases');
 const a=await gui(exeA);const second=start(exeA,[],isolatedEnv(exeA),'second-window');second.child.stdin.end();await until(()=>second.child.exitCode!==null);assert.equal((await second.result).code,0);await until(()=>a.browser.contexts()[0].pages().length===2);
 const pagesA=a.browser.contexts()[0].pages();for(let i=0;i<pagesA.length;i++)await checkPage(pagesA[i],ids,'A-window-'+(i+1));
 const publicA=await cli(exeA,['config','status'],{attachPid:a.task.child.pid});assert.equal(publicA.hasKey,true);assert.equal(publicA.keyStorage.persisted,true);const listA=await cli(exeA,['projects','list'],{attachPid:a.task.child.pid});assert.deepEqual(listA.map(p=>p.id).sort(),[...ids].sort());passed('normal path A two GUI windows plus packaged CLI share profile/projects; no password refill',{pid:a.task.child.pid});await closeGui(a);
 const b=await gui(exeB);await checkPage(b.browser.contexts()[0].pages()[0],ids,'B-window');const publicB=await cli(exeB,['config','status'],{attachPid:b.task.child.pid});assert.equal(publicB.hasKey,true);assert.equal(publicB.keyStorage.persisted,true);assert.equal(publicB.model,publicA.model);const listB=await cli(exeB,['projects','list'],{attachPid:b.task.child.pid});assert.deepEqual(listB.map(p=>p.id).sort(),[...ids].sort());assert.equal(saves,1);passed('normal path B reopens same projects/key without save; packaged CLI attaches to B PID',{pid:b.task.child.pid});await closeGui(b);
 const emptyProfile=path.join(root,'empty-profile'),emptyWork=path.join(emptyProfile,'workspace');const empty=await cli(exeB,['config','status'],{userData:emptyProfile,work:emptyWork,allowStart:true});assert.equal(empty.hasKey,false);await waitClean(emptyProfile);passed('explicit different profile has no key; no native seed/compiler');
 report.passed=true;
}catch(error){report.passed=false;report.error=String(error.stack).split(key).join('[placeholder]');}
finally{
 // Only processes/browser connections launched by this script are closed.
 for(const browser of browsers){for(const page of browser.contexts()[0]?.pages()||[])await page.close().catch(()=>{});await browser.close().catch(()=>{});}
 for(const task of desktops)if(task.child.exitCode===null){try{await until(()=>task.child.exitCode!==null,5000);}catch{task.child.kill();}}
 for(const child of children)if(child.exitCode===null)child.kill();
 const relative=path.relative(path.resolve(os.tmpdir()),root);assert(relative.startsWith('sprout-qa-native-upgrade-')&&!relative.includes('..')&&!path.isAbsolute(relative));
 try{await fs.rm(root,{recursive:true,force:true});report.temporaryRootRemoved=true;}catch(error){report.temporaryRootRemoved=false;report.cleanupError=error.code;report.passed=false;}
 await fs.writeFile(path.join(artifacts,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,report:path.join(artifacts,'report.json'),error:report.error}));
}
if(!report.passed)process.exitCode=1;
