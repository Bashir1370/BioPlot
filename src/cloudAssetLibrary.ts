import type { ScientificAsset } from './assets';
import { loadCustomAssets, replaceCustomAssets, sanitizeSvg, setRuntimeCloudAssets } from './assets';
import type { AssetStylePresetConfig } from './assetStyling';
import { supabase } from './supabaseClient';

export type CloudCategory = {
  slug: string;
  nameEn: string;
  nameFa?: string;
  active: boolean;
  sortOrder: number;
};

export type CloudAsset = ScientificAsset & {
  storagePath: string;
  cloudManaged: true;
  stylePresets?: AssetStylePresetConfig[];
};

export type CloudAssetDraft = {
  name: string;
  nameFa?: string;
  category: string;
  description?: string;
  descriptionFa?: string;
  synonyms: { en: string[]; fa: string[] };
  renderSvg: string;
  sourceType: 'svg' | 'png' | 'jpeg' | 'webp';
  reviewStatus: 'draft' | 'reviewed';
  premium: boolean;
  active: boolean;
  featured: boolean;
  stylePresets?: AssetStylePresetConfig[];
};

function sourceType(value: unknown): CloudAsset['sourceType'] {
  return value === 'png' || value === 'jpeg' || value === 'webp' ? value : 'svg';
}

function stylePresets(value: unknown): AssetStylePresetConfig[]|undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const kind = record.kind === 'original' ? 'original' : 'tint';
    const color = typeof record.color === 'string' && /^#[0-9a-f]{6}$/i.test(record.color) ? record.color : undefined;
    if (kind === 'tint' && !color) return [];
    return [{
      id: typeof record.id === 'string' && record.id ? record.id : `preset-${index + 1}`,
      label: typeof record.label === 'string' && record.label ? record.label : kind === 'original' ? 'Original' : `Color ${index + 1}`,
      labelFa: typeof record.labelFa === 'string' && record.labelFa ? record.labelFa : undefined,
      kind,
      color,
    } satisfies AssetStylePresetConfig];
  });
}

function rowToAsset(row: Record<string, any>): CloudAsset {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    nameFa: row.name_fa ? String(row.name_fa) : undefined,
    category: String(row.category ?? 'Uncategorized'),
    description: row.description_en ? String(row.description_en) : undefined,
    descriptionFa: row.description_fa ? String(row.description_fa) : undefined,
    synonyms: {
      en: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
      fa: Array.isArray(row.keywords_fa) ? row.keywords_fa.map(String) : [],
    },
    tags: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
    svg: String(row.render_svg ?? metadata.render_svg ?? ''),
    colorSlots: Array.isArray(row.color_slots) ? row.color_slots : [],
    reviewStatus: row.is_reviewed ? 'reviewed' : 'draft',
    premium: Boolean(row.is_premium),
    active: Boolean(row.is_published),
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order ?? 0),
    sourceType: sourceType(row.asset_type),
    version: Number(row.version ?? 1),
    storagePath: String(row.storage_path ?? ''),
    cloudManaged: true,
    stylePresets: stylePresets(metadata.style_presets),
  };
}

