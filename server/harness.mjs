import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import { atomicJson,readSources } from './store.mjs';
export const LIMITS={memoryChars:48000};
export function checkpointBudget(task,now=Date.now()){if(task.budgetCheckpointAt)task.budgetUsedMs=(task.budgetUsedMs||0)+Math.max(0,now-task.budgetCheckpointAt);task.budgetCheckpointAt=now;}
export function normalizeVerificationBudget(task){
 const count=(value,fallback=0)=>Number.isFinite(value)&&value>=0?value:fallback;
 task.verifyAttempts=count(task.verifyAttempts);
 if(task.budgetVersion!==2&&task.accountingVersion!==2){task.businessVerifyAttempts=task.verifyAttempts;task.verificationRuns=task.verifyAttempts;task.planCorrectionAttempts=0;task.verificationTransientFailures=0;task.runtimeVerifyFailures=0;task.externalVerifyFailures=0;task.accountingVersion=2;}
 task.businessVerifyAttempts=count(task.businessVerifyAttempts,task.verifyAttempts);
 task.verificationRuns=Math.max(count(task.verificationRuns,task.verifyAttempts),task.verifyAttempts,task.businessVerifyAttempts);
 for(const field of ['planCorrectionAttempts','runtimeVerifyFailures','externalVerifyFailures'])task[field]=count(task[field]);
 task.verificationTransientFailures=Math.max(count(task.verificationTransientFailures),task.runtimeVerifyFailures+task.externalVerifyFailures);
 if(!Array.isArray(task.planFailureFingerprints))task.planFailureFingerprints=[];
 return task;
}
export function recoverVerificationInFlight(task){normalizeVerificationBudget(task);if(task.verificationInFlight){task.businessVerifyAttempts=(task.businessVerifyAttempts||0)+1;task.lastVerification={state:'failed',failureType:'business',kind:'interrupted-verification',error:'实际检查中断，结果未知；已记录使用次数，恢复后须重新验收。',reservation:task.verificationInFlight};delete task.verificationInFlight;}}
// Historical callers may query the old API; continuous tasks have no numeric exhaustion.
export function exhaustedBudget(){return false;}
export function safeText(value,key=''){let text=String(value||'');if(key)text=text.split(key).join('[密钥已隐藏]');return text.replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+)/gi,'[密钥已隐藏]');}
export function safeValue(value,key=''){return typeof value==='string'?safeText(value,key):Array.isArray(value)?value.map(x=>safeValue(x,key)):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([name,item])=>[safeText(name,key),safeValue(item,key)])):value;}
// Retain only a possible secret prefix; no partial delta can complete a leaked key.
export function textRedactor(key=''){let pending='';return {push(chunk){pending=safeText(pending+String(chunk||''),key);let keep=0;for(let n=1;n<key.length;n++)if(pending.endsWith(key.slice(0,n)))keep=n;const text=pending.slice(0,pending.length-keep);pending=pending.slice(pending.length-keep);return text;},flush(){const text=pending&&key.startsWith(pending)?'[密钥已隐藏]':safeText(pending,key);pending='';return text;}};}
export function normalizeProject(p){p.memory??={goal:p.title,constraints:'',changes:(p.messages||[]).filter(m=>m.role==='user').map(m=>({text:safeText(m.text),time:m.time})),updatedAt:Date.now()};p.tasks??=[];p.runtimeErrors??=[];return p;}
export function remember(p,prompt,key){normalizeProject(p);const text=safeText(prompt,key);p.memory.changes.push({text,time:Date.now()});p.memory.updatedAt=Date.now();}
export function memoryContext(p){normalizeProject(p);return JSON.stringify(p.memory);}
export function digestSources(sources){return createHash('sha256').update(JSON.stringify(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b)))).digest('hex');}
export async function sourceDigest(store,p){const dir=p.ready?path.join(store.dir(p.id),'revisions',String(p.revision)):path.join(store.dir(p.id),'current');return digestSources(await readSources(dir));}
export async function createTask(store,p,prompt,previous){normalizeProject(p);if(previous){const unknown=!!previous.verificationInFlight;recoverVerificationInFlight(previous);if(unknown)await store.save(p);}if(previous?.state==='completed')throw new Error('已完成任务无需继续。');const currentDigest=await sourceDigest(store,p);if(previous&&(previous.baseRevision!==p.revision||previous.sourceDigest!==currentDigest))throw new Error('恢复基线源码或版本已变化，请核对后提交新需求。');const task={id:randomUUID(),prompt,state:'running',phase:'理解需求',attempts:(previous?.attempts||0)+1,resumedFrom:previous?.id,baseRevision:p.revision,sourceDigest:currentDigest,startedAt:Date.now(),updatedAt:Date.now(),budgetCheckpointAt:Date.now(),events:[],executionPolicy:'continuous',accountingVersion:2};for(const field of ['toolCalls','buildAttempts','verifyAttempts','repairPrompts','budgetUsedMs','businessVerifyAttempts','verificationRuns','planCorrectionAttempts','verificationTransientFailures','runtimeVerifyFailures','externalVerifyFailures'])task[field]=previous?.[field]||0;task.planFailureFingerprints=structuredClone(previous?.planFailureFingerprints||[]);for(const field of ['sessionFile','draftRef','draftSourceDigest','pendingRequirements','requirementsDigest','lastVerification','progressEvidence','sessionBindingTaskId','sessionInitialized','toolFailures'])if(previous?.[field])task[field]=structuredClone(previous[field]);p.tasks.push(task);await store.save(p);return task;}
export async function recoverTasks(store){for(const item of await store.list()){const p=await store.get(item.id);let changed=false;for(const t of p.tasks){if(t.state==='running'){checkpointBudget(t);recoverVerificationInFlight(t);t.state='interrupted';t.resumable=true;t.reason='service-restart';t.phase='服务重启，任务中断；草稿与会话已保留，可显式继续';t.updatedAt=Date.now();changed=true;}}if(changed)await store.save(p);}}
