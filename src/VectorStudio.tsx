import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAssetCatalog } from './assets';
import type { ScientificAsset } from './assets';
import { LINE_CATEGORY } from './AdminLinesPage';
import './vector-studio.css';

type NativeLine = 'arrow' | 'straight' | 'elbow' | 'curved';
type Preset = { id: string; fa: string; en: string; path: string; native?: NativeLine; style?: 'dashed' | 'dotted'; head?: 'start' | 'end' | 'both' | 'bar'; extras?: string };
const sections: Array<{ title: string; titleFa: string; presets: Preset[] }> = [
  { title: 'ESSENTIAL LINES', titleFa: 'خطوط پایه', presets: [
    { id: 'straight', en: 'Straight', fa: 'مستقیم', path: 'M20 100H260', native: 'straight' },
    { id: 'arrow', en: 'Arrow', fa: 'فلش', path: 'M20 100H260', head: 'end', native: 'arrow' },
    { id: 'elbow', en: 'Elbow', fa: 'زاویه‌دار', path: 'M20 65H140V135H260', native: 'elbow' },
    { id: 'curved', en: 'Curved', fa: 'منحنی', path: 'M20 115C90 15 190 195 260 85', native: 'curved' },
    { id: 'horizontal', en: 'Horizontal', fa: 'افقی', path: 'M20 100H260' },
    { id: 'vertical', en: 'Vertical', fa: 'عمودی', path: 'M140 20V180' },
    { id: 'dashed', en: 'Dashed', fa: 'خط‌چین', path: 'M20 100H260', style: 'dashed' },
    { id: 'dotted', en: 'Dotted', fa: 'نقطه‌چین', path: 'M20 100H260', style: 'dotted' }
  ] },
  { title: 'ARROWS & DIAGRAMS', titleFa: 'فلش و دیاگرام', presets: [
    { id: 'double', en: 'Double arrow', fa: 'فلش دوطرفه', path: 'M20 100H260', head: 'both' },
    { id: 'wave', en: 'Wave', fa: 'موجی', path: 'M20 100C60 15 100 185 140 100S220 15 260 100' },
    { id: 'zigzag', en: 'Zigzag', fa: 'زیگزاگ', path: 'M20 100L65 65 110 135 155 65 200 135 260 100' },
    { id: 'arc', en: 'Arc', fa: 'کمان', path: 'M20 145Q140 -25 260 145' },
    { id: 'bracket', en: 'Bracket', fa: 'براکت', path: 'M255 50H45V150H255' },
    { id: 'dimension', en: 'Dimension', fa: 'اندازه‌گذاری', path: 'M20 100H260', head: 'both', extras: '<path d="M20 72V128M260 72V128" />' }
  ] },
  { title: 'SCIENTIFIC PATHWAYS', titleFa: 'مسیرهای علمی', presets: [
    { id: 'activation', en: 'Activation', fa: 'فعال‌سازی', path: 'M20 100H260', head: 'end' },
    { id: 'inhibition', en: 'Inhibition', fa: 'مهاری', path: 'M20 100H250', head: 'bar', extras: '<path d="M250 75V125" />' },
    { id: 's-curve', en: 'S-curve', fa: 'منحنی S', path: 'M20 110C110 0 170 200 260 90', head: 'end' }
  ] }
];

function svgFor(preset: Preset, color: string, width: number) {
  const dash = preset.style === 'dashed' ? 'stroke-dasharray="16 12"' : preset.style === 'dotted' ? 'stroke-dasharray="1 14"' : '';
  const heads = `${preset.head === 'start' || preset.head === 'both' ? '<path d="M37 88L20 100 37 112" />' : ''}${preset.head === 'end' || preset.head === 'both' ? '<path d="M243 88L260 100 243 112" />' : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="200" viewBox="0 0 280 200"><g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${preset.path}" ${dash}/>${heads}${preset.extras ?? ''}</g></svg>`;
}

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
function railButton(label: RegExp) {
  return [...document.querySelectorAll<HTMLButtonElement>('.reference-tool-rail button')]
    .find(button => label.test(button.textContent ?? ''));
}

