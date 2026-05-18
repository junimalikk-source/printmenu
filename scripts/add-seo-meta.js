#!/usr/bin/env node
/**
 * One-shot script: add OG + Twitter + theme-color meta tags to all
 * inner HTML pages (every .html except index.html which already has OG).
 *
 * For privacy.html and terms.html, also add <meta name="robots" content="noindex,follow">
 *
 * Idempotent: skips pages that already have og:title.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const OG_IMAGE = 'https://printmenu.co.uk/assets/og-image.svg';
const THEME_COLOR = '#11295A';
const NOINDEX_PAGES = new Set(['privacy.html', 'terms.html']);

const files = fs.readdirSync(root).filter(
  (f) => f.endsWith('.html') && f !== 'index.html'
);

let updated = 0;
let skipped = 0;

for (const file of files) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, 'utf8');

  if (html.includes('property="og:title"')) {
    skipped++;
    continue;
  }

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);

  if (!titleMatch || !descMatch || !canonMatch) {
    console.warn(`SKIP ${file} — missing title/description/canonical`);
    skipped++;
    continue;
  }

  const title = titleMatch[1].trim();
  const desc = descMatch[1].trim();
  const url = canonMatch[1].trim();

  const ogBlock = [
    '',
    `  <meta property="og:title" content="${title}">`,
    `  <meta property="og:description" content="${desc}">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:image" content="${OG_IMAGE}">`,
    `  <meta property="og:locale" content="en_GB">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${title}">`,
    `  <meta name="twitter:description" content="${desc}">`,
    `  <meta name="twitter:image" content="${OG_IMAGE}">`,
    `  <meta name="theme-color" content="${THEME_COLOR}">`,
  ].join('\n');

  // Insert OG block right after the canonical link line
  html = html.replace(
    /(<link\s+rel="canonical"\s+href="[^"]+">)/,
    `$1${ogBlock}`
  );

  // Add noindex for legal pages
  if (NOINDEX_PAGES.has(file) && !html.includes('name="robots"')) {
    html = html.replace(
      /(<link\s+rel="canonical"\s+href="[^"]+">)/,
      `$1\n  <meta name="robots" content="noindex,follow">`
    );
  }

  fs.writeFileSync(fp, html);
  console.log(`OK   ${file}`);
  updated++;
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
