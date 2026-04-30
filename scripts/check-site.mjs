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

async function checkSSL() {
  console.log(`\n=== SSL ===`);
  const { headers } = await fetchStatus(SITE);
  const hsts = headers?.get('strict-transport-security');
  const ok = !!hsts;
  console.log(`${ok ? '✅' : '⚠️'} HSTS header: ${hsts || 'חסר'}`);
  return 0;
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
  ].reduce((a, b) => a + b, 0);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`${fails === 0 ? '✅ הכל תקין' : `❌ ${fails} בעיות`} | זמן: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  process.exit(fails === 0 ? 0 : 1);
}

main();
