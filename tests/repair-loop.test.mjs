import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {Store,readSources} from '../server/store.mjs';
import {runAgent} from '../server/agent.mjs';
import {createTask,recoverTasks,LIMITS,digestSources} from '../server/harness.mjs';
import {verificationRequirements,validateVerificationPlan,validateVerificationEvidence,verifyPreview} from '../server/verify.mjs';
const build=async d=>{await fs.mkdir(path.join(d,'dist/h5'),{recursive:true});await fs.writeFile(path.join(d,'dist/h5/index.html'),'<html><head></head></html>');};
const write=color=>({name:'write_file',args:{path:'src/pages/index/index.css',content:`page{color:${color}}`}});
const compile={name:'build_preview',args:{}};
const check={name:'verify_preview',args:{steps:[{action:'text',selector:'.result',value:'正确业务结果'}]}};
async function fixture(actions,options={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-repair-')),store=new Store(root);await store.init();const project=await store.create(options.title||'业务应用');
 const original=await store.draft(project.id);await build(original);await store.commit(project,original,'旧可用版');await fs.rm(original,{recursive:true,force:true});
 let requests=0;const payloads=[],events=[];
 const model=http.createServer(async(req,res)=>{let raw='';for await(const c of req)raw+=c;payloads.push(JSON.parse(raw));const action=actions[requests++];res.writeHead(200,{'Content-Type':'text/event-stream'});const send=(delta,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'repair',choices:[{index:0,delta,finish_reason}]})+'\n\n');send({role:'assistant'});if(action){send({tool_calls:[{index:0,id:'call-'+requests,type:'function',function:{name:action.name,arguments:JSON.stringify(action.args)}}]});send({},'tool_calls');}else{send({content:'全部完成，已经扫码成功！'});send({},'stop');}res.end('data: [DONE]\n\n');});await new Promise(r=>model.listen(0,'127.0.0.1',r));
 const task=await createTask(store,project,options.prompt||'修改业务');
 let executions=0;const controller=new AbortController();
 try{const result=await runAgent({store,project,task,prompt:options.prompt||'修改业务',config:{baseUrl:`http://127.0.0.1:${model.address().port}/v1`,model:'fixture',apiKey:'fixture-only'},signal:controller.signal,emit:e=>{events.push(e);if(options.stopOnRepair&&e.text?.startsWith('当前制作尚未'))controller.abort(new Error('user-stop'));},build,verify:async(d,steps)=>{executions++;return options.verify?options.verify(d,steps,executions):{state:'passed',steps,kind:'fixture'};}});return {result,task,requests,payloads,events,executions,store};}
 catch(error){return {error,task,requests,payloads,events,executions,store,project};}
 finally{model.closeAllConnections();await new Promise(r=>model.close(r));}
}
test('host resumes the same PI session after a failed check and premature done; shared budgets bind delivered sources',async()=>{
 const f=await fixture([write('red'),compile,check,null,write('green'),compile,check,null],{verify:async(_d,steps,n)=>({state:n===1?'failed':'passed',error:n===1?'计算结果错误':undefined,steps,kind:'fixture'})});
 assert.ifError(f.error);assert.equal(f.result.revision,2);assert.equal(f.task.repairPrompts,1);assert.equal(f.task.buildAttempts,2);assert.equal(f.task.verifyAttempts,2);assert.equal(f.task.toolCalls,6);
 assert.equal(f.result.verification.sourceDigest,digestSources(f.result.versions.at(-1).files));
 assert.match(JSON.stringify(f.payloads[4].messages),/计算结果错误/);assert.equal((await fs.readdir(path.join(f.store.dir(f.result.id),'sessions'))).length,1);
 assert.ok(f.events.filter(e=>e.type==='text').every(e=>!e.text.includes('已经扫码成功')));
});
test('build-only false success exhausts bounded follow-ups and preserves immutable usable version',async()=>{
 const f=await fixture([write('red'),compile]);assert.equal(f.error.code,'repair-budget-exhausted');assert.equal(f.task.repairPrompts,3);assert.equal(f.requests,6);assert.equal((await f.store.get(f.project.id)).revision,1);assert.equal(f.events.filter(e=>e.type==='text').length,0);
 assert.equal(f.task.verifyAttempts,0);assert.equal(f.task.buildAttempts,1);
});
test('explicit creation with no writes and no checks cannot be treated as discussion or completed delivery',async()=>{
 const f=await fixture([],{prompt:'做一个输入文字就能生成二维码的小程序'});assert.equal(f.error.code,'repair-budget-exhausted');assert.equal(f.requests,4);assert.equal(f.task.repairPrompts,3);assert.equal(f.task.toolCalls,0);assert.equal((await f.store.get(f.project.id)).revision,1);assert.equal(f.events.filter(e=>e.type==='text').length,0);
 const persisted=(await f.store.get(f.project.id)).tasks.at(-1);assert.equal(persisted.repairPrompts,3);
});
test('checking the original page without any requested source change cannot claim a new creation',async()=>{
 const f=await fixture([compile,check],{prompt:'制作一个计算器'});assert.equal(f.error.code,'repair-budget-exhausted');assert.equal(f.task.toolCalls,2);assert.equal(f.task.verifyAttempts,1);assert.equal((await f.store.get(f.project.id)).revision,1);assert.equal(f.events.filter(e=>e.type==='text').length,0);
});
test('editing after passed check requires a fresh current-source check, never pending publication',async()=>{
 const f=await fixture([write('red'),compile,check,write('blue'),null,check]);assert.ifError(f.error);assert.equal(f.result.verification.state,'passed');assert.equal(f.task.buildAttempts,2);assert.equal(f.task.verifyAttempts,2);assert.equal(f.task.repairPrompts,1);assert.match(f.result.versions.at(-1).files['src/pages/index/index.css'],/blue/);
});
test('explicit stop during host follow-up cannot publish or continue',async()=>{
 const f=await fixture([write('red'),compile],{stopOnRepair:true});assert.match(f.error.message,/user-stop/);assert.equal(f.requests,3);assert.equal((await f.store.get(f.project.id)).revision,1);
});
test('41st tool is blocked before write side effect and before completion',async()=>{
 const f=await fixture([...Array.from({length:40},()=>({name:'list_files',args:{}})),write('red')]);assert.equal(f.error.code,'tool-budget-exhausted');assert.equal(f.task.toolCalls,40);assert.equal((await f.store.get(f.project.id)).revision,1);assert.equal(f.requests,41);
});
test('resume inherits all budgets and conservative hard-restart elapsed time; exhausted task cannot resume',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-budget-recovery-')),store=new Store(root);await store.init();const p=await store.create('恢复');const first=await createTask(store,p,'修改');Object.assign(first,{state:'stopped',toolCalls:12,buildAttempts:1,verifyAttempts:1,repairPrompts:1,budgetUsedMs:1200});const resumed=await createTask(store,p,'修改',first);assert.deepEqual(['toolCalls','buildAttempts','verifyAttempts','repairPrompts','budgetUsedMs'].map(k=>resumed[k]),[12,1,1,1,1200]);resumed.budgetCheckpointAt=Date.now()-LIMITS.milliseconds;await store.save(p);await recoverTasks(store);const interrupted=(await store.get(p.id)).tasks.at(-1);assert.equal(interrupted.resumable,false);assert.equal(interrupted.budgetUsedMs,LIMITS.milliseconds);await assert.rejects(createTask(store,p,'修改',interrupted),/不能重置预算/);
});
test('hard kill inside actual verify retains reserved tool, build, verify and elapsed budgets',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-kill-budget-'));let requests=0;
 const actions=[write('red'),compile,check];const model=http.createServer(async(req,res)=>{for await(const c of req){}const action=actions[requests++];res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({id:'kill',choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id:'call-'+requests,type:'function',function:{name:action.name,arguments:JSON.stringify(action.args)}}]},finish_reason:'tool_calls'}]})+'\n\ndata: [DONE]\n\n');});await new Promise(r=>model.listen(0,'127.0.0.1',r));
 const script=`import fs from 'node:fs/promises';import path from 'node:path';import {Store} from ${JSON.stringify(new URL('../server/store.mjs',import.meta.url).href)};import {createTask} from ${JSON.stringify(new URL('../server/harness.mjs',import.meta.url).href)};import {runAgent} from ${JSON.stringify(new URL('../server/agent.mjs',import.meta.url).href)};const store=new Store(${JSON.stringify(root)});await store.init();const project=await store.create('硬杀预算'),task=await createTask(store,project,'修改业务');await runAgent({store,project,task,prompt:'修改业务',config:{baseUrl:'http://127.0.0.1:${model.address().port}/v1',model:'fixture',apiKey:'fixture-only'},signal:new AbortController().signal,emit:()=>{},build:async d=>{await fs.mkdir(path.join(d,'dist/h5'),{recursive:true});await fs.writeFile(path.join(d,'dist/h5/index.html'),'<html></html>');},verify:async()=>{console.log('VERIFY_READY');await new Promise(()=>{});}});`;
 const child=spawn(process.execPath,['--input-type=module','-e',script],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',c=>stderr+=c);
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('child ready timeout '+stderr)),30000);let raw='';child.stdout.on('data',c=>{raw+=c;if(raw.includes('VERIFY_READY')){clearTimeout(timer);resolve();}});child.once('exit',code=>{clearTimeout(timer);reject(new Error('child exited '+code+' '+stderr));});});
  const store=new Store(root),before=(await store.list())[0];const task=before.tasks.at(-1);assert.equal(task.toolCalls,3);assert.equal(task.buildAttempts,1);assert.equal(task.verifyAttempts,1);assert.ok(task.budgetUsedMs>0);assert.ok(task.budgetCheckpointAt);
  await new Promise(r=>{child.once('exit',r);child.kill('SIGKILL');});await recoverTasks(store);const after=await store.get(before.id),interrupted=after.tasks.at(-1);assert.equal(interrupted.state,'interrupted');assert.ok(interrupted.budgetUsedMs>=task.budgetUsedMs);const resumed=await createTask(store,after,'修改业务',interrupted);assert.equal(resumed.toolCalls,3);assert.equal(resumed.buildAttempts,1);assert.equal(resumed.verifyAttempts,1);assert.equal(resumed.budgetUsedMs,interrupted.budgetUsedMs);
 }finally{if(child.exitCode===null)child.kill('SIGKILL');model.closeAllConnections();await new Promise(r=>model.close(r));}
});
const short='一二三',long='长文字二维码验收'.repeat(20);
const qrPlan=()=>[{action:'fill',selector:'input',value:short},{action:'click',selector:'button'},{action:'qr',selector:'#qr',value:short},{action:'fill',selector:'input',value:long},{action:'click',selector:'button'},{action:'qr',selector:'#qr',value:long},{action:'fill',selector:'input',value:''},{action:'click',selector:'button'},{action:'count',selector:'#qr',value:0}];
test('QR delivery retains requirement across style changes, rejects structure-only/static/missing-scenario checks and fake empty selectors',()=>{
 const project={title:'文字二维码小程序',memory:{goal:'输入文字生成二维码',changes:[]}};
 for(const prompt of ['改成蓝色','改为黄色','换成绿色','添加最近三条历史'])assert.equal(verificationRequirements(project,prompt).profile,'text-qr');
 assert.equal(verificationRequirements(project,'不再做二维码').profile,'general');
 assert.equal(verificationRequirements({...project,memory:{...project.memory,changes:[{text:'不再做二维码'}]}},'改成蓝色').profile,'general');
 assert.equal(verificationRequirements(project,'取消二维码历史记录').profile,'text-qr');
 assert.equal(verificationRequirements({title:'知识笔记',memory:{goal:'解释二维码原理',changes:[]}},'二维码是什么？').profile,'general');
 validateVerificationPlan(qrPlan(),{profile:'text-qr'});
 for(const plan of [[{action:'count',selector:'.cell',value:441}],[{action:'qr',selector:'#qr',value:short}],qrPlan().slice(0,6),qrPlan().map((s,i)=>i===8?{...s,selector:'.does-not-exist'}:s)])assert.throws(()=>validateVerificationPlan(plan,{profile:'text-qr'}));
 assert.throws(()=>validateVerificationEvidence({state:'passed',qrChecks:[]},qrPlan(),{profile:'text-qr'}),/截图解码证据/);
});
test('real browser does not accept a decorative grid as a decodable QR, even if structure counts pass',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-fake-qr-'));await fs.mkdir(path.join(root,'dist/h5'),{recursive:true});await fs.writeFile(path.join(root,'dist/h5/index.html'),'<html><head></head><body><div id="qr" style="width:200px;height:200px;background:black"></div></body></html>');const result=await verifyPreview(root,[{action:'qr',selector:'#qr',value:short}]);assert.equal(result.state,'failed');assert.match(result.error,/无法解码/);
});
