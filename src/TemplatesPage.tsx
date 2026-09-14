import { useEffect, useMemo, useRef, useState } from 'react';
import { createHomeTemplateDocument, homeTemplates, type HomeTemplateId } from './homeTemplates';
import { projects } from './persistence';
import { homeTemplateCategoryMap } from './scientificVisualContentModel';
import { scientificVisualCategories, type ScientificVisualCategory, type ScientificVisualCategoryId } from './scientificVisualTaxonomy';
import { StudioIcon, type StudioIconName } from './StudioIcon';
import { templatePublicationGuides } from './templateGuideContent';
import './templates-page.css';

type Locale = 'en' | 'fa';

type CategoryVisual = {
  icon: StudioIconName;
  label: string;
};

const categoryVisuals: Record<ScientificVisualCategoryId, CategoryVisual> = {
  'molecular-mechanisms': { icon: 'figure', label: 'MOLECULAR' },
  'pathways-networks': { icon: 'connector', label: 'NETWORK' },
  'molecular-cellular-interactions': { icon: 'cell', label: 'INTERACTION' },
  'processes-workflows': { icon: 'flask', label: 'WORKFLOW' },
  'biological-systems': { icon: 'layers', label: 'SYSTEMS' },
  'devices-bioengineering': { icon: 'grid', label: 'DEVICE' },
  'experimental-methods': { icon: 'flask', label: 'METHODS' },
  'disease-therapeutics': { icon: 'pill', label: 'THERAPY' },
  'anatomy-spatial-biology': { icon: 'image', label: 'SPATIAL' },
  'omics-systems-biology': { icon: 'graph', label: 'OMICS' },
  'study-design': { icon: 'clock', label: 'STUDY' },
  'conceptual-models': { icon: 'sparkle', label: 'CONCEPT' },
  'graphical-abstracts': { icon: 'templates', label: 'ABSTRACT' },
};

function categoryTemplates(categoryId: ScientificVisualCategoryId) {
  return homeTemplates.filter(template => homeTemplateCategoryMap[template.id] === categoryId);
}

function TemplateVisual({ category, index }: { category: ScientificVisualCategory; index: number }) {
  const visual = categoryVisuals[category.id];
  return <div className={`tkh-visual tkh-visual-${(index % 6) + 1}`} aria-hidden="true">
    <span className="tkh-visual-grid"/>
    <span className="tkh-visual-orbit orbit-a"/>
    <span className="tkh-visual-orbit orbit-b"/>
    <span className="tkh-visual-node node-a"/>
    <span className="tkh-visual-node node-b"/>
    <span className="tkh-visual-node node-c"/>
    <span className="tkh-visual-icon"><StudioIcon name={visual.icon} size={36} weight="duotone"/></span>
    <span className="tkh-visual-label">{visual.label}</span>
    <span className="tkh-visual-index">{String(index + 1).padStart(2, '0')}</span>
  </div>;
}

