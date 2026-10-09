import {Store} from '../release/win-unpacked/resources/app/server/store.mjs';
import {buildProject} from '../release/win-unpacked/resources/app/server/builder.mjs';
const store=new Store('D:/app/.test-data-packaged');await store.init();
const project=await store.create('打包编译验证');const draft=await store.draft(project.id);
await buildProject(draft,{onLog:console.log});await store.commit(project,draft,'打包环境真实编译');console.log('PASS packaged compiler');
