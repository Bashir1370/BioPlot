const state={lang:'en'};
const langBtn=document.getElementById('langBtn');
const search=document.querySelector('.search-global input');

function applyLanguage(){
  const fa=state.lang==='fa';
  document.documentElement.lang=fa?'fa':'en';
  document.documentElement.dir=fa?'rtl':'ltr';
  document.body.classList.toggle('rtl',fa);
  langBtn.textContent=fa?'EN':'FA';
  document.querySelectorAll('[data-en]').forEach(el=>{el.textContent=fa?el.dataset.fa:el.dataset.en});
  document.querySelectorAll('[data-ph-en]').forEach(el=>{el.placeholder=fa?el.dataset.phFa:el.dataset.phEn});
}

langBtn.addEventListener('click',()=>{
  state.lang=state.lang==='en'?'fa':'en';
  localStorage.setItem('bioplot-lang',state.lang);
  applyLanguage();
});

search.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&search.value.trim()){
    window.location.href=`editor.html?search=${encodeURIComponent(search.value.trim())}`;
  }
});

state.lang=localStorage.getItem('bioplot-lang')||'en';
applyLanguage();
