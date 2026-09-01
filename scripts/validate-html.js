#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// 'admin' holds staff-only tools — they carry no shared partials, no canonical
// URL and deliberately no marketing tags, so they sit outside this pipeline.
const SKIP_DIRS = new Set(['_partials', 'node_modules', '.git', 'scripts', 'assets', 'functions', 'admin']);

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry) && !entry.startsWith('.')) results.push(...findHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = findHtmlFiles(root);

const checks = [
  { name: 'head-shared:start marker', test: s => s.includes('<!-- head-shared:start -->') },
  { name: 'head-shared:end marker', test: s => s.includes('<!-- head-shared:end -->') },
  { name: 'body-start:start marker', test: s => s.includes('<!-- body-start:start -->') },
  { name: 'body-start:end marker', test: s => s.includes('<!-- body-start:end -->') },
  { name: '<title>', test: s => /<title>[^<]+<\/title>/i.test(s) },
  { name: '<link rel="canonical">', test: s => /<link\s+rel=["']canonical["']/i.test(s) },
];

let failed = 0;
for (const file of htmlFiles) {
  const src = readFileSync(file, 'utf8');
  const missing = checks.filter(c => !c.test(src)).map(c => c.name);
  const rel = file.replace(root + '/', '');
  if (missing.length) {
    console.error(`FAIL ${rel}: missing ${missing.join(', ')}`);
    failed++;
  } else {
    console.log(`ok   ${rel}`);
  }
}

if (failed) {
  console.error(`\nvalidate-html: ${failed} file(s) failed`);
  process.exit(1);
}
console.log(`\nvalidate-html: all ${htmlFiles.length} file(s) passed`);
