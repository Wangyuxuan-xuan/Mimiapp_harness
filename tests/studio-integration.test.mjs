import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {APP_ROOT} from '../server/store.mjs';
import {startStudio} from '../server/index.mjs';
import {waitProjectReady} from './project-fixture.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check){for(let n=0;n<150;n++){if(await check())return;await pause(20);}throw new Error('integration gate timed out');}
async function artifact(dir){await fs.mkdir(path.join(dir,'dist/h5'),{recursive:true});await fs.writeFile(path.join(dir,'dist/h5/index.html'),'<html><head></head><body><p id="ok">ready fixture</p></body></html>');}
async function start(build=artifact){const root=await fs.mkdtemp(path.join(APP_ROOT,'.test-data-integration-'));return startStudio({root,port:0,seed:false,production:true,build});}
const post=(studio,route,body={})=>fetch(studio.url+'/api'+route,{method:'POST',headers:{'X-Studio-Token':studio.token,'Content-Type':'application/json'},body:JSON.stringify(body)});

test('verify while initial preview is preparing reports unavailable without aborting background preparation',{timeout:15000},async()=>{
 let release,entered=false,aborted=false;const gate=new Promise(r=>{release=r;});const studio=await start(async(dir,{signal})=>{entered=true;signal.addEventListener('abort',()=>{aborted=true;},{once:true});await gate;await artifact(dir);});
 try{const p=await(await post(studio,'/projects',{title:'异步准备'})).json();await until(()=>entered);const response=await post(studio,`/projects/${p.id}/verify`,{steps:[{action:'text',selector:'#ok',value:'ready fixture'}]});assert.equal(response.status,400);assert.equal(aborted,false);release();await waitProjectReady(studio,p);assert.equal(p.ready,true);}finally{release();await studio.close();}
});

test('restore success waits for draft cleanup; immediately following verification does not race the operation lock',{timeout:30000},async()=>{
 const studio=await start();let release,entered=false,responded=false;const gate=new Promise(r=>{release=r;});const originalRm=fs.rm;
 try{const p=await(await post(studio,'/projects',{title:'恢复后立即验证'})).json();await waitProjectReady(studio,p);const drafts=path.join(studio.store.dir(p.id),'drafts');await until(async()=>(await fs.readdir(drafts)).length===0);
  fs.rm=async(target,options)=>{if(!entered&&path.dirname(String(target))===drafts){entered=true;await gate;}return originalRm(target,options);};
  const restoring=post(studio,`/projects/${p.id}/restore`,{versionId:p.versions[0].id}).then(r=>{responded=true;return r;});await until(()=>entered);await pause(30);assert.equal(responded,false,'success must not be sent while cleanup still owns the project operation');release();const response=await restoring;assert.equal(response.status,200);assert.equal((await response.json()).revision,2);
  const verified=await post(studio,`/projects/${p.id}/verify`,{steps:[{action:'text',selector:'#ok',value:'ready fixture'}]});assert.equal(verified.status,200);const current=await verified.json();assert.equal(current.revision,2);assert.equal(current.verification.state,'passed');assert.equal(current.verification.revision,2);
 }finally{release();fs.rm=originalRm;await studio.close();}
});
