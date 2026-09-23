import { loadCustomCategories } from './assets';
import { loadCachedCloudCategories } from './cloudAssetLibrary';

const CATEGORY_FA: Record<string, string> = {
  animals: 'جانوران', cancer: 'سرطان', 'cell biology': 'زیست‌شناسی سلولی',
  custom: 'شکل‌های سفارشی', immunology: 'ایمنی‌شناسی', 'lab equipment': 'تجهیزات آزمایشگاهی',
  'lines & arrows': 'خطوط و پیکان‌ها', microbiology: 'میکروب‌شناسی',
  'molecular biology': 'زیست‌شناسی مولکولی', neuroscience: 'علوم اعصاب',
  organs: 'اندام‌ها', protein: 'پروتئین‌ها', proteins: 'پروتئین‌ها',
  pharmacology: 'داروشناسی', uncategorized: 'دسته‌بندی‌نشده',
};

export function categoryLabel(category: string, fa: boolean): string {
  const cloud = loadCachedCloudCategories().find(item => item.slug === category);
  if (!fa) return cloud?.nameEn || category;
  const custom = loadCustomCategories().find(item => item.name === category);
  return cloud?.nameFa?.trim() || custom?.nameFa?.trim() || CATEGORY_FA[category.toLowerCase().replace(/-/g, ' ')] || category;
}

export function projectTitleInput(title: string): string {
  return title === 'Untitled scientific figure' ? '' : title;
}

export const objectTypeFa: Record<string, string> = {
  asset: 'شکل علمی', image: 'تصویر', shape: 'شکل', arrow: 'پیکان', connector: 'خط اتصال',
  text: 'متن', label: 'برچسب', container: 'کادر', plot: 'نمودار', path: 'مسیر',
};
