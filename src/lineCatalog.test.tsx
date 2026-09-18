import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect } from 'vitest';
import { CUSTOM_LINE,LINE_CATEGORIES,LINE_PRESETS,lineCategoryOf,lineCategoryTags } from './lineCatalog';
import { createDrawnLine,nativePresetSvg,worldLineNodes } from './lineGeometry';
import { VectorStudio } from './VectorStudio';
import { documentToSvg } from './export';
import { createBlankDocument } from './model';

describe('categorized line library',()=>{
 it('provides unique editable presets in both requested categories',()=>{
  expect(LINE_CATEGORIES.map(item=>item.en)).toEqual(['Arrows','Circular']);
  expect(LINE_PRESETS).toHaveLength(6);
  expect(new Set(LINE_PRESETS.map(p=>p.id)).size).toBe(LINE_PRESETS.length);
  for(const category of LINE_CATEGORIES)expect(LINE_PRESETS.filter(p=>p.category===category.id).length).toBe(3);
  for(const preset of LINE_PRESETS){
    const line=createDrawnLine({x:30,y:70},{x:250,y:70},preset.settings);
    expect(line.type).toBe('arrow');
    expect(worldLineNodes(line).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true);
    expect(nativePresetSvg(preset.settings)).toContain(`data-bioplot-preset="${preset.settings.presetId}"`);
    const doc=createBlankDocument();doc.pages[0].objects=[line];
    // Embedded font bytes can contain the letters NaN; inspect SVG geometry only.
    expect(documentToSvg(doc).replace(/<style>[\s\S]*?<\/style>/g,'')).not.toMatch(/NaN|Infinity/);
  }
 });
 it('has genuinely different circular geometry, retained through SVG previews',()=>{
  for(const id of ['circular']){
    const preset=LINE_PRESETS.find(item=>item.settings.presetId===id)!;
    const line=createDrawnLine({x:0,y:0},{x:200,y:0},preset.settings);
    expect(line.height).toBeGreaterThan(90);
    expect(worldLineNodes(line).length).toBeGreaterThan(3);
    expect(nativePresetSvg(preset.settings)).toContain(`data-bioplot-preset="${id}"`);
  }
 });
 it('assigns published assets by stable category tags and preserves old assets and other keywords',()=>{
  expect(lineCategoryOf({synonyms:{en:[],fa:[]}})).toBe('arrows');
  const tags=lineCategoryTags(['biology','bioplot-line-category:dots'],'arrows');
  expect(tags).toEqual(['biology','bioplot-line-category:arrows']);
  expect(lineCategoryOf({synonyms:{en:tags,fa:[]}})).toBe('arrows');
 });
 it('keeps one Custom option after the category menu without the old drawing settings',()=>{
  const html=renderToStaticMarkup(createElement(VectorStudio,{fa:false}));
  expect(html.indexOf('Custom')).toBeGreaterThan(html.indexOf('Circular'));
  expect(html).toContain('Add Straight arrow');
  const persian=renderToStaticMarkup(createElement(VectorStudio,{fa:true}));
  expect(persian).toContain('class="bp-line-browser" dir="ltr"');
  expect(html).not.toContain('type="color"');
  expect(html).not.toContain('Choose a tool and drag');
  expect(CUSTOM_LINE.axis).toBeUndefined();
  const drawn=createDrawnLine({x:200,y:200},{x:40,y:80},CUSTOM_LINE);
  const nodes=worldLineNodes(drawn);
  expect(nodes[0]).toEqual({x:200,y:200});
  expect(nodes[1]).toEqual({x:40,y:80});
 });
});
