import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
const entry = resolve(dist, 'service-runtime.html');
if (!existsSync(entry)) throw new Error('Missing service runtime Vite entry: service-runtime.html');
const compiled = readFileSync(entry, 'utf8');
const assetTags = [...compiled.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="\/assets\/[^"]+"[^>]*>/g)]
  .map(match => match[0]);
if (!assetTags.some(tag => tag.includes('<script'))) {
  throw new Error('Service page runtime JavaScript was not emitted by Vite.');
}
if (!assetTags.some(tag => tag.startsWith('<link') && tag.includes('.css'))) {
  throw new Error('Service page Home chrome stylesheet was not emitted by Vite.');
}
for(const lang of ['fa', 'en']) {
  for(const slug of ['scientific-illustration', 'graphical-abstract', 'scientific-poster']) {
    const file = resolve(dist, 'services', lang, slug, 'index.html');
    const before = readFileSync(file, 'utf8');
    const marker = '<!-- BIOPLOT_SERVICE_RUNTIME -->';
    if (!before.includes(marker)) throw new Error(`Missing runtime marker in ${file}`);
    writeFileSync(file, before.replace(marker, assetTags.join('\n')), 'utf8');
  }
}
unlinkSync(entry);
console.log('Injected shared BioPlot Home header/footer runtime into six service pages.');
