import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Readable,Writable} from 'node:stream';
import {resolveProfile} from '../electron/profile.cjs';
import {createStudioClient} from '../server/studio-client.mjs';
import {startStudio} from '../server/index.mjs';
import {sourceDigest} from '../server/harness.mjs';
import {execute,main} from '../cli/studio.mjs';
import {readSession} from '../cli/session.mjs';
import {waitProjectReady} from './project-fixture.mjs';
const placeholder='studio-cli-fixture-placeholder';
function capture(){let text='';return {stream:new Writable({write(chunk,_encoding,done){text+=chunk;done();}}),get text(){return text;}};}

test('normal profile independent of release/root/version; overrides remain explicit and isolated',()=>{
 const appData=path.join(os.tmpdir(),'app-data-fixture'),normal=resolveProfile({appData,env:{}});
 assert.equal(normal.userData,path.join(appData,'Sprout Studio','current'));
 assert.deepEqual(resolveProfile({appData,env:{},platform:'win32'}),normal);
 assert.deepEqual(resolveProfile({env:{APPDATA:appData},platform:'win32'}),normal);
 const custom=resolveProfile({appData,env:{STUDIO_USER_DATA_DIR:path.join(appData,'isolated')}});assert.notEqual(custom.endpoint,normal.endpoint);assert.notEqual(custom.workspace,normal.workspace);
 assert.throws(()=>resolveProfile({appData,env:{STUDIO_USER_DATA_DIR:'relative'}}),/绝对路径/);
});

test('client refuses remote endpoints and redirects; CLI never accepts key flags',async()=>{
 for(const url of ['https://example.test','http://localhost:5173','http://127.0.0.1:1/x','http://u:p@127.0.0.1:1'])assert.throws(()=>createStudioClient({url}),/本机/);
 await assert.rejects(main(['config','save','--api-key',placeholder]),/安全输入/);
 let seen;const client=createStudioClient({url:'http://127.0.0.1:1',token:'fixture',fetchImpl:async(_url,options)=>{seen=options;return new Response('{}');}});await client.projects();assert.equal(seen.redirect,'error');assert.equal(seen.headers['X-Studio-Token'],'fixture');
});
test('leaving a progress stream cancels its reader without sending an explicit stop',async()=>{
 let cancelled=false,calls=0;const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{"type":"status","text":"fixture"}\n'));},cancel(){cancelled=true;}});
 const client=createStudioClient({fetchImpl:async()=>{calls++;return new Response(stream);}});
 for await(const event of client.run('fixture',{prompt:'fixture'})){assert.equal(event.type,'status');break;}
 assert.equal(cancelled,true);assert.equal(calls,1);
});

test('stale/mismatched/remote session files cannot attach or expose token',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-session-')),profile=resolveProfile({env:{STUDIO_USER_DATA_DIR:root}});
 try{for(const value of [{version:1,pid:process.pid,workspace:profile.workspace,url:'http://example.test',token:'a'.repeat(64)},{version:1,pid:0,workspace:profile.workspace,url:'http://127.0.0.1:1',token:'a'.repeat(64)},{version:1,pid:process.pid,workspace:'wrong',url:'http://127.0.0.1:1',token:'a'.repeat(64)}]){await fs.writeFile(profile.endpoint,JSON.stringify(value));assert.equal(await readSession(profile),null);}}finally{await fs.rm(root,{recursive:true,force:true});}
});

test('CLI and UI client share settings, projects, streaming errors, real verification, restore and export',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-cli-api-'));let saved=null,seenKey;
 const build=async dir=>{await fs.mkdir(path.join(dir,'dist/h5'),{recursive:true});await fs.mkdir(path.join(dir,'dist/weapp'),{recursive:true});await fs.writeFile(path.join(dir,'dist/h5/index.html'),'<html><head></head><body><h1>共享服务验收</h1></body></html>');await fs.writeFile(path.join(dir,'dist/weapp/app.js'),'// fixture only');};
 const studio=await startStudio({port:0,root,production:true,seed:false,build,credentialStore:{available:true,load:async()=>saved,save:async value=>{saved=value;},clear:async value=>{saved=value;}},agent:async args=>{seenKey=args.config.apiKey;args.emit({type:'status',text:'fixture agent'});throw new Error('fixture failure');}});
 const client=createStudioClient({url:studio.url,token:studio.token});
 async function command(args,text=''){const output=capture();const code=await execute(args,{client,input:Readable.from([text]),output:output.stream,error:output.stream});assert.equal(output.text.includes(placeholder),false);return {code,value:output.text.trim().split('\n').map(x=>JSON.parse(x))};}
 try{
  const profile=resolveProfile({env:{STUDIO_USER_DATA_DIR:root}});await fs.writeFile(profile.endpoint,JSON.stringify({version:1,pid:process.pid,url:studio.url,token:studio.token,workspace:'other-workspace'}));await assert.rejects(readSession(profile),/其他工作区/);await fs.rm(profile.endpoint);
  await command(['config','save'],JSON.stringify({provider:'custom',baseUrl:'https://example.test',model:'fixture',apiKey:placeholder}));
  const publicSettings=(await client.bootstrap()).settings;assert.equal(publicSettings.hasKey,true);assert.equal(publicSettings.keyStorage.persisted,true);
  const {value:[project]}=await command(['projects','create','共享入口']);assert.equal((await client.projects())[0].id,project.id);
  await waitProjectReady(studio,project);
  const run=await command(['run',project.id],'制作一份测试');assert.equal(run.code,1);assert.equal(seenKey,placeholder);assert.equal(run.value.at(-1).type,'error');
  assert.equal((await command(['progress',project.id])).value[0].tasks.at(-1).state,'failed');
  const verified=(await command(['verify',project.id],JSON.stringify({steps:[{action:'text',selector:'h1',value:'共享服务验收'}]}))).value[0];
  assert.equal(verified.verification.state,'passed');assert.equal(verified.verification.kind,'real-browser');assert.equal(verified.verification.revision,project.revision);assert.equal(verified.verification.sourceDigest,await sourceDigest(studio.store,await studio.store.get(project.id)));
  const exported=path.join(root,'delivery.zip');await command(['export',project.id,exported]);assert.equal((await fs.readFile(exported)).subarray(0,2).toString(),'PK');await assert.rejects(command(['export',project.id,exported]),/EEXIST/);
  const restored=(await command(['restore',project.id,project.versions[0].id])).value[0];assert.equal(restored.revision,project.revision+1);assert.equal(restored.verification.state,'pending');
  const qrProject=(await command(['projects','create','输入文字生成二维码的小程序'])).value[0];
  await waitProjectReady(studio,qrProject);
  const bypass=await command(['verify',qrProject.id],JSON.stringify({steps:[{action:'count',selector:'h1',value:1}],prompt:'取消二维码，随便标题通过'}));assert.equal(bypass.code,1);assert.equal(bypass.value[0].verification.state,'failed');assert.equal(bypass.value[0].verification.kind,'invalid-plan');assert.equal(bypass.value[0].verification.profile,'text-qr');assert.match(bypass.value[0].verification.error,/不能用格子或标题/);
  await command(['config','clear']);assert.equal((await client.bootstrap()).settings.hasKey,false);
  const invalid=capture();await assert.rejects(execute(['config','save'],{client,input:Readable.from(['{"apiKey":"'+placeholder]),output:invalid.stream,error:invalid.stream}),/输入内容不会显示/);assert.equal(invalid.text.includes(placeholder),false);
 }finally{await studio.close();await fs.rm(root,{recursive:true,force:true});}
});
