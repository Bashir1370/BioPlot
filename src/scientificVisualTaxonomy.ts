export type ScientificVisualCategoryId =
  | 'molecular-mechanisms'
  | 'pathways-networks'
  | 'molecular-cellular-interactions'
  | 'processes-workflows'
  | 'biological-systems'
  | 'devices-bioengineering'
  | 'experimental-methods'
  | 'disease-therapeutics'
  | 'anatomy-spatial-biology'
  | 'omics-systems-biology'
  | 'study-design'
  | 'conceptual-models'
  | 'graphical-abstracts';

export type LocalizedText = { en: string; fa: string };

export interface ScientificVisualCategory {
  id: ScientificVisualCategoryId;
  slug: string;
  title: LocalizedText;
  shortTitle: LocalizedText;
  description: LocalizedText;
  archetypes: LocalizedText[];
  guideTopics: LocalizedText[];
  tags: string[];
  featuredOnHome: boolean;
}

const text = (en: string, fa: string): LocalizedText => ({ en, fa });

export const scientificVisualCategories: ScientificVisualCategory[] = [
  {
    id: 'molecular-mechanisms',
    slug: 'molecular-mechanisms',
    title: text('Molecular & cellular mechanisms', 'مکانیسم‌های مولکولی و سلولی'),
    shortTitle: text('Mechanisms', 'مکانیسم‌ها'),
    description: text('Illustrate causal biological stories from molecular triggers to cellular outcomes.', 'روایت علت‌ومعلولی فرایندهای زیستی را از محرک مولکولی تا پیامد سلولی ترسیم کن.'),
    archetypes: [text('Ligand → receptor → signaling', 'لیگاند → گیرنده → پیام‌رسانی'), text('Gene regulation', 'تنظیم بیان ژن'), text('Drug mechanism of action', 'مکانیسم اثر دارو'), text('Cell death / stress response', 'مرگ سلولی / پاسخ استرس')],
    guideTopics: [text('How to draw a clear molecular mechanism', 'چطور یک مکانیسم مولکولی واضح ترسیم کنیم؟'), text('Common mechanism-figure mistakes', 'اشتباهات رایج در شکل‌های مکانیسمی')],
    tags: ['mechanism', 'signaling', 'cell-biology', 'molecular-biology', 'pharmacology'],
    featuredOnHome: true,
  },
  {
    id: 'pathways-networks',
    slug: 'pathways-networks',
    title: text('Pathways & biological networks', 'مسیرها و شبکه‌های زیستی'),
    shortTitle: text('Pathways & networks', 'مسیرها و شبکه‌ها'),
    description: text('Build signaling cascades, branched pathways, feedback loops and regulatory networks.', 'آبشارهای پیام‌رسانی، مسیرهای شاخه‌دار، حلقه‌های بازخورد و شبکه‌های تنظیمی را نمایش بده.'),
    archetypes: [text('Linear pathway', 'مسیر خطی'), text('Branched pathway', 'مسیر شاخه‌دار'), text('Feedback loop', 'حلقه بازخورد'), text('Regulatory network', 'شبکه تنظیمی')],
    guideTopics: [text('Seven principles of pathway figure design', 'هفت اصل طراحی شکل pathway'), text('When to use a network instead of a pathway', 'چه زمانی شبکه بهتر از pathway است؟')],
    tags: ['pathway', 'network', 'signaling', 'feedback', 'systems-biology'],
    featuredOnHome: true,
  },
  {
    id: 'molecular-cellular-interactions',
    slug: 'molecular-cellular-interactions',
    title: text('Molecular & cellular interactions', 'تعاملات مولکولی و سلولی'),
    shortTitle: text('Interactions', 'تعاملات'),
    description: text('Show direct relationships between molecules, receptors, cells and their microenvironment.', 'ارتباط مستقیم مولکول‌ها، گیرنده‌ها، سلول‌ها و ریزمحیط آن‌ها را نمایش بده.'),
    archetypes: [text('Protein–protein', 'پروتئین–پروتئین'), text('Receptor–ligand', 'گیرنده–لیگاند'), text('Cell–cell', 'سلول–سلول'), text('Host–pathogen', 'میزبان–پاتوژن')],
    guideTopics: [text('How to show interaction without visual clutter', 'چطور تعاملات را بدون شلوغی نمایش دهیم؟')],
    tags: ['interaction', 'ligand', 'receptor', 'cell-cell', 'protein'],
    featuredOnHome: false,
  },
  {
    id: 'processes-workflows',
    slug: 'processes-workflows',
    title: text('Processes & experimental workflows', 'فرایندها و فلوهای آزمایشگاهی'),
    shortTitle: text('Workflows', 'فلوها'),
    description: text('Turn protocols, sample processing and analysis pipelines into readable visual sequences.', 'پروتکل‌ها، پردازش نمونه و مسیرهای آنالیز را به توالی‌های تصویری خوانا تبدیل کن.'),
    archetypes: [text('Experimental workflow', 'فلو آزمایش'), text('Sample → processing → analysis', 'نمونه → پردازش → تحلیل'), text('Clinical workflow', 'فلو بالینی'), text('Manufacturing process', 'فرایند ساخت')],
    guideTopics: [text('How to make a workflow publication-ready', 'چطور یک workflow آماده انتشار بسازیم؟'), text('Choosing the right number of workflow steps', 'چند مرحله برای یک workflow مناسب است؟')],
    tags: ['workflow', 'process', 'methods', 'protocol', 'pipeline'],
    featuredOnHome: true,
  },
  {
    id: 'biological-systems',
    slug: 'biological-systems',
    title: text('Biological systems & microenvironments', 'سیستم‌های زیستی و ریزمحیط‌ها'),
    shortTitle: text('Biological systems', 'سیستم‌های زیستی'),
    description: text('Map multi-cellular or multi-organ systems and the relationships between their components.', 'سیستم‌های چندسلولی یا چنداندامی و ارتباط اجزای آن‌ها را ترسیم کن.'),
    archetypes: [text('Tumor microenvironment', 'ریزمحیط تومور'), text('Immune system overview', 'نمای کلی سیستم ایمنی'), text('Organ–organ communication', 'ارتباط اندام–اندام'), text('Host–microbiome system', 'سیستم میزبان–میکروبیوم')],
    guideTopics: [text('How to simplify a complex biological system', 'چطور یک سیستم زیستی پیچیده را ساده‌سازی کنیم؟')],
    tags: ['system', 'microenvironment', 'immune', 'organ', 'ecosystem'],
    featuredOnHome: false,
  },
  {
    id: 'devices-bioengineering',
    slug: 'devices-bioengineering',
    title: text('Devices, biosensors & bioengineering', 'دیوایس‌ها، بیوسنسورها و مهندسی زیستی'),
    shortTitle: text('Devices & biosensors', 'دیوایس‌ها و بیوسنسورها'),
    description: text('Explain device architecture, sensing principles, layers, components and fluid paths.', 'معماری دستگاه، اصل سنجش، لایه‌ها، اجزا و مسیر جریان را به‌صورت شماتیک نمایش بده.'),
    archetypes: [text('Lateral flow assay', 'لترال فلو'), text('Electrochemical biosensor', 'بیوسنسور الکتروشیمیایی'), text('Microfluidic device', 'دیوایس میکروفلوئیدیک'), text('Lab-on-a-chip', 'لب-آن-چیپ'), text('Exploded / cross-section view', 'نمای انفجاری / مقطع')],
    guideTopics: [text('How to draw a biosensor schematic', 'چطور شماتیک یک بیوسنسور را طراحی کنیم؟'), text('Device cross-section vs exploded view', 'نمای مقطع یا exploded view؛ کدام بهتر است؟')],
    tags: ['device', 'biosensor', 'microfluidics', 'lateral-flow', 'bioengineering'],
    featuredOnHome: true,
  },
  {
    id: 'experimental-methods',
    slug: 'experimental-methods',
    title: text('Experimental methods', 'روش‌های آزمایشگاهی'),
    shortTitle: text('Methods', 'روش‌ها'),
    description: text('Illustrate the principle and key steps of common laboratory and analytical methods.', 'اصل و مراحل کلیدی روش‌های آزمایشگاهی و تحلیلی را تصویرسازی کن.'),
    archetypes: [text('PCR / qPCR', 'PCR / qPCR'), text('Western blot', 'وسترن بلات'), text('ELISA', 'الایزا'), text('Flow cytometry', 'فلوسایتومتری'), text('Sequencing', 'توالی‌یابی')],
    guideTopics: [text('Method schematic vs workflow: what is the difference?', 'شماتیک روش با workflow چه تفاوتی دارد؟')],
    tags: ['methods', 'laboratory', 'assay', 'pcr', 'sequencing'],
    featuredOnHome: false,
  },
  {
    id: 'disease-therapeutics',
    slug: 'disease-therapeutics',
    title: text('Disease & therapeutic models', 'مدل‌های بیماری و درمان'),
    shortTitle: text('Disease & therapy', 'بیماری و درمان'),
    description: text('Connect disease triggers, pathological mechanisms, interventions and therapeutic outcomes.', 'محرک بیماری، مکانیسم پاتولوژیک، مداخله و پیامد درمانی را به هم متصل کن.'),
    archetypes: [text('Disease mechanism', 'مکانیسم بیماری'), text('Drug-induced toxicity', 'سمیت ناشی از دارو'), text('Treatment response', 'پاسخ به درمان'), text('Resistance mechanism', 'مکانیسم مقاومت'), text('Cell / gene therapy', 'سلول‌درمانی / ژن‌درمانی')],
    guideTopics: [text('How to compare healthy, disease and treated states', 'چطور حالت سالم، بیماری و درمان‌شده را مقایسه کنیم؟')],
    tags: ['disease', 'therapy', 'toxicity', 'pathogenesis', 'treatment'],
    featuredOnHome: true,
  },
  {
    id: 'anatomy-spatial-biology',
    slug: 'anatomy-spatial-biology',
    title: text('Anatomy & spatial biology', 'آناتومی و زیست‌شناسی فضایی'),
    shortTitle: text('Anatomy & spatial', 'آناتومی و فضایی'),
    description: text('Show anatomical context, tissue organization, barriers and multi-scale zoom relationships.', 'بافت آناتومیک، سازمان فضایی، سدهای زیستی و ارتباطات چندمقیاسی را نشان بده.'),
    archetypes: [text('Organ overview', 'نمای اندام'), text('Tissue cross-section', 'مقطع بافت'), text('Tissue → cell zoom', 'زوم بافت → سلول'), text('Barrier model', 'مدل سد زیستی')],
    guideTopics: [text('How to build a multi-scale zoom figure', 'چطور یک شکل زوم چندمقیاسی بسازیم؟')],
    tags: ['anatomy', 'tissue', 'spatial', 'zoom', 'barrier'],
    featuredOnHome: false,
  },
  {
    id: 'omics-systems-biology',
    slug: 'omics-systems-biology',
    title: text('Omics & systems biology', 'اُمیکس و سیستم‌بیولوژی'),
    shortTitle: text('Omics & systems biology', 'اُمیکس و سیستم‌بیولوژی'),
    description: text('Visualize omics pipelines, multi-omics integration, network biology and biomarker discovery.', 'پایپ‌لاین‌های اُمیکس، ادغام چنداُمیکی، زیست‌شناسی شبکه و کشف بیومارکر را ترسیم کن.'),
    archetypes: [text('RNA-seq pipeline', 'پایپ‌لاین RNA-seq'), text('Single-cell workflow', 'فلو single-cell'), text('Multi-omics integration', 'ادغام multi-omics'), text('Gene → pathway → phenotype', 'ژن → مسیر → فنوتیپ')],
    guideTopics: [text('How to present an omics analysis pipeline', 'چطور پایپ‌لاین تحلیل اُمیکس را پرزنت کنیم؟')],
    tags: ['omics', 'systems-biology', 'single-cell', 'bioinformatics', 'multi-omics'],
    featuredOnHome: true,
  },
  {
    id: 'study-design',
    slug: 'study-design',
    title: text('Study design', 'طراحی مطالعه'),
    shortTitle: text('Study design', 'طراحی مطالعه'),
    description: text('Present groups, timelines, interventions, sampling and endpoints in one structured figure.', 'گروه‌ها، زمان‌بندی، مداخلات، نمونه‌گیری و endpointها را در یک شکل ساختاریافته نمایش بده.'),
    archetypes: [text('Animal study', 'مطالعه حیوانی'), text('Clinical study', 'مطالعه بالینی'), text('Time-course study', 'مطالعه زمان‌مند'), text('Dose-response design', 'طراحی دوز–پاسخ')],
    guideTopics: [text('How to draw a study design figure', 'چطور شکل طراحی مطالعه بسازیم؟')],
    tags: ['study-design', 'clinical', 'animal-study', 'timeline', 'experiment'],
    featuredOnHome: false,
  },
  {
    id: 'conceptual-models',
    slug: 'conceptual-models',
    title: text('Conceptual models & hypotheses', 'مدل‌های مفهومی و فرضیه‌ها'),
    shortTitle: text('Conceptual models', 'مدل‌های مفهومی'),
    description: text('Communicate a working hypothesis, proposed mechanism or cause-to-outcome model.', 'فرضیه کاری، مکانیسم پیشنهادی یا مدل علت تا پیامد را به‌صورت تصویری بیان کن.'),
    archetypes: [text('Working hypothesis', 'فرضیه کاری'), text('Proposed mechanism', 'مکانیسم پیشنهادی'), text('Cause → mechanism → outcome', 'علت → مکانیسم → پیامد'), text('Before / after', 'قبل / بعد')],
    guideTopics: [text('How to separate evidence from hypothesis in a figure', 'چطور شواهد را از فرضیه در یک شکل جدا کنیم؟')],
    tags: ['conceptual-model', 'hypothesis', 'proposed-mechanism', 'comparison'],
    featuredOnHome: false,
  },
  {
    id: 'graphical-abstracts',
    slug: 'graphical-abstracts',
    title: text('Graphical abstracts', 'گرافیکال ابسترکت‌ها'),
    shortTitle: text('Graphical abstracts', 'گرافیکال ابسترکت'),
    description: text('Compose the question, mechanism, result and take-home message into one publication visual.', 'سؤال، مکانیسم، نتیجه و پیام اصلی مطالعه را در یک تصویر انتشارپذیر ترکیب کن.'),
    archetypes: [text('Mechanism graphical abstract', 'گرافیکال ابسترکت مکانیسمی'), text('Experimental graphical abstract', 'گرافیکال ابسترکت آزمایشی'), text('Clinical graphical abstract', 'گرافیکال ابسترکت بالینی'), text('Device graphical abstract', 'گرافیکال ابسترکت دیوایس')],
    guideTopics: [text('How to design a graphical abstract', 'چطور یک گرافیکال ابسترکت حرفه‌ای بسازیم؟'), text('Common graphical abstract mistakes', 'اشتباهات رایج گرافیکال ابسترکت')],
    tags: ['graphical-abstract', 'publication', 'visual-summary', 'paper'],
    featuredOnHome: false,
  },
];

export const featuredScientificVisualCategories = scientificVisualCategories.filter(category => category.featuredOnHome);

export function scientificVisualCategoryById(id: ScientificVisualCategoryId) {
  return scientificVisualCategories.find(category => category.id === id);
}
