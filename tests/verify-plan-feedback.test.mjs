import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {chromium} from 'playwright-core';
import {Store} from '../server/store.mjs';
import {runAgent} from '../server/agent.mjs';
import {createTask,recoverTasks,exhaustedBudget,normalizeVerificationBudget} from '../server/harness.mjs';
import {verifyPreview} from '../server/verify.mjs';
const progress='《活着》 当前第120页 / 共200页 进度60% 作者余华';
async function pageHtml(){
 const modules={};for(const name of await fs.readdir('templates/mini/src/vendor/qr/core'))if(name.endsWith('.js'))modules['./'+name.slice(0,-3)]=await fs.readFile('templates/mini/src/vendor/qr/core/'+name,'utf8');const code=Object.entries(modules).map(([name,src])=>JSON.stringify(name)+':function(require,module,exports){'+src+'}').join(',');
 return `<html><head></head><body><section id="book-form"><span class="label">书名</span><input value="INPUT_VALUE_MUST_NOT_LEAK"><span class="label">作者（可选）</span><input value="ANOTHER_PRIVATE_VALUE"></section><section id="book-detail"><button class="btn-ghost" onclick="document.querySelector('#output').innerHTML='';document.querySelector('#status').textContent='书架'">返回书架</button><button class="btn-ghost" id="make-progress" onclick="makeQr()">生成进度二维码</button></section><div id="status">准备好</div><div id="output"></div><script>const modules={${code}},cache={};function require(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;modules[id](require,m,m.exports);return m.exports}const QR=require('./index');function makeQr(){const q=new QR(-1,0);q.addData(encodeURIComponent(${JSON.stringify(progress)}).replace(/%([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16))));q.make();const n=q.getModuleCount(),s=(n+8)*3,c=document.createElement('canvas');c.className='qr-box';c.width=c.height=s;const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,s,s);ctx.fillStyle='black';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))ctx.fillRect((x+4)*3,(y+4)*3,3,3);document.querySelector('#output').replaceChildren(c);}</script></body></html>`;
}
const action=(name,args={})=>({name,args});
const verify=steps=>action('verify_preview',{steps});
const qrSteps=selector=>[{action:'click',selector},{action:'count',selector:'.qr-box',value:1},{action:'qr',selector:'.qr-box',value:progress}];
async function agentFixture(decide,{html,injectVerify,seedTask}={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-v2-')),store=new Store(root);await store.init();const project=await store.create('读书助理'),task=await createTask(store,project,'制作读书记录小程序');if(seedTask)Object.assign(task,seedTask);
 let requests=0,builds=0;const payloads=[],events=[];const model=http.createServer(async(req,res)=>{try{let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);payloads.push(body);const next=decide(body,requests++);res.writeHead(200,{'Content-Type':'text/event-stream'});const send=(delta,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'v2',choices:[{index:0,delta,finish_reason}]})+'\n\n');send({role:'assistant'});if(next){send({tool_calls:[{index:0,id:'call-'+requests,type:'function',function:{name:next.name,arguments:JSON.stringify(next.args)}}]});send({},'tool_calls');}else{send({content:'完成'});send({},'stop');}res.end('data: [DONE]\n\n');}catch(e){res.writeHead(500);res.end(e.stack);}});await new Promise(r=>model.listen(0,'127.0.0.1',r));
 const build=async d=>{builds++;await fs.mkdir(path.join(d,'dist/h5'),{recursive:true});await fs.writeFile(path.join(d,'dist/h5/index.html'),html||await pageHtml());};
 try{const output=await runAgent({store,project,task,prompt:'制作读书记录小程序',config:{baseUrl:`http://127.0.0.1:${model.address().port}/v1`,model:'fixture',apiKey:'v2-fixture-only'},signal:AbortSignal.timeout(90000),emit:e=>events.push(e),build,...(injectVerify?{verify:injectVerify}:{})});return {output,task,requests,builds,payloads,events,store};}catch(error){return {error,task,requests,builds,payloads,events,store,project};}finally{model.closeAllConnections();await new Promise(r=>model.close(r));}
}
function start(n){return n===0?action('write_file',{path:'src/pages/index/index.css',content:'page{color:green}'}):n===1?action('build_preview'):undefined;}
function feedback(body){const text=body.messages.filter(m=>m.role==='tool').at(-1)?.content;return typeof text==='string'?JSON.parse(text):null;}
test('two real plan ambiguities plus a passed subcheck still allow corrected fourth run in the same PI session',async()=>{
 let labelSelector,buttonSelector;const f=await agentFixture((body,n)=>{
  if(n<2)return start(n);if(n===2)return verify([{action:'text',selector:'.label',value:'书名'}]);
  if(n===3){const r=feedback(body);assert.equal(r.failureType,'plan');assert.equal(r.matchCount,2);assert.equal(r.usage.plan,1);assert.ok(!r.remaining);const target=r.suggestions.find(c=>c.name==='书名');assert.ok(target);labelSelector=target.selector;assert.doesNotMatch(JSON.stringify(r),/INPUT_VALUE_MUST_NOT_LEAK|ANOTHER_PRIVATE_VALUE|outerHTML/);return verify([{action:'text',selector:labelSelector,value:'书名'}]);}
  if(n===4){assert.equal(feedback(body).state,'passed');assert.equal(feedback(body).usage.business,1);return verify(qrSteps('.btn-ghost'));}
  if(n===5){const r=feedback(body);assert.equal(r.failureType,'plan');assert.deepEqual(r.candidates.map(c=>c.name),['返回书架','生成进度二维码']);buttonSelector=r.suggestions.find(c=>c.name==='生成进度二维码').selector;return verify(qrSteps(buttonSelector));}
  assert.equal(feedback(body).state,'passed');return null;
 });
 assert.ifError(f.error);assert.equal(f.output.revision,1);assert.equal(f.task.accountingVersion,2);assert.equal(f.task.businessVerifyAttempts,2);assert.equal(f.task.planCorrectionAttempts,2);assert.equal(f.task.verificationRuns,4);assert.equal(f.task.verifyAttempts,4);assert.equal(f.task.toolCalls,6);assert.equal(f.builds,1);assert.equal(f.task.repairPrompts,0);assert.ok(!f.task.verificationInFlight);assert.equal(f.output.verification.qrChecks[0].data,progress);assert.equal((await fs.readdir(path.join(f.store.dir(f.output.id),'sessions'))).length,1);
 await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/studio-v2-semantic-positive.json',JSON.stringify({task:f.task,labelSelector,buttonSelector,verification:f.output.verification},null,2));
});
test('ambiguous single-target actions expose bounded real candidates without clicking or reading input values; count remains legal',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-v2-direct-'));await fs.mkdir(path.join(root,'dist/h5'),{recursive:true});await fs.writeFile(path.join(root,'dist/h5/index.html'),await pageHtml());const reports=[];
 for(const [action,selector,value] of [['click','.btn-ghost',undefined],['fill','input','x'],['text','.label','书名'],['qr','.label',progress]]){const result=await verifyPreview(root,[{action,selector,value},...(action==='click'||action==='fill'?[{action:'text',selector:'#status',value:'准备好'}]:[])]);assert.equal(result.failureType,'plan');assert.equal(result.matchCount,2);assert.ok(result.candidates.length<=6);assert.doesNotMatch(JSON.stringify(result),/INPUT_VALUE_MUST_NOT_LEAK|ANOTHER_PRIVATE_VALUE/);reports.push(result);}
 const count=await verifyPreview(root,[{action:'count',selector:'.btn-ghost',value:2}]);assert.equal(count.state,'passed');
 const wrong=await verifyPreview(root,qrSteps('button:text-is("返回书架")'));assert.equal(wrong.failureType,'business');
 const blind=await verifyPreview(root,qrSteps('.btn-ghost:first-child'));assert.equal(blind.failureType,'business');
 const fake=await verifyPreview(root,[{action:'qr',selector:'#book-detail',value:progress}]);assert.equal(fake.failureType,'business');
 const invalid=await verifyPreview(root,[{action:'text',selector:'[bad',value:'准备好'}]);assert.equal(invalid.failureType,'plan');
 await fs.writeFile('test-results/studio-v2-semantic-negative.json',JSON.stringify({reports,count,wrong,blind,fake,invalid},null,2));
});
test('repeated stable plan stops before another browser run and keeps fingerprint across resume',async()=>{
 const f=await agentFixture((_body,n)=>n<2?start(n):verify(qrSteps('.btn-ghost')));assert.equal(f.error.code,'no-progress');assert.equal(f.task.verificationRuns,1);assert.equal(f.task.planCorrectionAttempts,1);assert.equal(f.task.businessVerifyAttempts,0);assert.equal(f.task.planFailureFingerprints.length,1);assert.equal((await f.store.get(f.project.id)).revision,0);
});



