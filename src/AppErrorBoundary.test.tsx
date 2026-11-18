// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect,vi} from 'vitest';
import {AppErrorBoundary} from './AppErrorBoundary';
it('shows a recovery action instead of leaving the app blank after a render failure',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);document.documentElement.lang='fa';
 const error=vi.spyOn(console,'error').mockImplementation(()=>{});
 const host=document.createElement('div');const root=createRoot(host);
 function Broken(){throw new Error('Failed to fetch dynamically imported module');return null;}
 try{await act(async()=>root.render(<AppErrorBoundary><Broken/></AppErrorBoundary>));
 expect(host.querySelector('[role=alert]')?.textContent).toContain('بارگذاری صفحه کامل نشد');
 expect(host.querySelector('button')?.textContent).toBe('بارگذاری دوباره');expect(host.querySelector('a')?.getAttribute('href')).toBe('/');
 }finally{await act(async()=>root.unmount());error.mockRestore();vi.unstubAllGlobals();}
});
