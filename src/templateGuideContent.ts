import type { LocalizedText, ScientificVisualCategoryId } from './scientificVisualTaxonomy';

const text = (en: string, fa: string): LocalizedText => ({ en, fa });

export interface TemplatePublicationGuide {
  publicationLens: LocalizedText;
  layout: LocalizedText;
  rules: LocalizedText[];
  pitfalls: LocalizedText[];
  reviewerChecks: LocalizedText[];
  readTime: number;
}

export const publicationBaseline = [
  text('Design at the final journal column size and verify that labels, lines and symbols remain readable after reduction.', 'شکل را در اندازه نهایی ستون مجله طراحی کن و مطمئن شو بعد از کوچک‌شدن، برچسب‌ها، خطوط و نمادها همچنان خوانا هستند.'),
  text('Use one consistent sans-serif type family, a restrained visual hierarchy and colorblind-safe encoding instead of decorative color.', 'از یک خانواده فونت sans-serif ثابت، سلسله‌مراتب بصری محدود و رنگ‌های قابل‌تشخیص برای افراد دارای اختلال دید رنگ استفاده کن؛ نه رنگ‌های صرفاً تزئینی.'),
  text('Keep line art and text editable/vector whenever possible; use genuinely high-resolution raster images rather than artificially upscaling them.', 'تا حد امکان متن و line art را وکتور و قابل‌ویرایش نگه دار؛ تصاویر raster باید واقعاً باکیفیت باشند و صرفاً به‌صورت مصنوعی upscale نشوند.'),
  text('Protect image integrity: never crop, splice, recolor or enhance primary data in a way that can change scientific interpretation.', 'یکپارچگی تصویر را حفظ کن: crop، splice، تغییر رنگ یا enhancement داده خام نباید باعث تغییر برداشت علمی شود.'),
  text('Make the figure understandable with its legend: define symbols, statistics, scale bars, groups and abbreviations consistently.', 'شکل باید همراه legend قابل‌فهم باشد: نمادها، آمار، scale bar، گروه‌ها و اختصارات را به‌صورت ثابت و روشن تعریف کن.'),
];

export const journalSources = [
  { label: 'Nature figure guidance', href: 'https://www.nature.com/nature/for-authors/final-submission' },
  { label: 'PLOS figure requirements', href: 'https://journals.plos.org/plosone/s/figures' },
  { label: 'Cell Press graphical abstract guide', href: 'https://crosstalk.cell.com/hubfs/Files/GA_guide.pdf' },
];

