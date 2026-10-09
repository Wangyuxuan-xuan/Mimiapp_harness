// Existing regression fixtures need a published baseline before testing revisions.
// New-project responsiveness tests deliberately do not call this helper.
export async function waitProjectReady(studio,project){
  for(let attempt=0;attempt<150;attempt++){
    const latest=await studio.store.get(project.id);
    if(latest.ready){Object.assign(project,latest);return project;}
    if(latest.initialization?.state==='failed')throw new Error(latest.initialization.error||'fixture preparation failed');
    await new Promise(r=>setTimeout(r,30));
  }
  throw new Error('fixture preview did not become ready');
}
