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

// Soft midtones for the default scientific-asset suggestions. The existing
// luminance mapping keeps highlights, shading and source transparency intact.
export const ASSET_PRESET_COLORS:Record<string,string> = {
  teal:'#91c9c3',blue:'#a4bfea',violet:'#bda8dd',pink:'#e6aec6',
  orange:'#ecc19e',green:'#a6cdb0',
};

// Solid colors for monochrome Lines assets: hue rotation cannot color black pixels.
export const LINE_ASSET_PRESET_COLORS:Record<string,string> = {
  teal:'#087f79',blue:'#2563eb',violet:'#7c3aed',pink:'#db2777',
  orange:'#ea580c',green:'#16a34a',muted:'#64748b',
};

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

/** Flat color for imported arrow silhouettes, preserving source alpha and original bytes. */
export function assetTintColor(object:AssetObject):string|undefined {
  return object.tintColor&&/^#[0-9a-f]{6}$/i.test(object.tintColor)?object.tintColor:undefined;
}
export function setAssetTint(object:AssetObject,color?:string):AssetObject {
  if(object.locked||(color!==undefined&&!/^#[0-9a-f]{6}$/i.test(color)))return object;
  return {...object,tintColor:color};
}
export function assetSvgWithTint(object:AssetObject):string {
  // Stretch only imported Lines assets; retain their original SVG/PNG artwork.
  const svg=object.lineAsset?object.svg.replace(/<svg\b[^>]*>/i,tag=>tag.replace(/\s+preserveAspectRatio\s*=\s*(["']).*?\1/i,'').replace(/>$/,' preserveAspectRatio="none">')):object.svg;
  const color=assetTintColor(object);
  const palette = object.paletteColor && /^#[0-9a-f]{6}$/i.test(object.paletteColor) ? object.paletteColor : undefined;
  if(!color && !palette)return svg;
  if (!color && palette) {
    // Map luminance through dark / selected color / light. Preserve alpha and
    // shading, independently of the source hue, including embedded bitmaps.
    const id = `bp-palette-${Array.from(object.id).map(char=>char.codePointAt(0)!.toString(16)).join('-')}-${palette.slice(1)}`;
    const channels = [0, 2, 4].map(offset => parseInt(palette.slice(1 + offset, 3 + offset), 16) / 255);
    const transfer = channels.map((channel, index) => `<feFunc${['R','G','B'][index]} type="table" tableValues="${channel * .15} ${channel} ${.88 + channel * .12}"/>`).join('');
    const filter = `<defs><filter id="${id}" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${transfer}</feComponentTransfer></filter></defs>`;
    return svg.replace(/(<svg\b[^>]*>)/i, `$1${filter}<g filter="url(#${id})">`).replace(/<\/svg>\s*$/i, '</g></svg>');
  }
  if (!color) return svg;
  // Use only the source alpha: a black PNG and a colored SVG both receive the exact chosen RGB.
  const id=`bp-tint-${Array.from(object.id).map(char=>char.codePointAt(0)!.toString(16)).join('-')}-${color.slice(1)}`;
  const filter=`<defs><filter id="${id}" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%"><feFlood flood-color="${color}" result="tint"/><feComposite in="tint" in2="SourceGraphic" operator="in"/></filter></defs>`;
  return svg.replace(/(<svg\b[^>]*>)/i,`$1${filter}<g filter="url(#${id})">`).replace(/<\/svg>\s*$/i,'</g></svg>');
}

export function assetCssFilter(object: StyledAssetObject): string {
  if(assetTintColor(object))return 'none';
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
  if(assetTintColor(object))return {definition:'',attribute:''};
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
  return { ...object, svg, colors: nextColors, paletteColor: undefined, tintColor: undefined, assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE } };
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
    const filterId = `bioplot-admin-tint-${color.slice(1).toLowerCase()}`;
    let defs = svg.querySelector(':scope > defs');
    if (!defs) {
      defs = parsed.createElementNS(ns, 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    // Inline SVG ids share the document namespace in browsers. Using one fixed id
    // made every preset thumbnail resolve to the first tint filter on the page.
    defs.querySelectorAll('[id^="bioplot-admin-tint"]').forEach(node => node.remove());
    svg.querySelectorAll('[filter]').forEach(node => {
      const value = node.getAttribute('filter') ?? '';
      if (value.startsWith('url(#bioplot-admin-tint')) node.removeAttribute('filter');
    });

    const filter = parsed.createElementNS(ns, 'filter');
    filter.setAttribute('id', filterId);
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
    group.setAttribute('filter', `url(#${filterId})`);
    [...svg.childNodes].filter(node => node !== defs).forEach(node => group.appendChild(node));
    svg.appendChild(group);
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return source;
  }
}

export function applyConfiguredAssetPreset(object: StyledAssetObject, preset: AssetStylePresetConfig, originalSvg?: string, originalColors?: AssetObject['colors']): StyledAssetObject {
  if(object.locked)return object;
  const source = originalSvg ?? object.svg;
  if (preset.kind === 'original') {
    return {
      ...object,
      tintColor:undefined,
      paletteColor:undefined,
      svg: source,
      colors: originalColors ? structuredClone(originalColors) : object.colors,
      assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE },
    };
  }
  const color = preset.color && /^#[0-9a-f]{6}$/i.test(preset.color) ? preset.color : '#087f79';
  if(object.lineAsset)return {
    ...setAssetTint({...object,svg:source},color),
    assetStyle:{...DEFAULT_ASSET_VISUAL_STYLE},
  };
  return {
    ...object,
    tintColor:undefined,
    paletteColor:undefined,
    svg: tintAssetSvg(source, color),
    assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE },
  };
}

export function applyAssetPreset(object: StyledAssetObject, presetId: string): StyledAssetObject {
  if(object.locked)return object;
  const preset = ASSET_STYLE_PRESETS.find(item => item.id === presetId) ?? ASSET_STYLE_PRESETS[0];
  if(object.lineAsset)return {
    ...setAssetTint(object,LINE_ASSET_PRESET_COLORS[preset.id]),
    assetStyle:{...DEFAULT_ASSET_VISUAL_STYLE},
  };
  return {
    ...object,
    tintColor: undefined,
    paletteColor: preset.id === 'original' || preset.id === 'muted' ? undefined : ASSET_PRESET_COLORS[preset.id],
    assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE, saturation: preset.id === 'muted' ? 55 : 100 },
  };
}

export function resetAssetVisualStyle(object: StyledAssetObject, originalSvg?: string, originalColors?: AssetObject['colors']): StyledAssetObject {
  return {
    ...object,
    tintColor:undefined,
    paletteColor:undefined,
    svg: originalSvg ?? object.svg,
    colors: originalColors ? structuredClone(originalColors) : object.colors,
    opacity: 1,
    assetStyle: { ...DEFAULT_ASSET_VISUAL_STYLE },
  };
}
