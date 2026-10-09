import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const shortText = '独立验收一二三';
export const longText = '天地玄黄宇宙洪荒日月盈昃辰宿列张'.repeat(8).slice(0, 120);

// Exercise the fixed project encoder in the browser; do not replace generation
// with pre-rendered images or a test-specific QR algorithm.
const vendorDir = new URL('../../templates/mini/src/vendor/qr/core/', import.meta.url);
const moduleCode = (async () => {
  const names = (await fs.readdir(vendorDir)).filter(name => name.endsWith('.js'));
  const modules = await Promise.all(names.map(async name => {
    const source = await fs.readFile(new URL(name, vendorDir), 'utf8');
    return `${JSON.stringify('./' + name.slice(0, -3))}:function(require,module,exports){${source}\n}`;
  }));
  return modules.join(',');
})();

export function deliverySteps(mode) {
  const message = mode === 'please-first' ? '请先输入内容' : '请输入内容';
  const steps = [
    {action: 'fill', selector: '#input', value: shortText},
    {action: 'click', selector: '#generate'},
    {action: 'qr', selector: '#qr', value: shortText},
    {action: 'fill', selector: '#input', value: longText},
    {action: 'click', selector: '#generate'},
    {action: 'qr', selector: '#qr', value: longText},
    {action: 'fill', selector: '#input', value: ''},
    {action: 'click', selector: '#generate'},
    mode === 'clear-count'
      ? {action: 'count', selector: '#qr', value: 0}
      : {action: 'text', selector: '#message', value: message},
  ];
  if (mode === 'fresh-feedback-keep-qr') {
    steps.push({action: 'count', selector: '#qr', value: 1});
  }
  return steps;
}

export async function createQrFixture(mode) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sprout-qa-qr-delivery-'));
  const cleanup = () => fs.rm(root, {recursive: true, force: true});
  try {
    const modules = await moduleCode;
    const html = `<html><head></head><body style="margin:8px">
      <input id="input"><button id="generate">生成</button>
      <section style="${mode === 'hidden-ancestor' ? 'opacity:0' : ''}">
        <div id="message" style="${mode === 'hidden-feedback' ? 'opacity:0' : ''}">${mode === 'constant-empty-label' ? '请输入内容' : ''}</div>
      </section><div id="output"></div>
      <script>
      const modules = {${modules}}, cache = {}, mode = ${JSON.stringify(mode)};
      function require(id) {
        if (cache[id]) return cache[id].exports;
        const module = {exports:{}}; cache[id] = module;
        modules[id](require, module, module.exports); return module.exports;
      }
      const QR = require('./index');
      document.querySelector('#generate').onclick = () => {
        const text = document.querySelector('#input').value;
        if (!text) {
          // Original QA-REPAIR-001: there is no empty-input behavior at all.
          if (mode === 'constant-empty-label') return;
          if (mode !== 'fresh-feedback-keep-qr') document.querySelector('#output').replaceChildren();
          document.querySelector('#message').textContent = mode === 'please-first' ? '请先输入内容' : '请输入内容';
          return;
        }
        if (mode !== 'constant-empty-label') document.querySelector('#message').textContent = '';
        const qr = new QR(-1, 0);
        qr.addData(encodeURIComponent(text).replace(/%([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))));
        qr.make();
        const size = qr.getModuleCount(), pixels = (size + 8) * 3;
        const canvas = document.createElement('canvas'); canvas.id = 'qr';
        canvas.width = canvas.height = pixels;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, pixels, pixels);
        ctx.fillStyle = 'black';
        for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
          if (qr.isDark(row, col)) ctx.fillRect((col + 4) * 3, (row + 4) * 3, 3, 3);
        }
        document.querySelector('#output').replaceChildren(canvas);
        if (mode === 'overlay') {
          const cover = document.createElement('div');
          cover.style = 'position:fixed;inset:0;background:white;z-index:999;pointer-events:none';
          document.body.append(cover);
        }
      };
      </script></body></html>`;
    await fs.mkdir(path.join(root, 'dist/h5'), {recursive: true});
    await fs.writeFile(path.join(root, 'dist/h5/index.html'), html);
    return {root, cleanup};
  } catch (error) {
    await cleanup();
    throw error;
  }
}
