import { supabase } from './supabaseClient';
import { HOME_HERO_SLOTS, type HomeHeroSlot } from './homeHeroDefaults';
export { HOME_HERO_DEFAULTS, HOME_HERO_SLOTS, type HomeHeroSlot } from './homeHeroDefaults';

export type HomeHeroImage = {
  slot: HomeHeroSlot;
  storagePath: string;
  altEn: string;
  altFa: string;
  updatedAt: string;
};

const BUCKET = 'public-assets';
const MAX_FILE_SIZE = 8_000_000;

function rowToImage(row: Record<string, any>): HomeHeroImage {
  return {
    slot: Number(row.slot) as HomeHeroSlot,
    storagePath: String(row.storage_path ?? ''),
    altEn: String(row.alt_en ?? ''),
    altFa: String(row.alt_fa ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function homeHeroPublicUrl(storagePath: string) {
  if (!storagePath) return '';
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function loadHomeHeroImages(signal?: AbortSignal): Promise<HomeHeroImage[]> {
  const query = supabase
    .from('home_hero_images')
    .select('slot,storage_path,alt_en,alt_fa,updated_at')
    .order('slot', { ascending: true });
  const {data, error} = await (signal ? query.abortSignal(signal) : query);
  if (error) throw error;
  return (data ?? []).map(rowToImage).filter(item => item.slot >= 1 && item.slot <= 16 && Boolean(item.storagePath));
}

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'hero-image';
}

async function uploadHomeHeroFile(file: File, slot: HomeHeroSlot) {
  if (file.size > MAX_FILE_SIZE) throw new Error('حداکثر حجم تصویر ۸ مگابایت است.');
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) throw new Error('فقط SVG، PNG، JPG و WebP پشتیبانی می‌شوند.');

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('برای ویرایش Hero باید وارد حساب Admin شوی.');
  const path = `home-hero/${auth.user.id}/slot-${slot}-${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function setHomeHeroImage(slot: HomeHeroSlot, file: File, previous?: HomeHeroImage) {
  if (!HOME_HERO_SLOTS.includes(slot)) throw new Error('Invalid image slot.');
  const path = await uploadHomeHeroFile(file, slot);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Authentication required.');

  const { error } = await supabase.from('home_hero_images').upsert({
    slot,
    storage_path: path,
    alt_en: previous?.altEn || `BioPlot scientific figure inspiration ${slot}`,
    alt_fa: previous?.altFa || `نمونه تصویری علمی BioPlot ${slot}`,
    updated_by: auth.user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slot' });

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  if (previous?.storagePath && previous.storagePath !== path) await supabase.storage.from(BUCKET).remove([previous.storagePath]);
}

export async function removeHomeHeroImage(image: HomeHeroImage) {
  const { error } = await supabase.from('home_hero_images').delete().eq('slot', image.slot);
  if (error) throw error;
  if (image.storagePath) await supabase.storage.from(BUCKET).remove([image.storagePath]);
}
