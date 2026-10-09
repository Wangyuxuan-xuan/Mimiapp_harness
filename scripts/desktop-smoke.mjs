import {_electron as electron} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const env={...process.env,STUDIO_URL:process.env.STUDIO_URL||'http://127.0.0.1:5176'};delete env.ELECTRON_RUN_AS_NODE;
const desktop=await electron.launch({executablePath:path.resolve('node_modules/electron/dist/electron.exe'),args:[path.resolve('.')],env,timeout:60000});
try{
  const page=await desktop.firstWindow();await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button',{name:'模型与设置',exact:true}).waitFor();
  const windows=await desktop.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({title:w.getTitle(),visible:w.isVisible(),preferences:{nodeIntegration:w.webContents.getLastWebPreferences().nodeIntegration,contextIsolation:w.webContents.getLastWebPreferences().contextIsolation,sandbox:w.webContents.getLastWebPreferences().sandbox}})));
  assert.ok(windows.some(w=>w.visible));assert.equal(windows[0].preferences.nodeIntegration,false);assert.equal(windows[0].preferences.contextIsolation,true);assert.equal(windows[0].preferences.sandbox,true);
  await page.locator('iframe').waitFor();const frame=page.frameLocator('iframe');await frame.locator('body').waitFor();
  await fs.mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  await fs.writeFile('test-results/desktop-report.json',JSON.stringify({passed:true,windows,url:page.url()},null,2));console.log('Desktop window loaded; renderer isolation verified; screenshot saved.');
}finally{await desktop.close();}
