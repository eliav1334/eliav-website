#!/usr/bin/env node
// בדיקת אתר עצמאית - לא תלויה ב-GitHub Actions
// הרצה: node scripts/check-site.mjs  או  npm run check-site

const SITE = 'https://eliavafar.co.il';

const MAIN_PAGES = [
  ['/', 'דף ראשי'],
  ['/bentonite-drilling', 'קידוחי בנטונייט'],
  ['/earthworks', 'עבודות עפר'],
  ['/drainage-pits', 'בורות חלחול'],
  ['/equipment-rental', 'השכרת ציוד'],
  ['/contact', 'צור קשר'],
  ['/thanks', 'דף תודה'],
  ['/blog', 'בלוג'],
  ['/accessibility-statement', 'נגישות'],
  ['/about', 'אודות'],
  ['/projects', 'פרויקטים'],
  ['/card', 'כרטיס ביקור'],
];

const BLOG_PAGES = [
  '/blog/bentonite-guide', '/blog/drainage-pits-guide', '/blog/drilling-netanya',
  '/blog/drilling-hadera',
  '/blog/earthworks-tips', '/blog/choose-drilling-contractor', '/blog/bentonite-vs-polymer',
  '/blog/drilling-hod-hasharon', '/blog/equipment-rental-guide', '/blog/contractor-license-guide',
  '/blog/site-development-guide', '/blog/drainage-pits-pricing', '/blog/waste-removal-guide',
  '/blog/foundation-piles-guide', '/blog/bentonite-drilling-cost', '/blog/earthworks-cost',
  '/blog/equipment-rental-cost',
];

const REDIRECTS = [
  ['/cfa-piles', 'CFA piles → bentonite'],
  ['/micropiles', 'micropiles → bentonite'],
  ['/demolition', 'demolition → earthworks'],
];

async function fetchStatus(url, opts = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: 'manual', ...opts });
    return { status: res.status, time: Date.now() - start, headers: res.headers };
  } catch (err) {
    return { status: 0, error: err.message, time: Date.now() - start };
  }
}

