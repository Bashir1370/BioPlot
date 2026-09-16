import { describe, expect, it } from 'vitest';
import { createDrawnLine, insertLineNode, lineSvgBody, removeLineNode, updateLineNode, worldLineNodes } from './lineGeometry';
import { createBlankDocument } from './model';
import { documentToSvg } from './export';

const config = { stroke:'#087f79', strokeWidth:2, lineStyle:'solid' as const, startHead:'none' as const, endHead:'arrow' as const };

describe('native editable vector paths', () => {
  it('draws a curved path through three nodes, scales geometry, and uses cubic SVG', () => {
    const line = createDrawnLine({x:70,y:80},{x:260,y:130},{...config,pathMode:'curved',presetId:'curved'});
    expect(worldLineNodes(line)).toHaveLength(3);
    expect(lineSvgBody(line)).toContain('C');
    const first = worldLineNodes(line)[0];
    line.width *= 2;
    expect(worldLineNodes(line)[0].x).not.toBe(first.x);
  });
  it('adds, moves and removes interior nodes without moving endpoints or changing object ID', () => {
    const line = createDrawnLine({x:10,y:20},{x:210,y:20},{...config,pathMode:'straight'});
    const added = insertLineNode(line,0);
    expect(added.id).toBe(line.id);
    expect(worldLineNodes(added)).toHaveLength(3);
    const updated = updateLineNode(added,1,{x:110,y:100});
    const nodes = worldLineNodes(updated);
    expect(nodes[0].x).toBeCloseTo(10);
    expect(nodes[1].y).toBeCloseTo(100);
    expect(nodes[2].x).toBeCloseTo(210);
    const removed = removeLineNode(updated,1);
    expect(worldLineNodes(removed)).toHaveLength(2);
    expect(removeLineNode(removed,0)).toBe(removed);
  });
  it('keeps caps, dash spacing and smooth path in exported SVG', () => {
    const line = createDrawnLine({x:35,y:45},{x:240,y:110},{...config,pathMode:'curved',presetId:'s-curve',startHead:'circle',endHead:'bar',lineStyle:'dashed'});
    line.dashLength=17;
    const doc=createBlankDocument();
    doc.pages[0].objects.push(line);
    const svg=documentToSvg(doc);
    expect(svg).toContain('stroke-dasharray="17 11.9"');
    expect(svg).toContain('<circle');
    expect(svg).toContain('C');
    expect(svg).toContain('stroke-width="2"');
  });
});
