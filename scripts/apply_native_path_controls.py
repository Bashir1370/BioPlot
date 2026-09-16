"""One-time anchored patch for contextual line properties and admin-authored native templates."""
from pathlib import Path


def change(name, old, new):
    p=Path('src')/name
    s=p.read_text(encoding='utf-8')
    if s.count(old)!=1: raise RuntimeError(f'{name}: expected unique anchor, found {s.count(old)}: {old[:85]!r}')
    p.write_text(s.replace(old,new,1),encoding='utf-8')
    print('Updated',name)


def section(name, start, end, new):
    p=Path('src')/name;s=p.read_text(encoding='utf-8')
    if s.count(start)!=1 or s.count(end)!=1: raise RuntimeError(f'{name}: section anchor ambiguous: {start[:70]}')
    i=s.index(start);j=s.index(end,i)
    p.write_text(s[:i]+new+s[j:],encoding='utf-8');print('Replaced section',name)

change('EditorInspector.tsx',"import { StudioIcon } from './StudioIcon';","import { StudioIcon } from './StudioIcon';\nimport { NativePathControls } from './NativePathControls';")
section('EditorInspector.tsx','function LineProperties({ fa, single, objects, onCommit }:', '\nfunction Layers(', '''function LineProperties({ fa, single, objects, onCommit }: { fa:boolean; single:Extract<BioPlotObject,{type:'arrow'|'connector'}>; objects:BioPlotObject[]; onCommit:Commit }) {
  const change=(patch:Partial<ConnectorObject>,label:string)=>onCommit(label,object=>object.id===single.id&&object.type==='connector'&&!object.locked?{...object,...patch}:object);
  const candidates=objects.filter(object=>object.id!==single.id&&object.type!=='connector'&&!object.hidden);
  return <section className="bp-contextual-line">
    <h3>{fa?'طراحی خط':'Line design'}</h3>
    {single.type==='arrow'?<NativePathControls fa={fa} line={single} onCommit={onCommit}/>:<>
      <div className="property-grid"><label><span>{fa?'ضخامت':'Width'}</span><input type="number" min="0.5" max="40" step="0.5" value={single.strokeWidth} onChange={event=>change({strokeWidth:Math.max(.5,Math.min(40,Number(event.target.value)||.5))},'Connector width')}/></label><label><span>{fa?'نوع خط':'Style'}</span><select value={single.lineStyle} onChange={event=>change({lineStyle:event.target.value as ConnectorObject['lineStyle']},'Connector style')}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></label></div>
      <label className="property-stack"><span>{fa?'سر فلش':'Arrow head'}</span><select value={single.arrowHead} onChange={event=>change({arrowHead:event.target.value as ConnectorObject['arrowHead']},'Connector head')}><option value="end">End</option><option value="both">Both</option><option value="none">None</option><option value="inhibition">Inhibition</option></select></label>
      <label className="property-stack"><span>{fa?'مسیر':'Route'}</span><select value={single.route} onChange={event=>change({route:event.target.value as ConnectorObject['route']},'Connector route')}><option value="straight">Straight</option><option value="elbow">Elbow</option><option value="curved">Curved</option></select></label>
      <label className="property-stack"><span>{fa?'برچسب':'Label'}</span><input value={single.label??''} onChange={event=>change({label:event.target.value},'Connector label')}/></label>
      <div className="connector-bindings"><label><span>{fa?'شروع از':'From object'}</span><select value={single.fromObjectId??''} onChange={event=>change({fromObjectId:event.target.value||undefined},'Attach start')}><option value="">Free</option>{candidates.map(object=><option key={object.id} value={object.id}>{object.name}</option>)}</select></label><label><span>{fa?'پایان به':'To object'}</span><select value={single.toObjectId??''} onChange={event=>change({toObjectId:event.target.value||undefined},'Attach end')}><option value="">Free</option>{candidates.map(object=><option key={object.id} value={object.id}>{object.name}</option>)}</select></label></div>
      <div className="property-grid">{(['fromPort','toPort'] as const).map(field=><label key={field}><span>{field==='fromPort'?'From port':'To port'}</span><select value={single[field]??'auto'} onChange={event=>change({[field]:event.target.value as ConnectorPort},'Connector port')}>{['auto','top','right','bottom','left','center'].map(port=><option key={port}>{port}</option>)}</select></label>)}</div>
    </>}
  </section>;
}
''')

change('AdminLinesPage.tsx',"import { sanitizeSvg } from './assets';","import { sanitizeSvg } from './assets';\nimport { nativePresetSvg, type DrawLineSettings } from './lineGeometry';\nimport './admin-native-lines.css';")
change('AdminLinesPage.tsx',"  const [file, setFile] = useState<File | null>(null);","""  const [file, setFile] = useState<File | null>(null);
  const [kind,setKind]=useState<'native'|'svg'>('native');
  const [presetId,setPresetId]=useState('curved');
  const [stroke,setStroke]=useState('#087f79');
  const [strokeWidth,setStrokeWidth]=useState(2);
  const [lineStyle,setLineStyle]=useState<DrawLineSettings['lineStyle']>('solid');
  const [startHead,setStartHead]=useState<DrawLineSettings['startHead']>('none');
  const [endHead,setEndHead]=useState<DrawLineSettings['endHead']>('arrow');""")
