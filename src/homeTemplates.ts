import { ArrowObject, BioPlotDocument, BioPlotObject, ShapeObject, TextObject, activePage, createBlankDocument, makeId } from './model';

export type HomeTemplateId = 'blank' | 'mechanism' | 'graphical-abstract' | 'workflow';

export interface HomeTemplateDefinition {
  id: HomeTemplateId;
  title: { en: string; fa: string };
  description: { en: string; fa: string };
  eyebrow: { en: string; fa: string };
  icon: 'figure' | 'mechanism' | 'abstract' | 'workflow';
}

export const homeTemplates: HomeTemplateDefinition[] = [
  {
    id: 'blank',
    title: { en: 'Blank scientific figure', fa: 'شکل علمی خالی' },
    description: { en: 'Start with a clean publication-ready artboard.', fa: 'با یک صفحه تمیز و آماده طراحی علمی شروع کن.' },
    eyebrow: { en: 'START CLEAN', fa: 'شروع آزاد' },
    icon: 'figure'
  },
  {
    id: 'mechanism',
    title: { en: 'Biological mechanism', fa: 'مکانیسم زیستی' },
    description: { en: 'A structured starter for mechanisms and signaling stories.', fa: 'شروع ساختاریافته برای مکانیسم‌ها و مسیرهای زیستی.' },
    eyebrow: { en: 'POPULAR', fa: 'محبوب' },
    icon: 'mechanism'
  },
  {
    id: 'graphical-abstract',
    title: { en: 'Graphical abstract', fa: 'گرافیکال ابسترکت' },
    description: { en: 'Tell the question, mechanism and outcome in one visual.', fa: 'سؤال، مکانیسم و نتیجه را در یک تصویر روایت کن.' },
    eyebrow: { en: 'PUBLICATION', fa: 'انتشار' },
    icon: 'abstract'
  },
  {
    id: 'workflow',
    title: { en: 'Experimental workflow', fa: 'فلو آزمایش' },
    description: { en: 'Organize experimental steps into a clean scientific flow.', fa: 'مراحل آزمایش را به یک فلو علمی و خوانا تبدیل کن.' },
    eyebrow: { en: 'METHODS', fa: 'روش کار' },
    icon: 'workflow'
  }
];

const text = (name: string, value: string, x: number, y: number, width: number, size = 16, weight = 700, color = '#17303f'): TextObject => ({
  id: makeId(), type: 'text', name, text: value, x, y, width, height: Math.max(34, size * 2.2), rotation: 0, opacity: 1,
  color, fontSize: size, fontWeight: weight, align: 'center'
});

const box = (name: string, x: number, y: number, width: number, height: number, fill: string, stroke: string, radius = 16): ShapeObject => ({
  id: makeId(), type: 'shape', name, shape: 'rect', x, y, width, height, rotation: 0, opacity: 1,
  fill, stroke, strokeWidth: 2, radius
});

const circle = (name: string, x: number, y: number, size: number, fill: string, stroke: string): ShapeObject => ({
  id: makeId(), type: 'shape', name, shape: 'ellipse', x, y, width: size, height: size, rotation: 0, opacity: 1,
  fill, stroke, strokeWidth: 2, radius: size / 2
});

const arrow = (name: string, x: number, y: number, width: number, rotation = 0, color = '#607986'): ArrowObject => ({
  id: makeId(), type: 'arrow', name, x, y, width, height: 28, rotation, opacity: 1, stroke: color, strokeWidth: 3, arrowHead: 'end'
});

function baseDocument(locale: 'en' | 'fa', title: string, templateId: HomeTemplateId) {
  const document = createBlankDocument(title);
  document.metadata.locale = locale;
  document.metadata.tags = ['scientific-figure', `template:${templateId}`];
  activePage(document).objects = [];
  return document;
}

function blankTemplate(locale: 'en' | 'fa') {
  const document = baseDocument(locale, locale === 'fa' ? 'شکل علمی بدون عنوان' : 'Untitled scientific figure', 'blank');
  const page = activePage(document);
  page.objects = [
    text('Figure title', locale === 'fa' ? 'عنوان شکل علمی' : 'Scientific figure title', 70, 46, 650, 25, 700),
    text('Helper', locale === 'fa' ? 'برای شروع از کتابخانه علمی المان اضافه کن' : 'Add scientific assets from the library to begin', 70, 104, 520, 12, 500, '#7b8c95')
  ];
  return document;
}

function mechanismTemplate(locale: 'en' | 'fa') {
  const document = baseDocument(locale, locale === 'fa' ? 'مکانیسم زیستی جدید' : 'New biological mechanism', 'mechanism');
  const page = activePage(document);
  page.objects = [
    text('Figure title', locale === 'fa' ? 'عنوان مکانیسم زیستی' : 'Biological mechanism', 100, 46, 760, 25, 700),
    box('Stimulus card', 80, 210, 190, 120, '#eef8f6', '#7abbb5'),
    text('Stimulus label', locale === 'fa' ? 'محرک' : 'Stimulus', 104, 246, 142, 17, 700, '#0b7a75'),
    arrow('Activation arrow', 282, 256, 118),
    circle('Cell process', 420, 198, 145, '#edf3fb', '#7fa5c3'),
    text('Process label', locale === 'fa' ? 'فرایند سلولی' : 'Cell process', 436, 246, 112, 15, 700, '#316f9d'),
    arrow('Outcome arrow', 580, 256, 118),
    box('Outcome card', 718, 210, 170, 120, '#fff5ec', '#dfad7e'),
    text('Outcome label', locale === 'fa' ? 'پیامد' : 'Outcome', 740, 246, 126, 17, 700, '#b86731'),
    text('Caption', locale === 'fa' ? 'محرک → تغییر سلولی → پیامد زیستی' : 'Stimulus → cellular change → biological outcome', 212, 398, 540, 13, 500, '#71828c')
  ];
  return document;
}

