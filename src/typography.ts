import { TextObject } from './model';

export const SCIENTIFIC_SYMBOLS = [
  'α','β','γ','δ','Δ','μ','λ','±','×','→','←','↔','↑','↓','°','°C','≥','≤','≈','≠','∞','✓','✕','•','·','–','—','₂','₃','₄','⁺','⁻','²','³'
];

export const SCIENTIFIC_FONTS = ['Inter','B Nazanin','Vazirmatn','Arial','Helvetica','Times New Roman','Georgia'];

const superscriptMap: Record<string,string> = {
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ'
};
const subscriptMap: Record<string,string> = {
  '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','=':'₌','(':'₍',')':'₎','a':'ₐ','e':'ₑ','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','x':'ₓ'
};

const PERSIAN_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LATIN_DEFAULT_FONTS = new Set(['Inter','Arial','Helvetica','system-ui']);

export function containsPersianScript(value:string){
  return PERSIAN_SCRIPT.test(value);
}

export function fontStackForText(value:string, requested?:string){
  const font = requested?.trim() || 'Inter';
  if(containsPersianScript(value) && LATIN_DEFAULT_FONTS.has(font)){
    return '"B Nazanin", Nazanin, Vazirmatn, Tahoma, sans-serif';
  }
  if(font === 'B Nazanin') return '"B Nazanin", Nazanin, Vazirmatn, Tahoma, sans-serif';
  if(font === 'Vazirmatn') return 'Vazirmatn, "B Nazanin", Nazanin, Tahoma, sans-serif';
  return `${font}, Vazirmatn, Arial, sans-serif`;
}

export function toSuperscript(value:string){
  return [...value].map(char=>superscriptMap[char]??char).join('');
}

export function toSubscript(value:string){
  return [...value].map(char=>subscriptMap[char]??char).join('');
}

export function insertAtSelection(value:string,start:number,end:number,insert:string){
  return `${value.slice(0,start)}${insert}${value.slice(end)}`;
}

export function normalizeScientificText(object:TextObject):TextObject{
  return {
    ...object,
    fontFamily: object.fontFamily || (containsPersianScript(object.text) ? 'B Nazanin' : 'Inter'),
    lineHeight: object.lineHeight ?? 1.2,
    letterSpacing: object.letterSpacing ?? 0,
    textDecoration: object.textDecoration ?? 'none',
    verticalAlign: object.verticalAlign ?? 'middle'
  };
}

export function estimateMinimumTextHeight(object:TextObject){
  const lines=Math.max(1,object.text.split(/\r?\n/).length);
  return Math.ceil(lines*object.fontSize*(object.lineHeight??1.2)+8);
}
