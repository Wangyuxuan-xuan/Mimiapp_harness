import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {verifyPreview,validateVerificationPlan,validateVerificationEvidence} from '../server/verify.mjs';
const step=(action,selector,value,extra={})=>({action,selector,...(value===undefined?{}:{value}),...extra});
const causal=(value='历史中文')=>[step('click','#history'),step('value','#editor',value,{afterStep:1})];
async function fixture(body){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'input-assert-'));await fs.mkdir(path.join(dir,'dist/h5'),{recursive:true});await fs.writeFile(path.join(dir,'dist/h5/index.html'),`<html><head></head><body>${body}</body></html>`);return dir;}
async function check(body,steps){const dir=await fixture(body);try{return await verifyPreview(dir,steps);}finally{await fs.rm(dir,{recursive:true,force:true});}}
test('plan shape, UTF16 bounds and host evidence reject invented causality and QR sources',()=>{
 validateVerificationPlan([step('value','#x','')]);validateVerificationPlan([step('value','#x','😀'.repeat(1000))]);
 assert.throws(()=>validateVerificationPlan([step('value','#x','😀'.repeat(1000)+'x')]));
 for(const middle of [step('fill','#editor','历史中文'),step('reload'),step('click','#other')])assert.throws(()=>validateVerificationPlan([step('click','#history'),middle,step('value','#editor','历史中文',{afterStep:1})]));
 const plan=[...causal(),step('click','#generate'),step('qr','#qr','历史中文',{sourceStep:2})];validateVerificationPlan(plan);
 assert.throws(()=>validateVerificationPlan(plan.map((s,i)=>i===1?{action:'value',selector:s.selector,value:s.value}:s)));
 assert.throws(()=>validateVerificationPlan(plan,{profile:'text-qr'}));
 const baseline=[step('fill','#editor','短中文'),step('click','#generate'),step('qr','#qr','短中文'),step('fill','#editor','长'.repeat(120)),step('click','#generate'),step('qr','#qr','长'.repeat(120)),step('fill','#editor',''),step('click','#generate'),step('text','#error','请先输入')];
 validateVerificationPlan([...baseline,step('fill','#editor','sentinel'),step('click','#history'),step('value','#editor','历史中文',{afterStep:11}),step('click','#generate'),step('qr','#qr','历史中文',{sourceStep:12})],{profile:'text-qr'});
 assert.throws(()=>validateVerificationEvidence({state:'passed'},causal()));
 const valueChecks=[{step:2,selector:'#editor',afterStep:1,matched:true,actualLength:4,expectedLength:4,beforeEqualsExpected:false,afterEqualsExpected:true,transition:true,clickExecuted:true}];
 validateVerificationEvidence({state:'passed',valueChecks,planDigest:createHash('sha256').update(JSON.stringify(causal())).digest('hex')},causal());
 assert.throws(()=>validateVerificationEvidence({state:'passed',valueChecks,planDigest:createHash('sha256').update(JSON.stringify(causal())).digest('hex')},causal('另一内容')));
 assert.throws(()=>validateVerificationEvidence({state:'passed',valueChecks,qrChecks:[{step:4,data:'历史中文'}]},plan));
});
test('real readonly input/Taro/textarea, async change and empty clearing pass; wrong/no-op/initial-equal fail privately',async()=>{
 const html=`<div id="editor"><textarea>PRIVATE_SENTINEL</textarea></div><button id="history" onclick="setTimeout(()=>document.querySelector('textarea').value='历史中文',120)">历史</button><button id="clear" onclick="document.querySelector('textarea').value=''"></button>`;
 const plan=[...causal(),step('click','#clear'),step('value','#editor','',{afterStep:3})];const good=await check(html,plan);assert.equal(good.state,'passed');validateVerificationEvidence(good,plan);assert.equal(good.valueChecks.length,2);assert.doesNotMatch(JSON.stringify(good),/PRIVATE_SENTINEL/);
 for(const handler of ['',"document.querySelector('#editor').value='PRIVATE_WRONG_VALUE'"]){const bad=await check(`<input id="editor" value="PRIVATE_SENTINEL"><button id="history" onclick="${handler}"></button>`,causal());assert.equal(bad.failureType,'business');assert.doesNotMatch(JSON.stringify(bad),/PRIVATE_SENTINEL|PRIVATE_WRONG_VALUE/);}
 const equal=await check('<input id="editor" value="历史中文"><button id="history"></button>',causal());assert.equal(equal.planKind,'value-initial-equal');
 for(const body of ['<div id="editor"><input><input></div>','<div style="opacity:0"><input id="editor"></div>','<input id="editor" type="password" value="PRIVATE_PASSWORD">','<select id="editor"><option>x</option></select>']){const r=await check(body,[step('value','#editor','')]);assert.equal(r.failureType,'plan');assert.doesNotMatch(JSON.stringify(r),/PRIVATE_PASSWORD/);}
});
test('actual QR source follows causal input and permits application clearing after generation',async()=>{
 const modules={};for(const name of await fs.readdir('templates/mini/src/vendor/qr/core'))if(name.endsWith('.js'))modules['./'+name.slice(0,-3)]=await fs.readFile('templates/mini/src/vendor/qr/core/'+name,'utf8');const code=Object.entries(modules).map(([name,src])=>JSON.stringify(name)+':function(require,module,exports){'+src+'}').join(',');
 const html=`<input id="editor" value="sentinel"><button id="history" onclick="document.querySelector('input').value='历史中文'">历史</button><button id="generate" onclick="make()">生成</button><div id="out"></div><script>const modules={${code}},cache={};function require(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;modules[id](require,m,m.exports);return m.exports}function make(){const q=new (require('./index'))(-1,0);q.addData(encodeURIComponent(document.querySelector('input').value).replace(/%([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16))));q.make();const n=q.getModuleCount(),c=document.createElement('canvas');c.id='qr';c.width=c.height=(n+8)*4;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.fillStyle='black';for(let y=0;y<n;y++)for(let z=0;z<n;z++)if(q.isDark(y,z))x.fillRect((z+4)*4,(y+4)*4,4,4);document.querySelector('#out').replaceChildren(c);document.querySelector('input').value='';}</script>`;
 const plan=[...causal(),step('click','#generate'),step('qr','#qr','历史中文',{sourceStep:2}),step('value','#editor','')];
 const r=await check(html,plan);assert.equal(r.state,'passed');validateVerificationEvidence(r,plan);assert.equal(r.qrChecks[0].source.generateClickExecuted,true);assert.equal(r.valueChecks[1].actualLength,0);
 const forged=structuredClone(r);delete forged.qrChecks[0].source;assert.throws(()=>validateVerificationEvidence(forged,plan));
 const wrong=await check(html.replace("q.addData(encodeURIComponent(document.querySelector('input').value)","q.addData(encodeURIComponent('错误旧码')"),plan);assert.equal(wrong.failureType,'business');
});
test('cancel propagates through bounded readonly waiting',async()=>{
 const dir=await fixture('<input id="editor" value="PRIVATE"><button id="history"></button>');const controller=new AbortController();try{const pending=verifyPreview(dir,causal(),{signal:controller.signal});setTimeout(()=>controller.abort(new Error('user-stop')),700);await assert.rejects(pending,/user-stop/);}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('ambiguous input hosts redact textarea content and non-selector faults retain source classification',async()=>{
 const privacy=await check('<div class="host"><textarea>PRIVATE_TEXTAREA_A</textarea></div><div class="host"><textarea>PRIVATE_TEXTAREA_B</textarea></div>',[step('value','.host','')]);assert.equal(privacy.planKind,'selector-ambiguous');assert.doesNotMatch(JSON.stringify(privacy),/PRIVATE_TEXTAREA_A|PRIVATE_TEXTAREA_B/);
 const runtime=await check('<input id="editor" value="old"><button id="history" onclick="throw new Error(\'fixture-script-failure\')"></button>',causal());assert.equal(runtime.failureType,'runtime');
 const syntax=await check('<input>',[step('value','[broken','')]);assert.equal(syntax.planKind,'selector-syntax');
});
