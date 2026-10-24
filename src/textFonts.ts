import textFontCss from './fonts/text-fonts.txt?raw';

// Figure-only fonts are also embedded in exported SVGs. Defer their browser
// registration until the editor loads, keeping them off the home-page bundle.
if(!document.getElementById('bioplot-text-fonts')){
  const style=document.createElement('style');
  style.id='bioplot-text-fonts';
  style.textContent=textFontCss;
  document.head.appendChild(style);
}
