/** Keep successful deletions hidden for this workspace session so stale reads
 * cannot resurrect cards. A new account gets its own set. */
export async function deleteOptimistically(
 id:string,
 hidden:Set<string>,
 actions:{hide:()=>void;remove:()=>Promise<void>;commit:()=>void;restore:()=>void},
){
 if(hidden.has(id))return;
 hidden.add(id);
 actions.hide();
 try{await actions.remove();}
 catch{hidden.delete(id);actions.restore();return;}
 actions.commit();
}
