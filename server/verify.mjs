import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import {storageBridge} from './preview-bridge.mjs';
import { chromium } from 'playwright-core';
import jsQR from 'jsqr';
import {PNG} from 'pngjs';
import {createHash} from 'node:crypto';

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
 for(const s of steps){if(!s||!['click','fill','text','count','qr','reload'].includes(s.action)||(s.action!=='reload'&&(typeof s.selector!=='string'||!s.selector.trim()||s.selector.length>300))||String(s.value??'').length>2000)throw new Error('功能检查步骤格式无效。');}
 if(!steps.some(s=>['text','count','qr'].includes(s.action)))throw new Error('至少需要一个业务文本、数量或二维码解码断言。');
 for(const s of steps){if(['fill','text','qr'].includes(s.action)&&typeof s.value!=='string')throw new Error('填写与文本断言需要文字值。');if(['text','qr'].includes(s.action)&&!s.value.trim())throw new Error('文本断言不能为空。');if(s.action==='count'&&(!Number.isInteger(s.value)||s.value<0))throw new Error('数量断言需要非负整数。');}
 if(requirements.profile!=='text-qr')return;
 let lastFill,clicked=false,short=false,long=false,empty=false;const qrSelectors=new Set(steps.filter(s=>s.action==='qr').map(s=>s.selector));
 for(const s of steps){
  if(s.action==='reload'){lastFill=undefined;clicked=false;}
  if(s.action==='fill'){lastFill=s.value;clicked=false;}
  if(s.action==='click'&&lastFill!==undefined)clicked=true;
  if(s.action==='qr'){
   if(!clicked||s.value!==lastFill)throw new Error('二维码检查必须实际填写文字、点击生成，再解码并逐字匹配同一输入。');
   if(/[\u3400-\u9fff]/.test(s.value)&&s.value.length<=20)short=true;
   if(s.value.length>=120)long=true;
  }
  if(lastFill===''&&clicked&&((s.action==='text'&&/请输入|输入不能为空|内容不能为空|内容为空|不能空白|请填写/.test(s.value))||(s.action==='count'&&s.value===0&&qrSelectors.has(s.selector))))empty=true;
 }
 if(!short||!long||!empty)throw new Error('文字二维码验收须在同一次检查内包含：短中文输入→生成→解码、至少120字长文输入→生成→解码、空输入→生成→明确提示或二维码数量为0；不能用格子或标题断言代替。');
}
export function validateVerificationEvidence(verification,steps,requirements={}){
 if(verification?.state!=='passed')return;
 if(requirements.profile==='text-qr')for(const [i,s] of steps.entries())if(s.action==='qr'&&!verification.qrChecks?.some(q=>q.step===i+1&&q.data===s.value&&q.imageDigest&&q.viewportImageDigest&&q.fullyVisible===true))throw new Error('二维码检查缺少与输入绑定的实际截图解码证据。');
}

// Taro's public Input selector names a host element. Only resolve a unique
// editable child inside that host; never silently pick a different form field.
async function fillEditable(loc,value){
 const fill=async editable=>{await editable.fill(value);const actual=await editable.evaluate(el=>el.isContentEditable?el.textContent:el.value);if(actual!==value)throw new Error(`输入内容被截断或改变：实际 ${String(actual).slice(0,200)}；期待 ${value.slice(0,200)}（请检查maxlength及输入处理）。`);};
 await loc.waitFor({state:'attached'});
 if(await loc.evaluate(el=>el.matches('input,textarea,[contenteditable="true"]')))return fill(loc);
 const editable=loc.locator('input,textarea,[contenteditable="true"]');
 // Taro attaches its editable child after the host; wait for hydration, while
 // retaining the same unique-child constraint throughout the bounded wait.
 let count=await editable.count();
 for(let attempt=0;count===0&&attempt<80;attempt++){
  await new Promise(resolve=>setTimeout(resolve,50));count=await editable.count();
 }
 if(count!==1)throw new Error(`填写选择器须指向可编辑元素或含唯一输入框的组件；内部输入框数量：${count}。请检查选择器。`);
 await fill(editable);
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
 signal?.throwIfAborted();let storage={...initialStorage};const app=express();app.use((req,res,next)=>{res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; media-src 'self'; base-uri 'none'; form-action 'none'");next();});app.get('/',async(req,res)=>{const html=await fs.readFile(path.join(dir,'dist/h5/index.html'),'utf8');res.type('html').send(html.replace('<head>','<head>'+storageBridge('verification',storage,0)));});app.use(express.static(path.join(dir,'dist/h5')));const server=await new Promise(r=>{const s=app.listen(0,'127.0.0.1',()=>r(s));});let browser;const errors=[];let index=-1;const qrChecks=[];
 try{browser=await chromium.launch({channel:'msedge',headless:true});const abort=()=>browser.close().catch(()=>{});signal?.addEventListener('abort',abort,{once:true});try{const page=await browser.newPage({viewport});await page.exposeFunction('__sproutStorage',values=>{storage=values;});await page.addInitScript(()=>window.addEventListener('message',event=>{if(event.data?.type==='sprout-storage')window.__sproutStorage(event.data.values);}));page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.stack||e.message));await page.goto(`http://127.0.0.1:${server.address().port}`,{timeout:15000});for(const [i,s] of steps.entries()){index=i;signal?.throwIfAborted();if(s.action==='reload'){await page.waitForTimeout(100);await page.reload();continue;}const loc=page.locator(s.selector);if(s.action==='click')await loc.click();if(s.action==='fill')await fillEditable(loc,String(s.value));if(s.action==='qr')qrChecks.push({step:i+1,...await assertQr(loc,s.value,signal,page)});if(s.action==='text'){let actual='';for(let poll=0;poll<80;poll++){actual=await loc.innerText();if(actual.includes(String(s.value)))break;await page.waitForTimeout(50);}if(!actual.includes(String(s.value)))throw new Error(`步骤 ${i+1} 文本不符：实际 ${actual.slice(0,500)}；期待 ${s.value}`);}if(s.action==='count'){let actual=0;for(let poll=0;poll<80;poll++){actual=await loc.count();if(actual===s.value)break;await page.waitForTimeout(50);}if(actual!==Number(s.value))throw new Error(`数量不符：实际 ${actual}；期待 ${s.value}`);}}await page.waitForTimeout(100);if(errors.length)throw new Error(errors.join('\n').slice(0,3000));return {state:'passed',steps,time:Date.now(),kind:'real-browser',storage,qrChecks,viewport};}finally{signal?.removeEventListener('abort',abort);}}
 catch(e){return {state:'failed',steps,step:index+1,error:e.message.slice(0,3000),runtimeErrors:errors,time:Date.now(),kind:'real-browser',storage,qrChecks,viewport};}
 finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
}
