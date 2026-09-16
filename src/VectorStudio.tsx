import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAssetCatalog, type ScientificAsset } from './assets';
import { parseNativeLinePreset, type DrawLineSettings } from './lineGeometry';
import { LINE_CATEGORY } from './AdminLinesPage';
import './vector-studio.css';

type Preset = { id: string; fa: string; en: string; path: string; style?: 'dashed' | 'dotted'; head?: 'start' | 'end' | 'both' | 'bar'; extras?: string };
const sections: Array<{ title: string; titleFa: string; presets: Preset[] }> = [
  { title: 'LINES', titleFa: 'خطوط پایه', presets: [
    { id: 'straight', en: 'Straight', fa: 'مستقیم', path: 'M20 100H260' },
    { id: 'horizontal', en: 'Horizontal', fa: 'افقی', path: 'M20 100H260' },
    { id: 'vertical', en: 'Vertical', fa: 'عمودی', path: 'M140 20V180' },
    { id: 'dashed', en: 'Dashed', fa: 'خط‌چین', path: 'M20 100H260', style: 'dashed' },
    { id: 'dotted', en: 'Dotted', fa: 'نقطه‌چین', path: 'M20 100H260', style: 'dotted' },
    { id: 'elbow', en: 'Elbow', fa: 'زاویه‌دار', path: 'M20 65H140V135H260' },
    { id: 'curved', en: 'Curved', fa: 'منحنی', path: 'M20 115Q140 10 260 85' }
  ] },
  { title: 'ARROWS & CONNECTORS', titleFa: 'فلش‌ها و اتصال‌ها', presets: [
    { id: 'arrow', en: 'Arrow', fa: 'فلش', path: 'M20 100H260', head: 'end' },
    { id: 'double', en: 'Double arrow', fa: 'دوطرفه', path: 'M20 100H260', head: 'both' },
    { id: 'activation', en: 'Activation', fa: 'فعال‌سازی', path: 'M20 100H260', head: 'end' },
    { id: 'inhibition', en: 'Inhibition', fa: 'مهاری', path: 'M20 100H260', head: 'bar' },
    { id: 'dimension', en: 'Dimension', fa: 'اندازه‌گذاری', path: 'M20 100H260', head: 'both', extras: '<path d="M20 72V128M260 72V128" />' }
  ] },
  { title: 'SCIENTIFIC PATHS', titleFa: 'مسیرهای علمی', presets: [
    { id: 'arc', en: 'Arc', fa: 'کمان', path: 'M20 145Q140 -25 260 145' },
    { id: 's-curve', en: 'S curve', fa: 'منحنی S', path: 'M20 110C110 0 170 200 260 90', head: 'end' },
    { id: 'wave', en: 'Wave', fa: 'موجی', path: 'M20 100C60 15 100 185 140 100S220 15 260 100' },
    { id: 'zigzag', en: 'Zigzag', fa: 'زیگزاگ', path: 'M20 100L65 65 110 135 155 65 200 135 260 100' },
    { id: 'bracket', en: 'Bracket', fa: 'براکت', path: 'M255 50H45V150H255' }
  ] }
];

function svgFor(preset: Preset, color: string, width: number) {
  const dash = preset.style === 'dashed' ? 'stroke-dasharray="16 12"' : preset.style === 'dotted' ? 'stroke-dasharray="1 14"' : '';
  const heads = `${preset.head === 'start' || preset.head === 'both' ? '<path d="M37 88L20 100 37 112" />' : ''}${preset.head === 'end' || preset.head === 'both' ? '<path d="M243 88L260 100 243 112" />' : ''}${preset.head === 'bar' ? '<path d="M260 75V125" />' : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" role="img"><g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${preset.path}" ${dash}/>${heads}${preset.extras ?? ''}</g></svg>`;
}

function nativeSettings(preset: Preset, stroke: string, strokeWidth: number): DrawLineSettings {
  const id = preset.id;
  const plain = ['straight','horizontal','vertical','dashed','dotted','elbow','curved','arc','wave','zigzag','bracket'].includes(id);
  return {
    stroke, strokeWidth,
    lineStyle: preset.style ?? 'solid',
    startHead: id === 'double' || id === 'dimension' ? 'arrow' : 'none',
    endHead: id === 'inhibition' ? 'bar' : plain ? 'none' : 'arrow',
    pathMode: ['curved','arc','s-curve','wave'].includes(id) ? 'curved' : ['elbow','zigzag','bracket'].includes(id) ? 'polyline' : 'straight',
    presetId: id,
    axis: id === 'horizontal' ? 'horizontal' : id === 'vertical' ? 'vertical' : undefined,
  };
}

