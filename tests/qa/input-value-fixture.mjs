import fs from 'node:fs/promises';
import path from 'node:path';
import {createQrFixture} from './qr-fixture.mjs';

export const historyValue='  历史中文🙂e\u0301\n第二行  ';

export async function inputFixture({mode='normal',kind='input',expected=historyValue,initial='sentinel',hidden=false,ambiguous=false}={}) {
  const base=await createQrFixture('normal');
  const file=path.join(base.root,'dist/h5/index.html');
  const field=kind==='textarea'?`<textarea id="editor"></textarea>`:kind==='select'?'<select id="editor"><option>sentinel</option></select>':kind==='contenteditable'?'<div id="editor" contenteditable="true">sentinel</div>':`<input id="editor" type="${kind==='password'?'password':'text'}">`;
  const html=`<!doctype html><html><head></head><body><div id="host" style="${hidden?'opacity:0':''}">${field}${ambiguous?'<input id="other" value="DO_NOT_LEAK_OTHER">':''}</div><button id="history">回填历史</button><div id="ready">ready</div><script>
  const expected=${JSON.stringify(expected)},initial=${JSON.stringify(initial)},mode=${JSON.stringify(mode)};
  document.querySelector('#editor').value=initial;
  document.querySelector('#history').onclick=()=>{
    if(mode==='noop')return;
    const apply=()=>{let field=document.querySelector('#editor');if(mode==='replace'){const next=field.cloneNode();field.replaceWith(next);field=next;}field.value=mode==='wrong'?'DO_NOT_LEAK_WRONG':mode==='truncate'?expected.slice(0,-1):expected;};
    if(mode==='async')setTimeout(apply,120);else apply();
  };
  </script></body></html>`;
  await fs.writeFile(file,html);return base;
}

export async function historyQrFixture({autoClear=false,wrongQr=false}={}) {
  const base=await createQrFixture('normal');const file=path.join(base.root,'dist/h5/index.html');
  let html=await fs.readFile(file,'utf8');
  const script=`<button id="history">回填历史</button><script>
  const extraValue='历史回填一二三';let fromHistory=false;
  document.querySelector('#history').onclick=()=>{document.querySelector('#input').value=extraValue;fromHistory=true;};
  const originalGenerate=document.querySelector('#generate').onclick;
  document.querySelector('#generate').onclick=()=>{const editor=document.querySelector('#input'),value=editor.value;if(fromHistory&&${JSON.stringify(wrongQr)})editor.value='错误旧二维码';originalGenerate();if(fromHistory)editor.value=${JSON.stringify(autoClear)}?'':value;};
  </script>`;
  html=html.replace('</body>',script+'</body>');await fs.writeFile(file,html);return base;
}
