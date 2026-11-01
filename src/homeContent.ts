import { supabase } from './supabaseClient';
export const HOME_TEXT_FIELDS = ['eyebrow','title','highlight','description','primaryText','secondaryText','socialProof'] as const;
export type HomeText = Record<typeof HOME_TEXT_FIELDS[number], string>;
export const HOME_FONT_FAMILIES = ['vazirmatn','estedad','inter','tahoma'] as const;
export type HomeFontFamily = typeof HOME_FONT_FAMILIES[number];
export const HOME_FONT_OPTIONS: {value:HomeFontFamily;label:string}[] = [
 {value:'vazirmatn',label:'Vazirmatn'},
 {value:'estedad',label:'Estedad'},
 {value:'inter',label:'Inter'},
 {value:'tahoma',label:'Tahoma'},
];
export const HOME_FONT_STACKS: Record<HomeFontFamily,string> = {
 vazirmatn:'Vazirmatn,Tahoma,Arial,sans-serif',
 estedad:'Estedad,Vazirmatn,Tahoma,Arial,sans-serif',
 inter:'Inter,Vazirmatn,Arial,sans-serif',
 tahoma:'Tahoma,Arial,sans-serif',
};
export type HomeLocaleContent = HomeText & {fontFamily:HomeFontFamily};
export type HomeContent = Record<'en'|'fa', HomeLocaleContent>;
const PREVIOUS_HOME_TEXT_DEFAULTS: HomeContent = {
 en: {eyebrow:'SCIENTIFIC FIGURE DESIGN',title:'Turn your research idea',highlight:'into a clear scientific figure.',description:'Design it yourself in the BioPlot Studio, or submit a design request for support from a specialist. Follow your work and order updates through your account.',primaryText:'Design in the Studio',secondaryText:'Request a design',socialProof:'Editable vector tools · Custom design service · Order tracking',fontFamily:'inter'},
 fa: {eyebrow:'خدمات طراحی شکل علمی',title:'ایدهٔ پژوهشی‌ات را',highlight:'به شکل علمی تبدیل کن',description:'خودت در استودیوی BioPlot طراحی کن، یا درخواست طراحی ثبت کن تا طراح متخصص در کنارت باشد. روند کار و به‌روزرسانی سفارش را از حساب کاربری‌ات دنبال کن.',primaryText:'شروع طراحی در استودیو',secondaryText:'ثبت درخواست طراحی',socialProof:'ابزارهای وکتور قابل‌ویرایش · طراحی سفارشی · پیگیری سفارش',fontFamily:'vazirmatn'},
};
export const HOME_TEXT_DEFAULTS: HomeContent = {
 en: {eyebrow:'BIOPLOT FIGURE STUDIO',title:'Your science.',highlight:'Clearly illustrated.',description:'Turn complex biology into clear, editable, publication-ready figures. One focused workspace for your next discovery.',primaryText:'Create scientific figure',secondaryText:'My dashboard',socialProof:'Native vector export · Structured autosave · Persian + English',fontFamily:'inter'},
 fa: {eyebrow:'BIOPLOT FIGURE STUDIO',title:'علم شما؛',highlight:'روشن و تماشایی.',description:'ایده‌های پیچیده زیستی را به شکل‌هایی روشن، قابل‌ویرایش و آماده انتشار تبدیل کن؛ در یک فضای طراحی علمی.',primaryText:'ساخت شکل علمی',secondaryText:'داشبورد من',socialProof:'خروجی وکتور واقعی · ذخیره ساختاریافته · فارسی + انگلیسی',fontFamily:'vazirmatn'},
};
export function normalizeHomeContent(value: unknown): HomeContent {
 const input = value as Partial<HomeContent> | null;
 return Object.fromEntries((['en','fa'] as const).map(locale => {
  const text = Object.fromEntries(HOME_TEXT_FIELDS.map(key => {
   const stored = input?.[locale]?.[key];
   if (typeof stored !== 'string') return [key, HOME_TEXT_DEFAULTS[locale][key]];
   const legacyDefault = stored === PREVIOUS_HOME_TEXT_DEFAULTS[locale][key]
     || key === 'secondaryText' && ['Browse templates','مشاهده قالب‌ها'].includes(stored);
   return [key, legacyDefault ? HOME_TEXT_DEFAULTS[locale][key] : stored];
  })) as HomeText;
  const storedFont = input?.[locale]?.fontFamily;
  const fontFamily = typeof storedFont === 'string' && (HOME_FONT_FAMILIES as readonly string[]).includes(storedFont)
   ? storedFont as HomeFontFamily
   : HOME_TEXT_DEFAULTS[locale].fontFamily;
  return [locale,{...text,fontFamily}];
 })) as HomeContent;
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
