import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {inputFixture,historyQrFixture,historyValue} from './input-value-fixture.mjs';
import {deliverySteps} from './qr-fixture.mjs';

// No active-tree default: B must release an exact frozen product SHA first.
const productRoot=process.env.INPUT_ASSERT_PRODUCT_ROOT;
const expectedSha=process.env.INPUT_ASSERT_PRODUCT_SHA;
assert.ok(productRoot&&/^[a-f0-9]{40}$/.test(expectedSha||''),'require frozen INPUT_ASSERT_PRODUCT_ROOT and INPUT_ASSERT_PRODUCT_SHA');
const gitEntry=await fs.readFile(path.join(productRoot,'.git'),'utf8');
const gitDir=path.resolve(productRoot,gitEntry.trim().replace(/^gitdir: /,''));
const head=(await fs.readFile(path.join(gitDir,'HEAD'),'utf8')).trim();
const common=path.resolve(gitDir,(await fs.readFile(path.join(gitDir,'commondir'),'utf8')).trim());
const actualSha=head.startsWith('ref: ')?(await fs.readFile(path.join(common,head.slice(5)),'utf8')).trim():head;
assert.equal(actualSha,expectedSha,'product checkout must be exact released freeze');
const {verifyPreview,validateVerificationPlan,validateVerificationEvidence}=await import(pathToFileURL(path.join(productRoot,'server/verify.mjs')));
const observations=[];
const general={profile:'general'},qrProfile={profile:'text-qr'};
const causal=(selector='#editor',value=historyValue)=>[
  {action:'click',selector:'#history'},
  {action:'value',selector,value,afterStep:1}
];
async function runFixture(name,options,steps,expected,profile=general) {
  const fixture=await inputFixture(options);
  try{
    validateVerificationPlan(steps,profile);
    const result=await verifyPreview(fixture.root,steps,{signal:AbortSignal.timeout(20000)});
    observations.push({name,state:result.state,failureType:result.failureType,step:result.step,error:result.error,valueChecks:result.valueChecks});
    assert.equal(result.state,expected,JSON.stringify({name,result}));
    if(expected==='passed')validateVerificationEvidence(result,steps,profile);
    return result;
  }finally{await fixture.cleanup();}
}

test('independent values: actual correct/async/replaced/Taro/textarea and empty transitions',{timeout:120000},async()=>{
  for(const [name,options,selector,value] of [
    ['correct',{expected:'历史中文'},'#editor','历史中文'],
    ['async',{mode:'async',expected:'历史中文'},'#editor','历史中文'],
    ['replace',{mode:'replace',expected:'历史中文'},'#editor','历史中文'],
    ['Taro host',{expected:'历史中文'},'#host','历史中文'],
    ['textarea UTF16 exact',{kind:'textarea'},'#editor',historyValue],
    ['clear to empty',{expected:''},'#editor',''],
  ]) {
    const steps=causal(selector,value),result=await runFixture(name,options,steps,'passed');
    assert.equal(result.valueChecks.length,1);
    assert.throws(()=>validateVerificationEvidence({...result,valueChecks:[]},steps,general));
    assert.throws(()=>validateVerificationEvidence({...result,valueChecks:result.valueChecks.map(c=>({...c,afterStep:99}))},steps,general));
    const differentValue=structuredClone(steps);differentValue[1].value='错'.repeat(value.length);
    if(value.length)assert.throws(()=>validateVerificationEvidence(result,differentValue,general),/完整检查计划/);
    const differentSelector=structuredClone(steps);differentSelector[1].selector=selector==='#host'?'#fake':'#viewer';
    assert.equal(differentSelector[1].selector.length,selector.length);
    assert.throws(()=>validateVerificationEvidence(result,differentSelector,general),/完整检查计划/);
    const ordinary=structuredClone(steps);delete ordinary[1].afterStep;
    assert.throws(()=>validateVerificationEvidence(result,ordinary,general),/完整检查计划/);
  }
});

test('independent values: no-op, wrong, truncated and equal-before cannot prove refill',{timeout:70000},async()=>{
  for(const mode of ['noop','wrong','truncate']){
    const result=await runFixture(mode,{mode,kind:'textarea'},causal(),'failed');
    assert.equal(result.failureType,'business');
    assert.ok(!JSON.stringify(result).includes('DO_NOT_LEAK_WRONG'),'actual mismatch value must not leak');
  }
  const equal=await runFixture('equal before',{initial:'历史中文',expected:'历史中文'},causal('#editor','历史中文'),'failed');
  assert.equal(equal.failureType,'plan');
  await runFixture('ordinary equality is allowed',{initial:'历史中文'},[{action:'value',selector:'#editor',value:'历史中文'}],'passed');
});

test('independent value plans reject masking, reload, aliases, fake indices and UTF16 overflow',()=>{
  for(const intermediate of [{action:'fill',selector:'#host',value:'历史中文'},{action:'fill',selector:'#editor',value:'历史中文'},{action:'reload'}]){
    assert.throws(()=>validateVerificationPlan([{action:'click',selector:'#history'},intermediate,{action:'value',selector:'#editor',value:'历史中文',afterStep:1}],general));
  }
  for(const afterStep of [0,-1,2,1.5])assert.throws(()=>validateVerificationPlan([{action:'click',selector:'#history'},{action:'value',selector:'#editor',value:'历史中文',afterStep}],general));
  assert.throws(()=>validateVerificationPlan([{action:'fill',selector:'#editor',value:'历史中文'},{action:'value',selector:'#editor',value:'历史中文',afterStep:1}],general));
  for(const value of ['', '🙂'.repeat(1000)])assert.doesNotThrow(()=>validateVerificationPlan([{action:'value',selector:'#editor',value}],general));
  assert.throws(()=>validateVerificationPlan([{action:'value',selector:'#editor',value:'🙂'.repeat(1000)+'甲'}],general));
});

