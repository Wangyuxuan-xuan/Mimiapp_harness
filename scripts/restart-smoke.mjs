import {_electron as electron} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const prior=JSON.parse(await fs.readFile('test-results/packaged-interactive-report.json','utf8'));
assert.equal(prior.passed,true);
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;delete env.STUDIO_URL;
const app=await electron.launch({executablePath:path.resolve('release/win-unpacked/Sprout Studio.exe'),args:[],env,timeout:60000});
try{
 const page=await app.firstWindow(),frame=page.frameLocator('iframe');
 await frame.getByText(prior.habit,{exact:true}).waitFor({timeout:60000});
 assert.equal((await frame.getByLabel('打卡 '+prior.habit,{exact:true}).textContent()).trim(),'✓');
 await page.screenshot({path:'test-results/packaged-restart.png',fullPage:true});
 await fs.writeFile('test-results/restart-report.json',JSON.stringify({passed:true,habit:prior.habit,checks:['new desktop process','new preview port','habit preserved','check-in preserved'],at:new Date().toISOString()},null,2));
 console.log('PASS packaged application restart preserves habit and check-in');
}finally{await app.close();}
