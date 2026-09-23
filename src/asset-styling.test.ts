import { describe, expect, it } from 'vitest';
import { applyAssetPreset, assetSvgWithTint, LINE_ASSET_PRESET_COLORS, recolorAssetSlot, resetAssetVisualStyle, StyledAssetObject } from './assetStyling';
import { objectToSvg } from './export';

const asset:StyledAssetObject={
  id:'asset-test',type:'asset',name:'Cell',assetId:'cell',x:10,y:20,width:120,height:100,rotation:0,opacity:1,
  svg:'<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#6c5aa8"/></svg>',
  colors:[{key:'primary',label:'Primary',value:'#6c5aa8'}]
};

describe('scientific asset styling',()=>{
  it('recolors editable SVG slots without losing object identity',()=>{
    const next=recolorAssetSlot(asset,0,'#087b76');
    expect(next.id).toBe(asset.id);
    expect(next.colors[0].value).toBe('#087b76');
    expect(next.svg).toContain('#087b76');
    expect(next.svg).not.toContain('#6c5aa8');
  });

  it('applies non-destructive visual presets to raster-compatible assets',()=>{
    const next=applyAssetPreset(asset,'teal');
    expect(next.paletteColor).toBe('#087f79');
    expect(next.assetStyle?.hueRotate).toBe(0);
    expect(next.svg).toBe(asset.svg);
    expect(assetSvgWithTint(next)).toContain('feComponentTransfer');
    expect(asset.svg).toContain('#6c5aa8');
  });

  it('resets opacity, filter adjustments and original vector colors',()=>{
    const changed={...applyAssetPreset(recolorAssetSlot(asset,0,'#123456'),'pink'),opacity:.45};
    const reset=resetAssetVisualStyle(changed,asset.svg,asset.colors);
    expect(reset.opacity).toBe(1);
    expect(reset.paletteColor).toBeUndefined();
    expect(assetSvgWithTint(reset)).toBe(asset.svg);
    expect(reset.colors[0].value).toBe('#6c5aa8');
    expect(reset.assetStyle?.saturation).toBe(100);
  });

  it('preserves visual filters in exported SVG',()=>{
    const next=applyAssetPreset(asset,'green');
    const svg=objectToSvg(next);
    expect(svg).toContain('bp-palette-');
    expect(svg).toContain('feComponentTransfer');
    expect(svg).toContain('feColorMatrix type="saturate" values="0"');
  });
});

 it('switches named palettes without stacking filters and restores original source',()=>{
   let next=asset;
   for(const name of ['pink','blue','orange','green']) {
     next=applyAssetPreset(next,name);
     expect(next.paletteColor).toBe(LINE_ASSET_PRESET_COLORS[name]);
     expect(next.svg).toBe(asset.svg);
     expect(assetSvgWithTint(next).match(/<filter /g)).toHaveLength(1);
   }
   expect(assetSvgWithTint(applyAssetPreset(next,'original'))).toBe(asset.svg);
   expect(recolorAssetSlot(next,0,'#ff0000').paletteColor).toBeUndefined();
 });
 it('ignores malformed palette values and preserves locked objects',()=>{
   expect(assetSvgWithTint({...asset,paletteColor:'red\" onload=\"bad'})).toBe(asset.svg);
   const locked={...asset,locked:true};
   expect(applyAssetPreset(locked,'blue')).toBe(locked);
 });
