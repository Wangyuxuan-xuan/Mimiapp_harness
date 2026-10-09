import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import {sourceDigest} from '../../server/harness.mjs';
import {createCliFixture,until} from './cli-fixture.mjs';

// This timeout protects the test process only; it is not a production task limit.
test('actual CLI journey: safe stdin, success, continuous legacy recovery, close/progress, conflict and incomplete stream',{timeout:30000},async()=>{
 let mode='success',release,entered=0,inherited,fault;
 const fixture=await createCliFixture(async a=>{
  entered++;a.emit({type:'status',text:'independent fixture runner'});
  if(mode==='recorded-failure'){Object.assign(a.task,{toolCalls:7,buildAttempts:1,verifyAttempts:1,repairPrompts:1,budgetUsedMs:1234});throw new Error('fixture failure '+fixture.key);}
  if(mode==='hold'){await new Promise((resolve,reject)=>{release=resolve;a.signal.addEventListener('abort',()=>reject(a.signal.reason),{once:true});});throw new Error('fixture released failure');}
  if(mode==='resume'){inherited=Object.fromEntries(['toolCalls','buildAttempts','verifyAttempts','repairPrompts','budgetUsedMs','attempts','resumedFrom'].map(k=>[k,a.task[k]]));return a.project;}
  const draft=await a.store.draft(a.project.id);
  try{await fs.appendFile(path.join(draft,'src/app.css'),'\n/* independent CLI fixture modification */');await fixture.build(draft);a.project.verification={state:'passed',kind:'fixture-only'};await a.beforeCommit();await a.store.commit(a.project,draft,'fixture success',{signal:a.signal,beforePublish:a.onPublish});return a.project;}
  finally{await fs.rm(draft,{recursive:true,force:true});}
 });
 try{
  const {command,studio}=fixture;
  const publicConfig=(await command(['config','save'],{input:JSON.stringify({provider:'custom',baseUrl:'https://example.test',model:'fixture',apiKey:fixture.key})}))[0];assert.equal(publicConfig.hasKey,true);assert.equal(fixture.saved.apiKey,fixture.key);
  let p=await studio.store.create('Independent CLI journey',false),draft=await studio.store.draft(p.id);await fixture.build(draft);await studio.store.commit(p,draft,'fixture baseline');await fs.rm(draft,{recursive:true,force:true});const initial=p.revision;
  let events=await command(['run',p.id],{input:'明确制作测试页面'});assert.equal(events.at(-1).type,'done');assert.equal(events.at(-1).project.revision,initial+1);assert.equal(events.at(-1).project.tasks.at(-1).state,'completed');
  p=await studio.store.get(p.id);p.runtimeErrors.push({revision:p.revision,message:'fixture runtime error',time:Date.now()});await studio.store.save(p);
  events=await command(['repair',p.id]);assert.equal(events.at(-1).type,'done');assert.equal(events.at(-1).project.revision,initial+2);const completedId=events.at(-1).project.tasks.at(-1).id;
  mode='recorded-failure';events=await command(['run',p.id],{input:'模拟工具失败并保留使用记录',expected:1});assert.equal(events.at(-1).type,'error');assert(events.at(-1).text.includes('[密钥已隐藏]'));
  p=await studio.store.get(p.id);const previous=p.tasks.at(-1);mode='resume';await command(['resume',p.id,previous.id]);
  assert.equal(inherited.toolCalls,7);assert.equal(inherited.buildAttempts,1);assert.equal(inherited.verifyAttempts,1);assert.equal(inherited.repairPrompts,1);assert(inherited.budgetUsedMs>=1234);assert.equal(inherited.attempts,previous.attempts+1);assert.equal(inherited.resumedFrom,previous.id);
  // Serialized historical fixtures exercise real CLI/server compatibility. These
  // counters are not measurements of PI calls or fabricated task.usage evidence.
  for(const reason of ['tool-budget-exhausted','timeout']){
   p=await studio.store.get(p.id);const legacy={...structuredClone(previous),id:randomUUID(),state:reason==='timeout'?'interrupted':'failed',reason,resumable:false,attempts:4,toolCalls:41,buildAttempts:4,verifyAttempts:4,repairPrompts:4,budgetUsedMs:600001,baseRevision:p.revision,sourceDigest:await sourceDigest(studio.store,p)};
   p.tasks.push(legacy);await studio.store.save(p);const beforeRevision=p.revision;
   const projected=(await command(['progress',p.id]))[0].tasks.find(task=>task.id===legacy.id);assert.equal(projected.resumable,true);assert.equal(projected.reason,reason);
   const before=entered;events=await command(['resume',p.id,legacy.id]);assert.equal(events.at(-1).type,'done');assert.equal(entered,before+1);
   for(const field of ['toolCalls','buildAttempts','verifyAttempts','repairPrompts'])assert.equal(inherited[field],legacy[field]);assert(inherited.budgetUsedMs>=legacy.budgetUsedMs);assert.equal(inherited.attempts,legacy.attempts+1);assert.equal(inherited.resumedFrom,legacy.id);
   const after=await studio.store.get(p.id),original=after.tasks.find(task=>task.id===legacy.id);assert.equal(after.revision,beforeRevision);assert.equal(original.reason,reason);for(const field of ['toolCalls','buildAttempts','verifyAttempts','repairPrompts','budgetUsedMs'])assert.equal(original[field],legacy[field]);
  }
  const beforeCompleted=entered;await command(['resume',p.id,completedId],{expected:1});assert.equal(entered,beforeCompleted);
  for(const mismatch of ['sourceDigest','baseRevision']){
   p=await studio.store.get(p.id);const incompatible={...structuredClone(previous),id:randomUUID(),state:'failed',reason:'tool-budget-exhausted',resumable:false,baseRevision:p.revision,sourceDigest:await sourceDigest(studio.store,p)};
   if(mismatch==='sourceDigest')incompatible.sourceDigest='0'.repeat(64);else incompatible.baseRevision=p.revision-1;
   p.tasks.push(incompatible);await studio.store.save(p);const before=entered,beforeCount=p.tasks.length,beforeRevision=p.revision;
   await command(['resume',p.id,incompatible.id],{expected:1});assert.equal(entered,before);const after=await studio.store.get(p.id);assert.equal(after.tasks.length,beforeCount);assert.equal(after.revision,beforeRevision);assert.equal(after.tasks.find(task=>task.id===incompatible.id).reason,incompatible.reason);
  }
  mode='hold';const running=await fixture.cli(['run',p.id],{input:'client-close fixture'});await until(()=>release);running.child.kill();assert.notEqual((await running.result).code,0);assert.equal((await command(['progress',p.id]))[0].tasks.at(-1).state,'running');release();await until(async()=>(await studio.store.get(p.id)).tasks.at(-1).state==='failed');assert.equal((await command(['progress',p.id]))[0].tasks.at(-1).state,'failed');
  const conflict=await fixture.cli(['config','status'],{env:fixture.envAt(fixture.profile,path.join(fixture.root,'other-workspace'))});const rejected=await conflict.result;assert.equal(rejected.code,1);assert(rejected.stderr.includes('其他工作区'));
  const token=randomBytes(32).toString('hex'),faultProfile=path.join(fixture.root,'fault-profile'),faultWorkspace=path.join(fixture.root,'fault-workspace');
  fault=http.createServer((req,res)=>{req.resume();if(req.headers['x-studio-token']!==token){res.writeHead(403).end();return;}if(req.url==='/api/projects'){res.setHeader('Content-Type','application/json');res.end('[]');}else{res.setHeader('Content-Type','application/x-ndjson');res.end('{"type":"status","text":"fixture incomplete stream"}\n');}});
  await new Promise(r=>fault.listen(0,'127.0.0.1',r));await fixture.discover(faultProfile,faultWorkspace,`http://127.0.0.1:${fault.address().port}`,token);
  const cut=await(await fixture.cli(['run',p.id],{env:fixture.envAt(faultProfile,faultWorkspace),input:'fault stream'})).result;assert.equal(cut.code,1);assert(!cut.stdout.includes('"type":"done"'));
  // This automated tier deliberately does not claim real PI/Taro, native DPAPI,
  // a real TTY, packaged upgrade or Electron dead-lease reaper coverage.
 }finally{release?.();if(fault)await new Promise(r=>fault.close(r));await fixture.close();}
});
