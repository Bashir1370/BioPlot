import { ArrowObject, ConnectorObject, ContainerObject, ImageObject, LabelObject, makeId, ShapeObject, TextObject } from './model';

export function makeText(x = 360, y = 270): TextObject {
  return { id: makeId(), type: 'text', name: 'Scientific text', text: 'Scientific annotation', x, y, width: 220, height: 42, rotation: 0, opacity: 1, color: '#17303f', fontSize: 16, fontWeight: 700, fontStyle: 'normal', align: 'center' };
}

export function makePanelLabel(x = 90, y = 90, text = 'A'): LabelObject {
  return { id: makeId(), type: 'label', name: `Panel ${text}`, text, variant: 'panel', x, y, width: 42, height: 42, rotation: 0, opacity: 1, color: '#17303f', background: '#ffffff', borderColor: '#cfdce1', fontSize: 18, fontWeight: 800, align: 'center' };
}

export function makeTagLabel(x = 360, y = 270): LabelObject {
  return { id: makeId(), type: 'label', name: 'Scientific label', text: 'Label', variant: 'tag', x, y, width: 110, height: 34, rotation: 0, opacity: 1, color: '#0b6d69', background: '#eaf7f5', borderColor: '#b9dfda', fontSize: 13, fontWeight: 700, align: 'center' };
}

export function makeShape(shape: ShapeObject['shape'] = 'rect', x = 390, y = 280): ShapeObject {
  return { id: makeId(), type: 'shape', name: shape === 'ellipse' ? 'Ellipse' : 'Rectangle', shape, x, y, width: 150, height: 90, rotation: 0, opacity: 1, fill: '#dff2ef', stroke: '#4c9993', strokeWidth: 2, lineStyle: 'solid', radius: 12 };
}

export function makeArrow(x = 390, y = 300): ArrowObject {
  return { id: makeId(), type: 'arrow', name: 'Arrow', x, y, width: 140, height: 32, rotation: 0, opacity: 1, stroke: '#607986', strokeWidth: 3, lineStyle: 'solid', arrowHead: 'end' };
}

export function makeConnector(route: ConnectorObject['route'] = 'straight', x = 390, y = 300): ConnectorObject {
  return { id: makeId(), type: 'connector', name: `${route[0].toUpperCase()}${route.slice(1)} connector`, x, y, width: 170, height: route === 'straight' ? 40 : 90, rotation: 0, opacity: 1, stroke: '#526e7a', strokeWidth: 2.5, lineStyle: 'solid', route, arrowHead: 'end' };
}

export function makeContainer(x = 320, y = 220): ContainerObject {
  return { id: makeId(), type: 'container', name: 'Scientific container', x, y, width: 320, height: 220, rotation: 0, opacity: 1, fill: '#f8fbfb', stroke: '#bfcfd5', strokeWidth: 1.5, radius: 18, padding: 20 };
}

export function makeImage(src: string, name = 'Image', x = 340, y = 230): ImageObject {
  return { id: makeId(), type: 'image', name, src, alt: name, fit: 'contain', x, y, width: 280, height: 200, rotation: 0, opacity: 1 };
}
