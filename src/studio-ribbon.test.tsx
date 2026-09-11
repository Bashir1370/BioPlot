import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectionProperties, EditorInspector } from './EditorInspector';
import { EditorStudio, SelectionToolbar } from './EditorStudio';
import { createBlankDocument, type BioPlotObject } from './model';
import { selectionBounds } from './engine';

const shape:BioPlotObject={id:'test-shape',type:'shape',name:'Cell frame',shape:'rect',x:12,y:24,width:150,height:90,rotation:0,opacity:.8,fill:'#123456',stroke:'#345678',strokeWidth:1,radius:4};
// Inspect React output and call the actual control handlers without requiring a browser.
function elements(node:ReactNode):ReactElement<Record<string,any>>[]{
  if(!isValidElement<Record<string,any>>(node))return [];
  return [node,...Children.toArray(node.props.children).flatMap(elements)];
}
function properties(selectedObjects:BioPlotObject[]){
  const callbacks={onBounds:vi.fn(),onCommit:vi.fn(),onLock:vi.fn(),onHide:vi.fn()};
  const tree=SelectionProperties({fa:false,bounds:selectionBounds(selectedObjects),selectedObjects,...callbacks});
  return {nodes:elements(tree),...callbacks};
}
function commands(selectedObjects:BioPlotObject[]){
  return elements(SelectionToolbar({fa:false,selectedObjects,grouped:false,onCopy:vi.fn(),onDuplicate:vi.fn(),onAlign:vi.fn(),onDistribute:vi.fn(),onFront:vi.fn(),onBack:vi.fn(),onGroup:vi.fn(),onUngroup:vi.fn(),onLock:vi.fn(),onDelete:vi.fn()}));
}
afterEach(()=>vi.unstubAllGlobals());
describe('drawing ribbon integration',()=>{
  it('places properties above the workspace and keeps them out of the side inspector',()=>{
    vi.stubGlobal('window',{innerWidth:1440});
    const html=renderToStaticMarkup(createElement(EditorStudio));
    expect(html.indexOf('studio-property-bar')).toBeLessThan(html.indexOf('<main'));
    expect(html.match(/class="studio-property-bar"/g)).toHaveLength(1);
    const side=renderToStaticMarkup(createElement(EditorInspector,{fa:false,tab:'properties',setTab:vi.fn(),documentState:createBlankDocument(),bounds:selectionBounds([shape]),selectedObjects:[shape],objects:[shape],selected:new Set([shape.id]),onBounds:vi.fn(),onCommit:vi.fn(),onLock:vi.fn(),onHide:vi.fn(),onSelect:vi.fn(),onLayerStep:vi.fn(),onLayerReorder:vi.fn(),onToggleObjectLock:vi.fn(),onToggleObjectHidden:vi.fn(),onCollapse:vi.fn()}));
    expect(side).not.toContain('type="number"');
    expect(side).not.toContain('type="range"');
  });
  it('connects X, Y, width and height to the correct geometry commands',()=>{
    const p=properties([shape]);
    const inputs=p.nodes.filter(n=>n.type==='input'&&n.props.type==='number');
    expect(inputs.map(n=>n.props.value)).toEqual([12,24,150,90]);
    inputs.forEach((node,index)=>node.props.onChange({target:{value:String(100+index)}}));
    expect(p.onBounds.mock.calls).toEqual([['x',100],['y',101],['width',102],['height',103]]);
  });
  it('preserves opacity, color, lock and hide callbacks after moving the controls',()=>{
    const p=properties([shape]);
    p.nodes.find(n=>n.props.type==='range')!.props.onChange({target:{value:'55'}});
    expect(p.onCommit.mock.calls[0][1](shape)).toEqual({...shape,opacity:.55});
    p.nodes.find(n=>n.props.type==='color')!.props.onChange({target:{value:'#abcdef'}});
    expect(p.onCommit.mock.calls[1][1](shape)).toEqual({...shape,fill:'#abcdef'});
    const buttons=p.nodes.filter(n=>n.type==='button');
    buttons[0].props.onClick();buttons[1].props.onClick();
    expect(p.onLock).toHaveBeenCalledWith(true);expect(p.onHide).toHaveBeenCalledOnce();
    const locked=properties([{...shape,locked:true}]);
    locked.nodes.find(n=>n.type==='button')!.props.onClick();
    expect(locked.onLock).toHaveBeenCalledWith(false);
  });
  it('disables geometry for an empty or wholly locked selection',()=>{
    for(const selection of [[],[{...shape,locked:true}]]){
      expect(properties(selection).nodes.filter(n=>n.props.type==='number').every(n=>n.props.disabled)).toBe(true);
    }
    expect(properties([]).nodes.filter(n=>n.type==='button'||n.type==='input').every(n=>n.props.disabled)).toBe(true);
  });
  it('enables alignment, distribution and delete only when enough unlocked objects exist',()=>{
    const locked={...shape,id:'locked',locked:true};
    const find=(objects:BioPlotObject[],name:string)=>commands(objects).find(n=>n.props['aria-label']===name)!.props.disabled;
    expect(find([shape,locked],'Align left')).toBe(true);
    expect(find([shape,{...shape,id:'second'}],'Align left')).toBe(false);
    expect(find([shape,{...shape,id:'second'},locked],'Distribute horizontally')).toBe(true);
    expect(find([shape,{...shape,id:'second'},{...shape,id:'third'}],'Distribute horizontally')).toBe(false);
    expect(find([locked],'Delete')).toBe(true);
    expect(find([shape,locked],'Delete')).toBe(false);
  });
});
