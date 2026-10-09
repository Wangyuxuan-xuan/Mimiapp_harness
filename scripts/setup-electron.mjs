import fs from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import extract from 'extract-zip';
const base=path.resolve('node_modules/electron');
const {version}=JSON.parse(await fs.readFile(path.join(base,'package.json'),'utf8'));
const name=`electron-v${version}-win32-x64.zip`;
const root=`https://github.com/electron/electron/releases/download/v${version}`;
await fs.mkdir('.electron-cache',{recursive:true});
const target=path.resolve('.electron-cache',name);
const sums=await fetch(`${root}/SHASUMS256.txt`,{signal:AbortSignal.timeout(30000)});
if(!sums.ok)throw new Error('Unable to fetch official checksums: '+sums.status);
const expected=(await sums.text()).split('\n').find(line=>line.endsWith(name))?.split(' ')[0];
if(!expected)throw new Error('Official checksum missing');
let valid=false;try{valid=createHash('sha256').update(await fs.readFile(target)).digest('hex')===expected;}catch{}
if(!valid){const offset=await fs.stat(target).then(s=>s.size).catch(()=>0);console.log('Downloading official Electron '+version+' from byte '+offset);const response=await fetch(`${root}/${name}`,{headers:offset?{Range:`bytes=${offset}-`}:{},signal:AbortSignal.timeout(600000)});if(!response.ok)throw new Error('Download failed: '+response.status);console.log('Download status '+response.status);await pipeline(Readable.fromWeb(response.body),createWriteStream(target,{flags:response.status===206?'a':'w'}));}
if(createHash('sha256').update(await fs.readFile(target)).digest('hex')!==expected)throw new Error('Checksum mismatch');
console.log('Official SHA256 verified');
await extract(target,{dir:path.join(base,'dist')});await fs.writeFile(path.join(base,'path.txt'),'electron.exe');console.log('Electron runtime ready');
