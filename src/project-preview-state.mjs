export function projectPreviewState(project,{busy=false,status=''}={}){
  if(!project)return {kind:'empty',title:'还没有选择项目',detail:'新建小程序后即可开始制作',footer:'尚无预览',caption:'新建后可开始对话'};
  const task=project.tasks?.findLast(t=>t.state==='running'),working=busy||!!task;
  if(project.ready)return {kind:'ready',title:working?'正在制作新版本':'预览已就绪',detail:working?(status||task?.phase||'正在制作'):'',footer:working?`正在制作 · 当前预览为已保存版本 ${project.revision}`:'预览已就绪',caption:working?`当前显示已保存版本 ${project.revision}，可继续交互`:'可点击、输入和交互'};
  if(working)return {kind:'working',title:'正在制作首个可用版本',detail:status||task?.phase||'正在制作',footer:'正在制作 · 预览尚未就绪',caption:'制作完成后自动显示可用预览'};
  const latest=project.tasks?.at(-1),init=project.initialization;
  if(latest&&['failed','interrupted','stopped'].includes(latest.state))return {kind:'unfinished',title:latest.state==='stopped'?'制作已停止，尚无可用预览':'本次制作未完成，尚无可用预览',detail:latest.phase||'可核对草稿后继续',footer:'尚无可用预览',caption:'可查看制作记录并继续'};
  if(init?.state==='failed')return {kind:'failed',title:'预览准备失败',detail:init.error||'可以直接描述需求开始制作',footer:'预览准备失败',caption:'可直接描述需求开始制作'};
  if(init?.state==='preparing')return {kind:'preparing',title:'正在后台构建真实预览…',detail:init.phase||'现在就可以描述需求开始制作',footer:'正在后台准备',caption:'预览准备期间可开始对话'};
  return {kind:'unavailable',title:'尚无可用预览',detail:'描述制作需求后，完成的版本会显示在这里',footer:'尚无可用预览',caption:'可直接描述需求开始制作'};
}
