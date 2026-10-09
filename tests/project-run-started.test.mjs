import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudioClient} from '../server/studio-client.mjs';
test('run header callback permits explicit stop after registration before first output',async()=>{
  let started=false,release;const gate=new Promise(r=>{release=r;});const stream=new ReadableStream({async start(controller){await gate;controller.enqueue(new TextEncoder().encode('{"type":"text","text":"later"}\n'));controller.close();}});
  const client=createStudioClient({fetchImpl:async()=>new Response(stream)}),iterator=client.run('fixture',{prompt:'test'},{onStarted:()=>{started=true;release();}});
  assert.deepEqual(await iterator.next(),{value:{type:'text',text:'later'},done:false});assert.equal(started,true);await iterator.return();
});
test('rejected run never reports started',async()=>{
  let started=false;const client=createStudioClient({fetchImpl:async()=>new Response('{"error":"project already running"}',{status:400})});
  await assert.rejects(async()=>{for await(const _ of client.run('fixture',{}, {onStarted:()=>{started=true;}})){}},/project already running/);assert.equal(started,false);
});