export const templatePublicationGuides: Record<ScientificVisualCategoryId, TemplatePublicationGuide> = {
  'molecular-mechanisms': {
    publicationLens: text('A reviewer should understand the causal chain in seconds: trigger → target → cellular event → biological outcome.', 'داور باید در چند ثانیه زنجیره علت‌ومعلولی را بفهمد: محرک ← هدف ← رویداد سلولی ← پیامد زیستی.'),
    layout: text('Use a single dominant reading direction, separate cellular compartments and reserve stronger color/weight for the main causal route.', 'یک جهت خواندن غالب داشته باش، کمپارتمان‌های سلولی را جدا کن و رنگ یا ضخامت قوی‌تر را فقط برای مسیر علّی اصلی نگه دار.'),
    rules: [
      text('Limit the main story to the mechanism needed for the paper’s claim; move secondary biology to a supporting panel or supplement.', 'داستان اصلی را به مکانیسم لازم برای ادعای مقاله محدود کن؛ زیست‌شناسی فرعی را به پنل کمکی یا supplement منتقل کن.'),
      text('Place receptors, organelles and transcriptional events in biologically plausible compartments.', 'گیرنده‌ها، اندامک‌ها و رویدادهای رونویسی را در کمپارتمان زیستی درست قرار بده.'),
      text('Use consistent arrow semantics for activation, inhibition, transport and uncertain relationships.', 'برای activation، inhibition، انتقال و روابط نامطمئن از منطق ثابت فلش‌ها استفاده کن.'),
      text('Differentiate measured evidence from proposed mechanism with line style, opacity or explicit labels.', 'شواهد اندازه‌گیری‌شده را از مکانیسم پیشنهادی با نوع خط، opacity یا برچسب روشن جدا کن.'),
    ],
    pitfalls: [
      text('Turning the figure into a complete pathway database instead of a focused argument.', 'تبدیل شکل به پایگاه کامل pathway به‌جای یک استدلال متمرکز.'),
      text('Decorative gradients or icons that compete with biological meaning.', 'گرادیان‌ها یا آیکون‌های تزئینی که با معنای زیستی رقابت می‌کنند.'),
      text('Mixing activation and inhibition arrows without a legend.', 'ترکیب فلش‌های activation و inhibition بدون legend.'),
    ],
    reviewerChecks: [
      text('Can the central mechanism be summarized from the figure without reading Results?', 'آیا مکانیسم مرکزی بدون خواندن Results از روی شکل قابل خلاصه‌کردن است؟'),
      text('Are localization and directionality scientifically defensible?', 'آیا localization و جهت روابط از نظر علمی قابل دفاع است؟'),
      text('Does every visual element support the manuscript’s claim?', 'آیا هر عنصر بصری از ادعای مقاله پشتیبانی می‌کند؟'),
    ],
    readTime: 5,
  },
  'pathways-networks': {
    publicationLens: text('Show network logic without forcing the reader to decode a hairball of edges.', 'منطق شبکه را نشان بده بدون این‌که خواننده مجبور شود یک توده درهم از edgeها را رمزگشایی کند.'),
    layout: text('Organize nodes into functional modules, keep the dominant pathway visually privileged and route edges to minimize crossings.', 'نودها را در ماژول‌های عملکردی گروه‌بندی کن، مسیر غالب را برجسته نگه دار و edgeها را طوری مسیر بده که تقاطع کم شود.'),
    rules: [
      text('Use node shape/color to encode one dimension at a time, such as molecule class or regulation state.', 'شکل/رنگ نود را هر بار فقط برای یک بُعد مثل نوع مولکول یا وضعیت تنظیمی استفاده کن.'),
      text('Keep edge meaning consistent and explain nonstandard edges in a compact legend.', 'معنای edgeها را ثابت نگه دار و edgeهای غیرمعمول را در legend کوتاه توضیح بده.'),
      text('Use hierarchy or spatial grouping to reveal modules before individual interactions.', 'با hierarchy یا گروه‌بندی فضایی ابتدا ماژول‌ها و سپس تعاملات جزئی را قابل‌درک کن.'),
      text('If the network is data-derived, visually distinguish confidence, significance or evidence level only when those encodings are documented.', 'اگر شبکه data-derived است، confidence، significance یا سطح شواهد را فقط زمانی کدگذاری کن که تعریف آن روشن باشد.'),
    ],
    pitfalls: [
      text('Too many crossings and equally weighted edges.', 'تقاطع زیاد و edgeهایی با وزن بصری یکسان.'),
      text('Using a rainbow palette for categories or expression values.', 'استفاده از پالت رنگین‌کمانی برای دسته‌ها یا expression.'),
      text('Showing every known interaction even when it is irrelevant to the study.', 'نمایش همه تعاملات شناخته‌شده حتی وقتی به مطالعه مربوط نیستند.'),
    ],
    reviewerChecks: [
      text('Is the main path visible at thumbnail size?', 'آیا مسیر اصلی در اندازه thumbnail هم دیده می‌شود؟'),
      text('Can modules be identified before reading node labels?', 'آیا ماژول‌ها قبل از خواندن نام نودها قابل تشخیص‌اند؟'),
      text('Are data-derived claims visually separated from background knowledge?', 'آیا ادعاهای data-derived از دانش زمینه‌ای جدا شده‌اند؟'),
    ],
    readTime: 5,
  },
  'molecular-cellular-interactions': {
    publicationLens: text('Make sender, receiver, mediator and biological consequence immediately explicit.', 'فرستنده، گیرنده، واسطه و پیامد زیستی را بلافاصله روشن کن.'),
    layout: text('Use spatial proximity to show real contact and directional connectors for secreted or indirect communication.', 'برای تماس واقعی از مجاورت فضایی و برای ارتباط ترشحی یا غیرمستقیم از connector جهت‌دار استفاده کن.'),
    rules: [
      text('Keep ligands and receptors adjacent to the correct cell membrane or compartment.', 'لیگاند و گیرنده را کنار غشا یا کمپارتمان درست قرار بده.'),
      text('Use consistent cell silhouettes and reserve labels for identity-defining markers.', 'سیلوئت سلول‌ها را ثابت نگه دار و برچسب را برای مارکرهای تعیین‌کننده هویت استفاده کن.'),
      text('Separate direct physical interaction from downstream signaling.', 'تعامل فیزیکی مستقیم را از signaling پایین‌دستی جدا کن.'),
      text('When multiple cell types are present, group interactions by biological question rather than by color alone.', 'وقتی چند نوع سلول وجود دارد، تعاملات را بر اساس سؤال زیستی گروه‌بندی کن نه صرفاً رنگ.'),
    ],
    pitfalls: [
      text('Floating receptors or ligands with ambiguous cellular ownership.', 'گیرنده یا لیگاندهای شناور با مالکیت سلولی نامشخص.'),
      text('Too many arrows crossing between cells.', 'فلش‌های زیاد و متقاطع بین سلول‌ها.'),
      text('Using cell artwork as decoration instead of encoding identity or state.', 'استفاده از تصویر سلول فقط به‌عنوان تزئین به‌جای نمایش هویت یا state.'),
    ],
    reviewerChecks: [
      text('Can a reader identify who signals to whom without the legend?', 'آیا خواننده بدون legend می‌فهمد چه سلولی به چه سلولی سیگنال می‌دهد؟'),
      text('Are interaction types visually unambiguous?', 'آیا انواع تعامل از نظر بصری مبهم نیستند؟'),
      text('Is cellular context biologically plausible?', 'آیا زمینه سلولی از نظر زیستی منطقی است؟'),
    ],
    readTime: 4,
  },
  'processes-workflows': {
    publicationLens: text('A methods figure should make the experimental sequence reproducible at a glance without becoming a protocol manual.', 'شکل روش باید توالی آزمایش را در یک نگاه قابل‌فهم کند بدون این‌که به دفترچه پروتکل تبدیل شود.'),
    layout: text('Use one reading direction, evenly spaced steps and clear branch points only where the experimental design truly branches.', 'یک جهت خواندن، فاصله منظم مراحل و branch فقط در نقاطی داشته باش که طراحی آزمایش واقعاً شاخه می‌شود.'),
    rules: [
      text('Give each step one action and one clear visual anchor.', 'برای هر مرحله یک عمل و یک لنگر بصری روشن داشته باش.'),
      text('Expose sample identity, key intervention and endpoint; omit routine bench detail.', 'هویت نمونه، مداخله کلیدی و endpoint را نشان بده؛ جزئیات روتین آزمایشگاه را حذف کن.'),
      text('Use time labels only where timing is scientifically meaningful.', 'برچسب زمان را فقط جایی استفاده کن که زمان از نظر علمی مهم است.'),
      text('Keep repeated steps visually identical so deviations are obvious.', 'مراحل تکرارشونده را از نظر بصری یکسان نگه دار تا تفاوت‌ها واضح شوند.'),
    ],
    pitfalls: [
      text('Mixing workflow steps with results in the same visual layer.', 'ترکیب مراحل workflow با نتایج در یک لایه بصری.'),
      text('Branches that do not correspond to real allocation or decision points.', 'شاخه‌هایی که متناظر با تخصیص یا تصمیم واقعی نیستند.'),
      text('Long prose inside every step.', 'متن طولانی داخل هر مرحله.'),
    ],
    reviewerChecks: [
      text('Could a reviewer reconstruct the study sequence?', 'آیا داور می‌تواند توالی مطالعه را بازسازی کند؟'),
      text('Are groups, samples and endpoints named consistently with Methods?', 'آیا نام گروه‌ها، نمونه‌ها و endpointها با Methods یکسان است؟'),
      text('Are timing and branch points scientifically accurate?', 'آیا زمان‌بندی و branch pointها دقیق‌اند؟'),
    ],
    readTime: 4,
  },
  'biological-systems': {
    publicationLens: text('Compress a complex system into a small number of meaningful spatial zones and relationships.', 'یک سیستم پیچیده را به تعداد کمی ناحیه فضایی و رابطه معنادار فشرده کن.'),
    layout: text('Start with system-level zones, then reveal only the components necessary to support the paper’s systems-level claim.', 'از ناحیه‌های سطح سیستم شروع کن و فقط اجزایی را نشان بده که برای ادعای سیستم‌محور مقاله لازم‌اند.'),
    rules: [
      text('Group components by organ, niche, compartment or functional module.', 'اجزا را بر اساس اندام، niche، کمپارتمان یا ماژول عملکردی گروه‌بندی کن.'),
      text('Use scale transitions intentionally and clearly mark zoom relationships.', 'تغییر مقیاس را هدفمند انجام بده و رابطه zoom را روشن علامت‌گذاری کن.'),
      text('Keep spatial position biologically meaningful whenever location is part of the claim.', 'هرجا location بخشی از ادعاست، موقعیت فضایی را از نظر زیستی معنادار نگه دار.'),
      text('Prioritize cross-compartment relationships that explain the system behavior.', 'روابط بین کمپارتمان‌هایی را برجسته کن که رفتار سیستم را توضیح می‌دهند.'),
    ],
    pitfalls: [
      text('Displaying every cell type at equal visual priority.', 'نمایش همه انواع سلول با اولویت بصری یکسان.'),
      text('Unmarked jumps between organ, tissue and cell scale.', 'پرش بدون علامت بین مقیاس اندام، بافت و سلول.'),
      text('Decorative anatomy that does not carry information.', 'آناتومی تزئینی که اطلاعاتی منتقل نمی‌کند.'),
    ],
    reviewerChecks: [
      text('Is the system boundary clear?', 'آیا مرز سیستم روشن است؟'),
      text('Are scale transitions obvious and scientifically defensible?', 'آیا تغییر مقیاس واضح و از نظر علمی قابل دفاع است؟'),
      text('Can the key cross-talk be identified quickly?', 'آیا cross-talk کلیدی سریع قابل تشخیص است؟'),
    ],
    readTime: 5,
  },
  'devices-bioengineering': {
    publicationLens: text('Explain architecture, flow and sensing principle without turning the schematic into an engineering drawing.', 'معماری، جریان و اصل sensing را توضیح بده بدون این‌که شماتیک به نقشه مهندسی شلوغ تبدیل شود.'),
    layout: text('Choose one primary view—cross-section, exploded or top view—and use callouts only for components needed to explain function.', 'یک نمای اصلی—مقطع، exploded یا top view—انتخاب کن و callout را فقط برای اجزای لازم جهت توضیح عملکرد به‌کار ببر.'),
    rules: [
      text('Keep fluid direction, sample entry and readout path visually continuous.', 'جهت جریان، ورودی نمونه و مسیر readout را پیوسته و روشن نگه دار.'),
      text('Distinguish functional layers by restrained color and consistent material semantics.', 'لایه‌های عملکردی را با رنگ محدود و معنای ثابت مواد متمایز کن.'),
      text('Show dimensions only when they affect performance or interpretation.', 'ابعاد را فقط وقتی نشان بده که بر عملکرد یا تفسیر اثر دارند.'),
      text('Align device labels with terminology used in Methods and supplementary schematics.', 'برچسب اجزای device را با اصطلاحات Methods و شماتیک‌های supplement هماهنگ کن.'),
    ],
    pitfalls: [
      text('Fake 3D perspective that obscures layer relationships.', 'نمای سه‌بعدی مصنوعی که رابطه لایه‌ها را مبهم می‌کند.'),
      text('Mixing exact dimensions with purely schematic geometry.', 'ترکیب ابعاد دقیق با هندسه کاملاً شماتیک بدون توضیح.'),
      text('Too many callouts pointing into the same small region.', 'calloutهای زیاد به یک ناحیه کوچک.'),
    ],
    reviewerChecks: [
      text('Can a reader identify sample in, sensing event and signal out?', 'آیا خواننده ورودی نمونه، رویداد sensing و خروجی سیگنال را می‌بیند؟'),
      text('Does the chosen view explain function better than alternatives?', 'آیا نمای انتخاب‌شده عملکرد را بهتر از نماهای دیگر توضیح می‌دهد؟'),
      text('Are layers and flow directions unambiguous?', 'آیا لایه‌ها و جهت جریان بدون ابهام‌اند؟'),
    ],
    readTime: 5,
  },
  'experimental-methods': {
    publicationLens: text('Show the scientific principle of the assay first, then the minimum operational steps needed to interpret the method.', 'اول اصل علمی assay را نشان بده، سپس حداقل مراحل اجرایی لازم برای فهم روش را اضافه کن.'),
    layout: text('Separate principle, sample preparation, measurement and readout into distinct visual zones.', 'اصل روش، آماده‌سازی نمونه، اندازه‌گیری و readout را در ناحیه‌های بصری جدا قرار بده.'),
    rules: [
      text('Use familiar laboratory symbols consistently and avoid unnecessary photorealism.', 'نمادهای آزمایشگاهی آشنا را ثابت استفاده کن و از photorealism غیرضروری دوری کن.'),
      text('Distinguish sample, reagent, instrument and output with a stable visual grammar.', 'نمونه، reagent، instrument و خروجی را با گرامر بصری ثابت جدا کن.'),
      text('Highlight the measurement principle—not every handling step.', 'اصل اندازه‌گیری را برجسته کن، نه همه مراحل handling را.'),
      text('Use arrows to show physical transfer only when transfer matters to understanding.', 'از فلش برای انتقال فیزیکی فقط وقتی استفاده کن که برای درک روش مهم است.'),
    ],
    pitfalls: [
      text('A workflow that looks like a commercial kit instruction sheet.', 'workflow شبیه برگه دستورالعمل کیت تجاری.'),
      text('Microscopic text inside tubes, wells or instrument screens.', 'متن بسیار ریز داخل tube، well یا صفحه دستگاه.'),
      text('Conflating assay principle with downstream data analysis.', 'ادغام اصل assay با تحلیل downstream داده.'),
    ],
    reviewerChecks: [
      text('Is the assay principle scientifically correct?', 'آیا اصل assay از نظر علمی درست است؟'),
      text('Can the sample-to-readout path be followed without guessing?', 'آیا مسیر نمونه تا readout بدون حدس قابل دنبال‌کردن است؟'),
      text('Are omitted details safely recoverable from Methods?', 'آیا جزئیات حذف‌شده به‌خوبی در Methods قابل بازیابی‌اند؟'),
    ],
    readTime: 4,
  },
  'disease-therapeutics': {
    publicationLens: text('Separate disease cause, pathology, intervention point and outcome so therapeutic logic is testable and not merely illustrative.', 'علت بیماری، پاتولوژی، نقطه مداخله و outcome را جدا کن تا منطق درمانی قابل آزمون باشد نه صرفاً تصویری.'),
    layout: text('Use a disease timeline or causal chain, then place the intervention exactly where it modifies biology.', 'از timeline یا زنجیره علّی بیماری استفاده کن و مداخله را دقیقاً در محل تغییر زیست‌شناسی قرار بده.'),
    rules: [
      text('Differentiate healthy, disease and treated states with structure plus labels—not color alone.', 'حالت سالم، بیماری و درمان‌شده را با ساختار و برچسب جدا کن، نه فقط رنگ.'),
      text('Show therapeutic target and downstream outcome as separate concepts.', 'target درمانی و outcome پایین‌دستی را به‌عنوان دو مفهوم جدا نشان بده.'),
      text('Mark hypothetical rescue mechanisms differently from measured effects.', 'مکانیسم‌های rescue فرضی را از اثرات اندازه‌گیری‌شده متمایز کن.'),
      text('Keep toxicity and efficacy endpoints visually distinct when both are present.', 'وقتی toxicity و efficacy هر دو وجود دارند، آن‌ها را بصری جدا نگه دار.'),
    ],
    pitfalls: [
      text('Implying causality from an association-only experiment.', 'القای causality از آزمایشی که فقط association نشان می‌دهد.'),
      text('Using dramatic disease imagery that overwhelms the mechanism.', 'تصویرسازی دراماتیک بیماری که مکانیسم را تحت‌الشعاع قرار می‌دهد.'),
      text('Placing treatment arrows at a biologically vague location.', 'قرار دادن فلش درمان در یک محل زیستی مبهم.'),
    ],
    reviewerChecks: [
      text('Does the visual claim match the experimental evidence?', 'آیا ادعای بصری با شواهد آزمایشی منطبق است؟'),
      text('Is the intervention point mechanistically precise?', 'آیا نقطه مداخله از نظر مکانیسم دقیق است؟'),
      text('Can efficacy, toxicity and disease state be distinguished?', 'آیا efficacy، toxicity و state بیماری از هم قابل تشخیص‌اند؟'),
    ],
    readTime: 5,
  },
  'anatomy-spatial-biology': {
    publicationLens: text('Preserve orientation and scale so readers never lose where the detailed biology sits in the larger anatomy.', 'جهت و مقیاس را حفظ کن تا خواننده هیچ‌وقت جای زیست‌شناسی جزئی را در آناتومی بزرگ‌تر گم نکند.'),
    layout: text('Build from overview → callout → tissue/cell detail with explicit spatial links between scales.', 'از overview ← callout ← جزئیات بافت/سلول بساز و ارتباط فضایی بین مقیاس‌ها را صریح نشان بده.'),
    rules: [
      text('Keep anatomical orientation consistent across panels and zooms.', 'جهت آناتومیک را در پنل‌ها و zoomها ثابت نگه دار.'),
      text('Use scale bars for image data and avoid relying on magnification labels alone.', 'برای داده تصویری scale bar بگذار و فقط به magnification label تکیه نکن.'),
      text('Use boundaries and callout frames to show exactly what region is magnified.', 'با boundary و callout frame دقیقاً ناحیه zoom‌شده را مشخص کن.'),
      text('Reserve detailed labels for structures necessary to the scientific question.', 'برچسب‌های جزئی را به ساختارهای لازم برای سؤال علمی محدود کن.'),
    ],
    pitfalls: [
      text('Rotating a zoomed panel without indicating orientation change.', 'چرخاندن پنل zoom‌شده بدون علامت تغییر orientation.'),
      text('Using anatomical art with no connection to the sampled region.', 'استفاده از تصویر آناتومیک بدون ارتباط با ناحیه نمونه‌برداری.'),
      text('Crowded labels around tissue boundaries.', 'برچسب‌های شلوغ اطراف مرزهای بافت.'),
    ],
    reviewerChecks: [
      text('Can every detailed panel be traced back to its anatomical origin?', 'آیا هر پنل جزئی به مبدأ آناتومیک خود قابل ردیابی است؟'),
      text('Are orientation and scale explicit?', 'آیا orientation و scale صریح‌اند؟'),
      text('Do labels identify only scientifically relevant structures?', 'آیا برچسب‌ها فقط ساختارهای مرتبط علمی را مشخص می‌کنند؟'),
    ],
    readTime: 4,
  },
  'omics-systems-biology': {
    publicationLens: text('Turn a high-dimensional computational pipeline into a readable story from biological sample to interpretable biological output.', 'یک pipeline محاسباتی پُربعد را به داستان خوانا از نمونه زیستی تا خروجی قابل‌تفسیر تبدیل کن.'),
    layout: text('Separate data generation, preprocessing, modeling/integration and biological interpretation into clear stages.', 'تولید داده، preprocessing، modeling/integration و تفسیر زیستی را به مراحل روشن تقسیم کن.'),
    rules: [
      text('Use simplified plot motifs instead of embedding tiny unreadable real plots.', 'به‌جای قرار دادن plotهای واقعی و بسیار ریز از motif ساده‌شده استفاده کن.'),
      text('Name key computational transformations, but omit routine software plumbing.', 'تبدیلات محاسباتی کلیدی را نام ببر اما جزئیات روتین نرم‌افزاری را حذف کن.'),
      text('Separate measured features from inferred networks, pathways or candidate biomarkers.', 'featureهای اندازه‌گیری‌شده را از network، pathway یا biomarker استنباطی جدا کن.'),
      text('End with the biological question, phenotype or candidate list—not simply “analysis”.', 'pipeline را با سؤال زیستی، phenotype یا لیست candidate تمام کن، نه صرفاً «analysis».'),
    ],
    pitfalls: [
      text('A software-logo parade instead of a scientific pipeline.', 'ردیف لوگوی نرم‌افزارها به‌جای pipeline علمی.'),
      text('Tiny heatmaps and volcano plots that cannot be read at final size.', 'heatmap و volcano plot بسیار ریز که در اندازه نهایی خوانا نیستند.'),
      text('Mixing raw data, normalized data and inferred biology without boundaries.', 'ترکیب داده خام، normalized و زیست‌شناسی استنباطی بدون مرز.'),
    ],
    reviewerChecks: [
      text('Is it clear which outputs are measured and which are inferred?', 'آیا خروجی‌های اندازه‌گیری‌شده از استنباطی مشخص‌اند؟'),
      text('Does the pipeline end in a biological interpretation?', 'آیا pipeline به تفسیر زیستی ختم می‌شود؟'),
      text('Can a computational reader recognize the major transformation steps?', 'آیا خواننده محاسباتی مراحل تبدیل اصلی را تشخیص می‌دهد؟'),
    ],
    readTime: 5,
  },
  'study-design': {
    publicationLens: text('Make allocation, timing, sampling and endpoints explicit enough that the experimental logic is immediately auditable.', 'تخصیص، زمان‌بندی، نمونه‌گیری و endpointها را آن‌قدر روشن کن که منطق آزمایش فوراً قابل ممیزی باشد.'),
    layout: text('Use a timeline or allocation tree with groups aligned consistently from intervention through endpoint.', 'از timeline یا درخت تخصیص استفاده کن و گروه‌ها را از مداخله تا endpoint به‌صورت ثابت هم‌تراز نگه دار.'),
    rules: [
      text('Name groups exactly as they appear in the manuscript and statistical analysis.', 'نام گروه‌ها را دقیقاً مطابق manuscript و تحلیل آماری بنویس.'),
      text('Show randomization, washout, crossover or repeated measures only when actually used.', 'randomization، washout، crossover یا repeated measures را فقط در صورت استفاده واقعی نمایش بده.'),
      text('Make sample collection points and primary endpoints visually distinct.', 'نقاط نمونه‌گیری و primary endpointها را بصری متمایز کن.'),
      text('If n varies across stages, do not imply a constant cohort size.', 'اگر n در مراحل تغییر می‌کند، cohort ثابت را القا نکن.'),
    ],
    pitfalls: [
      text('A timeline that hides group allocation.', 'timeline که تخصیص گروه‌ها را پنهان می‌کند.'),
      text('Icons implying blinding or randomization that were not performed.', 'آیکون‌هایی که blinding یا randomization انجام‌نشده را القا می‌کنند.'),
      text('Endpoints visually mixed with interventions.', 'ترکیب بصری endpointها با intervention.'),
    ],
    reviewerChecks: [
      text('Can group allocation and chronology be reconstructed exactly?', 'آیا تخصیص گروه و chronology دقیقاً قابل بازسازی است؟'),
      text('Do group names match tables, plots and Methods?', 'آیا نام گروه‌ها با جدول‌ها، plotها و Methods یکسان است؟'),
      text('Are primary endpoints visually obvious?', 'آیا primary endpointها واضح‌اند؟'),
    ],
    readTime: 4,
  },
  'conceptual-models': {
    publicationLens: text('Communicate the hypothesis while making uncertainty visible; a conceptual figure should not overstate evidence.', 'فرضیه را منتقل کن و عدم‌قطعیت را قابل‌دیدن نگه دار؛ شکل مفهومی نباید شواهد را بیش‌ازحد قطعی نشان دهد.'),
    layout: text('Anchor the model around one hypothesis, then separate established observations from proposed links.', 'مدل را حول یک فرضیه اصلی بساز و مشاهدات اثبات‌شده را از ارتباطات پیشنهادی جدا کن.'),
    rules: [
      text('Use explicit labels such as “proposed”, “supported by this study” or “future hypothesis” where needed.', 'در صورت نیاز از برچسب‌های روشن مثل «proposed»، «supported by this study» یا «future hypothesis» استفاده کن.'),
      text('Use dashed or lower-emphasis connectors for uncertain relationships.', 'برای روابط نامطمئن از connector خط‌چین یا کم‌تأکید استفاده کن.'),
      text('Keep the model parsimonious: include only concepts necessary to explain the hypothesis.', 'مدل را parsimonious نگه دار و فقط مفاهیم لازم برای توضیح فرضیه را وارد کن.'),
      text('Avoid visual conventions that imply measured magnitude unless quantitative data support them.', 'از قراردادی که magnitude اندازه‌گیری‌شده را القا می‌کند بدون داده کمی پرهیز کن.'),
    ],
    pitfalls: [
      text('Presenting speculation with the same visual certainty as measured evidence.', 'نمایش speculation با همان قطعیت بصری شواهد اندازه‌گیری‌شده.'),
      text('Too many bidirectional arrows that make the model unfalsifiable.', 'فلش‌های دوطرفه زیاد که مدل را غیرقابل آزمون می‌کنند.'),
      text('Using “before/after” composition when the study is not longitudinal.', 'استفاده از ترکیب before/after وقتی مطالعه longitudinal نیست.'),
    ],
    reviewerChecks: [
      text('Can evidence and hypothesis be distinguished instantly?', 'آیا شواهد و فرضیه فوراً از هم قابل تشخیص‌اند؟'),
      text('Does every proposed link have a clear rationale?', 'آیا هر ارتباط پیشنهادی rationale روشن دارد؟'),
      text('Is the model simpler than the text it summarizes?', 'آیا مدل از متنی که خلاصه می‌کند ساده‌تر است؟'),
    ],
    readTime: 4,
  },
  'graphical-abstracts': {
    publicationLens: text('Tell one visual story with an obvious entry point, mechanism/result and take-home outcome.', 'یک داستان تصویری واحد با نقطه ورود، مکانیسم/نتیجه و پیام نهایی واضح بساز.'),
    layout: text('Prefer one panel with a strong left-to-right or top-to-bottom narrative and a single visual climax.', 'یک پنل با روایت قوی چپ‌به‌راست یا بالا‌به‌پایین و یک نقطه اوج بصری انتخاب کن.'),
    rules: [
      text('Reduce the paper to one take-home message instead of miniaturizing every figure.', 'مقاله را به یک پیام اصلی کاهش بده به‌جای کوچک‌کردن همه figureها.'),
      text('Keep text short and let the visual narrative carry the explanation.', 'متن را کوتاه نگه دار و توضیح را به روایت بصری بسپار.'),
      text('Create an obvious reading order with spacing, grouping and arrows.', 'با فاصله، گروه‌بندی و فلش، ترتیب خواندن واضح بساز.'),
      text('Use a restrained palette and one focal region rather than equal emphasis everywhere.', 'از پالت محدود و یک ناحیه focal استفاده کن، نه تأکید یکسان در همه جا.'),
    ],
    pitfalls: [
      text('A collage of manuscript panels with no visual narrative.', 'کلاژی از پنل‌های manuscript بدون روایت بصری.'),
      text('Paragraph-length text blocks.', 'بلوک‌های متن در حد پاراگراف.'),
      text('Too many colors, icons and arrows competing for attention.', 'رنگ، آیکون و فلش‌های زیاد که برای توجه رقابت می‌کنند.'),
    ],
    reviewerChecks: [
      text('Can the take-home message be understood in under ten seconds?', 'آیا پیام اصلی در کمتر از ده ثانیه قابل فهم است؟'),
      text('Is there a single dominant reading path?', 'آیا یک مسیر خواندن غالب وجود دارد؟'),
      text('Does the graphical abstract reflect the paper rather than oversell it?', 'آیا graphical abstract مقاله را منعکس می‌کند و آن را بیش‌ازحد بزرگ‌نمایی نمی‌کند؟'),
    ],
    readTime: 5,
  },
};
