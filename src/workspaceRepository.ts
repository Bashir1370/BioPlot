import type {SupabaseClient} from '@supabase/supabase-js';
import type {BioPlotDocument} from './model';
import type {ProjectRepository,ProjectSummary} from './persistence';

// Local drafts are separated by owner; an authenticated user's list never
// includes anonymous drafts or another account's cached documents.
export class WorkspaceRepository implements ProjectRepository {
 private bindings=new Map<string,string|undefined>();
 constructor(private local:ProjectRepository,private cloud:ProjectRepository,private client:SupabaseClient){}
 private async owner(){const {data,error}=await this.client.auth.getSession();if(error)throw error;return data.session?.user.id;}
 private belongs(doc:BioPlotDocument,owner:string|undefined){return (doc.ownerId||undefined)===owner;}
 private async localList(owner:string|undefined){const rows=await this.local.list();const docs=await Promise.all(rows.map(row=>this.local.load(row.id)));return rows.filter((_,i)=>docs[i]&&this.belongs(docs[i]!,owner));}
 async list(){
  const owner=await this.owner();const local=await this.localList(owner);if(!owner)return local;
  // Surface network failures instead of presenting an incomplete cloud list as complete.
  const remote=await this.cloud.list();const merged=new Map<string,ProjectSummary>();
  for(const row of [...remote,...local]){const prev=merged.get(row.id);if(!prev||row.updatedAt>prev.updatedAt)merged.set(row.id,row);}
  return [...merged.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 }
 async load(id:string){
  const owner=await this.owner();const cached=await this.local.load(id);const local=cached&&this.belongs(cached,owner)?cached:null;
  if(local)this.bindings.set(id,owner);
  if(!owner)return local;
  let remote:BioPlotDocument|null;
  try{remote=await this.cloud.load(id);}catch(error){if(local)return local;throw error;}
  if(local&&(!remote||local.updatedAt>=remote.updatedAt))return local;
  if(remote)this.bindings.set(id,owner);
  return remote?{...remote,ownerId:owner}:null;
 }
 async save(doc:BioPlotDocument){
  const owner=await this.owner();
  if((this.bindings.has(doc.id)&&this.bindings.get(doc.id)!==owner)||(doc.ownerId&&doc.ownerId!==owner))throw new Error('Account changed. Reopen this figure from your dashboard.');
  this.bindings.set(doc.id,owner);
  const next={...doc,ownerId:owner,updatedAt:new Date().toISOString()};
  await this.local.save(next);
  if(owner)await this.cloud.save(next);
 }
 async remove(id:string){
  const owner=await this.owner();if(owner)await this.cloud.remove(id);
  const doc=await this.local.load(id);if(doc&&this.belongs(doc,owner))await this.local.remove(id);
 }
}
