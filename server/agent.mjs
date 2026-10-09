import fs from 'node:fs/promises';
import path from 'node:path';
import { Type } from 'typebox';
import { APP_ROOT,readSources,readableSourcePath,writeSource } from './store.mjs';
import { buildProject } from './builder.mjs';
import { memoryContext,LIMITS,safeText,safeValue,textRedactor,digestSources } from './harness.mjs';
import { verifyPreview } from './verify.mjs';
import { modelFetch } from './network.mjs';

const result=text=>({content:[{type:'text',text}],details:{}});
export async function runAgent({store,project,config,prompt,signal,emit,build=buildProject,verify=verifyPreview,task,onPublish,beforeCommit}) {
  let draft,runtime,session,abort,unsubscribe,budgetExceeded;const textOutput=textRedactor(config.apiKey);const emitText=text=>{if(text)emit({type:'text',text});};
  try{
  const {createAgentSession,createExtensionRuntime,ModelRuntime,SessionManager,SettingsManager}=await import('@earendil-works/pi-coding-agent');
  draft=await store.draft(project.id);
  const agentDir=path.join(store.root,'runtime');await fs.mkdir(agentDir,{recursive:true});
  runtime=await ModelRuntime.create({authPath:path.join(agentDir,'auth.json'),modelsPath:null,modelsStorePath:path.join(agentDir,'models-cache.json'),allowModelNetwork:false,refreshOnCreate:false});
  runtime.registerProvider('sprout-model',{
    baseUrl:config.baseUrl,api:'openai-completions',authHeader:true,
    models:[{id:config.model,name:config.model,input:['text'],reasoning:false,contextWindow:65536,maxTokens:8192,cost:{input:0,output:0,cacheRead:0,cacheWrite:0},compat:{supportsDeveloperRole:false,supportsReasoningEffort:false,maxTokensField:'max_tokens'}}]
  });
  await runtime.setRuntimeApiKey('sprout-model',config.apiKey);
  const skill=await fs.readFile(path.join(APP_ROOT,'agent-skills/mini-program/SKILL.md'),'utf8');
  const resourceLoader={
    getExtensions:()=>({extensions:[],errors:[],runtime:createExtensionRuntime()}),getSkills:()=>({skills:[],diagnostics:[]}),getPrompts:()=>({prompts:[],diagnostics:[]}),getThemes:()=>({themes:[],diagnostics:[]}),getAgentsFiles:()=>({agentsFiles:[]}),
    getSystemPrompt:()=>skill+'\n持久需求（以用户最新修正为准）：'+safeText(memoryContext(project),config.apiKey),getSystemPromptSource:()=>undefined,getAppendSystemPrompt:()=>[],getAppendSystemPromptSources:()=>[],extendResources:()=>{},reload:async()=>{}
  };
  let writes=0,builtAt=-1,buildAttempts=0,toolCalls=0,verifiedAt=-1,verification=null,verifyAttempts=0;
  const tools=[
    {name:'verify_preview',label:'检查实际功能',description:'真实浏览器运行已编译应用。action=click点击/fill填写/text文本包含/count精确数量/qr截图解码严格等于value/reload刷新；selector为CSS，fill支持Taro组件内唯一输入框。二维码必须用qr检查实际编码内容，不能固定格子数（合法版本尺寸会变化）；定位含白色边距的二维码容器，最长1024像素。失败返回具体步骤，修正选择器或代码后重试；合计最多三次实际检查。编辑后必须重新编译检查，编译不等于功能通过。',parameters:Type.Object({steps:Type.Array(Type.Object({action:Type.Union(['click','fill','text','count','qr','reload'].map(x=>Type.Literal(x))),selector:Type.Optional(Type.String()),value:Type.Optional(Type.Union([Type.String(),Type.Number()]))}),{minItems:1,maxItems:20})}),async execute(_id,args){signal.throwIfAborted();if(builtAt!==writes)return {...result('请先编译当前源码。'),isError:true};if(task)task.verifyCalls=(task.verifyCalls||0)+1;if(verifyAttempts>=3){if(task)task.verifyRejected=(task.verifyRejected||0)+1;budgetExceeded??=Object.assign(new Error('实际功能检查已达到三次上限，本次制作停止并保留上一个可用版本。'+(verification?.error?'最后检查结果：'+verification.error:'')),{code:'verification-budget-exhausted'});emit({type:'status',text:budgetExceeded.message});abort();throw budgetExceeded;}verifyAttempts++;if(task)task.verifyAttempts=verifyAttempts;verification=safeValue(await verify(draft,args.steps,{signal}),config.apiKey);emit({type:'status',text:verification.state==='passed'?'所列实际功能检查通过':'功能检查失败，等待修复：'+verification.error});verifiedAt=verification.state==='passed'?writes:-1;return {...result(JSON.stringify(verification)),isError:verification.state!=='passed'};}},
    {name:'list_files',label:'查看项目',description:'列出当前小程序的可编辑源码文件。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();return result(Object.keys(await readSources(draft)).join('\n'));}},
    {name:'read_file',label:'读取源码',description:'读取一个项目源码文件。',parameters:Type.Object({path:Type.String()}),async execute(_id,args){signal.throwIfAborted();return result(safeText(await fs.readFile(path.join(draft,readableSourcePath(args.path)),'utf8'),config.apiKey));}},
    {name:'write_file',label:'制作页面',description:'写入完整的页面、组件或样式文件。只允许 src/pages/index/index.jsx、index.css、src/components/*.jsx/css 和 src/app.css。',parameters:Type.Object({path:Type.String(),content:Type.String()}),async execute(_id,args){signal.throwIfAborted();await writeSource(draft,args.path,safeText(args.content,config.apiKey));writes++;return result(`已写入 ${args.path}。请编译检查。`);}},
    {name:'build_preview',label:'检查并编译',description:'编译 H5 预览和微信小程序，返回实际编译错误。成功后才可以向用户报告完成。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();if(++buildAttempts>3)throw new Error('本次编译修复达到上限，请停止并说明错误。');try{await build(draft,{signal,onLog:text=>emit({type:'status',text})});builtAt=writes;return result('H5 与微信小程序编译成功。可以提交本次修改。');}catch(e){if(signal.aborted)throw e;return {...result('编译失败，请修复后再试：\n'+e.message.slice(-14000)),isError:true};}}}
  ];
  const sessionDir=path.join(store.dir(project.id),'sessions');await fs.mkdir(sessionDir,{recursive:true});
  const sessionManager=SessionManager.create(draft,sessionDir);
  const sanitize=value=>safeValue(value,config.apiKey);
  const appendMessage=sessionManager.appendMessage.bind(sessionManager);sessionManager.appendMessage=message=>appendMessage(sanitize(message));const appendCompaction=sessionManager.appendCompaction.bind(sessionManager);sessionManager.appendCompaction=(...args)=>appendCompaction(...args.map(sanitize));
  sessionManager.appendCustomEntry('sprout-task',{taskId:task?.id,sourceDigest:task?.sourceDigest,baseRevision:project.revision,resumedFrom:task?.resumedFrom});
  if(task){task.sessionFile=path.basename(sessionManager.getSessionFile());await store.save(project);}
  const older=(await fs.readdir(sessionDir)).filter(name=>name.endsWith('.jsonl')).sort();for(const name of older.slice(0,-50))await fs.rm(path.join(sessionDir,name),{force:true});
  ({session}=await createAgentSession({cwd:draft,agentDir,modelRuntime:runtime,model:runtime.getModel('sprout-model',config.model),thinkingLevel:'off',resourceLoader,tools:tools.map(t=>t.name),customTools:tools,sessionManager,settingsManager:SettingsManager.inMemory({compaction:{enabled:true,reserveTokens:12000,keepRecentTokens:8000},retry:{enabled:true,maxRetries:1}})}));
  const stream=session.agent.streamFunction;
  session.agent.streamFunction=(model,context,options)=>stream(model,context,{...options,fetch:modelFetch,onPayload:async(payload,m)=>{
    const next=await options?.onPayload?.(payload,m)??payload;
    if(config.provider==='deepseek'){next.thinking={type:'disabled'};delete next.reasoning_effort;}
    return next;
  }});
  abort=()=>{session.abort().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
  let lastText='',lastStop='';
  unsubscribe=session.subscribe(event=>{
    if(event.type==='message_update'&&event.assistantMessageEvent.type==='text_delta')emitText(textOutput.push(event.assistantMessageEvent.delta));
    if(event.type==='tool_execution_start'){
      emit({type:'status',text:{list_files:'正在查看项目结构',read_file:'正在阅读现有页面',write_file:'正在制作页面与交互',build_preview:'正在检查并编译两个平台',verify_preview:'正在检查实际交互与业务断言'}[event.toolName]||'正在处理'});
      if(task){task.toolCalls=toolCalls+1;task.buildAttempts=buildAttempts;task.verifyAttempts=verifyAttempts;}if(++toolCalls>40)abort();
    }
    if(event.type==='message_end'&&event.message?.role==='assistant'){
      lastText=event.message.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
      lastStop=event.message.stopReason;
    }
  });
    signal.throwIfAborted();
    const previous=project.messages.at(-1)?.role==='user'&&project.messages.at(-1)?.text===prompt?project.messages.slice(0,-1):project.messages;
    const history=previous.slice(-10).map(m=>`${m.role==='user'?'用户':'助手'}：${safeText(m.text,config.apiKey).slice(0,600)}`).join('\n');
    try{await session.prompt(`项目名称：${project.title}\n近期对话（作为背景）：\n${history}\n\n本次需求：${prompt}\n\n如果用户要求制作或修改，请实际读取、修改项目文件并调用 build_preview 完成双端编译检查，并调用 verify_preview 用实际交互及业务断言检查用户要求。功能检查失败时修复后重试；最多三轮。编译不是功能通过，未完成实际检查必须明确待验证。如果用户在提问或讨论，直接回答，无需为了回复而修改文件。`);}catch(e){throw budgetExceeded||e;}
    if(budgetExceeded)throw budgetExceeded;
    signal.throwIfAborted();
    const failedMessage=[...session.messages].reverse().find(m=>m.role==='assistant'&&m.stopReason==='error');
    if(failedMessage)throw new Error(failedMessage.errorMessage||'模型请求失败。');
    if(toolCalls>40)throw new Error('本次操作达到工具调用上限，已保留原版本。');
    if(lastStop==='length')throw new Error('模型输出达到长度限制，未完成本次制作。已保留原版本，请重试或切换模型。');
    if(!lastText.trim())throw new Error('模型未返回完整答复，本次未提交修改。已保留原版本，请重试或切换模型。');
    lastText=safeText(lastText,config.apiKey);
    if(!writes) { if(verification){project.verification={...verification,revision:project.revision,sourceDigest:digestSources(await readSources(draft))};if(verification.state==='failed')throw new Error('功能检查未通过：'+verification.error);}project.messages.push({role:'assistant',text:lastText,time:Date.now()});await store.save(project);return project; }
    if(builtAt!==writes){if(++buildAttempts>3)throw new Error('编译修复达到三轮上限。');emit({type:'status',text:'正在进行最终双端编译验证…'});await build(draft,{signal,onLog:text=>emit({type:'status',text})});}
    signal.throwIfAborted();
    const checked=verification&&verifiedAt===writes?{...verification,revision:project.revision+1,sourceDigest:digestSources(await readSources(draft))}:{state:'pending',reason:'当前源码尚未通过实际功能检查'};
    if(verification?.state==='failed'&&verifiedAt!==writes)throw new Error('功能检查未通过：'+verification.error);
    const candidate={...project,verification:checked,messages:[...project.messages,{role:'assistant',text:(verifiedAt===writes?lastText:lastText+'\n实际功能待验证；双端编译已通过。')||'修改已完成，H5 和微信小程序均已编译通过。你可以在右侧试用新版本。',time:Date.now()}]};
    await beforeCommit?.();signal.throwIfAborted();await store.commit(candidate,draft,prompt,{signal,beforePublish:onPublish});Object.assign(project,candidate);return project;
  }finally{emitText(textOutput.flush());unsubscribe?.();if(abort)signal.removeEventListener('abort',abort);session?.dispose();if(runtime)await runtime.removeRuntimeApiKey('sprout-model').catch(()=>{});if(draft)await fs.rm(draft,{recursive:true,force:true}).catch(()=>{});}
}
