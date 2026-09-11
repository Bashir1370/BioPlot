import { AssetObject, makeId } from './model';
import { scientificStarterAssets } from './scientificAssetPack';

export interface ScientificAsset {
  id: string;
  name: string;
  category: string;
  synonyms: { en: string[]; fa: string[] };
  svg: string;
  colorSlots: Array<{ key: string; label: string; defaultValue: string }>;
  reviewStatus: 'draft' | 'reviewed';
  premium: boolean;
  version: number;
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
const FAVORITES_KEY='bioplot_asset_favorites_v1';
const RECENTS_KEY='bioplot_asset_recents_v1';

export function sanitizeSvg(source: string): string {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = parsed.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) throw new Error('Invalid SVG');
  parsed.querySelectorAll('script,foreignObject,iframe,object,embed,link,style,animate,animateMotion,animateTransform,set').forEach(node => node.remove());
  parsed.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      const externalRef = (name === 'href' || name.endsWith(':href')) && !value.startsWith('#') && value !== '';
      if (name.startsWith('on') || externalRef || value.includes('javascript:') || value.includes('url(')) node.removeAttribute(attribute.name);
    });
  });
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(svg);
}

export function loadCustomAssets(): ScientificAsset[] {
  try { const raw = localStorage.getItem(CUSTOM_ASSET_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
}
export function saveCustomAsset(input: Omit<ScientificAsset, 'id' | 'version'>): ScientificAsset {
  const existing = loadCustomAssets();
  const asset: ScientificAsset = { ...input, id: makeId('asset'), svg: sanitizeSvg(input.svg), version: 1 };
  localStorage.setItem(CUSTOM_ASSET_KEY, JSON.stringify([asset, ...existing]));
  return asset;
}
export function getAssetCatalog() { return [...seedAssets, ...loadCustomAssets()]; }
export function getAssetCategories(){return [...new Set(getAssetCatalog().map(asset=>asset.category))].sort();}
export function searchAssets(query: string, locale: 'en' | 'fa' = 'en', category?:string) {
  const normalized = query.trim().toLowerCase();
  return getAssetCatalog().filter(asset => {
    if(category&&asset.category!==category)return false;
    if(!normalized)return true;
    const haystack = [asset.name, asset.category, ...asset.synonyms.en, ...asset.synonyms.fa].join(' ').toLowerCase();
    return haystack.includes(normalized) || asset.synonyms[locale].some(item => item.toLowerCase().includes(normalized));
  });
}
function readIds(key:string){try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(parsed)?parsed.filter((id):id is string=>typeof id==='string'):[];}catch{return[];}}
export function favoriteAssetIds(){return readIds(FAVORITES_KEY);}
export function toggleFavoriteAsset(id:string){const ids=new Set(favoriteAssetIds());ids.has(id)?ids.delete(id):ids.add(id);localStorage.setItem(FAVORITES_KEY,JSON.stringify([...ids]));return [...ids];}
export function recentAssetIds(){return readIds(RECENTS_KEY);}
export function markAssetUsed(id:string){const ids=[id,...recentAssetIds().filter(item=>item!==id)].slice(0,16);localStorage.setItem(RECENTS_KEY,JSON.stringify(ids));}
export function recentAssets(){const ids=recentAssetIds(),catalog=getAssetCatalog();return ids.map(id=>catalog.find(asset=>asset.id===id)).filter((asset):asset is ScientificAsset=>Boolean(asset));}
export function favoriteAssets(){const ids=new Set(favoriteAssetIds());return getAssetCatalog().filter(asset=>ids.has(asset.id));}

export function assetToObject(asset: ScientificAsset, x = 360, y = 260): AssetObject {
  markAssetUsed(asset.id);
  return { id: makeId(), type: 'asset', name: asset.name, assetId: asset.id, svg: asset.svg, colors: asset.colorSlots.map(slot => ({ key: slot.key, label: slot.label, value: slot.defaultValue })), x, y, width: 150, height: 110, rotation: 0, opacity: 1 };
}
