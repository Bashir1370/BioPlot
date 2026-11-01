import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {makePreview} from '../scripts/generate-asset-previews.mjs';

describe('small deployment previews',()=>{
 it('retains transparency and aspect ratio instead of cropping the artwork',async()=>{
  const input=await sharp({create:{width:1600,height:800,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
   .composite([{input:Buffer.from('<svg width="1600" height="800"><rect x="400" y="200" width="800" height="400" fill="red"/></svg>')}]).png().toBuffer();
  const {data,info}=await makePreview(input);
  expect([info.width,info.height]).toEqual([192,96]);expect(info.format).toBe('webp');expect(data.length).toBeLessThan(input.length);
  const {data:pixels,info:raw}=await sharp(data).raw().toBuffer({resolveWithObject:true});
  expect(raw.channels).toBe(4);expect(pixels[3]).toBe(0);
  expect(pixels[(48*192+96)*4+3]).toBe(255);
 });
 it('handles standard external SVG DTD declarations without needing the DTD',async()=>{
  const {info}=await makePreview(Buffer.from('<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"><path d="M0 50h500" stroke="black"/></svg>'));
  expect([info.width,info.height]).toEqual([192,38]);
 });
 it('rejects oversized sources and XML entity declarations',async()=>{
  await expect(makePreview(Buffer.alloc(8_000_001))).rejects.toThrow('limit');
  await expect(makePreview(Buffer.from('<!DOCTYPE svg [<!ENTITY x "value">]><svg/>'))).rejects.toThrow('entities');
 });
 it('ships a valid, bounded image for every manifest entry',async()=>{
  const manifest=JSON.parse(await readFile(new URL('./generated/asset-previews.json',import.meta.url),'utf8'));
  expect(Object.keys(manifest).length).toBeGreaterThan(0);
  for(const item of Object.values(manifest)){
   const bytes=await readFile(new URL(`../public${item.url}`,import.meta.url));
   const meta=await sharp(bytes).metadata();
   expect(meta.format).toBe('webp');expect(meta.width).toBeLessThanOrEqual(192);expect(meta.height).toBeLessThanOrEqual(192);
   expect(bytes.length).toBe(item.previewBytes);expect(bytes.length).toBeLessThan(25_000);
  }
 });
});
