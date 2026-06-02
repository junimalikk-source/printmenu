#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SKIP_DIRS = new Set(['_partials', 'node_modules', '.git', 'scripts', 'assets', 'functions']);

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

const partials = readdirSync(join(root, '_partials'))
  .filter(f => f.endsWith('.html'))
  .map(f => ({
    name: basename(f, '.html'),
    content: readFileSync(join(root, '_partials', f), 'utf8').trim(),
  }));

const htmlFiles = findHtmlFiles(root);

let totalUpdated = 0;

for (const path of htmlFiles) {
  let src = readFileSync(path, 'utf8');
  let fileUpdated = false;

  for (const { name, content } of partials) {
    const START = `<!-- ${name}:start -->`;
    const END = `<!-- ${name}:end -->`;

    const startIdx = src.indexOf(START);
    const endIdx = src.indexOf(END);
    if (startIdx === -1 || endIdx === -1) continue;

    const lineStart = src.lastIndexOf('\n', startIdx) + 1;
    const indent = src.slice(lineStart, startIdx).match(/^\s*/)[0];

    const indented = content
      .split('\n')
      .map(line => (line ? indent + line : ''))
      .join('\n');

    const next =
      src.slice(0, startIdx + START.length) +
      '\n' + indented + '\n' + indent +
      src.slice(endIdx);

    if (next !== src) {
      src = next;
      fileUpdated = true;
    }
  }

  if (fileUpdated) {
    writeFileSync(path, src);
    totalUpdated++;
    const rel = path.replace(root + '/', '');
    console.log(`updated: ${rel}`);
  }
}

console.log(`build-partials: ${totalUpdated} file(s) updated`);
