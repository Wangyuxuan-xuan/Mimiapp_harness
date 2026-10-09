import {Store} from '../server/store.mjs';
import {buildProject} from '../server/builder.mjs';
const store=new Store();await store.init();const list=await store.list();
const project=list.length?await store.get(list[0].id):await store.create('日常 · 习惯打卡',true);
const draft=await store.draft(project.id);
await buildProject(draft,{onLog:console.log});
await store.commit(project,draft,'初始示例 · 日常习惯');
console.log(JSON.stringify({id:project.id,revision:project.revision,dir:store.dir(project.id)},null,2));
