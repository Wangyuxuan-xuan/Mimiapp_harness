import fs from 'node:fs/promises';
const {base,id}=JSON.parse(await fs.readFile('test-results/qr-project.json','utf8'));
const html=await(await fetch(base)).text();const token=html.match(/name="studio-token" content="([^"]+)/)[1];
const prompt=process.env.QR_PROMPT||'真实测试失败：点击生成 I love u 后，对页面 .qr-wrap 截图用 qrcode-reader 解码，报 Error locator degree does not match number of roots。请检查并修复二维码编码算法，而不是只生成类似图案。请同时修复原文被 trim 导致首尾空格丢失，以及页面宣称长按保存但 View 网格并不能长按保存的问题，明确当前不支持图片保存。保留其他功能并编译检查。';
const r=await fetch(base+`/api/projects/${id}/run`,{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Token':token},body:JSON.stringify({prompt})});
let buffer='',events=[];for await(const bytes of r.body){buffer+=Buffer.from(bytes).toString();let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);if(!line)continue;const e=JSON.parse(line);events.push(e);if(e.type!=='text')console.log(e.type,e.text?.slice(-160)||e.project?.revision);}}
await fs.writeFile('test-results/qr-repair.json',JSON.stringify(events,null,2));
if(events.at(-1)?.type!=='done')process.exitCode=1;
