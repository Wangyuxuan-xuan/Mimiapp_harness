import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import archiver from 'archiver';
import { APP_ROOT,Store,atomicJson,readSources } from './store.mjs';
import { buildProject } from './builder.mjs';
import { runAgent } from './agent.mjs';
import { remember,safeText,safeValue,textRedactor,createTask,recoverTasks,sourceDigest,LIMITS } from './harness.mjs';
import { storageBridge } from './preview-bridge.mjs';
import { configureNetwork,modelFetch } from './network.mjs';

export function parseSettings(input,current={}) {
  if(!input||typeof input!=='object'||Array.isArray(input)||['provider','baseUrl','model','apiKey'].some(key=>input[key]!==undefined&&typeof input[key]!=='string'))throw new Error('模型配置格式无效。');
  const provider=input.provider==='custom'?'custom':'deepseek';
  const baseUrl=String(input.baseUrl||'https://api.deepseek.com').trim().replace(/\/+$/,'');if(baseUrl.length>2048)throw new Error('API 地址过长。');
  const url=new URL(baseUrl);
  if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname))))throw new Error('API 地址必须为 HTTPS；本地服务可使用 localhost。');
  const model=String(input.model||'').trim();if(!model||model.length>120)throw new Error('请填写有效的模型名称。');
  const sameEndpoint=current.baseUrl===baseUrl;
  const apiKey=String(input.apiKey||'').trim()||(sameEndpoint?current.apiKey:'')||'';
  if(apiKey.length>4096)throw new Error('API Key 格式无效。');
  return {provider,baseUrl,model,apiKey};
}
export async function startStudio({port=5173,root=path.join(APP_ROOT,'.studio'),production=false,seed=true,build=buildProject,agent=runAgent,credentialStore}={}) {
  configureNetwork();
  const store=new Store(root);await store.init();await recoverTasks(store);
  let config={provider:'deepseek',baseUrl:'https://api.deepseek.com',model:'deepseek-flash',apiKey:''};
  try{const legacy=JSON.parse(await fs.readFile(path.join(root,'settings.json'),'utf8'));config=parseSettings({provider:legacy.provider,baseUrl:legacy.baseUrl,model:legacy.model,apiKey:''});}catch{}
  let persistedKey=false,credentialWarning='';
  if(credentialStore){try{const saved=await credentialStore.load();if(saved){config=parseSettings(saved);persistedKey=!!config.apiKey;}}catch{credentialWarning='已保存的模型设置无法读取或系统安全存储不可用；请重新保存设置，原加密文件已保留。';}}
  const publicSettings=()=>({provider:config.provider,baseUrl:config.baseUrl,model:config.model,hasKey:!!config.apiKey,keyStorage:{mode:credentialStore?'encrypted':'memory',available:!!credentialStore?.available,persisted:persistedKey,warning:credentialWarning}});
  const token=randomBytes(32).toString('hex'),jobs=new Map(),storageQueues=new Map(),storageRequests=new Set(),activeMutations=new Set();let closing=false;
  const preview=express();
  preview.use((req,res,next)=>{
    if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host||''))return res.sendStatus(403);
    res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; media-src 'self'; base-uri 'none'; form-action 'none'");
    res.setHeader('X-Content-Type-Options','nosniff');next();
  });
  preview.use('/p/:id/r/:revision',async(req,res,next)=>{
    try{
      store.dir(req.params.id);if(!/^\d+$/.test(req.params.revision))return res.sendStatus(404);
      const dir=path.join(store.dir(req.params.id),'revisions',req.params.revision,'dist','h5');
      if(req.path==='/'||req.path==='/index.html'){
        let storage={};try{storage=JSON.parse(await fs.readFile(path.join(store.dir(req.params.id),'storage.json'),'utf8'));}catch{}
        let html=await fs.readFile(path.join(dir,'index.html'),'utf8');html=html.replace('<head>','<head>'+storageBridge(req.params.id,storage,Number(req.params.revision)));res.setHeader('Cache-Control','no-store');return res.type('html').send(html);
      }
      express.static(dir,{index:'index.html',fallthrough:false})(req,res,next);
    }catch{res.sendStatus(404);}
  });
  const previewServer=await listen(preview,0);const previewOrigin=`http://127.0.0.1:${previewServer.address().port}`;
  const app=express();
  app.use((req,res,next)=>{
    if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host||''))return res.status(403).json({error:'仅允许本机访问。'});
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    if(req.path.startsWith('/api')){
      if(closing&&!['GET','HEAD'].includes(req.method))return res.status(503).json({error:'应用正在关闭，请稍后重新打开。'});
      res.setHeader('Cache-Control','no-store');
      if(req.headers['x-studio-token']!==token)return res.status(403).json({error:'工作空间会话无效，请刷新应用。'});
      const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`)return res.status(403).json({error:'跨来源请求已阻止。'});
    }
    next();
  });
  app.use(express.json({limit:'1mb'}));
  const operations=new Set();
  let settingsQueue=Promise.resolve(),preparingRuns=0;
  const settingsMutation=handler=>(req,res,next)=>{
    const pending=settingsQueue.catch(()=>{}).then(async()=>{if(closing)throw new Error('应用正在关闭，设置未保存。');if(jobs.size||preparingRuns)throw new Error('请等当前制作完成或停止后再更换模型。');await handler(req,res);});
    settingsQueue=pending;const settled=pending.then(()=>{},()=>{});activeMutations.add(settled);settled.finally(()=>activeMutations.delete(settled));pending.catch(next);
  };
  const mutation=handler=>async(req,res,next)=>{const id=req.params.id;if(operations.has(id))return next(new Error('项目操作正在进行，请稍后再试。'));if(closing)return next(new Error('应用正在关闭。'));operations.add(id);let finish;const pending=new Promise(r=>{finish=r;});activeMutations.add(pending);try{await handler(req,res,next);}catch(e){next(e);}finally{operations.delete(id);activeMutations.delete(pending);finish();}};
  function assertIdle(id){if(jobs.has(id))throw new Error('项目正在制作，请先等待完成或停止。');}
  async function initializeProject(title,sample=false){const p=await store.create(title,sample);const draft=await store.draft(p.id);await build(draft,{onLog:text=>console.log(text)});await store.commit(p,draft,sample?'初始示例 · 日常习惯':'创建项目');return store.public(p);}
  let initialError='';
  const initialization=(async()=>{
    if(!seed)return;
    try{
      const projects=await store.list();
      if(!projects.length)await initializeProject('日常 · 习惯打卡',true);
      else for(const item of projects.filter(p=>p.sample&&!p.ready)){
        const project=await store.get(item.id),draft=await store.draft(item.id);
        await build(draft,{onLog:text=>console.log(text)});await store.commit(project,draft,'恢复初始示例');
      }
    }catch(e){initialError=e.message;console.error('初始编译失败：',e.message);}
  })();
  app.get('/api/bootstrap',async(req,res)=>{await initialization;res.json({projects:await store.list(),settings:publicSettings(),previewOrigin,initialError});});
  app.get('/api/projects',async(req,res)=>res.json(await store.list()));
  app.get('/api/projects/:id',async(req,res)=>res.json(store.public(await store.get(req.params.id))));
  app.get('/api/projects/:id/files',async(req,res)=>{const p=await store.get(req.params.id);const dir=p.ready?path.join(store.dir(p.id),'revisions',String(p.revision)):path.join(store.dir(p.id),'current');res.json(await readSources(dir));});
  app.post('/api/projects/:id/storage',async(req,res)=>{
    if(closing)throw new Error('应用正在关闭。');let finish;const pendingRequest=new Promise(r=>{finish=r;});storageRequests.add(pendingRequest);try{
    const id=req.params.id;await store.get(id);const values=req.body.values;
    if(!values||typeof values!=='object'||Array.isArray(values)||Object.values(values).some(v=>typeof v!=='string')||JSON.stringify(values).length>500000)throw new Error('小程序本地数据格式无效或超过 500 KB。');
    const previous=storageQueues.get(id)||Promise.resolve();
    const pending=previous.catch(()=>{}).then(()=>atomicJson(path.join(store.dir(id),'storage.json'),values));storageQueues.set(id,pending);
    try{await pending;res.json({ok:true});}finally{if(storageQueues.get(id)===pending)storageQueues.delete(id);}
    }finally{storageRequests.delete(pendingRequest);finish();}
  });
  app.post('/api/projects',async(req,res)=>{res.json(await initializeProject(req.body.title));});
  app.post('/api/settings',settingsMutation(async(req,res)=>{
    const candidate=parseSettings(req.body,config);
    if(credentialStore){try{await credentialStore.save(candidate);}catch{throw new Error('系统安全存储写入失败，模型设置未保存。');}}
    else{const {apiKey,...persisted}=candidate;await atomicJson(path.join(root,'settings.json'),persisted);}
    config=candidate;persistedKey=!!credentialStore&&!!config.apiKey;credentialWarning='';res.json(publicSettings());
  }));
  app.delete('/api/settings/key',settingsMutation(async(req,res)=>{
    const candidate={...config,apiKey:''};
    if(credentialStore){try{await credentialStore.clear(candidate);}catch{throw new Error('系统安全存储清除失败，原设置已保留。');}}
    config=candidate;persistedKey=false;credentialWarning='';res.json(publicSettings());
  }));
  app.post('/api/settings/test',async(req,res)=>{
    const candidate=parseSettings(req.body,config);if(!candidate.apiKey)throw new Error('请先输入 API Key。');
    const response=await modelFetch(candidate.baseUrl+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${candidate.apiKey}`},body:JSON.stringify({model:candidate.model,messages:[{role:'user',content:'Reply OK.'}],max_tokens:64,stream:false}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`连接失败（${response.status}）。请检查 API 地址、模型名称、密钥和账户余额。`);
    const body=await response.json();if(!body.choices?.length)throw new Error('服务响应格式不兼容 Chat Completions。');res.json({ok:true});
  });
  app.put('/api/projects/:id/memory',mutation(async(req,res)=>{
    assertIdle(req.params.id);const p=await store.get(req.params.id);const {goal,constraints,changes}=req.body;
    if(typeof goal!=='string'||typeof constraints!=='string'||!Array.isArray(changes)||changes.some(x=>typeof x.text!=='string')||JSON.stringify(req.body).length>LIMITS.memoryChars)throw new Error('需求格式无效或超过容量。');
    p.memory={goal:safeText(goal,config.apiKey),constraints:safeText(constraints,config.apiKey),changes:changes.map(x=>({text:safeText(x.text,config.apiKey),time:Number(x.time)||Date.now()})),updatedAt:Date.now()};await store.save(p);res.json(store.public(p));
  }));
  app.post('/api/projects/:id/runtime-error',mutation(async(req,res)=>{
    assertIdle(req.params.id);const p=await store.get(req.params.id);if(req.body.revision!==p.revision)throw new Error('该错误来自旧预览，请刷新当前版本再检查。');
    const e={revision:p.revision,message:safeText(req.body.message,config.apiKey).slice(0,2000),source:safeText(req.body.source,config.apiKey).slice(0,500),line:Number(req.body.line)||0,stack:safeText(req.body.stack,config.apiKey).slice(0,3000),time:Date.now()};
    p.runtimeErrors=[...p.runtimeErrors,e].slice(-10);await store.save(p);res.json(store.public(p));
  }));
  app.post('/api/projects/:id/run',mutation(async(req,res)=>{
    let settingsSnapshot;do{settingsSnapshot=settingsQueue;await settingsSnapshot.catch(()=>{});}while(settingsSnapshot!==settingsQueue);
    if(closing)throw new Error('应用正在关闭。');
    preparingRuns++;try{
    const id=req.params.id;assertIdle(id);if(!config.apiKey)throw new Error('请先连接模型并填写 API Key。');
    const project=await store.get(id);if(closing)throw new Error('应用正在关闭。');let previous;
    if(req.body.resumeTaskId){previous=project.tasks.find(t=>t.id===req.body.resumeTaskId);if(!previous||!['interrupted','failed','stopped'].includes(previous.state))throw new Error('任务不能继续。');if(previous.sourceDigest!==await sourceDigest(store,project)||previous.baseRevision!==project.revision)throw new Error('源码或版本已变化，请核对当前预览后提交新的需求。');}
    let prompt=previous?.prompt||String(req.body.prompt||'').trim();if(req.body.repair){const e=project.runtimeErrors.at(-1);if(!e||e.revision!==project.revision)throw new Error('没有当前版本的运行错误。');prompt='修复当前运行错误，并用实际功能检查验证：'+JSON.stringify(e);}
    if(!prompt||prompt.length>12000)throw new Error('请输入 1–12000 字的需求。');prompt=safeText(prompt,config.apiKey);
    if(!previous)remember(project,prompt,config.apiKey);
    if(closing)throw new Error('应用正在关闭。');
    const controller=new AbortController();let finish;controller.finished=new Promise(r=>{finish=r;});jobs.set(id,controller);let task;
    try{task=await createTask(store,project,prompt,previous);}catch(e){jobs.delete(id);throw e;}
    const timeout=setTimeout(()=>{if(!controller.publicationStarted)controller.abort(new Error('timeout'));},LIMITS.milliseconds);
    res.status(200).set({'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store'});res.flushHeaders();
    const redact=s=>safeText(s,config.apiKey),textOutput=textRedactor(config.apiKey);let checkpoint=Promise.resolve();
    const emit=event=>{if(event.type==='status'){task.phase=redact(event.text).slice(0,500);task.updatedAt=Date.now();task.events.push({text:task.phase,time:task.updatedAt});task.events=task.events.slice(-40);checkpoint=checkpoint.then(()=>store.save(project)).catch(e=>{controller.abort(new Error('checkpoint-failed'));throw e;});checkpoint.catch(()=>{});}if(event.type==='text'){const text=textOutput.push(event.text);if(text&&!res.destroyed)res.write(JSON.stringify({type:'text',text})+'\n');return;}const tail=['done','error'].includes(event.type)?textOutput.flush():'';if(!res.destroyed){if(tail)res.write(JSON.stringify({type:'text',text:tail})+'\n');res.write(JSON.stringify(safeValue(event,config.apiKey))+'\n');}};
    try{
      project.messages.push({role:'user',text:prompt,time:Date.now()});await store.save(project);
      const done=await agent({store,project,config:{...config},prompt,signal:controller.signal,emit,build,task,beforeCommit:async()=>{await checkpoint;controller.signal.throwIfAborted();},onPublish:()=>{controller.signal.throwIfAborted();controller.publicationStarted=true;}});
      await checkpoint;controller.signal.throwIfAborted();controller.publicationStarted=true;task.state='completed';task.phase=done.verification?.state==='passed'?'功能检查通过':'制作结束，实际功能待验证';task.updatedAt=Date.now();await store.save(done);emit({type:'done',project:store.public(done)});
    }catch(e){await checkpoint.catch(()=>{});const reason=controller.signal.reason?.message;task.state=controller.signal.aborted?(reason==='user-stop'?'stopped':'interrupted'):'failed';task.reason=reason||(e.code==='verification-budget-exhausted'?e.code:'error');task.phase=task.state==='stopped'?'用户主动停止；不会自动继续':task.state==='interrupted'?'制作中断，可核对源码后继续':'制作失败，可核对源码后继续';task.updatedAt=Date.now();const message=controller.signal.aborted?task.phase+'，保留上一个可用版本。':redact(e.message);project.messages.push({role:'assistant',text:'本次制作未完成：'+message.slice(0,1800),time:Date.now()});await store.save(project);emit({type:'error',text:message,project:store.public(project)});}
    finally{clearTimeout(timeout);jobs.delete(id);finish();if(!res.destroyed)res.end();}
    }finally{preparingRuns--;}
  }));
  app.post('/api/projects/:id/stop',(req,res)=>{const job=jobs.get(req.params.id);if(job?.publicationStarted)return res.status(409).json({error:'版本已开始保存，无法停止；请等待结果。'});job?.abort(new Error('user-stop'));res.json({ok:true});});
  app.post('/api/projects/:id/restore',mutation(async(req,res)=>{
    const id=req.params.id;assertIdle(id);const p=await store.get(id);if(closing)throw new Error('应用正在关闭。');const v=p.versions.find(v=>v.id===req.body.versionId);if(!v)throw new Error('版本不存在。');
    const controller=new AbortController();let finish;controller.finished=new Promise(r=>{finish=r;});jobs.set(id,controller);
    let draft;try{draft=await store.draft(id,v.files);await build(draft,{signal:controller.signal});p.verification={state:'pending',reason:'版本恢复后需要重新验证功能'};p.memory.changes.push({text:`代码恢复到版本 ${v.revision}；保留当前最新需求`,time:Date.now()});p.messages.push({role:'assistant',text:`已恢复到版本 ${v.revision} 的代码，并保存为新的版本。`,time:Date.now()});await store.commit(p,draft,`恢复版本 ${v.revision}`,{signal:controller.signal,beforePublish:()=>{controller.signal.throwIfAborted();controller.publicationStarted=true;}});res.json(store.public(p));}finally{jobs.delete(id);finish();if(draft)await fs.rm(draft,{recursive:true,force:true}).catch(()=>{});}
  }));
  app.get('/api/projects/:id/export',async(req,res)=>{
    const p=await store.get(req.params.id);if(!p.ready)throw new Error('项目尚未编译成功，暂时无法导出。');
    const dir=path.join(store.dir(p.id),'revisions',String(p.revision));
    res.set({'Content-Type':'application/zip','Content-Disposition':`attachment; filename="sprout-mini-${p.id.slice(0,8)}.zip"`});
    const archive=archiver('zip',{zlib:{level:6}});archive.on('error',err=>res.destroy(err));archive.pipe(res);
    for(const folder of ['src','config','dist/weapp'])archive.directory(path.join(dir,folder),folder);
    for(const file of ['package.json','babel.config.js','index.html','project.config.json'])archive.file(path.join(dir,file),{name:file});
    archive.append('小芽导出的小程序项目\n\n1. 解压后，在微信开发者工具中导入这个目录（含 project.config.json）。\n2. 小程序目录已设为 dist/weapp，里面是实际 JS / JSON / WXML / WXSS 产物，不需要再安装依赖或构建。\n3. touristappid 用于无 AppID 的本地体验；上传时请填入你有权限的真实 AppID 并登录微信开发者工具。\n4. 编译、检查模拟器，然后使用官方预览/上传功能。登录、支付等微信专属 API 需要另行配置验证。\n5. src 是 Taro 源码，需要继续开发时可 npm install 后 npm run build:weapp。\n\n桌面 H5 预览不等于微信真机验证。此包不含 API Key。\n',{name:'导入说明.txt'});
    await archive.finalize();
  });
  let vite;
  async function serveIndex(req,res,next){try{const file=path.join(APP_ROOT,production?'dist/index.html':'index.html');let html=await fs.readFile(file,'utf8');if(vite)html=await vite.transformIndexHtml(req.originalUrl,html);html=html.replace('<head>',`<head><meta name="studio-token" content="${token}">`);res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://127.0.0.1:*; frame-src ${previewOrigin}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`);res.type('html').send(html);}catch(e){next(e);}}
  app.get('/',serveIndex);
  if(production)app.use(express.static(path.join(APP_ROOT,'dist')));
  else{const {createServer}=await import('vite');vite=await createServer({root:APP_ROOT,server:{middlewareMode:true},appType:'custom'});app.use(vite.middlewares);}
  app.use((err,req,res,next)=>{if(res.headersSent)return next(err);const message=err.message||'操作失败。';res.status(400).json({error:message});});
  let server;try{server=await listen(app,port);}catch(e){previewServer.close();await vite?.close();throw e;}
  return {url:`http://127.0.0.1:${server.address().port}`,previewOrigin,token,store,ready:initialization,close:async()=>{closing=true;const runningJobs=[...jobs.values()];for(const job of runningJobs)if(!job.publicationStarted)job.abort(new Error('service-close'));await Promise.all(runningJobs.map(job=>job.finished));await Promise.all([...activeMutations,...storageRequests,...storageQueues.values()]);await vite?.close();server.closeAllConnections();previewServer.closeAllConnections();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>previewServer.close(r))]);}};
}
function listen(app,port){return new Promise((resolve,reject)=>{const server=app.listen(port,'127.0.0.1',()=>resolve(server));server.on('error',reject);});}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const studio=await startStudio({port:Number(process.env.STUDIO_PORT||5173),production:process.argv.includes('--production')});console.log(`Sprout Studio: ${studio.url}`);const exit=async()=>{await studio.close();process.exit(0);};process.on('SIGINT',exit);process.on('SIGTERM',exit);}
