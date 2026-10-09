import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { normalizeProject } from './harness.mjs';

export const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EDITABLE = /^src\/(?:pages\/index\/index\.(?:jsx|css)|components\/[a-zA-Z0-9_/-]+\.(?:jsx|css)|app\.css)$/;
export function sourcePath(name) {
  if (typeof name !== 'string' || name.includes('..') || !EDITABLE.test(name)) throw new Error('只允许修改小程序页面、组件和样式文件。');
  return name;
}
export function validateSource(name, content) {
  sourcePath(name);
  if (typeof content !== 'string' || content.length > 120000) throw new Error('文件内容过大或格式无效。');
  // Keep compiler configuration and Node execution out of generated projects.
  if (name.endsWith('.jsx')) {
    if (/\b(?:require|eval|Function)\s*\(|\bimport\s*\(|dangerouslySetInnerHTML|\b(?:window|document|process|globalThis)\s*[.[]/.test(content)) throw new Error('请使用 Taro 组件和 API，不要使用浏览器或 Node 执行接口。');
    const imports = [...content.matchAll(/\b(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
    for (const imp of imports) {
      if (['react','@tarojs/components','@tarojs/taro'].includes(imp)) continue;
      if (!imp.startsWith('.') || imp.includes('!') || imp.includes('?') || imp.includes('\\')) throw new Error('仅支持 React、Taro 与项目内组件依赖。');
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name),imp));
      sourcePath(/\.(jsx|css)$/.test(resolved) ? resolved : resolved+'.jsx');
    }
  }
}
export async function atomicJson(file, value) {
  const temp = file+'.tmp-'+randomUUID();
  await fs.writeFile(temp, JSON.stringify(value,null,2));
  try{for(let attempt=0;;attempt++){try{await fs.rename(temp,file);break;}catch(e){if(!['EPERM','EACCES','EBUSY'].includes(e.code)||attempt>=5)throw e;await new Promise(r=>setTimeout(r,30*(attempt+1)));}}}finally{await fs.rm(temp,{force:true}).catch(()=>{});}
}
export async function readSources(dir) {
  const result = {};
  async function walk(base) {
    for (const ent of await fs.readdir(base,{withFileTypes:true})) {
      const full=path.join(base,ent.name);
      if (ent.isDirectory()) await walk(full);
      else { const name=path.relative(dir,full).split(path.sep).join('/'); if(EDITABLE.test(name)) result[name]=await fs.readFile(full,'utf8'); }
    }
  }
  await walk(path.join(dir,'src')); return result;
}
export async function writeSource(dir,name,content) {
  validateSource(name,content); const target=path.join(dir,name);
  await fs.mkdir(path.dirname(target),{recursive:true}); await fs.writeFile(target,content);
}
export class Store {
  constructor(root=path.join(APP_ROOT,'.studio')) { this.root=root; this.saves=new Map(); }
  async init() {
    await fs.mkdir(path.join(this.root,'projects'),{recursive:true});
    // All generated projects share the bundled, pinned compiler dependencies.
    const modules=path.join(this.root,'node_modules');
    try { await fs.access(modules); } catch { await fs.symlink(path.join(APP_ROOT,'node_modules'),modules,process.platform==='win32'?'junction':'dir'); }
  }
  dir(id) { if(!/^[a-f0-9-]{36}$/.test(id)) throw new Error('项目不存在。'); return path.join(this.root,'projects',id); }
  async get(id) { return normalizeProject(JSON.parse(await fs.readFile(path.join(this.dir(id),'project.json'),'utf8'))); }
  async save(project) { normalizeProject(project); const previous=this.saves.get(project.id)||Promise.resolve();const pending=previous.catch(()=>{}).then(()=>atomicJson(path.join(this.dir(project.id),'project.json'),project));this.saves.set(project.id,pending);try{await pending;}finally{if(this.saves.get(project.id)===pending)this.saves.delete(project.id);} }
  async list() {
    const names=await fs.readdir(path.join(this.root,'projects'));
    const all=await Promise.all(names.filter(x=>/^[a-f0-9-]{36}$/.test(x)).map(id=>this.get(id).catch(()=>null)));
    return all.filter(Boolean).sort((a,b)=>b.updatedAt-a.updatedAt).map(p=>this.public(p));
  }
  public(p) { return {...p, versions:p.versions.map(({files,...v})=>v)}; }
  async create(title='我的新小程序',sample=false) {
    const id=randomUUID(), dir=this.dir(id); await fs.mkdir(dir,{recursive:true});
    await fs.cp(path.join(APP_ROOT,'templates/mini'),path.join(dir,'current'),{recursive:true});
    if(!sample)await fs.cp(path.join(APP_ROOT,'templates/blank/src'),path.join(dir,'current/src'),{recursive:true});
    const p={id,title:String(title).trim().slice(0,40)||'我的新小程序',sample,createdAt:Date.now(),updatedAt:Date.now(),revision:0,ready:false,versions:[],messages:[{role:'assistant',text:sample?'这是「日常」习惯打卡示例，已内置新增习惯、每日打卡和七天统计。你可以直接在右侧试用。连接模型后，说说你想怎么改。':'新项目已准备好。告诉我你想做什么，我会从你的想法开始制作小程序。',time:Date.now()}]};
    await this.save(p); return p;
  }
  async draft(id,files) {
    const dir=path.join(this.dir(id),'drafts',randomUUID());
    await fs.cp(path.join(APP_ROOT,'templates/mini'),dir,{recursive:true});
    const project=await this.get(id);
    const sources=files||await readSources(project.ready?path.join(this.dir(id),'revisions',String(project.revision)):path.join(this.dir(id),'current'));
    for(const [name,content] of Object.entries(sources)) await writeSource(dir,name,content);
    return dir;
  }
  async commit(project,draft,label) {
    const files=await readSources(draft);
    // Build a fresh immutable revision; serving switches only after both builds pass.
    const revision=project.revision+1;
    const target=path.join(this.dir(project.id),'revisions',String(revision));
    await fs.cp(draft,target,{recursive:true});
    for(const [name,content] of Object.entries(files)) await writeSource(path.join(this.dir(project.id),'current'),name,content);
    project.revision=revision; project.ready=true; project.updatedAt=Date.now();
    project.versions.push({id:randomUUID(),revision,label:label.slice(0,80),time:Date.now(),files,memory:structuredClone(project.memory),verification:structuredClone(project.verification||{state:'pending'})});
    await this.save(project); return project;
  }
  previewDir(project) { return path.join(this.dir(project.id),'revisions',String(project.revision),'dist','h5'); }
}
