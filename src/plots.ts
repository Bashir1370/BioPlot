import { defaultPlotSpec, makeId, PlotObject, PlotSpec } from './model';

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char));

export function createPlotObject(kind: PlotSpec['kind'] = 'bar', x = 340, y = 260): PlotObject {
  const spec = defaultPlotSpec();
  spec.kind = kind;
  return { id: makeId(), type: 'plot', name: kind === 'bar' ? 'Bar plot' : 'Scatter plot', x, y, width: 320, height: 220, rotation: 0, opacity: 1, spec };
}

// Quoted labels, escaped quotes and embedded newlines are valid CSV cells.
function csvRows(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  const endRow = () => { row.push(cell.trim()); if (row.some(value => value !== '')) rows.push(row); row = []; cell = ''; };
  const csv = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || cell.trim() === '') quoted = !quoted;
      else throw new Error('Invalid CSV quoting.');
    } else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if (char === '\n' && !quoted) endRow();
    else cell += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote.');
  endRow();
  return rows;
}

export function csvToPlotSpec(csv: string, kind: PlotSpec['kind'] = 'bar'): PlotSpec {
  const rows = csvRows(csv);
  if (rows.length < 2 || rows[0].length < 2) throw new Error('CSV needs a label column and at least one numeric series.');
  const [headers, ...data] = rows;
  data.forEach((row, index) => { if (row.length !== headers.length) throw new Error(`CSV row ${index + 2} has the wrong number of columns.`); });
  const numeric = (value: string, row: number, column: number) => {
    const number = Number(value);
    if (!value || !Number.isFinite(number)) throw new Error(`Invalid number at CSV row ${row + 2}, column ${column + 1}.`);
    return number;
  };
  const series = headers.slice(1).map((name, seriesIndex) => ({
    id: makeId('series'), name: name || `Series ${seriesIndex + 1}`,
    color: ['#0b7a75', '#316f9d', '#c97842', '#6c5aa8'][seriesIndex % 4],
    values: data.map((row, rowIndex) => ({
      x: kind === 'scatter' ? numeric(row[0], rowIndex, 0) : rowIndex,
      y: numeric(row[seriesIndex + 1], rowIndex, seriesIndex + 1),
      label: row[0] || `${rowIndex + 1}`,
    })),
  }));
  return { kind, title: 'Imported data', xLabel: headers[0] || 'Group', yLabel: 'Value', series, showLegend: series.length > 1, showGrid: true };
}

export function plotToSvg(spec: PlotSpec, width: number, height: number): string {
  const pad = { left: 48, right: 20, top: spec.showLegend ? 48 : 34, bottom: 44 };
  const innerW = Math.max(10, width - pad.left - pad.right), innerH = Math.max(10, height - pad.top - pad.bottom);
  const all = spec.series.flatMap(series => series.values);
  if (all.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) throw new Error('Plot coordinates must be finite numbers.');
  let minY = Math.min(0, ...all.map(point => point.y)), maxY = Math.max(0, ...all.map(point => point.y));
  if (minY === maxY) maxY = minY + 1;
  let minX = Math.min(...all.map(point => point.x)), maxX = Math.max(...all.map(point => point.x));
  if (!all.length) { minX = 0; maxX = 1; }
  else if (minX === maxX) { minX -= .5; maxX += .5; }
  const yPosition = (value: number) => pad.top + (maxY - value) / (maxY - minY) * innerH;
  const baseline = yPosition(0), xCount = Math.max(1, ...spec.series.map(series => series.values.length));
  const grid = spec.showGrid ? [0, .25, .5, .75, 1].map(f => {
    const y = pad.top + innerH * (1 - f), value = minY + (maxY - minY) * f;
    return `<line x1="${pad.left}" y1="${y}" x2="${pad.left + innerW}" y2="${y}" stroke="#e5ecef"/><text x="${pad.left - 5}" y="${y + 3}" text-anchor="end" font-size="9" fill="#6f8089">${Number(value.toPrecision(4))}</text>`;
  }).join('') : '';
  let marks = '';
  if (spec.kind === 'bar') {
    const seriesCount = Math.max(1, spec.series.length), groupW = innerW / xCount, barW = groupW * .72 / seriesCount;
    spec.series.forEach((series, seriesIndex) => series.values.forEach((point, index) => {
      const top = yPosition(point.y), x = pad.left + index * groupW + groupW * .14 + seriesIndex * barW;
      marks += `<rect x="${x}" y="${Math.min(top, baseline)}" width="${barW}" height="${Math.abs(baseline - top)}" rx="2" fill="${esc(series.color)}"/>`;
      if (seriesIndex === 0) marks += `<text x="${pad.left + index * groupW + groupW / 2}" y="${height - 24}" text-anchor="middle" font-size="9" fill="#6f8089">${esc(point.label ?? String(index + 1))}</text>`;
    }));
  } else {
    spec.series.forEach(series => series.values.forEach(point => {
      const x = pad.left + (point.x - minX) / (maxX - minX) * innerW;
      marks += `<circle cx="${x}" cy="${yPosition(point.y)}" r="4" fill="${esc(series.color)}"/>`;
    }));
    marks += [0, .5, 1].map(f => `<text x="${pad.left + f * innerW}" y="${height - 24}" text-anchor="middle" font-size="9" fill="#6f8089">${Number((minX + f * (maxX - minX)).toPrecision(4))}</text>`).join('');
  }
  const legend = spec.showLegend ? spec.series.map((series, index) => `<g transform="translate(${pad.left + index * 90},32)"><circle r="4" fill="${esc(series.color)}"/><text x="8" y="3" font-size="9" fill="#516670">${esc(series.name)}</text></g>`).join('') : '';
  return `<g class="bioplot-plot"><rect width="${width}" height="${height}" rx="8" fill="#fff" stroke="#cfdae0"/>${grid}<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + innerH}" stroke="#70818a"/><line x1="${pad.left}" y1="${baseline}" x2="${pad.left + innerW}" y2="${baseline}" stroke="#70818a"/>${marks}<text x="${width / 2}" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="#263c48">${esc(spec.title)}</text><text x="${width / 2}" y="${height - 6}" text-anchor="middle" font-size="9" fill="#6f8089">${esc(spec.xLabel)}</text><text transform="translate(12 ${height / 2}) rotate(-90)" text-anchor="middle" font-size="9" fill="#6f8089">${esc(spec.yLabel)}</text>${legend}</g>`;
}
