import {_electron as electron} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const packaged=process.argv.includes('--packaged');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
if(!packaged)env.STUDIO_URL='http://127.0.0.1:5176';else delete env.STUDIO_URL;
const app=await electron.launch({executablePath:path.resolve(packaged?'release/win-unpacked/Sprout Studio.exe':'node_modules/electron/dist/electron.exe'),args:packaged?[]:[path.resolve('.')],env,timeout:60000});
const checks=[];const check=(name)=>{checks.push(name);console.log('PASS '+name)};
try{
 const page=await app.firstWindow();await page.getByRole('button',{name:'模型与设置',exact:true}).waitFor({timeout:180000});
 const frame=page.frameLocator('iframe');await frame.getByText('好好喝水',{exact:true}).waitFor({timeout:180000});check('real compiled mini-program renders in desktop');
 const water=frame.getByLabel('打卡 好好喝水',{exact:true});const before=await water.textContent();await water.click();assert.notEqual(await water.textContent(),before);check('check-in changes state');
 await frame.getByText('＋ 添加一个小习惯',{exact:true}).click();
 await frame.getByText('开始坚持',{exact:true}).click();assert.equal(await frame.getByText('种下一个小习惯',{exact:false}).count(),1);check('empty input cannot create habit');
 const habit='验证习惯'+Date.now().toString().slice(-6);await frame.getByRole('textbox',{name:'比如：每天早睡一点'}).fill(habit);await frame.getByText('开始坚持',{exact:true}).click();await frame.getByText(habit,{exact:true}).waitFor();check('new habit added from form');
 await frame.getByLabel('打卡 '+habit,{exact:true}).click();await frame.getByText('小成就',{exact:true}).click();await frame.getByText('最近七天',{exact:true}).waitFor();assert.equal(await frame.locator('.stat-row').count(),7);check('seven-day statistics render');
 await page.getByRole('button',{name:'刷新预览',exact:true}).click();await frame.getByText(habit,{exact:true}).waitFor();assert.equal((await frame.getByLabel('打卡 '+habit,{exact:true}).textContent()).trim(),'✓');check('data and check-in persist through preview reload');
 await page.reload();await page.getByRole('button',{name:'模型与设置',exact:true}).waitFor();await frame.getByText(habit,{exact:true}).waitFor();check('data survives entire desktop page reload');
 await page.getByRole('button',{name:'代码',exact:true}).click();await page.locator('.code-panel').getByText(/import React/).waitFor();assert.match(await page.locator('.code-panel').innerText(),/import/);check('source code viewer works');
 await page.getByRole('button',{name:'预览',exact:true}).click();await frame.getByText(habit,{exact:true}).waitFor();
 await fs.mkdir('test-results',{recursive:true});const zipPath=path.resolve('test-results',packaged?'packaged-sample.zip':'sample-export.zip');
 await app.evaluate(({session},savePath)=>{globalThis.sproutTestDownload='pending';session.defaultSession.once('will-download',(_e,item)=>{item.setSavePath(savePath);item.once('done',(_event,state)=>{globalThis.sproutTestDownload=state;});});},zipPath);
 await page.getByRole('button',{name:'导出小程序',exact:true}).click();
 const deadline=Date.now()+30000;let state='pending';while(state==='pending'&&Date.now()<deadline){state=await app.evaluate(()=>globalThis.sproutTestDownload);if(state==='pending')await new Promise(r=>setTimeout(r,100));}assert.equal(state,'completed');
 const zip=await fs.readFile(zipPath);assert.equal(zip.subarray(0,2).toString(),'PK');check('actual mini-program ZIP exported');
 await page.screenshot({path:'test-results/'+(packaged?'packaged-interactive':'interactive')+'.png',fullPage:true});
 await fs.writeFile('test-results/'+(packaged?'packaged-interactive':'interactive')+'-report.json',JSON.stringify({passed:true,checks,habit,at:new Date().toISOString()},null,2));
}catch(e){await fs.mkdir('test-results',{recursive:true});const page=app.windows()[0];if(page){await page.screenshot({path:'test-results/interactive-failure.png'}).catch(()=>{});console.log((await page.locator('body').innerText()).slice(-4500));}await fs.writeFile('test-results/'+(packaged?'packaged-interactive':'interactive')+'-report.json',JSON.stringify({passed:false,checks,error:e.message},null,2));throw e;}
finally{await app.close();}
