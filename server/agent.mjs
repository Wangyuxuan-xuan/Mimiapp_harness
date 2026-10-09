import fs from 'node:fs/promises';
import path from 'node:path';
import { Type } from 'typebox';
import { APP_ROOT,readSources,sourcePath,writeSource } from './store.mjs';
import { buildProject } from './builder.mjs';
import { modelFetch } from './network.mjs';

const result=text=>({content:[{type:'text',text}],details:{}});
export async function runAgent({store,project,config,prompt,signal,emit,build=buildProject}) {
  const {createAgentSession,createExtensionRuntime,ModelRuntime,SessionManager,SettingsManager}=await import('@earendil-works/pi-coding-agent');
  const draft=await store.draft(project.id);
  const agentDir=path.join(store.root,'runtime');await fs.mkdir(agentDir,{recursive:true});
  const runtime=await ModelRuntime.create({authPath:path.join(agentDir,'auth.json'),modelsPath:null,modelsStorePath:path.join(agentDir,'models-cache.json'),allowModelNetwork:false,refreshOnCreate:false});
  runtime.registerProvider('sprout-model',{
    baseUrl:config.baseUrl,api:'openai-completions',authHeader:true,
    models:[{id:config.model,name:config.model,input:['text'],reasoning:false,contextWindow:65536,maxTokens:8192,cost:{input:0,output:0,cacheRead:0,cacheWrite:0},compat:{supportsDeveloperRole:false,supportsReasoningEffort:false,maxTokensField:'max_tokens'}}]
  });
  await runtime.setRuntimeApiKey('sprout-model',config.apiKey);
  const skill=await fs.readFile(path.join(APP_ROOT,'agent-skills/mini-program/SKILL.md'),'utf8');
  const resourceLoader={
    getExtensions:()=>({extensions:[],errors:[],runtime:createExtensionRuntime()}),getSkills:()=>({skills:[],diagnostics:[]}),getPrompts:()=>({prompts:[],diagnostics:[]}),getThemes:()=>({themes:[],diagnostics:[]}),getAgentsFiles:()=>({agentsFiles:[]}),
    getSystemPrompt:()=>skill,getSystemPromptSource:()=>undefined,getAppendSystemPrompt:()=>[],getAppendSystemPromptSources:()=>[],extendResources:()=>{},reload:async()=>{}
  };
  let writes=0,builtAt=-1,buildAttempts=0,toolCalls=0;
  const tools=[
    {name:'list_files',label:'查看项目',description:'列出当前小程序的可编辑源码文件。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();return result(Object.keys(await readSources(draft)).join('\n'));}},
    {name:'read_file',label:'读取源码',description:'读取一个项目源码文件。',parameters:Type.Object({path:Type.String()}),async execute(_id,args){signal.throwIfAborted();return result(await fs.readFile(path.join(draft,sourcePath(args.path)),'utf8'));}},
    {name:'write_file',label:'制作页面',description:'写入完整的页面、组件或样式文件。只允许 src/pages/index/index.jsx、index.css、src/components/*.jsx/css 和 src/app.css。',parameters:Type.Object({path:Type.String(),content:Type.String()}),async execute(_id,args){signal.throwIfAborted();await writeSource(draft,args.path,args.content);writes++;return result(`已写入 ${args.path}。请编译检查。`);}},
    {name:'build_preview',label:'检查并编译',description:'编译 H5 预览和微信小程序，返回实际编译错误。成功后才可以向用户报告完成。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();if(++buildAttempts>3)throw new Error('本次编译修复达到上限，请停止并说明错误。');try{await build(draft,{signal,onLog:text=>emit({type:'status',text})});builtAt=writes;return result('H5 与微信小程序编译成功。可以提交本次修改。');}catch(e){if(signal.aborted)throw e;return {...result('编译失败，请修复后再试：\n'+e.message.slice(-14000)),isError:true};}}}
  ];
  const {session}=await createAgentSession({cwd:draft,agentDir,modelRuntime:runtime,model:runtime.getModel('sprout-model',config.model),thinkingLevel:'off',resourceLoader,tools:tools.map(t=>t.name),customTools:tools,sessionManager:SessionManager.inMemory(draft),settingsManager:SettingsManager.inMemory({compaction:{enabled:false},retry:{enabled:true,maxRetries:1}})});
  const stream=session.agent.streamFunction;
  session.agent.streamFunction=(model,context,options)=>stream(model,context,{...options,fetch:modelFetch,onPayload:async(payload,m)=>{
    const next=await options?.onPayload?.(payload,m)??payload;
    if(config.provider==='deepseek'){next.thinking={type:'disabled'};delete next.reasoning_effort;}
    return next;
  }});
  const abort=()=>{session.abort().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
  let lastText='',lastStop='';
  const unsubscribe=session.subscribe(event=>{
    if(event.type==='message_update'&&event.assistantMessageEvent.type==='text_delta')emit({type:'text',text:event.assistantMessageEvent.delta});
    if(event.type==='tool_execution_start'){
      emit({type:'status',text:{list_files:'正在查看项目结构',read_file:'正在阅读现有页面',write_file:'正在制作页面与交互',build_preview:'正在检查并编译两个平台'}[event.toolName]||'正在处理'});
      if(++toolCalls>40)abort();
    }
    if(event.type==='message_end'&&event.message?.role==='assistant'){
      lastText=event.message.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
      lastStop=event.message.stopReason;
    }
  });
  try{
    signal.throwIfAborted();
    const previous=project.messages.at(-1)?.role==='user'&&project.messages.at(-1)?.text===prompt?project.messages.slice(0,-1):project.messages;
    const history=previous.slice(-10).map(m=>`${m.role==='user'?'用户':'助手'}：${m.text}`).join('\n');
    await session.prompt(`项目名称：${project.title}\n近期对话（作为背景）：\n${history}\n\n本次需求：${prompt}\n\n如果用户要求制作或修改，请实际读取、修改项目文件并调用 build_preview 完成双端编译检查。如果用户在提问或讨论，直接回答，无需为了回复而修改文件。`);
    signal.throwIfAborted();
    const failedMessage=[...session.messages].reverse().find(m=>m.role==='assistant'&&m.stopReason==='error');
    if(failedMessage)throw new Error(failedMessage.errorMessage||'模型请求失败。');
    if(toolCalls>40)throw new Error('本次操作达到工具调用上限，已保留原版本。');
    if(lastStop==='length')throw new Error('模型输出达到长度限制，未完成本次制作。已保留原版本，请重试或切换模型。');
    if(!lastText.trim())throw new Error('模型未返回完整答复，本次未提交修改。已保留原版本，请重试或切换模型。');
    if(!writes) { project.messages.push({role:'assistant',text:lastText,time:Date.now()});await store.save(project);return project; }
    if(builtAt!==writes){emit({type:'status',text:'正在进行最终双端编译验证…'});await build(draft,{signal,onLog:text=>emit({type:'status',text})});}
    signal.throwIfAborted();
    project.messages.push({role:'assistant',text:lastText||'修改已完成，H5 和微信小程序均已编译通过。你可以在右侧试用新版本。',time:Date.now()});
    await store.commit(project,draft,prompt);return project;
  }finally{unsubscribe();signal.removeEventListener('abort',abort);session.dispose();await runtime.removeRuntimeApiKey('sprout-model').catch(()=>{});}
}
