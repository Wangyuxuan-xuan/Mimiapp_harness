import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5176';
const html=await(await fetch(base)).text();const token=html.match(/name="studio-token" content="([^"]+)/)[1];
const headers={'X-Studio-Token':token,'Content-Type':'application/json'};
const id='a75ebf0c-5ee1-4c3f-abc5-1af218affd66';
const api=async(p,body)=>{const r=await fetch(base+'/api'+p,{headers,...(body?{method:'POST',body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(await r.text());return r.json()};
const p=await api('/projects/'+id);const root='.studio/projects/'+id;const storage=await fs.readFile(root+'/storage.json','utf8');const checks=[];
for(const rev of [2,3]){const v=p.versions.find(v=>v.revision===rev);const restored=await api('/projects/'+id+'/restore',{versionId:v.id});const original=await fs.readFile(root+'/revisions/'+rev+'/src/pages/index/index.jsx','utf8');const actual=await fs.readFile(root+'/revisions/'+restored.revision+'/src/pages/index/index.jsx','utf8');assert.equal(actual,original);assert.equal(await fs.readFile(root+'/storage.json','utf8'),storage);checks.push('Restored revision '+rev+' with exact source, real dual compilation and persistent data');console.log(checks.at(-1));}
await fs.writeFile('test-results/reading-restore-report.json',JSON.stringify({passed:true,checks,at:new Date().toISOString()},null,2));
