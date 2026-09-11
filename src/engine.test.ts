import { describe, expect, it } from 'vitest';
import { AddObjectsCommand, BioPlotStore, ObjectStateCommand, rotateObjects, selectionBounds } from './engine';
import { activePage, createBlankDocument, makeId, ShapeObject } from './model';

const shape = (x: number, y: number): ShapeObject => ({
  id: makeId(), type: 'shape', name: 'Shape', shape: 'rect', x, y, width: 100, height: 60,
  rotation: 0, opacity: 1, fill: '#fff', stroke: '#000', strokeWidth: 1, radius: 4
});

describe('BioPlot editor engine', () => {
  it('rotates a multi-object selection around the group center', () => {
    const a = shape(100, 100);
    const b = shape(300, 100);
    const before = selectionBounds([a, b]);
    const rotated = rotateObjects([a, b], 90);
    const after = selectionBounds(rotated);
    expect(before?.cx).toBeCloseTo(after?.cx ?? 0, 6);
    expect(before?.cy).toBeCloseTo(after?.cy ?? 0, 6);
    expect(rotated[0].x).not.toBe(a.x);
    expect(rotated[1].x).not.toBe(b.x);
    expect(rotated.every(item => item.rotation === 90)).toBe(true);
  });

  it('undoes and redoes object commands without DOM snapshots', () => {
    const document = createBlankDocument();
    activePage(document).objects = [];
    const store = new BioPlotStore(document);
    const object = shape(20, 30);
    store.dispatch(new AddObjectsCommand('Add', [object]));
    expect(activePage(store.snapshot).objects).toHaveLength(1);
    store.undo();
    expect(activePage(store.snapshot).objects).toHaveLength(0);
    store.redo();
    expect(activePage(store.snapshot).objects).toHaveLength(1);
  });

  it('records property edits as reversible object-state commands', () => {
    const document = createBlankDocument();
    const object = shape(20, 30);
    activePage(document).objects = [object];
    const store = new BioPlotStore(document);
    const changed = { ...object, opacity: 0.35 };
    store.dispatch(new ObjectStateCommand('Opacity', [object], [changed]));
    expect(activePage(store.snapshot).objects[0].opacity).toBe(0.35);
    store.undo();
    expect(activePage(store.snapshot).objects[0].opacity).toBe(1);
  });
});
