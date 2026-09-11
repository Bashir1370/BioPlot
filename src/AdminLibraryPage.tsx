import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import {
  deleteCustomAsset,
  deleteCustomCategory,
  exportAssetLibrary,
  getAdminCategories,
  getAssetCatalog,
  importAssetLibrary,
  loadCustomAssets,
  loadCustomCategories,
  saveCustomAsset,
  saveCustomCategory,
  sanitizeSvg,
  ScientificAsset,
  updateCustomAsset,
  updateCustomCategory,
} from './assets';
import { StudioIcon } from './StudioIcon';
import './admin-library.css';

type Draft = {
  name:string;
  nameFa:string;
  category:string;
  description:string;
  descriptionFa:string;
  tagsEn:string;
  tagsFa:string;
  svg:string;
  sourceType:'svg'|'png'|'jpeg'|'webp';
  reviewStatus:'draft'|'reviewed';
  premium:boolean;
  active:boolean;
  featured:boolean;
};

const emptyDraft:Draft={name:'',nameFa:'',category:'',description:'',descriptionFa:'',tagsEn:'',tagsFa:'',svg:'',sourceType:'svg',reviewStatus:'draft',premium:false,active:true,featured:false};
const split=(value:string)=>value.split(/[,،\n]/).map(item=>item.trim()).filter(Boolean);

