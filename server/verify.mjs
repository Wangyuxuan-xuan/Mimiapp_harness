import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import {storageBridge} from './preview-bridge.mjs';
import { chromium } from 'playwright-core';
import jsQR from 'jsqr';
import {PNG} from 'pngjs';

// Taro's public Input selector names a host element. Only resolve a unique
// editable child inside that host; never silently pick a different form field.
async function fillEditable(loc,value){
 await loc.waitFor({state:'attached'});
 if(await loc.evaluate(el=>el.matches('input,textarea,[contenteditable="true"]')))return loc.fill(value);
 const editable=loc.locator('input,textarea,[contenteditable="true"]');
 // Taro attaches its editable child after the host; wait for hydration, while
 // retaining the same unique-child constraint throughout the bounded wait.
 let count=await editable.count();
 for(let attempt=0;count===0&&attempt<80;attempt++){
  await new Promise(resolve=>setTimeout(resolve,50));count=await editable.count();
 }
 if(count!==1)throw new Error(`填写选择器须指向可编辑元素或含唯一输入框的组件；内部输入框数量：${count}。请检查选择器。`);
 await editable.fill(value);
}

async function assertQr(loc,expected,signal){
 await loc.waitFor({state:'visible'});
 const box=await loc.boundingBox();
 if(!box||box.width>1024||box.height>1024||box.width<1||box.height<1)throw new Error('二维码截图区域须为 1–1024 像素；请定位二维码容器。');
 let decoded;
 for(let attempt=0;attempt<5;attempt++){
  signal?.throwIfAborted();
  const shot=await loc.screenshot({type:'png',animations:'disabled',timeout:4000});
  if(shot.length>8*1024*1024)throw new Error('二维码截图超过大小限制。');
  const png=PNG.sync.read(shot);
  if(png.width*png.height>4*1024*1024)throw new Error('二维码截图像素超过限制。');
  decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);
  if(decoded?.data===expected)return {data:decoded.data,version:decoded.version,width:png.width,height:png.height};
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 if(!decoded)throw new Error('二维码截图无法解码；请使用真实二维码算法并保留白色边距，不能用方格数量代替功能检查。');
 throw new Error(`二维码内容不符：实际 ${decoded.data.slice(0,500)}；期待 ${expected}`);
}
export async function verifyPreview(dir,steps,{signal,initialStorage={},viewport={width:375,height:720}}={}){
 if(!Number.isInteger(viewport.width)||viewport.width<320||viewport.width>1280||!Number.isInteger(viewport.height)||viewport.height<320||viewport.height>1024)throw new Error('检查视口大小无效。');
 if(!Array.isArray(steps)||!steps.length||steps.length>20)throw new Error('功能检查需要 1–20 个步骤。');
 for(const s of steps){if(!['click','fill','text','count','qr','reload'].includes(s.action)||(s.action!=='reload'&&(typeof s.selector!=='string'||s.selector.length>300))||String(s.value??'').length>2000)throw new Error('功能检查步骤格式无效。');}
 if(!steps.some(s=>['text','count','qr'].includes(s.action)))throw new Error('至少需要一个业务文本、数量或二维码解码断言。');for(const s of steps){if(['fill','text','qr'].includes(s.action)&&typeof s.value!=='string')throw new Error('填写与文本断言需要文字值。');if(['text','qr'].includes(s.action)&&!s.value.trim())throw new Error('文本断言不能为空。');if(s.action==='count'&&(!Number.isInteger(s.value)||s.value<0))throw new Error('数量断言需要非负整数。');}
 signal?.throwIfAborted();let storage={...initialStorage};const app=express();app.use((req,res,next)=>{res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; media-src 'self'; base-uri 'none'; form-action 'none'");next();});app.get('/',async(req,res)=>{const html=await fs.readFile(path.join(dir,'dist/h5/index.html'),'utf8');res.type('html').send(html.replace('<head>','<head>'+storageBridge('verification',storage,0)));});app.use(express.static(path.join(dir,'dist/h5')));const server=await new Promise(r=>{const s=app.listen(0,'127.0.0.1',()=>r(s));});let browser;const errors=[];let index=-1;const qrChecks=[];
 try{browser=await chromium.launch({channel:'msedge',headless:true});const abort=()=>browser.close().catch(()=>{});signal?.addEventListener('abort',abort,{once:true});try{const page=await browser.newPage({viewport});await page.exposeFunction('__sproutStorage',values=>{storage=values;});await page.addInitScript(()=>window.addEventListener('message',event=>{if(event.data?.type==='sprout-storage')window.__sproutStorage(event.data.values);}));page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.stack||e.message));await page.goto(`http://127.0.0.1:${server.address().port}`,{timeout:15000});for(const [i,s] of steps.entries()){index=i;signal?.throwIfAborted();if(s.action==='reload'){await page.waitForTimeout(100);await page.reload();continue;}const loc=page.locator(s.selector);if(s.action==='click')await loc.click();if(s.action==='fill')await fillEditable(loc,String(s.value));if(s.action==='qr')qrChecks.push({step:i+1,...await assertQr(loc,s.value,signal)});if(s.action==='text'){let actual='';for(let poll=0;poll<80;poll++){actual=await loc.innerText();if(actual.includes(String(s.value)))break;await page.waitForTimeout(50);}if(!actual.includes(String(s.value)))throw new Error(`步骤 ${i+1} 文本不符：实际 ${actual.slice(0,500)}；期待 ${s.value}`);}if(s.action==='count'){let actual=0;for(let poll=0;poll<80;poll++){actual=await loc.count();if(actual===s.value)break;await page.waitForTimeout(50);}if(actual!==Number(s.value))throw new Error(`数量不符：实际 ${actual}；期待 ${s.value}`);}}await page.waitForTimeout(100);if(errors.length)throw new Error(errors.join('\n').slice(0,3000));return {state:'passed',steps,time:Date.now(),kind:'real-browser',storage,qrChecks,viewport};}finally{signal?.removeEventListener('abort',abort);}}
 catch(e){return {state:'failed',steps,step:index+1,error:e.message.slice(0,3000),runtimeErrors:errors,time:Date.now(),kind:'real-browser',storage,qrChecks,viewport};}
 finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
}
