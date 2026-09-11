import { activePage, BioPlotDocument, BioPlotObject } from './model';

export type QualitySeverity='error'|'warning'|'info';
export interface QualityIssue{
  id:string;
  severity:QualitySeverity;
  title:string;
  detail:string;
  objectId?:string;
  code:'OUTSIDE_ARTBOARD'|'SMALL_TEXT'|'LOW_CONTRAST'|'FONT_MIX'|'STROKE_MIX'|'LOW_IMAGE_DPI'|'EMPTY_TEXT'|'NO_PANEL_LABELS';
}

function hexToRgb(hex:string){
  const normalized=hex.replace('#','');
  if(!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {r:parseInt(normalized.slice(0,2),16),g:parseInt(normalized.slice(2,4),16),b:parseInt(normalized.slice(4,6),16)};
}
function luminance(hex:string){
  const rgb=hexToRgb(hex);if(!rgb)return null;
  const channel=(value:number)=>{const v=value/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  return .2126*channel(rgb.r)+.7152*channel(rgb.g)+.0722*channel(rgb.b);
}
function contrast(a:string,b:string){
  const la=luminance(a),lb=luminance(b);if(la===null||lb===null)return null;
  const hi=Math.max(la,lb),lo=Math.min(la,lb);return (hi+.05)/(lo+.05);
}
function objectStrokeWidth(object:BioPlotObject){
  if(object.type==='shape'||object.type==='arrow'||object.type==='connector'||object.type==='container') return object.strokeWidth;
  return null;
}

export function checkPublicationQuality(document:BioPlotDocument,exportWidthMm=document.metadata.lastExportWidthMm??160,exportDpi=document.metadata.lastExportDpi??300):QualityIssue[]{
  const page=activePage(document),issues:QualityIssue[]=[];
  const fonts=new Set<string>(),strokes:number[]=[];
  page.objects.filter(object=>!object.hidden).forEach(object=>{
    if(object.x<0||object.y<0||object.x+object.width>page.width||object.y+object.height>page.height){
      issues.push({id:`outside:${object.id}`,severity:'warning',code:'OUTSIDE_ARTBOARD',title:'Object outside artboard',detail:`${object.name} extends beyond the export area.`,objectId:object.id});
    }
    if(object.type==='text'||object.type==='label'){
      if(!object.text.trim())issues.push({id:`empty:${object.id}`,severity:'warning',code:'EMPTY_TEXT',title:'Empty text object',detail:`${object.name} contains no visible text.`,objectId:object.id});
      if(object.fontSize<10)issues.push({id:`small:${object.id}`,severity:'warning',code:'SMALL_TEXT',title:'Text may be too small',detail:`${object.name} is ${object.fontSize}px. Publication figures are usually safer at 10px or above in this artboard scale.`,objectId:object.id});
      fonts.add(object.fontFamily||'Inter');
      const background=object.type==='label'?object.background:page.background;
      const ratio=contrast(object.color,background);
      if(ratio!==null&&ratio<4.5)issues.push({id:`contrast:${object.id}`,severity:'warning',code:'LOW_CONTRAST',title:'Low text contrast',detail:`${object.name} has an estimated contrast ratio of ${ratio.toFixed(1)}:1.`,objectId:object.id});
    }
    const stroke=objectStrokeWidth(object);if(stroke!==null)strokes.push(stroke);
    if(object.type==='image'&&object.naturalWidth&&object.width>0){
      const outputPixelWidth=(exportWidthMm/25.4)*exportDpi;
      const displayedPixels=outputPixelWidth*(object.width/page.width);
      const effectiveDpi=exportDpi*(object.naturalWidth/displayedPixels);
      if(effectiveDpi<150)issues.push({id:`dpi:${object.id}`,severity:'error',code:'LOW_IMAGE_DPI',title:'Raster image resolution is low',detail:`${object.name} is approximately ${Math.round(effectiveDpi)} effective DPI at the current export size.`,objectId:object.id});
    }
  });
  if(fonts.size>3)issues.push({id:'font-mix',severity:'info',code:'FONT_MIX',title:'Many font families',detail:`This figure uses ${fonts.size} font families. Consider reducing typography variation.`});
  if(strokes.length){
    const unique=[...new Set(strokes.map(value=>Math.round(value*10)/10))];
    if(unique.length>4)issues.push({id:'stroke-mix',severity:'info',code:'STROKE_MIX',title:'Inconsistent stroke weights',detail:`The figure uses ${unique.length} different line weights.`});
  }
  const panelLabels=page.objects.filter(object=>object.type==='label'&&object.variant==='panel'&&!object.hidden);
  if(page.objects.length>8&&!panelLabels.length)issues.push({id:'panels',severity:'info',code:'NO_PANEL_LABELS',title:'No panel labels detected',detail:'For multi-panel publication figures, consider adding A/B/C panel labels.'});
  return issues;
}

export function qualityScore(issues:QualityIssue[]){
  const penalty=issues.reduce((sum,issue)=>sum+(issue.severity==='error'?25:issue.severity==='warning'?10:3),0);
  return Math.max(0,100-penalty);
}
