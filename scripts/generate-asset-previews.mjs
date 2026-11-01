import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const DEFAULT_URL='https://bovvqelbnqocllsxssus.supabase.co';
const DEFAULT_KEY='sb_publishable_4OzaaxZ9YWuSDcoQNdUkIw_mqbrwEXr';

export async function makePreview(input){
  if(input.length>8_000_000)throw new Error('Source image exceeds storage upload limit');
  const header=input.subarray(0,4096).toString();
  if(/<svg\b/i.test(header)){
    if(/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(input.toString()))throw new Error('SVG document entities are unsupported');
    // CorelDRAW/Illustrator export an external DTD declaration. The derivative
    // needs no DTD and must not depend on that third-party URL being available.
    input=Buffer.from(input.toString().replace(/<!DOCTYPE[^>]*>/gi,''));
  }
  return sharp(input,{limitInputPixels:64_000_000}).rotate()
    .resize(192,192,{fit:'inside',withoutEnlargement:true})
    .webp({quality:82,alphaQuality:100,effort:4}).toBuffer({resolveWithObject:true});
}

// Read-only maintenance command: creates deployable static derivatives for
// existing published assets. It never changes a Supabase row or source file.
export async function generateAssetPreviews({fetchImpl=fetch,root=process.cwd(),url=process.env.VITE_SUPABASE_URL||DEFAULT_URL,key=process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY||DEFAULT_KEY}={}){
  const output=resolve(root,'public/asset-previews');
  const manifestFile=resolve(root,'src/generated/asset-previews.json');
  const cache=resolve(root,'.asset-preview-cache');
  await Promise.all([mkdir(output,{recursive:true}),mkdir(resolve(root,'src/generated'),{recursive:true}),mkdir(cache,{recursive:true})]);
  const previous=JSON.parse(await readFile(manifestFile,'utf8').catch(()=>'{}'));
  const rows=[];
  for(let offset=0;;offset+=100){
    const query=new URLSearchParams({select:'id,version,storage_path',is_published:'eq.true',order:'id',offset:String(offset),limit:'100'});
    const response=await fetchImpl(`${url}/rest/v1/assets?${query}`,{headers:{apikey:key},signal:AbortSignal.timeout(20_000)});
    if(!response.ok)throw new Error(`Catalog HTTP ${response.status}`);
    const page=await response.json();if(!Array.isArray(page))throw new Error('Invalid catalog response');
    rows.push(...page);if(page.length<100)break;
  }
  const manifest={};const failures=[];
  const queue=[...rows];
  await Promise.all(Array.from({length:4},async()=>{
    for(let row;(row=queue.shift());){
      try{
        const old=previous[row.id];
        if(old?.version===row.version&&old.storagePath===row.storage_path&&/^\/asset-previews\/[a-f0-9]{24}\.webp$/.test(old.url)){
          try{await access(resolve(root,`public${old.url}`));manifest[row.id]=old;continue;}catch{/* regenerate missing output */}
        }
        if(!row.storage_path)throw new Error('Source path missing');
        const pathHash=createHash('sha256').update(row.storage_path).digest('hex');
        const cacheFile=resolve(cache,pathHash);
        let input=await readFile(cacheFile).catch(()=>null);
        if(!input){
          const path=row.storage_path.split('/').map(encodeURIComponent).join('/');
          const response=await fetchImpl(`${url}/storage/v1/object/public/public-assets/${path}`,{signal:AbortSignal.timeout(25_000)});
          if(!response.ok)throw new Error(`Original HTTP ${response.status}`);
          input=Buffer.from(await response.arrayBuffer());
          if(input.length>8_000_000)throw new Error('Source too large');
          await writeFile(cacheFile,input);
        }
        const {data,info}=await makePreview(input);
        const filename=createHash('sha256').update(JSON.stringify([row.id,row.version,row.storage_path])).digest('hex').slice(0,24)+'.webp';
        await writeFile(resolve(output,filename),data);
        manifest[row.id]={version:row.version,storagePath:row.storage_path,url:`/asset-previews/${filename}`,sourceBytes:input.length,previewBytes:data.length,width:info.width,height:info.height};
      }catch(error){failures.push({id:row.id,error:String(error.message||error)});}
    }
  }));
  await writeFile(manifestFile,JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()),null,2)+'\n');
  const entries=Object.values(manifest);
  const report={published:rows.length,generated:entries.length,sourceBytes:entries.reduce((sum,item)=>sum+item.sourceBytes,0),previewBytes:entries.reduce((sum,item)=>sum+item.previewBytes,0),failures};
  console.log(JSON.stringify(report,null,2));
  if(failures.length)throw new Error(`${failures.length} assets could not be prepared; originals remain available`);
  return report;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  await generateAssetPreviews();
}