change('AdminLinesPage.tsx',"  const [notice, setNotice] = useState('');","""  const [notice, setNotice] = useState('');
  const mode:DrawLineSettings['pathMode']=['curved','arc','s-curve','wave'].includes(presetId)?'curved':['elbow','zigzag','bracket'].includes(presetId)?'polyline':'straight';
  const nativeSettings:DrawLineSettings={stroke,strokeWidth,lineStyle,startHead,endHead,pathMode:mode,presetId};
  const nativeSvg=nativePresetSvg(nativeSettings);""")
change('AdminLinesPage.tsx',"    if (!file || !svg || !name.trim()) return;","""    if (!name.trim() || (kind==='svg'&&(!file||!svg))) return;
    const content=kind==='native'?nativeSvg:svg;
    const source=kind==='native'?new File([content],`${name.trim().replace(/[^a-z0-9_-]+/gi,'-')||'line'}.svg`,{type:'image/svg+xml'}):file;
    if(!source)return;""")
change('AdminLinesPage.tsx',"renderSvg: svg, sourceType: 'svg'","renderSvg: content, sourceType: 'svg'")
change('AdminLinesPage.tsx',"active: true, featured: false }, file);","active: true, featured: false }, source);")
change('AdminLinesPage.tsx',"    if (!candidate) return;","    if (!candidate) return;\n    setKind('svg');")
change('AdminLinesPage.tsx',"<h2>افزودن نمونه جدید</h2><p>فایل برداری مستقل و سبک با نمای قابل تشخیص در کارت انتخاب کنید.</p><label className=\"admin-lines-file\">{svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : <span>+ انتخاب فایل SVG</span>}<input type=\"file\" accept=\".svg,image/svg+xml\" onChange={event => void choose(event)} /></label>","""<h2>افزودن خط جدید</h2><p>الگوی بومی با گره‌های قابل‌ویرایش بساز یا یک SVG مستقل آپلود کن.</p>
      <div className="admin-native-tabs"><button type="button" className={kind==='native'?'active':''} onClick={()=>setKind('native')}>الگوی قابل‌ویرایش</button><button type="button" className={kind==='svg'?'active':''} onClick={()=>setKind('svg')}>آپلود SVG</button></div>
      {kind==='native'?<div className="admin-native-form">
        <div className="admin-native-preview" aria-label="پیش‌نمایش خط" dangerouslySetInnerHTML={{__html:nativeSvg}}/>
        <label>نوع خط<select value={presetId} onChange={event=>setPresetId(event.target.value)}>{[['straight','مستقیم'],['arrow','فلش'],['double','فلش دوطرفه'],['curved','منحنی'],['arc','کمان'],['s-curve','منحنی S'],['elbow','زاویه‌دار'],['wave','موجی'],['zigzag','زیگزاگ'],['bracket','براکت'],['inhibition','مهاری'],['dashed','خط‌چین'],['dotted','نقطه‌چین']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <div className="admin-native-pair"><label>رنگ<input type="color" value={stroke} onChange={event=>setStroke(event.target.value)}/></label><label>ضخامت<input type="number" min="0.5" max="40" step="0.5" value={strokeWidth} onChange={event=>setStrokeWidth(Math.max(.5,Math.min(40,Number(event.target.value)||.5)))}/></label></div>
        <label>نوع خط<select value={lineStyle} onChange={event=>setLineStyle(event.target.value as DrawLineSettings['lineStyle'])}><option value="solid">پیوسته</option><option value="dashed">خط‌چین</option><option value="dotted">نقطه‌چین</option></select></label>
        <div className="admin-native-pair">{(['start','end'] as const).map(side=><label key={side}>{side==='start'?'ابتدا':'انتها'}<select value={side==='start'?startHead:endHead} onChange={event=>(side==='start'?setStartHead:setEndHead)(event.target.value as DrawLineSettings['startHead'])}>{[['none','بدون سر'],['arrow','فلش'],['circle','دایره'],['bar','مهاری'],['diamond','لوزی']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>)}</div>
      </div>:<label className="admin-lines-file">{svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : <span>+ انتخاب فایل SVG</span>}<input type="file" accept=".svg,image/svg+xml" onChange={event => void choose(event)} /></label>}""")
change('AdminLinesPage.tsx',"disabled={busy || !file || !name.trim()}","disabled={busy || !name.trim() || (kind==='svg'&&!file)}")
change('AdminLinesPage.tsx',"<p className=\"admin-lines-note\">برای تغییر اطلاعات و تصویر نمونه‌های منتشرشده، از «مدیریت کتابخانه» استفاده کن؛ دستهٔ Lines & Arrows را انتخاب کن.</p>","<p className=\"admin-lines-note\">الگوهای قابل‌ویرایش با نقاط کنترلی روی بوم رسم می‌شوند. SVGهای معمولی به‌صورت یک شیء برداری باقی می‌مانند. برای ویرایش نام و تصویر، دستهٔ Lines & Arrows را در مدیریت کتابخانه باز کن.</p>")

print('Contextual controls and native preset admin integration complete.')
