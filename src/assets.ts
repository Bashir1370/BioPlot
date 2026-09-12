import { AssetObject, makeId } from './model';
import { scientificStarterAssets } from './scientificAssetPack';

export interface ScientificAsset {
  id: string;
  name: string;
  nameFa?: string;
  category: string;
  description?: string;
  descriptionFa?: string;
  synonyms: { en: string[]; fa: string[] };
  tags?: string[];
  svg: string;
  colorSlots: Array<{ key: string; label: string; defaultValue: string }>;
  reviewStatus: 'draft' | 'reviewed';
  premium: boolean;
  active?: boolean;
  featured?: boolean;
  sortOrder?: number;
  sourceType?: 'svg' | 'png' | 'jpeg' | 'webp';
  version: number;
}

export interface AssetCategoryRecord {
  id: string;
  name: string;
  nameFa?: string;
  active: boolean;
  sortOrder: number;
  system?: boolean;
}

export interface AssetLibraryBackup {
  version: 1;
  exportedAt: string;
  categories: AssetCategoryRecord[];
  assets: ScientificAsset[];
}

const neuronSvg = `<svg viewBox="0 0 90 70" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#3d8b86" stroke-width="4" stroke-linecap="round"><path d="M34 36C20 22 15 11 6 5"/><path d="M34 36C18 40 11 52 4 63"/><path d="M34 36C18 34 10 34 3 34"/><path d="M53 36C67 35 75 29 87 18"/><path d="M53 36C68 40 76 49 88 60"/></g><ellipse cx="43" cy="36" rx="16" ry="14" fill="#dff2ef" stroke="#3d8b86" stroke-width="3"/><circle cx="43" cy="36" r="5" fill="#78bcb6"/></svg>`;
const mitoSvg = `<svg viewBox="0 0 90 60" xmlns="http://www.w3.org/2000/svg"><path d="M8 30C9 9 27 6 43 11c13 4 22-4 34 2 14 7 13 34-3 40-12 5-21-3-34 0-18 5-33-3-32-23Z" fill="#fee8cf" stroke="#d48d4c" stroke-width="3"/><path d="M22 21c9 11 14-8 23 5s14-6 25 5" fill="none" stroke="#d48d4c" stroke-width="3"/></svg>`;
const dnaSvg = `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg"><path d="M20 5c28 18 12 43 40 60M60 5C32 23 48 48 20 65" fill="none" stroke="#6c5aa8" stroke-width="4"/><g stroke="#9d91cb" stroke-width="2"><path d="M27 12h26"/><path d="M22 24h36"/><path d="M27 36h26"/><path d="M22 48h36"/><path d="M27 60h26"/></g></svg>`;
const cellSvg = `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg"><path d="M11 37C8 18 21 7 41 8s31 12 29 30c-2 17-14 25-31 24S14 54 11 37Z" fill="#e8f5ee" stroke="#5d9f80" stroke-width="3"/><circle cx="42" cy="35" r="12" fill="#b9decf" stroke="#5d9f80" stroke-width="2"/></svg>`;

export const seedAssets: ScientificAsset[] = [
  { id: 'neuron', name: 'Neuron', category: 'Neuroscience', synonyms: { en: ['nerve', 'neuron', 'axon'], fa: ['نورون', 'عصب', 'آکسون'] }, svg: neuronSvg, colorSlots: [{ key: 'primary', label: 'Neuron', defaultValue: '#3d8b86' }], reviewStatus: 'reviewed', premium: false, version: 1 },
  { id: 'mitochondrion', name: 'Mitochondrion', category: 'Cell biology', synonyms: { en: ['mitochondria', 'mitochondrion'], fa: ['میتوکندری', 'میتوکندریوم'] }, svg: mitoSvg, colorSlots: [{ key: 'primary', label: 'Membrane', defaultValue: '#d48d4c' }], reviewStatus: 'reviewed', premium: false, version: 1 },
  { id: 'dna', name: 'DNA', category: 'Molecular biology', synonyms: { en: ['dna', 'genome', 'helix'], fa: ['دی ان ای', 'ژنوم', 'مارپیچ'] }, svg: dnaSvg, colorSlots: [{ key: 'primary', label: 'DNA', defaultValue: '#6c5aa8' }], reviewStatus: 'reviewed', premium: false, version: 1 },
  { id: 'cell', name: 'Cell', category: 'Cell biology', synonyms: { en: ['cell', 'nucleus'], fa: ['سلول', 'هسته'] }, svg: cellSvg, colorSlots: [{ key: 'primary', label: 'Cell', defaultValue: '#5d9f80' }], reviewStatus: 'reviewed', premium: false, version: 1 },
  ...scientificStarterAssets
];

