/** Source defaults of the six publicly crawlable static service pages. */
export const SERVICE_SLUGS = ["scientific-illustration","graphical-abstract","scientific-poster"] as const;
export type ServiceSlug = typeof SERVICE_SLUGS[number];
export type ServiceLocale = 'fa' | 'en';
export const SERVICE_FIELD_KEYS = ["metaTitle","metaDescription","eyebrow","title","lead","primaryCta","secondaryCta","imageAlt","imageCaption","detailsTitle","detailsBody","stepsTitle","relatedTitle","feature1","step1","feature2","step2","feature3","step3"] as const;
export type ServiceField = typeof SERVICE_FIELD_KEYS[number];
export type ServicePageFields = Record<ServiceField,string>;
export const SERVICE_DEFAULT_CONTENT: Record<string, ServicePageFields> = {
  "scientific-illustration:fa": {
    "metaTitle": "طراحی شکل علمی مقاله | BioPlot",
    "metaDescription": "خدمات طراحی شکل علمی مقاله در BioPlot؛ تصویرسازی مسیرهای زیستی، سیگنال‌دهی سلولی، مکانیسم‌های مولکولی و شماتیک روش پژوهش.",
    "eyebrow": "BIOPLOT · خدمات طراحی",
    "title": "طراحی شکل علمی مقاله",
    "lead": "اگر توضیح یک مکانیسم یا روش پژوهشی در متن دشوار است، یک تصویر علمی دقیق و خوانا می‌تواند ارتباط میان اجزای اصلی را برای مخاطب روشن‌تر کند.",
    "primaryCta": "ثبت سفارش طراحی شکل علمی",
    "secondaryCta": "اطلاعات بیشتر",
    "imageAlt": "نمونه تصویرسازی علمی از مسیر سیگنال‌دهی سلولی با اجزای مولکولی و فرایند اتوفاژی",
    "imageCaption": "نمونه تصویر: شماتیک مسیر سیگنال‌دهی سلولی و اتوفاژی؛ این اثر صرفاً برای نمایش نوع خدمت است.",
    "detailsTitle": "چه موضوعاتی را می‌توان تصویرسازی کرد؟",
    "detailsBody": "برای شروع کافی است سؤال پژوهش، طرح اولیه یا منابع مرتبط را مشخص کنید. نام اجزای ضروری، ارتباط‌ها، برچسب‌ها و محدودیت‌های اندازه تصویر برای مقاله یا ارائه را در شرح سفارش بنویسید.",
    "stepsTitle": "برای سفارش چه اطلاعاتی آماده کنیم؟",
    "relatedTitle": "سایر خدمات طراحی",
    "feature1": "مسیرهای پیام‌رسانی سلولی و برهم‌کنش‌های مولکولی",
    "step1": "مکانیسم یا سؤال اصلی پژوهش را کوتاه توضیح دهید.",
    "feature2": "نمودار شماتیک مراحل آزمایش و طراحی مطالعه",
    "step2": "منابع، طرح دستی یا فهرست اجزای موردنیاز را ارسال کنید.",
    "feature3": "مکانیسم‌های زیستی، فرایندهای سلولی و مدل‌های مفهومی",
    "step3": "اندازه خروجی، برچسب‌ها و الزامات مجله را مشخص کنید."
  },
  "scientific-illustration:en": {
    "metaTitle": "Scientific Illustration Design | BioPlot",
    "metaDescription": "Scientific illustration for research papers: biological pathways, cell signaling, experimental workflows and molecular mechanisms. Explore BioPlot design services.",
    "eyebrow": "BIOPLOT · DESIGN SERVICES",
    "title": "Scientific Illustration Design",
    "lead": "Turn a complex scientific idea into a clear visual explanation. A well-planned illustration can show a mechanism, experiment or biological process without overwhelming your reader.",
    "primaryCta": "Request a scientific illustration",
    "secondaryCta": "How it works",
    "imageAlt": "Scientific illustration example showing a cell-signaling pathway with molecular components and autophagy",
    "imageCaption": "Example: a schematic of cellular signaling and autophagy. The image is an illustration example, not a claim about your specific research.",
    "detailsTitle": "What can a scientific illustration explain?",
    "detailsBody": "Start with your research question, a rough sketch or key references. Identify the biological entities, their relationships and the message the figure should communicate. The design brief can specify labels, journal dimensions and an intended audience.",
    "stepsTitle": "Preparing your figure brief",
    "relatedTitle": "See other design services",
    "feature1": "Cellular signaling pathways and molecular interactions",
    "step1": "Describe the central mechanism or research question.",
    "feature2": "Experimental workflows and study designs",
    "step2": "Send supporting references, a sketch or a list of required elements.",
    "feature3": "Biological processes, mechanisms and conceptual models",
    "step3": "Mention output size, labels and any journal requirements."
  },
  "graphical-abstract:fa": {
    "metaTitle": "طراحی گرافیکال ابسترکت مقاله | BioPlot",
    "metaDescription": "طراحی گرافیکال ابسترکت و چکیده تصویری مقاله با BioPlot؛ نمایش سؤال، روش و نتیجه اصلی پژوهش در یک تصویر علمی خوانا.",
    "eyebrow": "BIOPLOT · خدمات طراحی",
    "title": "طراحی گرافیکال ابسترکت مقاله",
    "lead": "گرافیکال ابسترکت یا چکیده تصویری، خلاصه‌ای دیداری از پیام اصلی مقاله است. هدف آن نمایش روشن پرسش، رویکرد و نتیجه مهم پژوهش بدون شلوغ‌کردن تصویر است.",
    "primaryCta": "ثبت سفارش گرافیکال ابسترکت",
    "secondaryCta": "اطلاعات بیشتر",
    "imageAlt": "نمونه گرافیکال ابسترکت از اپی‌تلیوم روده، رگ خونی و یک فرایند زیستی",
    "imageCaption": "نمونه تصویر: چکیده تصویری با ساختار اپی‌تلیوم روده و رگ خونی؛ محتوای هر سفارش بر اساس مقاله تعیین می‌شود.",
    "detailsTitle": "یک چکیده تصویری خوب چه ویژگی‌هایی دارد؟",
    "detailsBody": "برای ثبت سفارش، چکیده مقاله، نتیجه کلیدی و راهنمای تصویری مجله را آماده کنید. بهتر است مشخص کنید کدام اجزا باید با دقت علمی کامل نمایش داده شوند و کدام جزئیات را می‌توان ساده‌تر ترسیم کرد.",
    "stepsTitle": "برای سفارش چه اطلاعاتی آماده کنیم؟",
    "relatedTitle": "سایر خدمات طراحی",
    "feature1": "یک پیام اصلی مشخص و قابل‌فهم",
    "step1": "چکیده یا خلاصه کوتاهی از مطالعه را ارائه کنید.",
    "feature2": "توالی بصری ساده از روش تا یافته کلیدی",
    "step2": "روش، یافته مهم و نتیجه اصلی را مشخص کنید.",
    "feature3": "برچسب‌های دقیق و ترکیب‌بندی متناسب با راهنمای مجله",
    "step3": "الزامات ابعاد و فرمت مجله هدف را بفرستید."
  },
  "graphical-abstract:en": {
    "metaTitle": "Graphical Abstract Design | BioPlot",
    "metaDescription": "BioPlot graphical abstract design for research papers. Communicate your study's question, approach and key finding in a concise scientific visual.",
    "eyebrow": "BIOPLOT · DESIGN SERVICES",
    "title": "Graphical Abstract Design",
    "lead": "A graphical abstract is a compact visual summary of a paper. It should guide readers from the research question through the approach to the main finding or conclusion.",
    "primaryCta": "Request a graphical abstract",
    "secondaryCta": "How it works",
    "imageAlt": "Graphical abstract example illustrating intestinal epithelium, a blood vessel and a biological process",
    "imageCaption": "Example: a graphical abstract with intestinal epithelium and a blood vessel. Visual content is illustrative and should be adapted to each manuscript.",
    "detailsTitle": "What makes a useful graphical abstract?",
    "detailsBody": "A useful brief includes your abstract, the most important result and the figure specifications from the journal. Identify which details must remain scientifically exact and which can be simplified for visual clarity.",
    "stepsTitle": "Preparing your graphical abstract brief",
    "relatedTitle": "See other design services",
    "feature1": "A single, clearly defined take-home message",
    "step1": "Share the abstract or a concise summary of the study.",
    "feature2": "A visual sequence with only the essential methods and results",
    "step2": "Highlight the main result, method and scientific conclusion.",
    "feature3": "Readable labels and a layout adapted to the intended journal",
    "step3": "Add the target journal's size and format guidelines."
  },
  "scientific-poster:fa": {
    "metaTitle": "طراحی پوستر علمی و کنفرانسی | BioPlot",
    "metaDescription": "طراحی پوستر علمی، پوستر کنگره و ارائه پژوهشی با BioPlot؛ چینش منظم روش، نتایج، نمودارها و شکل‌های علمی.",
    "eyebrow": "BIOPLOT · خدمات طراحی",
    "title": "طراحی پوستر علمی و کنفرانسی",
    "lead": "پوستر پژوهشی باید در زمان کوتاه پیام مطالعه را منتقل کند. سلسله‌مراتب بصری مناسب و نمودارهای خوانا کمک می‌کنند مخاطب در محیط شلوغ همایش نتیجه را سریع‌تر پیدا کند.",
    "primaryCta": "ثبت سفارش طراحی پوستر علمی",
    "secondaryCta": "اطلاعات بیشتر",
    "imageAlt": "نمونه پوستر علمی همایش با چیدمان چندستونی، نمودارهای نتایج پژوهش و متن توضیحی",
    "imageCaption": "نمونه تصویر: پوستر علمی چندستونی با نمودارها، تصاویر پژوهشی و بخش نتایج.",
    "detailsTitle": "اجزای مهم پوستر پژوهشی چیست؟",
    "detailsBody": "برای شروع، عنوان، نویسندگان، چکیده، تصاویر و اندازه موردنیاز کنگره را آماده کنید. مهم‌ترین یافته را مشخص کنید تا فضای بیشتری به آن اختصاص یابد و الزامات قالب همایش رعایت شود.",
    "stepsTitle": "برای سفارش چه اطلاعاتی آماده کنیم؟",
    "relatedTitle": "سایر خدمات طراحی",
    "feature1": "عنوان و سؤال پژوهش همراه با مقدمه مختصر",
    "step1": "چکیده نهایی، عنوان، نویسندگان و وابستگی سازمانی را جمع‌آوری کنید.",
    "feature2": "بخش‌بندی قابل‌دنبال‌کردن برای روش، یافته‌ها و نتیجه‌گیری",
    "step2": "شکل‌ها و نمودارهای اصلی موردنیاز برای توضیح یافته‌ها را انتخاب کنید.",
    "feature3": "نمودارها، تصاویر علمی و توضیحات با اندازه خوانا",
    "step3": "ابعاد پوستر و دستورالعمل رسمی کنفرانس را ارسال کنید."
  },
  "scientific-poster:en": {
    "metaTitle": "Scientific Poster Design | BioPlot",
    "metaDescription": "Scientific conference poster design by BioPlot. Organize research background, methods, results and figures into a clear academic poster.",
    "eyebrow": "BIOPLOT · DESIGN SERVICES",
    "title": "Scientific Poster Design",
    "lead": "A research poster needs to communicate a study quickly in a busy conference setting. Strong hierarchy, well-chosen charts and readable labels make findings easier to follow.",
    "primaryCta": "Request a scientific poster",
    "secondaryCta": "How it works",
    "imageAlt": "Scientific conference poster example showing a multi-column layout with research charts, text and results",
    "imageCaption": "Example: an academic conference poster containing plots, microscopy-style visuals and research results.",
    "detailsTitle": "What goes into a research poster?",
    "detailsBody": "Prepare your study title, authorship, abstract, figures and the conference poster dimensions. Decide which result deserves the most visual emphasis and check the organizer's template or branding rules before design.",
    "stepsTitle": "Preparing your conference poster brief",
    "relatedTitle": "See other design services",
    "feature1": "A clear title, research question and concise background",
    "step1": "Collect the final abstract, headings, author list and institutional details.",
    "feature2": "Methods, results and conclusions arranged for scanning",
    "step2": "Choose the charts, tables and images needed to explain your results.",
    "feature3": "Charts, scientific figures and captions at readable sizes",
    "step3": "Provide the required poster dimensions and conference guidelines."
  }
};
export function servicePageKey(slug: ServiceSlug, locale: ServiceLocale) {return `${slug}:${locale}`;}
export function mergeServicePageContent(key:string, stored:unknown): ServicePageFields {
 const defaults = SERVICE_DEFAULT_CONTENT[key];
 if (!defaults) throw new Error('Unknown service page');
 if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {...defaults};
 const data = stored as Record<string, unknown>;
 return Object.fromEntries(SERVICE_FIELD_KEYS.map(field =>
   [field, typeof data[field]==='string' ? data[field] : defaults[field]]
 )) as ServicePageFields;
}
