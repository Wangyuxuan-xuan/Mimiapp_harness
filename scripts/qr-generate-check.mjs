import fs from 'node:fs/promises';
const base=process.env.STUDIO_URL||'http://127.0.0.1:5177';
const html=await(await fetch(base)).text(),token=html.match(/name="studio-token" content="([^"]+)/)[1];
const headers={'Content-Type':'application/json','X-Studio-Token':token};
const response=await fetch(base+'/api/projects',{method:'POST',headers,body:JSON.stringify({title:'文字二维码 · 验收'})});
if(!response.ok)throw new Error(await response.text());
const project=await response.json();console.log('Created',project.id);
await fs.writeFile('test-results/qr-project.json',JSON.stringify({id:project.id,base}));
const r=await fetch(base+`/api/projects/${project.id}/run`,{method:'POST',headers,body:JSON.stringify({prompt:'我想创建一个二维码小程序，上面输入什么，就生成一个二维码 扫出来就是什么 比如说 扫出来显示（I love u）'})});
let buffer='',events=[];
for await(const bytes of r.body){buffer+=Buffer.from(bytes).toString();let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);if(!line)continue;const event=JSON.parse(line);events.push(event);if(event.type!=='text')console.log(event.type,event.text?.slice(-200)||event.project?.revision);}}
await fs.writeFile('test-results/qr-generation.json',JSON.stringify(events,null,2));
if(events.at(-1)?.type!=='done'||events.at(-1).project.revision<=project.revision)throw new Error('No committed generation');