const CUSTOM_ASSET_KEY = 'bioplot_v3_custom_assets';
const CUSTOM_CATEGORY_KEY = 'bioplot_v3_custom_asset_categories';
const FAVORITES_KEY='bioplot_asset_favorites_v1';
const RECENTS_KEY='bioplot_asset_recents_v1';
const UNCAT='Uncategorized';
let runtimeCloudAssets: ScientificAsset[] | null = null;

function notifyLibraryChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bioplot:asset-library-changed'));
}

function isCloudManagedAsset(asset: ScientificAsset) {
  return Boolean((asset as ScientificAsset & { cloudManaged?: boolean }).cloudManaged);
}

export function sanitizeSvg(source: string): string {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = parsed.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) throw new Error('Invalid SVG');
  parsed.querySelectorAll('script,foreignObject,iframe,object,embed,link,style,animate,animateMotion,animateTransform,set').forEach(node => node.remove());
  parsed.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const rawValue = attribute.value.trim();
      const value = rawValue.toLowerCase();
      const safeEmbeddedImage = (name === 'href' || name.endsWith(':href')) && /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(rawValue);
      const externalRef = (name === 'href' || name.endsWith(':href')) && !value.startsWith('#') && value !== '' && !safeEmbeddedImage;
      if (name.startsWith('on') || externalRef || value.includes('javascript:') || value.includes('url(')) node.removeAttribute(attribute.name);
    });
  });
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(svg);
}

function normalizeAsset(asset: ScientificAsset, index = 0): ScientificAsset {
  return {
    ...asset,
    synonyms: asset.synonyms ?? { en: [], fa: [] },
    colorSlots: asset.colorSlots ?? [],
    reviewStatus: asset.reviewStatus ?? 'draft',
    premium: Boolean(asset.premium),
    active: asset.active !== false,
    featured: Boolean(asset.featured),
    sortOrder: Number.isFinite(asset.sortOrder) ? asset.sortOrder : index * 10,
    version: Number.isFinite(asset.version) ? asset.version : 1,
  };
}

export function setRuntimeCloudAssets(assets: ScientificAsset[]) {
  const next = assets.flatMap((asset,index) => {
    try {
      return [normalizeAsset({ ...asset, svg: sanitizeSvg(asset.svg) }, index)];
    } catch {
      return [];
    }
  });
  const signature = (items: ScientificAsset[]) => JSON.stringify(items.map(asset => [asset.id, asset.version, asset.active, asset.featured, asset.sortOrder, asset.svg.length]));
  const changed = runtimeCloudAssets === null || signature(runtimeCloudAssets) !== signature(next);
  runtimeCloudAssets = next;
  if (changed) notifyLibraryChanged();
}

export function loadCustomAssets(): ScientificAsset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ASSET_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((asset,index)=>normalizeAsset(asset,index)).sort((a,b)=>(a.sortOrder ?? 0)-(b.sortOrder ?? 0)) : [];
  } catch { return []; }
}

function writeCustomAssets(assets: ScientificAsset[]) {
  localStorage.setItem(CUSTOM_ASSET_KEY, JSON.stringify(assets.map(normalizeAsset)));
  notifyLibraryChanged();
}

export function saveCustomAsset(input: Omit<ScientificAsset, 'id' | 'version'>): ScientificAsset {
  const existing = loadCustomAssets();
  const maxOrder = existing.reduce((max,asset)=>Math.max(max,asset.sortOrder ?? 0),0);
  const asset: ScientificAsset = normalizeAsset({ ...input, id: makeId('asset'), svg: sanitizeSvg(input.svg), version: 1, sortOrder: input.sortOrder ?? maxOrder + 10 });
  writeCustomAssets([asset, ...existing]);
  return asset;
}

export function updateCustomAsset(id:string, changes:Partial<Omit<ScientificAsset,'id'>>):ScientificAsset | null {
  const existing=loadCustomAssets();
  const index=existing.findIndex(asset=>asset.id===id);
  if(index<0)return null;
  const current=existing[index];
  const next=normalizeAsset({ ...current, ...changes, id, svg: changes.svg ? sanitizeSvg(changes.svg) : current.svg, version: current.version + 1 });
  existing[index]=next;
  writeCustomAssets(existing);
  return next;
}

