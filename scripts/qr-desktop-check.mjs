import {_electron as electron} from 'playwright-core';import path from 'node:path';import fs from 'node:fs/promises';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;delete env.STUDIO_URL;
const timeout=setTimeout(()=>process.exit(2),45000);
const app=await electron.launch({executablePath:path.resolve('release-qr-fix/win-unpacked/Sprout Studio.exe'),args:['--user-data-dir='+path.resolve('.test-qr-desktop')],env,timeout:20000});
try{const page=await app.firstWindow({timeout:20000});await page.getByRole('button',{name:'模型与设置',exact:true}).waitFor({timeout:20000});await page.screenshot({path:'test-results/qr-package-start.png'});await fs.writeFile('test-results/qr-package-start.json',JSON.stringify({passed:true,url:page.url()}));console.log('PASS updated desktop starts');}finally{await app.close();clearTimeout(timeout);}
