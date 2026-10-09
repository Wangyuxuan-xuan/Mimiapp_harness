import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
const moduleRoot=process.env.SPROUT_TEST_PACKAGE?'../release/win-unpacked/resources/app/server/':'../server/';
const {APP_ROOT,Store,sourcePath,validateSource,readSources,writeSource}=await import(moduleRoot+'store.mjs');
const {parseSettings,startStudio}=await import(moduleRoot+'index.mjs');
const {runAgent}=await import(moduleRoot+'agent.mjs');

test('only page sources can be written; imports cannot escape the project',()=>{
  assert.equal(sourcePath('src/pages/index/index.jsx'),'src/pages/index/index.jsx');
  for(const p of ['../secret','.env','src/app.config.js','config/index.js','src/components/../../app.jsx','C:/secret','src/components/a.js'])assert.throws(()=>sourcePath(p));
  assert.throws(()=>validateSource('src/pages/index/index.jsx',`import fs from 'node:fs'`));
  assert.throws(()=>validateSource('src/pages/index/index.jsx',`import x from '../../../../server/index.mjs'`));
  assert.throws(()=>validateSource('src/pages/index/index.jsx',`eval('hello')`));
  validateSource('src/pages/index/index.jsx',`import React from 'react'; import { View } from '@tarojs/components'; import './index.css'; export default ()=> <View>Hello</View>`);
});
test('changing endpoint never silently forwards the previous key',()=>{
  const current={baseUrl:'https://api.deepseek.com',apiKey:'test-secret'};
  assert.equal(parseSettings({baseUrl:current.baseUrl,model:'a'},current).apiKey,'test-secret');
  assert.equal(parseSettings({baseUrl:'https://example.com/v1',model:'a'},current).apiKey,'');
  assert.throws(()=>parseSettings({baseUrl:'http://example.com',model:'a'}));
  assert.throws(()=>parseSettings({baseUrl:'https://user:pass@example.com',model:'a'}));
});
async function fresh(){const root=await fs.mkdtemp(path.join(APP_ROOT,'.test-data-'));const store=new Store(root);await store.init();return store;}
async function fakeBuild(dir){for(const target of ['h5','weapp']){await fs.mkdir(path.join(dir,'dist',target),{recursive:true});await fs.writeFile(path.join(dir,'dist',target,target==='h5'?'index.html':'app.json'),target==='h5'?'<html><head></head><body>test</body></html>':'{"pages":["pages/index/index"]}');}}
test('snapshots restore exact source and retain later history',async()=>{
  const store=await fresh(),p=await store.create('版本测试');const d=await store.draft(p.id);await fakeBuild(d);await store.commit(p,d,'first');
  const first=p.versions[0];const d2=await store.draft(p.id);await writeSource(d2,'src/components/extra.jsx',`export default ()=>null`);await writeSource(d2,'src/pages/index/index.css','page{color:red}');await fakeBuild(d2);await store.commit(p,d2,'second');
  const restored=await store.draft(p.id,first.files);await fakeBuild(restored);await store.commit(p,restored,'restore');
  assert.equal(p.versions.length,3);assert.equal(p.revision,3);assert.equal((await readSources(restored))['src/pages/index/index.css'],first.files['src/pages/index/index.css']);
  const next=await store.draft(p.id);assert.equal((await readSources(next))['src/components/extra.jsx'],undefined);
});
test('API requires session token, rejects preview-origin requests, and persists no secret',async()=>{
  const store=await fresh();const studio=await startStudio({root:store.root,port:0,production:true,seed:false,build:fakeBuild});
  try{
    assert.equal((await fetch(studio.url+'/api/bootstrap')).status,403);
    const headers={'X-Studio-Token':studio.token,'Content-Type':'application/json'};
    assert.equal((await fetch(studio.url+'/api/bootstrap',{headers:{...headers,Origin:studio.previewOrigin}})).status,403);
    const saved=await fetch(studio.url+'/api/settings',{method:'POST',headers,body:JSON.stringify({provider:'deepseek',baseUrl:'https://api.deepseek.com',model:'test',apiKey:'never-persist-this'})});assert.equal(saved.status,200);
    assert.equal((await saved.json()).hasKey,true);assert.ok(!(await fs.readFile(path.join(store.root,'settings.json'),'utf8')).includes('never-persist-this'));
    const p=await(await fetch(studio.url+'/api/projects',{method:'POST',headers,body:JSON.stringify({title:'API test'})})).json();assert.equal(p.ready,true);
    const response=await fetch(studio.url+`/api/projects/${p.id}/export`,{headers});assert.equal(response.status,200);const buf=Buffer.from(await response.arrayBuffer());assert.equal(buf.subarray(0,2).toString(),'PK');
  }finally{await studio.close();}
});
test('real PI SDK executes streamed tool calls against a deterministic local model',async()=>{
  const store=await fresh(),project=await store.create('PI integration');project.memory.constraints='早期长期要求：离线中文且保留历史';project.messages.push(...Array.from({length:14},(_,i)=>({role:i%2?'assistant':'user',text:'后续消息 '+i,time:Date.now()})));let requests=0;const calls=[];
  const scripts=[{name:'list_files',args:{}},{name:'read_file',args:{path:'src/pages/index/index.css'}},{name:'write_file',args:{path:'src/pages/index/index.css',content:'.mini-app{background:#fce9dc}'}},{name:'build_preview',args:{}}];
  const server=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);calls.push(body);const n=requests++;
    assert.equal(req.headers.authorization,'Bearer test-only-key');
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    const chunk=(delta,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'test-'+n,object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model:'test-mini',choices:[{index:0,delta,finish_reason}]})+'\n\n');
    chunk({role:'assistant'});
    if(n<scripts.length){const s=scripts[n];chunk({tool_calls:[{index:0,id:'call-'+n,type:'function',function:{name:s.name,arguments:JSON.stringify(s.args)}}]});chunk({},'tool_calls');}
    else {chunk({content:'暖橙色已完成，双端编译通过。 test-only-key'});chunk({},'stop');}
    res.end('data: [DONE]\n\n');
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
    const events=[];const output=await runAgent({store,project,config:{baseUrl:`http://127.0.0.1:${server.address().port}/v1`,model:'test-mini',apiKey:'test-only-key'},prompt:'改成暖橙色',signal:AbortSignal.timeout(90000),emit:e=>events.push(e),build:fakeBuild});
    assert.ok(JSON.stringify(calls[0].messages).includes('早期长期要求：离线中文且保留历史'));assert.equal(requests,5);assert.equal(output.revision,1);assert.equal(output.ready,true);assert.equal(output.versions[0].files['src/pages/index/index.css'],'.mini-app{background:#fce9dc}');
    assert.ok(events.some(e=>e.type==='text'&&e.text.includes('暖橙色')));assert.ok(calls[1].messages.some(m=>m.role==='tool'));
    assert.deepEqual(calls[0].tools.map(t=>t.function.name).sort(),['build_preview','list_files','read_file','verify_preview','write_file']);
    const auth=await fs.readFile(path.join(store.root,'runtime/auth.json'),'utf8').catch(()=>'');assert.ok(!auth.includes('test-only-key'));const sessionFiles=await fs.readdir(path.join(store.dir(project.id),'sessions'));assert.ok(sessionFiles.some(x=>x.endsWith('.jsonl')));for(const name of sessionFiles)assert.ok(!(await fs.readFile(path.join(store.dir(project.id),'sessions',name),'utf8')).includes('test-only-key'));
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('failed and cancelled PI builds preserve the last usable revision',async t=>{
  for(const cancel of [false,true])await t.test(cancel?'cancel':'compiler failure',async()=>{
    const store=await fresh(),project=await store.create('保留版本');const original=await store.draft(project.id);await fakeBuild(original);await store.commit(project,original,'usable');
    const saved=project.versions[0].files['src/pages/index/index.css'];let requests=0;
    const server=http.createServer(async(req,res)=>{
      for await(const _ of req){}const n=requests++;
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      const delta=n===0?{tool_calls:[{index:0,id:'change',type:'function',function:{name:'write_file',arguments:JSON.stringify({path:'src/pages/index/index.css',content:'.mini-app{color:red}'})}}]}:n===1?{tool_calls:[{index:0,id:'build',type:'function',function:{name:'build_preview',arguments:'{}'}}]}:{content:'done'};
      const chunk=(d,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'fail-'+n,object:'chat.completion.chunk',model:'test',choices:[{index:0,delta:d,finish_reason}]})+'\n\n');
      chunk({role:'assistant'});chunk(delta);chunk({},n<2?'tool_calls':'stop');res.end('data: [DONE]\n\n');
    });await new Promise(r=>server.listen(0,'127.0.0.1',r));
    const controller=new AbortController();
    try{
      await assert.rejects(runAgent({store,project,config:{baseUrl:`http://127.0.0.1:${server.address().port}/v1`,model:'test',apiKey:'test-key'},prompt:'修改颜色',signal:controller.signal,emit:()=>{},build:async()=>{if(cancel){controller.abort();controller.signal.throwIfAborted();}throw new Error('test compiler failure');}}));
      const persisted=await store.get(project.id);assert.equal(persisted.revision,1);assert.equal(persisted.versions.length,1);assert.equal(persisted.versions[0].files['src/pages/index/index.css'],saved);
    }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
  });
});

