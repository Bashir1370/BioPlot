import { supabase } from './supabaseClient';
export const HOME_TEXT_FIELDS = ['eyebrow','title','highlight','description','primaryText','secondaryText','socialProof'] as const;
export type HomeText = Record<typeof HOME_TEXT_FIELDS[number], string>;
export type HomeContent = Record<'en'|'fa', HomeText>;
export const HOME_TEXT_DEFAULTS: HomeContent = {
 en: {eyebrow:'BIOPLOT FIGURE STUDIO',title:'Your science.',highlight:'Clearly illustrated.',description:'Turn complex biology into clear, editable, publication-ready figures. One focused workspace for your next discovery.',primaryText:'Create scientific figure',secondaryText:'My dashboard',socialProof:'Native vector export · Structured autosave · Persian + English'},
 fa: {eyebrow:'BIOPLOT FIGURE STUDIO',title:'علم شما؛',highlight:'روشن و تماشایی.',description:'ایده‌های پیچیده زیستی را به شکل‌هایی روشن، قابل‌ویرایش و آماده انتشار تبدیل کن؛ در یک فضای طراحی علمی.',primaryText:'ساخت شکل علمی',secondaryText:'داشبورد من',socialProof:'خروجی وکتور واقعی · ذخیره ساختاریافته · فارسی + انگلیسی'},
};
export function normalizeHomeContent(value: unknown): HomeContent {
 const input = value as Partial<HomeContent> | null;
 const normalized = Object.fromEntries((['en','fa'] as const).map(locale => [locale,Object.fromEntries(HOME_TEXT_FIELDS.map(key => [key,typeof input?.[locale]?.[key] === 'string' ? input[locale]![key] : HOME_TEXT_DEFAULTS[locale][key]]))])) as HomeContent;
 for(const lang of ['en','fa'] as const) if(['Browse templates','مشاهده قالب‌ها'].includes(normalized[lang].secondaryText)) normalized[lang].secondaryText=HOME_TEXT_DEFAULTS[lang].secondaryText;
 return normalized;
}
export async function loadHomeContent(): Promise<HomeContent> {
 const {data,error} = await supabase.from('home_hero_content').select('content').eq('id',1).maybeSingle();
 if(error) throw error;
 return normalizeHomeContent(data?.content);
}
export async function saveHomeContent(content: HomeContent) {
 for(const locale of ['en','fa'] as const) for(const key of HOME_TEXT_FIELDS) {
  if(typeof content[locale][key] !== 'string' || content[locale][key].length > 2000) throw new Error('حداکثر طول هر متن ۲۰۰۰ کاراکتر است.');
 }
 const {data:auth,error:authError}=await supabase.auth.getUser();
 if(authError || !auth.user) throw new Error('برای ذخیره وارد حساب مدیر شوید.');
 const {error}=await supabase.from('home_hero_content').upsert({id:1,content:normalizeHomeContent(content),updated_by:auth.user.id,updated_at:new Date().toISOString()},{onConflict:'id'});
 if(error) throw error;
}
