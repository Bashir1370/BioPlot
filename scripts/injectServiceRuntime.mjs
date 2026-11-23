import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
const entry = resolve(dist, 'service-runtime.html');
if (!existsSync(entry)) throw new Error('Missing service runtime Vite entry: service-runtime.html');
const compiled = readFileSync(entry, 'utf8');
const assetTags = [...compiled.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="\/assets\/[^"]+"[^>]*>/g)]
  .map(match => match[0]);
const scriptTags = assetTags.filter(tag => tag.startsWith('<script'));
const stylesheetTags = assetTags.filter(tag => tag.startsWith('<link') && /rel="stylesheet"/.test(tag));

if (!scriptTags.length) {
  throw new Error('Service page runtime JavaScript was not emitted by Vite.');
}
if (!stylesheetTags.length) {
  throw new Error('Service page Home chrome stylesheets were not emitted by Vite.');
}

// Vite may split the entry's imported styles across multiple CSS assets.
// Verify the combined stylesheets contain both shared Home chrome components.
const stylesheets = stylesheetTags.map(tag => {
  const href = tag.match(/href="([^"]+)"/)?.[1];
  if (!href) throw new Error('Could not read a service runtime stylesheet URL.');
  const stylesheetPath = resolve(dist, href.replace(/^\//, ''));
  if (!existsSync(stylesheetPath)) {
    throw new Error('Service page stylesheet asset is missing: ' + stylesheetPath);
  }
  return readFileSync(stylesheetPath, 'utf8');
}).join('\n');

for (const selector of ['.home-header-inner', '.home-footer-inner']) {
  if (!stylesheets.includes(selector)) {
    throw new Error('Service page stylesheets are missing shared Home chrome selector: ' + selector);
  }
}

for (const lang of ['fa', 'en']) {
  for (const slug of ['scientific-illustration', 'graphical-abstract', 'scientific-poster']) {
    const file = resolve(dist, 'services', lang, slug, 'index.html');
    const before = readFileSync(file, 'utf8');
    const marker = '<!-- BIOPLOT_SERVICE_RUNTIME -->';
    if (!before.includes(marker)) throw new Error('Missing runtime marker in ' + file);

    // Put every emitted CSS link in <head>; keep only JavaScript at the body marker.
    if (!before.includes('</head>')) throw new Error('Missing </head> in ' + file);
    let html = before.replace('</head>', '  ' + stylesheetTags.join('\n  ') + '\n</head>');
    html = html.replace(marker, scriptTags.join('\n'));

    const headEnd = html.indexOf('</head>');
    for (const tag of stylesheetTags) {
      const cssIndex = html.indexOf(tag);
      if (cssIndex < 0 || cssIndex > headEnd) {
        throw new Error('Home chrome stylesheet was not inserted into <head> for ' + file);
      }
    }
    if (html.includes(marker)) throw new Error('Runtime marker was not replaced in ' + file);
    writeFileSync(file, html, 'utf8');
  }
}
unlinkSync(entry);
console.log('Injected all shared Home chrome stylesheets in <head> and runtime script into all six service pages.');
