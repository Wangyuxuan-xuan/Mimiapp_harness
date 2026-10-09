// UTF-8 adapter for the bundled, unmodified Kazuhiko Arase MIT QR encoder.
import QRCode from './core/index';
import levels from './core/QRErrorCorrectLevel';

export function generateQr(text,level='M'){
 if(typeof text!=='string'||!text.length)throw new Error('请先输入文字');
 if(!Object.prototype.hasOwnProperty.call(levels,level))throw new Error('纠错级别需要 L、M、Q 或 H');
 const bytes=encodeURIComponent(text).replace(/%([0-9a-f]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
 if(bytes.length>1000)throw new Error('文字过长，请控制在1000个UTF-8字节以内');
 const code=new QRCode(-1,levels[level]);code.addData(bytes);code.make();
 return code.modules.map(row=>row.slice());
}
