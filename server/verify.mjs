import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import {storageBridge} from './preview-bridge.mjs';
import { chromium } from 'playwright-core';
import jsQR from 'jsqr';
import {PNG} from 'pngjs';
import {createHash} from 'node:crypto';
const planDigest=steps=>createHash('sha256').update(JSON.stringify(steps)).digest('hex');
const isEmptyFeedback=value=>/请输入|请先输入|输入不能为空|内容不能为空|内容为空|不能空白|请填写/.test(value);

// Only parser errors originating from Locator.count(), not application text,
// qualify for the static selector-plan classification.
const selectorParseError=e=>/while parsing (?:css )?selector|Error while parsing selector|Malformed selector/.test(e.message||'');
async function uniqueTarget(page,s,step,signal,target,deadline=Date.now()+4000){
 const loc=target||page.locator(s.selector);let count;
 try{count=await loc.count();for(let poll=0;count===0&&poll<80&&Date.now()<deadline;poll++){signal?.throwIfAborted();await page.waitForTimeout(Math.min(50,Math.max(1,deadline-Date.now())));count=await loc.count();}}
 catch(e){signal?.throwIfAborted();if(page.isClosed()||!page.context().browser()?.isConnected()||!selectorParseError(e))throw e;throw Object.assign(new Error('检查选择器格式无效。'),{failureType:'plan',planKind:'selector-syntax',step,action:s.action,selector:s.selector,matchCount:0,candidates:[],suggestions:[]});}
 if(count===1)return loc;
 const candidates=await loc.evaluateAll((elements,valueMode)=>elements.filter(el=>{const b=el.getBoundingClientRect();if(!b.width||!b.height)return false;for(let n=el;n;n=n.parentElement){const st=getComputedStyle(n);if(Number(st.opacity)===0||st.visibility==='hidden'||st.display==='none')return false;}return true;}).slice(0,6).map(el=>{
  const tag=el.tagName.toLowerCase(),editable=el.matches('input,textarea')||el.isContentEditable||(valueMode&&!!el.querySelector('input,textarea,[contenteditable]'));
  const fullName=(el.getAttribute('aria-label')||(!editable?el.innerText:'')||'').trim().replace(/\s+/g,' '),name=fullName.slice(0,100);
  const id=el.id.slice(0,100),testId=(el.getAttribute('data-testid')||'').slice(0,100),role=(el.getAttribute('role')||({button:'button',input:'textbox',textarea:'textbox',a:'link'}[tag]||'')).slice(0,100);
  const ancestorHints=[];for(let n=el.parentElement;n&&ancestorHints.length<2;n=n.parentElement)ancestorHints.push({tag:n.tagName.toLowerCase(),id:n.id.slice(0,100),testId:(n.getAttribute('data-testid')||'').slice(0,100),role:(n.getAttribute('role')||'').slice(0,100)});
  const options=[];if(id&&id===el.id)options.push('#'+CSS.escape(id));if(testId&&testId===el.getAttribute('data-testid'))options.push('[data-testid='+JSON.stringify(testId)+']');if(name&&name===fullName&&!editable)options.push(tag+':text-is('+JSON.stringify(name)+')',tag+':has-text('+JSON.stringify(name)+')');
  return {tag,role,name,id,testId,ancestorHints,options};
 }),s.action==='value');
 const suggestions=[];for(const candidate of candidates){for(const selector of candidate.options){try{if(await page.locator(selector).count()===1&&await page.locator(selector).and(loc).count()===1){suggestions.push({selector,tag:candidate.tag,role:candidate.role,name:candidate.name});break;}}catch(e){signal?.throwIfAborted();if(page.isClosed()||!page.context().browser()?.isConnected()||!selectorParseError(e))throw e;}}delete candidate.options;}
 throw Object.assign(new Error(count?'单元素检查选择器匹配多个元素；请根据目标语义修正选择器，不能盲取first/nth。':'单元素检查选择器未匹配元素；请核对页面与目标语义。'),{failureType:'plan',planKind:count>1?'selector-ambiguous':'selector-missing',step,action:s.action,selector:s.selector,matchCount:count,candidates,suggestions});
}