export function VectorStudio() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [fa, setFa] = useState(false);
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('#087f79');
  const [width, setWidth] = useState(2);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const publishedLines = useMemo(() => getAssetCatalog().filter(asset => asset.category === LINE_CATEGORY), [libraryVersion]);

  useEffect(() => {
    const sync = () => {
      const panel = document.querySelector<HTMLElement>('.studio-library:not(.collapsed)');
      const heading = panel?.querySelector('.studio-panel-heading h2')?.textContent ?? '';
      const active = panel && /Lines\s*&\s*connectors|خطوط و اتصال‌ها/i.test(heading) ? panel : null;
      setMount(previous => previous === active ? previous : active);
      setFa(previous => previous === (document.documentElement.lang === 'fa') ? previous : document.documentElement.lang === 'fa');
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class','lang'] });
    const refresh = () => setLibraryVersion(value => value + 1);
    window.addEventListener('bioplot:asset-library-changed', refresh);
    return () => { observer.disconnect(); window.removeEventListener('bioplot:asset-library-changed', refresh); };
  }, []);

  const activate = (settings: DrawLineSettings) => {
    window.dispatchEvent(new CustomEvent<DrawLineSettings>('bioplot:activate-line', { detail: settings }));
    setMessage(fa ? 'ابزار آماده است؛ روی بوم بکشید. Esc برای لغو.' : 'Drag on canvas to draw · Esc to cancel.');
  };
  const insertPublished = (asset: ScientificAsset) => {
    const settings = parseNativeLinePreset(asset.svg);
    if (settings) { activate(settings); return; }
    window.dispatchEvent(new CustomEvent<ScientificAsset>('bioplot:insert-line-asset', { detail: asset }));
    setMessage(fa ? 'SVG به‌صورت یک تصویر برداری اضافه شد. برای ویرایش گره‌ها، الگوی بومی بسازید.' : 'SVG inserted as one vector asset. Use a native preset for editable nodes.');
  };

  return mount ? createPortal(
    <div className="bp-line-palette" dir={fa ? 'rtl' : 'ltr'} aria-label={fa ? 'ابزارهای خطوط' : 'Line tools'}>
      <p className="bp-line-intro">{fa ? 'یک ابزار انتخاب کن و روی بوم بکش. سپس نقاط آبی را جابه‌جا و با + گره اضافه کن.' : 'Choose a tool and drag on canvas. Drag blue nodes or use + to add points.'}</p>
      <div className="bp-line-options">
        <label>{fa ? 'رنگ' : 'Color'} <input type="color" aria-label={fa ? 'رنگ خط' : 'Line color'} value={color} onChange={event => setColor(event.target.value)} /></label>
        <label>{fa ? 'ضخامت' : 'Width'} <input type="number" aria-label={fa ? 'ضخامت خط' : 'Line width'} min={.5} max={40} step={.5} value={width} onChange={event => setWidth(Math.min(40, Math.max(.5, Number(event.target.value) || .5)))} /></label>
      </div>
      {sections.map((section, index) => <details className="bp-line-category" key={section.title} open={index < 2}>
        <summary>{fa ? section.titleFa : section.title}<span>{section.presets.length}</span></summary>
        <div className="bp-line-grid">{section.presets.map(preset => <button type="button" key={preset.id} className="bp-line-card" title={fa ? `رسم ${preset.fa}` : `Draw ${preset.en}`} onClick={() => activate(nativeSettings(preset, color, width))}>
          <span className="bp-line-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgFor(preset, color, width) }} /><strong>{fa ? preset.fa : preset.en}</strong>
        </button>)}</div>
      </details>)}
      <section className="bp-line-section"><h3>{fa ? 'خطوط منتشرشده توسط مدیر' : 'ADMIN-PUBLISHED LINES'}</h3>
        {publishedLines.length ? <div className="bp-line-grid">{publishedLines.map(asset => <button type="button" key={asset.id} className="bp-line-card" onClick={() => insertPublished(asset)} title={fa ? `افزودن ${asset.nameFa || asset.name}` : `Add ${asset.name}`}><span className="bp-line-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: asset.svg }} /><strong>{fa ? asset.nameFa || asset.name : asset.name}</strong></button>)}</div> : <p className="bp-line-footnote">{fa ? 'هنوز خط اختصاصی منتشر نشده است.' : 'No custom lines published yet.'}</p>}
      </section>
      {message && <p className="bp-line-feedback" role="status">{message}</p>}
      <p className="bp-line-footnote">{fa ? 'همه ابزارهای بالا خط قابل‌ویرایش می‌سازند؛ SVGهای معمولی ادمین یک شیء برداری می‌مانند.' : 'Built-in tools create editable paths. Ordinary admin SVGs remain single vector assets.'}</p>
    </div>, mount
  ) : null;
}
