import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import { Type } from 'typebox';
import { APP_ROOT,readSources,readableSourcePath,writeSource } from './store.mjs';
import { buildProject } from './builder.mjs';
import { LIMITS,safeText,safeValue,digestSources,checkpointBudget,normalizeVerificationBudget } from './harness.mjs';
import { verifyPreview,verificationRequirements,validateVerificationPlan,validateVerificationEvidence } from './verify.mjs';
import { modelFetch } from './network.mjs';

const result=text=>({content:[{type:'text',text}],details:{}});
export async function runAgent({store,project,config,prompt,signal,emit,build=buildProject,verify=verifyPreview,task,onPublish,beforeCommit,onBudgetCheckpoint,testSessionOptions}) {
  const verificationCounts=normalizeVerificationBudget(task||{});
  if(task)checkpointBudget(task);
  let draft,runtime,session,abort,unsubscribe,executionFailure,resumed=false,pendingRequirements=[];
  const requirements=verificationRequirements(project,prompt);
  if(task)task.requirements=requirements;
  const pause=(code,message)=>{executionFailure??=Object.assign(new Error(message),{code,failureType:code==='no-progress'?'no-progress':'external'});abort?.();throw executionFailure;};
  const progressEvidence=new Set(task?.progressEvidence||[]);
  const evidenceValue=value=>Array.isArray(value)?value.map(evidenceValue):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['usage','budget','time','timeMs','timestamp','remaining'].includes(key)).map(([key,item])=>[key,evidenceValue(item)])):value;
  const checkActive=()=>{signal.throwIfAborted();if(executionFailure)throw executionFailure;};
  const persistUsage=async()=>{if(!task)return;checkpointBudget(task);task.executionPolicy='continuous';task.usage={tools:task.toolCalls||0,builds:task.buildAttempts||0,verificationRuns:task.verificationRuns||0,repairPrompts:task.repairPrompts||0,timeMs:task.budgetUsedMs||0,cost:'unknown'};try{await (onBudgetCheckpoint?onBudgetCheckpoint():store.save(project));}catch(e){executionFailure??=Object.assign(new Error('任务状态保存失败，本次暂停且不提交修改，草稿可恢复。'),{code:'checkpoint-failed',failureType:'external',cause:e});abort?.();throw executionFailure;}checkActive();};
  try{
  const {createAgentSession,createExtensionRuntime,ModelRuntime,SessionManager,SettingsManager}=await import('@earendil-works/pi-coding-agent');
  if(task?.resumedFrom){if(task.baseRevision!==project.revision||task.sourceDigest!==digestSources(await readSources(project.ready?path.join(store.dir(project.id),'revisions',String(project.revision)):path.join(store.dir(project.id),'current'))))throw new Error('恢复基线源码或版本已变化。');}
  if(task?.draftRef){draft=await store.taskPath(project.id,'drafts',task.draftRef);resumed=true;}else{draft=await store.draft(project.id);if(task){task.draftRef=path.basename(draft);delete task.sessionFile;delete task.sessionBindingTaskId;task.sessionInitialized=false;task.draftSourceDigest=digestSources(await readSources(draft));await persistUsage();}}

  const agentDir=path.join(store.root,'runtime');await fs.mkdir(agentDir,{recursive:true});
  runtime=await ModelRuntime.create({authPath:path.join(agentDir,'auth.json'),modelsPath:null,modelsStorePath:path.join(agentDir,'models-cache.json'),allowModelNetwork:false,refreshOnCreate:false});
  runtime.registerProvider('sprout-model',{
    baseUrl:config.baseUrl,api:'openai-completions',authHeader:true,
    models:[{id:config.model,name:config.model,input:['text'],reasoning:false,contextWindow:testSessionOptions?.contextWindow||65536,maxTokens:8192,cost:{input:0,output:0,cacheRead:0,cacheWrite:0},compat:{supportsDeveloperRole:false,supportsReasoningEffort:false,maxTokensField:'max_tokens'}}]
  });
  await runtime.setRuntimeApiKey('sprout-model',config.apiKey);
  const skill=await fs.readFile(path.join(APP_ROOT,'agent-skills/mini-program/SKILL.md'),'utf8');
  const requirementsDigest=createHash('sha256').update(JSON.stringify(project.memory)).digest('hex');
  const checkRequirements=()=>{if(createHash('sha256').update(JSON.stringify(project.memory)).digest('hex')!==requirementsDigest)pause('requirements-changed','持久需求已变化；已读取页覆盖失效，保存草稿后请按最新需求恢复。');};
  const stable={goal:project.memory?.goal||'',constraints:project.memory?.constraints||''};for(const [section,text] of Object.entries(stable))if(JSON.stringify(stable).length>LIMITS.memoryChars){pendingRequirements.push({section,offset:0,total:text.length});stable[section]='原文未装载，请用read_requirements分页读取，共'+text.length+'字符。';}
  const resourceLoader={
    getExtensions:()=>({extensions:[],errors:[],runtime:createExtensionRuntime()}),getSkills:()=>({skills:[],diagnostics:[]}),getPrompts:()=>({prompts:[],diagnostics:[]}),getThemes:()=>({themes:[],diagnostics:[]}),getAgentsFiles:()=>({agentsFiles:[]}),
    getSystemPrompt:()=>skill+'\n持久需求（以用户最新修正为准）：'+safeText(JSON.stringify(stable),config.apiKey),getSystemPromptSource:()=>undefined,getAppendSystemPrompt:()=>[],getAppendSystemPromptSources:()=>[],extendResources:()=>{},reload:async()=>{}
  };
  let writes=resumed&&digestSources(await readSources(draft))!==task.sourceDigest?1:0,builtAt=-1,buildAttempts=task?.buildAttempts||0,toolCalls=task?.toolCalls||0,verifiedAt=-1,verification=null,verifyAttempts=task?.verifyAttempts||0,repairPrompts=task?.repairPrompts||0;
  const usageFeedback=()=>({business:verificationCounts.businessVerifyAttempts,plan:verificationCounts.planCorrectionAttempts,runs:verificationCounts.verificationRuns,transient:verificationCounts.verificationTransientFailures,tools:task?.toolCalls??toolCalls,builds:task?.buildAttempts??buildAttempts,timeMs:task?.budgetUsedMs||0});
  const reserveBuild=async()=>{checkActive();buildAttempts++;builtAt=-1;verifiedAt=-1;if(task)task.buildAttempts=buildAttempts;await persistUsage();};
  const tools=[
    {name:'verify_preview',label:'检查实际功能',description:'真实浏览器运行已编译应用。action=click点击/fill填写/text文本包含/count精确数量/qr截图解码严格等于value/reload刷新；selector为CSS，fill支持Taro组件内唯一输入框。二维码必须用qr检查实际编码内容，不能固定格子数（合法版本尺寸会变化）；定位含白色边距的二维码容器，最长1024像素。每次调用都开启全新浏览器，业务存储默认空白，不继承上一次调用的页面或存储状态；必须在同一次调用内自包含准备数据和断言。同次调用的reload会保留该次已写入的业务存储。失败返回具体步骤，请先读取源码核对交互副作用及断言预期、选择器是否正确，再决定修改代码还是检查计划；仍以用户明确要求为验收标准，不得仅适配当前行为或降低要求来通过。持续按真实反馈修正，次数仅作使用记录；外部环境不可用时保存并暂停。结构化定位反馈只提供候选，请按目标语义修正，不盲取first/nth。编辑后必须重新编译检查，编译不等于功能通过。',parameters:Type.Object({steps:Type.Array(Type.Object({action:Type.Union(['click','fill','text','count','qr','reload'].map(x=>Type.Literal(x))),selector:Type.Optional(Type.String()),value:Type.Optional(Type.Union([Type.String(),Type.Number()]))}),{minItems:1,maxItems:20})}),async execute(_id,args){
      checkActive();if(task)task.verifyCalls=(task.verifyCalls||0)+1;
      if(builtAt!==writes)return {...result(JSON.stringify({state:'failed',kind:'build-required',error:'请先编译当前源码。',usage:usageFeedback()})),isError:true};
      const sourceDigest=digestSources(await readSources(draft)),stepsDigest=createHash('sha256').update(JSON.stringify(args.steps)).digest('hex');
      const previousPlan=verificationCounts.planFailureFingerprints.find(f=>f.sourceDigest===sourceDigest&&f.stepsDigest===stepsDigest);
      if(previousPlan){verifiedAt=-1;if(previousPlan.feedbackDelivered)pause('no-progress','相同源码与完整计划在已有定位证据和换策略提示后仍未改变；本次暂停，草稿与会话可恢复。');previousPlan.feedbackDelivered=true;await persistUsage();return {...result(JSON.stringify({state:'failed',failureType:'plan',kind:'reused-plan-evidence',...previousPlan,error:'已确认同一定位错误；不重复启动浏览器。请读取源码，按既有候选修正目标语义或实现，不能盲取first/nth。',usage:usageFeedback()})),isError:true};}
      const recordPlan=()=>{verificationCounts.planCorrectionAttempts++;if(!['selector-syntax','selector-ambiguous'].includes(verification.planKind))return;const s=args.steps[verification.step-1];const fingerprint=createHash('sha256').update(JSON.stringify([sourceDigest,s?.selector,s?.action,s?.value,verification.planKind,verification.error])).digest('hex');verificationCounts.planFailureFingerprints.push({fingerprint,sourceDigest,stepsDigest,step:verification.step,planKind:verification.planKind,action:s?.action,selector:s?.selector,value:safeValue(s?.value,config.apiKey),error:verification.error,candidates:verification.candidates,suggestions:verification.suggestions});};
      try{validateVerificationPlan(args.steps,requirements);}catch(e){verification=safeValue({state:'failed',failureType:'plan',error:e.message,kind:'plan-rejected',steps:args.steps},config.apiKey);verifiedAt=-1;recordPlan();verificationCounts.lastVerification=verification;await persistUsage();return {...result(JSON.stringify({...verification,usage:usageFeedback()})),isError:true};}
      verificationCounts.verificationRuns++;verifyAttempts++;verificationCounts.verifyAttempts=verifyAttempts;
      verificationCounts.verificationInFlight={id:randomUUID(),sourceDigest,stepsDigest,startedAt:Date.now()};await persistUsage();
      try{verification=safeValue(await verify(draft,args.steps,{signal}),config.apiKey);validateVerificationEvidence(verification,args.steps,requirements);}catch(e){signal.throwIfAborted();verification={state:'failed',failureType:'business',error:safeText(e.message,config.apiKey),kind:'verification-error',steps:args.steps};}
      // Only the real host verifier may classify a non-business outcome.
      const failureType=verification.state==='passed'?'business':verify===verifyPreview&&['plan','business','runtime','external'].includes(verification.failureType)?verification.failureType:'business';
      if(verification.state!=='passed')verification.failureType=failureType;
      if(failureType==='plan')recordPlan();
      else if(failureType==='runtime'||failureType==='external'){verificationCounts.verificationTransientFailures++;const field=failureType==='runtime'?'runtimeVerifyFailures':'externalVerifyFailures';verificationCounts[field]++;}
      else verificationCounts.businessVerifyAttempts++;
      delete verificationCounts.verificationInFlight;verificationCounts.lastVerification=verification;await persistUsage();
      verification.requirements=requirements;
      verifiedAt=verification.state==='passed'?writes:-1;
      if(task)task.lastVerification=verification;
      if(failureType==='external')pause('external-unavailable','浏览器或外部环境不可用：'+verification.error+'；草稿与会话已保留，请环境恢复后继续。');
      emit({type:'status',text:verification.state==='passed'?'所列实际功能检查通过':'功能检查失败，等待修复：'+verification.error});
      return {...result(JSON.stringify({...verification,usage:usageFeedback()})),isError:verification.state!=='passed'};
    }},
    {name:'read_requirements',label:'读取完整需求',description:'按页读取持久需求原文。section=changes时index为变更序号；offset为字符偏移，返回nextOffset/total；不能跳过未装载约束。',parameters:Type.Object({section:Type.Union(['goal','constraints','changes'].map(x=>Type.Literal(x))),index:Type.Optional(Type.Number()),offset:Type.Optional(Type.Number())}),async execute(_id,args){const text=args.section==='changes'?project.memory?.changes?.[args.index]?.text:project.memory?.[args.section];if(typeof text!=='string'||!Number.isInteger(args.offset??0)||(args.offset??0)<0)throw new Error('需求页不存在。');const offset=args.offset??0,end=Math.min(text.length,offset+12000);if(task){task.requirementPageInFlight={section:args.section,index:args.index,offset,requirementsDigest};await persistUsage();}await testSessionOptions?.beforeRequirementResult?.({task,project});return result(JSON.stringify({kind:'requirement-page',section:args.section,index:args.index,offset,nextOffset:end<text.length?end:null,total:text.length,requirementsDigest,text:safeText(text.slice(offset,end),config.apiKey)}));}},
    {name:'list_files',label:'查看项目',description:'列出当前小程序的可编辑源码文件。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();return result(Object.keys(await readSources(draft)).join('\n'));}},
    {name:'read_file',label:'读取源码',description:'读取一个项目源码文件。',parameters:Type.Object({path:Type.String()}),async execute(_id,args){signal.throwIfAborted();return result(safeText(await fs.readFile(path.join(draft,readableSourcePath(args.path)),'utf8'),config.apiKey));}},
    {name:'write_file',label:'制作页面',description:'写入完整的页面、组件或样式文件。只允许 src/pages/index/index.jsx、index.css、src/components/*.jsx/css 和 src/app.css。',parameters:Type.Object({path:Type.String(),content:Type.String()}),async execute(_id,args){signal.throwIfAborted();await writeSource(draft,args.path,safeText(args.content,config.apiKey));writes++;if(task){task.draftSourceDigest=digestSources(await readSources(draft));await persistUsage();}return result(`已写入 ${args.path}。请编译检查。`);}},
    {name:'build_preview',label:'检查并编译',description:'编译 H5 预览和微信小程序，返回实际编译错误。编译成功后仍须当前源码的实际功能检查通过才可交付。',parameters:Type.Object({}),async execute(){signal.throwIfAborted();await reserveBuild();try{await build(draft,{signal,onLog:text=>emit({type:'status',text})});builtAt=writes;return result('H5 与微信小程序编译成功。还必须检查当前源码的实际功能才能提交。');}catch(e){if(signal.aborted)throw e;return {...result('编译失败，请修复后再试：\n'+e.message.slice(-14000)),isError:true};}}}
  ];
  // Enforce before execution. SDK event subscribers are observational and an
  // abort at tool_execution_start does not prevent the tool's side effects.
  const toolFailures=(task?.toolFailures||[]).filter(f=>!f.output?.some(c=>c?.kind==='build-required'));
  const evidenceDigest=()=>createHash('sha256').update(JSON.stringify([...progressEvidence].sort())).digest('hex');
  for(const tool of tools){const execute=tool.execute;tool.execute=async(...args)=>{
    checkActive();checkRequirements();toolCalls++;if(task)task.toolCalls=toolCalls;await persistUsage();
    const source=digestSources(await readSources(draft)),key=createHash('sha256').update(JSON.stringify(safeValue([source,tool.name,args[1]],config.apiKey))).digest('hex');
    let cached=toolFailures.find(f=>f.key===key);let output;if(cached?.strategyFeedback&&cached.evidence!==evidenceDigest()){toolFailures.splice(toolFailures.indexOf(cached),1);cached=undefined;}
    if(cached){const evidence=evidenceDigest();if(cached.strategyFeedback&&cached.evidence===evidence)pause('no-progress','同一源码和完整工具参数已有失败证据及换策略反馈，仍无新诊断或修改；暂停并保留草稿与会话。');cached.strategyFeedback=true;cached.evidence=evidence;output={...result(JSON.stringify({state:'failed',kind:'reused-tool-evidence',failureType:cached.failureType,tool:tool.name,evidence:cached.output,error:'复用已有失败证据，不重复运行。请读取新的相关源码/需求获得诊断，或改变实现/检查策略；不能重复同一失败操作。',usage:usageFeedback()})),isError:true};}
    else try{output=await execute(...args);}catch(e){signal.throwIfAborted();checkActive();if(e.code==='checkpoint-failed')throw e;output={...result(JSON.stringify({state:'failed',kind:'tool-error',tool:tool.name,error:safeText(e.message||String(e),config.apiKey)})),isError:true};}
    const content=output?.content?.map(c=>{if(c.type!=='text')return c;try{return evidenceValue(JSON.parse(c.text));}catch{return c.text;}});
    if(!cached&&output.isError){let failureType='business';try{failureType=JSON.parse(output.content[0].text).failureType||failureType;}catch{}if(!content.some(c=>c?.planKind==='selector-missing'||c?.kind==='build-required'))toolFailures.push({key,tool:tool.name,sourceDigest:source,output:safeValue(content,config.apiKey),failureType});}
    // Reusing an old failure/strategy message is not new diagnostic evidence.
    if(!cached)progressEvidence.add(createHash('sha256').update(JSON.stringify(safeValue([tool.name,args[1],content],config.apiKey))).digest('hex'));
    if(cached)cached.evidence=evidenceDigest();
    if(task){task.progressEvidence=[...progressEvidence];task.toolFailures=toolFailures;}await persistUsage();return output;
  };}
  const sessionDir=path.join(store.dir(project.id),'sessions');await fs.mkdir(sessionDir,{recursive:true});
  let hasNativeSession=!!(resumed&&task.sessionFile),sessionPath;
  if(hasNativeSession){try{sessionPath=await store.taskPath(project.id,'sessions',task.sessionFile);}catch(e){if(e.code!=='ENOENT'||task.sessionInitialized===true)throw e;hasNativeSession=false;}}
  const sessionManager=hasNativeSession?SessionManager.open(sessionPath,sessionDir,draft):SessionManager.create(draft,sessionDir);
  if(hasNativeSession){const binding=[...sessionManager.getEntries()].reverse().find(e=>e.type==='custom'&&e.customType==='sprout-task')?.data,header=sessionManager.getHeader();if(!binding||![task.sessionBindingTaskId,task.resumedFrom].includes(binding.taskId)||binding.sourceDigest!==task.sourceDigest||binding.baseRevision!==task.baseRevision||binding.projectId&&binding.projectId!==project.id||binding.draftRef&&binding.draftRef!==task.draftRef||path.resolve(header?.cwd||'')!==path.resolve(draft))pause('session-binding-mismatch','恢复会话与本任务/草稿绑定不符；拒绝打开其他会话，未追加新绑定。');}
  if(task)task.recoveryMode=hasNativeSession?'native-session-and-draft':resumed?'initialization-interrupted-context-rebuilt':task.resumedFrom?'current-source-context-rebuilt':'new-session';

  const sanitize=value=>safeValue(value,config.apiKey);
  const appendMessage=sessionManager.appendMessage.bind(sessionManager);sessionManager.appendMessage=message=>{const id=appendMessage(sanitize(message));if(task&&['user','assistant'].includes(message.role))task.sessionInitialized=true;return id;};const appendCompaction=sessionManager.appendCompaction.bind(sessionManager);sessionManager.appendCompaction=(...args)=>appendCompaction(...args.map(sanitize));
  sessionManager.appendCustomEntry('sprout-task',{taskId:task?.id,sourceDigest:task?.sourceDigest,baseRevision:project.revision,resumedFrom:task?.resumedFrom,projectId:project.id,draftRef:task?.draftRef});
  if(task){task.sessionFile=path.basename(sessionManager.getSessionFile());task.sessionBindingTaskId=task.id;task.sessionInitialized=hasNativeSession;await store.save(project);}
  ({session}=await createAgentSession({cwd:draft,agentDir,modelRuntime:runtime,model:runtime.getModel('sprout-model',config.model),thinkingLevel:'off',resourceLoader,tools:tools.map(t=>t.name),customTools:tools,sessionManager,settingsManager:SettingsManager.inMemory({compaction:{enabled:true,reserveTokens:12000,keepRecentTokens:testSessionOptions?.keepRecentTokens??8000},retry:{enabled:true,maxRetries:1}})}));
  const stream=session.agent.streamFunction;
  session.agent.streamFunction=(model,context,options)=>stream(model,context,{...options,fetch:modelFetch,onPayload:async(payload,m)=>{
    const next=await options?.onPayload?.(payload,m)??payload;
    if(config.provider==='deepseek'){next.thinking={type:'disabled'};delete next.reasoning_effort;}
    return next;
  }});
  abort=()=>{session.abort().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
  let lastText='',lastStop='',lastError='',lastNoProgress;

  unsubscribe=session.subscribe(event=>{
    if(event.type==='compaction_start'||event.type==='compaction_end'){if(task)task.compaction={state:event.type.endsWith('start')?'running':event.aborted?'aborted':event.errorMessage?'failed':'completed',reason:event.reason,time:Date.now(),error:safeText(event.errorMessage||'',config.apiKey)};emit({type:'status',text:event.type.endsWith('start')?'正在压缩会话上下文，保留需求和最近反馈':'会话上下文压缩已结束'});}
    // Model prose is held until the host knows whether this is a discussion or a verified delivery.
    if(event.type==='tool_execution_start'){
      emit({type:'status',text:{list_files:'正在查看项目结构',read_file:'正在阅读现有页面',write_file:'正在制作页面与交互',build_preview:'正在检查并编译两个平台',verify_preview:'正在检查实际交互与业务断言'}[event.toolName]||'正在处理'});

    }
    if(event.type==='message_end'&&event.message?.role==='assistant'){
      lastText=event.message.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
      lastStop=event.message.stopReason;lastError=event.message.errorMessage||'';
    }
  });
    signal.throwIfAborted();
    const previous=project.messages.at(-1)?.role==='user'&&project.messages.at(-1)?.text===prompt?project.messages.slice(0,-1):project.messages;
    const history=previous.slice(-10).map(m=>`${m.role==='user'?'用户':'助手'}：${safeText(m.text,config.apiKey).slice(0,600)}`).join('\n');
    const initialPrompt=`项目名称：${project.title}\n近期对话（作为背景）：\n${history}\n\n本次需求：${prompt}\n\n如果用户要求制作或修改，请实际读取、修改项目文件并调用 build_preview 完成双端编译检查，并调用 verify_preview 用实际交互及业务断言检查用户要求。功能或检查计划失败时依据工具反馈在当前会话修复后重试：持续制作直至当前需求真实通过或用户停止；工具/构建/验证/接续次数与时间仅作记录；定位歧义按语义候选修正，不盲取first/nth。编译不是功能通过，未完成实际检查必须明确待验证。如果用户在提问或讨论，直接回答，无需为了回复而修改文件。`;

    const stablePages=structuredClone(pendingRequirements),changes=project.memory?.changes||[];
    const historyMarker='\n<sprout-requirements digest="'+requirementsDigest+'">\n'+safeText(JSON.stringify(changes),config.apiKey)+'\n</sprout-requirements>';
    const rebuildCoverage=()=>{
      pendingRequirements=[...structuredClone(stablePages),...changes.map((c,index)=>({section:'changes',index,offset:0,total:c.text.length}))];
      const calls=new Map(),entries=sessionManager.getEntries();let fullHistory=false;
      for(const entry of entries){const m=entry.message;if(!m)continue;if(m.role==='user'&&(typeof m.content==='string'?m.content:m.content?.filter(c=>c.type==='text').map(c=>c.text).join('')).includes(historyMarker))fullHistory=true;
        if(m.role==='assistant')for(const c of m.content||[])if(c.type==='toolCall'&&c.name==='read_requirements')calls.set(c.id,c.arguments);
        if(m.role!=='toolResult'||m.toolName!=='read_requirements'||m.isError)continue;const call=calls.get(m.toolCallId);if(!call)continue;
        for(const c of m.content||[]){if(c.type!=='text')continue;let page;try{page=JSON.parse(c.text);}catch{continue;}if(page.kind!=='requirement-page'||page.requirementsDigest!==requirementsDigest||page.section!==call.section||page.index!==call.index||page.offset!==(call.offset??0))continue;
          const original=page.section==='changes'?changes[page.index]?.text:project.memory?.[page.section];if(typeof original!=='string'||page.total!==original.length||page.text!==safeText(original.slice(page.offset,page.offset+12000),config.apiKey))continue;
          const pending=pendingRequirements.find(p=>p.section===page.section&&p.index===page.index);if(pending&&pending.offset===page.offset){pending.offset=Math.min(original.length,page.offset+12000);if(pending.offset===pending.total)pendingRequirements=pendingRequirements.filter(p=>p!==pending);}
        }
      }
      if(fullHistory)pendingRequirements=pendingRequirements.filter(p=>p.section!=='changes');
      if(task){task.pendingRequirements=pendingRequirements;task.requirementsDigest=requirementsDigest;delete task.requirementPageInFlight;}
    };
    rebuildCoverage();
    const pendingDirectory=()=>({count:pendingRequirements.length,pages:pendingRequirements.slice(0,10)});
    const requirementHistory=!hasNativeSession&&JSON.stringify(changes).length<=LIMITS.memoryChars?historyMarker:'\n历史需求未全部装入上下文，必须使用read_requirements依次读取全部原文再交付：'+JSON.stringify(pendingDirectory());
    if(task)await persistUsage();
    let compactTestDone=false;
    let nextPrompt=initialPrompt+requirementHistory+(resumed?'\n已恢复精确会话及未交付草稿；构建和功能验收全部失效，必须重新检查。最后实际反馈：'+JSON.stringify(safeValue(task.lastVerification||{},config.apiKey)):'');

    await testSessionOptions?.beforeInitialPrompt?.({task,project});
    for(;;){
      checkActive();lastText='';lastStop='';lastError='';
      try{await session.prompt(nextPrompt);}catch(e){throw executionFailure||Object.assign(e,{code:task?.compaction?.state==='failed'?'compaction-unavailable':'provider-unavailable',failureType:'external'});}
      checkActive();checkRequirements();rebuildCoverage();await persistUsage();
      if(task?.compaction?.state==='failed')pause('compaction-unavailable','会话压缩失败：'+task.compaction.error+'；草稿与会话已保留。');
      if(testSessionOptions?.compactAfterPrompt&&!compactTestDone){compactTestDone=true;await session.compact('保留原始需求与约束、最近工具错误、草稿待验收事实。');await persistUsage();checkActive();}
      if(lastStop==='length')throw new Error('模型输出达到长度限制，未完成本次制作。已保留原版本。');
      if(lastStop==='error')throw Object.assign(new Error(lastError||'模型请求失败，草稿与会话已保留。'),{code:'provider-unavailable',failureType:'external'});
      const discussion=/(?:[?？]$|什么|为什么|解释|介绍|讨论|建议)/.test(prompt)&&!/(?:制作|修改|修复|做一个|生成一个|改成|改为|增加|添加|删除)/.test(prompt)||/^(?:你好|谢谢|早上好|晚安|嗨)[！!。.\s]*$/.test(prompt);
      const requestedChange=/(?:制作|修改|修复|做一个|生成一个|改成|改为|增加|添加|删除)/.test(prompt);
      const noChange=requestedChange&&!writes;
      const delivery=writes>0||verification!==null||!discussion;
      if(!delivery)break;
      if(writes&&builtAt!==writes){
        await reserveBuild();emit({type:'status',text:'正在进行当前源码双端编译验证…'});
        try{await build(draft,{signal,onLog:text=>emit({type:'status',text})});builtAt=writes;}catch(e){signal.throwIfAborted();verification={state:'failed',error:'编译失败：'+safeText(e.message,config.apiKey).slice(-8000),kind:'build-error'};verifiedAt=-1;}
      }
      if(!noChange&&!pendingRequirements.length&&(!task||task.requirementsDigest===requirementsDigest)&&builtAt===writes&&verifiedAt===writes&&verification?.state==='passed')break;
      const noProgress=JSON.stringify([digestSources(await readSources(draft)),verification?.error||'missing-verification',verification?.steps,pendingRequirements,[...progressEvidence].sort()]);
      if(lastNoProgress===noProgress)throw Object.assign(new Error('已提示当前缺失验收或失败原因，但本轮源码和检查证据均未改变；暂停并保留草稿，可核对后继续。'),{code:'no-progress'});lastNoProgress=noProgress;
      repairPrompts++;if(task)task.repairPrompts=repairPrompts;await persistUsage();
      emit({type:'status',text:'当前制作尚未通过验收，正在自动接续检查或修复（第'+repairPrompts+'轮）。'});
      nextPrompt='服务验收尚未通过，不能仅回复完成。请读取源码或需求原文，在当前会话根据证据修复并检查；次数只是使用记录。'+(noChange?'制作需求尚无源码改动。':verification?.error?'最后失败：'+verification.error:'当前源码缺少实际功能检查。')+(pendingRequirements.length?'未读取完整历史需求：'+JSON.stringify(pendingDirectory()):'')+(requirements.profile==='text-qr'?'二维码须自包含输入、点击、短中文及120字长文逐字解码和空反馈。':'按实际交互及业务断言检查。');
    }
    if(executionFailure)throw executionFailure;
    signal.throwIfAborted();
    if(lastStop==='error')throw Object.assign(new Error(lastError||'模型请求失败。'),{code:'provider-unavailable',failureType:'external'});
    if(lastStop==='length')throw new Error('模型输出达到长度限制，未完成本次制作。已保留原版本，请重试或切换模型。');
    if(!lastText.trim())throw new Error('模型未返回完整答复，本次未提交修改。已保留原版本，请重试或切换模型。');
    lastText=safeText(lastText,config.apiKey);
    if(!writes){
      if(verification){project.verification={...verification,revision:project.revision,sourceDigest:digestSources(await readSources(draft))};}
      const text=verification?'当前版本所列实际功能检查通过。':lastText;
      project.messages.push({role:'assistant',text,time:Date.now()});await store.save(project);emit({type:'text',text});return project;
    }
    checkActive();
    if(builtAt!==writes||verifiedAt!==writes||verification?.state!=='passed')throw new Error('当前源码未通过实际功能检查，本次不提交修改。');
    const checked={...verification,revision:project.revision+1,sourceDigest:digestSources(await readSources(draft))};
    const deliveryText='本次修改已保存；双端编译及所列实际功能检查通过。'+(requirements.profile==='text-qr'?'已检查短中文、长文真实解码与空输入。':'你可以在预览中继续试用。');
    const candidate={...project,verification:checked,messages:[...project.messages,{role:'assistant',text:deliveryText,time:Date.now()}]};
    await beforeCommit?.();signal.throwIfAborted();await store.commit(candidate,draft,prompt,{signal,beforePublish:onPublish});Object.assign(project,candidate);emit({type:'text',text:deliveryText});return project;
  }finally{if(task)checkpointBudget(task);unsubscribe?.();if(abort)signal.removeEventListener('abort',abort);session?.dispose();if(runtime)await runtime.removeRuntimeApiKey('sprout-model').catch(()=>{});if(task&&draft){try{task.draftSourceDigest=digestSources(await readSources(draft));}catch{}await store.save(project);}}
}
