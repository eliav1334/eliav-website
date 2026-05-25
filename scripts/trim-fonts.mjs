// One-off codemod: drop Heebo weight 800 (3 uses in CSS, falls back to synthetic bold from 700).
// Saves ~30-50KB on first load. Visual diff is minimal — only h1/hero text uses 800.
// Usage: node scripts/trim-fonts.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OLD = 'family=Heebo:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700';
const NEW = 'family=Heebo:wght@400;500;600;700&family=Rubik:wght@400;500;600;700';

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
let skipped = 0;

for (const file of htmlFiles(root)) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes(OLD)) {
    skipped++;
    continue;
  }
  // replaceAll handles both the stylesheet link + noscript fallback
  writeFileSync(file, content.replaceAll(OLD, NEW), 'utf8');
  console.log('✓ ' + file.replace(root, '.'));
  changed++;
}

console.log(`\nDone: ${changed} changed, ${skipped} skipped`);
