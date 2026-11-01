import manifest from './generated/asset-previews.json';

export type AssetPreviewEntry = {version:number;storagePath:string;url:string};
export const assetPreviewManifest=manifest as Record<string,AssetPreviewEntry>;
