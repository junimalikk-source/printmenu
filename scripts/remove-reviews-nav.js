#!/usr/bin/env node
/**
 * One-shot: remove the "Reviews" nav link from every page.
 * Matches `<a href="...#reviews">Reviews</a>` (whitespace-tolerant)
 * including the homepage's `<a href="#reviews">Reviews</a>` form.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));

const linkRegex = /\s*<a\s+href="(?:index\.html)?#reviews"\s*>Reviews<\/a>\s*/g;

let updated = 0;
for (const file of files) {
  const fp = path.join(root, file);
  const html = fs.readFileSync(fp, 'utf8');
  if (!linkRegex.test(html)) continue;
  linkRegex.lastIndex = 0;
  const cleaned = html.replace(linkRegex, '\n        ');
  fs.writeFileSync(fp, cleaned);
  console.log(`OK   ${file}`);
  updated++;
}

console.log(`\nDone. Updated: ${updated}`);