// This is a narrow acceptance profile, not a general interpretation of every
// product requirement. Discussion alone never invokes a delivery profile.
export function verificationRequirements(project,prompt){
 const requirements=[project.title,project.memory?.goal,project.memory?.constraints,...(project.memory?.changes||[]).map(c=>c.text),String(prompt||'')];
 let qr=false;
 for(const text of requirements.filter(Boolean)){
  if(/(?:不再做|不需要|不要|取消|移除|放弃)(?:文字|输入生成|生成)?二维码(?:功能|应用|小程序)?(?:[，。；!?！？\s]|$)/.test(text)){qr=false;continue;}
  if(/(?:输入.{0,30}二维码|(?:文字|文本).{0,15}二维码|生成.{0,15}二维码|二维码.{0,30}(?:生成|输入|文字|文本)|(?:qr\s*code|二维码)(?:生成器|小程序|应用))/i.test(text))qr=true;
 }
 return {profile:qr?'text-qr':'general'};
}
export function validateVerificationPlan(steps,requirements={}){
 if(!Array.isArray(steps)||!steps.length||steps.length>20)throw new Error('功能检查需要 1–20 个步骤。');
 for(const s of steps){if(!s||!['click','fill','value','text','count','qr','reload'].includes(s.action)||(s.action!=='reload'&&(typeof s.selector!=='string'||!s.selector.trim()||s.selector.length>300))||String(s.value??'').length>2000)throw new Error('功能检查步骤格式无效。');}
 if(!steps.some(s=>['value','text','count','qr'].includes(s.action)))throw new Error('至少需要一个输入值、业务文本、数量或二维码解码断言。');
 for(const s of steps){if(['fill','value','text','qr'].includes(s.action)&&typeof s.value!=='string')throw new Error('填写与文本断言需要文字值。');if(['text','qr'].includes(s.action)&&!s.value.trim())throw new Error('文本断言不能为空。');if(s.action==='count'&&(!Number.isInteger(s.value)||s.value<0))throw new Error('数量断言需要非负整数。');}
 for(const [i,s] of steps.entries()){
  if(s.afterStep!==undefined&&(s.action!=='value'||!Number.isInteger(s.afterStep)||s.afterStep!==i||steps[i-1]?.action!=='click'))throw new Error('afterStep仅允许value引用紧邻前一步click。');
  if(s.sourceStep!==undefined){const v=steps[i-2];if(s.action!=='qr'||!Number.isInteger(s.sourceStep)||s.sourceStep!==i-1||v?.action!=='value'||v.afterStep!==i-2||steps[i-3]?.action!=='click'||steps[i-1]?.action!=='click'||v.value!==s.value)throw new Error('sourceStep须绑定连续click→因果value→生成click→qr的同一精确值。');}
 }
 if(requirements.profile!=='text-qr')return;
 let lastFill,clicked=false,short=false,long=false,empty=false;const qrSelectors=new Set(steps.filter(s=>s.action==='qr').map(s=>s.selector));
 for(const s of steps){
  if(s.action==='reload'){lastFill=undefined;clicked=false;}
  if(s.action==='fill'){lastFill=s.value;clicked=false;}
  if(s.action==='click'&&lastFill!==undefined)clicked=true;
  if(s.action==='qr'&&s.sourceStep===undefined){
   if(!clicked||s.value!==lastFill)throw new Error('二维码检查必须实际填写文字、点击生成，再解码并逐字匹配同一输入。');
   if(/[\u3400-\u9fff]/.test(s.value)&&s.value.length<=20)short=true;
   if(s.value.length>=120)long=true;
  }
  if(lastFill===''&&clicked&&((s.action==='text'&&isEmptyFeedback(s.value))||(s.action==='count'&&s.value===0&&qrSelectors.has(s.selector))))empty=true;
 }
 if(!short||!long||!empty)throw new Error('文字二维码验收须在同一次检查内包含：短中文输入→生成→解码、至少120字长文输入→生成→解码、空输入→生成→明确提示或二维码数量为0；不能用格子或标题断言代替。');
}
export function validateVerificationEvidence(verification,steps,requirements={}){
 if(verification?.state!=='passed')return;
 validateVerificationPlan(steps,requirements);
 if(steps.some(s=>s.action==='value'||s.sourceStep!==undefined)&&verification.planDigest!==planDigest(steps))throw new Error('输入值证据与本次完整检查计划不匹配。');
 for(const [i,s] of steps.entries()){
  if(s.action==='value'){
   const v=verification.valueChecks?.find(v=>v.step===i+1&&v.selector===s.selector);
   if(!v||v.matched!==true||v.expectedLength!==s.value.length||v.actualLength!==s.value.length||v.afterStep!==s.afterStep||(s.afterStep!==undefined&&(v.beforeEqualsExpected!==false||v.afterEqualsExpected!==true||v.transition!==true||v.clickExecuted!==true)))throw new Error('输入值断言缺少本次只读精确值及点击变化证据。');
  }
  if(s.action==='qr'&&s.sourceStep!==undefined){
   const q=verification.qrChecks?.find(q=>q.step===i+1&&q.selector===s.selector),v=verification.valueChecks?.find(v=>v.step===s.sourceStep);
   if(!q||q.data!==s.value||!q.imageDigest||!q.viewportImageDigest||q.fullyVisible!==true||!v||q.source?.sourceStep!==s.sourceStep||q.source?.afterStep!==v.afterStep||q.source?.selector!==v.selector||q.source?.generateStep!==i||q.source?.beforeGenerateMatched!==true||q.source?.generateClickExecuted!==true)throw new Error('二维码缺少因果输入来源、生成前只读确认与实际生成点击解码证据。');
  }
 }
 if(requirements.profile==='text-qr')for(const [i,s] of steps.entries())if(s.action==='qr'&&!verification.qrChecks?.some(q=>q.step===i+1&&q.data===s.value&&q.imageDigest&&q.viewportImageDigest&&q.fullyVisible===true))throw new Error('二维码检查缺少与输入绑定的实际截图解码证据。');
 if(requirements.profile==='text-qr'&&!emptyAssertions(steps).some(a=>verification.emptyChecks?.some(e=>e.step===a.step&&e.fillStep===a.fillStep&&e.clickStep===a.clickStep&&e.selector===a.selector&&e.action===a.action&&e.expected===a.value&&e.transition===true&&e.before&&e.after&&(a.action==='text'?e.after.visible&&e.after.text.includes(a.value)&&(!e.before.visible||!e.before.text.includes(a.value)):e.before.count>0&&e.after.count===0&&verification.qrChecks.some(q=>q.selector===a.selector&&q.step<a.fillStep)))))throw new Error('空输入检查缺少本次输入/提交引起的可见反馈变化或已验证二维码消失的证据。');
}