test('page closure and explicit abort during selector polling cannot become free selector plans',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-v2-closure-'));await fs.mkdir(path.join(root,'dist/h5'),{recursive:true});await fs.writeFile(path.join(root,'dist/h5/index.html'),'<html><head></head><body>ready</body></html>');
 const launch=chromium.launch;
 try{
  chromium.launch=async(...args)=>{const browser=await launch.apply(chromium,args),newPage=browser.newPage.bind(browser);browser.newPage=async options=>{const page=await newPage(options);page.once('domcontentloaded',()=>setTimeout(()=>page.close().catch(()=>{}),60));return page;};return browser;};
  const closed=await verifyPreview(root,[{action:'text',selector:'.not-yet-mounted',value:'ready'}]);assert.equal(closed.failureType,'external');assert.notEqual(closed.failureType,'plan');
 }finally{chromium.launch=launch;}
 const controller=new AbortController(),pending=verifyPreview(root,[{action:'text',selector:'.not-yet-mounted',value:'ready'}],{signal:controller.signal});setTimeout(()=>controller.abort(new Error('user-stop')),600);await assert.rejects(pending,/user-stop/);
});
test('editable-child ambiguity is structured plan; truncation stays business and transparent candidates are excluded',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-v2-child-'));await fs.mkdir(path.join(root,'dist/h5'),{recursive:true});await fs.writeFile(path.join(root,'dist/h5/index.html'),'<html><head></head><body><div id="form"><input id="book-name" aria-label="书名" value="DO_NOT_READ_THIS"><input id="book-author" aria-label="作者" value="NOR_THIS"></div><section role="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"><div class="editable" contenteditable role="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb">EDITABLE_PRIVATE_TEXT</div><div class="editable" contenteditable="plaintext-only">PLAINTEXT_PRIVATE_TEXT</div></section><input id="limited" maxlength="3"><div id="status">ready</div><button class="button">真实按钮</button><div style="opacity:0"><button class="button">透明按钮</button></div><script>document.querySelector("#book-name").oninput=e=>document.querySelector("#status").textContent=e.target.value</script></body></html>');
 const steps=[{action:'fill',selector:'#form',value:'活着'},{action:'text',selector:'#status',value:'活着'}],ambiguous=await verifyPreview(root,steps);assert.equal(ambiguous.failureType,'plan');assert.equal(ambiguous.planKind,'selector-ambiguous');assert.equal(ambiguous.selector,'#form');assert.equal(ambiguous.targetContext,'editable-child');assert.equal(ambiguous.matchCount,2);assert.doesNotMatch(JSON.stringify(ambiguous),/DO_NOT_READ_THIS|NOR_THIS/);const name=ambiguous.suggestions.find(s=>s.name==='书名');assert.ok(name);assert.equal((await verifyPreview(root,[{...steps[0],selector:name.selector},steps[1]])).state,'passed');
 const editable=await verifyPreview(root,[{action:'text',selector:'.editable',value:'expected'}]);assert.equal(editable.failureType,'plan');assert.doesNotMatch(JSON.stringify(editable.candidates),/EDITABLE_PRIVATE_TEXT|PLAINTEXT_PRIVATE_TEXT/);assert.ok(editable.candidates.every(c=>c.name===''&&c.role.length<=100&&c.ancestorHints.every(a=>a.role.length<=100)));
 const limited=await verifyPreview(root,[{action:'fill',selector:'#limited',value:'超过三字的输入'},{action:'text',selector:'#status',value:'ready'}]);assert.equal(limited.failureType,'business');assert.match(limited.error,/截断或改变/);
 const transparent=await verifyPreview(root,[{action:'click',selector:'.button'},{action:'text',selector:'#status',value:'ready'}]);assert.equal(transparent.matchCount,2);assert.deepEqual(transparent.candidates.map(c=>c.name),['真实按钮']);assert.deepEqual(transparent.suggestions.map(c=>c.name),['真实按钮']);assert.equal(transparent.planKind,'selector-ambiguous');
});
