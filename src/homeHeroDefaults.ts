import { scientificStarterAssets } from './scientificAssetPack';

export const HOME_HERO_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;
export type HomeHeroSlot = typeof HOME_HERO_SLOTS[number];

// These bundled illustrations render immediately and remain available if the
// image service is slow. Each slot can still be replaced in Admin → Home Hero.
export const HOME_HERO_DEFAULTS = scientificStarterAssets.slice(0, HOME_HERO_SLOTS.length)
  .map(asset => `data:image/svg+xml,${encodeURIComponent(asset.svg)}`);
