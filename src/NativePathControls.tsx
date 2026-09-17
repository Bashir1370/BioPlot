import type { ArrowObject, BioPlotObject, LineCap, LineStyle } from './model';
import { insertLineNode, lineCapPreviewSvg, lineFromWorldNodes, removeLineNode, worldLineNodes, type DrawLineSettings, type PathMode } from './lineGeometry';
import './native-path-controls.css';

type Commit = (label: string, transform: (object: BioPlotObject) => BioPlotObject) => void;
const caps: Array<{ value: LineCap; en: string; fa: string }> = [
  { value:'none',en:'None',fa:'بدون سر' },
  { value:'arrow',en:'Filled arrow',fa:'پیکان توپر' },
  { value:'open-arrow',en:'Open arrow',fa:'پیکان توخالی' },
  { value:'slim-arrow',en:'Narrow arrow',fa:'پیکان باریک' },
  { value:'triangle',en:'Triangle',fa:'مثلثی' },
  { value:'stealth',en:'Stealth arrow',fa:'پیکان فرورفته' },
  { value:'chevron',en:'Double chevron',fa:'دوشاخه' },
  { value:'double-arrow',en:'Double arrow',fa:'دو پیکان' },
  { value:'circle',en:'Open circle',fa:'دایره توخالی' },
  { value:'filled-circle',en:'Filled circle',fa:'دایره توپر' },
  { value:'bar',en:'Inhibition bar',fa:'خط مهاری' },
  { value:'diamond',en:'Diamond',fa:'لوزی' },
  { value:'square',en:'Square',fa:'مربع' },
];

