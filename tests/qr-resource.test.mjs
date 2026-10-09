import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {Store,readSources,writeSource,readableSourcePath,validateSource} from '../server/store.mjs';
import {digestSources} from '../server/harness.mjs';
test('fixed QR resource is snapshotted, hashed, readable but not writable and restored exactly',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qr-snapshot-'));const store=new Store(root);
 try{await store.init();const project=await store.create('resource snapshot'),first=await store.draft(project.id),file='src/vendor/qr/index.js';
  const original=await readSources(first);assert.ok(original[file]);assert.equal(Object.keys(original).filter(k=>k.startsWith('src/vendor/qr/')).length,12);
  assert.equal(readableSourcePath(file),file);assert.throws(()=>readableSourcePath('src/vendor/qr/../secret.js'));
  await assert.rejects(writeSource(first,file,'malicious'));assert.throws(()=>validateSource('src/pages/index/index.jsx',"import x from '../../vendor/qr/core/index.js'"));
  validateSource('src/pages/index/index.jsx',"import {generateQr} from '../../vendor/qr/index.js'");
  await store.commit(project,first,'original');const snapshot=project.versions[0].files;
  const second=await store.draft(project.id);await fs.appendFile(path.join(second,file),'\n// test-only changed fixed resource');
  assert.notEqual(digestSources(await readSources(second)),digestSources(snapshot));await store.commit(project,second,'changed fixture');
  const restored=await store.draft(project.id,snapshot);assert.deepEqual(await readSources(restored),snapshot);
  const old=Object.fromEntries(Object.entries(snapshot).filter(([k])=>!k.startsWith('src/vendor/qr/')));const legacy=await store.draft(project.id,old);assert.ok((await readSources(legacy))[file]);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
