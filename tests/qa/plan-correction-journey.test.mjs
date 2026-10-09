import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import jsQR from 'jsqr';
import {PNG} from 'pngjs';
import {createReadingFixture,progressText,bookSetup,firstCheck,secondCheck,writeReadingPage,originalPrompt,createReactiveModel,actualCandidates,actualSuggestion,createLocalModel,latestToolResult} from './plan-correction-fixture.mjs';

const repositoryRoot=await fs.realpath(fileURLToPath(new URL('../../',import.meta.url)));
const selected=process.env.STUDIO_QA_PRODUCT_ROOT;
if(selected)assert.ok(path.isAbsolute(selected),'STUDIO_QA_PRODUCT_ROOT must be absolute');
const productRoot=selected?await fs.realpath(selected):repositoryRoot;
if(selected){
  const worktreesRoot=await fs.realpath(path.join(repositoryRoot,'.worktrees'));
  const relative=path.relative(worktreesRoot,productRoot);
  assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'override must be a controlled .worktrees subdirectory');
}
const git=args=>execFileSync('git',['-C',productRoot,...args],{encoding:'utf8'}).trim();
assert.equal((await fs.realpath(git(['rev-parse','--show-toplevel']))).toLowerCase(),productRoot.toLowerCase());
const version={root:productRoot,head:git(['rev-parse','HEAD']),dirty:git(['status','--porcelain','--untracked-files=no'])};
if(process.env.STUDIO_QA_EXPECTED_PRODUCT){
  assert.match(process.env.STUDIO_QA_EXPECTED_PRODUCT,/^[0-9a-f]{40}$/);
  assert.equal(version.head,process.env.STUDIO_QA_EXPECTED_PRODUCT,'frozen product HEAD mismatch');
}
assert.equal(git(['status','--porcelain','--','server','templates','agent-skills','package.json','package-lock.json']),'','refuse active product edits');
if(selected)assert.equal(version.dirty,'','override must be a clean controlled Git worktree');
version.sourceDigests={};for(const name of ['agent','harness','verify','store'])version.sourceDigests[name]=createHash('sha256').update(await fs.readFile(path.join(productRoot,'server',name+'.mjs'))).digest('hex');
const load=name=>import(pathToFileURL(path.join(productRoot,'server',name+'.mjs')));
const [{Store},{runAgent},harness,verifier]=await Promise.all(['store','agent','harness','verify'].map(load));
const {createTask,recoverTasks,digestSources}=harness;
const {verifyPreview,verificationRequirements}=verifier;
const build=dir=>writeReadingPage(dir,{productRoot}); // Deterministic HTML fixture, explicitly not Taro.
const action=(name,args={})=>({name,args});
const write=action('write_file',{path:'src/pages/index/index.css',content:'page{color:#224466}/* QA_SINGLE_WRITE */'});
const compile=action('build_preview');
const check=action('verify_preview',{steps:secondCheck('#generate-progress')});
const config=model=>({baseUrl:model.baseUrl,model:'qa-plan-local',apiKey:'qa-plan-placeholder'});

async function freshStore(){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qa-plan-agent-'));
  const cleanup=()=>fs.rm(root,{recursive:true,force:true});
  try{const store=new Store(root);await store.init();const project=await store.create('读书进度');project.memory.goal='读书进度';await store.save(project);return {root,store,project,cleanup};}
  catch(error){await cleanup();throw error;}
}
async function unchangedProduct(){assert.equal(git(['rev-parse','HEAD']),version.head);for(const [name,digest] of Object.entries(version.sourceDigests)){const actual=createHash('sha256').update(await fs.readFile(path.join(productRoot,'server',name+'.mjs'))).digest('hex');assert.equal(actual,digest,'product changed during verification');}}
async function usageMatches(result,store,id){
  assert.equal(result.remaining,undefined);assert.equal(result.budget,undefined);assert.ok(result.usage);
  const saved=(await store.get(id)).tasks.at(-1);
  const expected={business:saved.businessVerifyAttempts,plan:saved.planCorrectionAttempts,runs:saved.verificationRuns,transient:saved.verificationTransientFailures,tools:saved.toolCalls,builds:saved.buildAttempts};
  for(const [key,value] of Object.entries(expected))assert.equal(result.usage[key],value);
  assert.ok(result.usage.timeMs<=saved.budgetUsedMs);
  assert.equal(saved.executionPolicy,'continuous');assert.equal(saved.accountingVersion,2);
  assert.equal(saved.usage.cost,'unknown');
}
async function runLocal(f,task,model,options={}){
  return runAgent({store:f.store,project:f.project,task,prompt:originalPrompt,config:config(model),signal:AbortSignal.timeout(75000),emit:()=>{},build,...options});
}

