import { chromium } from 'file:///d:/אפליקציות/ניהול ומעקב עסק/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cardPath = path.resolve(__dirname, '..', 'business-card.html');
const outPath = path.resolve(__dirname, '..', 'images', 'business-card-og.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
  locale: 'he-IL',
});
const page = await ctx.newPage();
await page.goto('file://' + cardPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
await page.addStyleTag({ content: '.acc-toggle-btn, .acc-skip-link, .acc-overlay, .acc-panel { display: none !important; }' });
await page.waitForTimeout(800);
await page.screenshot({ path: outPath, type: 'png', fullPage: false });
await browser.close();
console.log('saved:', outPath);