function emptyAssertions(steps){
 if(!steps.some(s=>s.action==='qr'))return [];
 const qrSelectors=new Set(steps.filter(s=>s.action==='qr').map(s=>s.selector));
 let fillStep,clickStep;const assertions=[];
 for(const [i,s] of steps.entries()){
  if(s.action==='reload'||s.action==='fill'){fillStep=s.action==='fill'&&s.value===''?i+1:undefined;clickStep=undefined;}
  if(fillStep&&s.action==='click')clickStep=i+1;
  if(fillStep&&clickStep&&((s.action==='text'&&isEmptyFeedback(s.value))||(s.action==='count'&&s.value===0&&qrSelectors.has(s.selector))))assertions.push({...s,step:i+1,fillStep,clickStep});
 }
 return assertions;
}
async function elementState(loc){const count=await loc.count();const visible=count===1&&await loc.isVisible()&&await loc.evaluate(el=>{for(let node=el;node;node=node.parentElement){const style=getComputedStyle(node);if(Number(style.opacity)===0||style.visibility==='hidden'||style.display==='none')return false;}return true;});return {count,visible,text:count===1?await loc.innerText():''};}

// Taro's public Input selector names a host element. Only resolve a unique
// editable child inside that host; never silently pick a different form field.
async function fillEditable(loc,value,{page,s,step,signal}){
 const fill=async editable=>{await editable.fill(value);const actual=await editable.evaluate(el=>el.isContentEditable?el.textContent:el.value);if(actual!==value)throw new Error(`输入内容被截断或改变：实际 ${String(actual).slice(0,200)}；期待 ${value.slice(0,200)}（请检查maxlength及输入处理）。`);};
 await loc.waitFor({state:'attached'});
 if(await loc.evaluate(el=>el.matches('input,textarea,[contenteditable="true"]')))return fill(loc);
 const resolvedSelector=':is(input,textarea,[contenteditable="true"])';
 let editable;try{editable=await uniqueTarget(page,s,step,signal,loc.locator(resolvedSelector));}catch(e){if(e.failureType==='plan')Object.assign(e,{selector:s.selector,resolvedSelector,targetContext:'editable-child'});throw e;}
 await fill(editable);
}

