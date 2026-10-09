import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {APP_ROOT,Store} from '../server/store.mjs';
import {startStudio} from '../server/index.mjs';
import {createTask} from '../server/harness.mjs';
async function fresh(){const root=await fs.mkdtemp(path.join(APP_ROOT,'.test-data-preview-'));await new Store(root).init();return root;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(fn){for(let i=0;i<100;i++){const result=await fn();if(result)return result;await pause(50);}throw new Error('condition timed out');}
async function artifact(dir){await fs.mkdir(path.join(dir,'dist/h5'),{recursive:true});await fs.writeFile(path.join(dir,'dist/h5/index.html'),'<html><head></head><body>actual artifact</body></html>');}
function client(studio){const headers={'X-Studio-Token':studio.token,'Content-Type':'application/json'};return async(url,body)=>{const response=await fetch(studio.url+'/api'+url,{headers,...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});assert.equal(response.status,200,await response.clone().text());return response.json();};}
test('first bootstrap and create return metadata while actual preview build is blocked',async()=>{
  let release;const gate=new Promise(r=>{release=r;});const studio=await startStudio({root:await fresh(),port:0,production:true,build:async(dir,{signal})=>{await gate;signal.throwIfAborted();await artifact(dir);}});
  try{const call=client(studio),start=Date.now();const data=await call('/bootstrap');assert.ok(Date.now()-start<2000);assert.equal(data.projects.length,1);assert.equal(data.projects[0].ready,false);
    const p=await call('/projects',{title:'立即输入'});assert.equal(p.revision,0);assert.equal(p.ready,false);assert.ok(Date.now()-start<2000);
    assert.equal((await fetch(studio.previewOrigin+`/p/${p.id}/r/0/index.html`)).status,404);
    const saved=await fetch(studio.url+`/api/projects/${p.id}/memory`,{method:'PUT',headers:{'X-Studio-Token':studio.token,'Content-Type':'application/json'},body:JSON.stringify({goal:'构建时修改的需求',constraints:'不能丢失',changes:[]})});assert.equal(saved.status,200);
    release();await studio.ready;await waitFor(async()=>(await studio.store.get(p.id)).ready);const ready=await call('/projects/'+p.id);assert.equal(ready.initialization.state,'ready');assert.equal(ready.memory.goal,'构建时修改的需求');assert.equal((await fetch(studio.previewOrigin+`/p/${p.id}/r/${ready.revision}/index.html`)).status,200);
  }finally{release();await studio.close();}
});
test('starting production cancels and drains initialization before agent starts; late draft cannot overwrite',async()=>{
  let preparing=false,aborted=false,agentStarted=false;const studio=await startStudio({root:await fresh(),port:0,seed:false,production:true,build:async(dir,{signal})=>{preparing=true;await new Promise(resolve=>signal.addEventListener('abort',async()=>{await pause(60);aborted=true;resolve();},{once:true}));await artifact(dir);},agent:async({store,project})=>{assert.equal(aborted,true);agentStarted=true;const draft=await store.draft(project.id);await artifact(draft);await store.commit(project,draft,'用户制作');return project;}});
  try{const call=client(studio),p=await call('/projects',{title:'并发准备'});await waitFor(()=>preparing);await call('/settings',{baseUrl:'http://localhost',model:'fixture',apiKey:'fixture-only'});const response=await fetch(studio.url+`/api/projects/${p.id}/run`,{method:'POST',headers:{'X-Studio-Token':studio.token,'Content-Type':'application/json'},body:JSON.stringify({prompt:'开始制作'})});assert.equal(response.status,200);await response.text();assert.equal(agentStarted,true);const final=await studio.store.get(p.id);assert.equal(final.revision,1);assert.equal(final.versions[0].label,'用户制作');assert.equal(final.initialization.state,'ready');assert.equal((await fs.readdir(path.join(studio.store.dir(p.id),'drafts'))).length,1);
  }finally{await studio.close();}
});
test('close drains preparation and prevents publication, restart retries same project',async()=>{
  const root=await fresh();let preparing=false,finished=false;
  const studio=await startStudio({root,port:0,production:true,build:async(dir,{signal})=>{preparing=true;await new Promise(resolve=>signal.addEventListener('abort',async()=>{await pause(60);finished=true;resolve();},{once:true}));await artifact(dir);}});
  const data=await client(studio)('/bootstrap');const id=data.projects[0].id;await waitFor(()=>preparing);await studio.close();assert.equal(finished,true);let p=await studio.store.get(id);assert.equal(p.ready,false);assert.equal(p.revision,0);assert.equal(p.initialization.state,'interrupted');assert.equal((await fs.readdir(path.join(studio.store.dir(id),'drafts'))).length,0);
  const restarted=await startStudio({root,port:0,production:true,build:artifact});try{await restarted.ready;p=await restarted.store.get(id);assert.equal(p.ready,true);assert.equal(p.revision,1);assert.equal((await restarted.store.list()).length,1);}finally{await restarted.close();}
});
test('failed background preparation remains honestly unavailable',async()=>{
  const studio=await startStudio({root:await fresh(),port:0,production:true,build:async()=>{throw new Error('fixture compiler failure');}});try{await studio.ready;const [p]=await studio.store.list();assert.equal(p.ready,false);assert.equal(p.initialization.state,'failed');assert.match(p.initialization.error,/fixture compiler failure/);assert.equal(p.revision,0);assert.equal(p.versions.length,0);}finally{await studio.close();}
});
test('close during project metadata creation cannot register a late preparation',async()=>{
  let entered=false,release,builds=0;const gate=new Promise(r=>{release=r;});const studio=await startStudio({root:await fresh(),port:0,seed:false,production:true,build:async()=>{builds++;}});
  const original=studio.store.create.bind(studio.store);studio.store.create=async(...args)=>{entered=true;await gate;return original(...args);};
  const request=fetch(studio.url+'/api/projects',{method:'POST',headers:{'X-Studio-Token':studio.token,'Content-Type':'application/json'},body:JSON.stringify({title:'关闭竞态'})});await waitFor(()=>entered);const closing=studio.close();release();const response=await request;assert.equal(response.status,400);await response.text();await closing;assert.equal(builds,0);const [p]=await studio.store.list();assert.equal(p.ready,false);assert.equal(p.initialization.state,'interrupted');
});
test('close before initial publication keeps revision zero and cleans draft',async()=>{
  let entered=false,release;const gate=new Promise(r=>{release=r;});const studio=await startStudio({root:await fresh(),port:0,seed:false,production:true,build:artifact});
  const original=studio.store.commit.bind(studio.store);studio.store.commit=async(...args)=>{entered=true;await gate;return original(...args);};
  const p=await client(studio)('/projects',{title:'提交前退出'});await waitFor(()=>entered);const closing=studio.close();release();await closing;const final=await studio.store.get(p.id);assert.equal(final.ready,false);assert.equal(final.revision,0);assert.equal(final.versions.length,0);assert.equal(final.initialization.state,'interrupted');assert.equal((await fs.readdir(path.join(studio.store.dir(p.id),'drafts'))).length,0);
});
test('background failure merges status after an already accepted memory save',async()=>{
  let failBuild,buildEntered=false,memoryEntered=false,releaseMemory;const buildGate=new Promise(r=>{failBuild=r;}),memoryGate=new Promise(r=>{releaseMemory=r;});
  const studio=await startStudio({root:await fresh(),port:0,seed:false,production:true,build:async()=>{buildEntered=true;await buildGate;throw new Error('controlled failure');}});
  try{const p=await client(studio)('/projects',{title:'失败时需求编辑'});await waitFor(()=>buildEntered);const original=studio.store.save.bind(studio.store);studio.store.save=async project=>{if(project.memory.goal==='已接受的最新需求'&&!memoryEntered){memoryEntered=true;await memoryGate;}return original(project);};
    const request=fetch(studio.url+`/api/projects/${p.id}/memory`,{method:'PUT',headers:{'X-Studio-Token':studio.token,'Content-Type':'application/json'},body:JSON.stringify({goal:'已接受的最新需求',constraints:'不可丢失',changes:[]})});await waitFor(()=>memoryEntered);failBuild();await pause(60);releaseMemory();assert.equal((await request).status,200);await waitFor(async()=>(await studio.store.get(p.id)).initialization?.state==='failed');const final=await studio.store.get(p.id);assert.equal(final.memory.goal,'已接受的最新需求');assert.equal(final.memory.constraints,'不可丢失');assert.equal(final.ready,false);
  }finally{failBuild();releaseMemory();await studio.close();}
});
test('restart never publishes a blank initial revision over an interrupted first model task',async()=>{
  const root=await fresh(),store=new Store(root),p=await store.create('首轮任务恢复');p.initialization={state:'interrupted'};await createTask(store,p,'继续制作');let builds=0;
  const studio=await startStudio({root,port:0,production:true,build:async()=>{builds++;}});try{await studio.ready;const final=await studio.store.get(p.id);assert.equal(builds,0);assert.equal(final.revision,0);assert.equal(final.ready,false);assert.equal(final.tasks.at(-1).state,'interrupted');assert.equal(final.tasks.at(-1).baseRevision,0);}finally{await studio.close();}
});
