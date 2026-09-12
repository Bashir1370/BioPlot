import { AssetObject } from './model';

export interface AssetVisualStyle {
  saturation: number;
  brightness: number;
  contrast: number;
  hueRotate: number;
  glow: number;
}

export type AssetStylePresetConfig = {
  id: string;
  label: string;
  labelFa?: string;
  kind: 'original' | 'tint';
  color?: string;
};

export type StyledAssetObject = AssetObject & { assetStyle?: Partial<AssetVisualStyle> };

export const DEFAULT_ASSET_VISUAL_STYLE: AssetVisualStyle = {
  saturation: 100,
  brightness: 100,
  contrast: 100,
  hueRotate: 0,
  glow: 0,
};

export const ASSET_STYLE_PRESETS = [
  { id: 'original', label: 'Original', labelFa: 'اصلی', saturation: 100, brightness: 100, contrast: 100, hueRotate: 0 },
  { id: 'teal', label: 'Teal', labelFa: 'سبزآبی', saturation: 118, brightness: 102, contrast: 102, hueRotate: 105 },
  { id: 'blue', label: 'Blue', labelFa: 'آبی', saturation: 118, brightness: 100, contrast: 102, hueRotate: 165 },
  { id: 'violet', label: 'Violet', labelFa: 'بنفش', saturation: 110, brightness: 101, contrast: 102, hueRotate: 0 },
  { id: 'pink', label: 'Pink', labelFa: 'صورتی', saturation: 128, brightness: 105, contrast: 100, hueRotate: 305 },
  { id: 'orange', label: 'Orange', labelFa: 'نارنجی', saturation: 132, brightness: 106, contrast: 100, hueRotate: 245 },
  { id: 'green', label: 'Green', labelFa: 'سبز', saturation: 120, brightness: 102, contrast: 102, hueRotate: 75 },
  { id: 'muted', label: 'Muted', labelFa: 'ملایم', saturation: 55, brightness: 108, contrast: 92, hueRotate: 0 },
] as const;

let libraryInsertionStyleUntil = 0;

export function markAssetStyleAutoOpenFromLibrary() {
  libraryInsertionStyleUntil = Date.now() + 1200;
}