function valueOptions(deadline,signal){signal?.throwIfAborted();const timeout=deadline-Date.now();if(timeout<=0)throw Object.assign(new Error('输入值只读检查已到截止时间。'),{code:'value-deadline',failureType:'business'});return {timeout,signal};}
// Public inputValue only: diagnostic output never contains actual editor text.
async function valueTarget(page,s,step,signal,deadline){
 valueOptions(deadline,signal);const host=await uniqueTarget(page,s,step,signal,undefined,deadline);let loc=host;
 const direct=await host.evaluate(el=>el.matches('input,textarea'),undefined,valueOptions(deadline,signal));
 if(!direct){try{valueOptions(deadline,signal);loc=await uniqueTarget(page,s,step,signal,host.locator(':is(input,textarea)'),deadline);}catch(e){if(e.failureType==='plan')Object.assign(e,{resolvedSelector:':is(input,textarea)',targetContext:'value-child'});throw e;}}
 const supported=await loc.evaluate(el=>el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&!['password','file','hidden','checkbox','radio','button','submit','reset','image'].includes(el.type)),undefined,valueOptions(deadline,signal));
 const visible=async target=>{valueOptions(deadline,signal);return await target.isVisible()&&await target.evaluate(el=>{for(let n=el;n;n=n.parentElement){const st=getComputedStyle(n);if(Number(st.opacity)===0||st.visibility==='hidden'||st.display==='none')return false;}return true;},undefined,valueOptions(deadline,signal));};
 if(!supported||!await visible(host)||!await visible(loc))throw Object.assign(new Error('value需要可见input/textarea或宿主内唯一可见输入；不支持此目标类型。'),{failureType:'plan',planKind:'value-target',step,action:s.action,selector:s.selector});
 return loc;
}
async function readValue(page,s,step,signal,deadline){
 for(;;){
  try{valueOptions(deadline,signal);const loc=await valueTarget(page,s,step,signal,deadline);return await loc.inputValue(valueOptions(deadline,signal));}
  catch(e){
   signal?.throwIfAborted();if(page.isClosed()||!page.context().browser()?.isConnected())throw e;
   if(e.name==='TimeoutError'&&Date.now()>=deadline)throw Object.assign(new Error('输入值只读检查已到截止时间。'),{code:'value-deadline',failureType:'business'});
   // Only a native locator detachment can be retried; application errors and
   // cancellation are not converted to value mismatches.
   if(e.failureType||!/Element (?:is not attached to the DOM|was detached)|element is not attached to the DOM/.test(e.message||''))throw e;
   const {timeout}=valueOptions(deadline,signal);await page.waitForTimeout(Math.min(50,timeout));
  }
 }
}
async function assertValue(page,s,step,signal,before){
 const deadline=Date.now()+4000;let actual;
 do{actual=await readValue(page,s,step,signal,deadline);if(actual===s.value)break;signal?.throwIfAborted();await page.waitForTimeout(Math.min(50,Math.max(1,deadline-Date.now())));}while(Date.now()<deadline);
 const check={step,selector:s.selector,matched:actual===s.value,expectedLength:s.value.length,actualLength:actual.length,...(s.afterStep===undefined?{}:{afterStep:s.afterStep,beforeEqualsExpected:before?.equals,afterEqualsExpected:actual===s.value,transition:before?.equals===false&&actual===s.value,clickExecuted:before?.clickExecuted===true})};
 return check;
}

