"""Apply anchored multi-node path/editor/admin integration once; fail before committing if sources drift."""
from pathlib import Path


def change(name, old, new):
    path = Path('src') / name
    text = path.read_text(encoding='utf-8')
    if text.count(old) != 1:
        raise RuntimeError(f'{name}: anchor count {text.count(old)} instead of one: {old[:100]!r}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('Updated', name)


def section(name, start, stop, replacement):
    path = Path('src') / name
    text = path.read_text(encoding='utf-8')
    if text.count(start) != 1 or text.count(stop) != 1:
        raise RuntimeError(f'{name}: section anchors are ambiguous: {start[:80]}')
    a = text.index(start)
    b = text.index(stop, a)
    path.write_text(text[:a] + replacement + text[b:], encoding='utf-8')
    print('Replaced section in', name)


change('EditorStudio.tsx',
    "import { createDrawnLine, updateLineEndpoint, type DrawLineSettings } from './lineGeometry';",
    "import { createDrawnLine, insertLineNode, removeLineNode, updateLineNode, worldLineNodes, lineSvgBody, type DrawLineSettings } from './lineGeometry';\nimport type { ScientificAsset } from './assets';")
change('EditorStudio.tsx',
    "  const selectedObjects=renderObjects.filter(object=>selected.has(object.id));",
    "  const selectedObjects=renderObjects.filter(object=>selected.has(object.id));\n  const selectedLine=selectedObjects.length===1&&selectedObjects[0].type==='arrow'&&selectedObjects[0].startPoint&&selectedObjects[0].endPoint?selectedObjects[0]:null;\n  const selectedLineNodes=selectedLine?worldLineNodes(selectedLine):[];\n  const previewLine=linePreview&&lineTool?createDrawnLine({x:linePreview.sx,y:linePreview.sy},{x:linePreview.ex,y:linePreview.ey},lineTool):null;")
change('EditorStudio.tsx',
    "  useEffect(()=>{const activate=(event:Event)=>{setLineTool((event as CustomEvent<DrawLineSettings>).detail);setSelected(new Set());setAssetEditOpen(false);setPanel('lines');setLibraryCollapsed(false);};window.addEventListener('bioplot:activate-line',activate);return()=>window.removeEventListener('bioplot:activate-line',activate);},[]);",
    """  useEffect(()=>{
    const activate=(event:Event)=>{setLineTool((event as CustomEvent<DrawLineSettings>).detail);setSelected(new Set());setAssetEditOpen(false);setPanel('lines');setLibraryCollapsed(false);};
    const insert=(event:Event)=>{
      const asset=(event as CustomEvent<ScientificAsset>).detail;
      if(!asset?.svg)return;
      const object=assetToObject(asset);
      storeRef.current.dispatch(new AddObjectsCommand('Add library line',[object]));
      setSelected(new Set([object.id]));setAssetEditOpen(false);setPanel('lines');setInspectorCollapsed(false);setInspectorTab('properties');
    };
    window.addEventListener('bioplot:activate-line',activate);
    window.addEventListener('bioplot:insert-line-asset',insert);
    return()=>{window.removeEventListener('bioplot:activate-line',activate);window.removeEventListener('bioplot:insert-line-asset',insert);};
  },[]);""")
change('EditorStudio.tsx',
    "function addObject(object:BioPlotObject){storeRef.current.dispatch(new AddObjectsCommand('Add object',[object]));setSelected(new Set([object.id]));setAssetEditOpen(object.type==='asset');if(object.type==='asset')setLibraryCollapsed(false);setInspectorTab('properties');}",
    "function addObject(object:BioPlotObject){storeRef.current.dispatch(new AddObjectsCommand('Add object',[object]));setSelected(new Set([object.id]));setAssetEditOpen(object.type==='asset');if(object.type==='asset')setLibraryCollapsed(false);setInspectorTab('properties');if(object.type==='arrow')setInspectorCollapsed(false);}")
change('EditorStudio.tsx',
    "function beginMove(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject){if(!event.shiftKey){setAssetEditOpen(object.type==='asset');",
    "function beginMove(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject){if(!event.shiftKey){if(object.type==='arrow'){setInspectorCollapsed(false);setInspectorTab('properties');}setAssetEditOpen(object.type==='asset');")
change('EditorStudio.tsx',
    "  function openTool(tool:Panel){setAssetEditOpen(false);setPanel(tool);setLibraryCollapsed(false);}",
    "  function openTool(tool:Panel){setLineTool(null);setLinePreview(null);setAssetEditOpen(false);setPanel(tool);setLibraryCollapsed(false);}")
change('EditorStudio.tsx',
    "          {['elements','text','lines','shapes'].includes(panel)&&<Elements fa={fa} addObject={addObject} group={panel}/>} ",
    "          {['elements','text','shapes'].includes(panel)&&<Elements fa={fa} addObject={addObject} group={panel}/>} ")

section('EditorStudio.tsx',
    "  function beginLineEndpoint(event:ReactPointerEvent,which:'start'|'end'){",
    '  function beginMarquee(event:ReactPointerEvent<HTMLDivElement>){',
    """  function beginLineNode(event:ReactPointerEvent,index:number){
    if(event.button!==0)return;
    event.preventDefault();event.stopPropagation();
    const line=selectedLine;
    if(!line||line.locked||!artboardRef.current)return;
    const before=[structuredClone(line)];
    const rect=artboardRef.current.getBoundingClientRect();
    let changed=false;
    const move=(pointer:PointerEvent)=>{
      const point={x:Math.max(0,Math.min(page.width,(pointer.clientX-rect.left)/zoom)),y:Math.max(0,Math.min(page.height,(pointer.clientY-rect.top)/zoom))};
      storeRef.current.preview([updateLineNode(line,index,point)]);changed=true;
    };
    const up=()=>{
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);
      if(!changed)return;
      const after=activePage(storeRef.current.snapshot).objects.find(item=>item.id===line.id);
      if(after)storeRef.current.commitObjectState(before,[structuredClone(after)],'Move line node');
    };
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up,{once:true});
  }
  function addLineMidpoint(event:React.MouseEvent,index:number){
    event.preventDefault();event.stopPropagation();
    if(!selectedLine||selectedLine.locked)return;
    const after=insertLineNode(selectedLine,index);
    if(after!==selectedLine)storeRef.current.dispatch(new ObjectStateCommand('Add line node',[structuredClone(selectedLine)],[after]));
  }
  function deleteLineNode(event:React.MouseEvent,index:number){
    event.preventDefault();event.stopPropagation();
    if(!selectedLine||selectedLine.locked)return;
    const after=removeLineNode(selectedLine,index);
    if(after!==selectedLine)storeRef.current.dispatch(new ObjectStateCommand('Remove line node',[structuredClone(selectedLine)],[after]));
  }
""")

# Replace the old two endpoint-only handles with every node and a midpoint insertion handle.
path=Path('src/EditorStudio.tsx');text=path.read_text(encoding='utf-8')
a="{selectedObjects.length===1&&selectedObjects[0].type==='arrow'&&"
b="onPointerDown={event=>beginLineEndpoint(event,which)}/>) }"
# Whitespace of the original JSX is compact; verify the exact ending before cutting.
b="onPointerDown={event=>beginLineEndpoint(event,which)}/>) }" if b in text else "onPointerDown={event=>beginLineEndpoint(event,which)}/>) }".replace(') }',')}' )
if text.count(a)!=1 or text.count(b)!=1: raise RuntimeError('Endpoint JSX anchors drifted')
i=text.index(a);j=text.index(b,i)+len(b)
replacement="""{selectedLine&&selectedLineNodes.map((point,index)=><button key={`node-${index}`} type="button" className="bp-line-node" aria-label={index===0?'Drag line start':index===selectedLineNodes.length-1?'Drag line end':`Drag node ${index+1}; double-click to remove`} title={index===0?'Drag start':index===selectedLineNodes.length-1?'Drag end':'Drag node · Double-click to remove'} style={{left:point.x-bounds.x,top:point.y-bounds.y}} onPointerDown={event=>beginLineNode(event,index)} onDoubleClick={event=>deleteLineNode(event,index)}/>)}{selectedLine&&selectedLineNodes.slice(0,-1).map((point,index)=><button key={`insert-${index}`} type="button" className="bp-line-add-node" title={fa?'افزودن گره':'Add node'} aria-label={fa?'افزودن گره':'Add node'} style={{left:(point.x+selectedLineNodes[index+1].x)/2-bounds.x,top:(point.y+selectedLineNodes[index+1].y)/2-bounds.y}} onClick={event=>addLineMidpoint(event,index)}>+</button>)}"""
path.write_text(text[:i]+replacement+text[j:],encoding='utf-8');print('Replaced old endpoint handles')

change('EditorStudio.tsx',
    '<line x1={linePreview.sx} y1={linePreview.sy} x2={linePreview.ex} y2={linePreview.ey} stroke={lineTool?.stroke||\'#087f79\'} strokeWidth={lineTool?.strokeWidth||2} strokeDasharray="5 4"/>',
    '<g opacity="0.7" transform={`translate(${previewLine?.x??0} ${previewLine?.y??0})`} dangerouslySetInnerHTML={{__html:previewLine?lineSvgBody(previewLine):\'\'}}/>')

# A path is always drawn with the very same SVG body in canvas and export.
change('lineGeometry.ts',
    '  const translate = `translate(${fmt(asset.x * -1)} ${fmt(asset.y * -1)})`;',
    '  const translate = `translate(${fmt(asset.x)} ${fmt(asset.y)})`;')

print('Native path integration applied. Build and typecheck must pass before publishing.')
