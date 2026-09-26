import { supabase } from './supabaseClient';

export type ShowcaseItem = {
  id: string;
  storagePath: string;
  sourceProjectId?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const BUCKET = 'public-assets';
const MAX_ITEMS = 6;

function rowToItem(row: Record<string, any>): ShowcaseItem {
  return {
    id: String(row.id),
    storagePath: String(row.storage_path ?? ''),
    sourceProjectId: row.source_project_id ? String(row.source_project_id) : undefined,
    sortOrder: Number(row.sort_order ?? 0),
    active: row.active !== false,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function showcasePublicUrl(storagePath: string) {
  if (!storagePath) return '';
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function loadPublishedShowcaseItems(signal?: AbortSignal): Promise<ShowcaseItem[]> {
  const query = supabase
    .from('portfolio_showcase_items')
    .select('id,storage_path,source_project_id,sort_order,active,created_at,updated_at')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  const {data, error} = await (signal ? query.abortSignal(signal) : query);
  if (error) throw error;
  return (data ?? []).map(rowToItem).filter(item => Boolean(item.storagePath)).slice(0, MAX_ITEMS);
}

export async function loadAdminShowcaseItems(): Promise<ShowcaseItem[]> {
  const { data, error } = await supabase
    .from('portfolio_showcase_items')
    .select('id,storage_path,source_project_id,sort_order,active,created_at,updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToItem);
}

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'showcase';
}

async function uploadShowcaseFile(file: File) {
  if (file.size > 8_000_000) throw new Error('حداکثر حجم تصویر ۸ مگابایت است.');
  const allowed = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith('.svg')) throw new Error('فقط SVG، PNG، JPG و WebP پشتیبانی می‌شوند.');

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('برای مدیریت نمونه‌کارها باید وارد حساب Admin شوی.');
  const path = `showcase/${auth.user.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function addShowcaseItem(file: File, sourceProjectId?: string) {
  const items = await loadAdminShowcaseItems();
  if (items.length >= MAX_ITEMS) throw new Error(`حداکثر ${MAX_ITEMS} تصویر در Showcase قابل نمایش است.`);
  const path = await uploadShowcaseFile(file);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Authentication required.');
  const maxOrder = items.reduce((max, item) => Math.max(max, item.sortOrder), 0);
  const { error } = await supabase.from('portfolio_showcase_items').insert({
    storage_path: path,
    source_project_id: sourceProjectId || null,
    sort_order: maxOrder + 10,
    active: true,
    created_by: auth.user.id,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

export async function replaceShowcaseItem(item: ShowcaseItem, file: File, sourceProjectId?: string) {
  const path = await uploadShowcaseFile(file);
  const { error } = await supabase.from('portfolio_showcase_items').update({
    storage_path: path,
    source_project_id: sourceProjectId === undefined ? item.sourceProjectId ?? null : sourceProjectId || null,
    updated_at: new Date().toISOString(),
  }).eq('id', item.id);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  if (item.storagePath && item.storagePath !== path) await supabase.storage.from(BUCKET).remove([item.storagePath]);
}

export async function setShowcaseItemActive(item: ShowcaseItem, active: boolean) {
  const { error } = await supabase.from('portfolio_showcase_items').update({ active, updated_at: new Date().toISOString() }).eq('id', item.id);
  if (error) throw error;
}

export async function moveShowcaseItem(items: ShowcaseItem[], item: ShowcaseItem, direction: -1 | 1) {
  const index = items.findIndex(current => current.id === item.id);
  const other = items[index + direction];
  if (index < 0 || !other) return;
  const firstOrder = item.sortOrder;
  const secondOrder = other.sortOrder;
  const { error: firstError } = await supabase.from('portfolio_showcase_items').update({ sort_order: secondOrder, updated_at: new Date().toISOString() }).eq('id', item.id);
  if (firstError) throw firstError;
  const { error: secondError } = await supabase.from('portfolio_showcase_items').update({ sort_order: firstOrder, updated_at: new Date().toISOString() }).eq('id', other.id);
  if (secondError) throw secondError;
}

export async function deleteShowcaseItem(item: ShowcaseItem) {
  const { error } = await supabase.from('portfolio_showcase_items').delete().eq('id', item.id);
  if (error) throw error;
  if (item.storagePath) await supabase.storage.from(BUCKET).remove([item.storagePath]);
}

export const showcaseLimit = MAX_ITEMS;
