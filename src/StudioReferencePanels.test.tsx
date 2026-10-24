// @vitest-environment jsdom
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {AssetCatalogView} from './StudioReferencePanels';
import type {ScientificAsset} from './assets';

describe('cloud category thumbnails',()=>{
 it('uses original previews for metadata-only assets in both cards and category rows',()=>{
  const assets:ScientificAsset[]=['Immunology','Cell biology','Animals','Molecular biology'].map((category,index)=>({
   id:`asset-${index}`,name:category,category,version:1,svg:'',artworkLoaded:false,
   previewUrl:`https://assets.test/${index}.png`,synonyms:{en:[],fa:[]},colorSlots:[],reviewStatus:'reviewed',premium:false,
  }));
  const html=renderToStaticMarkup(<AssetCatalogView fa assets={assets} grouped favorites={new Set()} onAdd={()=>{}} onFavorite={()=>{}} onCategory={()=>{}}/>);
  const host=document.createElement('div');host.innerHTML=html;
  expect([...host.querySelectorAll('.category-preview img')].map(image=>image.getAttribute('src'))).toEqual(assets.map(asset=>asset.previewUrl));
  expect([...host.querySelectorAll('.asset-main img')].map(image=>image.getAttribute('src'))).toEqual(assets.slice(0,3).map(asset=>asset.previewUrl));
  expect(host.querySelector('.category-preview img')?.getAttribute('loading')).toBe('lazy');
 });
});
