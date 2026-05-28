// Bump cache-bust on main.min.js so browsers fetch the new code immediately.
// Usage: node scripts/bump-cache.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OLD_VER = '1773646593';
const NEW_VER = String(Math.floor(Date.now() / 1000));

const PATTERN_ROOT = new RegExp(`js/main\\.min\\.js\\?v=${OLD_VER}`, 'g');
const PATTERN_NEW_ROOT = `js/main.min.js?v=${NEW_VER}`;

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'scripts') continue;
      yield* htmlFiles(full);
    } else if (entry.endsWith('.html')) {
      yield full;
    }
  }
}

const root = process.cwd();
let changed = 0;

for (const file of htmlFiles(root)) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes(`main.min.js?v=${OLD_VER}`)) continue;
  const replaced = content.replaceAll(`main.min.js?v=${OLD_VER}`, `main.min.js?v=${NEW_VER}`);
  writeFileSync(file, replaced, 'utf8');
  console.log('✓ ' + file.replace(root, '.'));
  changed++;
}

console.log(`\nDone: ${changed} files | new version: ${NEW_VER}`);
