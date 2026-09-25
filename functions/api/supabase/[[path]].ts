const DEFAULT_SUPABASE_URL = 'https://bovvqelbnqocllsxssus.supabase.co';
const PREFIX = '/api/supabase';
const ALLOWED_PATH = /^\/(?:auth|rest|storage)\/v1(?:\/|$)/;

type Context = {request:Request;env:{SUPABASE_URL?:string;VITE_SUPABASE_URL?:string}};

/** Forward only Supabase's public API paths to the configured project. */
export async function onRequest({request,env}:Context):Promise<Response>{
  const incoming=new URL(request.url);
  const path=incoming.pathname.slice(PREFIX.length);
  if(!incoming.pathname.startsWith(`${PREFIX}/`)||!ALLOWED_PATH.test(path))
    return new Response('Not found',{status:404});

  const upstream=new URL(env.SUPABASE_URL||env.VITE_SUPABASE_URL||DEFAULT_SUPABASE_URL);
  upstream.pathname=path;
  upstream.search=incoming.search;
  const headers=new Headers(request.headers);
  // BioPlot cookies belong to our site and must not be sent to Supabase.
  headers.delete('cookie');
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

  try{
    const response=await fetch(new Request(upstream.toString(),{
      method:request.method,
      headers,
      body:request.method==='GET'||request.method==='HEAD'?undefined:request.body,
      redirect:'manual',
      duplex:'half',
    } as RequestInit & {duplex:'half'}));
    const responseHeaders=new Headers(response.headers);
    const location=responseHeaders.get('location');
    if(location){
      const destination=new URL(location,upstream);
      if(destination.origin===upstream.origin){
        destination.protocol=incoming.protocol;
        destination.host=incoming.host;
        destination.pathname=`${PREFIX}${destination.pathname}`;
        responseHeaders.set('location',destination.toString());
      }
    }
    responseHeaders.delete('set-cookie');
    if(path.startsWith('/auth/'))responseHeaders.set('cache-control','no-store');
    return new Response(response.body,{status:response.status,headers:responseHeaders});
  }catch{
    return new Response(JSON.stringify({message:'Authentication service is temporarily unavailable.'}),{
      status:502,headers:{'content-type':'application/json','cache-control':'no-store'},
    });
  }
}
