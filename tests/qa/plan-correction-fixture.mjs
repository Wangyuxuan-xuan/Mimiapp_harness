import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';

export const progressText = '《活着》 当前第120页 / 共200页 进度60% 作者余华';
export const originalPrompt = '做一个记录读书进度的小程序';

const vendorDir = new URL('../../templates/mini/src/vendor/qr/core/', import.meta.url);
async function encoderModules(productRoot) {
  const directory=productRoot?path.join(productRoot,'templates/mini/src/vendor/qr/core'):vendorDir;
  const names = (await fs.readdir(directory)).filter(name => name.endsWith('.js'));
  return (await Promise.all(names.map(async name => `${JSON.stringify('./' + name.slice(0, -3))}:function(require,module,exports){${await fs.readFile(productRoot?path.join(directory,name):new URL(name, vendorDir), 'utf8')}\n}`))).join(',');
}

export function bookSetup() {
  return [
    {action:'fill',selector:'#book-title',value:'活着'},
    {action:'fill',selector:'#book-author',value:'余华'},
    {action:'fill',selector:'#book-total',value:'200'},
    {action:'fill',selector:'#book-progress',value:'120'},
    {action:'click',selector:'#add-book'},
  ];
}
export function firstCheck(selector = '.field-label') {
  return [{action:'text',selector,value:'书名'},...bookSetup(),{action:'text',selector:'#shelf',value:'活着'}];
}
export function secondCheck(selector = '.btn-ghost') {
  return [...bookSetup(),{action:'click',selector:'#open-book'},
    {action:'click',selector},{action:'count',selector:'#progress-qr',value:1},
    {action:'qr',selector:'#progress-qr',value:progressText}];
}

export async function writeReadingPage(root,{productRoot}={}) {
  const modules = await encoderModules(productRoot);
  const html = `<html><head><meta charset="utf-8"></head><body style="margin:8px">
    <section id="book-form" aria-label="新增读书记录">
      <div class="field"><label class="field-label" id="title-label" data-testid="book-title-label" for="book-title">书名</label><input id="book-title"></div>
      <div class="field"><label class="field-label" id="author-label" data-testid="book-author-label" for="book-author">作者（可选）</label><input id="book-author"></div>
      <div class="field"><label class="field-label" id="total-label" data-testid="book-total-label" for="book-total">总页数</label><input id="book-total"></div>
      <input id="book-progress" aria-label="当前页数"><button id="add-book">添加图书</button>
    </section><div id="shelf"></div><section id="detail" aria-label="读书进度详情" hidden>
      <button class="btn-ghost" id="return-shelf" data-testid="return-bookshelf">返回书架</button>
      <button class="btn-ghost" id="generate-progress" data-testid="generate-progress-qr">生成进度二维码</button>
      <div id="qr-output"></div></section>
    <section id="additional-targets">
      <taro-input-core id="editor-group"><input id="extra-title" aria-label="补录书名"><input id="extra-author" aria-label="补录作者"></taro-input-core><div id="editor-echo"></div>
      <input id="limited-input" maxlength="3" aria-label="限长字段">
      <button class="visibility-choice" id="visible-choice">可见操作</button>
      <section style="opacity:0"><button class="visibility-choice" id="hidden-choice">隐藏操作</button></section>
      <div class="private-editor" id="empty-editable" contenteditable="">QA_PRIVATE_EDITABLE_SENTINEL</div>
      <div class="private-editor" id="plain-editable" contenteditable="plaintext-only">QA_PRIVATE_PLAINTEXT_SENTINEL</div>
    </section>
    <script>
      const modules={${modules}},cache={};function require(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;modules[id](require,m,m.exports);return m.exports;}
      const QR=require('./index');let book;
      document.querySelector('#extra-title').oninput=event=>{document.querySelector('#editor-echo').textContent=event.target.value;};
      window.qaClicks={generate:0,back:0};
      document.querySelector('#add-book').onclick=()=>{
        book={title:document.querySelector('#book-title').value,author:document.querySelector('#book-author').value,total:Number(document.querySelector('#book-total').value),progress:Number(document.querySelector('#book-progress').value)};
        const button=document.createElement('button');button.id='open-book';button.textContent=book.title;button.onclick=()=>{document.querySelector('#detail').hidden=false;};document.querySelector('#shelf').replaceChildren(button);
      };
      document.querySelector('#return-shelf').onclick=()=>{window.qaClicks.back++;document.querySelector('#detail').hidden=true;document.querySelector('#qr-output').replaceChildren();};
      document.querySelector('#generate-progress').onclick=()=>{
        window.qaClicks.generate++;
        const text='《'+book.title+'》 当前第'+book.progress+'页 / 共'+book.total+'页 进度'+Math.round(book.progress/book.total*100)+'% 作者'+book.author;
        const code=new QR(-1,0);code.addData(encodeURIComponent(text).replace(/%([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16))));code.make();
        const n=code.getModuleCount(),canvas=document.createElement('canvas');canvas.id='progress-qr';canvas.width=canvas.height=(n+8)*4;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='black';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(code.isDark(y,x))ctx.fillRect((x+4)*4,(y+4)*4,4,4);document.querySelector('#qr-output').replaceChildren(canvas);
      };
    </script></body></html>`;
  await fs.mkdir(path.join(root,'dist/h5'),{recursive:true});
  await fs.writeFile(path.join(root,'dist/h5/index.html'),html);
}

