// Read a key from stdin only; never persist or print it.
const url=process.argv[2]||'http://127.0.0.1:5177';
const html=await(await fetch(url)).text();
const token=html.match(/name="studio-token" content="([^"]+)/)?.[1];
let raw='';
for await(const c of process.stdin){raw+=c;if(raw.includes('\n'))break;}
const r=await fetch(url+'/api/settings',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Token':token},body:JSON.stringify({provider:'deepseek',baseUrl:'https://api.deepseek.com',model:'deepseek-flash',apiKey:raw.trim()})});
raw='';console.log('Settings status',r.status);
if(!r.ok)process.exitCode=1;