async function assertQr(loc,expected,signal,page){
 await loc.waitFor({state:'visible'});
 await loc.scrollIntoViewIfNeeded();
 const box=await loc.boundingBox();
 if(!box||box.width>1024||box.height>1024||box.width<1||box.height<1)throw new Error('二维码截图区域须为 1–1024 像素；请定位二维码容器。');
 const viewport=await loc.evaluate(()=>({width:innerWidth,height:innerHeight}));
 if(box.x<0||box.y<0||box.x+box.width>viewport.width||box.y+box.height>viewport.height)throw new Error('二维码未完整显示在手机视口内；请修复大小或布局后检查。');
 let decoded;
 for(let attempt=0;attempt<5;attempt++){
  signal?.throwIfAborted();
  // Decode pixels cropped from the actual whole phone viewport. A locator
  // screenshot can hide an overlay or clipping behavior of the real preview.
  const shot=await page.screenshot({type:'png',fullPage:false,animations:'disabled',timeout:4000});
  if(shot.length>8*1024*1024)throw new Error('二维码截图超过大小限制。');
  const whole=PNG.sync.read(shot),left=Math.floor(box.x),top=Math.floor(box.y),width=Math.ceil(box.x+box.width)-left,height=Math.ceil(box.y+box.height)-top;
  if(whole.width*whole.height>4*1024*1024)throw new Error('二维码截图像素超过限制。');
  const png=new PNG({width,height});PNG.bitblt(whole,png,left,top,width,height,0,0);
  decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);
  if(decoded?.data===expected)return {data:decoded.data,version:decoded.version,width:png.width,height:png.height,imageDigest:createHash('sha256').update(PNG.sync.write(png)).digest('hex'),viewportImageDigest:createHash('sha256').update(shot).digest('hex'),box,fullyVisible:true};
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 if(!decoded)throw new Error('二维码截图无法解码；请使用真实二维码算法并保留白色边距，不能用方格数量代替功能检查。');
 throw new Error(`二维码内容不符：实际 ${decoded.data.slice(0,500)}；期待 ${expected}`);
}
export async function verifyPreview(dir,steps,{signal,initialStorage={},viewport={width:375,height:720}}={}){
 if(!Number.isInteger(viewport.width)||viewport.width<320||viewport.width>1280||!Number.isInteger(viewport.height)||viewport.height<320||viewport.height>1024)throw new Error('检查视口大小无效。');
 validateVerificationPlan(steps);
 signal?.throwIfAborted();let storage={...initialStorage};const app=express();app.use((req,res,next)=>{res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; media-src 'self'; base-uri 'none'; form-action 'none'");next();});app.get('/',async(req,res)=>{const html=await fs.readFile(path.join(dir,'dist/h5/index.html'),'utf8');res.type('html').send(html.replace('<head>','<head>'+storageBridge('verification',storage,0)));});app.use(express.static(path.join(dir,'dist/h5')));const server=await new Promise(r=>{const s=app.listen(0,'127.0.0.1',()=>r(s));});let browser,page,stage='external';const errors=[];let index=-1;const valueChecks=[],valueBefore=new Map(),qrSources=new Map(),qrChecks=[],emptyChecks=[],emptyPlans=emptyAssertions(steps),emptyBefore=new Map();
 try{browser=await chromium.launch({channel:'msedge',headless:true});const abort=()=>browser.close().catch(()=>{});signal?.addEventListener('abort',abort,{once:true});try{page=await browser.newPage({viewport});await page.exposeFunction('__sproutStorage',values=>{storage=values;});await page.addInitScript(()=>window.addEventListener('message',event=>{if(event.data?.type==='sprout-storage')window.__sproutStorage(event.data.values);}));page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.stack||e.message));await page.goto(`http://127.0.0.1:${server.address().port}`,{timeout:15000});stage='business';for(const [i,s] of steps.entries()){index=i;signal?.throwIfAborted();if(s.action==='reload'){await page.waitForTimeout(100);await page.reload();continue;}const loc=['click','fill','text','qr'].includes(s.action)?await uniqueTarget(page,s,i+1,signal):page.locator(s.selector);for(const a of emptyPlans.filter(a=>a.fillStep===i+1))emptyBefore.set(a.step,await elementState(page.locator(a.selector)));if(s.action==='click'){
 const next=steps[i+1];if(next?.action==='value'&&next.afterStep===i+1){const actual=await readValue(page,next,i+2,signal,Date.now()+4000);if(actual===next.value)throw Object.assign(new Error('点击前输入已等于期待值；请准备不同初值再证明变化。'),{failureType:'plan',planKind:'value-initial-equal',step:i+2,action:'value',selector:next.selector});valueBefore.set(i+2,{equals:false,clickExecuted:false});}
 const qr=steps[i+1];if(qr?.action==='qr'&&qr.sourceStep!==undefined){const source=steps[qr.sourceStep-1],evidence=valueChecks.find(v=>v.step===qr.sourceStep);if(!evidence?.transition||await readValue(page,source,qr.sourceStep,signal,Date.now()+4000)!==source.value)throw new Error('生成前输入与已验证因果来源不一致。');qrSources.set(i+2,{sourceStep:qr.sourceStep,afterStep:source.afterStep,selector:source.selector,generateStep:i+1,beforeGenerateMatched:true,generateClickExecuted:false});}
 await loc.click();if(valueBefore.has(i+2))valueBefore.get(i+2).clickExecuted=true;if(qrSources.has(i+2))qrSources.get(i+2).generateClickExecuted=true;
 }if(s.action==='fill')await fillEditable(loc,String(s.value),{page,s,step:i+1,signal});if(s.action==='value'){const check=await assertValue(page,s,i+1,signal,valueBefore.get(i+1));valueChecks.push(check);if(!check.matched)throw new Error(`步骤 ${i+1} 输入值不符（实际长度 ${check.actualLength}，期待长度 ${check.expectedLength}）；未输出输入内容。`);}if(s.action==='qr')qrChecks.push({step:i+1,selector:s.selector,...(s.sourceStep===undefined?{}:{source:qrSources.get(i+1)}),...await assertQr(loc,s.value,signal,page)});if(s.action==='text'){await loc.waitFor({state:'visible'});let actual='';for(let poll=0;poll<80;poll++){actual=await loc.innerText();if(actual.includes(String(s.value)))break;await page.waitForTimeout(50);}if(!actual.includes(String(s.value)))throw new Error(`步骤 ${i+1} 文本不符：实际 ${actual.slice(0,500)}；期待 ${s.value}`);}if(s.action==='count'){let actual=0;for(let poll=0;poll<80;poll++){actual=await loc.count();if(actual===s.value)break;await page.waitForTimeout(50);}if(actual!==Number(s.value))throw new Error(`数量不符：实际 ${actual}；期待 ${s.value}`);}const a=emptyPlans.find(a=>a.step===i+1);if(a){const before=emptyBefore.get(a.step),after=await elementState(loc);const transition=a.action==='text'?after.visible&&after.text.includes(a.value)&&(!before.visible||!before.text.includes(a.value)):before.count>0&&after.count===0&&qrChecks.some(q=>q.selector===a.selector&&q.step<a.fillStep);if(!transition)throw new Error('空输入未引起新的可见错误反馈或已验证二维码消失；常驻提示、隐藏文本或原本不存在的元素不能作为空输入检查。');emptyChecks.push({...a,expected:a.value,before,after,transition});}}await page.waitForTimeout(100);if(errors.length)throw Object.assign(new Error(errors.join('\n').slice(0,3000)),{failureType:'runtime'});return {state:'passed',steps,time:Date.now(),kind:'real-browser',storage,qrChecks,emptyChecks,valueChecks,planDigest:planDigest(steps),viewport};}finally{signal?.removeEventListener('abort',abort);}}
 catch(e){signal?.throwIfAborted();const failureType=(!browser?.isConnected()||page?.isClosed())?'external':errors.length?'runtime':e.failureType||stage;return {state:'failed',failureType,steps,step:e.step||index+1,action:e.action||steps[index]?.action,selector:e.selector||steps[index]?.selector,planKind:e.planKind,resolvedSelector:e.resolvedSelector,targetContext:e.targetContext,matchCount:e.matchCount,candidates:e.candidates,suggestions:e.suggestions,error:e.message.slice(0,3000),runtimeErrors:errors,time:Date.now(),kind:'real-browser',storage,qrChecks,emptyChecks,valueChecks,planDigest:planDigest(steps),viewport};}
 finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
}
