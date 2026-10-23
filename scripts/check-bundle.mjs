import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const LIMIT_KB = 150;
const dist = 'dist';
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const files = [
  ...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])),
];

if (files.length === 0) {
  console.error('No entry scripts found in dist/index.html');
  process.exit(1);
}

let total = 0;
for (const file of files) {
  const normalizedFile = file.replace(/^\/+/, '');
  const size = gzipSync(readFileSync(join(dist, normalizedFile))).length;
  total += size;
  console.log(`${file}  ${(size / 1024).toFixed(1)} KB gzip`);
}

const totalKb = total / 1024;
console.log(`Initial JavaScript: ${totalKb.toFixed(1)} KB gzip (limit ${LIMIT_KB} KB)`);

if (totalKb > LIMIT_KB) {
  console.error('Initial JavaScript budget exceeded.');
  process.exit(1);
}
