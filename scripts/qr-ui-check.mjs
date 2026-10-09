import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import QrReader from 'qrcode-reader';
const {base,id}=JSON.parse(await fs.readFile('test-results/qr-project.json','utf8'));
const env={...process.env,STUDIO_URL:base};delete env.ELECTRON_RUN_AS_NODE;
const app=await chromium.launch({channel:'msedge',headless:true});
const checks=[];
try{
 const page=await app.newPage({deviceScaleFactor:3});await page.goto(base);await page.getByRole('button',{name:/文字二维码 · 验收/}).click();const f=page.frameLocator('iframe');
 await f.locator('taro-button-core.btn-primary').click();
 for(const [value,level] of [['I love u','中'],['你好，小芽','高'],[' I love u ','低'],['a'.repeat(100),'较高']]){
  await f.locator('.level-item').filter({hasText:new RegExp('^'+level+'$')}).click();
  await f.locator('textarea').fill(value);await f.locator('taro-button-core.btn-primary').click();
  const shot=await f.locator('.qr-wrap').screenshot();await fs.writeFile('test-results/qr-latest.png',shot);const png=PNG.sync.read(shot);
  const decoded=await new Promise((resolve,reject)=>{const qr=new QrReader();qr.callback=(e,r)=>e?reject(new Error(String(e))):resolve(r.result);qr.decode(png);});
  assert.equal(decoded,value);checks.push('decoded '+value);console.log('PASS decoded',value);
 }
 await f.locator('taro-button-core.btn-ghost').click();await f.locator('taro-button-core.btn-primary').click();await f.getByText(/请先输入文字/).waitFor();checks.push('empty rejected');
 await page.screenshot({path:'test-results/qr-ui.png'});
 await fs.writeFile('test-results/qr-ui-report.json',JSON.stringify({passed:true,checks}));
}catch(e){await fs.writeFile('test-results/qr-ui-report.json',JSON.stringify({passed:false,checks,error:e.message}));throw e;}finally{await app.close();}
