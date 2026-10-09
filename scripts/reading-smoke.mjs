import {_electron as electron} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const env={...process.env,STUDIO_URL:'http://127.0.0.1:5176'};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:path.resolve('node_modules/electron/dist/electron.exe'),args:[path.resolve('.')],env,timeout:60000});
const checks=[];const pass=s=>{checks.push(s);console.log('PASS '+s)};
try{
 const page=await app.firstWindow();await page.getByRole('button',{name:/阅光 · 读书记录/}).click();const f=page.frameLocator('iframe');await f.getByText('阅光',{exact:true}).waitFor();pass('DeepSeek-generated reading app renders');
 await f.getByText('＋ 添加一本书',{exact:true}).click();await f.getByText('加入书架',{exact:true}).click();await f.getByText('请输入书名',{exact:true}).waitFor();pass('blank title rejected');
 const title='验证阅读'+Date.now().toString().slice(-6);await f.locator('input[placeholder="例如：百年孤独"]').fill(title);await f.locator('input[placeholder="例如：320"]').fill('0');await f.getByText('加入书架',{exact:true}).click();await f.getByText('总页数需要大于 0',{exact:true}).waitFor();pass('zero page count rejected');
 await f.locator('input[placeholder="例如：320"]').fill('10');await f.getByText('加入书架',{exact:true}).click();const card=f.locator('.book-card').filter({hasText:title});await card.waitFor();pass('book created');
 await card.locator('input').fill('11');await card.getByText('记录',{exact:true}).click();await card.getByText('超过总页数啦，最多还能读 10 页',{exact:true}).waitFor();pass('page overflow rejected');
 await card.locator('input').fill('3');await card.getByText('记录',{exact:true}).click();await card.getByText('已读 3 页 / 共 10 页',{exact:true}).waitFor();pass('reading progress updates');
 await page.getByRole('button',{name:'刷新预览',exact:true}).click();await card.getByText('已读 3 页 / 共 10 页',{exact:true}).waitFor();pass('progress persists through refresh');
 await card.locator('input').fill('7');await card.getByText('记录',{exact:true}).click();await card.waitFor({state:'hidden'});await f.locator('.tabs .tab').filter({hasText:'已读完'}).click();await card.getByText('已读 10 页 / 共 10 页',{exact:true}).waitFor();pass('completion moves book to finished list');
 await page.reload();await page.getByRole('button',{name:/阅光 · 读书记录/}).click();await f.locator('.tabs .tab').filter({hasText:'已读完'}).click();await card.getByText('已读 10 页 / 共 10 页',{exact:true}).waitFor();pass('finished state survives full reload');
 if(await page.getByRole('combobox',{name:'切换 DeepSeek 模型'}).inputValue()==='deepseek-v4-pro'){const r=page.waitForResponse(r=>r.url().endsWith('/api/settings')&&r.request().method()==='POST');await page.getByRole('combobox',{name:'切换 DeepSeek 模型'}).selectOption('deepseek-flash');await r;}
 const changed=page.waitForResponse(r=>r.url().endsWith('/api/settings')&&r.request().method()==='POST');await page.getByRole('combobox',{name:'切换 DeepSeek 模型'}).selectOption('deepseek-v4-pro');const settings=await(await changed).json();assert.equal(settings.model,'deepseek-v4-pro');assert.equal(settings.hasKey,true);pass('quick model switch preserves key');
 await page.getByRole('button',{name:'模型与设置',exact:true}).click();const tested=page.waitForResponse(r=>r.url().endsWith('/api/settings/test'),{timeout:45000});await page.getByRole('button',{name:'测试连接',exact:true}).click();assert.equal((await tested).status(),200);await page.getByText('连接成功，模型可以响应请求。',{exact:true}).waitFor();pass('DeepSeek V4 Pro responds through configured endpoint');await page.getByRole('button',{name:'关闭',exact:true}).click();
 await fs.mkdir('test-results',{recursive:true});const zipPath=path.resolve('test-results/deepseek-reading.zip');
 await app.evaluate(({session},dest)=>{globalThis.sproutReadingDownload='pending';session.defaultSession.once('will-download',(_e,item)=>{item.setSavePath(dest);item.once('done',(_e,state)=>{globalThis.sproutReadingDownload=state;});});},zipPath);
 await page.getByRole('button',{name:'导出小程序',exact:true}).click();let state='pending';const end=Date.now()+30000;while(state==='pending'&&Date.now()<end){state=await app.evaluate(()=>globalThis.sproutReadingDownload);if(state==='pending')await new Promise(r=>setTimeout(r,100));}assert.equal(state,'completed');pass('generated mini-program exported');
 await page.screenshot({path:'test-results/deepseek-reading.png',fullPage:true});await fs.writeFile('test-results/deepseek-reading-report.json',JSON.stringify({passed:true,checks,title,at:new Date().toISOString()},null,2));
}catch(e){const page=app.windows()[0];if(page)await page.screenshot({path:'test-results/reading-failure.png'}).catch(()=>{});await fs.writeFile('test-results/deepseek-reading-report.json',JSON.stringify({passed:false,checks,error:e.message},null,2));throw e;}
finally{await app.close();}
