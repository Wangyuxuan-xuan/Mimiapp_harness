import {Store} from '../release-qr-fix/win-unpacked/resources/app/server/store.mjs';
import {buildProject} from '../release-qr-fix/win-unpacked/resources/app/server/builder.mjs';
const store=new Store('D:/app/.test-qr-package');await store.init();
const project=await store.create('空白项目打包验收');const draft=await store.draft(project.id);
await buildProject(draft,{onLog:console.log});await store.commit(project,draft,'新版打包环境编译');console.log('PASS packaged blank compiler');
