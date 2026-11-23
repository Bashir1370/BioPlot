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
const stylesheetTag = stylesheetTags.find(tag => /\.css(?:["?])/.test(tag));
if (!stylesheetTag) {
  throw new Error('Service page Home chrome stylesheet was not emitted by Vite.');
}

// Verify the emitted CSS really contains both shared Home chrome components.
const href = stylesheetTag.match(/href="([^"]+)"/)?.[1];
if (!href) throw new Error('Could not read the service runtime stylesheet URL.');
const stylesheetPath = resolve(dist, href.replace(/^\//, ''));
if (!existsSync(stylesheetPath)) {
  throw new Error('Service page stylesheet asset is missing: ' + stylesheetPath);
}
const stylesheet = readFileSync(stylesheetPath, 'utf8');
for (const selector of ['.home-header-inner', '.home-footer-inner']) {
  if (!stylesheet.includes(selector)) {
    throw new Error('Service page stylesheet is missing shared Home chrome selector: ' + selector);
  }
}

for (const lang of ['fa', 'en']) {
  for (const slug of ['scientific-illustration', 'graphical-abstract', 'scientific-poster']) {
    const file = resolve(dist, 'services', lang, slug, 'index.html');
    const before = readFileSync(file, 'utf8');
    const marker = '<!-- BIOPLOT_SERVICE_RUNTIME -->';
    if (!before.includes(marker)) throw new Error('Missing runtime marker in ' + file);

    // Stylesheets belong in <head>. Leaving the Vite CSS link beside the body
    // mount marker made the no-JavaScript HTML fallback render without Home styles.
    if (!before.includes('</head>')) throw new Error('Missing </head> in ' + file);
    let html = before.replace('</head>', '  ' + stylesheetTag + '\n</head>');
    html = html.replace(marker, scriptTags.join('\n'));

    const headEnd = html.indexOf('</head>');
    const cssIndex = html.indexOf(stylesheetTag);
    if (cssIndex < 0 || cssIndex > headEnd) {
      throw new Error('Home chrome stylesheet was not inserted into <head> for ' + file);
    }
    if (html.includes(marker)) throw new Error('Runtime marker was not replaced in ' + file);
    writeFileSync(file, html, 'utf8');
  }
}
unlinkSync(entry);
console.log('Injected shared Home chrome stylesheet in <head> and runtime script into all six service pages.');