test('same natural reading request: real candidate corrections, one PI session, persisted usage without quotas',{timeout:90000},async t=>{
  t.diagnostic(JSON.stringify(version));
  const f=await freshStore();let model;
  try{
    assert.equal(originalPrompt,'做一个记录读书进度的小程序');
    assert.equal(verificationRequirements(f.project,originalPrompt).profile,'general');
    const initial=await f.store.draft(f.project.id);await build(initial);await f.store.commit(f.project,initial,'旧可用版');await fs.rm(initial,{recursive:true,force:true});
    const oldDigest=digestSources(f.project.versions[0].files),task=await createTask(f.store,f.project,originalPrompt);
    model=await createReactiveModel({extractCandidates:actualCandidates,semanticCss:actualSuggestion,onFeedback:result=>usageMatches(result,f.store,f.project.id)});
    const reservations=[];
    const result=await runAgent({store:f.store,project:f.project,task,prompt:originalPrompt,
      config:{baseUrl:model.baseUrl,model:'qa-plan-local',apiKey:'qa-plan-placeholder'},signal:AbortSignal.timeout(75000),emit:()=>{},build,
      // Omit verify: importing all modules from the same root preserves the
      // host's default real-verifier identity/trust check.
      onBudgetCheckpoint:async()=>{await f.store.save(f.project);const persisted=(await f.store.get(f.project.id)).tasks.at(-1);if(persisted.verificationInFlight)reservations.push(structuredClone(persisted));}});
    assert.equal(result.revision,2);assert.equal(result.verification.state,'passed');
    const saved=await f.store.get(f.project.id),persisted=saved.tasks.find(value=>value.id===task.id);
    assert.deepEqual(['businessVerifyAttempts','planCorrectionAttempts','verificationRuns','verifyAttempts','buildAttempts','repairPrompts'].map(k=>persisted[k]),[2,2,4,4,1,0]);
    assert.equal(persisted.executionPolicy,'continuous');assert.equal(persisted.accountingVersion,2);assert.equal(persisted.verificationInFlight,undefined);assert.equal(persisted.toolCalls,6);
    assert.ok(persisted.budgetUsedMs>0);
    assert.deepEqual(reservations.map(value=>value.verificationRuns),[1,2,3,4]);
    assert.equal(new Set(reservations.map(value=>value.verificationInFlight.id)).size,4);
    for(const value of reservations){assert.match(value.verificationInFlight.sourceDigest,/^[0-9a-f]{64}$/);assert.ok(value.verificationInFlight.startedAt);}
    assert.equal(model.trace.length,2);assert.ok(model.trace.every(entry=>!entry.error));
    assert.deepEqual(model.trace.map(entry=>entry.target),['书名','生成进度二维码']);
    assert.equal(new Set(model.trace.map(entry=>entry.toolCallId)).size,2);
    assert.deepEqual(model.observedResults.map(value=>value.state),['failed','passed','failed','passed']);
    assert.equal(model.observedResults[3].qrChecks[0].data,progressText);
    assert.deepEqual(model.observedResults[1].steps,firstCheck(model.trace[0].selector));
    assert.deepEqual(model.observedResults[3].steps,secondCheck(model.trace[1].selector));
    const sessionFiles=(await fs.readdir(path.join(f.store.dir(f.project.id),'sessions'))).filter(name=>name.endsWith('.jsonl'));
    assert.deepEqual(sessionFiles,[persisted.sessionFile]);
    const records=(await fs.readFile(path.join(f.store.dir(f.project.id),'sessions',sessionFiles[0]),'utf8')).trim().split('\n').map(line=>JSON.parse(line));
    const bindings=records.filter(entry=>entry.type==='custom'&&entry.customType==='sprout-task');
    assert.equal(bindings.length,1);assert.equal(bindings[0].data.taskId,task.id);
    assert.equal(digestSources(saved.versions[0].files),oldDigest);await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

test('wrong semantic candidate and blind first preserve original business/QR expectations; count remains plural',{timeout:60000},async()=>{
  const f=await createReadingFixture({productRoot});
  try{
    const ambiguous=await verifyPreview(f.root,secondCheck());
    assert.equal(ambiguous.failureType,'plan');assert.equal(ambiguous.matchCount,2);
    const wrong=actualCandidates(ambiguous).find(candidate=>candidate.name==='返回书架');assert.ok(wrong);
    const wrongSelector=actualSuggestion(wrong,ambiguous);
    for(const selector of [wrongSelector,'.btn-ghost:first-child']){
      const result=await verifyPreview(f.root,secondCheck(selector));
      assert.equal(result.state,'failed');assert.equal(result.failureType,'business');
      assert.deepEqual(result.steps,secondCheck(selector));assert.equal(result.qrChecks.length,0);
    }
    const counted=await verifyPreview(f.root,[{action:'count',selector:'.field-label',value:3}]);
    assert.equal(counted.state,'passed');await unchangedProduct();
  }finally{await f.cleanup();}
});

test('legacy usage beyond former limits explicitly resumes and performs real new work',{timeout:90000},async()=>{
  const f=await freshStore();
  let model;
  try{
    const old=await createTask(f.store,f.project,originalPrompt);
    Object.assign(old,{state:'failed',reason:'verification-budget-exhausted',resumable:false,attempts:5,toolCalls:45,buildAttempts:4,verifyAttempts:7,verificationRuns:7,businessVerifyAttempts:5,planCorrectionAttempts:4,repairPrompts:4,budgetUsedMs:700001});
    await f.store.save(f.project);assert.equal(f.store.public(f.project).tasks.at(-1).resumable,true);assert.equal(old.resumable,false);
    const task=await createTask(f.store,f.project,originalPrompt,old);
    model=await createReactiveModel({extractCandidates:actualCandidates,semanticCss:actualSuggestion,onFeedback:result=>usageMatches(result,f.store,f.project.id)});
    await runLocal(f,task,model);
    const saved=await f.store.get(f.project.id),continued=saved.tasks.at(-1);
    assert.equal(saved.revision,1);assert.equal(continued.recoveryMode,'current-source-context-rebuilt');
    assert.equal(continued.attempts,6);assert.equal(continued.toolCalls,51);assert.equal(continued.buildAttempts,5);assert.equal(continued.verificationRuns,11);assert.ok(continued.budgetUsedMs>700001);
    assert.equal(old.reason,'verification-budget-exhausted');
    await assert.rejects(createTask(f.store,saved,originalPrompt,{...continued,state:'completed'}),/已完成/);
    await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

test('hard kill retains exact native session/draft; resume never replays write and invalidates old passed',{timeout:90000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qa-plan-kill-'));let child,model;
  let resumedModel;
  try{
    model=await createReactiveModel({extractCandidates:actualCandidates,semanticCss:actualSuggestion});
    const fixtureUrl=new URL('./plan-correction-fixture.mjs',import.meta.url).href;
    const url=name=>pathToFileURL(path.join(productRoot,'server',name+'.mjs')).href;
    const script=`import {Store} from ${JSON.stringify(url('store'))};import {runAgent} from ${JSON.stringify(url('agent'))};import {createTask} from ${JSON.stringify(url('harness'))};import {writeReadingPage,originalPrompt} from ${JSON.stringify(fixtureUrl)};const store=new Store(${JSON.stringify(root)});await store.init();const project=await store.create('读书进度');project.memory.goal='读书进度';const task=await createTask(store,project,originalPrompt);await runAgent({store,project,task,prompt:originalPrompt,config:{baseUrl:${JSON.stringify(model.baseUrl)},model:'qa-plan-local',apiKey:'qa-plan-placeholder'},signal:new AbortController().signal,emit:()=>{},build:dir=>writeReadingPage(dir,{productRoot:${JSON.stringify(productRoot)}}),onBudgetCheckpoint:async()=>{await store.save(project);if(task.lastVerification?.state==='passed'&&!task.verificationInFlight){console.log('RESERVED');await new Promise(()=>{});}}});`;
    child=spawn(process.execPath,['--input-type=module','-e',script],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);
    await new Promise((resolve,reject)=>{let raw='';const timer=setTimeout(()=>reject(new Error('reservation timeout '+stderr)),30000);child.stdout.on('data',chunk=>{raw+=chunk;if(raw.includes('RESERVED')){clearTimeout(timer);resolve();}});child.once('exit',code=>{clearTimeout(timer);reject(new Error('child exited '+code+' '+stderr));});child.once('error',reject);});
    const store=new Store(root),summary=(await store.list())[0],before=await store.get(summary.id),prior=before.tasks.at(-1);
    assert.equal(prior.lastVerification.state,'passed');assert.ok(prior.draftRef);assert.ok(prior.sessionFile);assert.equal(before.revision,0);
    await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});await recoverTasks(store);
    let after=await store.get(before.id);const resumed=await createTask(store,after,originalPrompt,after.tasks.at(-1));
    resumedModel=await createLocalModel({decide:(payload,n)=>{
      if(n===0){assert.match(JSON.stringify(payload),/No result provided/);return check;}
      if(n===1){assert.equal(latestToolResult(payload).kind,'build-required');return compile;}
      if(n===2)return check;
      assert.equal(latestToolResult(payload).state,'passed');return null;
    }});
    let builds=0;await runLocal({store,project:after},resumed,resumedModel,{build:async dir=>{builds++;await build(dir);}});
    after=await store.get(before.id);assert.equal(after.revision,1);assert.equal(resumed.recoveryMode,'native-session-and-draft');assert.equal(resumed.sessionFile,prior.sessionFile);assert.equal(resumed.draftRef,prior.draftRef);assert.equal(builds,1);
    assert.equal(resumedModel.payloads.flatMap(payload=>payload.messages||[]).filter(message=>message.role==='assistant').flatMap(message=>message.tool_calls||[]).filter(call=>call.id?.startsWith('qa-local-')&&call.function?.name==='write_file').length,0);
    assert.equal((await fs.readdir(path.join(store.dir(before.id),'sessions'))).filter(name=>name.endsWith('.jsonl')).length,1);await unchangedProduct();
  }finally{if(child&&child.exitCode===null&&child.signalCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});await model?.close();await resumedModel?.close();await fs.rm(root,{recursive:true,force:true});}
});

test('internal editors are plan candidates; truncation stays business; hidden/editable candidate privacy',{timeout:60000},async()=>{
  const f=await createReadingFixture({productRoot});
  try{
    const internal=await verifyPreview(f.root,[{action:'fill',selector:'#editor-group',value:'纠正输入'},{action:'text',selector:'#editor-echo',value:'纠正输入'}]);
    assert.equal(internal.state,'failed');assert.equal(internal.failureType,'plan');assert.equal(internal.matchCount,2);
    const target=actualCandidates(internal).find(candidate=>candidate.name==='补录书名');assert.ok(target);
    const selector=actualSuggestion(target,internal);
    const corrected=await verifyPreview(f.root,[{action:'fill',selector,value:'纠正输入'},{action:'text',selector:'#editor-echo',value:'纠正输入'}]);assert.equal(corrected.state,'passed');
    const truncated=await verifyPreview(f.root,[{action:'fill',selector:'#limited-input',value:'超过三个汉字'},{action:'text',selector:'#editor-echo',value:'纠正输入'}]);assert.equal(truncated.state,'failed');assert.equal(truncated.failureType,'business');assert.match(truncated.error,/截断|改变/);
    const hidden=await verifyPreview(f.root,[{action:'text',selector:'.visibility-choice',value:'可见操作'}]);
    assert.equal(hidden.state,'failed');assert.equal(hidden.failureType,'plan');assert.equal(hidden.matchCount,2);
    assert.ok(hidden.candidates.some(candidate=>candidate.id==='visible-choice'));
    assert.ok(hidden.candidates.every(candidate=>candidate.id!=='hidden-choice'));
    assert.ok(hidden.suggestions.every(suggestion=>!suggestion.selector.includes('hidden-choice')));
    const privateEditors=await verifyPreview(f.root,[{action:'fill',selector:'.private-editor',value:'测试输入'},{action:'text',selector:'#editor-echo',value:'测试输入'}]);
    assert.equal(privateEditors.state,'failed');assert.equal(privateEditors.failureType,'plan');assert.equal(privateEditors.matchCount,2);
    assert.doesNotMatch(JSON.stringify({candidates:privateEditors.candidates,suggestions:privateEditors.suggestions}),/QA_PRIVATE_EDITABLE_SENTINEL|QA_PRIVATE_PLAINTEXT_SENTINEL/);
    await unchangedProduct();
  }finally{await f.cleanup();}
});

test('new source-reading evidence crosses four host continuations; identical plan evidence pauses recoverably',{timeout:90000},async()=>{
  const f=await freshStore();let model;
  try{
    const paths=['src/pages/index/index.jsx','src/pages/index/index.css','src/app.css'];
    const task=await createTask(f.store,f.project,originalPrompt);
    model=await createLocalModel({decide:(payload,n)=>{
      if(n<6){if(n%2===0)return action('read_file',{path:paths[n/2]});assert.equal(typeof latestToolResult(payload),'string');return null;}
      if(n===6)return action('list_files');if(n===7){assert.match(latestToolResult(payload),/src\/pages\/index/);return null;}
      if(n===8)return write;if(n===9)return compile;if(n===10)return check;
      assert.equal(latestToolResult(payload).state,'passed');return null;
    }});
    await runLocal(f,task,model);const saved=(await f.store.get(f.project.id)).tasks.at(-1);
    assert.equal(saved.repairPrompts,4);assert.ok(saved.progressEvidence.length>=7);await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
  const repeated=await freshStore();let repeatModel;
  try{
    const task=await createTask(repeated.store,repeated.project,originalPrompt);const feedback=[];
    repeatModel=await createLocalModel({decide:payload=>{
      const result=latestToolResult(payload);if(result&&typeof result==='object'){feedback.push(result);assert.equal(result.failureType,'plan');}
      const calls=(payload.messages||[]).filter(message=>message.role==='tool').length;
      return calls===0?write:calls===1?compile:action('verify_preview',{steps:firstCheck()});
    }});
    await assert.rejects(runLocal(repeated,task,repeatModel),error=>error.code==='no-progress');
    assert.ok(feedback.some(result=>result.kind==='reused-tool-evidence'));assert.equal(task.verificationRuns,1);
    assert.equal(repeated.project.revision,0);assert.ok(task.draftRef&&task.sessionFile);await unchangedProduct();
  }finally{await repeatModel?.close();await repeated.cleanup();}
});

test('native automatic threshold compaction persists its real events and continued context',{timeout:90000},async()=>{
  const f=await freshStore();let model;
  try{
    const sentinel='QA_EARLY_REQUIREMENT_KEEP_CHINESE_BOOKS';
    f.project.memory.changes=[{text:sentinel+' 中'.repeat(2000),time:1}];await f.store.save(f.project);
    const task=await createTask(f.store,f.project,originalPrompt),states=[];
    model=await createLocalModel({decide:(payload,n)=>{
      if(n===0){const systems=(payload.messages||[]).filter(message=>['system','developer'].includes(message.role));assert.doesNotMatch(JSON.stringify(systems),new RegExp(sentinel));assert.match(JSON.stringify(payload),new RegExp(sentinel));return write;}
      if(n===1)return action('read_file',{path:'src/pages/index/index.css'});
      if(n===2){assert.match(latestToolResult(payload),/QA_SINGLE_WRITE/);return {text:'继续检查未交付草稿。',usage:{prompt_tokens:15000,completion_tokens:10,total_tokens:15010}};}
      assert.match(JSON.stringify(payload),new RegExp(sentinel),'native compacted context must retain early requirement');
      if(n===3)return check;assert.equal(latestToolResult(payload).state,'passed');return null;
    },summarize:payload=>{
      const serialized=JSON.stringify(payload);assert.match(serialized,new RegExp(sentinel));assert.match(serialized,/QA_SINGLE_WRITE/);assert.match(serialized,/conversation|summar/i);
      return `## Goal\n${originalPrompt}\n## Constraints\n${sentinel}\n## Progress\nQA_SINGLE_WRITE exists in an unverified draft; rebuild and verify before delivery.`;
    }});
    await runLocal(f,task,model,{testSessionOptions:{contextWindow:20000,keepRecentTokens:0},emit:event=>{if(event.type==='status'&&task.compaction)states.push(structuredClone(task.compaction));}});
    assert.ok(model.summaries.length>=1);assert.ok(states.some(state=>state.state==='running'&&state.reason==='threshold'));assert.ok(states.some(state=>state.state==='completed'&&state.reason==='threshold'));
    const saved=(await f.store.get(f.project.id)).tasks.at(-1);assert.equal(saved.compaction.state,'completed');assert.equal(saved.compaction.reason,'threshold');
    const entries=(await fs.readFile(await f.store.taskPath(f.project.id,'sessions',saved.sessionFile),'utf8')).trim().split('\n').map(line=>JSON.parse(line));
    assert.ok(entries.some(entry=>entry.type==='compaction'&&!entry.fromHook&&entry.summary.includes(sentinel)));
    assert.equal(f.project.verification.state,'passed');await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

test('requirements larger than initialization capacity are delivered only after contiguous actual pages',{timeout:90000},async()=>{
  const f=await freshStore();let model;
  try{
    const originals=['QA_REQUIREMENT_ONE '+'中'.repeat(26000),'QA_REQUIREMENT_TWO '+'文'.repeat(26000)];
    f.project.memory.changes=originals.map((text,index)=>({text,time:index+1}));await f.store.save(f.project);
    const task=await createTask(f.store,f.project,originalPrompt),pages=[];let index=0,offset=0;
    model=await createLocalModel({decide:async(payload,n)=>{
      if(n===0)return write;if(n===1)return compile;if(n===2)return check;
      if(n===3){assert.equal(latestToolResult(payload).state,'passed');return null;}
      if(n===4){assert.equal((await f.store.get(f.project.id)).revision,0);assert.match(JSON.stringify(payload),/未读取完整历史需求/);}
      const previous=latestToolResult(payload);
      if(previous?.section==='changes'){
        assert.equal(previous.index,index);assert.equal(previous.offset,offset);assert.ok(previous.text===originals[index].slice(offset,offset+12000),JSON.stringify((()=>{const expected=originals[index].slice(offset,offset+12000),actual=previous.text;let firstDiff=0;while(firstDiff<Math.min(actual.length,expected.length)&&actual[firstDiff]===expected[firstDiff])firstDiff++;return {section:previous.section,index,offset,nextOffset:previous.nextOffset,total:previous.total,actualLength:actual.length,expectedLength:expected.length,firstDiff,actualPrefix:actual.slice(0,40),expectedPrefix:expected.slice(0,40),actualDigest:createHash('sha256').update(actual).digest('hex'),expectedDigest:createHash('sha256').update(expected).digest('hex')};})()));assert.ok(previous.text.length<=12000);pages.push(previous);
        const persisted=(await f.store.get(f.project.id)).tasks.at(-1);assert.equal(previous.requirementsDigest,persisted.requirementsDigest);
        if(previous.nextOffset===null){index++;offset=0;}else offset=previous.nextOffset;
      }
      if(index<originals.length)return action('read_requirements',{section:'changes',index,offset});
      return null;
    }});
    await runLocal(f,task,model);
    assert.equal(pages.length,6);for(let i=0;i<2;i++)assert.equal(pages.filter(page=>page.index===i).map(page=>page.text).join(''),originals[i]);
    const saved=await f.store.get(f.project.id);assert.equal(saved.revision,1);assert.deepEqual(saved.tasks.at(-1).pendingRequirements,[]);await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

async function stoppedAfterOneWrite(f){
  const task=await createTask(f.store,f.project,originalPrompt),controller=new AbortController();let model;
  try{
    model=await createLocalModel({decide:()=>write});
    await assert.rejects(runLocal(f,task,model,{signal:controller.signal,onBudgetCheckpoint:async()=>{await f.store.save(f.project);if(task.sessionFile&&task.draftSourceDigest!==task.sourceDigest)controller.abort(new Error('user-stop'));}}),/user-stop/);
    task.state='stopped';task.reason='user-stop';task.resumable=true;await f.store.save(f.project);return task;
  }finally{await model?.close();}
}

test('user stop retains recoverable draft/session; a wrong same-project session cannot be rebound',{timeout:90000},async()=>{
  const f=await freshStore();let model;
  try{
    const first=await stoppedAfterOneWrite(f),second=await stoppedAfterOneWrite(f);
    assert.notEqual(first.sessionFile,second.sessionFile);assert.notEqual(first.draftRef,second.draftRef);
    const task=await createTask(f.store,f.project,originalPrompt,first);task.sessionFile=second.sessionFile;await f.store.save(f.project);
    const wrong=await f.store.taskPath(f.project.id,'sessions',second.sessionFile),before=await fs.readFile(wrong);
    model=await createLocalModel({decide:()=>{assert.fail('wrong session must be rejected before a provider request');}});
    await assert.rejects(runLocal(f,task,model));assert.equal(model.requests,0);assert.deepEqual(await fs.readFile(wrong),before,'rejected session must not receive a new binding');
    assert.equal(f.project.revision,0);await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

test('hard kill before requirement receipt or initial prompt cannot turn undelivered history into read coverage',{timeout:150000},async()=>{
  for(const window of ['page-before-tool-result','initial-before-prompt']){
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qa-requirement-kill-'));let child,model,resumedModel;
    const texts=window==='page-before-tool-result'?['QA_PAGED_RECEIPT '+'中'.repeat(26000),'QA_SECOND_RECORD '+'文'.repeat(26000)]:['QA_INITIAL_HISTORY_SENTINEL 保留原始读书要求'];
    try{
      model=await createLocalModel({decide:()=>action('read_requirements',{section:'changes',index:0,offset:0})});
      const url=name=>pathToFileURL(path.join(productRoot,'server',name+'.mjs')).href;
      const fixtureUrl=new URL('./plan-correction-fixture.mjs',import.meta.url).href;
      const gate=window==='page-before-tool-result'?"task.requirementPageInFlight?.section==='changes'&&task.requirementPageInFlight.index===0&&task.requirementPageInFlight.offset===0":"task.requirementsDigest&&task.toolCalls===0";
      const script=`import {Store} from ${JSON.stringify(url('store'))};import {runAgent} from ${JSON.stringify(url('agent'))};import {createTask} from ${JSON.stringify(url('harness'))};import {writeReadingPage,originalPrompt} from ${JSON.stringify(fixtureUrl)};const store=new Store(${JSON.stringify(root)});await store.init();const project=await store.create('读书进度');project.memory.goal='读书进度';project.memory.changes=${JSON.stringify(texts)}.map((text,index)=>({text,time:index+1}));await store.save(project);const task=await createTask(store,project,originalPrompt);await runAgent({store,project,task,prompt:originalPrompt,config:${JSON.stringify(config(model))},signal:new AbortController().signal,emit:()=>{},build:dir=>writeReadingPage(dir,{productRoot:${JSON.stringify(productRoot)}}),onBudgetCheckpoint:async()=>{await store.save(project);if(${gate}){console.log('UNDELIVERED');await new Promise(()=>{});}}});`;
      const childFile=path.join(root,'qa-undelivered-child.mjs');await fs.writeFile(childFile,script);
      child=spawn(process.execPath,[childFile],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);
      await new Promise((resolve,reject)=>{let raw='';const timer=setTimeout(()=>reject(new Error('undelivered window timeout '+stderr)),30000);child.stdout.on('data',chunk=>{raw+=chunk;if(raw.includes('UNDELIVERED')){clearTimeout(timer);resolve();}});child.once('exit',code=>{clearTimeout(timer);reject(new Error('child exited '+code+' '+stderr));});child.once('error',reject);});
      const store=new Store(root),summary=(await store.list())[0],before=await store.get(summary.id),prior=before.tasks.at(-1);
      let entries=[];
      try{const sessionPath=await store.taskPath(before.id,'sessions',prior.sessionFile);entries=(await fs.readFile(sessionPath,'utf8')).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));}
      catch(error){assert.equal(window,'initial-before-prompt');assert.equal(prior.sessionInitialized,false);assert.equal(error.code,'ENOENT');}
      if(window==='page-before-tool-result')assert.ok(!entries.some(entry=>entry.message?.role==='toolResult'&&entry.message?.toolName==='read_requirements'));
      else assert.ok(!entries.some(entry=>entry.message?.role==='user'));
      await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});await recoverTasks(store);
      const project=await store.get(before.id),task=await createTask(store,project,originalPrompt,project.tasks.at(-1)),received=[];let phase='requirements',pageIndex=0,pageOffset=0,needsPages;
      resumedModel=await createLocalModel({decide:async(payload,n)=>{
        const persisted=(await store.get(project.id)).tasks.at(-1),last=latestToolResult(payload);
        if(n===0){
          const rawHistory=JSON.stringify(payload).includes(texts[0].split(' ')[0]);
          assert.ok(rawHistory||persisted.pendingRequirements.some(page=>page.section==='changes'&&page.index===0&&page.offset===0),'undelivered record must be replayed as context or conservatively unread');
          needsPages=persisted.pendingRequirements.some(page=>page.section==='changes');
        }
        if(phase==='requirements'){
          if(last?.section==='changes'){
            assert.equal(last.index,pageIndex);assert.equal(last.offset,pageOffset);received.push(last);assert.ok(last.text===texts[last.index].slice(last.offset,last.offset+12000),JSON.stringify((()=>{const expected=texts[last.index].slice(last.offset,last.offset+12000),actual=last.text;let firstDiff=0;while(firstDiff<Math.min(actual.length,expected.length)&&actual[firstDiff]===expected[firstDiff])firstDiff++;return {section:last.section,index:last.index,offset:last.offset,nextOffset:last.nextOffset,total:last.total,actualLength:actual.length,expectedLength:expected.length,firstDiff,actualPrefix:actual.slice(0,40),expectedPrefix:expected.slice(0,40),actualDigest:createHash('sha256').update(actual).digest('hex'),expectedDigest:createHash('sha256').update(expected).digest('hex')};})()));
            if(last.nextOffset===null){pageIndex++;pageOffset=0;}else pageOffset=last.nextOffset;
          }
          if(needsPages&&pageIndex<texts.length)return action('read_requirements',{section:'changes',index:pageIndex,offset:pageOffset});
          phase='build';return write;
        }
        if(phase==='build'){phase='verify';return compile;}
        if(phase==='verify'){phase='finish';return check;}
        assert.equal(last.state,'passed');return null;
      }});
      await runLocal({store,project},task,resumedModel);
      if(window==='page-before-tool-result'){assert.equal(received[0].offset,0);assert.equal(received.filter(page=>page.index===0).map(page=>page.text).join(''),texts[0]);}
      if(window==='page-before-tool-result'){assert.equal(task.sessionFile,prior.sessionFile);assert.equal(task.recoveryMode,'native-session-and-draft');}
      else assert.equal(task.recoveryMode,'initialization-interrupted-context-rebuilt');
      assert.equal(task.draftRef,prior.draftRef);assert.equal(project.revision,1);await unchangedProduct();
    }finally{if(child&&child.exitCode===null&&child.signalCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});await model?.close();await resumedModel?.close();await fs.rm(root,{recursive:true,force:true});}
  }
});

test('continuous identical tool errors return evidence then pause; actual new diagnostic/plan/source may continue',{timeout:180000},async()=>{
  for(const mode of ['build','business','runtime','static-plan','read-missing','write-throw','requirement-error']){
    const f=await freshStore();let model;
    try{
      const task=await createTask(f.store,f.project,originalPrompt),feedback=[];
      const failedCheck=mode==='static-plan'?action('verify_preview',{steps:[{action:'click',selector:'#add-book'}]}):mode==='business'?action('verify_preview',{steps:[{action:'text',selector:'#editor-echo',value:'已纠正'}]}):check;
      model=await createLocalModel({decide:(payload,n)=>{
        const last=latestToolResult(payload);if(n>1)feedback.push(last);
        if(n===0)return write;if(n===1)return compile;
        if(mode==='build')return compile;
        if(mode==='read-missing')return action('read_file',{path:'src/qa-missing-file.js'});
        if(mode==='write-throw')return action('write_file',{path:'../qa-forbidden.txt',content:'QA_SAFE_SENTINEL'});
        if(mode==='requirement-error')return action('read_requirements',{section:'changes',index:999,offset:0});
        return failedCheck;
      }});
      const fixtureBuild=async dir=>{
        if(mode==='build')throw new Error('QA_IDENTICAL_BUILD_FAILURE');
        await build(dir);if(mode==='runtime'){const file=path.join(dir,'dist/h5/index.html');await fs.appendFile(file,"<script>throw new Error('QA_IDENTICAL_RUNTIME_FAILURE')</script>");}
      };
      await assert.rejects(runLocal(f,task,model,{build:fixtureBuild}),error=>error.code==='no-progress');
      assert.ok(feedback.length>=2,'must return actual initial failure and actionable evidence before pausing');
      assert.equal(f.project.revision,0);assert.ok(task.draftRef&&task.sessionFile);
      if(mode==='business')assert.ok(feedback.some(result=>result?.failureType==='business'));
      if(mode==='runtime')assert.ok(feedback.some(result=>result?.failureType==='runtime'));
      if(['read-missing','write-throw','requirement-error'].includes(mode))assert.ok(feedback.some(result=>result?.kind==='tool-error'));
      await unchangedProduct();
    }finally{await model?.close();await f.cleanup();}
  }
  const f=await freshStore();let model;
  try{
    const task=await createTask(f.store,f.project,originalPrompt);let phase=0;
    model=await createLocalModel({decide:payload=>{
      const last=latestToolResult(payload);switch(phase++){
        case 0:return write;case 1:return compile;
        case 2:return action('verify_preview',{steps:[{action:'text',selector:'#editor-echo',value:'已纠正'}]});
        case 3:assert.equal(last.failureType,'business');return action('read_file',{path:'src/pages/index/index.jsx'});
        case 4:assert.equal(typeof last,'string');return action('write_file',{path:'src/pages/index/index.css',content:'page{color:#335577}/* QA_NEW_EVIDENCE */'});
        case 5:return compile;
        case 6:return action('verify_preview',{steps:[{action:'fill',selector:'#extra-title',value:'已纠正'},{action:'text',selector:'#editor-echo',value:'已纠正'}]});
        default:assert.equal(last.state,'passed');return null;
      }
    }});
    await runLocal(f,task,model);assert.equal(f.project.revision,1);assert.equal(f.project.verification.steps.at(-1).value,'已纠正');await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

test('ordinary tool-error feedback permits corrected arguments and a real delivery',{timeout:90000},async()=>{
  const f=await freshStore();let model;
  try{
    const task=await createTask(f.store,f.project,originalPrompt);
    model=await createLocalModel({decide:(payload,n)=>{
      if(n===0)return action('read_file',{path:'src/qa-missing-file.js'});
      if(n===1){assert.equal(latestToolResult(payload).kind,'tool-error');return action('read_file',{path:'src/pages/index/index.jsx'});}
      if(n===2){assert.equal(typeof latestToolResult(payload),'string');return write;}
      if(n===3)return compile;if(n===4)return check;assert.equal(latestToolResult(payload).state,'passed');return null;
    }});
    await runLocal(f,task,model);assert.equal(f.project.revision,1);await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

test('build-required feedback does not hide a first actual verification after a successful build',{timeout:90000},async()=>{
  const f=await freshStore();let model;
  try{
    const task=await createTask(f.store,f.project,originalPrompt);
    model=await createLocalModel({decide:(payload,n)=>{
      if(n===0)return write;if(n===1)return check;
      if(n===2){assert.equal(latestToolResult(payload).kind,'build-required');return compile;}
      if(n===3)return check;
      assert.equal(latestToolResult(payload).state,'passed');assert.notEqual(latestToolResult(payload).kind,'reused-tool-evidence');return null;
    }});
    await runLocal(f,task,model);assert.equal(f.project.revision,1);assert.equal(task.verificationRuns,1);assert.equal(task.buildAttempts,1);await unchangedProduct();
  }finally{await model?.close();await f.cleanup();}
});

test('legacy session without a draft is cleared before first new-draft persistence and survives that hard-kill window',{timeout:120000},async()=>{
  const f=await freshStore();let child,model;
  try{
    const legacy=await stoppedAfterOneWrite(f),oldDraft=legacy.draftRef,oldSession=legacy.sessionFile;
    const oldSessionPath=await f.store.taskPath(f.project.id,'sessions',oldSession),oldBytes=await fs.readFile(oldSessionPath);
    delete legacy.draftRef;await f.store.save(f.project);
    const url=name=>pathToFileURL(path.join(productRoot,'server',name+'.mjs')).href;
    const fixtureUrl=new URL('./plan-correction-fixture.mjs',import.meta.url).href;
    const script=`import {Store} from ${JSON.stringify(url('store'))};import {runAgent} from ${JSON.stringify(url('agent'))};import {createTask} from ${JSON.stringify(url('harness'))};import {writeReadingPage,originalPrompt} from ${JSON.stringify(fixtureUrl)};const store=new Store(${JSON.stringify(f.root)}),project=await store.get(${JSON.stringify(f.project.id)}),task=await createTask(store,project,originalPrompt,project.tasks.at(-1));await runAgent({store,project,task,prompt:originalPrompt,config:{baseUrl:'http://127.0.0.1:1/v1',model:'qa-plan-local',apiKey:'qa-plan-placeholder'},signal:new AbortController().signal,emit:()=>{},build:dir=>writeReadingPage(dir,{productRoot:${JSON.stringify(productRoot)}}),onBudgetCheckpoint:async()=>{await store.save(project);if(task.draftRef&&!task.sessionFile&&task.sessionInitialized===false){console.log('LEGACY_INITIALIZATION_RESERVED');await new Promise(()=>{});}}});`;
    const childFile=path.join(f.root,'qa-legacy-child.mjs');await fs.writeFile(childFile,script);
    child=spawn(process.execPath,[childFile],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);
    await new Promise((resolve,reject)=>{let raw='';const timer=setTimeout(()=>reject(new Error('legacy window timeout '+stderr)),30000);child.stdout.on('data',chunk=>{raw+=chunk;if(raw.includes('LEGACY_INITIALIZATION_RESERVED')){clearTimeout(timer);resolve();}});child.once('exit',code=>{clearTimeout(timer);reject(new Error('legacy child exited '+code+' '+stderr));});child.once('error',reject);});
    const interrupted=(await f.store.get(f.project.id)).tasks.at(-1);assert.ok(interrupted.draftRef);assert.notEqual(interrupted.draftRef,oldDraft);assert.equal(interrupted.sessionFile,undefined);assert.equal(interrupted.sessionBindingTaskId,undefined);assert.equal(interrupted.sessionInitialized,false);assert.deepEqual(await fs.readFile(oldSessionPath),oldBytes);
    await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});await recoverTasks(f.store);
    const project=await f.store.get(f.project.id),task=await createTask(f.store,project,originalPrompt,project.tasks.at(-1));
    model=await createLocalModel({decide:(payload,n)=>{if(n===0)return write;if(n===1)return compile;if(n===2)return check;assert.equal(latestToolResult(payload).state,'passed');return null;}});
    await runLocal({store:f.store,project},task,model);
    assert.equal(task.recoveryMode,'initialization-interrupted-context-rebuilt');assert.equal(task.draftRef,interrupted.draftRef);assert.notEqual(task.sessionFile,oldSession);assert.deepEqual(await fs.readFile(oldSessionPath),oldBytes);assert.equal(project.revision,1);await unchangedProduct();
  }finally{if(child&&child.exitCode===null&&child.signalCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');});await model?.close();await f.cleanup();}
});

test('isolated memory HTTP partial edits retain long original history and timestamps',{timeout:45000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qa-memory-partial-'));let studio;
  try{
    const {startStudio}=await load('index');studio=await startStudio({root,port:0,production:true,seed:false,build});await studio.ready;
    const project=await studio.store.create('读书进度');
    const changes=[{text:'QA_LONG_HISTORY '+'中'.repeat(49000),time:123456789},{text:'QA_SECOND_HISTORY '+'文'.repeat(1000),time:987654321}];
    project.memory={goal:'读书进度',constraints:'保留书籍与页数',changes,updatedAt:10};await studio.store.save(project);
    const send=async body=>{const response=await fetch(studio.url+'/api/projects/'+project.id+'/memory',{method:'PUT',headers:{'Content-Type':'application/json','X-Studio-Token':studio.token},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};};
    const partial=await send({constraints:'保留历史并显示进度',ignored:'unknown object fields remain ignored'});assert.equal(partial.status,200);assert.equal(partial.body.memory.goal,'读书进度');assert.deepEqual(partial.body.memory.changes,changes);
    assert.equal(partial.body.memory.constraints,'保留历史并显示进度');
    const full=await send({goal:partial.body.memory.goal,constraints:partial.body.memory.constraints,changes});assert.equal(full.status,200);assert.deepEqual(full.body.memory.changes,changes);
    for(const invalid of [[],null,'invalid',{goal:7},{constraints:null},{changes:{}},{changes:[{text:7}]},{changes:[{text:'新'.repeat(48001)}]}])assert.equal((await send(invalid)).status,400);
    const saved=await studio.store.get(project.id);assert.equal(saved.memory.constraints,'保留历史并显示进度');assert.deepEqual(saved.memory.changes,changes);await unchangedProduct();
  }finally{await studio?.close();await fs.rm(root,{recursive:true,force:true});}
});

// Fixture semantics remain separately audited from the host PI journey.
test('plan correction fixture: real labels/buttons, wrong target differs, dynamic progress QR', {timeout:45000}, async()=>{
  const fixture=await createReadingFixture();let server,browser;
  try {
    server=http.createServer(async(_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await fs.readFile(path.join(fixture.root,'dist/h5/index.html')));});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:375,height:720}});
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    assert.deepEqual(await page.locator('.field-label').allTextContents(),['书名','作者（可选）','总页数']);
    for(const step of bookSetup()){
      if(step.action==='fill')await page.locator(step.selector).fill(step.value);
      if(step.action==='click')await page.locator(step.selector).click();
    }
    await page.locator('#open-book').click();
    assert.deepEqual(await page.locator('.btn-ghost').allTextContents(),['返回书架','生成进度二维码']);
    assert.equal(await page.locator('.btn-ghost').first().getAttribute('id'),'return-shelf');
    // Playwright itself must reject the broad selector without side effects.
    await assert.rejects(page.locator('.btn-ghost').click(),/strict mode violation/);
    assert.deepEqual(await page.evaluate(()=>window.qaClicks),{generate:0,back:0});
    await page.locator('#return-shelf').click();
    assert.equal(await page.locator('#progress-qr').count(),0);
    await page.locator('#open-book').click();await page.locator('#generate-progress').click();
    const box=await page.locator('#progress-qr').boundingBox();
    assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=375&&box.y+box.height<=720);
    const whole=PNG.sync.read(await page.screenshot({fullPage:false}));
    const left=Math.floor(box.x),top=Math.floor(box.y),crop=new PNG({width:Math.ceil(box.x+box.width)-left,height:Math.ceil(box.y+box.height)-top});
    PNG.bitblt(whole,crop,left,top,crop.width,crop.height,0,0);
    const decoded=jsQR(new Uint8ClampedArray(crop.data),crop.width,crop.height);
    assert.equal(decoded?.data,progressText);
    // Multiple matches are the intended count semantics, not an ambiguity.
    assert.equal(await page.locator('.field-label').count(),3);
  } finally {
    await browser?.close();server?.closeAllConnections();if(server)await new Promise(resolve=>server.close(resolve));
    await fixture.cleanup();await assert.rejects(fs.stat(fixture.root),{code:'ENOENT'});
  }
});