export function VectorStudio() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [fa, setFa] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('#087f79');
  const [width, setWidth] = useState(4);
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
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'lang'] });
    const refresh = () => setLibraryVersion(value => value + 1);
    window.addEventListener('bioplot:asset-library-changed', refresh);
    return () => { observer.disconnect(); window.removeEventListener('bioplot:asset-library-changed', refresh); };
  }, []);

  const importAsCanvasImage = async (svg: string, filename: string) => {
    const upload = railButton(/Uploads|آپلود/i);
    const lines = railButton(/Lines|خطوط/i);
    if (!upload || !lines) throw new Error('ابزار آپلود در ادیتور پیدا نشد.');
    const before = document.querySelector('.reference-object-count')?.textContent;
    upload.click();
    let input: HTMLInputElement | null = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await nextFrame();
      input = document.querySelector<HTMLInputElement>('.studio-upload input[type="file"][accept*="image/png"]');
      if (input) break;
    }
    if (!input) { lines.click(); throw new Error('ورودی تصویر ادیتور آماده نشد.'); }
    // The image-import command embeds the SVG without creating duplicate library assets.
    // SVG remains resolution-independent; it is a single canvas object, not separate nodes.
    const transfer = new DataTransfer();
    transfer.items.add(new File([svg], filename, { type: 'image/svg+xml' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    for (let attempt = 0; attempt < 150; attempt++) {
      await nextFrame();
      if (document.querySelector('.reference-object-count')?.textContent !== before) break;
    }
    lines.click();
  };

  const insert = async (preset: Preset) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      if (preset.native) {
        const buttons = document.querySelectorAll<HTMLButtonElement>('.element-group-lines section:nth-child(3) > div > button');
        const index = ({ arrow: 0, straight: 1, elbow: 2, curved: 3 } as const)[preset.native];
        const button = buttons[index];
        if (!button) throw new Error('ابزار اصلی ادیتور در دسترس نیست.');
        button.click();
      } else await importAsCanvasImage(svgFor(preset, color, width), `BioPlot-${preset.id}.svg`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'افزودن خط ناموفق بود.'); railButton(/Lines|خطوط/i)?.click(); }
    finally { setBusy(false); }
  };

  const insertPublished = async (asset: ScientificAsset) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await importAsCanvasImage(asset.svg, `BioPlot-${asset.id}.svg`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'افزودن خط ناموفق بود.'); railButton(/Lines|خطوط/i)?.click(); }
    finally { setBusy(false); }
  };

  return mount ? createPortal(
    <div className="bp-line-palette" dir={fa ? 'rtl' : 'ltr'} aria-label={fa ? 'کتابخانه خطوط' : 'Line library'}>
      <p className="bp-line-intro">{fa ? 'خط موردنظر را انتخاب کن؛ برای ویرایش خطوط بومی، بخش Edit را باز کن.' : 'Choose a line, then use Edit for native line properties.'}</p>
      <div className="bp-line-options">
        <label>{fa ? 'رنگ SVG' : 'SVG color'} <input type="color" aria-label={fa ? 'رنگ نمونه‌های SVG' : 'SVG preset color'} value={color} onChange={event => setColor(event.target.value)} /></label>
        <label>{fa ? 'ضخامت SVG' : 'SVG width'} <input type="number" aria-label={fa ? 'ضخامت نمونه‌های SVG' : 'SVG preset width'} min={1} max={16} value={width} onChange={event => setWidth(Math.min(16, Math.max(1, Number(event.target.value) || 1)))} /></label>
      </div>
      {sections.map(section => <section className="bp-line-section" key={section.title}>
        <h3>{fa ? section.titleFa : section.title}</h3>
        <div className="bp-line-grid">{section.presets.map(preset => <button type="button" key={preset.id} disabled={busy} className="bp-line-card" title={fa ? `افزودن ${preset.fa} به بوم` : `Add ${preset.en} to canvas`} onClick={() => void insert(preset)}>
          <span className="bp-line-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgFor(preset, color, width) }} /><strong>{fa ? preset.fa : preset.en}</strong>
        </button>)}</div>
      </section>)}
      <section className="bp-line-section"><h3>{fa ? 'خطوط اختصاصی مدیر' : 'ADMIN-PUBLISHED LINES'}</h3>
        {publishedLines.length ? <div className="bp-line-grid">{publishedLines.map(asset => <button type="button" key={asset.id} disabled={busy} className="bp-line-card" onClick={() => void insertPublished(asset)} title={fa ? `افزودن ${asset.nameFa || asset.name}` : `Add ${asset.name}`}><span className="bp-line-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: asset.svg }} /><strong>{fa ? asset.nameFa || asset.name : asset.name}</strong></button>)}</div> : <p className="bp-line-footnote">{fa ? 'مدیر هنوز خطی منتشر نکرده است.' : 'No custom lines have been published yet.'}</p>}
      </section>
      {message && <p className="bp-line-error" role="alert">{message}</p>}
      <p className="bp-line-footnote">{fa ? 'چهار ابزار اصلی از مدل قابل ویرایش ادیتور استفاده می‌کنند. فایل‌های SVG اختصاصی به‌صورت یک شیء مقیاس‌پذیر اضافه می‌شوند.' : 'Four core tools use native editable objects. Published SVGs are inserted as single scalable objects.'}</p>
    </div>, mount
  ) : null;
}
