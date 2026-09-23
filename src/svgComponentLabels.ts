export interface SvgComponentRow {
  element: Element;
  name: string;
  kind: string;
  number: number;
  parents: Element[];
  children: number;
  color?: string;
  selected: boolean;
}

/** File IDs remain untouched: gradients/use references must survive display renaming. */
export function describeSvgComponents(elements: Element[], selected: Element[]): SvgComponentRow[] {
  const counts = new Map<string, number>();
  const known = new Set(elements);
  return elements.map(element => {
    const kind = element.localName;
    const number = (counts.get(kind) ?? 0) + 1;
    counts.set(kind, number);
    const parents: Element[] = [];
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (known.has(parent)) parents.unshift(parent);
    }
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    const paint = style?.fill === 'none' ? style.stroke : style?.fill;
    const color = paint && /^(#[\da-f]{3,8}|rgba?\([\d\s.,%/]+\)|[a-z]+)$/i.test(paint) && paint !== 'none' ? paint : undefined;
    const title = Array.from(element.children).find(child => child.localName === 'title')?.textContent?.trim();
    return {
      element, kind, number, parents, color,
      name: element.getAttribute('aria-label')?.trim() || element.getAttribute('inkscape:label')?.trim() || title || '',
      children: elements.filter(child => child !== element && child.parentElement === element).length,
      selected: selected.includes(element),
    };
  });
}

export function svgComponentName(row: SvgComponentRow, fa: boolean): string {
  if (row.name) return row.name;
  const types: Record<string, [string, string]> = {
    g: ['Group', 'گروه'], path: ['Shape', 'شکل'], rect: ['Rectangle', 'مستطیل'],
    circle: ['Circle', 'دایره'], ellipse: ['Ellipse', 'بیضی'], polygon: ['Polygon', 'چندضلعی'],
    polyline: ['Line', 'خط'], line: ['Line', 'خط'], text: ['Text', 'متن'],
    image: ['Image', 'تصویر'], use: ['Symbol', 'نماد'],
  };
  const label = (types[row.kind] ?? ['Shape', 'شکل'])[fa ? 1 : 0];
  return `${label} ${row.number.toLocaleString(fa ? 'fa-IR' : 'en-US')}`;
}
