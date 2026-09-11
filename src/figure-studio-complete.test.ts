import { describe, expect, it } from 'vitest';
import { resolveConnector } from './connectors';
import { documentToSvg } from './export';
import { createHomeTemplateDocument, homeTemplates } from './homeTemplates';
import { activePage, BioPlotObject, createBlankDocument, makeId, migrateDocument } from './model';
import { checkPublicationQuality, qualityScore } from './publication';
import { SCIENTIFIC_SYMBOLS, toSubscript, toSuperscript } from './typography';

describe('Figure Studio complete workflow',()=>{
  it('supports scientific typography helpers',()=>{
    expect(toSuperscript('2+')).toBe('²⁺');
    expect(toSubscript('CO2')).toBe('CO₂');
    expect(SCIENTIFIC_SYMBOLS).toContain('α');
  });

  it('keeps attached connectors aligned to object ports',()=>{
    const doc=createBlankDocument();const page=activePage(doc);page.objects=[];
    const from:BioPlotObject={id:'a',type:'shape',name:'A',shape:'rect',x:10,y:30,width:100,height:60,rotation:0,opacity:1,fill:'#fff',stroke:'#000',strokeWidth:1,radius:4};
    const to:BioPlotObject={id:'b',type:'shape',name:'B',shape:'rect',x:310,y:60,width:100,height:60,rotation:0,opacity:1,fill:'#fff',stroke:'#000',strokeWidth:1,radius:4};
    const connector:BioPlotObject={id:'c',type:'connector',name:'Link',x:0,y:0,width:10,height:10,rotation:0,opacity:1,stroke:'#000',strokeWidth:2,lineStyle:'solid',route:'elbow',arrowHead:'end',fromObjectId:'a',toObjectId:'b',fromPort:'auto',toPort:'auto',autoRoute:true};
    const resolved=resolveConnector(connector,[from,to,connector]);
    expect(resolved.width).toBeGreaterThan(150);
    expect(resolved.x).toBeGreaterThanOrEqual(100);
  });

  it('creates every figure template as an editable v5 document',()=>{
    for(const template of homeTemplates){
      const doc=createHomeTemplateDocument(template.id,'en');
      expect(doc.schemaVersion).toBe(5);
      expect(activePage(doc).objects.length).toBeGreaterThan(0);
      expect(doc.metadata.tags).toContain(`template:${template.id}`);
    }
  });

  it('exports native SVG with transparent selection support',()=>{
    const doc=createHomeTemplateDocument('mechanism','en');
    const id=activePage(doc).objects[0].id;
    const svg=documentToSvg(doc,{transparent:true,objectIds:new Set([id]),cropToSelection:true});
    expect(svg).toContain('<svg');
    expect(svg).not.toContain('foreignObject');
    expect(svg).not.toContain('<rect width="100%" height="100%"');
  });

  it('finds publication quality problems and calculates a score',()=>{
    const doc=createBlankDocument();const page=activePage(doc);const text=page.objects[0];
    if(text.type==='text'){text.fontSize=7;text.color='#ffffff';text.x=-4;}
    const issues=checkPublicationQuality(doc);
    expect(issues.some(issue=>issue.code==='SMALL_TEXT')).toBe(true);
    expect(issues.some(issue=>issue.code==='OUTSIDE_ARTBOARD')).toBe(true);
    expect(qualityScore(issues)).toBeLessThan(100);
  });

  it('migrates v4 documents to v5 typography defaults',()=>{
    const old=createBlankDocument() as unknown as Record<string,unknown>;old.schemaVersion=4;
    const pages=old.pages as Array<{objects:Array<Record<string,unknown>>}>;const text=pages[0].objects[0];delete text.fontFamily;delete text.lineHeight;
    const migrated=migrateDocument(old);const object=activePage(migrated).objects[0];
    expect(migrated.schemaVersion).toBe(5);
    expect(object.type==='text'&&object.fontFamily).toBe('Inter');
  });

  it('handles a 1000-object publication scan deterministically',()=>{
    const doc=createBlankDocument();const page=activePage(doc);page.objects=[];
    for(let i=0;i<1000;i++)page.objects.push({id:makeId(),type:'shape',name:`Node ${i}`,shape:'rect',x:(i%20)*45,y:Math.floor(i/20)*11,width:32,height:8,rotation:0,opacity:1,fill:'#ffffff',stroke:'#526e7a',strokeWidth:1,radius:2});
    const issues=checkPublicationQuality(doc);
    expect(page.objects).toHaveLength(1000);
    expect(Array.isArray(issues)).toBe(true);
  });
});
