import { defaultPlotSpec, makeId, PlotObject, PlotSpec } from './model';

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char));

export function createPlotObject(kind: PlotSpec['kind'] = 'bar', x = 340, y = 260): PlotObject {
  const spec = defaultPlotSpec();
  spec.kind = kind;
  return {
    id: makeId(),
    type: 'plot',
    name: kind === 'bar' ? 'Bar plot' : 'Scatter plot',
    x,
    y,
    width: 320,
    height: 220,
    rotation: 0,
    opacity: 1,
    spec
  };
}

export function csvToPlotSpec(csv: string, kind: PlotSpec['kind'] = 'bar'): PlotSpec {
  const rows = csv.trim().split(/\r?\n/).map(row => row.split(',').map(cell => cell.trim()));
  if (rows.length < 2 || rows[0].length < 2) throw new Error('CSV needs a label column and at least one numeric series.');
  const headers = rows[0];
  const series = headers.slice(1).map((name, seriesIndex) => ({
    id: makeId('series'),
    name: name || `Series ${seriesIndex + 1}`,
    color: ['#0b7a75', '#316f9d', '#c97842', '#6c5aa8'][seriesIndex % 4],
    values: rows.slice(1).map((row, rowIndex) => ({
      x: rowIndex,
      y: Number(row[seriesIndex + 1]) || 0,
      label: row[0] || `${rowIndex + 1}`
    }))
  }));
  return { kind, title: 'Imported data', xLabel: headers[0] || 'Group', yLabel: 'Value', series, showLegend: series.length > 1, showGrid: true };
}

export function plotToSvg(spec: PlotSpec, width: number, height: number): string {
  const pad = { left: 48, right: 20, top: 34, bottom: 44 };
  const innerW = Math.max(10, width - pad.left - pad.right);
  const innerH = Math.max(10, height - pad.top - pad.bottom);
  const all = spec.series.flatMap(series => series.values);
  const maxY = Math.max(1, ...all.map(point => point.y));
  const xCount = Math.max(1, ...spec.series.map(series => series.values.length));
  const grid = spec.showGrid ? [0.25, 0.5, 0.75, 1].map(f => `<line x1="${pad.left}" y1="${pad.top + innerH * (1 - f)}" x2="${pad.left + innerW}" y2="${pad.top + innerH * (1 - f)}" stroke="#e5ecef" stroke-width="1"/>`).join('') : '';
  let marks = '';
  if (spec.kind === 'bar') {
    const seriesCount = Math.max(1, spec.series.length);
    const groupW = innerW / xCount;
    const barW = Math.max(4, groupW * 0.72 / seriesCount);
    spec.series.forEach((series, seriesIndex) => {
      series.values.forEach((point, index) => {
        const h = (point.y / maxY) * innerH;
        const x = pad.left + index * groupW + groupW * 0.14 + seriesIndex * barW;
        const y = pad.top + innerH - h;
        marks += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" fill="${series.color}"/>`;
        if (seriesIndex === 0) marks += `<text x="${pad.left + index * groupW + groupW / 2}" y="${height - 24}" text-anchor="middle" font-size="9" fill="#6f8089">${esc(point.label ?? String(index + 1))}</text>`;
      });
    });
  } else {
    spec.series.forEach(series => {
      series.values.forEach(point => {
        const x = pad.left + (point.x / Math.max(1, xCount - 1)) * innerW;
        const y = pad.top + innerH - (point.y / maxY) * innerH;
        marks += `<circle cx="${x}" cy="${y}" r="4" fill="${series.color}"/>`;
      });
    });
  }
  const legend = spec.showLegend ? spec.series.map((series, index) => `<g transform="translate(${pad.left + index * 90},18)"><circle cx="0" cy="0" r="4" fill="${series.color}"/><text x="8" y="3" font-size="9" fill="#516670">${esc(series.name)}</text></g>`).join('') : '';
  return `<g class="bioplot-plot"><rect width="${width}" height="${height}" rx="8" fill="#fff" stroke="#cfdae0"/>${grid}<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + innerH}" stroke="#70818a"/><line x1="${pad.left}" y1="${pad.top + innerH}" x2="${pad.left + innerW}" y2="${pad.top + innerH}" stroke="#70818a"/>${marks}<text x="${width / 2}" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#263c48">${esc(spec.title)}</text><text x="${width / 2}" y="${height - 6}" text-anchor="middle" font-size="9" fill="#6f8089">${esc(spec.xLabel)}</text><text transform="translate(12 ${height / 2}) rotate(-90)" text-anchor="middle" font-size="9" fill="#6f8089">${esc(spec.yLabel)}</text>${legend}</g>`;
}
