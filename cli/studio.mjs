#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import {pathToFileURL} from 'node:url';
import {connectStudio} from './session.mjs';

const help=`Studio CLI（与桌面共用本机服务）
config status | save | test | clear
projects list | create <名称> | show <项目ID>
run <项目ID>                 从标准输入读取需求
resume <项目ID> <任务ID> | repair <项目ID>
progress <项目ID> | stop <项目ID>
verify <项目ID>              标准输入 JSON：{"steps":[...]}
restore <项目ID> <版本ID>
export <项目ID> <新的ZIP路径>
配置 save/test 从安全终端提问，或从标准输入读取 JSON。
密钥只能通过上述输入提供；不支持命令参数或环境变量密钥。`;
async function inputText(input){let value='';for await(const chunk of input){value+=chunk.toString();if(value.length>1000000)throw new Error('输入超过容量。');}return value.trim();}
async function secret(input,output){
 if(!input.isTTY||!input.setRawMode)throw new Error('安全终端输入不可用，请通过标准输入提供配置。');
 output.write('API Key（隐藏输入，留空保留同地址配置）：');const wasRaw=input.isRaw;input.setRawMode(true);input.resume();
 try{return await new Promise((resolve,reject)=>{let value='';const onData=chunk=>{for(const ch of chunk.toString()){if(ch==='\u0003'){cleanup();reject(new Error('已取消输入。'));return;}if(ch==='\r'||ch==='\n'){cleanup();resolve(value);return;}if(ch==='\u007f'||ch==='\b')value=value.slice(0,-1);else if(ch>=' ')value+=ch;if(value.length>4096){cleanup();reject(new Error('API Key 格式无效。'));return;}}};const cleanup=()=>input.off('data',onData);input.on('data',onData);});}finally{input.setRawMode(!!wasRaw);input.pause();output.write('\n');}
}
async function configuration(input,output){
 if(!input.isTTY){try{const value=JSON.parse(await inputText(input));if(!value||typeof value!=='object'||Array.isArray(value))throw 0;return value;}catch{throw new Error('配置输入须为 JSON 对象；输入内容不会显示。');}}
 const rl=readline.createInterface({input,output,terminal:true});let value;
 try{value={provider:(await rl.question('提供方（deepseek/custom）：')).trim()||'deepseek',baseUrl:(await rl.question('API 地址：')).trim()||'https://api.deepseek.com',model:(await rl.question('模型名称：')).trim()};}finally{rl.close();}
 value.apiKey=await secret(input,output);return value;
}
export async function execute(argv,{client,input=process.stdin,output=process.stdout,error=process.stderr}={}){
 const [command,sub,...rest]=argv;const print=value=>output.write(JSON.stringify(value)+'\n');
 const count=(n)=>{if(argv.length!==n||argv.some(x=>x.startsWith('--')))throw new Error('命令参数无效；请运行 help。配置与密钥请使用安全输入。');};
 if(command==='config'){
  count(2);if(sub==='status')print(await client.publicSettings());
  else if(sub==='clear')print(await client.clearKey());
  else if(['save','test'].includes(sub)){const value=await configuration(input,error);print(await(sub==='save'?client.settings(value):client.testSettings(value)));}
  else throw new Error('配置命令无效。');
 }else if(command==='projects'){
  if(sub==='list'){count(2);print(await client.projects());}
  else if(sub==='create'){count(3);print(await client.create(rest[0]));}
  else if(sub==='show'){count(3);print(await client.project(rest[0]));}
  else throw new Error('项目命令无效。');
 }else if(['run','resume','repair'].includes(command)){
  count(command==='resume'?3:2);const value=command==='run'?{prompt:await inputText(input)}:command==='resume'?{resumeTaskId:rest[0]}:{repair:true};let terminal=false,failed=false;
  for await(const event of client.run(sub,value)){print(event);if(['done','error'].includes(event.type)){terminal=true;failed=event.type==='error';}}
  if(!terminal)throw new Error('制作连接中断；请使用 progress 核对任务状态。');if(failed)return 1;
 }else if(command==='progress'){count(2);const project=await client.project(sub);print({id:project.id,revision:project.revision,tasks:project.tasks,verification:project.verification});}
 else if(command==='stop'){count(2);print(await client.stop(sub));}
 else if(command==='verify'){count(2);let value;try{value=JSON.parse(await inputText(input));}catch{throw new Error('验证输入须为 JSON 对象。');}const project=await client.verify(sub,value);print(project);if(project.verification?.state!=='passed')return 1;}
 else if(command==='restore'){count(3);print(await client.restore(sub,rest[0]));}
 else if(command==='export'){count(3);const response=await client.export(sub);const target=path.resolve(rest[0]);await fs.writeFile(target,new Uint8Array(await response.arrayBuffer()),{flag:'wx',mode:0o600});print({exported:true,path:target});}
 else throw new Error('命令无效；请运行 help。');
 return 0;
}
export async function main(argv=process.argv.slice(2)){
 if(!argv.length||['help','--help','-h'].includes(argv[0])){process.stdout.write(help+'\n');return 0;}
 // Reject secret-style options before connecting or producing any diagnostic.
 if(argv.some(x=>x.startsWith('--')))throw new Error('不支持这些命令参数；密钥请使用安全输入。');
 const session=await connectStudio();try{return await execute(argv,{client:session.client});}finally{await session.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){main().then(code=>{process.exitCode=code;}).catch(error=>{process.stderr.write(error.code==='PROFILE_WORKSPACE_CONFLICT'?'同一配置目录已有其他工作区在运行；请使用独立配置目录。\n':'Studio 命令未完成。请检查命令、安全输入或本机工作台状态；输入内容不会回显。\n');process.exitCode=1;});}
