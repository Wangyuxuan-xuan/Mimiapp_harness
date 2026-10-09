#!/usr/bin/env node
// Local regression only. No Taro build, desktop packaging or commercial model.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tiers={
 native:['tests/qa/native-config-upgrade.check.mjs'],
 cli:['tests/qa/cli-journey.test.mjs'],
 preview:['tests/qa/preview-journey.test.mjs'],
 qr:['tests/qa/qr-delivery.test.mjs'],
 core:['tests/agent-budget.test.mjs','tests/studio-preview.test.mjs','tests/qa/cli-journey.test.mjs'],
 repair:['tests/repair-loop.test.mjs'],
 handoff:['tests/studio-integration.test.mjs'],
 browser:['tests/qa/preview-journey.test.mjs','tests/qa/qr-delivery.test.mjs','tests/verify-empty-feedback.test.mjs','tests/studio-integration.test.mjs'],
};
tiers.delivery=[...new Set([...tiers.core,...tiers.repair,...tiers.browser])];
const tier=process.argv[2];
if(!tier||tier==='help'||tier==='--help'){
 console.log('node scripts/studio-qa.mjs <cli|preview|qr|core|repair|handoff|browser|delivery|native>\nLocal fixtures + real Edge where specified; no commercial model/Taro/package.\npreview/browser/delivery require an explicitly prepared Vite dist (npm run build).\nnative is a separate Windows desktop check of the fixed studio2-r1 package using isolated placeholder credentials; excluded from delivery.\nReal model journey: docs/studio-regression.md and docs/coordination/qa/STUDIO-002-final-execution.md; explicit owner approval required.');
 process.exit(0);
}
if(!tiers[tier]||process.argv.length!==3)throw Error('Unknown regression tier; run help');
// Do not accidentally inherit an attachment to a user Studio profile/service.
for(const key of ['STUDIO_URL','STUDIO_USER_DATA_DIR','STUDIO_WORKSPACE_DIR','STUDIO_EXECUTABLE','STUDIO_CLI_LEASE','STUDIO_CLI_PARENT_PID'])if(process.env[key])throw Error(`Unset ${key} before isolated regression`);
for(const file of tiers[tier])await fs.access(path.join(root,file));
if(['preview','browser','delivery'].includes(tier)){
 try{await fs.access(path.join(root,'dist/index.html'));}catch{throw Error('Prepare Vite dist explicitly with npm run build; this runner never builds it');}
}
console.log(JSON.stringify({tier,files:tiers[tier],scope:tier==='native'?'fixed studio2-r1 package; same product across directories; isolated native encrypted placeholder configuration; no real model or Taro compilation':'local isolated fixtures; real Edge in browser cases; no real model or Taro compilation'}));
const args=tier==='native'?tiers[tier]:['--test','--test-concurrency=1','--test-timeout=90000',...tiers[tier]];
const child=spawn(process.execPath,args,{cwd:root,env:process.env,stdio:'inherit',windowsHide:true});
child.once('error',()=>{console.error('QA runner could not start');process.exitCode=1;});
child.once('exit',(code,signal)=>{process.exitCode=signal?1:code??1;});