function readAsDataUrl(file:File):Promise<string>{
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error??new Error('Could not read file'));reader.readAsDataURL(file);});
}
function imageSize(src:string):Promise<{width:number;height:number}>{
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth||800,height:image.naturalHeight||600});image.onerror=()=>reject(new Error('Could not read image dimensions'));image.src=src;});
}
async function fileToSvg(file:File):Promise<{svg:string;sourceType:Draft['sourceType']}>{
  if(file.type==='image/svg+xml'||file.name.toLowerCase().endsWith('.svg'))return {svg:sanitizeSvg(await file.text()),sourceType:'svg'};
  const mime=file.type.toLowerCase();
  if(!['image/png','image/jpeg','image/webp'].includes(mime))throw new Error('Only SVG, PNG, JPG/JPEG and WebP are supported.');
  const data=await readAsDataUrl(file);
  const {width,height}=await imageSize(data);
  const sourceType:Draft['sourceType']=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpeg';
  return {sourceType,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><image href="${data}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>`};
}

function assetToDraft(asset:ScientificAsset):Draft{
  return {
    name:asset.name,
    nameFa:asset.nameFa??'',
    category:asset.category,
    description:asset.description??'',
    descriptionFa:asset.descriptionFa??'',
    tagsEn:asset.synonyms.en.join(', '),
    tagsFa:asset.synonyms.fa.join('، '),
    svg:asset.svg,
    sourceType:asset.sourceType??'svg',
    reviewStatus:asset.reviewStatus,
    premium:asset.premium,
    active:asset.active!==false,
    featured:Boolean(asset.featured),
  };
}

export function AdminLibraryPage(){
  const [assets,setAssets]=useState(()=>loadCustomAssets());
  const [categories,setCategories]=useState(()=>loadCustomCategories());
  const [draft,setDraft]=useState<Draft>(emptyDraft);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [query,setQuery]=useState('');
  const [filterCategory,setFilterCategory]=useState('');
  const [newCategory,setNewCategory]=useState('');
  const [newCategoryFa,setNewCategoryFa]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const allCategories=getAdminCategories();
  const builtInCount=getAssetCatalog(true).length-assets.length;

  const refresh=()=>{setAssets(loadCustomAssets());setCategories(loadCustomCategories());};
  const visible=useMemo(()=>assets.filter(asset=>{
    if(filterCategory&&asset.category!==filterCategory)return false;
    if(!query.trim())return true;
    const hay=[asset.name,asset.nameFa??'',asset.category,asset.description??'',asset.descriptionFa??'',...asset.synonyms.en,...asset.synonyms.fa].join(' ').toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  }),[assets,filterCategory,query]);

  const resetForm=()=>{setEditingId(null);setDraft(emptyDraft);setMessage('');};
  const pickFile=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    if(!file)return;
    setBusy(true);setMessage('');
    try{
      const converted=await fileToSvg(file);
      const base=file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
      setDraft(current=>({...current,...converted,name:current.name||base}));
    }catch(error){setMessage(error instanceof Error?error.message:'خطا در خواندن فایل');}
    finally{setBusy(false);event.target.value='';}
  };

  const submitAsset=(event:FormEvent)=>{
    event.preventDefault();
    if(!draft.name.trim()||!draft.category.trim()||!draft.svg){setMessage('نام، دسته‌بندی و فایل تصویر الزامی است.');return;}
    const payload={
      name:draft.name.trim(),nameFa:draft.nameFa.trim()||undefined,category:draft.category.trim(),description:draft.description.trim()||undefined,descriptionFa:draft.descriptionFa.trim()||undefined,
      synonyms:{en:split(draft.tagsEn),fa:split(draft.tagsFa)},tags:[...split(draft.tagsEn),...split(draft.tagsFa)],svg:draft.svg,colorSlots:[],reviewStatus:draft.reviewStatus,premium:draft.premium,active:draft.active,featured:draft.featured,sourceType:draft.sourceType,
    };
    try{
      if(editingId)updateCustomAsset(editingId,payload);else saveCustomAsset(payload);
      refresh();resetForm();setMessage(editingId?'المان ویرایش شد.':'المان جدید به کتابخانه اضافه شد.');
    }catch(error){setMessage(error instanceof Error?error.message:'ذخیره انجام نشد.');}
  };

  const edit=(asset:ScientificAsset)=>{setEditingId(asset.id);setDraft(assetToDraft(asset));setMessage('');window.scrollTo({top:0,behavior:'smooth'});};
  const remove=(asset:ScientificAsset)=>{if(!window.confirm(`«${asset.name}» حذف شود؟`))return;deleteCustomAsset(asset.id);if(editingId===asset.id)resetForm();refresh();};
  const toggle=(asset:ScientificAsset,key:'active'|'featured'|'premium')=>{updateCustomAsset(asset.id,{[key]:!asset[key]});refresh();};

  const addCategory=(event:FormEvent)=>{
    event.preventDefault();if(!newCategory.trim())return;
    saveCustomCategory({name:newCategory,nameFa:newCategoryFa||undefined});setNewCategory('');setNewCategoryFa('');refresh();
  };
  const renameCategory=(id:string,name:string,nameFa:string)=>{updateCustomCategory(id,{name,nameFa:nameFa||undefined});refresh();};
  const removeCategory=(id:string,name:string)=>{if(!window.confirm(`دسته «${name}» حذف شود؟ المان‌های آن به Uncategorized منتقل می‌شوند.`))return;deleteCustomCategory(id);refresh();};

  const exportBackup=()=>{
    const blob=new Blob([JSON.stringify(exportAssetLibrary(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`bioplot-library-${new Date().toISOString().slice(0,10)}.json`;anchor.click();URL.revokeObjectURL(url);
  };
  const importBackup=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    try{importAssetLibrary(JSON.parse(await file.text()));refresh();resetForm();setMessage('نسخه پشتیبان با موفقیت وارد شد.');}catch(error){setMessage(error instanceof Error?error.message:'فایل پشتیبان معتبر نیست.');}finally{event.target.value='';}
  };

  return <div className="admin-library" dir="rtl">
    <header className="admin-header">
      <div className="admin-brand"><span>B</span><div><strong>BioPlot Admin</strong><small>مدیریت کتابخانه علمی</small></div></div>
      <nav><a href="/">داشبورد</a><a className="primary" href="/editor">باز کردن ویرایشگر</a></nav>
    </header>

    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title"><div><strong>دسته‌بندی‌ها</strong><small>{allCategories.length} دسته</small></div></div>
        <button className={!filterCategory?'active':''} onClick={()=>setFilterCategory('')}>همه المان‌ها <span>{assets.length}</span></button>
        {allCategories.map(category=><div className={`admin-category-row ${filterCategory===category.name?'active':''}`} key={category.id}>
          <button onClick={()=>setFilterCategory(category.name)}>{category.name}<span>{assets.filter(asset=>asset.category===category.name).length}</span></button>
          {category.system?<em>سیستمی</em>:<details><summary>•••</summary><div className="category-menu"><label>نام انگلیسی<input defaultValue={category.name} id={`cat-name-${category.id}`}/></label><label>نام فارسی<input defaultValue={category.nameFa??''} id={`cat-fa-${category.id}`}/></label><button onClick={()=>{const name=(document.getElementById(`cat-name-${category.id}`) as HTMLInputElement)?.value||category.name;const fa=(document.getElementById(`cat-fa-${category.id}`) as HTMLInputElement)?.value||'';renameCategory(category.id,name,fa);}}>ذخیره نام</button><button className="danger" onClick={()=>removeCategory(category.id,category.name)}>حذف دسته</button></div></details>}
        </div>)}
        <form className="new-category" onSubmit={addCategory}><strong>دسته جدید</strong><input placeholder="نام انگلیسی" value={newCategory} onChange={event=>setNewCategory(event.target.value)}/><input placeholder="نام فارسی (اختیاری)" value={newCategoryFa} onChange={event=>setNewCategoryFa(event.target.value)}/><button type="submit"><StudioIcon name="plus"/> افزودن دسته</button></form>
      </aside>

      <section className="admin-content">
        <div className="admin-page-title"><div><p>LIBRARY MANAGER</p><h1>مدیریت المان‌های علمی</h1><span>بدون تغییر کد، تصویر و دسته‌بندی‌های جدید به BioPlot اضافه کن.</span></div><div className="admin-stat"><strong>{assets.length}</strong><span>المان سفارشی</span></div><div className="admin-stat"><strong>{builtInCount}</strong><span>المان داخلی</span></div></div>
        <div className="admin-local-note"><StudioIcon name="check"/><div><strong>Local-first فعال است</strong><span>تغییرات فعلاً در همین مرورگر ذخیره می‌شوند و بلافاصله در Scientific assets همین مرورگر دیده می‌شوند. ساختار برای اتصال مرحله بعد به Supabase آماده است.</span></div></div>

        <section className="admin-editor-card">
          <div className="admin-editor-head"><div><strong>{editingId?'ویرایش المان':'افزودن المان جدید'}</strong><span>{editingId?'اطلاعات یا تصویر را تغییر بده و ذخیره کن.':'SVG، PNG، JPG یا WebP آپلود کن.'}</span></div>{editingId&&<button onClick={resetForm}>لغو ویرایش</button>}</div>
          <form className="asset-editor-form" onSubmit={submitAsset}>
            <label className={`asset-drop ${draft.svg?'has-preview':''}`}><input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" onChange={pickFile}/>{draft.svg?<span className="asset-upload-preview" dangerouslySetInnerHTML={{__html:draft.svg}}/>:<><StudioIcon name="upload"/><strong>{busy?'در حال پردازش...':'تصویر را انتخاب کن'}</strong><small>SVG / PNG / JPG / WebP</small></>}</label>
            <div className="asset-fields">
              <div className="field-pair"><label>نام انگلیسی<input value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})} required/></label><label>نام فارسی<input value={draft.nameFa} onChange={event=>setDraft({...draft,nameFa:event.target.value})}/></label></div>
              <div className="field-pair"><label>دسته‌بندی<select value={draft.category} onChange={event=>setDraft({...draft,category:event.target.value})} required><option value="">انتخاب دسته</option>{allCategories.map(category=><option value={category.name} key={category.id}>{category.name}{category.nameFa?` — ${category.nameFa}`:''}</option>)}</select></label><label>وضعیت علمی<select value={draft.reviewStatus} onChange={event=>setDraft({...draft,reviewStatus:event.target.value as Draft['reviewStatus']})}><option value="draft">Draft</option><option value="reviewed">Reviewed</option></select></label></div>
              <div className="field-pair"><label>کلیدواژه انگلیسی<input placeholder="neuron, axon, nerve" value={draft.tagsEn} onChange={event=>setDraft({...draft,tagsEn:event.target.value})}/></label><label>کلیدواژه فارسی<input placeholder="نورون، عصب، آکسون" value={draft.tagsFa} onChange={event=>setDraft({...draft,tagsFa:event.target.value})}/></label></div>
              <div className="field-pair"><label>توضیح انگلیسی<textarea rows={2} value={draft.description} onChange={event=>setDraft({...draft,description:event.target.value})}/></label><label>توضیح فارسی<textarea rows={2} value={draft.descriptionFa} onChange={event=>setDraft({...draft,descriptionFa:event.target.value})}/></label></div>
              <div className="asset-switches"><label><input type="checkbox" checked={draft.active} onChange={event=>setDraft({...draft,active:event.target.checked})}/><span>فعال در کتابخانه</span></label><label><input type="checkbox" checked={draft.featured} onChange={event=>setDraft({...draft,featured:event.target.checked})}/><span>Featured</span></label><label><input type="checkbox" checked={draft.premium} onChange={event=>setDraft({...draft,premium:event.target.checked})}/><span>Premium</span></label></div>
              <div className="asset-form-actions"><button type="submit" className="save" disabled={busy}>{editingId?'ذخیره تغییرات':'افزودن به Library'}</button><button type="button" onClick={resetForm}>پاک کردن فرم</button>{message&&<span>{message}</span>}</div>
            </div>
          </form>
        </section>

        <section className="admin-assets-card">
          <div className="admin-assets-toolbar"><div><strong>المان‌های سفارشی</strong><span>{visible.length} مورد</span></div><label className="admin-search"><StudioIcon name="search"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="جستجو در نام و کلیدواژه‌ها..."/></label><div className="backup-actions"><button onClick={exportBackup}>خروجی JSON</button><label>ورود JSON<input type="file" accept="application/json,.json" onChange={importBackup}/></label></div></div>
          {visible.length?<div className="admin-assets-grid">{visible.map(asset=><article className={`admin-asset-card ${asset.active===false?'inactive':''}`} key={asset.id}><div className="admin-asset-preview" dangerouslySetInnerHTML={{__html:asset.svg}}/><div className="admin-asset-meta"><div><strong>{asset.name}</strong>{asset.nameFa&&<span>{asset.nameFa}</span>}</div><small>{asset.category}</small><div className="asset-badges">{asset.reviewStatus==='reviewed'&&<b>Reviewed</b>}{asset.featured&&<b>Featured</b>}{asset.premium&&<b>Premium</b>}{asset.active===false&&<b>Hidden</b>}</div></div><div className="admin-asset-actions"><button onClick={()=>edit(asset)}>ویرایش</button><button onClick={()=>toggle(asset,'active')}>{asset.active===false?'فعال':'مخفی'}</button><button onClick={()=>toggle(asset,'featured')}>{asset.featured?'★':'☆'}</button><button className="danger" onClick={()=>remove(asset)}><StudioIcon name="trash"/></button></div></article>)}</div>:<div className="admin-empty"><StudioIcon name="assets"/><strong>هنوز المانی در این بخش نیست</strong><span>از فرم بالا اولین تصویر را اضافه کن.</span></div>}
        </section>
      </section>
    </main>
  </div>;
}
