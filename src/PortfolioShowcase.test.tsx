// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {PortfolioShowcasePortal} from './PortfolioShowcase';
const {load}=vi.hoisted(()=>({load:vi.fn()}));
vi.mock('./showcasePortfolio',()=>({loadPublishedShowcaseItems:load,showcasePublicUrl:(path:string)=>path}));

describe('Home portfolio',()=>{
  it('loads without waiting for an intersection and switches the visible slide',async()=>{
    load.mockResolvedValue([{id:'one',storagePath:'/one.jpg'},{id:'two',storagePath:'/two.jpg'}]);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
    vi.stubGlobal('matchMedia',()=>({matches:true}));
    const host=document.createElement('div');
    const content=document.createElement('div');content.className='home-content';
    document.body.append(host,content);
    document.documentElement.lang='fa';
    const root=createRoot(host);
    try{
      await act(async()=>{root.render(<PortfolioShowcasePortal/>);});
      expect(load).toHaveBeenCalledOnce();
      expect(content.querySelector('h2')?.textContent).toBe('نمونه‌کارهای طراحی شکل علمی');
      expect(content.querySelector('.portfolio-slide.active img')?.getAttribute('src')).toBe('/one.jpg');
      await act(async()=>{content.querySelector<HTMLButtonElement>('[aria-label="تصویر بعدی"]')!.click();});
      expect(content.querySelector('.portfolio-slide.active img')?.getAttribute('src')).toBe('/two.jpg');
    }finally{
      await act(async()=>root.unmount());host.remove();content.remove();vi.unstubAllGlobals();
    }
  });
});