export function deleteCustomAsset(id:string){
  const existing=loadCustomAssets();
  writeCustomAssets(existing.filter(asset=>asset.id!==id));
}

export function replaceCustomAssets(assets:ScientificAsset[]){
  writeCustomAssets(assets.map((asset,index)=>normalizeAsset({...asset,svg:sanitizeSvg(asset.svg)},index)));
}

export function loadCustomCategories():AssetCategoryRecord[]{
  try{
    const raw=localStorage.getItem(CUSTOM_CATEGORY_KEY);
    const parsed=raw?JSON.parse(raw):[];
    return Array.isArray(parsed)?parsed.map((item,index)=>({id:String(item.id||makeId('category')),name:String(item.name||UNCAT),nameFa:item.nameFa?String(item.nameFa):undefined,active:item.active!==false,sortOrder:Number.isFinite(item.sortOrder)?item.sortOrder:index*10})).sort((a,b)=>a.sortOrder-b.sortOrder):[];
  }catch{return[];}
}

function writeCustomCategories(categories:AssetCategoryRecord[]){
  localStorage.setItem(CUSTOM_CATEGORY_KEY,JSON.stringify(categories));
  notifyLibraryChanged();
}

export function saveCustomCategory(input:{name:string;nameFa?:string;active?:boolean;sortOrder?:number}):AssetCategoryRecord{
  const existing=loadCustomCategories();
  const duplicate=existing.find(item=>item.name.toLowerCase()===input.name.trim().toLowerCase());
  if(duplicate)return duplicate;
  const maxOrder=existing.reduce((max,item)=>Math.max(max,item.sortOrder),0);
  const category:AssetCategoryRecord={id:makeId('category'),name:input.name.trim()||UNCAT,nameFa:input.nameFa?.trim()||undefined,active:input.active!==false,sortOrder:input.sortOrder??maxOrder+10};
  writeCustomCategories([...existing,category]);
  return category;
}

export function updateCustomCategory(id:string,changes:Partial<Omit<AssetCategoryRecord,'id'|'system'>>):AssetCategoryRecord|null{
  const existing=loadCustomCategories();
  const index=existing.findIndex(item=>item.id===id);
  if(index<0)return null;
  const previous=existing[index];
  const next:AssetCategoryRecord={...previous,...changes,id,name:(changes.name??previous.name).trim()||UNCAT};
  existing[index]=next;
  writeCustomCategories(existing);
  if(previous.name!==next.name){
    const assets=loadCustomAssets().map(asset=>asset.category===previous.name?{...asset,category:next.name}:asset);
    writeCustomAssets(assets);
  }
  return next;
}

export function deleteCustomCategory(id:string){
  const existing=loadCustomCategories();
  const target=existing.find(item=>item.id===id);
  if(!target)return;
  writeCustomCategories(existing.filter(item=>item.id!==id));
  const assets=loadCustomAssets().map(asset=>asset.category===target.name?{...asset,category:UNCAT}:asset);
  writeCustomAssets(assets);
}

export function getAdminCategories():AssetCategoryRecord[]{
  const custom=loadCustomCategories();
  const customNames=new Set(custom.map(item=>item.name));
  const systemNames=[...new Set(seedAssets.map(asset=>asset.category))].filter(name=>!customNames.has(name));
  const system=systemNames.map((name,index)=>({id:`system:${name}`,name,active:true,sortOrder:10000+index,system:true}));
  return [...custom,...system].sort((a,b)=>a.sortOrder-b.sortOrder||a.name.localeCompare(b.name));
}

export function getAssetCatalog(includeInactive=false) {
  const stored=loadCustomAssets();
  const localOnly=stored.filter(asset=>!isCloudManagedAsset(asset));
  const cachedCloud=stored.filter(isCloudManagedAsset);
  const cloud=runtimeCloudAssets ?? cachedCloud;
  const combined=[...seedAssets.map((asset,index)=>normalizeAsset(asset,index+10000)),...cloud,...localOnly];
  const unique=[...new Map(combined.map(asset=>[asset.id,asset])).values()];
  return unique.filter(asset=>includeInactive||asset.active!==false).sort((a,b)=>{
    if(Boolean(a.featured)!==Boolean(b.featured))return a.featured?-1:1;
    return (a.sortOrder??0)-(b.sortOrder??0);
  });
}

