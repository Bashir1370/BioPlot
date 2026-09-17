import { sanitizeSvg } from './assets';
export async function prepareLineUpload(file:File):Promise<{svg:string;sourceType:'svg'|'png'}>{
  if(file.size>2_500_000)throw new Error('حداکثر حجم فایل ۲.۵ مگابایت است.');
  if(file.type==='image/svg+xml'||/\.svg$/i.test(file.name))return {svg:sanitizeSvg(await file.text()),sourceType:'svg'};
  if(file.type!=='image/png'&&!/\.png$/i.test(file.name))throw new Error('فقط فایل SVG یا PNG مجاز است.');
  const signature=new Uint8Array(await file.slice(0,8).arrayBuffer());
  if(![137,80,78,71,13,10,26,10].every((byte,index)=>signature[index]===byte))throw new Error('فایل PNG معتبر نیست.');
  const data=await new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result));
    reader.onerror=()=>reject(new Error('خواندن فایل انجام نشد.'));
    reader.readAsDataURL(new Blob([file],{type:'image/png'}));
  });
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('تصویر PNG باز نمی‌شود.'));img.src=data;
  });
  const width=image.naturalWidth,height=image.naturalHeight;
  if(!width||!height||width>8192||height>8192||width*height>32_000_000)throw new Error('ابعاد تصویر بیش از حد بزرگ یا نامعتبر است.');
  return {sourceType:'png',svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><image href="${data}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>`};
}
