import {afterEach,describe,expect,it,vi} from 'vitest';
import {onRequest} from '../functions/api/supabase/[[path]]';

const env={SUPABASE_URL:'https://project.supabase.co'};
afterEach(()=>vi.unstubAllGlobals());

describe('same-origin Supabase proxy',()=>{
 it('forwards a password auth request without sending site cookies',async()=>{
  const upstream=vi.fn(async(request:Request)=>{
   expect(request.url).toBe('https://project.supabase.co/auth/v1/token?grant_type=password');
   expect(request.method).toBe('POST');
   expect(request.headers.get('authorization')).toBe('Bearer public-key');
   expect(request.headers.get('cookie')).toBeNull();
   expect(await request.text()).toBe('{"email":"test@example.com"}');
   return new Response('{"access_token":"token"}',{headers:{'content-type':'application/json'}});
  });
  vi.stubGlobal('fetch',upstream);
  const request=new Request('https://bioplot.pages.dev/api/supabase/auth/v1/token?grant_type=password',{
   method:'POST',headers:{authorization:'Bearer public-key',cookie:'private-site-cookie'},body:'{"email":"test@example.com"}',
  });
  const response=await onRequest({request,env});
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await response.json()).toEqual({access_token:'token'});
  expect(upstream).toHaveBeenCalledOnce();
 });
 it('forwards published images and rejects paths outside Supabase APIs',async()=>{
  const upstream=vi.fn(async(request:Request)=>{
   expect(request.url).toBe('https://project.supabase.co/storage/v1/object/public/public-assets/image.png');
   return new Response('image',{headers:{'content-type':'image/png'}});
  });
  vi.stubGlobal('fetch',upstream);
  const image=await onRequest({request:new Request('https://bioplot.pages.dev/api/supabase/storage/v1/object/public/public-assets/image.png'),env});
  expect(await image.text()).toBe('image');
  expect((await onRequest({request:new Request('https://bioplot.pages.dev/api/supabase/evil'),env})).status).toBe(404);
  expect(upstream).toHaveBeenCalledOnce();
 });
 it('returns a real HTTP error when the upstream network fails',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>{throw new TypeError('Failed to fetch');}));
  const response=await onRequest({request:new Request('https://bioplot.pages.dev/api/supabase/auth/v1/user'),env});
  expect(response.status).toBe(502);
 });
});
