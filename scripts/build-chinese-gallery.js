#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = join(root, 'assets', 'menus', 'chinese');
const targetFile = join(root, 'cuisine', 'chinese-takeaway.html');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const images = readdirSync(imgDir)
  .filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()))
  .sort();

if (images.length === 0) {
  console.log('build-chinese-gallery: no images found, skipping');
  process.exit(0);
}

const slides = images
  .map(f => {
    const encoded = f.split('').map(c => encodeURIComponent(c) === c ? c : encodeURIComponent(c)).join('');
    const alt = f.replace(/\.[^.]+$/, '');
    return `            <figure class="menu-gallery-slide">\n              <img src="/assets/menus/chinese/${encoded}" alt="${alt}" loading="lazy">\n            </figure>`;
  })
  .join('\n');

const dots = images
  .map((_, i) => `        <span class="menu-gallery-dot${i === 0 ? ' is-active' : ''}"></span>`)
  .join('\n');

let src = readFileSync(targetFile, 'utf8');

const SLIDES_START = '<!-- chinese-gallery-slides:start -->';
const SLIDES_END = '<!-- chinese-gallery-slides:end -->';
const DOTS_START = '<!-- chinese-gallery-dots:start -->';
const DOTS_END = '<!-- chinese-gallery-dots:end -->';
const COUNTER_RE = /(<p class="menu-gallery-counter"[^>]*>)\s*[\d\s/]+\s*(<\/p>)/;

let updated = src;

const slidesS = updated.indexOf(SLIDES_START);
const slidesE = updated.indexOf(SLIDES_END);
if (slidesS !== -1 && slidesE !== -1) {
  updated =
    updated.slice(0, slidesS + SLIDES_START.length) +
    '\n' + slides + '\n          ' +
    updated.slice(slidesE);
}

const dotsS = updated.indexOf(DOTS_START);
const dotsE = updated.indexOf(DOTS_END);
if (dotsS !== -1 && dotsE !== -1) {
  updated =
    updated.slice(0, dotsS + DOTS_START.length) +
    '\n' + dots + '\n      ' +
    updated.slice(dotsE);
}

updated = updated.replace(COUNTER_RE, `$1${1} / ${images.length}$2`);

if (updated !== src) {
  writeFileSync(targetFile, updated);
  console.log(`build-chinese-gallery: updated cuisine/chinese-takeaway.html (${images.length} image(s))`);
} else {
  console.log('build-chinese-gallery: no changes needed');
}
