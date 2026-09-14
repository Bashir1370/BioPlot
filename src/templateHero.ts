import { supabase } from './supabaseClient';

export type TemplateHeroImage = {
  slot: 1 | 2 | 3;
  storagePath: string;
  altEn: string;
  altFa: string;
  updatedAt: string;
};

const BUCKET = 'public-assets';
const MAX_FILE_SIZE = 8_000_000;

function rowToImage(row: Record<string, any>): TemplateHeroImage {
  return {
    slot: Number(row.slot) as 1 | 2 | 3,
    storagePath: String(row.storage_path ?? ''),
    altEn: String(row.alt_en ?? ''),
    altFa: String(row.alt_fa ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function templateHeroPublicUrl(storagePath: string) {
  if (!storagePath) return '';
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export async function loadTemplateHeroImages(): Promise<TemplateHeroImage[]> {
  const { data, error } = await supabase
    .from('template_hero_images')
    .select('slot,storage_path,alt_en,alt_fa,updated_at')
    .order('slot', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToImage).filter(item => item.slot >= 1 && item.slot <= 3 && Boolean(item.storagePath));
}

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'hero-image';
}

async function uploadTemplateHeroFile(file: File, slot: 1 | 2 | 3) {
  if (file.size > MAX_FILE_SIZE) throw new Error('حداکثر حجم تصویر ۸ مگابایت است.');
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type) && !file.name.toLowerCase().endsWith('.svg')) throw new Error('فقط SVG، PNG، JPG و WebP پشتیبانی می‌شوند.');

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('برای ویرایش Hero باید وارد حساب Admin شوی.');
  const path = `template-hero/${auth.user.id}/slot-${slot}-${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function setTemplateHeroImage(slot: 1 | 2 | 3, file: File, previous?: TemplateHeroImage) {
  const path = await uploadTemplateHeroFile(file, slot);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Authentication required.');

  const { error } = await supabase.from('template_hero_images').upsert({
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

export async function removeTemplateHeroImage(image: TemplateHeroImage) {
  const { error } = await supabase.from('template_hero_images').delete().eq('slot', image.slot);
  if (error) throw error;
  if (image.storagePath) await supabase.storage.from(BUCKET).remove([image.storagePath]);
}
