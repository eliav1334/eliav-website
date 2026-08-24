#!/usr/bin/env node
/**
 * check-agentic.mjs — AI-agent readiness check.
 *
 * Two layers:
 *  1. LOCAL — assertions we own, run against the live site with plain curl-equivalents.
 *     These are the things that silently regress: markdown negotiation, the Vary header,
 *     a real 404 with recovery links, contactPoint in the schema, the /privacy trust anchor,
 *     and the when-to-use section in llms.txt.
 *  2. REMOTE — the is-agentic.com score (https://is-agentic.com/scan/eliavafar.co.il).
 *     Skipped with --no-remote, or when the API is unreachable; a remote failure never
 *     fails the run, because a third-party outage is not a site regression.
 *
 * Usage: npm run check-agentic [-- --no-remote] [-- --url=https://...]
 * Exit 1 only when a LOCAL assertion fails.
 */

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith('--url=')) || '--url=https://eliavafar.co.il').slice(6).replace(/\/$/, '');
const SKIP_REMOTE = args.includes('--no-remote');
const TIMEOUT = 15000;

let failed = 0;
let warned = 0;

function pass(name, detail) { console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail) { console.log(`  \x1b[31m✗\x1b[0m ${name} — ${detail}`); failed++; }
function warn(name, detail) { console.log(`  \x1b[33m!\x1b[0m ${name} — ${detail}`); warned++; }

async function get(path, headers = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(BASE + path, { headers, signal: ctl.signal, redirect: 'follow' });
    return { status: res.status, headers: res.headers, body: await res.text() };
  } finally {
    clearTimeout(t);
  }
}

console.log(`\n🤖 בדיקת מוכנות לסוכני AI — ${BASE}\n`);

