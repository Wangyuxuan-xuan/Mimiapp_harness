const {app,BrowserWindow,session,dialog,safeStorage}=require('electron');
const {createCredentialStore}=require('./credential-store.cjs');
const {resolveProfile}=require('./profile.cjs');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
let studio,closing=false,closed=false,leaseTimer;
const root=path.resolve(__dirname,'..'),headless=process.argv.includes('--studio-cli-service');
app.setName('Sprout Studio');
const profile=resolveProfile({appData:app.getPath('appData')});
const external=!app.isPackaged&&!!process.env.STUDIO_URL;
if(headless&&external)throw new Error('CLI 不支持外接开发服务；请移除 STUDIO_URL。');
// External development servers own their configuration and cannot join this profile.
const userData=external?path.join(profile.userData,'external-dev'):profile.userData;
fs.mkdirSync(userData,{recursive:true,mode:0o700});app.setPath('userData',userData);
app.disableHardwareAcceleration();
async function createWindow(){
 const win=new BrowserWindow({width:1440,height:960,minWidth:960,minHeight:700,title:'小芽 · Sprout Studio',backgroundColor:'#f8faf8',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==studio.url)event.preventDefault();});
 await win.loadURL(studio.url);return win;
}
const ownsLock=app.requestSingleInstanceLock({headless,workspace:profile.workspace});
function activeCliLeases(){
 let active=0;for(const name of fs.readdirSync(userData).filter(name=>/^\.cli-lease-[a-f0-9-]{36}$/.test(name))){const file=path.join(userData,name);try{const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>32)continue;const pid=Number(fs.readFileSync(file,'utf8'));if(!Number.isSafeInteger(pid)||pid<1)continue;try{process.kill(pid,0);active++;}catch{fs.unlinkSync(file);}}catch{}}return active;
}
if(!ownsLock)app.quit();
else{
 app.on('second-instance',(_event,_argv,_cwd,data)=>{
  if(data?.workspace!==profile.workspace){if(!data?.headless)dialog.showErrorBox('工作目录不一致','同一配置目录已有其他工作区在运行。请关闭原工作区，或为新工作区指定独立配置目录。');return;}
  if(!data?.headless)app.whenReady().then(async()=>{while(!studio&&!closing)await new Promise(r=>setTimeout(r,30));if(studio&&!closing)await createWindow();}).catch(()=>{});
 });
 app.whenReady().then(async()=>{
  try{
   if(external){const target=new URL(process.env.STUDIO_URL);if(target.hostname!=='127.0.0.1'||target.protocol!=='http:'||target.username||target.password||target.search||target.hash)throw new Error('仅可连接本机工作台。');studio={url:target.origin,close:async()=>{}};}
   else{
    const {startStudio}=await import(pathToFileURL(path.join(root,'server/index.mjs')).href);
    studio=await startStudio({port:0,root:profile.workspace,production:true,seed:!headless,credentialStore:createCredentialStore({safeStorage,userData})});
    const temp=profile.endpoint+'.tmp-'+process.pid;
    fs.writeFileSync(temp,JSON.stringify({version:1,pid:process.pid,url:studio.url,token:studio.token,workspace:profile.workspace}),{mode:0o600});fs.renameSync(temp,profile.endpoint);fs.chmodSync(profile.endpoint,0o600);
   }
   session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
   if(!headless)await createWindow();
   else{
    const lease=process.env.STUDIO_CLI_LEASE,parent=Number(process.env.STUDIO_CLI_PARENT_PID);
    if(!/^[a-f0-9-]{36}$/.test(lease||'')||!Number.isSafeInteger(parent)||parent<1)throw new Error('CLI 启动信息无效。');
   }
   if(!external)leaseTimer=setInterval(()=>{if(!BrowserWindow.getAllWindows().length&&!activeCliLeases())app.quit();},250);
  }catch{console.error('Sprout startup failed.');if(!headless)dialog.showErrorBox('小芽启动失败','无法启动本机工作台。请检查工作目录和系统安全存储。');app.quit();}
 });
}
app.on('window-all-closed',()=>{if(external||!activeCliLeases())app.quit();});
app.on('before-quit',event=>{
 if(closed||!studio)return;event.preventDefault();if(closing)return;closing=true;
 clearInterval(leaseTimer);
 Promise.resolve(studio.close()).then(()=>{if(!external){try{const current=JSON.parse(fs.readFileSync(profile.endpoint,'utf8'));if(current.pid===process.pid)fs.unlinkSync(profile.endpoint);}catch{}}closed=true;app.quit();}).catch(()=>{closing=false;console.error('Sprout shutdown failed.');if(!headless)dialog.showErrorBox('小芽退出未完成','保存尚未完成，请稍后重试退出。');});
});