async function fetchBody(url) {
  try {
    const res = await fetch(url);
    return { status: res.status, body: await res.text() };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function checkPages(label, pages) {
  console.log(`\n=== ${label} (${pages.length}) ===`);
  let fails = 0;
  for (const [path, name] of pages.map(p => Array.isArray(p) ? p : [p, p])) {
    const { status, time } = await fetchStatus(SITE + path);
    const icon = status === 200 ? '✅' : '❌';
    if (status !== 200) fails++;
    console.log(`${icon} ${name.padEnd(25)} ${path.padEnd(40)} ${status} (${time}ms)`);
  }
  return fails;
}

async function checkRedirects() {
  console.log(`\n=== Redirects (${REDIRECTS.length}) ===`);
  let fails = 0;
  for (const [path, name] of REDIRECTS) {
    const { status } = await fetchStatus(SITE + path);
    const ok = status === 301 || status === 308;
    if (!ok) fails++;
    console.log(`${ok ? '✅' : '❌'} ${name.padEnd(30)} ${status}`);
  }
  return fails;
}

async function checkInfra() {
  console.log(`\n=== תשתית ===`);
  const files = ['/sitemap.xml', '/robots.txt', '/llms.txt', '/manifest.json'];
  let fails = 0;
  for (const f of files) {
    const { status } = await fetchStatus(SITE + f);
    if (status !== 200) fails++;
    console.log(`${status === 200 ? '✅' : '❌'} ${f.padEnd(20)} ${status}`);
  }
  // sitemap URL count
  const { body } = await fetchBody(SITE + '/sitemap.xml');
  const urlCount = (body || '').match(/<loc>/g)?.length || 0;
  console.log(`📋 Sitemap URLs: ${urlCount}`);
  return fails;
}

async function checkSchema() {
  console.log(`\n=== Schema.org ===`);
  const { body } = await fetchBody(SITE);
  const types = (body || '').match(/"@type":\s*"[^"]+"/g) || [];
  const unique = new Set(types.map(t => t.match(/"([^"]+)"$/)[1]));
  console.log(`📊 Schema entries: ${types.length} (${[...unique].join(', ')})`);
  const required = ['LocalBusiness', 'FAQPage'];
  let fails = 0;
  for (const r of required) {
    const has = [...unique].some(t => t.includes(r));
    if (!has) fails++;
    console.log(`${has ? '✅' : '❌'} ${r}`);
  }
  return fails;
}

async function checkPerf() {
  console.log(`\n=== ביצועים (TTFB) ===`);
  const { time } = await fetchStatus(SITE);
  const icon = time < 500 ? '✅' : time < 1000 ? '🟡' : '❌';
  console.log(`${icon} TTFB+download: ${time}ms ${time < 500 ? '(מצוין)' : time < 1000 ? '(טוב)' : '(איטי)'}`);
  return time > 2000 ? 1 : 0;
}

// Lead pipeline health — pings the notify-lead endpoint's health probe.
// This is the silent-failure class we got burned by: forms returned 200 but
// emails never arrived. A daily ping catches a broken/misconfigured endpoint.
async function checkLeadEndpoint() {
  console.log(`\n=== מערכת לידים (notify-lead) ===`);
  try {
    const res = await fetch(SITE + '/api/notify-lead?health=1');
    if (res.status !== 200) {
      console.log(`❌ ALERT: endpoint הלידים החזיר ${res.status} (צפוי 200)`);
      return 1;
    }
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      console.log(`❌ ALERT: endpoint הלידים החזיר תשובה לא תקינה: ${JSON.stringify(data)}`);
      return 1;
    }
    if (!data.brevoConfigured) {
      console.log(`❌ ALERT: BREVO_API_KEY חסר בשרת — לידים לא יישלחו!`);
      return 1;
    }
    console.log(`✅ endpoint הלידים תקין + Brevo מוגדר`);
    return 0;
  } catch (err) {
    console.log(`❌ ALERT: endpoint הלידים לא נגיש: ${err.message}`);
    return 1;
  }
}

async function checkSSL() {
  console.log(`\n=== SSL ===`);
  const { headers } = await fetchStatus(SITE);
  const hsts = headers?.get('strict-transport-security');
  const ok = !!hsts;
  console.log(`${ok ? '✅' : '⚠️'} HSTS header: ${hsts || 'חסר'}`);
  return 0;
}

// One PageSpeed Insights sample (mobile, performance + CrUX field data).
async function fetchPSI(key) {
  const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const url = `${api}?url=${encodeURIComponent(SITE)}&strategy=mobile&category=performance&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    perf: Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100),
    lcpMs: data.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue ?? 0,
    fcpMs: data.lighthouseResult?.audits?.['first-contentful-paint']?.numericValue ?? 0,
    cls: data.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue ?? 0,
    fieldLcp: data.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.category || null,
  };
}

// Lighthouse regression check via PageSpeed Insights.
// Lab LCP is noisy run-to-run (observed band on this site: 2.9–6.0s), so we take
// the MEDIAN of 5 samples and only alert when the result is OUTSIDE that noise
// band (>6.5s) — a genuine regression, never a single unlucky measurement.
// CrUX field data (real users) overrides: if it says LCP is FAST/AVERAGE we
// never alert, no matter what the noisy lab numbers say. Skipped without key.
const LCP_ALERT_MS = 6500; // above the full historical lab-noise band → only real regressions page
async function checkLighthouse() {
  console.log(`\n=== Lighthouse (mobile) ===`);
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) {
    console.log('⏭️  PAGESPEED_API_KEY not set — skipping');
    return 0;
  }
  const samples = [];
  for (let i = 0; i < 5; i++) {
    try { const s = await fetchPSI(key); if (s) samples.push(s); }
    catch { /* transient — ignore this sample */ }
  }
  if (!samples.length) {
    console.log('⚠️  PageSpeed unavailable — skipping (treated as transient)');
    return 0;
  }
  const median = (arr) => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)];
  const perf = median(samples.map((s) => s.perf));
  const lcpMs = median(samples.map((s) => s.lcpMs));
  const lcpS = (lcpMs / 1000).toFixed(1);
  const fcpS = (median(samples.map((s) => s.fcpMs)) / 1000).toFixed(1);
  const cls = median(samples.map((s) => s.cls));
  const field = samples.map((s) => s.fieldLcp).find(Boolean) || 'no field data';
  const fieldGood = samples.some((s) => s.fieldLcp === 'FAST' || s.fieldLcp === 'AVERAGE');

  const perfIcon = perf >= 70 ? '✅' : perf >= 50 ? '🟡' : '❌';
  const lcpIcon = lcpMs <= 4000 ? '✅' : lcpMs <= 5000 ? '🟡' : '❌';
  const clsIcon = cls <= 0.1 ? '✅' : cls <= 0.25 ? '🟡' : '❌';
  console.log(`${perfIcon} Performance (median of ${samples.length}): ${perf}/100`);
  console.log(`${lcpIcon} LCP (median): ${lcpS}s  (lab; יעד ≤4s, התראה רק >6.5s — מחוץ לטווח הרעש)`);
  console.log(`${clsIcon} CLS (median): ${cls.toFixed(3)}  (יעד ≤0.1, קריטי >0.25)`);
  console.log(`   FCP (median): ${fcpS}s | CrUX field LCP (real users): ${field}`);

  let fails = 0;
  // CLS regression guard — ALWAYS checked. This is the bug class that once slipped
  // through (critical-CSS swap shifted layout to CLS 1.0, caught only days later).
  if (cls > 0.25) { console.log(`❌ ALERT: CLS median ${cls.toFixed(3)} > 0.25 (קפיצות עיצוב חמורות)`); fails++; }
  // LCP/perf: real-user CrUX data overrides noisy single-run lab numbers.
  if (fieldGood && (perf < 50 || lcpMs > LCP_ALERT_MS)) {
    console.log('ℹ️  Lab LCP/perf noisy this run, but CrUX field data is OK — no alert.');
  } else {
    if (perf < 50) { console.log(`❌ ALERT: Performance median ${perf} < 50 (קריטי)`); fails++; }
    if (lcpMs > LCP_ALERT_MS) { console.log(`❌ ALERT: LCP median ${lcpS}s > 6.5s — רגרסיה אמיתית מעבר לרעש`); fails++; }
  }
  return fails;
}

async function main() {
  console.log(`🔍 בדיקה עצמאית של ${SITE}`);
  console.log(`⏰ ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`);
  const start = Date.now();

  const fails = [
    await checkPages('דפים ראשיים', MAIN_PAGES),
    await checkPages('מאמרי בלוג', BLOG_PAGES.map(p => [p, p.replace('/blog/', '')])),
    await checkRedirects(),
    await checkInfra(),
    await checkSchema(),
    await checkPerf(),
    await checkSSL(),
    await checkLeadEndpoint(),
    await checkLighthouse(),
  ].reduce((a, b) => a + b, 0);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`${fails === 0 ? '✅ הכל תקין' : `❌ ${fails} בעיות`} | זמן: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  process.exit(fails === 0 ? 0 : 1);
}

main();
