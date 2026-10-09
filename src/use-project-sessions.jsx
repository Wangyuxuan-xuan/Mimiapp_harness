import {useEffect,useRef,useState} from 'react';

const emptySession={prompt:'',busy:false,stopping:false,status:'',stream:'',logs:[],error:''};
export function useProjectSessions(client,{onSettings,onNotice}){
  const [projects,setProjects]=useState([]),[activeId,setActiveId]=useState(null),[sessions,setSessions]=useState({}),[workspaceError,setWorkspaceError]=useState('');
  const selected=useRef(null),runs=useRef(new Map()),stops=useRef(new Map()),epochs=useRef(new Map()),mounted=useRef(true);
  const active=projects.find(p=>p.id===activeId)||null,session=sessions[activeId]||emptySession;
  const running=!!active?.tasks?.some(task=>task.state==='running');
  const hasRunning=projects.some(p=>p.tasks?.some(t=>t.state==='running'))||Object.values(sessions).some(s=>s.busy||s.stopping);
  function patch(id,change){if(!mounted.current||!id)return;setSessions(old=>({...old,[id]:{...(old[id]||emptySession),...(typeof change==='function'?change(old[id]||emptySession):change)}}));}
  function epoch(id){return epochs.current.get(id)||0;}
  function changed(id){epochs.current.set(id,epoch(id)+1);}
  function updateProject(project,expectedEpoch){
    if(!mounted.current||!project?.id||expectedEpoch!==undefined&&epoch(project.id)!==expectedEpoch)return;
    setProjects(old=>{
      const prior=old.find(p=>p.id===project.id),previousTask=prior?.tasks?.at(-1),nextTask=project.tasks?.at(-1);
      if(prior&&(prior.revision>project.revision||(prior.tasks?.length||0)>(project.tasks?.length||0)))return old;
      if(previousTask?.id===nextTask?.id&&previousTask&&(previousTask.updatedAt>nextTask.updatedAt||previousTask.state!=='running'&&nextTask.state==='running'))return old;
      // Initial preparation has no retry transition in a live service. A delayed
      // same-version read must not replace its terminal state with older metadata.
      if(prior?.revision===project.revision&&previousTask?.id===nextTask?.id&&['failed','interrupted','ready'].includes(prior?.initialization?.state)&&(!project.initialization||project.initialization.state==='preparing'))return old;
      return prior?old.map(p=>p.id===project.id?project:p):[project,...old];
    });
  }
  function selectProject(project){if(!project)return;updateProject(project);selected.current=project.id;setActiveId(project.id);}
  function openProject(project){changed(project.id);selectProject(project);patch(project.id,{error:''});}
  function loadProjects(list){for(const project of list)updateProject(project);if(!selected.current&&list[0])selectProject(list[0]);}
  function setPrompt(value){const id=selected.current;patch(id,{prompt:value});}
  function setError(value,id=selected.current){if(id)patch(id,{error:value});else if(mounted.current)setWorkspaceError(value);}
  useEffect(()=>{
    mounted.current=true;let cancelled=false,timer;
    async function poll(){
      const before=new Map(epochs.current);
      try{const list=await client.projects();if(!cancelled)for(const p of list)updateProject(p,before.get(p.id)||0);}catch{}
      if(!cancelled)timer=setTimeout(poll,1000);
    }
    timer=setTimeout(poll,1000);
    return()=>{cancelled=true;mounted.current=false;clearTimeout(timer);for(const entry of runs.current.values())entry.controller.abort();};
  },[]);
  useEffect(()=>{
    if(!activeId)return;let ignore=false;const before=epoch(activeId);
    client.project(activeId).then(p=>{if(!ignore)updateProject(p,before);}).catch(()=>{});
    return()=>{ignore=true;};
  },[activeId]);
  function requestStop(id,entry){
    if(stops.current.has(id))return stops.current.get(id).finished;
    const pending={entry,finished:null};stops.current.set(id,pending);patch(id,{stopping:true,status:'正在停止…'});
    pending.finished=(async()=>{
      try{await client.stop(id);}catch(e){if(mounted.current&&stops.current.get(id)===pending)patch(id,{error:e.message});}
      finally{if(stops.current.get(id)===pending){stops.current.delete(id);patch(id,{stopping:false,status:entry&&runs.current.get(id)===entry?'正在停止…':''});}}
    })();
    return pending.finished;
  }
  async function send(options={}){
    // Capture ownership and draft before the first await. Navigation is independent.
    const project=active,id=project?.id,draft=session.prompt,message=draft.trim();
    if(!id||(!message&&!options.resumeTaskId&&!options.repair)||runs.current.has(id)||stops.current.has(id)||project.tasks?.some(t=>t.state==='running'))return;
    const entry={controller:new AbortController(),stage:'preflight',stopRequested:false};runs.current.set(id,entry);changed(id);
    patch(id,{busy:true,status:'正在确认模型连接…',stream:'',logs:[],error:''});
    const isCurrent=()=>mounted.current&&runs.current.get(id)===entry;
    try{
      const settings=await client.publicSettings();if(!isCurrent()||entry.stopRequested)return;onSettings(settings);
      if(!settings.hasKey){patch(id,{error:'请先连接模型并填写 API Key。'});return;}
      patch(id,{status:'正在理解你的想法…'});
      entry.stage='starting';
      for await(const event of client.run(id,{prompt:message,...options},{signal:entry.controller.signal,onStarted:()=>{
        entry.stage='running';if(!isCurrent())return;
        patch(id,s=>({prompt:s.prompt===draft?'':s.prompt}));changed(id);
        const before=epoch(id);client.project(id).then(p=>updateProject(p,before)).catch(()=>{});
        if(entry.stopRequested)requestStop(id,entry);
      }})){
        if(!isCurrent())break;
        if(event.type==='status')patch(id,s=>({status:event.text,logs:[...s.logs,event.text]}));
        if(event.type==='text')patch(id,s=>({stream:s.stream+event.text}));
        if(event.type==='done'||event.type==='error'){
          changed(id);if(event.project?.id===id)updateProject(event.project);
          if(event.type==='error')patch(id,{error:event.text});
          else{patch(id,{stream:''});if(selected.current===id)onNotice(event.project?.revision>project.revision?'新版本已保存，预览已更新':'小芽已回复');}
        }
      }
    }catch(e){if(isCurrent())patch(id,{error:e.name==='AbortError'?'连接中断，任务仍可能在制作，请查看进度。':e.message});}
    finally{
      if(isCurrent()){
        runs.current.delete(id);patch(id,{busy:false,status:stops.current.has(id)?'正在停止…':'',stream:''});changed(id);
        const before=epoch(id);try{const latest=await client.project(id);updateProject(latest,before);}catch{}
      }
    }
  }
  async function stop(){
    const id=selected.current;if(!id)return;const entry=runs.current.get(id);
    if(entry){entry.stopRequested=true;if(entry.stage==='preflight'){patch(id,{status:'正在取消发送…'});return;}if(entry.stage==='starting'){patch(id,{status:'正在停止…'});return;}}
    await requestStop(id,entry);
  }
  return {projects,active,sessions,session,running,hasRunning,loadProjects,updateProject,selectProject,openProject,setPrompt,setError,send,stop,workspaceError};
}