export function TemplatesPage() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<ScientificVisualCategoryId | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const fa = locale === 'fa';

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale, fa]);

  const filteredCategories = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale === 'fa' ? 'fa-IR' : 'en-US');
    if (!needle) return scientificVisualCategories;
    return scientificVisualCategories.filter(category => {
      const haystack = [
        category.title.en, category.title.fa, category.description.en, category.description.fa,
        ...category.tags,
        ...category.archetypes.flatMap(item => [item.en, item.fa]),
      ].join(' ').toLocaleLowerCase(locale === 'fa' ? 'fa-IR' : 'en-US');
      return haystack.includes(needle);
    });
  }, [query, locale]);

  const activeCategory = useMemo(
    () => scientificVisualCategories.find(category => category.id === activeCategoryId) ?? null,
    [activeCategoryId],
  );

  function openGuide(categoryId: ScientificVisualCategoryId) {
    setActiveCategoryId(categoryId);
    window.requestAnimationFrame(() => articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function startTemplate(templateId: HomeTemplateId, categoryId?: ScientificVisualCategoryId) {
    const document = createHomeTemplateDocument(templateId, locale);
    if (categoryId) document.metadata.tags = Array.from(new Set([...document.metadata.tags, `category:${categoryId}`]));
    await projects.save(document);
    window.location.href = `editor.html?id=${encodeURIComponent(document.id)}`;
  }

  async function startCategory(category: ScientificVisualCategory) {
    const templates = categoryTemplates(category.id);
    if (templates[0]) return startTemplate(templates[0].id, category.id);
    const document = createHomeTemplateDocument('blank', locale);
    document.title = fa ? `${category.shortTitle.fa} جدید` : `New ${category.shortTitle.en}`;
    document.metadata.tags = Array.from(new Set([...document.metadata.tags, `category:${category.id}`]));
    await projects.save(document);
    window.location.href = `editor.html?id=${encodeURIComponent(document.id)}`;
  }

  return <div className="tkh-shell" dir={fa ? 'rtl' : 'ltr'}>
    <header className="tkh-topbar">
      <a className="tkh-brand" href="index.html#home" aria-label="BioPlot home"><span>B</span><div><b>BioPlot</b><small>Scientific Figure Studio</small></div></a>
      <nav className="tkh-nav" aria-label="Primary navigation">
        <a href="index.html#home">{fa ? 'خانه' : 'Home'}</a>
        <a className="active" href="templates.html">{fa ? 'قالب‌ها و راهنماها' : 'Templates & guides'}</a>
        <a href="editor.html">{fa ? 'Figure Studio' : 'Figure Studio'}</a>
      </nav>
      <button className="tkh-language" onClick={() => setLocale(fa ? 'en' : 'fa')}>{fa ? 'EN' : 'FA'}</button>
    </header>

    <main>
      <section className="tkh-hero">
        <div className="tkh-hero-copy">
          <span className="tkh-eyebrow"><i/>BIOPLOT KNOWLEDGE HUB</span>
          <h1>{fa ? <>کتابخانه طراحی <em>شکل‌های علمی</em></> : <>The scientific figure <em>design library</em></>}</h1>
          <p>{fa ? '۱۳ الگوی اصلی شکل علمی را نه فقط به‌عنوان قالب، بلکه مثل یک راهنمای طراحی و وبلاگ تخصصی ببین؛ با تمرکز بر وضوح برای داور، منطق علمی، آمادگی ارسال و کاهش اصلاحات مربوط به شکل.' : 'Explore 13 core scientific visual formats as both editable starting points and design articles—focused on reviewer clarity, scientific logic, submission readiness and fewer avoidable figure revisions.'}</p>
          <div className="tkh-hero-meta"><span><StudioIcon name="check" size={16}/>{fa ? '۱۳ راهنمای تخصصی' : '13 focused guides'}</span><span><StudioIcon name="check" size={16}/>{fa ? 'استانداردهای مجلات معتبر' : 'Journal-aware standards'}</span><span><StudioIcon name="check" size={16}/>{fa ? 'ورود مستقیم به Figure Studio' : 'Open directly in Figure Studio'}</span></div>
        </div>
        <div className="tkh-hero-card">
          <div className="tkh-score-ring"><strong>01</strong><span>{fa ? 'اصل پایه' : 'baseline'}</span></div>
          <div><small>{fa ? 'هدف این بخش' : 'WHY THIS EXISTS'}</small><h2>{fa ? 'شکل خوب، ادعای علمی را سریع‌تر قابل‌داوری می‌کند.' : 'A strong figure makes the scientific claim easier to review.'}</h2><p>{fa ? 'این راهنماها تضمین پذیرش نیستند؛ اما شکل را برای خوانایی، integrity و الزامات فنی رایج آماده‌تر می‌کنند.' : 'These guides cannot guarantee acceptance; they help make figures clearer, more defensible and technically ready for submission.'}</p></div>
        </div>
      </section>

      <section className="tkh-library" id="library" aria-labelledby="library-title">
        <div className="tkh-library-head"><div><span className="tkh-section-kicker">13 VISUAL FAMILIES</span><h2 id="library-title">{fa ? 'الگوی شکل علمی را انتخاب کن' : 'Choose the scientific story you need to tell'}</h2><p>{fa ? 'هر کارت یک نقطه شروع طراحی + یک مقاله کوتاه برای ساخت شکل publication-ready است.' : 'Every card combines a visual starting point with a short, practical article for publication-ready design.'}</p></div><label className="tkh-search"><StudioIcon name="search" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={fa ? 'جست‌وجو: pathway، omics، study design…' : 'Search: pathway, omics, study design…'}/>{query && <button onClick={() => setQuery('')} aria-label="Clear"><StudioIcon name="close" size={15}/></button>}</label></div>

        <div className="tkh-grid">{filteredCategories.map(category => {
          const index = scientificVisualCategories.findIndex(item => item.id === category.id);
          const guide = templatePublicationGuides[category.id];
          const templates = categoryTemplates(category.id);
          return <article className="tkh-card" key={category.id}>
            <TemplateVisual category={category} index={index}/>
            <div className="tkh-card-content">
              <div className="tkh-card-topline"><span>{category.shortTitle[locale]}</span><em>{guide.readTime} {fa ? 'دقیقه مطالعه' : 'min read'}</em></div>
              <h3>{category.title[locale]}</h3>
              <p className="tkh-card-description">{category.description[locale]}</p>
              <div className="tkh-card-lens"><small>{fa ? 'تمرکز برای داوری' : 'REVIEWER LENS'}</small><p>{guide.publicationLens[locale]}</p></div>
              <div className="tkh-chip-row">{category.archetypes.slice(0, 3).map(item => <span key={item.en}>{item[locale]}</span>)}</div>
              <div className="tkh-card-footer"><button className="tkh-read" onClick={() => openGuide(category.id)}>{fa ? 'خواندن راهنمای طراحی' : 'Read design guide'}<StudioIcon name="arrow" size={15}/></button><button className="tkh-start" onClick={() => startCategory(category)} title={templates.length ? templates[0].title[locale] : (fa ? 'شروع صفحه خالی' : 'Start blank')}><StudioIcon name="plus" size={15}/>{fa ? 'شروع طراحی' : 'Start'}</button></div>
            </div>
          </article>;
        })}</div>
        {filteredCategories.length === 0 && <div className="tkh-no-results"><StudioIcon name="search" size={34}/><h3>{fa ? 'دسته‌ای پیدا نشد' : 'No visual family found'}</h3><p>{fa ? 'نام روش، حوزه یا نوع شکل را با عبارت دیگری جست‌وجو کن.' : 'Try another method, field or figure type.'}</p><button onClick={() => setQuery('')}>{fa ? 'نمایش همه ۱۳ مورد' : 'Show all 13'}</button></div>}
      </section>

      {activeCategory && (() => {
        const guide = templatePublicationGuides[activeCategory.id];
        const templates = categoryTemplates(activeCategory.id);
        const index = scientificVisualCategories.findIndex(item => item.id === activeCategory.id);
        return <section ref={articleRef} className="tkh-article" aria-labelledby="guide-title">
          <div className="tkh-article-rail"><button className="tkh-article-close" onClick={() => setActiveCategoryId(null)}><StudioIcon name="close" size={17}/>{fa ? 'بستن راهنما' : 'Close guide'}</button><span>{String(index + 1).padStart(2, '0')} / 13</span><b>{activeCategory.shortTitle[locale]}</b><p>{guide.readTime} {fa ? 'دقیقه مطالعه' : 'minute read'}</p><div className="tkh-mini-toc"><a href="#guide-layout">{fa ? 'ساختار پیشنهادی' : 'Recommended layout'}</a><a href="#guide-rules">{fa ? 'اصول طراحی' : 'Design rules'}</a><a href="#guide-pitfalls">{fa ? 'اشتباهات رایج' : 'Common pitfalls'}</a><a href="#guide-reviewer">{fa ? 'چک داور' : 'Reviewer check'}</a></div></div>
          <article className="tkh-article-main">
            <div className="tkh-article-hero"><div><span className="tkh-section-kicker">DESIGN GUIDE · {categoryVisuals[activeCategory.id].label}</span><h2 id="guide-title">{activeCategory.title[locale]}</h2><p>{activeCategory.description[locale]}</p></div><TemplateVisual category={activeCategory} index={index}/></div>

            <div className="tkh-callout"><span><StudioIcon name="check" size={22}/></span><div><small>{fa ? 'هدف publication-ready' : 'PUBLICATION-READY GOAL'}</small><p>{guide.publicationLens[locale]}</p></div></div>

            <section className="tkh-article-section" id="guide-layout"><span className="tkh-article-number">01</span><div><small>{fa ? 'ساختار پیشنهادی' : 'RECOMMENDED COMPOSITION'}</small><h3>{fa ? 'اول معماری شکل را حل کن، بعد جزئیات را اضافه کن.' : 'Solve the composition before adding detail.'}</h3><p>{guide.layout[locale]}</p><div className="tkh-archetypes">{activeCategory.archetypes.map(item => <span key={item.en}>{item[locale]}</span>)}</div></div></section>

            <section className="tkh-article-section" id="guide-rules"><span className="tkh-article-number">02</span><div><small>{fa ? 'اصول طراحی' : 'DESIGN RULES'}</small><h3>{fa ? 'چهار تصمیمی که کیفیت علمی و بصری را بالا می‌برد' : 'Four decisions that improve scientific and visual clarity'}</h3><ol className="tkh-rule-list">{guide.rules.map((rule, ruleIndex) => <li key={rule.en}><span>{String(ruleIndex + 1).padStart(2, '0')}</span><p>{rule[locale]}</p></li>)}</ol></div></section>

            <section className="tkh-article-section" id="guide-pitfalls"><span className="tkh-article-number">03</span><div><small>{fa ? 'اشتباهات رایج' : 'COMMON PITFALLS'}</small><h3>{fa ? 'این‌ها شکل را شلوغ، مبهم یا علمی‌بودنش را ضعیف می‌کنند' : 'These choices make figures harder to trust or review'}</h3><div className="tkh-pitfall-grid">{guide.pitfalls.map((pitfall, pitfallIndex) => <article key={pitfall.en}><b>0{pitfallIndex + 1}</b><p>{pitfall[locale]}</p></article>)}</div></div></section>

            <section className="tkh-article-section" id="guide-reviewer"><span className="tkh-article-number">04</span><div><small>{fa ? 'چک داور' : 'REVIEWER CHECK'}</small><h3>{fa ? 'قبل از export این سه سؤال را جواب بده' : 'Answer these three questions before export'}</h3><div className="tkh-review-list">{guide.reviewerChecks.map(check => <div key={check.en}><StudioIcon name="check" size={17}/><p>{check[locale]}</p></div>)}</div></div></section>

            <section className="tkh-starter-box"><div><span className="tkh-section-kicker">FIGURE STUDIO</span><h3>{fa ? 'از راهنما مستقیم وارد طراحی شو' : 'Turn the guide into an editable figure'}</h3><p>{templates.length ? (fa ? 'برای این دسته قالب آماده داریم؛ آن را باز کن و همه اجزا را تغییر بده.' : 'This category has an editable starter template. Open it and change every object.') : (fa ? 'قالب تخصصی این دسته هنوز اضافه نشده؛ با canvas دسته‌بندی‌شده شروع کن.' : 'A dedicated starter is not available yet; begin with a categorized blank canvas.')}</p></div><div className="tkh-starter-actions">{templates.map(template => <button key={template.id} onClick={() => startTemplate(template.id, activeCategory.id)}><StudioIcon name="templates" size={18}/><span><b>{template.title[locale]}</b><small>{template.description[locale]}</small></span><StudioIcon name="arrow" size={15}/></button>)}<button className="blank" onClick={() => startCategory(activeCategory)}><StudioIcon name="plus" size={18}/><span><b>{fa ? 'شروع canvas این دسته' : 'Start category canvas'}</b><small>{fa ? 'صفحه تمیز با taxonomy همین دسته' : 'Clean canvas tagged to this visual family'}</small></span><StudioIcon name="arrow" size={15}/></button></div></section>

            <div className="tkh-article-footer"><div><b>{fa ? 'موضوعات بعدی این راهنما' : 'Next articles in this topic'}</b>{activeCategory.guideTopics.map(topic => <span key={topic.en}>{topic[locale]}</span>)}</div><button onClick={() => { setActiveCategoryId(null); document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' }); }}>{fa ? 'بازگشت به ۱۳ دسته' : 'Back to all 13 guides'}<StudioIcon name="arrow" size={14}/></button></div>
          </article>
        </section>;
      })()}
    </main>

    <footer className="tkh-footer"><div><b>BioPlot</b><span>{fa ? 'طراحی شکل علمی برای پژوهشگران' : 'Scientific figure design for researchers'}</span></div><p>{fa ? 'همیشه راهنمای شکل مجله هدف را قبل از ارسال نهایی بررسی کن.' : 'Always check the target journal’s current artwork instructions before final submission.'}</p></footer>
  </div>;
}