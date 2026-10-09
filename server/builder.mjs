import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { APP_ROOT } from './store.mjs';
import { validateWechat } from './wechat.mjs';

export async function buildProject(dir,{signal,onLog=()=>{},targets=['h5','weapp']}={}) {
  const compilerHome=path.resolve(dir,'../../../../compiler-home');
  await fs.mkdir(compilerHome,{recursive:true});
  for(const target of targets) {
    signal?.throwIfAborted(); onLog(`正在编译 ${target==='h5'?'交互预览':'微信小程序'}…`);
    await new Promise((resolve,reject)=>{
      let output='',timedOut=false;
      const child=spawn(process.execPath,[path.join(APP_ROOT,'node_modules/@tarojs/cli/bin/taro'),'build','--type',target,'--disable-global-config'],{
        cwd:dir,windowsHide:true,env:{...process.env,USERPROFILE:compilerHome,ELECTRON_RUN_AS_NODE:'1',NODE_ENV:'production',TARO_ENV:target,NODE_OPTIONS:'--max-old-space-size=4096',FORCE_COLOR:'0'},stdio:['ignore','pipe','pipe']
      });
      const collect=chunk=>{output=(output+chunk.toString().replace(/\x1b\[[0-9;]*[A-Za-z]/g,'')).slice(-18000);};
      child.stdout.on('data',collect);child.stderr.on('data',collect);
      const kill=()=>{ if(child.pid&&process.platform==='win32') spawn('taskkill',['/pid',String(child.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'});else child.kill('SIGKILL'); };
      const timer=setTimeout(()=>{timedOut=true;kill();},180000);
      const abort=()=>kill();signal?.addEventListener('abort',abort,{once:true});
      function cleanup(){clearTimeout(timer);signal?.removeEventListener('abort',abort);}
      child.on('error',err=>{cleanup();reject(err);});
      child.on('close',async code=>{
        cleanup();
        if(signal?.aborted) return reject(new Error('已停止制作，保留上一个可用版本。'));
        if(timedOut) return reject(new Error('编译超过 3 分钟，请重试。'));
        if(code!==0) return reject(new Error(output||'编译失败。'));
        try { await fs.access(path.join(dir,'dist',target,target==='h5'?'index.html':'app.json')); resolve(); }
        catch { reject(new Error('编译未生成预期文件。\n'+output)); }
      });
    });
  }
  if(targets.includes('weapp'))await validateWechat(dir,{signal,onLog});
  onLog('页面与微信端编译检查通过');
}
