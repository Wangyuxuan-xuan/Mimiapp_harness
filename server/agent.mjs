import fs from 'node:fs/promises';
import path from 'node:path';
import { Type } from 'typebox';
import { APP_ROOT,readSources,readableSourcePath,writeSource } from './store.mjs';
import { buildProject } from './builder.mjs';
import { memoryContext,LIMITS,safeText,safeValue,digestSources,checkpointBudget } from './harness.mjs';
import { verifyPreview,verificationRequirements,validateVerificationPlan,validateVerificationEvidence } from './verify.mjs';
import { modelFetch } from './network.mjs';

const result=text=>({content:[{type:'text',text}],details:{}});
export async function runAgent({store,project,config,prompt,signal,emit,build=buildProject,verify=verifyPreview,task,onPublish,beforeCommit,onBudgetCheckpoint}) {
  if(task)checkpointBudget(task);
  const usedMs=task?.budgetUsedMs||0;
  const remaining=LIMITS.milliseconds-usedMs;
  if(remaining<=0)throw Object.assign(new Error('本任务时间预算已耗尽，不能重置后继续。'),{code:'time-budget-exhausted'});
  signal=AbortSignal.any([signal,AbortSignal.timeout(remaining)]);
  let draft,runtime,session,abort,unsubscribe,budgetExceeded;
  const requirements=verificationRequirements(project,prompt);
  if(task)task.requirements=requirements;
  const failBudget=(code,message)=>{budgetExceeded??=Object.assign(new Error(message+' 本次制作未完成，保留上一个可用版本；请核对结果后显式提交新需求。'),{code});abort?.();throw budgetExceeded;};
  const checkBudget=()=>{signal.throwIfAborted();if(budgetExceeded)throw budgetExceeded;};
  const persistBudget=async()=>{if(!task)return;checkpointBudget(task);try{await (onBudgetCheckpoint?onBudgetCheckpoint():store.save(project));}catch(e){budgetExceeded??=Object.assign(new Error('任务预算保存失败，本次停止且不提交修改。'),{code:'checkpoint-failed',cause:e});abort?.();throw budgetExceeded;}checkBudget();};
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
  let writes=0,builtAt=-1,buildAttempts=task?.buildAttempts||0,toolCalls=task?.toolCalls||0,verifiedAt=-1,verification=null,verifyAttempts=task?.verifyAttempts||0,repairPrompts=task?.repairPrompts||0;
  const reserveBuild=async()=>{checkBudget();if(buildAttempts>=LIMITS.builds)failBudget('build-budget-exhausted','编译修复达到三轮上限。');buildAttempts++;builtAt=-1;verifiedAt=-1;if(task)task.buildAttempts=buildAttempts;await persistBudget();};
  const tools=[
    {name:'verify_preview',label:'检查实际功能',description:'真实浏览器运行已编译应用。action=click点击/fill填写/text文本包含/count精确数量/qr截图解码严格等于value/reload刷新；selector为CSS，fill支持Taro组件内唯一输入框。二维码必须用qr检查实际编码内容，不能固定格子数（合法版本尺寸会变化）；定位含白色边距的二维码容器，最长1024像素。每次调用都开启全新浏览器，业务存储默认空白，不继承上一次调用的页面或存储状态；必须在同一次调用内自包含准备数据和断言。同次调用的reload会保留该次已写入的业务存储。失败返回具体步骤，请先读取源码核对交互副作用及断言预期、选择器是否正确，再决定修改代码还是检查计划；仍以用户明确要求为验收标准，不得仅适配当前行为或降低要求来通过。合计最多三次实际检查。编辑后必须重新编译检查，编译不等于功能通过。',parameters:Type.Object({steps:Type.Array(Type.Object({action:Type.Union(['click','fill','text','count','qr','reload'].map(x=>Type.Literal(x))),selector:Type.Optional(Type.String()),value:Type.Optional(Type.Union([Type.String(),Type.Number()]))}),{minItems:1,maxItems:20})}),async execute(_id,args){
      checkBudget();if(task)task.verifyCalls=(task.verifyCalls||0)+1;
      if(builtAt!==writes)return {...result('请先编译当前源码。'),isError:true};
      try{validateVerificationPlan(args.steps,requirements);}catch(e){verification={state:'failed',error:e.message,kind:'plan-rejected',steps:args.steps};verifiedAt=-1;return {...result(JSON.stringify(verification)),isError:true};}
      if(verifyAttempts>=3){if(task)task.verifyRejected=(task.verifyRejected||0)+1;failBudget('verification-budget-exhausted','实际功能检查已达到三次上限。'+(verification?.error?'最后检查结果：'+verification.error:''));}
      verifyAttempts++;if(task)task.verifyAttempts=verifyAttempts;await persistBudget();
      try{verification=safeValue(await verify(draft,args.steps,{signal}),config.apiKey);validateVerificationEvidence(verification,args.steps,requirements);}catch(e){signal.throwIfAborted();verification={state:'failed',error:safeText(e.message,config.apiKey),kind:'verification-error',steps:args.steps};}
      verification.requirements=requirements;
      verifiedAt=verification.state==='passed'?writes:-1;
      if(task)task.lastVerification=verification;
      emit({type:'status',text:verification.state==='passed'?'所列实际功能检查通过':'功能检查失败，等待修复：'+verification.error});
      return {...result(JSON.stringify(verification)),isError:verification.state!=='passed'};
    }},
    {name:'list_files',label:'查看项目',description:'列出当前小程序的可编辑源码文件。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();return result(Object.keys(await readSources(draft)).join('\n'));}},
    {name:'read_file',label:'读取源码',description:'读取一个项目源码文件。',parameters:Type.Object({path:Type.String()}),async execute(_id,args){signal.throwIfAborted();return result(safeText(await fs.readFile(path.join(draft,readableSourcePath(args.path)),'utf8'),config.apiKey));}},
    {name:'write_file',label:'制作页面',description:'写入完整的页面、组件或样式文件。只允许 src/pages/index/index.jsx、index.css、src/components/*.jsx/css 和 src/app.css。',parameters:Type.Object({path:Type.String(),content:Type.String()}),async execute(_id,args){signal.throwIfAborted();await writeSource(draft,args.path,safeText(args.content,config.apiKey));writes++;return result(`已写入 ${args.path}。请编译检查。`);}},
    {name:'build_preview',label:'检查并编译',description:'编译 H5 预览和微信小程序，返回实际编译错误。编译成功后仍须当前源码的实际功能检查通过才可交付。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();await reserveBuild();try{await build(draft,{signal,onLog:text=>emit({type:'status',text})});builtAt=writes;return result('H5 与微信小程序编译成功。还必须检查当前源码的实际功能才能提交。');}catch(e){if(signal.aborted)throw e;return {...result('编译失败，请修复后再试：\n'+e.message.slice(-14000)),isError:true};}}}
  ];
  // Enforce before execution. SDK event subscribers are observational and an
  // abort at tool_execution_start does not prevent the tool's side effects.
  for(const tool of tools){const execute=tool.execute;tool.execute=async(...args)=>{checkBudget();if(toolCalls>=LIMITS.tools)failBudget('tool-budget-exhausted','本次操作达到40次工具调用上限。');toolCalls++;if(task)task.toolCalls=toolCalls;await persistBudget();return execute(...args);};}
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
    // Model prose is held until the host knows whether this is a discussion or a verified delivery.
    if(event.type==='tool_execution_start'){
      emit({type:'status',text:{list_files:'正在查看项目结构',read_file:'正在阅读现有页面',write_file:'正在制作页面与交互',build_preview:'正在检查并编译两个平台',verify_preview:'正在检查实际交互与业务断言'}[event.toolName]||'正在处理'});

    }
    if(event.type==='message_end'&&event.message?.role==='assistant'){
      lastText=event.message.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
      lastStop=event.message.stopReason;
    }
  });
    signal.throwIfAborted();
    const previous=project.messages.at(-1)?.role==='user'&&project.messages.at(-1)?.text===prompt?project.messages.slice(0,-1):project.messages;
    const history=previous.slice(-10).map(m=>`${m.role==='user'?'用户':'助手'}：${safeText(m.text,config.apiKey).slice(0,600)}`).join('\n');
    const initialPrompt=`项目名称：${project.title}\n近期对话（作为背景）：\n${history}\n\n本次需求：${prompt}\n\n如果用户要求制作或修改，请实际读取、修改项目文件并调用 build_preview 完成双端编译检查，并调用 verify_preview 用实际交互及业务断言检查用户要求。功能检查失败时修复后重试；最多三轮。编译不是功能通过，未完成实际检查必须明确待验证。如果用户在提问或讨论，直接回答，无需为了回复而修改文件。`;

    let nextPrompt=initialPrompt;
    for(;;){
      checkBudget();lastText='';lastStop='';
      try{await session.prompt(nextPrompt);}catch(e){throw budgetExceeded||e;}
      checkBudget();
      if(lastStop==='length')throw new Error('模型输出达到长度限制，未完成本次制作。已保留原版本。');
      const failed=[...session.messages].reverse().find(m=>m.role==='assistant'&&m.stopReason==='error');
      if(failed)throw new Error(failed.errorMessage||'模型请求失败。');
      const discussion=/(?:[?？]$|什么|为什么|解释|介绍|讨论|建议)/.test(prompt)&&!/(?:制作|修改|修复|做一个|生成一个|改成|改为|增加|添加|删除)/.test(prompt)||/^(?:你好|谢谢|早上好|晚安|嗨)[！!。.\s]*$/.test(prompt);
      const requestedChange=/(?:制作|修改|修复|做一个|生成一个|改成|改为|增加|添加|删除)/.test(prompt);
      const noChange=requestedChange&&!writes;
      const delivery=writes>0||verification!==null||!discussion;
      if(!delivery)break;
      if(writes&&builtAt!==writes){
        await reserveBuild();emit({type:'status',text:'正在进行当前源码双端编译验证…'});
        try{await build(draft,{signal,onLog:text=>emit({type:'status',text})});builtAt=writes;}catch(e){signal.throwIfAborted();verification={state:'failed',error:'编译失败：'+safeText(e.message,config.apiKey).slice(-8000),kind:'build-error'};verifiedAt=-1;}
      }
      if(!noChange&&builtAt===writes&&verifiedAt===writes&&verification?.state==='passed')break;
      if(verifyAttempts>=3)failBudget('verification-budget-exhausted','实际功能检查已达到三次上限。'+(verification?.error?'最后检查结果：'+verification.error:''));
      if(repairPrompts>=3)failBudget('repair-budget-exhausted','功能检查未通过，三次自主接续仍未完成。');
      repairPrompts++;if(task)task.repairPrompts=repairPrompts;await persistBudget();
      emit({type:'status',text:'当前制作尚未通过验收，正在自动接续检查或修复（'+repairPrompts+'/3）。'});
      nextPrompt='服务验收尚未通过，不能交付或仅回复完成。继续在当前会话中修复并检查当前源码；不重置任何预算。'+(noChange?'制作或修改需求尚未产生任何源码改动，不能把检查原页面当作完成制作。':verification?.error?'最后失败：'+verification.error:'当前源码缺少有效的实际功能检查。')+' 当前剩余工具 '+(LIMITS.tools-toolCalls)+'，构建 '+(LIMITS.builds-buildAttempts)+'，实际检查 '+(3-verifyAttempts)+'。'+(requirements.profile==='text-qr'?'二维码必须自包含实际输入、点击生成、短中文与至少120字长文逐字解码及空输入反馈。':'请以实际交互和业务断言验证用户要求。');
    }
    if(budgetExceeded)throw budgetExceeded;
    signal.throwIfAborted();
    const failedMessage=[...session.messages].reverse().find(m=>m.role==='assistant'&&m.stopReason==='error');
    if(failedMessage)throw new Error(failedMessage.errorMessage||'模型请求失败。');
    if(toolCalls>40)throw new Error('本次操作达到工具调用上限，已保留原版本。');
    if(lastStop==='length')throw new Error('模型输出达到长度限制，未完成本次制作。已保留原版本，请重试或切换模型。');
    if(!lastText.trim())throw new Error('模型未返回完整答复，本次未提交修改。已保留原版本，请重试或切换模型。');
    lastText=safeText(lastText,config.apiKey);
    if(!writes){
      if(verification){project.verification={...verification,revision:project.revision,sourceDigest:digestSources(await readSources(draft))};}
      const text=verification?'当前版本所列实际功能检查通过。':lastText;
      project.messages.push({role:'assistant',text,time:Date.now()});await store.save(project);emit({type:'text',text});return project;
    }
    checkBudget();
    if(builtAt!==writes||verifiedAt!==writes||verification?.state!=='passed')throw new Error('当前源码未通过实际功能检查，本次不提交修改。');
    const checked={...verification,revision:project.revision+1,sourceDigest:digestSources(await readSources(draft))};
    const deliveryText='本次修改已保存；双端编译及所列实际功能检查通过。'+(requirements.profile==='text-qr'?'已检查短中文、长文真实解码与空输入。':'你可以在预览中继续试用。');
    const candidate={...project,verification:checked,messages:[...project.messages,{role:'assistant',text:deliveryText,time:Date.now()}]};
    await beforeCommit?.();signal.throwIfAborted();await store.commit(candidate,draft,prompt,{signal,beforePublish:onPublish});Object.assign(project,candidate);emit({type:'text',text:deliveryText});return project;
  }finally{if(task)checkpointBudget(task);unsubscribe?.();if(abort)signal.removeEventListener('abort',abort);session?.dispose();if(runtime)await runtime.removeRuntimeApiKey('sprout-model').catch(()=>{});if(draft)await fs.rm(draft,{recursive:true,force:true}).catch(()=>{});}
}