test('startup retries a failed sample without creating duplicate projects',async()=>{
 const store=await fresh();const first=await startStudio({root:store.root,port:0,production:true,build:async()=>{throw new Error('expected first-start compiler failure');}});
 await first.ready;assert.equal((await store.list())[0].ready,false);await first.close();
 const second=await startStudio({root:store.root,port:0,production:true,build:fakeBuild});
 try{await second.ready;const projects=await store.list();assert.equal(projects.length,1);assert.equal(projects[0].ready,true);assert.equal(projects[0].revision,1);}finally{await second.close();}
});

test('new projects start neutral while the sample retains habits',async()=>{
 const store=await fresh();
 const blank=await store.create('二维码'),sample=await store.create('示例',true);
 const a=await readSources(await store.draft(blank.id)),b=await readSources(await store.draft(sample.id));
 assert.match(a['src/pages/index/index.jsx'],/你的想法/);
 assert.doesNotMatch(a['src/pages/index/index.jsx'],/习惯|habit/i);
 assert.match(b['src/pages/index/index.jsx'],/habit/i);
 assert.doesNotMatch(blank.messages[0].text,/习惯/);
});

test('PI preserves real answers and rejects empty or truncated output',async t=>{
 for(const kind of ['answer','empty','length'])await t.test(kind,async()=>{
  const store=await fresh(),project=await store.create('response test');let payload;
  const server=http.createServer(async(req,res)=>{
   let raw='';for await(const chunk of req)raw+=chunk;payload=JSON.parse(raw);
   res.writeHead(200,{'Content-Type':'text/event-stream'});
   res.end('data: '+JSON.stringify({id:'reply',choices:[{index:0,delta:{role:'assistant',content:kind==='answer'?'二维码可以包含普通文字。':''},finish_reason:kind==='length'?'length':'stop'}]})+'\n\ndata: [DONE]\n\n');
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
   const call=runAgent({store,project,config:{provider:'deepseek',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,model:'test',apiKey:'test-only'},prompt:'二维码能包含什么？',signal:AbortSignal.timeout(30000),emit:()=>{},build:fakeBuild});
   if(kind==='answer'){const result=await call;assert.equal(result.revision,0);assert.equal(result.messages.at(-1).text,'二维码可以包含普通文字。');}
   else await assert.rejects(call,kind==='length'?/长度限制/:/未返回完整答复/);
   assert.deepEqual(payload.thinking,{type:'disabled'});assert.equal(payload.reasoning_effort,undefined);
   assert.equal((await store.get(project.id)).revision,0);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 });
});
test('M3 verification binds exact sources, stale checks become pending and failures preserve usable revision',async t=>{
 const {digestSources}=await import('../server/harness.mjs');for(const mode of ['passed','stale','failed'])await t.test(mode,async()=>{const store=await fresh(),project=await store.create('业务检查');const original=await store.draft(project.id);await fakeBuild(original);await store.commit(project,original,'original');const scripts=[{name:'write_file',args:{path:'src/pages/index/index.css',content:'page{color:green}'}},{name:'build_preview',args:{}},{name:'verify_preview',args:{steps:[{action:'text',selector:'.result',value:'业务结果'}]}}];if(mode==='stale')scripts.push({name:'write_file',args:{path:'src/pages/index/index.css',content:'page{color:blue}'}});let n=0;const model=http.createServer(async(req,res)=>{for await(const c of req){}const action=scripts[n++];res.writeHead(200,{'Content-Type':'text/event-stream'});const send=(delta,finish_reason)=>res.write('data: '+JSON.stringify({id:'check',choices:[{index:0,delta,finish_reason}]})+'\n\n');send({role:'assistant'});if(action){send({tool_calls:[{index:0,id:'call-'+n,type:'function',function:{name:action.name,arguments:JSON.stringify(action.args)}}]});send({},'tool_calls');}else{send({content:'制作完成'});send({},'stop');}res.end('data: [DONE]\n\n');});await new Promise(r=>model.listen(0,'127.0.0.1',r));try{const call=runAgent({store,project,prompt:'检查业务',config:{baseUrl:`http://127.0.0.1:${model.address().port}/v1`,model:'mock',apiKey:'fixture'},signal:AbortSignal.timeout(30000),emit:()=>{},build:fakeBuild,verify:async(_d,steps)=>({state:mode==='failed'?'failed':'passed',error:mode==='failed'?'业务断言失败':undefined,steps,kind:'stub-verifier'})});if(mode==='failed'){await assert.rejects(call,/功能检查未通过/);assert.equal((await store.get(project.id)).revision,1);}else{const p=await call;assert.equal(p.revision,2);if(mode==='stale'){assert.equal(p.verification.state,'pending');assert.match(p.messages.at(-1).text,/实际功能待验证/);}else{assert.equal(p.verification.revision,2);assert.equal(p.verification.sourceDigest,digestSources(p.versions.at(-1).files));assert.equal(p.versions.at(-1).verification.state,'passed');}}}finally{model.closeAllConnections();await new Promise(r=>model.close(r));}});
});
