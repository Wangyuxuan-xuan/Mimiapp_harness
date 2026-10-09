import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import QRCode from 'qrcode-terminal/vendor/QRCode/index.js';
import {verifyPreview} from '../server/verify.mjs';

// Fixture encoding reuses the installed Arase MIT implementation. UTF-8 bytes
// are supplied to its 8-bit interface, rather than inventing an encoder.
function grid(text,version){
 const code=new QRCode(version,1);
 code.addData(Buffer.from(text,'utf8').toString('latin1'));code.make();
 const size=code.getModuleCount();
 return `<div id="qr" style="width:${(size+8)*6}px;height:${(size+8)*6}px;padding:24px;box-sizing:border-box;background:white;display:grid;grid-template-columns:repeat(${size},6px)">${code.modules.flat().map(d=>`<div style="width:6px;height:6px;background:${d?'black':'white'}"></div>`).join('')}</div>`;
}
test('unique Taro host fills, QR pixels decode Chinese across legal sizes and mismatches fail',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qr-'));
 try{
  await fs.mkdir(path.join(root,'dist/h5'),{recursive:true});
  const html=`<html><head></head><body><taro-input-core class="field"></taro-input-core><script>setTimeout(()=>{const e=document.createElement('input');e.oninput=()=>{document.querySelector('#echo').textContent=e.value};document.querySelector('.field').append(e)},300)</script><div id="echo"></div><div class="ambiguous"><input><textarea></textarea></div>${grid('一二三',1)}<div id="long">${grid('这是更长的二维码内容，用来验证尺寸变化。',5).replace('id="qr"','id="qr-long"')}</div><div id="fake" style="width:200px;height:200px;background:black"></div></body></html>`;
  await fs.writeFile(path.join(root,'dist/h5/index.html'),html);
  const result=await verifyPreview(root,[{action:'fill',selector:'.field',value:'中文填写'},{action:'text',selector:'#echo',value:'中文填写'},{action:'qr',selector:'#qr',value:'一二三'},{action:'qr',selector:'#qr-long',value:'这是更长的二维码内容，用来验证尺寸变化。'}]);
  assert.equal(result.state,'passed',JSON.stringify(result));assert.deepEqual(result.qrChecks.map(q=>q.version),[1,5]);
  assert.ok(result.qrChecks.every(q=>q.fullyVisible&&q.viewportImageDigest?.length===64&&q.imageDigest?.length===64&&q.box.width>0));
  await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/studio-repair-qr-positive.json',JSON.stringify(result,null,2));
  for(const [steps,pattern] of [
   [[{action:'fill',selector:'.ambiguous',value:'x'},{action:'text',selector:'#echo',value:'x'}],/单元素检查选择器匹配多个元素/],
   [[{action:'qr',selector:'#qr',value:'不同文字'}],/二维码内容不符/],
   [[{action:'qr',selector:'#fake',value:'一二三'}],/无法解码/],
  ]){const failed=await verifyPreview(root,steps);assert.equal(failed.state,'failed');assert.match(failed.error,pattern);}
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('whole phone viewport decoding catches overlays and overflow; fill reports truncation explicitly',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'sprout-qr-visible-'));await fs.mkdir(path.join(root,'dist/h5'),{recursive:true});
 try{
  const html=`<html><head></head><body><input maxlength="3"><div id="message">ready</div>${grid('一二三',1)}<div id="cover" style="position:fixed;inset:0;background:white;z-index:999"></div></body></html>`;
  await fs.writeFile(path.join(root,'dist/h5/index.html'),html);
  const obscured=await verifyPreview(root,[{action:'qr',selector:'#qr',value:'一二三'}]);assert.equal(obscured.state,'failed');assert.match(obscured.error,/无法解码/);
  await fs.writeFile(path.join(root,'dist/h5/index.html'),html.replace('<div id="cover"','<div hidden id="cover"'));
  const truncated=await verifyPreview(root,[{action:'fill',selector:'input',value:'超过三字的长文字'},{action:'text',selector:'#message',value:'ready'}]);assert.equal(truncated.state,'failed');assert.match(truncated.error,/截断或改变.*maxlength/);
  await fs.writeFile(path.join(root,'dist/h5/index.html'),`<html><head></head><body><div style="width:500px">${grid('一二三',1).replace('width:174px','width:500px')}</div></body></html>`);
  const overflow=await verifyPreview(root,[{action:'qr',selector:'#qr',value:'一二三'}]);assert.equal(overflow.state,'failed');assert.match(overflow.error,/未完整显示/);
  await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/studio-repair-qr-negative.json',JSON.stringify({passed:true,obscured,truncated,overflow},null,2));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
