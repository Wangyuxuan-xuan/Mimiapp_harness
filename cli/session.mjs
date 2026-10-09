import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {resolveProfile} from '../electron/profile.cjs';
import {createStudioClient} from '../server/studio-client.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

export async function readSession(profile,{alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}}}={}){
 try{
  const stat=await fs.lstat(profile.endpoint);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16384)return null;
  const value=JSON.parse(await fs.readFile(profile.endpoint,'utf8'));
  if(value.version!==1||!Number.isSafeInteger(value.pid)||value.pid<1||!alive(value.pid)||!(/^[a-f0-9]{64}$/).test(value.token))return null;
  const client=createStudioClient(value);await client.json('/projects',{signal:AbortSignal.timeout(1500)});
  if(value.workspace!==profile.workspace)throw Object.assign(new Error('同一配置目录已有其他工作区在运行；请使用独立配置目录。'),{code:'PROFILE_WORKSPACE_CONFLICT'});
  return {...value,client};
 }catch(error){if(error.code==='PROFILE_WORKSPACE_CONFLICT')throw error;return null;}
}
export async function connectStudio({env=process.env,timeout=30000}={}){
 if(env.STUDIO_URL)throw new Error('CLI 不支持外接开发服务；请移除 STUDIO_URL。');
 const profile=resolveProfile({env});
 const lease=randomUUID(),leaseFile=path.join(profile.userData,'.cli-lease-'+lease);
 await fs.mkdir(profile.userData,{recursive:true,mode:0o700});await fs.writeFile(leaseFile,String(process.pid),{flag:'wx',mode:0o600});
 let session,child;
 try{
 session=await readSession(profile);
 if(!session){
 let executable=env.STUDIO_EXECUTABLE;
 if(executable&&!path.isAbsolute(executable))throw new Error('Studio 启动路径必须是绝对路径。');
 if(!executable){try{executable=createRequire(import.meta.url)('electron');}catch{throw new Error('找不到桌面运行时；请设置 STUDIO_EXECUTABLE 为本机 Studio 程序的绝对路径。');}}
 const childEnv={...env,STUDIO_CLI_LEASE:lease,STUDIO_CLI_PARENT_PID:String(process.pid)};delete childEnv.ELECTRON_RUN_AS_NODE;
 const args=env.STUDIO_EXECUTABLE?['--studio-cli-service']:[root,'--studio-cli-service'];
 child=spawn(executable,args,{env:childEnv,stdio:['pipe','ignore','ignore'],windowsHide:true});let spawnFailed=false;child.on('error',()=>{spawnFailed=true;});
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline&&!spawnFailed){session=await readSession(profile);if(session)break;await new Promise(r=>setTimeout(r,80));}
 if(!session)throw new Error('本机工作台未能启动；请检查桌面运行时或先正常打开 Studio。');
 }
 }catch(error){await fs.rm(leaseFile,{force:true});child?.stdin?.end();child?.unref();throw error;}
 let ended=false;
 return {client:session.client,close:async()=>{if(ended)return;ended=true;await fs.rm(leaseFile,{force:true});child?.stdin?.end();if(child&&session.pid===child.pid&&child.exitCode===null){let timer;try{await Promise.race([new Promise(r=>child.once('exit',r)),new Promise(r=>{timer=setTimeout(r,1000);timer.unref();})]);}finally{clearTimeout(timer);}}child?.unref();}};
}
