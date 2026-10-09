import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const project=path.resolve(process.argv[2]||'.studio/projects/89ca5393-1e4a-4293-a05a-795d9f961e64/revisions/1');
const out=path.resolve('test-results/wechat-compiler');await fs.mkdir(out,{recursive:true});
const config=JSON.parse(await fs.readFile(path.join(project,'project.config.json'),'utf8'));
const root=path.resolve(project,config.miniprogramRoot);const app=JSON.parse(await fs.readFile(path.join(root,'app.json'),'utf8'));
const files=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else files.push(path.relative(root,p).replaceAll('\\','/'));}}await walk(root);
for(const f of ['app.js','app.json','app.wxss',...app.pages.flatMap(p=>['.js','.json','.wxml','.wxss'].map(ext=>p+ext))])await fs.access(path.join(root,f));
const compiler='D:/微信web开发者工具/code/package.nw/node_modules/wcc-exec';
const report={project,appid:config.appid,pages:app.pages,files:files.length,totalBytes:0,checks:[]};
for(const file of files)report.totalBytes+=(await fs.stat(path.join(root,file))).size;
for(const [exe,ext,target] of [['wcc.exe','.wxml','wxml.js'],['wcsc.exe','.wxss','wxss.js']]){
  const targets=files.filter(f=>f.endsWith(ext)||(exe==='wcc.exe'&&f.endsWith('.wxs'))).map(f=>'./'+f);
  const {stderr}=await run(path.join(compiler,exe),['-o',path.join(out,target),...targets],{cwd:root,windowsHide:true,maxBuffer:20*1024*1024,timeout:30000});
  report.checks.push({compiler:exe,files:targets,passed:true,warnings:stderr.slice(0,2000)});
}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