export function getAssetCategories(){
  const assetCategories=getAssetCatalog().map(asset=>asset.category);
  const customCategories=loadCustomCategories().filter(item=>item.active).map(item=>item.name);
  return [...new Set([...customCategories,...assetCategories])].sort();
}

export function searchAssets(query: string, locale: 'en' | 'fa' = 'en', category?:string) {
  const normalized = query.trim().toLowerCase();
  return getAssetCatalog().filter(asset => {
    if(category&&asset.category!==category)return false;
    if(!normalized)return true;
    const haystack = [asset.name, asset.nameFa ?? '', asset.category, asset.description ?? '', asset.descriptionFa ?? '', ...(asset.tags ?? []), ...asset.synonyms.en, ...asset.synonyms.fa].join(' ').toLowerCase();
    return haystack.includes(normalized) || asset.synonyms[locale].some(item => item.toLowerCase().includes(normalized));
  });
}

export function exportAssetLibrary():AssetLibraryBackup{
  return {version:1,exportedAt:new Date().toISOString(),categories:loadCustomCategories(),assets:loadCustomAssets()};
}

export function importAssetLibrary(value:unknown){
  if(!value||typeof value!=='object')throw new Error('Invalid library backup');
  const record=value as Partial<AssetLibraryBackup>;
  if(record.version!==1||!Array.isArray(record.assets)||!Array.isArray(record.categories))throw new Error('Unsupported library backup');
  replaceCustomAssets(record.assets);
  writeCustomCategories(record.categories.map((item,index)=>({id:String(item.id||makeId('category')),name:String(item.name||UNCAT),nameFa:item.nameFa?String(item.nameFa):undefined,active:item.active!==false,sortOrder:Number.isFinite(item.sortOrder)?item.sortOrder:index*10})));
}

function readIds(key:string){try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(parsed)?parsed.filter((id):id is string=>typeof id==='string'):[];}catch{return[];}}
export function favoriteAssetIds(){return readIds(FAVORITES_KEY);}
export function toggleFavoriteAsset(id:string){const ids=new Set(favoriteAssetIds());ids.has(id)?ids.delete(id):ids.add(id);localStorage.setItem(FAVORITES_KEY,JSON.stringify([...ids]));return [...ids];}
export function recentAssetIds(){return readIds(RECENTS_KEY);}
export function markAssetUsed(id:string){const ids=[id,...recentAssetIds().filter(item=>item!==id)].slice(0,16);localStorage.setItem(RECENTS_KEY,JSON.stringify(ids));}
export function recentAssets(){const ids=recentAssetIds(),catalog=getAssetCatalog();return ids.map(id=>catalog.find(asset=>asset.id===id)).filter((asset):asset is ScientificAsset=>Boolean(asset));}
export function favoriteAssets(){const ids=new Set(favoriteAssetIds());return getAssetCatalog().filter(asset=>ids.has(asset.id));}

function assetAspectRatio(svg:string){
  const viewBox=svg.match(/\bviewBox\s*=\s*["']\s*[-+\d.eE]+[\s,]+[-+\d.eE]+[\s,]+([-+\d.eE]+)[\s,]+([-+\d.eE]+)\s*["']/i);
  if(viewBox){
    const width=Number(viewBox[1]),height=Number(viewBox[2]);
    if(Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0)return width/height;
  }
  const width=svg.match(/\bwidth\s*=\s*["']([\d.]+)/i),height=svg.match(/\bheight\s*=\s*["']([\d.]+)/i);
  if(width&&height){
    const w=Number(width[1]),h=Number(height[1]);
    if(Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0)return w/h;
  }
  return 150/110;
}

export function assetToObject(asset: ScientificAsset, x = 360, y = 260): AssetObject {
  markAssetUsed(asset.id);
  const ratio=Math.max(.3,Math.min(3.3,assetAspectRatio(asset.svg)));
  const targetArea=150*110;
  let width=Math.sqrt(targetArea*ratio),height=width/ratio;
  const maxSide=190;
  if(width>maxSide){height*=maxSide/width;width=maxSide;}
  if(height>maxSide){width*=maxSide/height;height=maxSide;}
  return { id: makeId(), type: 'asset', name: asset.name, assetId: asset.id, svg: asset.svg, colors: asset.colorSlots.map(slot => ({ key: slot.key, label: slot.label, value: slot.defaultValue })), x, y, width: Math.round(width), height: Math.round(height), rotation: 0, opacity: 1 };
}