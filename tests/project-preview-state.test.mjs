import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPreviewState} from '../src/project-preview-state.mjs';
test('preview reports the active production rather than superseded initialization',()=>{
  const p={ready:false,revision:0,initialization:{state:'interrupted'},tasks:[{state:'running',phase:'正在编译交互预览'}]};
  assert.deepEqual(projectPreviewState(p),{kind:'working',title:'正在制作首个可用版本',detail:'正在编译交互预览',footer:'正在制作 · 预览尚未就绪',caption:'制作完成后自动显示可用预览'});
  assert.equal(projectPreviewState({...p,ready:true,revision:2}).footer,'正在制作 · 当前预览为已保存版本 2');
  assert.equal(projectPreviewState({...p,tasks:[]},{busy:true,status:'正在确认模型连接…'}).detail,'正在确认模型连接…');
});
test('unavailable, failed, stopped, preparing and existing previews remain distinct',()=>{
  assert.equal(projectPreviewState(null).kind,'empty');
  const p={ready:false,revision:0,tasks:[],initialization:{state:'preparing',phase:'正在编译微信小程序'}};
  assert.equal(projectPreviewState(p).detail,'正在编译微信小程序');
  assert.equal(projectPreviewState({...p,initialization:{state:'failed',error:'controlled failure'}}).detail,'controlled failure');
  assert.equal(projectPreviewState({...p,initialization:{state:'interrupted'}}).title,'尚无可用预览');
  assert.equal(projectPreviewState({...p,tasks:[{state:'stopped',phase:'用户主动停止'}]}).title,'制作已停止，尚无可用预览');
  assert.equal(projectPreviewState({...p,ready:true,revision:1,initialization:{state:'failed'}}).kind,'ready');
});