export function consumeAssetStyleAutoOpenFromLibrary() {
  const allowed = Date.now() <= libraryInsertionStyleUntil;
  libraryInsertionStyleUntil = 0;
  return allowed;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export function normalizedAssetVisualStyle(object: StyledAssetObject): AssetVisualStyle {
  const style = object.assetStyle ?? {};
  return {
    saturation: clamp(style.saturation ?? 100, 0, 200),
    brightness: clamp(style.brightness ?? 100, 40, 180),
    contrast: clamp(style.contrast ?? 100, 40, 180),
    hueRotate: clamp(style.hueRotate ?? 0, -180, 360),
    glow: clamp(style.glow ?? 0, 0, 24),
  };
}

export function assetCssFilter(object: StyledAssetObject): string {
  const style = normalizedAssetVisualStyle(object);
  const filters = [
    `saturate(${style.saturation}%)`,
    `brightness(${style.brightness}%)`,
    `contrast(${style.contrast}%)`,
    `hue-rotate(${style.hueRotate}deg)`,
  ];
  if (style.glow > 0) filters.push(`drop-shadow(0 0 ${style.glow}px rgba(8,123,118,.38))`);
  return filters.join(' ');
}

export function assetSvgFilterMarkup(object: StyledAssetObject, id: string): { definition: string; attribute: string } {
  const style = normalizedAssetVisualStyle(object);
  const isDefault = style.saturation === 100 && style.brightness === 100 && style.contrast === 100 && style.hueRotate === 0 && style.glow === 0;
  if (isDefault) return { definition: '', attribute: '' };
  const sat = style.saturation / 100;
  const bright = style.brightness / 100;
  const contrast = style.contrast / 100;
  const slope = bright * contrast;
  const intercept = .5 - .5 * contrast;
  const hue = style.hueRotate;
  const blur = style.glow > 0 ? `<feGaussianBlur stdDeviation="${Math.max(.1, style.glow / 3)}" result="bpGlow"/><feMerge><feMergeNode in="bpGlow"/><feMergeNode in="SourceGraphic"/></feMerge>` : '';
  const definition = `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${sat}"/><feColorMatrix type="hueRotate" values="${hue}"/><feComponentTransfer><feFuncR type="linear" slope="${slope}" intercept="${intercept}"/><feFuncG type="linear" slope="${slope}" intercept="${intercept}"/><feFuncB type="linear" slope="${slope}" intercept="${intercept}"/></feComponentTransfer>${blur}</filter>`;
  return { definition, attribute: ` filter="url(#${id})"` };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function recolorAssetSlot(object: StyledAssetObject, index: number, nextColor: string): StyledAssetObject {
  const slot = object.colors[index];
  if (!slot || !/^#[0-9a-f]{6}$/i.test(nextColor)) return object;
  const current = slot.value;
  const nextColors = object.colors.map((item, itemIndex) => itemIndex === index ? { ...item, value: nextColor } : item);
  if (!current || current.toLowerCase() === nextColor.toLowerCase()) return { ...object, colors: nextColors };
  const svg = object.svg.replace(new RegExp(escapeRegExp(current), 'gi'), nextColor);
  return { ...object, svg, colors: nextColors };
}

function hexRgb(value: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  if (!match) return null;
  return {
    r: parseInt(match[1].slice(0, 2), 16) / 255,
    g: parseInt(match[1].slice(2, 4), 16) / 255,
    b: parseInt(match[1].slice(4, 6), 16) / 255,
  };
}

export function tintAssetSvg(source: string, color: string): string {
  const rgb = hexRgb(color);
  if (!rgb || typeof DOMParser === 'undefined') return source;
  try {
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const svg = parsed.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) return source;
    const ns = 'http://www.w3.org/2000/svg';
    let defs = svg.querySelector(':scope > defs');
    if (!defs) {
      defs = parsed.createElementNS(ns, 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }
    defs.querySelector('#bioplot-admin-tint')?.remove();
    const filter = parsed.createElementNS(ns, 'filter');
    filter.setAttribute('id', 'bioplot-admin-tint');
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const matrix = parsed.createElementNS(ns, 'feColorMatrix');
    matrix.setAttribute('type', 'matrix');
    const k = .82;
    const base = .18;
    const row = (channel: number) => `${channel * .2126 * k} ${channel * .7152 * k} ${channel * .0722 * k} 0 ${channel * base}`;
    matrix.setAttribute('values', `${row(rgb.r)} ${row(rgb.g)} ${row(rgb.b)} 0 0 0 1 0`);
    filter.appendChild(matrix);
    defs.appendChild(filter);

    const group = parsed.createElementNS(ns, 'g');
    group.setAttribute('filter', 'url(#bioplot-admin-tint)');
    [...svg.childNodes].filter(node => node !== defs).forEach(node => group.appendChild(node));
    svg.appendChild(group);
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return source;
  }
}

export function applyConfiguredAssetPreset(object: StyledAssetObject, preset: AssetStylePresetConfig, originalSvg?: string, originalColors?: AssetObject['colors']): StyledAssetObject {
  const source = originalSvg ?? object.svg;
  if (preset.kind === 'original') {
    return {
      ...object,
      svg: source,
      colors: originalColors ? structuredClone(originalColors) : object.colors,
      assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE },
    };
  }
  const color = preset.color && /^#[0-9a-f]{6}$/i.test(preset.color) ? preset.color : '#087f79';
  return {
    ...object,
    svg: tintAssetSvg(source, color),
    assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE },
  };
}

export function applyAssetPreset(object: StyledAssetObject, presetId: string): StyledAssetObject {
  const preset = ASSET_STYLE_PRESETS.find(item => item.id === presetId) ?? ASSET_STYLE_PRESETS[0];
  return {
    ...object,
    assetStyle: {
      ...normalizedAssetVisualStyle(object),
      saturation: preset.saturation,
      brightness: preset.brightness,
      contrast: preset.contrast,
      hueRotate: preset.hueRotate,
    },
  };
}

export function resetAssetVisualStyle(object: StyledAssetObject, originalSvg?: string, originalColors?: AssetObject['colors']): StyledAssetObject {
  return {
    ...object,
    svg: originalSvg ?? object.svg,
    colors: originalColors ? structuredClone(originalColors) : object.colors,
    opacity: 1,
    assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE },
  };
}
