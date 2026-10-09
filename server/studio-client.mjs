// Transport shared by React and the CLI. All business rules stay in startStudio.
export function createStudioClient({url='',token='',fetchImpl=globalThis.fetch}={}){
 if(url){const target=new URL(url);if(target.protocol!=='http:'||target.hostname!=='127.0.0.1'||target.username||target.password||target.search||target.hash||target.pathname!=='/')throw new Error('仅可连接本机 Studio 服务。');url=target.origin;}
 async function response(route,options={}){
  if(!route.startsWith('/')||route.includes('..'))throw new Error('工作台请求无效。');
  let res;try{res=await fetchImpl(url+'/api'+route,{...options,headers:{'Content-Type':'application/json','X-Studio-Token':token,...options.headers},redirect:'error'});}catch{if(options.signal?.aborted)throw new DOMException('请求已取消。','AbortError');throw new Error('无法连接本机工作台，请重新打开应用。');}
  if(!res.ok){let error;try{error=(await res.json()).error;}catch{}throw new Error(typeof error==='string'?error:'工作台请求失败。');}return res;
 }
 const json=async(route,options)=>{const res=await response(route,options);try{return await res.json();}catch{throw new Error('工作台响应格式无效。');}};
 const post=(route,value)=>json(route,{method:'POST',body:JSON.stringify(value)});
 async function* run(id,value,{signal}={}){
  const res=await response(`/projects/${encodeURIComponent(id)}/run`,{method:'POST',body:JSON.stringify(value),signal});
  const reader=res.body.getReader(),decoder=new TextDecoder();let pending='';
  const event=line=>{try{return JSON.parse(line);}catch{throw new Error('制作进度响应格式无效，请查看任务状态。');}};
  try{while(true){const {done,value:chunk}=await reader.read();pending+=decoder.decode(chunk||new Uint8Array(),{stream:!done});let split;while((split=pending.indexOf('\n'))>=0){const line=pending.slice(0,split);pending=pending.slice(split+1);if(line.trim())yield event(line);}if(done)break;}if(pending.trim())yield event(pending);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 }
 return {response,json,run,bootstrap:()=>json('/bootstrap'),publicSettings:()=>json('/settings'),projects:()=>json('/projects'),project:id=>json(`/projects/${encodeURIComponent(id)}`),create:title=>post('/projects',{title}),settings:value=>post('/settings',value),testSettings:value=>post('/settings/test',value),clearKey:()=>json('/settings/key',{method:'DELETE'}),stop:id=>post(`/projects/${encodeURIComponent(id)}/stop`,{}),verify:(id,value)=>post(`/projects/${encodeURIComponent(id)}/verify`,value),restore:(id,versionId)=>post(`/projects/${encodeURIComponent(id)}/restore`,{versionId}),export:id=>response(`/projects/${encodeURIComponent(id)}/export`)};
}
