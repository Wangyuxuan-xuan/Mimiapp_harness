import fs from 'node:fs/promises';import path from 'node:path';
if(!process.argv[2])throw new Error('请明确指定新包的 node_modules 目录，拒绝默认覆盖旧包。');
const root=path.resolve('node_modules'),out=path.resolve(process.argv[2]);
async function resolve(name,from){for(let d=from;d.startsWith(path.dirname(root));d=path.dirname(d)){const p=path.join(d,'node_modules',name);try{await fs.access(path.join(p,'package.json'));return p;}catch{}}}
const todo=Object.keys(JSON.parse(await fs.readFile('package.json','utf8')).dependencies).map(n=>path.join(root,n)),seen=new Set();let copied=0;
while(todo.length){const source=todo.pop();if(!source||seen.has(source))continue;seen.add(source);let p;try{p=JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8'));}catch{continue;}const dest=path.join(out,path.relative(root,source));try{await fs.access(path.join(dest,'package.json'));}catch{await fs.cp(source,dest,{recursive:true});copied++;}for(const dep of Object.keys({...p.dependencies,...p.optionalDependencies,...p.peerDependencies})){todo.push(await resolve(dep,source));}}
console.log('Repaired packaged production dependencies',copied);