export async function createReadingFixture(options={}) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qa-plan-correction-'));
  try { await writeReadingPage(root,options); }
  catch(error) { await fs.rm(root,{recursive:true,force:true});throw error; }
  return {root,cleanup:()=>fs.rm(root,{recursive:true,force:true})};
}

// Freeze-time adapter is intentionally explicit: no guessed field aliases and
// no fallback to first/nth. Every correction must come from the actual result.
export async function createReactiveModel({extractCandidates,semanticCss,onFeedback}) {
  assert.equal(typeof extractCandidates,'function');assert.equal(typeof semanticCss,'function');
  const trace=[],observedResults=[];let phase='write',callNumber=0,requests=0;
  const server=http.createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks).toString('utf8');
    try {
      const payload=JSON.parse(raw),messages=payload.messages||[];
      requests++;
      const latest=[...messages].reverse().find(message=>message.role==='tool');
      let action;
      if(phase==='write'){action={name:'write_file',args:{path:'src/pages/index/index.css',content:'page{color:#222}'} };phase='build';}
      else if(phase==='build'){action={name:'build_preview',args:{}};phase='first-wide';}
      else if(phase==='first-wide'){action={name:'verify_preview',args:{steps:firstCheck()}};phase='first-feedback';}
      else if(phase==='first-feedback'||phase==='second-feedback'){
        assert.ok(latest,'PI response must contain an actual preceding toolResult');
        const content=typeof latest.content==='string'?latest.content:latest.content.map(part=>part.text||'').join('\n');
        const result=JSON.parse(content);await onFeedback?.(result);assert.equal(result.state,'failed');assert.equal(result.failureType,'plan');
        const candidates=extractCandidates(result),target=phase==='first-feedback'?'书名':'生成进度二维码';
        assert.ok(candidates.length>=2,'actual feedback must include multiple candidates');
        const matches=candidates.filter(candidate=>candidate.name===target);assert.equal(matches.length,1);
        const chosen=matches[0],selector=semanticCss(chosen,result);assert.equal(typeof selector,'string');
        assert.ok(selector.length);assert.doesNotMatch(selector,/:first|:nth|\.first\(/);
        assert.ok(latest.tool_call_id);trace.push({phase,target,result,candidates,chosen,selector,toolCallId:latest.tool_call_id});
        observedResults.push(result);
        action={name:'verify_preview',args:{steps:phase==='first-feedback'?firstCheck(selector):secondCheck(selector)}};
        phase=phase==='first-feedback'?'second-wide':'finish';
      } else if(phase==='second-wide') {
        assert.ok(latest);const result=JSON.parse(typeof latest.content==='string'?latest.content:latest.content.map(p=>p.text||'').join('\n'));
        await onFeedback?.(result);assert.equal(result.state,'passed','first business expectations must still pass');
        observedResults.push(result);
        action={name:'verify_preview',args:{steps:secondCheck()}};phase='second-feedback';
      } else {
        assert.ok(latest);const result=JSON.parse(typeof latest.content==='string'?latest.content:latest.content.map(p=>p.text||'').join('\n'));
        await onFeedback?.(result);assert.equal(result.state,'passed','original progress QR expectation must pass');observedResults.push(result);phase='done';
      }
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      const send=(delta,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'qa-plan',choices:[{index:0,delta,finish_reason}]})+'\n\n');send({role:'assistant'});
      if(action){send({tool_calls:[{index:0,id:'qa-call-'+(++callNumber),type:'function',function:{name:action.name,arguments:JSON.stringify(action.args)}}]});send({},'tool_calls');}
      else{send({content:'两项原业务检查完成。'});send({},'stop');}res.end('data: [DONE]\n\n');
    } catch(error) { trace.push({error:error.message});res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:error.message}})); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {baseUrl:`http://127.0.0.1:${server.address().port}/v1`,trace,observedResults,get requests(){return requests;},close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}

