const path=require('node:path');
const fs=require('node:fs/promises');
const {randomUUID}=require('node:crypto');

// Main-process only. The file path is fixed to this app's userData, never IPC input.
function createCredentialStore({safeStorage,userData,platform=process.platform,fileSystem=fs}){
 const file=path.join(userData,'model-credentials-v1.bin');let queue=Promise.resolve();
 const available=()=>{try{return safeStorage.isEncryptionAvailable()&&(platform!=='linux'||safeStorage.getSelectedStorageBackend()!=='basic_text');}catch{return false;}};
 const serial=operation=>{const pending=queue.catch(()=>{}).then(operation);queue=pending;return pending;};
 function configOnly(value){
  if(!value||!['deepseek','custom'].includes(value.provider)||typeof value.baseUrl!=='string'||value.baseUrl.length>2048||typeof value.model!=='string'||!value.model||value.model.length>120||typeof value.apiKey!=='string'||value.apiKey.length>4096)throw new Error('模型配置格式无效。');
  return {provider:value.provider,baseUrl:value.baseUrl,model:value.model,apiKey:value.apiKey};
 }
 async function write(value){
  if(!available())throw new Error('系统安全存储不可用，密钥未保存。');
  const temp=file+'.tmp-'+randomUUID();
  try{
   const bytes=safeStorage.encryptString(JSON.stringify(configOnly(value)));
   if(!Buffer.isBuffer(bytes)||!bytes.length)throw new Error('invalid ciphertext');
   await fileSystem.mkdir(userData,{recursive:true});
   try{if((await fileSystem.lstat(file)).isSymbolicLink())throw new Error('linked credential file');}catch(e){if(e.code!=='ENOENT')throw e;}
   await fileSystem.writeFile(temp,bytes,{mode:0o600});
   for(let attempt=0;;attempt++){try{await fileSystem.rename(temp,file);break;}catch(e){if(!['EPERM','EACCES','EBUSY'].includes(e.code)||attempt>=5)throw e;await new Promise(resolve=>setTimeout(resolve,30*(attempt+1)));}}
  }catch{throw new Error('系统安全存储写入失败，模型设置未保存。');}
  finally{await fileSystem.rm(temp,{force:true}).catch(()=>{});}
 }
 return {
  get available(){return available();},
  load:()=>serial(async()=>{
   if(!available())throw new Error('系统安全存储不可用，请检查系统后重新打开应用。');
   try{
    const stat=await fileSystem.lstat(file);if(stat.isSymbolicLink()||!stat.isFile()||stat.size>128*1024)throw new Error('invalid vault');
    return configOnly(JSON.parse(safeStorage.decryptString(await fileSystem.readFile(file))));
   }catch(e){if(e.code==='ENOENT')return null;throw new Error('已保存的模型设置无法读取，请重新保存；原加密文件已保留。');}
  }),
  save:value=>serial(()=>write(value)),
  clear:value=>serial(()=>write({...value,apiKey:''})),
 };
}
module.exports={createCredentialStore};
