// One-off codemod: replace blocking Clarity + gtag with deferred-load pattern.
// Saves ~200-400ms TBT on mobile; gtag stub stays defined so main.js calls don't break.
// Usage: node scripts/defer-analytics.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Regex matches the original blocking Clarity + gtag block (handles CRLF/LF + minor whitespace drift).
const OLD_BLOCK = /\s*<!--\s*Microsoft Clarity\s*-->\s*<script\b[^>]*>[\s\S]*?clarity\.ms\/tag[\s\S]*?<\/script>\s*<!--\s*Google tag \(gtag\.js\)\s*-->\s*<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>\s*<script>\s*window\.dataLayer[\s\S]*?gtag\('config',\s*'G-EN4K9ELZC5'\)[\s\S]*?<\/script>/;

// The replacement is line-ending agnostic — we'll match the file's prevailing line ending.
function buildReplacement(eol) {
  const lines = [
    '  <!-- Analytics stub: lets main.js call gtag() before gtag.js loads.',
    '       Real analytics load deferred to after page is interactive (LCP-safe). -->',
    '  <script>',
    '    window.dataLayer = window.dataLayer || [];',
    '    window.gtag = function(){ dataLayer.push(arguments); };',
    '    function __loadAnalytics(){',
    "      gtag('js', new Date());",
    "      gtag('config', 'G-EN4K9ELZC5');",
    '      var s=document.createElement(\'script\');',
    "      s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id=G-EN4K9ELZC5';",
    '      document.head.appendChild(s);',
    '      (function(c,l,a,r,i,t,y){',
    '        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};',
    '        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;',
    '        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);',
    '      })(window, document, "clarity", "script", "vjveyed1u4");',
    '    }',
    "    if ('requestIdleCallback' in window) {",
    '      requestIdleCallback(__loadAnalytics, { timeout: 4000 });',
    '    } else {',
    "      addEventListener('load', function(){ setTimeout(__loadAnalytics, 2000); });",
    '    }',
    '  </script>',
  ];
  return eol + lines.join(eol);
}

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
let alreadyMigrated = 0;

for (const file of htmlFiles(root)) {
  const content = readFileSync(file, 'utf8');
  if (content.includes('__loadAnalytics')) {
    alreadyMigrated++;
    continue;
  }
  if (!OLD_BLOCK.test(content)) {
    skipped++;
    continue;
  }
  // Detect prevailing line ending
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const replaced = content.replace(OLD_BLOCK, buildReplacement(eol));
  writeFileSync(file, replaced, 'utf8');
  console.log('✓ ' + file.replace(root, '.'));
  changed++;
}

console.log(`\nDone: ${changed} changed, ${alreadyMigrated} already migrated, ${skipped} skipped (no match)`);
