// Reusable UI steps for an already selected, approved Studio Page.
// Does not launch/attach to a browser, read a profile/token/key, configure a model,
// call HTTP APIs, or edit generated source. Native launch remains separately verified.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
export function approvedJourney(page,{origin,version,allowRealModel=false}={}){
 const url=new URL(origin);
 assert.equal(url.protocol,'http:');assert.equal(url.hostname,'127.0.0.1');
 assert.equal(url.origin,origin);assert.ok(version);
 const check=()=>assert.equal(new URL(page.url()).origin,origin,'Refuse an unknown page/service');
 const composer=()=>page.locator('textarea[placeholder="描述你的小程序，或说说想修改什么…"]');
 return {
  async observe(){check();return {version,url:page.url(),composerEnabled:await composer().isEnabled(),previewCount:await page.locator('iframe[title="小程序交互预览"]').count()};},
  async newProject(title){
   check();const start=Date.now();await page.getByRole('button',{name:/新建小程序/}).click();
   await page.getByPlaceholder('给你的想法起个名字').fill(title);
   await page.getByRole('button',{name:'创建项目',exact:true}).click();
   await composer().waitFor({state:'visible'});await composer().fill('验收输入可用');
   const inputMs=Date.now()-start;await composer().fill('');return {version,title,inputMs};
  },
  async submitNaturalRequirement(prompt){
   check();assert.equal(allowRealModel,true,'Real-model submission needs explicit B approval');
   assert.ok(prompt.trim());await composer().fill(prompt);
   await page.getByRole('button',{name:'发送消息',exact:true}).click();return {version,prompt,submittedAt:new Date().toISOString()};
  },
  async previewGeometry(){
   check();const frame=page.locator('iframe[title="小程序交互预览"]');
   await frame.waitFor({state:'visible'});const box=await frame.boundingBox();
   const handle=await frame.elementHandle();assert.ok(handle,'Preview iframe missing');
   const content=await handle.contentFrame();assert.ok(content,'Preview frame not attached');
   const logical=await content.evaluate(()=>({width:innerWidth,height:innerHeight}));
   return {version,logicalSize:logical,physicalBox:box,scale:box.width/logical.width,viewport:page.viewportSize()};
  },
  async exerciseQr({inputSelector,generateSelector,qrSelector,text,imagePath}){
   check();const frame=page.frameLocator('iframe[title="小程序交互预览"]');
   const input=frame.locator(inputSelector);await input.fill(text);assert.equal(await input.inputValue(),text);
   await frame.locator(generateSelector).click();await frame.locator(qrSelector).waitFor({state:'visible'});
   // Entire top-level viewport pixels preserve real CSS scale and occlusion.
   const pixels=await page.screenshot({type:'png',fullPage:false,animations:'disabled'});
   await fs.writeFile(imagePath,pixels,{flag:'wx'});
   return {...await this.previewGeometry(),expected:text,image:imagePath,imageSHA256:createHash('sha256').update(pixels).digest('hex')};
  },
  async exportFromUi(destination){
   check();try{await fs.access(destination);throw Error('Refuse to overwrite export evidence');}catch(error){if(error.code!=='ENOENT')throw error;}
   const pending=page.waitForEvent('download');
   await page.getByRole('button',{name:'导出小程序',exact:true}).click();
   const download=await pending;await download.saveAs(destination);return {version,destination,suggestedFilename:download.suggestedFilename()};
  },
 };
}
