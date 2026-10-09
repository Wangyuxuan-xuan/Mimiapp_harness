import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {startStudio} from '../../server/index.mjs';

const cliFile=fileURLToPath(new URL('../../cli/studio.mjs',import.meta.url));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function until(check){for(let i=0;i<160;i++){if(await check())return;await pause(50);}throw new Error('CLI journey condition timed out');}

// Every CLI process must attach to an authenticated, already running fixture.
// Never auto-start Electron, read an existing profile or use a real model/compiler.
export async function createCliFixture(agent){
 const root=path.resolve(await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qa-cli-journey-')));
 const profile=path.join(root,'profile'),workspace=path.join(root,'workspace'),key=randomBytes(24).toString('hex');
 let saved=null,studio;const children=new Set(),records=[];
 const build=async dir=>{
  for(const relative of ['dist/h5','dist/weapp'])await fs.mkdir(path.join(dir,relative),{recursive:true});
  await fs.writeFile(path.join(dir,'dist/h5/index.html'),'<html><head></head><body>CLI journey fixture</body></html>');
  await fs.writeFile(path.join(dir,'dist/weapp/app.js'),'// explicit fixture, no Taro compiler');
 };
 try{studio=await startStudio({root:workspace,port:0,seed:false,production:true,build,agent,
  credentialStore:{available:true,load:async()=>saved,save:async c=>saved=c,clear:async c=>saved=c}});
 }catch(error){await fs.rm(root,{recursive:true,force:true});throw error;}
 const envAt=(userData=profile,work=workspace)=>{
  const env={...process.env,STUDIO_USER_DATA_DIR:userData,STUDIO_WORKSPACE_DIR:work};
  for(const name of ['STUDIO_URL','STUDIO_EXECUTABLE','ELECTRON_RUN_AS_NODE'])delete env[name];
  return env;
 };
 async function discover(userData,work,url,token){
  assert(path.resolve(userData).startsWith(root+path.sep));
  await fs.mkdir(userData,{recursive:true});await fs.writeFile(path.join(userData,'studio-session-v1.json'),JSON.stringify({version:1,pid:process.pid,url,token,workspace:work}));
 }
 await discover(profile,workspace,studio.url,studio.token);
 async function cli(args,{env=envAt(),input=''}={}){
  assert(!env.STUDIO_URL);
  for(const name of ['STUDIO_USER_DATA_DIR','STUDIO_WORKSPACE_DIR'])assert(path.isAbsolute(env[name])&&path.resolve(env[name]).startsWith(root+path.sep),'CLI journey requires its own absolute profile and workspace');
  // A missing/mismatched fixture must fail before the production fallback path.
  const session=JSON.parse(await fs.readFile(path.join(env.STUDIO_USER_DATA_DIR,'studio-session-v1.json'),'utf8'));
  assert.equal(session.pid,process.pid);assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(session.url));
  const response=await fetch(session.url+'/api/projects',{headers:{'X-Studio-Token':session.token},signal:AbortSignal.timeout(1000)});assert.equal(response.status,200);
  const child=spawn(process.execPath,[cliFile,...args],{env,windowsHide:true,stdio:['pipe','pipe','pipe']});children.add(child);
  let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.stdin.on('error',()=>{});child.stdin.end(input);
  const result=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{child.kill();reject(new Error('CLI journey command timed out'));},15000);
   child.on('error',reject);child.on('close',(code,signal)=>{clearTimeout(timer);children.delete(child);assert(!stdout.includes(key)&&!stderr.includes(key),'stdin key must not reach CLI output');const record={args,code,signal,stdout,stderr};records.push(record);resolve(record);});
  });return {child,result};
 }
 async function command(args,{expected=0,...options}={}){const r=await(await cli(args,options)).result;assert.equal(r.code,expected,JSON.stringify({args,stderr:r.stderr}));return r.stdout.trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));}
 return {root,profile,workspace,key,build,studio,envAt,discover,cli,command,records,get saved(){return saved;},async close(){
  for(const child of children)child.kill();await studio.close();
  // The fixture host has no Electron lease reaper. A killed CLI may leave a dead
  // lease; remove only this fixture root, without claiming native reaper coverage.
  await fs.rm(root,{recursive:true,force:true});
 }};
}
