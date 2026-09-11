import type { ScientificAsset } from './assets';

type Seed={id:string;name:string;category:string;fa:string[];en:string[];kind:'cell'|'organelle'|'molecule'|'protein'|'microbe'|'organ'|'animal'|'lab';color:string};

const seeds:Seed[]=[
  {id:'t-cell',name:'T cell',category:'Immunology',fa:['سلول تی','لنفوسیت تی'],en:['t lymphocyte','immune cell'],kind:'cell',color:'#4f8fb3'},
  {id:'b-cell',name:'B cell',category:'Immunology',fa:['سلول بی','لنفوسیت بی'],en:['b lymphocyte','immune cell'],kind:'cell',color:'#7a65ae'},
  {id:'macrophage',name:'Macrophage',category:'Immunology',fa:['ماکروفاژ'],en:['phagocyte'],kind:'cell',color:'#c17a45'},
  {id:'neutrophil',name:'Neutrophil',category:'Immunology',fa:['نوتروفیل'],en:['granulocyte'],kind:'cell',color:'#7897b8'},
  {id:'stem-cell',name:'Stem cell',category:'Cell biology',fa:['سلول بنیادی'],en:['stem cell'],kind:'cell',color:'#3b9b8e'},
  {id:'cancer-cell',name:'Cancer cell',category:'Cancer',fa:['سلول سرطانی','تومور'],en:['tumor cell','cancer'],kind:'cell',color:'#a14e72'},
  {id:'nucleus',name:'Nucleus',category:'Cell biology',fa:['هسته سلول'],en:['nucleus'],kind:'organelle',color:'#5f70af'},
  {id:'golgi',name:'Golgi apparatus',category:'Cell biology',fa:['دستگاه گلژی','گلژی'],en:['golgi'],kind:'organelle',color:'#bc7446'},
  {id:'er',name:'Endoplasmic reticulum',category:'Cell biology',fa:['شبکه آندوپلاسمی'],en:['endoplasmic reticulum','er'],kind:'organelle',color:'#4f8fa9'},
  {id:'lysosome',name:'Lysosome',category:'Cell biology',fa:['لیزوزوم'],en:['lysosome'],kind:'organelle',color:'#a95c8f'},
  {id:'ribosome',name:'Ribosome',category:'Molecular biology',fa:['ریبوزوم'],en:['ribosome'],kind:'organelle',color:'#5f8f6f'},
  {id:'vesicle',name:'Vesicle',category:'Cell biology',fa:['وزیکول','کیسه سلولی'],en:['vesicle'],kind:'organelle',color:'#6c9dc0'},
  {id:'rna',name:'RNA',category:'Molecular biology',fa:['آر ان ای','RNA'],en:['rna','transcript'],kind:'molecule',color:'#b07358'},
  {id:'mrna',name:'mRNA',category:'Molecular biology',fa:['ام آر ان ای','پیام رسان'],en:['messenger rna','mrna'],kind:'molecule',color:'#b07c52'},
  {id:'atp',name:'ATP',category:'Molecular biology',fa:['ATP','آدنوزین تری فسفات'],en:['atp','energy'],kind:'molecule',color:'#d09a43'},
  {id:'calcium',name:'Calcium ion',category:'Molecular biology',fa:['کلسیم','یون کلسیم'],en:['calcium','ca2+'],kind:'molecule',color:'#4b86b4'},
  {id:'ros',name:'Reactive oxygen species',category:'Cell biology',fa:['ROS','گونه فعال اکسیژن'],en:['ros','oxidative stress'],kind:'molecule',color:'#d16c4e'},
  {id:'protein',name:'Protein',category:'Molecular biology',fa:['پروتئین'],en:['protein'],kind:'protein',color:'#4f8d85'},
  {id:'enzyme',name:'Enzyme',category:'Molecular biology',fa:['آنزیم'],en:['enzyme'],kind:'protein',color:'#6b7fad'},
  {id:'receptor',name:'Membrane receptor',category:'Molecular biology',fa:['گیرنده غشایی','رسپتور'],en:['receptor','membrane receptor'],kind:'protein',color:'#7a66a8'},
  {id:'ion-channel',name:'Ion channel',category:'Neuroscience',fa:['کانال یونی'],en:['ion channel','channel'],kind:'protein',color:'#3f8ba0'},
  {id:'antibody',name:'Antibody',category:'Immunology',fa:['آنتی بادی','پادتن'],en:['antibody','immunoglobulin'],kind:'protein',color:'#9d6a9d'},
  {id:'virus',name:'Virus',category:'Microbiology',fa:['ویروس'],en:['virus','viral particle'],kind:'microbe',color:'#a95454'},
  {id:'bacterium',name:'Bacterium',category:'Microbiology',fa:['باکتری'],en:['bacteria','bacterium'],kind:'microbe',color:'#5f956f'},
  {id:'brain',name:'Brain',category:'Organs',fa:['مغز'],en:['brain','cns'],kind:'organ',color:'#b97a8f'},
  {id:'heart',name:'Heart',category:'Organs',fa:['قلب'],en:['heart','cardiac'],kind:'organ',color:'#ba5b65'},
  {id:'liver',name:'Liver',category:'Organs',fa:['کبد'],en:['liver','hepatic'],kind:'organ',color:'#a9674c'},
  {id:'kidney',name:'Kidney',category:'Organs',fa:['کلیه'],en:['kidney','renal'],kind:'organ',color:'#9c5f66'},
  {id:'lung',name:'Lung',category:'Organs',fa:['ریه'],en:['lung','pulmonary'],kind:'organ',color:'#7aa0b6'},
  {id:'mouse',name:'Laboratory mouse',category:'Animals',fa:['موش آزمایشگاهی','موش'],en:['mouse','murine'],kind:'animal',color:'#7f8b91'},
  {id:'rat',name:'Laboratory rat',category:'Animals',fa:['رت','موش صحرایی'],en:['rat','rodent'],kind:'animal',color:'#6f7d82'},
  {id:'zebrafish',name:'Zebrafish',category:'Animals',fa:['زبرافیش','ماهی گورخری'],en:['zebrafish','danio'],kind:'animal',color:'#4b90a6'},
  {id:'microscope',name:'Microscope',category:'Lab equipment',fa:['میکروسکوپ'],en:['microscope'],kind:'lab',color:'#567789'},
  {id:'pipette',name:'Micropipette',category:'Lab equipment',fa:['سمپلر','میکروپیپت'],en:['pipette','micropipette'],kind:'lab',color:'#4f8e9a'},
  {id:'centrifuge',name:'Centrifuge',category:'Lab equipment',fa:['سانتریفیوژ'],en:['centrifuge'],kind:'lab',color:'#6f7897'},
  {id:'pcr-tube',name:'PCR tube',category:'Lab equipment',fa:['تیوب پی سی آر','لوله PCR'],en:['pcr tube','tube'],kind:'lab',color:'#6f9aa0'}
];

