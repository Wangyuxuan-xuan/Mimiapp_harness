const path=require('node:path');
const os=require('node:os');
// New stable profile. Never discover, read or migrate historical profiles.
function resolveProfile({appData,env=process.env,platform=process.platform,home=os.homedir()}={}){
 const absolute=name=>{const value=env[name];if(!value)return null;if(!path.isAbsolute(value))throw new Error(name+' 必须是绝对路径。');return path.resolve(value);};
 const base=appData||(platform==='win32'?env.APPDATA||path.join(home,'AppData','Roaming'):platform==='darwin'?path.join(home,'Library','Application Support'):env.XDG_CONFIG_HOME||path.join(home,'.config'));
 const userData=absolute('STUDIO_USER_DATA_DIR')||path.join(base,'Sprout Studio','current');
 return {userData,workspace:absolute('STUDIO_WORKSPACE_DIR')||path.join(userData,'workspace'),endpoint:path.join(userData,'studio-session-v1.json')};
}
module.exports={resolveProfile};
