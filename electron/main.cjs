const {app,BrowserWindow,session,dialog}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
let studio;
const root=path.resolve(__dirname,'..');
// Portable development state stays next to the source. Packaged builds use app data.
if(!app.isPackaged)app.setPath('userData',path.join(root,'.studio','desktop'));
app.setName('Sprout Studio');
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  try{
    if(!app.isPackaged&&process.env.STUDIO_URL){
      const target=new URL(process.env.STUDIO_URL);if(target.hostname!=='127.0.0.1'||target.protocol!=='http:')throw new Error('仅可连接本机工作台。');
      studio={url:target.origin,close:async()=>{}};
    }else{
      const {startStudio}=await import(pathToFileURL(path.join(root,'server/index.mjs')).href);
      studio=await startStudio({port:0,root:app.isPackaged?path.join(app.getPath('userData'),'workspace'):path.join(root,'.studio'),production:true});
    }
    session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
    const win=new BrowserWindow({width:1440,height:960,minWidth:960,minHeight:700,title:'小芽 · Sprout Studio',backgroundColor:'#f8faf8',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==studio.url)event.preventDefault();});
    await win.loadURL(studio.url);
  }catch(error){console.error('Sprout startup failed:',error.message);dialog.showErrorBox('小芽启动失败',error.message);app.quit();}
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{studio?.close();});
