#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- head-shared:start -->';
const END = '<!-- head-shared:end -->';

const partial = readFileSync(join(root, '_partials/head-shared.html'), 'utf8').trim();

const htmlFiles = readdirSync(root).filter(f => f.endsWith('.html'));

let updated = 0;
let skipped = [];

for (const file of htmlFiles) {
  const path = join(root, file);
  const src = readFileSync(path, 'utf8');

  const startIdx = src.indexOf(START);
  const endIdx = src.indexOf(END);

  if (startIdx === -1 || endIdx === -1) {
    skipped.push(file);
    continue;
  }

  const lineStart = src.lastIndexOf('\n', startIdx) + 1;
  const indent = src.slice(lineStart, startIdx).match(/^\s*/)[0];

  const indented = partial
    .split('\n')
    .map(line => (line ? indent + line : ''))
    .join('\n');

  const before = src.slice(0, startIdx + START.length);
  const after = src.slice(endIdx);
  const next = `${before}\n${indented}\n${indent}${after}`;

  if (next !== src) {
    writeFileSync(path, next);
    updated++;
    console.log(`updated: ${file}`);
  }
}

if (skipped.length) {
  console.log(`skipped (no markers): ${skipped.join(', ')}`);
}
console.log(`build-head: ${updated} file(s) updated, ${skipped.length} skipped`);