export async function loadCloudCategories(): Promise<CloudCategory[]> {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('slug,name_en,name_fa,active,sort_order')
    .order('sort_order', { ascending: true })
    .order('name_en', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(row => ({
    slug: String(row.slug),
    nameEn: String(row.name_en),
    nameFa: row.name_fa ? String(row.name_fa) : undefined,
    active: row.active !== false,
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

export async function createCloudCategory(nameEn: string, nameFa?: string) {
  const slug = nameEn.trim();
  if (!slug) throw new Error('Category name is required.');
  const existing = await loadCloudCategories();
  const maxOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder), 0);
  const { error } = await supabase.from('asset_categories').insert({
    slug,
    name_en: slug,
    name_fa: nameFa?.trim() || null,
    sort_order: maxOrder + 10,
    active: true,
  });
  if (error) throw error;
}

export async function updateCloudCategory(previousSlug: string, nameEn: string, nameFa?: string) {
  const nextSlug = nameEn.trim();
  if (!nextSlug) throw new Error('Category name is required.');
  if (previousSlug !== nextSlug) {
    const { error: assetError } = await supabase.from('assets').update({ category: nextSlug }).eq('category', previousSlug);
    if (assetError) throw assetError;
  }
  const { error } = await supabase.from('asset_categories').update({
    slug: nextSlug,
    name_en: nextSlug,
    name_fa: nameFa?.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('slug', previousSlug);
  if (error) throw error;
}

export async function deleteCloudCategory(slug: string) {
  if (slug === 'Uncategorized') throw new Error('Uncategorized cannot be deleted.');
  const { error: assetError } = await supabase.from('assets').update({ category: 'Uncategorized' }).eq('category', slug);
  if (assetError) throw assetError;
  const { error } = await supabase.from('asset_categories').delete().eq('slug', slug);
  if (error) throw error;
}

export async function loadAdminCloudAssets(): Promise<CloudAsset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('id,name,name_fa,category,description_en,description_fa,keywords,keywords_fa,asset_type,storage_path,is_premium,is_reviewed,is_published,metadata,render_svg,featured,sort_order,version,color_slots')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAsset);
}

export async function loadPublishedCloudAssets(): Promise<CloudAsset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('id,name,name_fa,category,description_en,description_fa,keywords,keywords_fa,asset_type,storage_path,is_premium,is_reviewed,is_published,metadata,render_svg,featured,sort_order,version,color_slots')
    .eq('is_published', true)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAsset).filter(asset => Boolean(asset.svg));
}

export async function syncPublishedCloudAssetsToBrowserCache() {
  const cloud = await loadPublishedCloudAssets();
  setRuntimeCloudAssets(cloud);

  const localOnly = loadCustomAssets().filter(asset => !(asset as ScientificAsset & { cloudManaged?: boolean }).cloudManaged);
  try {
    replaceCustomAssets(localOnly);
  } catch {
    // Runtime cloud assets are already available. Cache cleanup is best-effort only.
  }

  return cloud;
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'asset';
}

async function uploadOriginal(file: File) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Authentication required.');
  const path = `library/${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from('public-assets').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function saveCloudAsset(draft: CloudAssetDraft, file: File | null, existing?: CloudAsset) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Authentication required.');
  if (!existing && !file) throw new Error('Please choose a source file.');

  const renderSvg = sanitizeSvg(draft.renderSvg);
  let storagePath = existing?.storagePath ?? '';
  let uploadedPath: string | null = null;
  if (file) {
    uploadedPath = await uploadOriginal(file);
    storagePath = uploadedPath;
  }

  const currentAssets = existing ? [] : await loadAdminCloudAssets();
  const maxOrder = currentAssets.reduce((max, item) => Math.max(max, item.sortOrder ?? 0), 0);
  const metadata: Record<string, unknown> = { source: 'admin-library' };
  if (file?.name) metadata.original_file = file.name;
  if (draft.stylePresets !== undefined) metadata.style_presets = draft.stylePresets;
  const payload = {
    name: draft.name.trim(),
    name_fa: draft.nameFa?.trim() || null,
    category: draft.category,
    keywords: draft.synonyms.en,
    keywords_fa: draft.synonyms.fa,
    asset_type: draft.sourceType,
    storage_path: storagePath,
    is_premium: draft.premium,
    is_reviewed: draft.reviewStatus === 'reviewed',
    is_published: draft.active,
    description_en: draft.description?.trim() || null,
    description_fa: draft.descriptionFa?.trim() || null,
    render_svg: renderSvg,
    featured: draft.featured,
    sort_order: existing?.sortOrder ?? maxOrder + 10,
    version: existing ? existing.version + 1 : 1,
    color_slots: existing?.colorSlots ?? [],
    created_by: user.id,
    updated_at: new Date().toISOString(),
    metadata,
  };

  if (existing) {
    const { error } = await supabase.from('assets').update(payload).eq('id', existing.id);
    if (error) {
      if (uploadedPath) await supabase.storage.from('public-assets').remove([uploadedPath]);
      throw error;
    }
    if (uploadedPath && existing.storagePath && uploadedPath !== existing.storagePath) {
      await supabase.storage.from('public-assets').remove([existing.storagePath]);
    }
  } else {
    const { error } = await supabase.from('assets').insert(payload);
    if (error) {
      if (uploadedPath) await supabase.storage.from('public-assets').remove([uploadedPath]);
      throw error;
    }
  }
}

export async function patchCloudAsset(asset: CloudAsset, changes: Partial<Pick<CloudAssetDraft, 'active' | 'featured' | 'premium' | 'reviewStatus'>>) {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof changes.active === 'boolean') payload.is_published = changes.active;
  if (typeof changes.featured === 'boolean') payload.featured = changes.featured;
  if (typeof changes.premium === 'boolean') payload.is_premium = changes.premium;
  if (changes.reviewStatus) payload.is_reviewed = changes.reviewStatus === 'reviewed';
  const { error } = await supabase.from('assets').update(payload).eq('id', asset.id);
  if (error) throw error;
}

export async function deleteCloudAsset(asset: CloudAsset) {
  const { error } = await supabase.from('assets').delete().eq('id', asset.id);
  if (error) throw error;
  if (asset.storagePath) await supabase.storage.from('public-assets').remove([asset.storagePath]);
}
