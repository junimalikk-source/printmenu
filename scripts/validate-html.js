#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = readdirSync(root).filter(f => f.endsWith('.html'));

const checks = [
  { name: 'head-shared:start marker', test: s => s.includes('<!-- head-shared:start -->') },
  { name: 'head-shared:end marker', test: s => s.includes('<!-- head-shared:end -->') },
  { name: '<title>', test: s => /<title>[^<]+<\/title>/i.test(s) },
  { name: '<link rel="canonical">', test: s => /<link\s+rel=["']canonical["']/i.test(s) },
];

let failed = 0;
for (const file of htmlFiles) {
  const src = readFileSync(join(root, file), 'utf8');
  const missing = checks.filter(c => !c.test(src)).map(c => c.name);
  if (missing.length) {
    console.error(`FAIL ${file}: missing ${missing.join(', ')}`);
    failed++;
  } else {
    console.log(`ok   ${file}`);
  }
}

if (failed) {
  console.error(`\nvalidate-html: ${failed} file(s) failed`);
  process.exit(1);
}
console.log(`\nvalidate-html: all ${htmlFiles.length} file(s) passed`);