export function actualCandidates(result) {
  assert.equal(result.failureType,'plan');assert.ok(Array.isArray(result.candidates));
  assert.ok(Array.isArray(result.suggestions));assert.ok(Number.isInteger(result.matchCount));
  for(const candidate of result.candidates){
    for(const field of ['tag','role','name','id','testId'])assert.equal(typeof candidate[field],'string');
    assert.ok(Array.isArray(candidate.ancestorHints));
  }
  return result.candidates;
}
export function actualSuggestion(candidate,result) {
  // Choose only the verifier's proven unique, original-set semantic suggestion.
  const matches=result.suggestions.filter(s=>s.name===candidate.name&&s.tag===candidate.tag&&s.role===candidate.role);
  assert.equal(matches.length,1,'target must have one actual semantic suggestion');
  assert.doesNotMatch(matches[0].selector,/:first|:nth|\.first\(/);
  return matches[0].selector;
}

export function latestToolResult(payload) {
  const tool=[...(payload.messages||[])].reverse().find(message=>message.role==='tool');
  if(!tool)return undefined;
  const text=typeof tool.content==='string'?tool.content:tool.content.map(part=>part.text||'').join('\n');
  try{return JSON.parse(text);}catch{return text;}
}

// Boundary/continuity models still use real PI and default real browser tools.
// The callback reads actual requests/results; summaries are responses to PI's
// own model request, never inserted into product history by the QA host.
export async function createLocalModel({decide,summarize}) {
  const payloads=[],summaries=[];let requests=0;
  const server=http.createServer(async(req,res)=>{
    try{
      const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks).toString('utf8');const payload=JSON.parse(raw);payloads.push(payload);
      const summary=!payload.tools?.length;
      const response=summary?(assert.equal(typeof summarize,'function','unexpected native summary request'),summaries.push(payload),await summarize(payload)):await decide(payload,requests++);
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      const send=(delta,finish_reason=null,usage)=>res.write('data: '+JSON.stringify({id:'qa-continuous',choices:[{index:0,delta,finish_reason}],...(usage?{usage}:{})})+'\n\n');
      send({role:'assistant'});
      if(response?.name){send({tool_calls:[{index:0,id:'qa-local-'+requests,type:'function',function:{name:response.name,arguments:JSON.stringify(response.args||{})}}]});send({},'tool_calls',response.usage);}
      else{send({content:typeof response==='string'?response:response?.text||'所列检查完成。'});send({},'stop',response?.usage);}
      res.end('data: [DONE]\n\n');
    }catch(error){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:error.message}}));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {baseUrl:`http://127.0.0.1:${server.address().port}/v1`,payloads,summaries,get requests(){return requests;},close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
