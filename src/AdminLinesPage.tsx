import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { prepareLineUpload } from './lineUpload';
import { LINE_CATEGORY, LINE_CATEGORIES, lineCategoryOf, lineCategoryTags, type LineCategoryId } from './lineCatalog';
import { nativePresetSvg, type DrawLineSettings } from './lineGeometry';
import './admin-native-lines.css';
import { getAdminSessionState } from './adminAuth';
import { CloudAsset, createCloudCategory, deleteCloudAsset, loadAdminCloudAssets, loadCloudCategories, patchCloudAsset, saveCloudAsset } from './cloudAssetLibrary';
import './admin-lines.css';

export { LINE_CATEGORY } from './lineCatalog';

export function AdminLinesPage() {
  const [access, setAccess] = useState<'loading' | 'denied' | 'admin'>('loading');
  const [items, setItems] = useState<CloudAsset[]>([]);
  const [name, setName] = useState('');
  const [nameFa, setNameFa] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [kind,setKind]=useState<'native'|'svg'>('native');
  const [presetId,setPresetId]=useState('curved');
  const [stroke,setStroke]=useState('#087f79');
  const [strokeWidth,setStrokeWidth]=useState(2);
  const [lineStyle,setLineStyle]=useState<DrawLineSettings['lineStyle']>('solid');
  const [startHead,setStartHead]=useState<DrawLineSettings['startHead']>('none');
  const [endHead,setEndHead]=useState<DrawLineSettings['endHead']>('arrow');
  const [category,setCategory]=useState<LineCategoryId>('arrows');
  const [sourceType,setSourceType]=useState<'svg'|'png'>('svg');
  const [loadingFile,setLoadingFile]=useState(false);
  const [svg, setSvg] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const mode:DrawLineSettings['pathMode']=['curved','arc','s-curve','wave','circular','semicircle','rounded-elbow','brace'].includes(presetId)?'curved':['elbow','zigzag','bracket','corner','square-bracket'].includes(presetId)?'polyline':'straight';
  const nativeSettings:DrawLineSettings={stroke,strokeWidth,lineStyle,startHead,endHead,pathMode:mode,presetId};
  const nativeSvg=nativePresetSvg(nativeSettings);

  const refresh = async () => {
    const assets = await loadAdminCloudAssets();
    setItems(assets.filter(item => item.category === LINE_CATEGORY));
  };

  useEffect(() => {
    let live = true;
    void getAdminSessionState().then(async session => {
      if (!live) return;
      if (!session.isAdmin) { setAccess('denied'); return; }
      setAccess('admin');
      try { const assets = await loadAdminCloudAssets(); if (live) setItems(assets.filter(item => item.category === LINE_CATEGORY)); }
      catch (error) { if (live) setNotice(error instanceof Error ? error.message : 'دریافت خطوط انجام نشد.'); }
    }).catch(() => { if (live) setAccess('denied'); });
    return () => { live = false; };
  }, []);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const candidate = event.target.files?.[0];
    event.target.value = '';
    if (!candidate) return;
    setKind('svg');setNotice('');setFile(null);setSvg('');setLoadingFile(true);
    try {
      const prepared=await prepareLineUpload(candidate);
      setFile(candidate);setSvg(prepared.svg);setSourceType(prepared.sourceType);
      setName(current=>current||candidate.name.replace(/\.(svg|png)$/i,'').replace(/[-_]+/g,' '));
    } catch(error){setNotice(error instanceof Error?error.message:'فایل نامعتبر است.');}
    finally{setLoadingFile(false);}
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if(busy||loadingFile)return;
    if (!name.trim() || (kind==='svg'&&(!file||!svg))) return;
    const content=kind==='native'?nativeSvg:svg;
    const source=kind==='native'?new File([content],`${name.trim().replace(/[^a-z0-9_-]+/gi,'-')||'line'}.svg`,{type:'image/svg+xml'}):file;
    if(!source)return;
    setBusy(true); setNotice('');
    try {
      const categories = await loadCloudCategories();
      if (!categories.some(category => category.slug === LINE_CATEGORY)) await createCloudCategory(LINE_CATEGORY, 'خطوط و فلش‌ها');
      await saveCloudAsset({ name: name.trim(), nameFa: nameFa.trim(), category: LINE_CATEGORY, renderSvg: content, sourceType: kind==='native'?'svg':sourceType, synonyms: { en: lineCategoryTags([],category), fa: [] }, reviewStatus: 'draft', premium: false, active: true, featured: false }, source);
      setName(''); setNameFa(''); setSvg(''); setFile(null);
      await refresh();
      setNotice('خط در کتابخانه ابری منتشر شد؛ پس از همگام‌سازی در پنل Lines دیده می‌شود.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'انتشار خط انجام نشد.'); }
    finally { setBusy(false); }
  };

  const toggle = async (item: CloudAsset) => {
    setBusy(true); setNotice('');
    try { await patchCloudAsset(item, { active: item.active === false }); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'تغییر وضعیت انجام نشد.'); }
    finally { setBusy(false); }
  };

  const recategorize=async(item:CloudAsset,next:LineCategoryId)=>{
    setBusy(true);setNotice('');
    try{
      await saveCloudAsset({name:item.name,nameFa:item.nameFa,category:LINE_CATEGORY,description:item.description,descriptionFa:item.descriptionFa,
        synonyms:{...item.synonyms,en:lineCategoryTags(item.synonyms.en,next)},renderSvg:item.svg,sourceType:item.sourceType??'svg',
        reviewStatus:item.reviewStatus,premium:item.premium,active:item.active!==false,featured:!!item.featured,stylePresets:item.stylePresets},null,item);
      await refresh();
    }catch(error){setNotice(error instanceof Error?error.message:'تغییر دسته انجام نشد.');}
    finally{setBusy(false);}
  };

  const remove = async (item: CloudAsset) => {
    if (!window.confirm(`خط «${item.nameFa || item.name}» حذف شود؟`)) return;
    setBusy(true); setNotice('');
    try { await deleteCloudAsset(item); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'حذف انجام نشد.'); }
    finally { setBusy(false); }
  };

  if (access !== 'admin') return <main className="admin-lines-page" dir="rtl"><h1>مدیریت خطوط BioPlot</h1><p>{access === 'loading' ? 'در حال بررسی دسترسی مدیر…' : 'این صفحه فقط برای مدیر فعال است.'}</p><a href="/admin/library">ورود / بازگشت به مدیریت</a></main>;

  return <main className="admin-lines-page" dir="rtl">
    <header className="admin-lines-header"><div><small>BIOPLOT / LINE LIBRARY</small><h1>مدیریت خطوط و فلش‌ها</h1><p>خطوط قابل‌ویرایش و فایل‌های SVG یا PNG را در دستهٔ دلخواه منتشر کنید.</p></div><nav><a href="/admin/library">مدیریت کتابخانه</a><a href="/editor">مشاهده در ادیتور</a></nav></header>
    <div className="admin-lines-body">
      <form className="admin-lines-upload" onSubmit={event => void publish(event)}><h2>افزودن خط جدید</h2><p>الگوی قابل‌ویرایش بسازید یا SVG و PNG اضافه کنید.</p>
      <div className="admin-native-tabs"><button type="button" className={kind==='native'?'active':''} onClick={()=>setKind('native')}>الگوی قابل‌ویرایش</button><button type="button" className={kind==='svg'?'active':''} onClick={()=>setKind('svg')}>آپلود SVG / PNG</button></div>
      {kind==='native'?<div className="admin-native-form">
        <div className="admin-native-preview" aria-label="پیش‌نمایش خط" dangerouslySetInnerHTML={{__html:nativeSvg}}/>
        <label>نوع خط<select value={presetId} onChange={event=>setPresetId(event.target.value)}>{[['straight','مستقیم'],['arrow','فلش'],['double','فلش دوطرفه'],['curved','منحنی'],['arc','کمان'],['s-curve','منحنی S'],['elbow','زاویه‌دار'],['wave','موجی'],['zigzag','زیگزاگ'],['bracket','براکت'],['inhibition','مهاری'],['dashed','خط‌چین'],['dotted','نقطه‌چین'],['circular','دایره‌ای'],['semicircle','نیم‌دایره'],['corner','گوشه'],['rounded-elbow','گوشه گرد'],['square-bracket','براکت مربعی'],['brace','آکولاد']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <div className="admin-native-pair"><label>رنگ<input type="color" value={stroke} onChange={event=>setStroke(event.target.value)}/></label><label>ضخامت<input type="number" min="0.5" max="40" step="0.5" value={strokeWidth} onChange={event=>setStrokeWidth(Math.max(.5,Math.min(40,Number(event.target.value)||.5)))}/></label></div>
        <label>نوع خط<select value={lineStyle} onChange={event=>setLineStyle(event.target.value as DrawLineSettings['lineStyle'])}><option value="solid">پیوسته</option><option value="dashed">خط‌چین</option><option value="dotted">نقطه‌چین</option></select></label>
        <div className="admin-native-pair">{(['start','end'] as const).map(side=><label key={side}>{side==='start'?'ابتدا':'انتها'}<select value={side==='start'?startHead:endHead} onChange={event=>(side==='start'?setStartHead:setEndHead)(event.target.value as DrawLineSettings['startHead'])}>{[['none','بدون سر'],['arrow','فلش'],['circle','دایره'],['bar','مهاری'],['diamond','لوزی']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>)}</div>
      </div>:<label className="admin-lines-file">{svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : <span>+ انتخاب فایل SVG یا PNG</span>}<input type="file" accept=".svg,.png,image/svg+xml,image/png" disabled={loadingFile||busy} onChange={event => void choose(event)} /></label>}<label>دسته‌بندی<select value={category} onChange={event=>setCategory(event.target.value as LineCategoryId)}>{LINE_CATEGORIES.map(item=><option key={item.id} value={item.id}>{item.en} — {item.fa}</option>)}</select></label><label>نام انگلیسی<input required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Molecular inhibition" /></label><label>نام فارسی<input maxLength={100} value={nameFa} onChange={event => setNameFa(event.target.value)} placeholder="مثلاً فلش مهاری" /></label><button className="admin-lines-primary" disabled={busy || loadingFile || !name.trim() || (kind==='svg'&&!file)} type="submit">{busy ? 'در حال ذخیره…' : 'انتشار در Lines'}</button><p className="admin-lines-note">الگوها قابل ویرایش‌اند؛ برای SVG و PNG هم می‌توانید دو سر را روی بوم بکشید تا طول و زاویه تغییر کند. Shift: تراز افقی یا عمودی.</p></form>
      <section className="admin-lines-library"><div className="admin-lines-library-head"><h2>خطوط منتشرشده</h2><span>{items.length} مورد</span></div>{items.length ? <div className="admin-lines-grid">{items.map(item => <article key={item.id} className="admin-lines-item"><div className="admin-lines-preview" dangerouslySetInnerHTML={{ __html: item.svg }} /><strong>{item.nameFa || item.name}</strong><small>{item.name} · {item.sourceType?.toUpperCase()||'SVG'}</small><label>دسته<select aria-label={`دسته ${item.name}`} disabled={busy} value={lineCategoryOf(item)} onChange={event=>void recategorize(item,event.target.value as LineCategoryId)}>{LINE_CATEGORIES.map(category=><option key={category.id} value={category.id}>{category.en} — {category.fa}</option>)}</select></label><div><button type="button" disabled={busy} onClick={() => void toggle(item)}>{item.active === false ? 'انتشار' : 'غیرفعال‌کردن'}</button><button type="button" disabled={busy} className="danger" onClick={() => void remove(item)}>حذف</button></div></article>)}</div> : <p className="admin-lines-empty">هنوز خط سفارشی ثبت نشده است.</p>}</section>
    </div>{notice && <p className="admin-lines-message" role="status">{notice}</p>}
  </main>;
}