test('independent value target safety and cancellation',{timeout:70000},async()=>{
  for(const [name,options,selector] of [
    ['hidden ancestor',{hidden:true},'#editor'],
    ['ambiguous children',{ambiguous:true},'#host'],
    ['password',{kind:'password'},'#editor'],
    ['select unsupported',{kind:'select'},'#editor'],
    ['contenteditable unsupported',{kind:'contenteditable'},'#editor'],
  ]){
    const result=await runFixture(name,options,[{action:'value',selector,value:'DO_NOT_LEAK_EXPECTED'}],'failed');
    assert.equal(result.failureType,'plan');
    const feedback=JSON.stringify({...result,steps:undefined});
    for(const secret of ['DO_NOT_LEAK_OTHER','DO_NOT_LEAK_EXPECTED','sentinel'])assert.ok(!feedback.includes(secret),name+' feedback privacy');
  }
  const fixture=await inputFixture();try{
    const controller=new AbortController();controller.abort(new Error('QA_STOP'));
    await assert.rejects(verifyPreview(fixture.root,causal(),{signal:controller.signal}),/QA_STOP/);
  }finally{await fixture.cleanup();}
});

function qrSteps(){return [...deliverySteps('normal'),
  {action:'fill',selector:'#input',value:'sentinel'},
  {action:'click',selector:'#history'},
  {action:'value',selector:'#input',value:'历史回填一二三',afterStep:11},
  {action:'click',selector:'#generate'},
  {action:'qr',selector:'#qr',value:'历史回填一二三',sourceStep:12},
];}

test('independent QR source: real pixels, auto-clear allowed, wrong old content rejected',{timeout:120000},async()=>{
  for(const options of [{},{autoClear:true},{wrongQr:true}]){
    const fixture=await historyQrFixture(options),steps=qrSteps();
    try{
      validateVerificationPlan(steps,qrProfile);
      const result=await verifyPreview(fixture.root,steps,{signal:AbortSignal.timeout(35000)});
      observations.push({name:'QR '+JSON.stringify(options),state:result.state,step:result.step,error:result.error,qrChecks:result.qrChecks,valueChecks:result.valueChecks});
      assert.equal(result.state,options.wrongQr?'failed':'passed',JSON.stringify(result));
      if(!options.wrongQr){
        validateVerificationEvidence(result,steps,qrProfile);
        assert.deepEqual(result.qrChecks.map(c=>c.data),[steps[2].value,steps[5].value,'历史回填一二三']);
        assert.throws(()=>validateVerificationEvidence({...result,valueChecks:[]},steps,qrProfile));
        for(const field of ['sourceStep','afterStep','selector','generateStep','beforeGenerateMatched','generateClickExecuted']){
          const absent=structuredClone(result);delete absent.qrChecks.at(-1).source[field];
          assert.throws(()=>validateVerificationEvidence(absent,steps,qrProfile));
          const changed=structuredClone(result);changed.qrChecks.at(-1).source[field]=typeof changed.qrChecks.at(-1).source[field]==='number'?99:typeof changed.qrChecks.at(-1).source[field]==='boolean'?false:'#other';
          assert.throws(()=>validateVerificationEvidence(changed,steps,qrProfile));
        }
        const noSource=structuredClone(result);delete noSource.qrChecks.at(-1).source;
        assert.throws(()=>validateVerificationEvidence(noSource,steps,qrProfile));
        const stale=structuredClone(steps);stale[13].sourceStep=13;
        assert.throws(()=>validateVerificationEvidence(result,stale,qrProfile));
      }else{assert.equal(result.step,14);assert.equal(result.failureType,'business');}
    }finally{await fixture.cleanup();}
  }
});

test('independent QR plans cannot replace original short/long/empty baseline or forge source',()=>{
  const full=qrSteps();assert.equal(full.length,14);
  for(const mutate of [
    steps=>{delete steps[11].afterStep;},
    steps=>{steps[13].sourceStep=6;},
    steps=>{steps[13].sourceStep=14;},
    steps=>{steps[13].value='其他内容';},
    steps=>{steps.splice(12,0,{action:'fill',selector:'#input',value:'历史回填一二三'});},
    steps=>{steps.splice(12,0,{action:'reload'});},
  ]){const steps=structuredClone(full);mutate(steps);assert.throws(()=>validateVerificationPlan(steps,qrProfile));}
  const extra=full.slice(9).map(s=>({...s,...(s.afterStep?{afterStep:s.afterStep-9}:{}),...(s.sourceStep?{sourceStep:s.sourceStep-9}:{})}));
  assert.throws(()=>validateVerificationPlan(extra,qrProfile));
  for(const key of ['afterStep','sourceStep'])assert.throws(()=>validateVerificationPlan([{action:'count',selector:'#x',value:1,[key]:1}],general));
});

test.after(async()=>{
  const reportDir=process.env.INPUT_ASSERT_REPORT_DIR||path.resolve('test-results/studio-002-input-assert-implementation');
  await fs.mkdir(reportDir,{recursive:true});
  const source=await fs.readFile(path.join(productRoot,'server/verify.mjs'));
  await fs.writeFile(path.join(reportDir,'results.json'),JSON.stringify({at:new Date().toISOString(),productRoot,expectedSha,verifierSha256:createHash('sha256').update(source).digest('hex'),scope:'independent synthetic HTML, actual frozen verifier, real isolated headless Edge; no model/Taro/current/native desktop',observations},null,2));
});
