#!/usr/bin/env node
/**
 * check-visual.mjs — catches the class of silent visual bug that CSS/meta checks miss.
 *
 * Written 19/07/2026 after three defects shipped unnoticed, all invisible to
 * check-site (which only asks "does the URL return 200?"):
 *   1. `.why-card p br { display:none }` on mobile collapsed `לתוצאה<br/>הטובה`
 *      into `לתוצאההטובה`, because the HTML had no space around the <br/>.
 *   2. Headings declared `font-weight: 800` while the Google Fonts request only
 *      asked for 400-700, so they silently rendered at 700.
 *   3. Footer padding was too small to clear the fixed accessibility button,
 *      which ended up covering the "הצהרת נגישות" link itself.
 *
 * These are static checks — no browser needed, so they can run on every commit.
 * Run: npm run check-visual
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// fileURLToPath, not URL.pathname — the repo lives under a Hebrew path, which
// pathname hands back percent-encoded and fs then cannot find.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const htmlFiles = [
  ...readdirSync(ROOT).filter(f => f.endsWith('.html')).map(f => f),
  ...readdirSync(join(ROOT, 'blog')).filter(f => f.endsWith('.html')).map(f => `blog/${f}`),
];

const problems = [];
const note = (file, rule, detail) => problems.push({ file, rule, detail });

// ── 1. <br/> with no surrounding space, inside selectors whose <br> we hide on mobile ──
// If the break is removed at narrow widths the words fuse together.
const css = readFileSync(join(ROOT, 'css/style.css'), 'utf8');
const hiddenBrSelectors = [...css.matchAll(/([^{}]+)\s+br\s*\{[^}]*display:\s*none/g)]
  .map(m => m[1].trim().split(/\s+/)[0].replace(/^\./, ''));

for (const file of htmlFiles) {
  const html = readFileSync(join(ROOT, file), 'utf8');
  // Only pages that actually use one of those classes can hit this bug.
  const relevant = hiddenBrSelectors.filter(cls => html.includes(cls));
  if (!relevant.length) continue;

  // Scan <p> elements directly. An earlier version tried to slice out the card
  // <div> first and silently caught nothing: the lazy match stopped at the inner
  // icon </div>, before ever reaching the <p> that held the <br/>.
  for (const p of html.matchAll(/<p[^>]*>((?:[^<]|<br\s*\/?>)*)<\/p>/g)) {
    for (const m of p[1].matchAll(/(.)<br\s*\/?>(.)/g)) {
      if (m[1] !== ' ' && m[2] !== ' ') {
        note(file, 'br-no-space',
          `"${m[1]}<br/>${m[2]}" — .${relevant[0]} hides <br> on mobile, so these words fuse. Put a space before the <br/>.`);
      }
    }
  }
}

// ── 2. font-weight declared in CSS but never requested from Google Fonts ──
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
const fontReq = {};
for (const m of indexHtml.matchAll(/family=([A-Za-z+]+):wght@([\d;]+)/g)) {
  fontReq[m[1].replace(/\+/g, ' ')] = m[2].split(';');
}
// which family does each weight belong to? approximate: check both families carry it
const declaredWeights = [...new Set([...css.matchAll(/font-weight:\s*(\d{3})/g)].map(m => m[1]))];
for (const w of declaredWeights) {
  const familiesMissing = Object.entries(fontReq)
    .filter(([, list]) => !list.includes(w))
    .map(([fam]) => fam);
  if (familiesMissing.length === Object.keys(fontReq).length && Object.keys(fontReq).length) {
    note('css/style.css', 'font-weight-not-loaded',
      `font-weight:${w} is used but no font family requests it (${Object.keys(fontReq).join(', ')}). It will silently render at the nearest available weight.`);
  }
}

// ── 3. mobile footer must clear the fixed overlays that sit above the viewport bottom ──
// Measured 19/07 at 390x844: CTA bar ~75px tall, accessibility toggle reaches ~205px up.
const MIN_FOOTER_CLEARANCE = 200;
const mobileFooter = css.match(/@media \(max-width: 768px\)[\s\S]*?footer\s*\{[^}]*padding-bottom:\s*(\d+)px/);
if (mobileFooter) {
  const px = Number(mobileFooter[1]);
  if (px < MIN_FOOTER_CLEARANCE) {
    note('css/style.css', 'footer-under-fixed-ui',
      `mobile footer padding-bottom is ${px}px, under the ${MIN_FOOTER_CLEARANCE}px needed to clear the fixed CTA bar and accessibility button. Footer links end up unclickable.`);
  }
} else {
  note('css/style.css', 'footer-under-fixed-ui', 'could not find a mobile footer padding-bottom rule to verify.');
}

// ── 4. separators and figures that can be orphaned by a line break ──
// On a narrow screen "קבלן רשום | מעל 10 שנות ניסיון | ק.ר 36281" broke so that a
// lone "|" started a line, and "10+" landed above "שנות ניסיון". Both read as
// broken text. A .nowrap span (or &nbsp;) around the phrase prevents it.
for (const file of htmlFiles) {
  const html = readFileSync(join(ROOT, file), 'utf8');
  for (const m of html.matchAll(/<(p|div|span|h[1-6])[^>]*class="[^"]*(?:badge|subtitle|hero)[^"]*"[^>]*>([\s\S]{0,400}?)<\/\1>/g)) {
    const inner = m[2];
    const text = inner.replace(/<[^>]*>/g, '');
    const guarded = inner.includes('nowrap') || inner.includes('&nbsp;');
    if (guarded) continue;
    if (/ \| /.test(text)) {
      note(file, 'orphanable-separator',
        `"${text.trim().slice(0, 55)}…" has a " | " separator with plain spaces — a line break can leave the "|" alone on a line. Wrap each segment in <span class="nowrap"> or bind the pipe with &nbsp;.`);
    }
    if (/\d\+ [֐-׿]/.test(text)) {
      note(file, 'orphanable-figure',
        `"${text.trim().slice(0, 55)}…" lets a figure like "10+" break away from the words after it. Wrap the phrase in <span class="nowrap">.`);
    }
  }
}

// ── report ──
if (problems.length === 0) {
  console.log(`✅ אין בעיות ויזואליות ידועות (${htmlFiles.length} דפים נבדקו)`);
  process.exit(0);
}
console.error(`❌ נמצאו ${problems.length} בעיות:\n`);
for (const p of problems) console.error(`  [${p.rule}] ${p.file}\n      ${p.detail}\n`);
process.exit(1);
