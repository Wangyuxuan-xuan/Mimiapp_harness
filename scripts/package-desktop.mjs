import fs from 'node:fs/promises';import path from 'node:path';import {spawn} from 'node:child_process';
async function run(file,args=[]){await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[file,...args],{stdio:'inherit',windowsHide:true});p.on('error',reject);p.on('exit',c=>c===0?resolve():reject(new Error(`Packaging step failed: ${c}`)));});}
await run('node_modules/vite/bin/vite.js',['build']);
const stage=path.resolve('.package-staging');await fs.mkdir(stage,{recursive:true});
for(const dir of ['dist','electron','server','templates','agent-skills'])await fs.cp(path.resolve(dir),path.join(stage,dir),{recursive:true});
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));delete pkg.build;await fs.writeFile(path.join(stage,'package.json'),JSON.stringify(pkg,null,2));
try{await fs.symlink(path.resolve('node_modules'),path.join(stage,'node_modules'),'junction');}catch(e){if(e.code!=='EEXIST')throw e;}
await run('node_modules/electron-builder/cli.js',['--win','dir','--config.directories.output=release-qr-fix','--config.directories.app=.package-staging']);
// Include dependencies of nested package versions as well as top-level packages.
await run('scripts/repair-package-deps.mjs');
console.log('Packaged desktop: release-qr-fix/win-unpacked/Sprout Studio.exe');
