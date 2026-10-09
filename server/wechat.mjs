import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
export async function findWechat(){
  const candidates=[process.env.WECHAT_DEVTOOLS_PATH,'D:/微信web开发者工具','C:/Program Files (x86)/Tencent/微信web开发者工具','C:/Program Files/Tencent/微信web开发者工具'].filter(Boolean);
  for(const base of candidates){const compiler=path.join(base,'code/package.nw/node_modules/wcc-exec');try{await fs.access(path.join(compiler,'wcc.exe'));return {base,compiler};}catch{}}
  return null;
}
export async function validateWechat(dir,{signal,onLog=()=>{}}={}){
  const root=path.join(dir,'dist/weapp'),config=JSON.parse(await fs.readFile(path.join(root,'app.json'),'utf8'));
  const files=[];async function walk(base){for(const entry of await fs.readdir(base,{withFileTypes:true})){const p=path.join(base,entry.name);if(entry.isDirectory())await walk(p);else files.push(path.relative(root,p).replaceAll('\\','/'));}}await walk(root);
  for(const p of config.pages||[])for(const ext of ['.js','.json','.wxml','.wxss'])await fs.access(path.join(root,p+ext));
  const wechat=await findWechat();if(!wechat){onLog('微信产物结构检查通过；本机未找到官方编译器');return {official:false};}
  onLog('正在用微信官方 WXML / WXSS 编译器验证…');
  const out=path.join(dir,'.verification');await fs.mkdir(out,{recursive:true});
  for(const [exe,ext,target] of [['wcc.exe','.wxml','wxml.js'],['wcsc.exe','.wxss','wxss.js']]){
    const inputs=files.filter(f=>f.endsWith(ext)||(exe==='wcc.exe'&&f.endsWith('.wxs'))).map(f=>'./'+f);
    try{await exec(path.join(wechat.compiler,exe),['-o',path.join(out,target),...inputs],{cwd:root,windowsHide:true,maxBuffer:20*1024*1024,timeout:30000,signal});}
    catch(e){throw new Error(`微信官方 ${ext.slice(1).toUpperCase()} 编译失败：\n${e.stderr||e.message}`);}
  }
  onLog('微信官方 WXML / WXSS 编译通过');return {official:true};
}