function graphicalAbstractTemplate(locale: 'en' | 'fa') {
  const document = baseDocument(locale, locale === 'fa' ? 'گرافیکال ابسترکت جدید' : 'New graphical abstract', 'graphical-abstract');
  const page = activePage(document);
  page.objects = [
    text('Figure title', locale === 'fa' ? 'پیام اصلی مطالعه' : 'Main study message', 105, 38, 750, 25, 700),
    box('Question zone', 55, 150, 245, 300, '#f7fbfb', '#c4ddda', 20),
    box('Mechanism zone', 357, 150, 245, 300, '#f8f8fc', '#cbc8df', 20),
    box('Outcome zone', 660, 150, 245, 300, '#fff9f2', '#e7d0ae', 20),
    text('Question heading', locale === 'fa' ? 'سؤال' : 'Question', 92, 178, 170, 17, 800, '#0b7a75'),
    text('Question copy', locale === 'fa' ? 'مسئله یا مداخله اصلی را اینجا نشان بده' : 'Show the core problem or intervention here', 86, 258, 184, 13, 500, '#637781'),
    text('Mechanism heading', locale === 'fa' ? 'مکانیسم' : 'Mechanism', 394, 178, 170, 17, 800, '#6c5aa8'),
    circle('Mechanism node', 425, 252, 110, '#eeeafb', '#8f82bf'),
    text('Mechanism node label', locale === 'fa' ? 'فرایند' : 'Process', 444, 287, 72, 14, 700, '#6c5aa8'),
    text('Outcome heading', locale === 'fa' ? 'نتیجه' : 'Outcome', 697, 178, 170, 17, 800, '#b86731'),
    text('Outcome copy', locale === 'fa' ? 'نتیجه کلیدی یا کاربرد مطالعه' : 'Key result or study implication', 690, 258, 184, 13, 500, '#637781'),
    arrow('Question to mechanism', 305, 284, 48),
    arrow('Mechanism to outcome', 607, 284, 48),
    text('Footer message', locale === 'fa' ? 'پیام نهایی مطالعه را در یک جمله جمع‌بندی کن' : 'Summarize the take-home message in one sentence', 210, 505, 540, 13, 600, '#536a75')
  ];
  return document;
}

function workflowTemplate(locale: 'en' | 'fa') {
  const document = baseDocument(locale, locale === 'fa' ? 'فلو آزمایش جدید' : 'New experimental workflow', 'workflow');
  const page = activePage(document);
  const labels = locale === 'fa' ? ['نمونه', 'مداخله', 'اندازه‌گیری', 'تحلیل'] : ['Sample', 'Intervention', 'Measurement', 'Analysis'];
  const colors = [
    ['#eef8f6', '#7abbb5', '#0b7a75'],
    ['#f1f5fb', '#91aac4', '#316f9d'],
    ['#f5f2fb', '#a99dca', '#6c5aa8'],
    ['#fff6ed', '#dfb181', '#b86731']
  ];
  const objects: BioPlotObject[] = [text('Figure title', locale === 'fa' ? 'طراحی آزمایش' : 'Experimental workflow', 120, 55, 720, 25, 700)];
  labels.forEach((label, index) => {
    const x = 78 + index * 220;
    objects.push(circle(`Step ${index + 1}`, x + 35, 210, 105, colors[index][0], colors[index][1]));
    objects.push(text(`Step ${index + 1} label`, label, x, 340, 175, 16, 700, colors[index][2]));
    objects.push(text(`Step ${index + 1} number`, String(index + 1), x + 62, 244, 50, 24, 800, colors[index][2]));
    if (index < labels.length - 1) objects.push(arrow(`Step arrow ${index + 1}`, x + 153, 247, 64));
  });
  objects.push(text('Workflow note', locale === 'fa' ? 'هر مرحله را با المان‌ها و توضیحات علمی خودت جایگزین کن' : 'Replace each step with your own scientific assets and annotations', 200, 465, 560, 13, 500, '#71828c'));
  page.objects = objects;
  return document;
}

export function createHomeTemplateDocument(templateId: HomeTemplateId, locale: 'en' | 'fa'): BioPlotDocument {
  switch (templateId) {
    case 'mechanism': return mechanismTemplate(locale);
    case 'graphical-abstract': return graphicalAbstractTemplate(locale);
    case 'workflow': return workflowTemplate(locale);
    default: return blankTemplate(locale);
  }
}

export function templateIdFromDocument(document: BioPlotDocument): HomeTemplateId {
  const tag = document.metadata.tags.find(item => item.startsWith('template:'))?.slice('template:'.length);
  return homeTemplates.some(template => template.id === tag) ? tag as HomeTemplateId : 'blank';
}
