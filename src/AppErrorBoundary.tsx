import {Component,type ErrorInfo,type ReactNode} from 'react';

export class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('BioPlot could not render this page',error,info.componentStack);}
 render(){
  if(!this.state.failed)return this.props.children;
  const fa=document.documentElement.lang!=='en';
  return <main dir={fa?'rtl':'ltr'} style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f4f7f8',fontFamily:'inherit'}}>
   <section role="alert" style={{maxWidth:500,padding:32,borderRadius:18,background:'#fff',textAlign:'center',border:'1px solid #dce6e9'}}>
    <h1 style={{fontSize:23,color:'#17303f'}}>{fa?'بارگذاری صفحه کامل نشد':'The page could not finish loading'}</h1>
    <p style={{lineHeight:1.9,color:'#617780'}}>{fa?'لطفاً صفحه را دوباره بارگذاری کنید. اگر مشکل ادامه داشت، با Ctrl + Shift + R تازه‌سازی کامل انجام دهید.':'Please reload the page. If the issue persists, use Ctrl + Shift + R for a full refresh.'}</p>
    <button onClick={()=>window.location.reload()} style={{padding:'12px 22px',border:0,borderRadius:10,background:'#087b76',color:'#fff',font:'inherit',cursor:'pointer'}}>{fa?'بارگذاری دوباره':'Reload page'}</button>
    <a href="/" style={{display:'block',marginTop:18,color:'#087b76'}}>{fa?'بازگشت به خانه':'Back to Home'}</a>
   </section>
  </main>;
 }
}
