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

const CLOUD_CATEGORY_CACHE_KEY = 'bioplot_cloud_categories_v1';
const CLOUD_DRAFT_CACHE_KEY = 'bioplot_cloud_draft_assets_v1';

// localStorage is intentionally kept as a small/backward-compatible fast path,
// but it is not reliable for image-heavy libraries because its quota is small.
// IndexedDB is the durable browser cache for the complete cloud library.
const CLOUD_IDB_NAME = 'bioplot-cloud-library-cache-v1';
const CLOUD_IDB_STORE = 'library';
const CLOUD_IDB_PUBLISHED_KEY = 'published-assets';
const CLOUD_IDB_ADMIN_KEY = 'admin-assets';

let memoryPublishedCloudAssets: CloudAsset[] | null = null;
let memoryAdminCloudAssets: CloudAsset[] | null = null;
let cloudDbPromise: Promise<IDBDatabase | null> | null = null;

function sourceType(value: unknown): CloudAsset['sourceType'] {
  return value === 'png' || value === 'jpeg' || value === 'webp' ? value : 'svg';
}

function stylePresets(value: unknown): AssetStylePresetConfig[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, unknown>;
    const kind = record.kind === 'original' ? 'original' : 'tint';
    const color =
      typeof record.color === 'string' && /^#[0-9a-f]{6}$/i.test(record.color)
        ? record.color
        : undefined;

    if (kind === 'tint' && !color) return [];

    return [
      {
        id:
          typeof record.id === 'string' && record.id
            ? record.id
            : `preset-${index + 1}`,
        label:
          typeof record.label === 'string' && record.label
            ? record.label
            : kind === 'original'
              ? 'Original'
              : `Color ${index + 1}`,
        labelFa:
          typeof record.labelFa === 'string' && record.labelFa
            ? record.labelFa
            : undefined,
        kind,
        color,
      } satisfies AssetStylePresetConfig,
    ];
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

function sortCloudAssets(assets: CloudAsset[]) {
  return [...assets].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (order !== 0) return order;
    return a.name.localeCompare(b.name);
  });
}

function isCloudManagedAsset(asset: ScientificAsset): asset is CloudAsset {
  return Boolean((asset as ScientificAsset & { cloudManaged?: boolean }).cloudManaged);
}

function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeLocalStorageSet(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage is only a fast cache. Supabase remains the source of truth.
  }
}

function openCloudCacheDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (cloudDbPromise) return cloudDbPromise;

  cloudDbPromise = new Promise(resolve => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(CLOUD_IDB_NAME, 1);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CLOUD_IDB_STORE)) {
        db.createObjectStore(CLOUD_IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return cloudDbPromise;
}

async function readCloudCacheFromIndexedDb(key: string): Promise<CloudAsset[]> {
  const db = await openCloudCacheDb();
  if (!db) return [];

  return new Promise(resolve => {
    try {
      const transaction = db.transaction(CLOUD_IDB_STORE, 'readonly');
      const request = transaction.objectStore(CLOUD_IDB_STORE).get(key);
      request.onsuccess = () => {
        const value = request.result;
        if (!Array.isArray(value)) {
          resolve([]);
          return;
        }
        resolve(
          sortCloudAssets(
            value
              .filter(item => item && typeof item === 'object')
              .map(item => ({ ...(item as CloudAsset), cloudManaged: true as const }))
              .filter(asset => Boolean(asset.id)),
          ),
        );
      };
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function writeCloudCacheToIndexedDb(key: string, assets: CloudAsset[]) {
  const db = await openCloudCacheDb();
  if (!db) return;

  await new Promise<void>(resolve => {
    try {
      const transaction = db.transaction(CLOUD_IDB_STORE, 'readwrite');
      transaction.objectStore(CLOUD_IDB_STORE).put(sortCloudAssets(assets), key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function loadCachedPublishedCloudAssets(): CloudAsset[] {
  if (memoryPublishedCloudAssets) return sortCloudAssets(memoryPublishedCloudAssets);

  const cached = sortCloudAssets(
    loadCustomAssets()
      .filter(isCloudManagedAsset)
      .filter(asset => asset.active !== false && Boolean(asset.svg)),
  );
  memoryPublishedCloudAssets = cached;
  return cached;
}

function writePublishedCloudAssetsCache(assets: CloudAsset[]) {
  const published = sortCloudAssets(
    assets.filter(asset => asset.active !== false && Boolean(asset.svg)),
  );

  memoryPublishedCloudAssets = published;

  // Runtime is refreshed first so an already-open editor updates immediately.
  setRuntimeCloudAssets(published);

  // Keep the old localStorage cache when it fits. Large raster libraries can
  // exceed localStorage quota; IndexedDB below is the authoritative browser cache.
  try {
    const localOnly = loadCustomAssets().filter(asset => !isCloudManagedAsset(asset));
    replaceCustomAssets([...published, ...localOnly]);
  } catch {
    // Runtime + IndexedDB still keep the library usable.
  }

  void writeCloudCacheToIndexedDb(CLOUD_IDB_PUBLISHED_KEY, published);
}

function readCachedDraftCloudAssets(): CloudAsset[] {
  const parsed = safeLocalStorageGet<unknown>(CLOUD_DRAFT_CACHE_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return sortCloudAssets(
    parsed
      .filter(item => item && typeof item === 'object')
      .map(item => ({ ...(item as CloudAsset), cloudManaged: true as const }))
      .filter(asset => asset.active === false && Boolean(asset.id)),
  );
}

function writeCachedDraftCloudAssets(assets: CloudAsset[]) {
  safeLocalStorageSet(
    CLOUD_DRAFT_CACHE_KEY,
    sortCloudAssets(assets.filter(asset => asset.active === false)),
  );
}

export function loadCachedAdminCloudAssets(): CloudAsset[] {
  if (memoryAdminCloudAssets) return sortCloudAssets(memoryAdminCloudAssets);

  const merged = new Map<string, CloudAsset>();
  [...loadCachedPublishedCloudAssets(), ...readCachedDraftCloudAssets()].forEach(asset => {
    merged.set(asset.id, asset);
  });
  const cached = sortCloudAssets([...merged.values()]);
  memoryAdminCloudAssets = cached;
  return cached;
}

function writeAdminCloudAssetCache(assets: CloudAsset[]) {
  const sorted = sortCloudAssets(assets);
  memoryAdminCloudAssets = sorted;
  writeCachedDraftCloudAssets(sorted);
  writePublishedCloudAssetsCache(sorted);
  void writeCloudCacheToIndexedDb(CLOUD_IDB_ADMIN_KEY, sorted);
}

function upsertAdminCloudAssetCache(asset: CloudAsset) {
  const next = loadCachedAdminCloudAssets().filter(item => item.id !== asset.id);
  next.push(asset);
  writeAdminCloudAssetCache(next);
}

function removeAdminCloudAssetCache(id: string) {
  writeAdminCloudAssetCache(loadCachedAdminCloudAssets().filter(asset => asset.id !== id));
}

export function reloadRuntimeCloudAssetsFromBrowserCache() {
  const cached = loadCachedPublishedCloudAssets();
  setRuntimeCloudAssets(cached);
  return cached;
}

/**
 * Hydrate the complete published library from IndexedDB. This is local disk I/O,
 * not a network request, so it is normally available within a frame or two even
 * when the SVG/raster payload is too large for localStorage.
 */
export async function hydratePublishedCloudAssetsFromIndexedDb() {
  const cached = await readCloudCacheFromIndexedDb(CLOUD_IDB_PUBLISHED_KEY);
  if (!cached.length) return loadCachedPublishedCloudAssets();

  memoryPublishedCloudAssets = cached.filter(
    asset => asset.active !== false && Boolean(asset.svg),
  );
  setRuntimeCloudAssets(memoryPublishedCloudAssets);
  return sortCloudAssets(memoryPublishedCloudAssets);
}

/** Hydrate Admin's complete library (published + drafts) from local IndexedDB. */
export async function hydrateAdminCloudAssetsFromIndexedDb() {
  const cached = await readCloudCacheFromIndexedDb(CLOUD_IDB_ADMIN_KEY);
  if (!cached.length) return loadCachedAdminCloudAssets();

  memoryAdminCloudAssets = sortCloudAssets(cached);
  memoryPublishedCloudAssets = memoryAdminCloudAssets.filter(
    asset => asset.active !== false && Boolean(asset.svg),
  );
  setRuntimeCloudAssets(memoryPublishedCloudAssets);
  return sortCloudAssets(memoryAdminCloudAssets);
}

export function loadCachedCloudCategories(): CloudCategory[] {
  const parsed = safeLocalStorageGet<unknown>(CLOUD_CATEGORY_CACHE_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(item => item && typeof item === 'object')
    .map((item, index) => {
      const row = item as Partial<CloudCategory>;
      return {
        slug: String(row.slug ?? ''),
        nameEn: String(row.nameEn ?? row.slug ?? ''),
        nameFa: row.nameFa ? String(row.nameFa) : undefined,
        active: row.active !== false,
        sortOrder: Number.isFinite(row.sortOrder) ? Number(row.sortOrder) : index * 10,
      } satisfies CloudCategory;
    })
    .filter(category => Boolean(category.slug))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn));
}

function writeCloudCategoryCache(categories: CloudCategory[]) {
  safeLocalStorageSet(
    CLOUD_CATEGORY_CACHE_KEY,
    [...categories].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn),
    ),
  );
}

export async function loadCloudCategories(): Promise<CloudCategory[]> {
  const { data, error } = await supabase.from('asset_categories').select('*');

  if (error) throw error;

  const categories = (data ?? [])
    .map(row => ({
      slug: String(row.slug),
      nameEn: String(row.name_en ?? row.slug ?? ''),
      nameFa: row.name_fa ? String(row.name_fa) : undefined,
      active: row.active !== false,
      sortOrder: Number(row.sort_order ?? 0),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn));

  writeCloudCategoryCache(categories);
  return categories;
}

export async function createCloudCategory(nameEn: string, nameFa?: string) {
  const slug = nameEn.trim();
  if (!slug) throw new Error('Category name is required.');

  const existing = await loadCloudCategories();
  const maxOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder), 0);
  const category: CloudCategory = {
    slug,
    nameEn: slug,
    nameFa: nameFa?.trim() || undefined,
    sortOrder: maxOrder + 10,
    active: true,
  };

  const { error } = await supabase.from('asset_categories').insert({
    slug: category.slug,
    name_en: category.nameEn,
    name_fa: category.nameFa ?? null,
    sort_order: category.sortOrder,
    active: true,
  });

  if (error) throw error;
  writeCloudCategoryCache([...existing.filter(item => item.slug !== slug), category]);
}

export async function updateCloudCategory(
  previousSlug: string,
  nameEn: string,
  nameFa?: string,
) {
  const nextSlug = nameEn.trim();
  if (!nextSlug) throw new Error('Category name is required.');

  if (previousSlug !== nextSlug) {
    const { error: assetError } = await supabase
      .from('assets')
      .update({ category: nextSlug })
      .eq('category', previousSlug);

    if (assetError) throw assetError;
  }

  const { error } = await supabase
    .from('asset_categories')
    .update({
      slug: nextSlug,
      name_en: nextSlug,
      name_fa: nameFa?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', previousSlug);

  if (error) throw error;

  const categories = loadCachedCloudCategories().map(category =>
    category.slug === previousSlug
      ? { ...category, slug: nextSlug, nameEn: nextSlug, nameFa: nameFa?.trim() || undefined }
      : category,
  );
  writeCloudCategoryCache(categories);

  if (previousSlug !== nextSlug) {
    writeAdminCloudAssetCache(
      loadCachedAdminCloudAssets().map(asset =>
        asset.category === previousSlug ? { ...asset, category: nextSlug } : asset,
      ),
    );
  }
}

export async function deleteCloudCategory(slug: string) {
  if (slug === 'Uncategorized') throw new Error('Uncategorized cannot be deleted.');

  const { error: assetError } = await supabase
    .from('assets')
    .update({ category: 'Uncategorized' })
    .eq('category', slug);

  if (assetError) throw assetError;

  const { error } = await supabase.from('asset_categories').delete().eq('slug', slug);
  if (error) throw error;

  writeCloudCategoryCache(loadCachedCloudCategories().filter(category => category.slug !== slug));
  writeAdminCloudAssetCache(
    loadCachedAdminCloudAssets().map(asset =>
      asset.category === slug ? { ...asset, category: 'Uncategorized' } : asset,
    ),
  );
}

/**
 * Admin always refreshes from Supabase in the background, but every successful
 * response also primes the browser cache. The next Admin/Editor route can render
 * the library immediately instead of waiting on the network.
 */
export async function loadAdminCloudAssets(): Promise<CloudAsset[]> {
  const { data, error } = await supabase.from('assets').select('*');

  if (error) throw error;

  const assets = sortCloudAssets((data ?? []).map(rowToAsset));
  writeAdminCloudAssetCache(assets);
  await writeCloudCacheToIndexedDb(CLOUD_IDB_ADMIN_KEY, assets);
  return assets;
}

export async function loadPublishedCloudAssets(): Promise<CloudAsset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('is_published', true);

  if (error) throw error;

  return sortCloudAssets(
    (data ?? []).map(rowToAsset).filter(asset => Boolean(asset.svg)),
  );
}

export async function syncPublishedCloudAssetsToBrowserCache() {
  const cloud = await loadPublishedCloudAssets();
  writePublishedCloudAssetsCache(cloud);
  await writeCloudCacheToIndexedDb(
    CLOUD_IDB_PUBLISHED_KEY,
    cloud.filter(asset => asset.active !== false && Boolean(asset.svg)),
  );
  return cloud;
}

function safeFileName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'asset'
  );
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

export async function saveCloudAsset(
  draft: CloudAssetDraft,
  file: File | null,
  existing?: CloudAsset,
) {
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

  // Prefer the already-warm admin cache for ordering. If this is the first ever
  // asset on this browser, the default 10 is fine and avoids another full query.
  const currentAssets = loadCachedAdminCloudAssets();
  const maxOrder = currentAssets.reduce(
    (max, item) => Math.max(max, item.sortOrder ?? 0),
    0,
  );

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

  let savedRow: Record<string, any> | null = null;

  if (existing) {
    const { data, error } = await supabase
      .from('assets')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      if (uploadedPath) {
        await supabase.storage.from('public-assets').remove([uploadedPath]);
      }
      throw error;
    }
    savedRow = data;

    if (
      uploadedPath &&
      existing.storagePath &&
      uploadedPath !== existing.storagePath
    ) {
      await supabase.storage.from('public-assets').remove([existing.storagePath]);
    }
  } else {
    const { data, error } = await supabase
      .from('assets')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (uploadedPath) {
        await supabase.storage.from('public-assets').remove([uploadedPath]);
      }
      throw error;
    }
    savedRow = data;
  }

  const saved = rowToAsset(savedRow ?? { ...payload, id: existing?.id ?? crypto.randomUUID() });
  upsertAdminCloudAssetCache(saved);
  return saved;
}

export async function patchCloudAsset(
  asset: CloudAsset,
  changes: Partial<
    Pick<CloudAssetDraft, 'active' | 'featured' | 'premium' | 'reviewStatus'>
  >,
) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof changes.active === 'boolean') payload.is_published = changes.active;
  if (typeof changes.featured === 'boolean') payload.featured = changes.featured;
  if (typeof changes.premium === 'boolean') payload.is_premium = changes.premium;
  if (changes.reviewStatus) {
    payload.is_reviewed = changes.reviewStatus === 'reviewed';
  }

  const { data, error } = await supabase
    .from('assets')
    .update(payload)
    .eq('id', asset.id)
    .select('*')
    .single();

  if (error) throw error;

  const updated = rowToAsset(data);
  upsertAdminCloudAssetCache(updated);
  return updated;
}

export async function deleteCloudAsset(asset: CloudAsset) {
  const { error } = await supabase.from('assets').delete().eq('id', asset.id);

  if (error) throw error;

  removeAdminCloudAssetCache(asset.id);

  if (asset.storagePath) {
    await supabase.storage.from('public-assets').remove([asset.storagePath]);
  }
}
