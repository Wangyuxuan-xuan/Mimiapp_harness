import automator from 'miniprogram-automator';
import net from 'node:net';
const s=net.connect(Number(process.argv[2]||9420),'127.0.0.1',()=>{console.log('TCP ready');s.end()});s.on('error',e=>console.log('TCP',e.code));
const t=setTimeout(()=>{console.log('Simulator timeout');process.exit(2)},20000);
try {console.log('Connecting');const m=await automator.connect({wsEndpoint:'ws://127.0.0.1:'+(process.argv[2]||9420)});console.log('Connected');const p=await m.currentPage();console.log('page',p?.path);if(p)console.log('title',await(await p.$('.hero-title'))?.text());await m.screenshot({path:'test-results/wechat-simulator.png'});m.disconnect();}finally{clearTimeout(t)}

