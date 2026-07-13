// Guards against a broken <meta> tag — an unescaped " inside content="…" silently
// truncates the attribute, so Google indexes half a description (or garbage).
// Hit this exactly once by typing ס"מ into a description; never again.
// Run before committing any change to a title/description:  npm run check-meta

import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (extname(entry.name) === '.html') acc.push(full);
  }
  return acc;
}

const META = /<meta[^>]*?(?:name|property)="(description|og:description|twitter:description|og:title|twitter:title)"[^>]*>/g;
const files = htmlFiles('.');
let broken = 0;
let longDesc = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const [tag, kind] of [...html.matchAll(META)].map((m) => [m[0], m[1]])) {
    const content = tag.match(/content="([^"]*)"/);
    if (!content) {
      console.log(`❌ ${file} — ${kind}: content לא ניתן לקריאה`);
      broken++;
      continue;
    }
    // Anything after the closing quote of content="…" other than / and > means the
    // attribute closed early — i.e. a stray " inside the text broke the tag.
    const tail = tag.slice(tag.indexOf(content[0]) + content[0].length).replace(/[\s/>]/g, '');
    if (tail) {
      console.log(`❌ ${file} — ${kind}: תגית שבורה (גרשיים לא מוברחים). שארית: ${tail.slice(0, 40)}`);
      broken++;
    } else if (kind === 'description' && content[1].length > 160) {
      console.log(`⚠️  ${file} — description באורך ${content[1].length} תווים (גוגל חותך ~160)`);
      longDesc++;
    }
  }
}

console.log(
  broken === 0
    ? `✅ כל תגיות ה-meta תקינות ב-${files.length} דפים${longDesc ? ` (${longDesc} ארוכות מדי — לא חוסם)` : ''}`
    : `🔴 ${broken} תגיות שבורות`
);
process.exit(broken === 0 ? 0 : 1);
