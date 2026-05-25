// One-off codemod: add defer to <script src="js/main.min.js"></script> across all HTML files.
// main.min.js is at end of body so impact on FCP is small, but defer keeps it out of TBT (Total Blocking Time).
// Usage: node scripts/defer-main-js.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Matches  <script src="[../]js/main.min.js?v=NUMBER"></script>  (without defer/async).
const PATTERN = /<script src="((?:\.\.\/)?js\/main\.min\.js\?v=\d+)"><\/script>/g;
const REPLACEMENT = '<script src="$1" defer></script>';

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
  if (!PATTERN.test(content)) {
    skipped++;
    continue;
  }
  // Reset regex state (lastIndex sticks because of /g flag)
  PATTERN.lastIndex = 0;
  const replaced = content.replace(PATTERN, REPLACEMENT);
  writeFileSync(file, replaced, 'utf8');
  console.log('✓ ' + file.replace(root, '.'));
  changed++;
}

console.log(`\nDone: ${changed} changed, ${skipped} skipped (no match)`);
