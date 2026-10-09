const {app,BrowserWindow,session,dialog,safeStorage}=require('electron');
const {createCredentialStore}=require('./credential-store.cjs');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
let studio;
const root=path.resolve(__dirname,'..');
// Explicit isolated paths are resolved before Electron initializes any session data.
const absoluteOverride=name=>{const value=process.env[name];if(!value)return null;if(!path.isAbsolute(value))throw new Error(name+' 必须是绝对路径。');return path.resolve(value);};
const isolatedUserData=absoluteOverride('STUDIO_USER_DATA_DIR'),isolatedWorkspace=absoluteOverride('STUDIO_WORKSPACE_DIR');
if(isolatedUserData){fs.mkdirSync(isolatedUserData,{recursive:true});app.setPath('userData',isolatedUserData);}
else if(!app.isPackaged)app.setPath('userData',path.join(root,'.studio','desktop'));
app.setName('Sprout Studio');
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  try{
    if(!app.isPackaged&&process.env.STUDIO_URL){
      const target=new URL(process.env.STUDIO_URL);if(target.hostname!=='127.0.0.1'||target.protocol!=='http:')throw new Error('仅可连接本机工作台。');
      studio={url:target.origin,close:async()=>{}};
    }else{
      const {startStudio}=await import(pathToFileURL(path.join(root,'server/index.mjs')).href);
      const credentialStore=createCredentialStore({safeStorage,userData:app.getPath('userData')});
      studio=await startStudio({port:0,root:isolatedWorkspace||(app.isPackaged||isolatedUserData?path.join(app.getPath('userData'),'workspace'):path.join(root,'.studio')),production:true,credentialStore});
    }
    session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
    const win=new BrowserWindow({width:1440,height:960,minWidth:960,minHeight:700,title:'小芽 · Sprout Studio',backgroundColor:'#f8faf8',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==studio.url)event.preventDefault();});
    await win.loadURL(studio.url);
  }catch(error){console.error('Sprout startup failed:',error.message);dialog.showErrorBox('小芽启动失败',error.message);app.quit();}
});
app.on('window-all-closed',()=>app.quit());
let closing=false,closed=false;
app.on('before-quit',event=>{if(closed||!studio)return;event.preventDefault();if(closing)return;closing=true;Promise.resolve(studio.close()).then(()=>{closed=true;app.quit();}).catch(error=>{closing=false;console.error('Sprout shutdown failed:',error.message);dialog.showErrorBox('小芽退出未完成',error.message);});});