// ── 1. Markdown content negotiation (acceptmarkdown.com) ──────────────────
console.log('1. משא-ומתן על תוכן Markdown');
try {
  const md = await get('/', { Accept: 'text/markdown' });
  const ct = (md.headers.get('content-type') || '').toLowerCase();
  const vary = (md.headers.get('vary') || '').toLowerCase();

  if (ct.includes('text/markdown')) pass('Accept: text/markdown מחזיר markdown', ct);
  else fail('Accept: text/markdown', `הוחזר ${ct || 'ללא Content-Type'} במקום text/markdown`);

  if (vary.includes('accept') && !/^accept-encoding\s*$/.test(vary)) pass('Vary כולל Accept', vary);
  else fail('Vary header', `חסר Accept (התקבל "${vary || 'none'}") — CDN עלול להגיש HTML לסוכן`);

  if (/^#\s/m.test(md.body)) pass('הגוף הוא markdown אמיתי', `${md.body.length} תווים`);
  else fail('גוף התשובה', 'לא נראה כמו markdown (אין כותרת # בתחילת שורה)');

  const html = await get('/', { Accept: 'text/html' });
  if ((html.headers.get('content-type') || '').includes('text/html')) pass('Accept: text/html עדיין מחזיר HTML');
  else fail('רגרסיה', 'דפדפנים רגילים כבר לא מקבלים HTML — קריטי!');
} catch (e) {
  fail('משא-ומתן Markdown', e.message);
}

// ── 2. Agent-friendly 404 ─────────────────────────────────────────────────
console.log('\n2. דף 404 ידידותי לסוכנים');
try {
  const r = await get('/this-path-does-not-exist-' + Date.now());
  if (r.status === 404 || r.status === 410) pass('סטטוס HTTP', String(r.status));
  else fail('סטטוס HTTP', `${r.status} במקום 404 — סוכן יחשוב שכל נתיב קיים`);

  const hasRecovery = r.body.includes('sitemap.xml') && r.body.includes('llms.txt');
  if (hasRecovery) pass('קישורי התאוששות', 'sitemap.xml + llms.txt מופיעים בגוף');
  else fail('קישורי התאוששות', 'הגוף לא מפנה ל-sitemap.xml ול-llms.txt');

  if (r.body.includes('agent-recovery')) pass('מפת התאוששות בפורמט markdown');
  else warn('מפת התאוששות', 'בלוק agent-recovery חסר');
} catch (e) {
  fail('בדיקת 404', e.message);
}

// ── 3. Agent instruction / when-to-use ────────────────────────────────────
console.log('\n3. הנחיה לסוכנים (מתי להמליץ עלינו)');
for (const f of ['/llms.txt', '/llms-full.txt']) {
  try {
    const r = await get(f);
    if (r.status !== 200) { fail(f, `HTTP ${r.status}`); continue; }
    const hasWhen = /##\s*When to Use This Business/i.test(r.body);
    const hasNot = /When NOT to recommend/i.test(r.body);
    const hasHandoff = /How an agent should hand off/i.test(r.body);
    if (hasWhen && hasNot && hasHandoff) pass(f, 'when-to-use + when-not + handoff');
    else fail(f, `חסר: ${[!hasWhen && 'when-to-use', !hasNot && 'when-not', !hasHandoff && 'handoff'].filter(Boolean).join(', ')}`);
  } catch (e) {
    fail(f, e.message);
  }
}

// ── 4. Organization schema completeness ───────────────────────────────────
console.log('\n4. שלמות סכמת הארגון');
try {
  const r = await get('/');
  const blocks = [...r.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let org = null;
  for (const b of blocks) {
    let j;
    try { j = JSON.parse(b[1]); } catch { continue; }
    const types = [].concat(j['@type'] || []);
    if (types.some((t) => /Organization|LocalBusiness|Contractor/i.test(t))) { org = j; break; }
  }
  if (!org) {
    fail('סכמת ארגון', 'לא נמצאה סכמת Organization/LocalBusiness תקינה בדף הבית');
  } else {
    for (const field of ['contactPoint', 'address', 'telephone', 'email', 'areaServed', 'openingHoursSpecification']) {
      if (org[field]) pass(field);
      else fail(field, 'חסר בסכמה');
    }
    const cp = [].concat(org.contactPoint || []);
    if (cp.length && cp.every((c) => c.contactType && (c.telephone || c.email))) pass('contactPoint תקין', `${cp.length} ערוצים`);
    else if (cp.length) fail('contactPoint', 'חסר contactType או פרטי קשר');
  }
} catch (e) {
  fail('סכמת ארגון', e.message);
}

// ── 5. Trust anchor pages ─────────────────────────────────────────────────
console.log('\n5. דפי אמון');
for (const [path, label] of [['/about', 'אודות'], ['/contact', 'צור קשר'], ['/privacy', 'מדיניות פרטיות']]) {
  try {
    const r = await get(path);
    if (r.status !== 200) { fail(`${label} (${path})`, `HTTP ${r.status}`); continue; }
    const text = r.body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
    if (text.replace(/\s+/g, ' ').trim().length >= 500) pass(`${label} (${path})`, `${text.replace(/\s+/g, ' ').trim().length} תווי טקסט`);
    else fail(`${label} (${path})`, 'פחות מ-500 תווי תוכן');
  } catch (e) {
    fail(label, e.message);
  }
}

// ── 6. Remote score from is-agentic.com ───────────────────────────────────
let remoteScore = null;
if (!SKIP_REMOTE) {
  console.log('\n6. ציון is-agentic.com');
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 90000);
    const res = await fetch(`https://is-agentic.com/api/v1/report?url=${encodeURIComponent(BASE)}`, {
      headers: { accept: 'application/json' }, signal: ctl.signal
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    remoteScore = j.score;
    const open = (j.issues || []).filter((i) => i.result !== 'passed');
    console.log(`  ציון: ${j.score}/100 — ${j.score_label || ''}`);
    if (!open.length) pass('אין ממצאים פתוחים');
    for (const i of open) {
      const icon = i.result === 'failed' ? '✗' : '!';
      console.log(`  ${icon} [${i.tier}] ${i.name} — ${i.details}`);
    }
    if (j.score < 100) warn('ציון', `${j.score}/100 — ${open.length} ממצאים פתוחים`);
  } catch (e) {
    warn('is-agentic.com', `לא נשלף (${e.message}) — לא נחשב ככישלון`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
if (failed === 0) {
  console.log(`✅ כל בדיקות מוכנות-הסוכנים עברו${warned ? ` (${warned} אזהרות)` : ''}${remoteScore !== null ? ` · ציון חיצוני ${remoteScore}/100` : ''}`);
  process.exit(0);
} else {
  console.log(`❌ ${failed} בדיקות נכשלו${warned ? `, ${warned} אזהרות` : ''}`);
  process.exit(1);
}
