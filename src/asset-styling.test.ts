import { describe, expect, it } from 'vitest';
import { applyAssetPreset, assetCssFilter, recolorAssetSlot, resetAssetVisualStyle, StyledAssetObject } from './assetStyling';
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
    expect(next.assetStyle?.saturation).toBeGreaterThan(100);
    expect(assetCssFilter(next)).toContain('hue-rotate(');
    expect(asset.svg).toContain('#6c5aa8');
  });

  it('resets opacity, filter adjustments and original vector colors',()=>{
    const changed={...applyAssetPreset(recolorAssetSlot(asset,0,'#123456'),'pink'),opacity:.45};
    const reset=resetAssetVisualStyle(changed,asset.svg,asset.colors);
    expect(reset.opacity).toBe(1);
    expect(reset.colors[0].value).toBe('#6c5aa8');
    expect(reset.assetStyle?.saturation).toBe(100);
  });

  it('preserves visual filters in exported SVG',()=>{
    const next=applyAssetPreset(asset,'green');
    const svg=objectToSvg(next);
    expect(svg).toContain('<filter id="bp-asset-asset-test"');
    expect(svg).toContain('filter="url(#bp-asset-asset-test)"');
  });
});