function svg(seed:Seed){
  const c=seed.color;
  const pale=`${c}22`;
  const common=`xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"`;
  if(seed.kind==='cell')return `<svg ${common}><path d="M14 42C10 22 27 9 50 11s38 14 36 34C84 64 68 72 47 70S18 61 14 42Z" fill="${pale}" stroke="${c}" stroke-width="3"/><circle cx="50" cy="40" r="13" fill="${c}44" stroke="${c}" stroke-width="2"/><circle cx="31" cy="30" r="3" fill="${c}"/><circle cx="70" cy="51" r="3" fill="${c}"/></svg>`;
  if(seed.kind==='organelle')return `<svg ${common}><ellipse cx="50" cy="40" rx="34" ry="22" fill="${pale}" stroke="${c}" stroke-width="3"/><path d="M25 40c8-15 15 15 24 0s17 14 28-2" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`;
  if(seed.kind==='molecule')return `<svg ${common}><g fill="${c}33" stroke="${c}" stroke-width="3"><circle cx="25" cy="45" r="11"/><circle cx="51" cy="27" r="11"/><circle cx="75" cy="49" r="11"/></g><path d="M34 39 43 33M60 33l7 9" stroke="${c}" stroke-width="4"/></svg>`;
  if(seed.kind==='protein')return `<svg ${common}><path d="M18 48c10-32 24 18 34-12s23 24 31-10" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><circle cx="18" cy="48" r="5" fill="${c}"/><circle cx="83" cy="26" r="5" fill="${c}"/></svg>`;
  if(seed.kind==='microbe')return `<svg ${common}><ellipse cx="50" cy="40" rx="28" ry="20" fill="${pale}" stroke="${c}" stroke-width="3"/><g stroke="${c}" stroke-width="2"><path d="M28 23 19 13M45 19 43 7M64 23l9-11M75 38l14-1M65 58l8 12M37 58l-7 12M24 45 10 49"/></g><circle cx="42" cy="36" r="4" fill="${c}"/><circle cx="59" cy="45" r="4" fill="${c}"/></svg>`;
  if(seed.kind==='organ')return `<svg ${common}><path d="M50 12C28 12 16 29 18 46c2 18 17 25 32 23 16 2 31-6 32-24C84 27 71 12 50 12Z" fill="${pale}" stroke="${c}" stroke-width="3"/><path d="M50 22v37M35 32c8 5 11 10 15 18M65 32c-8 5-11 10-15 18" fill="none" stroke="${c}" stroke-width="2"/></svg>`;
  if(seed.kind==='animal')return `<svg ${common}><path d="M20 48c0-16 15-26 34-24 16 1 27 8 29 20 2 12-8 20-22 20H39C28 64 20 58 20 48Z" fill="${pale}" stroke="${c}" stroke-width="3"/><circle cx="78" cy="37" r="3" fill="${c}"/><path d="M21 52C8 57 8 70 20 72M33 63l-5 10M65 63l5 10" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`;
  return `<svg ${common}><rect x="24" y="18" width="52" height="46" rx="8" fill="${pale}" stroke="${c}" stroke-width="3"/><path d="M34 52 48 29l18 23M35 52h32" fill="none" stroke="${c}" stroke-width="3"/><circle cx="50" cy="28" r="5" fill="${c}"/></svg>`;
}

export const scientificStarterAssets:ScientificAsset[]=seeds.map(seed=>({
  id:seed.id,name:seed.name,category:seed.category,synonyms:{en:seed.en,fa:seed.fa},svg:svg(seed),colorSlots:[{key:'primary',label:'Primary',defaultValue:seed.color}],reviewStatus:'reviewed',premium:false,version:1
}));
