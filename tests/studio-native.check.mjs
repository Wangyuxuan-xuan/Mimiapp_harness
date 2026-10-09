import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {Store} from '../server/store.mjs';
import {connectStudio} from '../cli/session.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const electron=createRequire(import.meta.url)('electron');
const placeholder='native-cli-placeholder-only';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check,timeout=20000){const deadline=Date.now()+timeout;while(Date.now()<deadline){const value=await check();if(value)return value;await delay(100);}throw new Error('fixture timeout');}
function cli(args,env,input=''){
 return new Promise((resolve,reject)=>{const p=spawn(process.execPath,[path.join(root,'cli/studio.mjs'),...args],{env,windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.on('error',reject);p.stdin.end(input);const timer=setTimeout(()=>{p.kill();reject(new Error('CLI fixture timeout'));},45000);p.on('exit',code=>{clearTimeout(timer);resolve({code,out,err});});});
}
test('native encrypted CLI restart, normal UI new windows, attached CLI and isolated profile', {skip:process.platform!=='win32',timeout:120000},async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-native-profile-')),profile=path.join(temp,'profile');
 const env={...process.env,STUDIO_USER_DATA_DIR:profile};delete env.STUDIO_URL;delete env.STUDIO_WORKSPACE_DIR;delete env.ELECTRON_RUN_AS_NODE;
 let desktop,browser;
 try{
  const saved=await cli(['config','save'],env,JSON.stringify({provider:'custom',baseUrl:'https://example.test',model:'fixture',apiKey:placeholder}));assert.equal(saved.code,0,saved.err);assert.equal(saved.out.includes(placeholder),false);assert.equal(saved.err.includes(placeholder),false);assert.equal(JSON.parse(saved.out).keyStorage.persisted,true);
  const bytes=await fs.readFile(path.join(profile,'model-credentials-v1.bin'));assert.equal(bytes.includes(Buffer.from(placeholder)),false);
  const reopened=await cli(['config','status'],env);assert.equal(reopened.code,0,reopened.err);assert.equal(JSON.parse(reopened.out).hasKey,true);assert.equal(JSON.parse(reopened.out).keyStorage.mode,'encrypted');
  const firstLease=await connectStudio({env}),secondLease=await connectStudio({env});await firstLease.close();assert.equal((await secondLease.client.publicSettings()).hasKey,true);await secondLease.close();await until(async()=>{try{await fs.access(path.join(profile,'studio-session-v1.json'));return false;}catch{return true;}});
  const isolated=await cli(['config','status'],{...env,STUDIO_USER_DATA_DIR:path.join(temp,'isolated')});assert.equal(isolated.code,0,isolated.err);assert.equal(JSON.parse(isolated.out).hasKey,false);
  // Avoid the unrelated initial demo build: one intentionally unbuilt local fixture.
  const store=new Store(path.join(profile,'workspace'));await store.init();await store.create('原生配置占位项目',false);
  const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
  desktop=spawn(electron,[root,`--remote-debugging-port=${port}`],{env,windowsHide:true,stdio:'ignore'});
  const endpoint=path.join(profile,'studio-session-v1.json');await until(async()=>{try{return JSON.parse(await fs.readFile(endpoint,'utf8')).pid===desktop.pid;}catch{return false;}});
  browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);await until(async()=>browser.contexts()[0]?.pages().length===1);
  const another=spawn(electron,[root],{env,windowsHide:true,stdio:'ignore'});await new Promise(r=>another.on('exit',r));
  await until(async()=>browser.contexts()[0].pages().length===2);
  for(const page of browser.contexts()[0].pages()){await page.waitForSelector('textarea');const hasKey=await page.evaluate(async()=>{const token=document.querySelector('meta[name="studio-token"]').content;return (await(await fetch('/api/bootstrap',{headers:{'X-Studio-Token':token}})).json()).settings.hasKey;});assert.equal(hasKey,true);}
  const attached=await cli(['config','status'],env);assert.equal(attached.code,0,attached.err);assert.equal(JSON.parse(attached.out).hasKey,true);assert.equal(JSON.parse(await fs.readFile(endpoint,'utf8')).pid,desktop.pid);
  const activeClear=await cli(['config','clear'],env);assert.equal(activeClear.code,0,activeClear.err);
  for(const page of browser.contexts()[0].pages())await page.waitForSelector('.connect-notice');
  const activeSave=await cli(['config','save'],env,JSON.stringify({provider:'custom',baseUrl:'https://example.test',model:'fixture',apiKey:placeholder}));assert.equal(activeSave.code,0,activeSave.err);
  for(const page of browser.contexts()[0].pages())await page.waitForSelector('.connect-notice',{state:'detached'});
  for(const page of [...browser.contexts()[0].pages()])await page.close();await until(async()=>desktop.exitCode!==null);
  await assert.rejects(fs.access(endpoint));
  const cleared=await cli(['config','clear'],env);assert.equal(cleared.code,0,cleared.err);assert.equal(JSON.parse(cleared.out).hasKey,false);
 }finally{await browser?.close().catch(()=>{});if(desktop?.exitCode===null)desktop.kill();await fs.rm(temp,{recursive:true,force:true});}
});
