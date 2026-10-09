import fs from 'node:fs/promises';import path from 'node:path';import {spawn,execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const appRoot=path.resolve('.'),stamp=Date.now(),deadline=Date.now()+25*60*1000;
function option(name,fallback){const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];}
function newDirectory(value,prefix){const dir=path.resolve(value),relative=path.relative(appRoot,dir);if(relative.startsWith('..')||path.isAbsolute(relative)||!relative.startsWith(prefix))throw new Error('打包目录必须是项目内独立的 '+prefix+' 路径。');return dir;}
const finalizeOnly=process.argv.includes('--finalize-only');
if(finalizeOnly&&(!process.argv.includes('--stage')||!process.argv.includes('--output')||!process.argv.includes('--source-commit')))throw new Error('仅生成清单必须明确stage/output/source-commit。');
const stage=newDirectory(option('--stage',`.package-staging-harness-${stamp}`),'.package-staging-'),output=newDirectory(option('--output',`release-harness-${stamp}`),'release-harness-');
for(const dir of [stage,output]){
 if(finalizeOnly){const stat=await fs.lstat(dir);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('仅生成清单必须使用已有物理目录。');}
 else{try{await fs.access(dir);throw new Error('目录已存在，拒绝覆盖：'+dir);}catch(e){if(e.code!=='ENOENT')throw e;}}
}
if(finalizeOnly){try{await fs.access(path.join(output,'build-manifest.json'));throw new Error('清单已存在，拒绝覆盖。');}catch(e){if(e.code!=='ENOENT')throw e;}}
const sourceCommit=option('--source-commit',null);
if(sourceCommit&&!/^[a-f0-9]{40}$/.test(sourceCommit))throw new Error('源码提交必须是完整提交标识。');
if(sourceCommit&&execFileSync('git',['rev-parse',sourceCommit+'^{commit}'],{encoding:'utf8'}).trim()!==sourceCommit)throw new Error('源码提交无法核对。');
async function run(file,args=[]){await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[file,...args],{stdio:'inherit',windowsHide:true,env:{...process.env,ELECTRON_SKIP_BINARY_DOWNLOAD:'1',ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES:'false',CSC_IDENTITY_AUTO_DISCOVERY:'false'}});const timer=setTimeout(()=>{if(process.platform==='win32')spawn('taskkill',['/pid',String(p.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'});else p.kill('SIGKILL');reject(new Error('本次打包达到25分钟上限，停止此子进程。'));},Math.max(1,deadline-Date.now()));p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',c=>{clearTimeout(timer);c===0?resolve():reject(new Error(`Packaging step failed: ${c}`));});});}
if(!finalizeOnly){
await fs.access(path.resolve('node_modules/electron/dist/electron.exe'));await fs.access(path.resolve('node_modules/electron-builder/cli.js'));
await fs.mkdir(stage);await run('node_modules/vite/bin/vite.js',['build','--outDir',path.join(stage,'dist')]);
for(const dir of ['electron','cli','server','templates','agent-skills'])await fs.cp(path.resolve(dir),path.join(stage,dir),{recursive:true});
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));delete pkg.build;delete pkg.devDependencies;delete pkg.scripts;await fs.writeFile(path.join(stage,'package.json'),JSON.stringify(pkg,null,2));await fs.symlink(path.resolve('node_modules'),path.join(stage,'node_modules'),'junction');
await run('node_modules/electron-builder/cli.js',['--win','dir','--publish','never',`--config.directories.output=${output}`,`--config.directories.app=${stage}`,`--config.electronDist=${path.resolve('node_modules/electron/dist')}`]);
await run('scripts/repair-package-deps.mjs',[path.join(output,'win-unpacked/resources/app/node_modules')]);
}
const packagedApp=path.join(output,'win-unpacked/resources/app'),files={};let packageTransformation;
async function recordFixedResource(relative){
 const staged=path.join(stage,relative),entry=await fs.lstat(staged);
 if(entry.isSymbolicLink())throw new Error('固定打包资源不能是链接：'+relative);
 if(entry.isDirectory()){
  for(const name of (await fs.readdir(staged)).sort())await recordFixedResource(relative+'/'+name);
 }else if(entry.isFile()){
  const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
  const stagedBytes=await fs.readFile(staged),packBytes=await fs.readFile(path.join(packagedApp,relative)),expected=hash(stagedBytes),actual=hash(packBytes);
  if(expected!==actual){
   if(relative!=='package.json')throw new Error('包内固定资源与本次stage不一致：'+relative);
   const left=JSON.parse(stagedBytes),right=JSON.parse(packBytes);delete left.scripts;
   if(!isDeepStrictEqual(left,right))throw new Error('包内生产配置有非标准变更。');
   packageTransformation={stagePackageHash:expected,packPackageHash:actual,standardChange:'electron-builder removed scripts; all other package keys and values identical'};
  }else if(relative==='package.json')packageTransformation={stagePackageHash:expected,packPackageHash:actual,standardChange:'none'};
  files[relative]=actual;
 }
}
// Deliberately enumerate only shipped project resources, never workspace data,
// credentials or settings. package.json here is the staged production manifest.
for(const relative of ['electron','cli','server','templates','agent-skills','package.json'])await recordFixedResource(relative);
const decoderVersions={};for(const name of ['jsqr','pngjs'])decoderVersions[name]=JSON.parse(await fs.readFile(path.join(packagedApp,'node_modules',name,'package.json'),'utf8')).version;
const finalizerSourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const manifest={at:new Date().toISOString(),baseCommit:sourceCommit||finalizerSourceCommit,finalizerSourceCommit,finalizeOnly,packageTransformation,productBase:'242b6fcd40638bb30723249b1489f4ef578c009e',stage,output,exe:path.join(output,'win-unpacked/Sprout Studio.exe'),files,decoderVersions,electron:JSON.parse(await fs.readFile('node_modules/electron/package.json','utf8')).version,builder:JSON.parse(await fs.readFile('node_modules/electron-builder/package.json','utf8')).version,downloads:'local electronDist and existing dependencies only'};
await fs.writeFile(path.join(output,'build-manifest.json'),JSON.stringify(manifest,null,2));console.log('Packaged desktop: '+manifest.exe);
