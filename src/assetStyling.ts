import { AssetObject } from './model';

export interface AssetVisualStyle {
  saturation: number;
  brightness: number;
  contrast: number;
  hueRotate: number;
  glow: number;
}

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
