import { describe, expect, it } from 'vitest';
import { alignObjects, distributeObjects, objectBounds, objectsInRect, rectFromPoints, reorderObjects } from './engine';
import { makeConnector, makeContainer, makeImage, makePanelLabel, makeShape, makeText } from './editorObjects';
import { BioPlotDocument, DOCUMENT_SCHEMA_VERSION, migrateDocument } from './model';

describe('Stage 10B-D editor core', () => {
  it('aligns and distributes selections without changing object identity', () => {
    const a = makeShape('rect', 10, 20);
    const b = makeShape('rect', 240, 80);
    const c = makeShape('rect', 510, 160);
    const aligned = alignObjects([a, b, c], 'top');
    expect(new Set(aligned.map(item => objectBounds(item).y)).size).toBe(1);
    const distributed = distributeObjects([a, b, c], 'horizontal');
    const centers = distributed.map(item => objectBounds(item).cx).sort((x, y) => x - y);
    expect(centers[1] - centers[0]).toBeCloseTo(centers[2] - centers[1], 6);
    expect(distributed.map(item => item.id)).toEqual([a.id, b.id, c.id]);
  });

  it('finds objects with marquee selection', () => {
    const a = makeShape('rect', 50, 50);
    const b = makeShape('rect', 500, 400);
    const hits = objectsInRect([a, b], rectFromPoints(0, 0, 260, 220));
    expect(hits.map(item => item.id)).toEqual([a.id]);
  });

  it('supports deterministic z-order actions', () => {
    const a = makeShape('rect');
    const b = makeShape('ellipse');
    const c = makeText();
    expect(reorderObjects([a, b, c], new Set([a.id]), 'front').map(item => item.id)).toEqual([b.id, c.id, a.id]);
    expect(reorderObjects([a, b, c], new Set([c.id]), 'back').map(item => item.id)).toEqual([c.id, a.id, b.id]);
  });

  it('creates typed scientific objects with stable shared transforms', () => {
    const objects = [makeText(), makePanelLabel(), makeConnector('curved'), makeContainer(), makeImage('data:image/png;base64,abc')];
    objects.forEach(object => {
      expect(object.id).toBeTruthy();
      expect(object.width).toBeGreaterThan(0);
      expect(object.height).toBeGreaterThan(0);
      expect(object.opacity).toBe(1);
    });
    expect(objects.map(item => item.type)).toEqual(['text', 'label', 'connector', 'container', 'image']);
  });

  it('migrates v3 documents into v4 without discarding existing objects', () => {
    const legacy = {
      schemaVersion: 3,
      id: 'legacy-doc',
      title: 'Legacy figure',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      activePageId: 'page-1',
      metadata: { locale: 'fa', tags: ['legacy'] },
      pages: [{
        id: 'page-1', name: 'Figure 1', width: 960, height: 620, background: '#fff',
        objects: [{ id: 'txt-1', type: 'text', name: 'Title', x: 10, y: 20, width: 200, height: 40, rotation: 0, opacity: 1, text: 'TRPV1', color: '#000', fontSize: 20, fontWeight: 700, align: 'left' }]
      }]
    };
    const migrated = migrateDocument(legacy) as BioPlotDocument;
    expect(migrated.schemaVersion).toBe(DOCUMENT_SCHEMA_VERSION);
    expect(migrated.metadata.locale).toBe('fa');
    expect(migrated.pages[0].objects).toHaveLength(1);
    expect(migrated.pages[0].objects[0].id).toBe('txt-1');
  });
});
