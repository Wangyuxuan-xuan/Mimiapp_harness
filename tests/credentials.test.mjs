import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {createCredentialStore} from '../electron/credential-store.cjs';import {startStudio} from '../server/index.mjs';
const placeholder='credential-fixture-placeholder-only';
const config={provider:'custom',baseUrl:'https://example.test/v1',model:'fixture',apiKey:placeholder};
// A test-only native API substitute, not a production encryption fallback.
const cipherKey=randomBytes(32),safeStorage={isEncryptionAvailable:()=>true,encryptString(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',cipherKey,iv),body=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]);},decryptString(value){const decipher=createDecipheriv('aes-256-gcm',cipherKey,value.subarray(0,12));decipher.setAuthTag(value.subarray(12,28));return Buffer.concat([decipher.update(value.subarray(28)),decipher.final()]).toString();}};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('encrypted own vault reopens, clear retains endpoint, isolated userData has no key, no plaintext',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-vault-'));
 try{const make=userData=>createCredentialStore({safeStorage,userData,platform:'win32'}),first=make(dir);await first.save(config);const bytes=await fs.readFile(path.join(dir,'model-credentials-v1.bin'));assert.equal(bytes.includes(Buffer.from(placeholder)),false);assert.deepEqual(await make(dir).load(),config);assert.equal(await make(path.join(dir,'other')).load(),null);await first.clear(config);assert.deepEqual(await make(dir).load(),{...config,apiKey:''});}
 finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('unavailable backend and write failures never write plaintext; corrupt vault retained with fixed error',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-vault-errors-'));
 try{const basic=createCredentialStore({safeStorage:{...safeStorage,getSelectedStorageBackend:()=> 'basic_text'},userData:dir,platform:'linux'});assert.equal(basic.available,false);await assert.rejects(basic.save(config),/不可用/);assert.deepEqual(await fs.readdir(dir),[]);
  const broken=createCredentialStore({safeStorage,userData:dir,platform:'win32',fileSystem:{...fs,rename:async()=>{throw new Error(placeholder);}}});await assert.rejects(broken.save(config),/写入失败/);assert.deepEqual(await fs.readdir(dir),[]);
  const file=path.join(dir,'model-credentials-v1.bin');await fs.writeFile(file,Buffer.from('invalid-ciphertext'));const vault=createCredentialStore({safeStorage,userData:dir,platform:'win32'});await assert.rejects(vault.load(),/原加密文件已保留/);assert.equal((await fs.readFile(file)).toString(),'invalid-ciphertext');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
async function fixture(options={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-credential-api-'));const studio=await startStudio({root,port:0,production:true,seed:false,...options});
 const headers={'X-Studio-Token':studio.token,'Content-Type':'application/json'};
 return {root,studio,request:(route,body,method='POST')=>fetch(studio.url+'/api'+route,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})}),close:async()=>{await studio.close();await fs.rm(root,{recursive:true,force:true});}};
}
test('desktop settings persist and restore without exposing key; same endpoint retains, new endpoint clears',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-credential-api-vault-'));const vault=()=>createCredentialStore({safeStorage,userData:dir,platform:'win32'});let app;
 try{app=await fixture({credentialStore:vault()});const response=await app.request('/settings',config),publicConfig=await response.json();assert.equal(publicConfig.hasKey,true);assert.equal(publicConfig.keyStorage.persisted,true);assert.equal(JSON.stringify(publicConfig).includes(placeholder),false);await app.request('/settings',{...config,model:'changed',apiKey:''});await app.close();app=await fixture({credentialStore:vault()});const boot=await(await app.request('/bootstrap',undefined,'GET')).json();assert.equal(boot.settings.hasKey,true);assert.equal(boot.settings.model,'changed');await app.request('/settings',{...config,baseUrl:'https://different.test/v1',apiKey:''});assert.equal((await vault().load()).apiKey,'');await app.request('/settings',{...config,baseUrl:'https://different.test/v1'});await app.request('/settings/key',undefined,'DELETE');assert.deepEqual(await vault().load(),{...config,baseUrl:'https://different.test/v1',apiKey:''});}
 finally{if(app)await app.close();await fs.rm(dir,{recursive:true,force:true});}
});
test('failed save retains effective configuration, reports fixed error and closing drains failure',async()=>{
 const gate=deferred(),entered=deferred();const app=await fixture({credentialStore:{available:true,load:async()=>null,save:async()=>{entered.resolve();await gate.promise;throw new Error(placeholder);},clear:async()=>{}}});
 try{const save=app.request('/settings',config);await entered.promise;let closed=false;const closing=app.studio.close().then(()=>{closed=true;});await new Promise(r=>setTimeout(r,30));assert.equal(closed,false);gate.resolve();const response=await save;assert.equal(response.status,400);const error=await response.text();assert.match(error,/写入失败/);assert.equal(error.includes(placeholder),false);await closing;}
 finally{gate.resolve();await fs.rm(app.root,{recursive:true,force:true});}
});
test('run waits accepted save and uses newly committed key; clear during run is rejected',async()=>{
 const gate=deferred(),entered=deferred(),agentEntered=deferred(),agentRelease=deferred();let captured;
 const app=await fixture({credentialStore:{available:true,load:async()=>null,save:async()=>{entered.resolve();await gate.promise;},clear:async()=>{}},agent:async args=>{captured=args.config;agentEntered.resolve();await agentRelease.promise;return args.project;}});
 try{const project=await app.studio.store.create('serialized');const saving=app.request('/settings',config);await entered.promise;const running=app.request(`/projects/${project.id}/run`,{prompt:'test only'});await new Promise(r=>setTimeout(r,30));assert.equal(captured,undefined);gate.resolve();assert.equal((await saving).status,200);await agentEntered.promise;assert.equal(captured.apiKey,placeholder);assert.equal((await app.request('/settings/key',undefined,'DELETE')).status,400);agentRelease.resolve();await(await running).text();}
 finally{gate.resolve();agentRelease.resolve();await app.close();}
});
test('concurrent save then clear is ordered; node development explicitly remains memory-only',async()=>{
 let saved=null;const order=[];const adapter={available:true,load:async()=>null,save:async value=>{await new Promise(r=>setTimeout(r,30));saved={...value};order.push('save');},clear:async value=>{saved={...value,apiKey:''};order.push('clear');}};const app=await fixture({credentialStore:adapter});
 try{const saving=app.request('/settings',config);await new Promise(r=>setTimeout(r,10));const clearing=app.request('/settings/key',undefined,'DELETE');await saving;await clearing;assert.deepEqual(order,['save','clear']);assert.equal(saved.apiKey,'');}
 finally{await app.close();}
 const dev=await fixture();try{const result=await(await dev.request('/settings',config)).json();assert.equal(result.keyStorage.mode,'memory');assert.equal(result.keyStorage.persisted,false);assert.equal((await fs.readFile(path.join(dev.root,'settings.json'),'utf8')).includes(placeholder),false);}finally{await dev.close();}
});
