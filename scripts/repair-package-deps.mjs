import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
export async function repairPackageDependencies({root=path.resolve('node_modules'),out,entries}){
 root=path.resolve(root);out=path.resolve(out);if(root===out||root.startsWith(out+path.sep)||out.startsWith(root+path.sep))throw new Error('依赖来源与输出必须分离');await fs.mkdir(out,{recursive:true});const realRoot=await fs.realpath(root),realOut=await fs.realpath(out);if(realRoot===realOut||realRoot.startsWith(realOut+path.sep)||realOut.startsWith(realRoot+path.sep))throw new Error('依赖来源与输出实际路径必须分离');
 async function checkDestination(dest){for(let existing=dest;;existing=path.dirname(existing)){let real;try{real=await fs.realpath(existing);}catch(e){if(e.code==='ENOENT')continue;throw e;}if(real!==realOut&&!real.startsWith(realOut+path.sep))throw new Error('依赖输出实际路径越界');return;}}
 async function resolve(name,from){for(let d=from;d.startsWith(path.dirname(root));d=path.dirname(d)){const p=path.join(d,'node_modules',name);try{await fs.access(path.join(p,'package.json'));return p;}catch{}}}
 const todo=entries.map(n=>path.join(root,n)),seen=new Set();let copied=0;
 while(todo.length){const source=todo.pop();if(!source||seen.has(source))continue;seen.add(source);let p;try{p=JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8'));}catch{continue;}const dest=path.resolve(out,path.relative(root,source));if(!dest.startsWith(out+path.sep))throw new Error('依赖输出越界');let existing;try{existing=JSON.parse(await fs.readFile(path.join(dest,'package.json'),'utf8'));}catch{}
  if(existing?.name!==p.name||existing?.version!==p.version){await checkDestination(dest);await fs.rm(dest,{recursive:true,force:true});await fs.cp(source,dest,{recursive:true});copied++;}
  for(const dep of Object.keys({...p.dependencies,...p.optionalDependencies,...p.peerDependencies})){todo.push(await resolve(dep,source));}
 }
 return copied;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){if(!process.argv[2])throw new Error('请明确指定新包的 node_modules 目录，拒绝默认覆盖旧包。');const entries=Object.keys(JSON.parse(await fs.readFile('package.json','utf8')).dependencies);console.log('Repaired packaged production dependencies',await repairPackageDependencies({out:process.argv[2],entries}));}