export function NativePathControls({ fa, line, onCommit }: { fa: boolean; line: ArrowObject; onCommit: Commit }) {
  const change = (patch: Partial<ArrowObject>, label: string) => onCommit(label, object => object.id === line.id && object.type === 'arrow' && !object.locked ? { ...object, ...patch } : object);
  const points = worldLineNodes(line);
  const switchMode = (mode: PathMode) => onCommit('Change line route', object => {
    if (object.id !== line.id || object.type !== 'arrow' || object.locked) return object;
    const nodes = worldLineNodes(object);
    let nextNodes = mode === 'straight' ? [nodes[0], nodes[nodes.length-1]] : nodes;
    if (mode === 'curved' && nextNodes.length === 2) {
      const start = nextNodes[0], end = nextNodes[1], dx = end.x-start.x, dy = end.y-start.y;
      const length = Math.max(1, Math.hypot(dx,dy)), bend = Math.min(65,Math.max(22,length*.18));
      nextNodes = [start,{x:(start.x+end.x)/2+dy/length*bend,y:(start.y+end.y)/2-dx/length*bend},end];
    }
    const settings: DrawLineSettings = { stroke:object.stroke,strokeWidth:object.strokeWidth,lineStyle:object.lineStyle??'solid',
      startHead:object.startHead??'none',endHead:object.endHead??'arrow',pathMode:mode };
    return lineFromWorldNodes(nextNodes,settings,object);
  });
  const addNode = () => onCommit('Add line node', object => {
    if(object.id!==line.id||object.type!=='arrow'||object.locked)return object;
    const n=worldLineNodes(object);
    let longest=0, length=-1;
    for(let i=0;i<n.length-1;i++){const distance=Math.hypot(n[i+1].x-n[i].x,n[i+1].y-n[i].y);if(distance>length){length=distance;longest=i;}}
    return insertLineNode(object,longest);
  });
  const removeNode = () => onCommit('Remove line node', object => object.id===line.id&&object.type==='arrow'&&!object.locked?removeLineNode(object,Math.max(1,worldLineNodes(object).length-2)):object);
  const locked = Boolean(line.locked);
  return <div className="bp-path-controls">
    <p className="bp-path-help">{fa?'خط را انتخاب کن، گره‌های آبی را بکش و با + گره جدید اضافه کن.':'Drag the blue nodes on canvas. Click + to insert another point.'}</p>
    <div className="bp-path-palette"><label><span>{fa?'رنگ خط':'Line color'}</span><input aria-label={fa?'رنگ خط':'Line color'} type="color" disabled={locked} value={line.stroke} onChange={event=>change({stroke:event.target.value},'Line color')}/></label><label><span>{fa?'ضخامت (px)':'Width (px)'}</span><input aria-label={fa?'ضخامت خط':'Line width'} type="number" min="0.5" max="40" step="0.5" disabled={locked} value={line.strokeWidth} onChange={event=>change({strokeWidth:Math.max(.5,Math.min(40,Number(event.target.value)||.5))},'Line width')}/></label></div>
    <div className="bp-path-palette"><label><span>{fa?'نوع مسیر':'Line type'}</span><select disabled={locked} value={line.pathMode??'straight'} onChange={event=>switchMode(event.target.value as PathMode)}><option value="straight">{fa?'مستقیم':'Straight'}</option><option value="polyline">{fa?'چندبخشی':'Polyline / Elbow'}</option><option value="curved">{fa?'منحنی Bézier':'Smooth Bézier'}</option></select></label><label><span>{fa?'استایل':'Style'}</span><select disabled={locked} value={line.lineStyle??'solid'} onChange={event=>change({lineStyle:event.target.value as LineStyle},'Line style')}><option value="solid">{fa?'پیوسته':'Solid'}</option><option value="dashed">{fa?'خط‌چین':'Dashed'}</option><option value="dotted">{fa?'نقطه‌چین':'Dotted'}</option></select></label></div>
    {line.lineStyle!=='solid'&&<label className="bp-path-full"><span>{fa?'فاصله خط‌چین':'Dash spacing'}</span><input type="number" min="1" max="80" disabled={locked} value={line.dashLength??9} onChange={event=>change({dashLength:Math.max(1,Math.min(80,Number(event.target.value)||1))},'Dash spacing')}/></label>}
    <div className="bp-path-caps-title"><strong>{fa?'ابتدا و انتهای خط':'Arrowheads'}</strong><button type="button" disabled={locked} onClick={()=>change({startHead:line.endHead??'arrow',endHead:line.startHead??'none'},'Swap line caps')}>{fa?'جابه‌جایی ↔':'Swap ↔'}</button></div>
    <div className="bp-cap-row">{(['startHead','endHead'] as const).map(field=>{
      const side = field==='startHead'?'start':'end';
      const selected = line[field] ?? (side==='start'?'none':'arrow');
      return <div className="bp-cap-field" key={field}>
        <span className="bp-cap-label">{side==='start'?(fa?'ابتدا':'Start'):(fa?'انتها':'End')}</span>
        <details className="bp-cap-picker" name="bp-line-cap-picker">
          <summary aria-label={side==='start'?(fa?'انتخاب شکل ابتدای خط':'Choose start icon'):(fa?'انتخاب شکل انتهای خط':'Choose end icon')} aria-disabled={locked} onClick={event=>{if(locked)event.preventDefault();}}>
            <span className="bp-cap-current" dangerouslySetInnerHTML={{__html:lineCapPreviewSvg(selected,side)}} />
            <span className="bp-cap-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="bp-cap-grid" role="group" aria-label={side==='start'?(fa?'نمادهای ابتدای خط':'Start arrow icons'):(fa?'نمادهای انتهای خط':'End arrow icons')}>
            {caps.map(cap=><button key={cap.value} type="button" className={cap.value===selected?'is-selected':''} aria-pressed={cap.value===selected} aria-label={`${side==='start'?(fa?'ابتدا':'Start'):(fa?'انتها':'End')}: ${fa?cap.fa:cap.en}`} title={fa?cap.fa:cap.en} disabled={locked} onClick={event=>{change({[field]:cap.value},'Line endpoint icon');event.currentTarget.closest('details')?.removeAttribute('open');}}>
              <span className="bp-cap-icon" dangerouslySetInnerHTML={{__html:lineCapPreviewSvg(cap.value,side)}} />
              <small>{fa?cap.fa:cap.en}</small>
            </button>)}
          </div>
        </details>
      </div>;
    })}</div>
    <div className="bp-path-caps-title"><strong>{fa?'ویرایش گره‌ها':'Path nodes'}</strong><span>{points.length}</span></div>
    <div className="bp-path-actions"><button type="button" disabled={locked||points.length>=80} onClick={addNode}>{fa?'+ افزودن گره':'+ Add node'}</button><button type="button" disabled={locked||points.length<=2} onClick={removeNode}>{fa?'حذف گره میانی':'Remove middle node'}</button></div>
    <p className="bp-path-help">{fa?'برای حذف گره میانی روی آن دوبار کلیک کن. تغییرات در خروجی SVG هم حفظ می‌شوند.':'Double-click a middle node to remove it. SVG exports retain editable path geometry.'}</p>
  </div>;
}
