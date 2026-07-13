// Stamps every local CSS/JS reference in the HTML with ?v=<content-hash>.
//
// Why this exists: the site serves css/ and js/ with a one-year immutable
// Cache-Control. That is only safe while every asset URL changes whenever its
// bytes change — otherwise a returning visitor is stuck on a stale file for a
// year. Previously style.min.css and main.min.js carried hand-typed ?v=<epoch>
// stamps while accessibility.css and accessibility.js carried none at all, which
// is exactly the footgun this removes.
//
// Content-hash, not a timestamp: the URL changes if and only if the file changed,
// so re-running this is idempotent and a no-op deploy doesn't bust anyone's cache.
//
// Run before committing any change to css/ or js/:  npm run stamp

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const ASSETS = [
  'css/style.min.css',
  'css/accessibility.css',
  'js/main.min.js',
  'js/accessibility.js'
];

const hashes = new Map();
for (const asset of ASSETS) {
  const hash = createHash('md5').update(readFileSync(asset)).digest('hex').slice(0, 8);
  hashes.set(asset, hash);
}

function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (extname(entry.name) === '.html') acc.push(full);
  }
  return acc;
}

let changed = 0;
for (const file of htmlFiles('.')) {
  const before = readFileSync(file, 'utf8');
  let after = before;

  for (const [asset, hash] of hashes) {
    // Match the asset with any existing ?v=… (or none), at any relative depth.
    const pattern = new RegExp(`((?:\\.\\./)?${asset.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})(\\?v=[^"']*)?`, 'g');
    after = after.replace(pattern, (_m, path) => `${path}?v=${hash}`);
  }

  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}

for (const [asset, hash] of hashes) console.log(`  ${asset} → ?v=${hash}`);
console.log(`✅ stamped ${changed} HTML file(s)`);
