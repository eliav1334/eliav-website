// Generate above-the-fold critical CSS for the homepage (mobile viewport).
// One-time tooling — run when style.css changes meaningfully above the fold.
//   npm i -D penthouse
//   PUPPETEER_EXECUTABLE_PATH="<chrome path>" node scripts/gen-critical-css.cjs
// Then inline the output into index.html's <style id="critical-css"> and load
// the full stylesheet async (preload + onload swap + noscript fallback).
const penthouse = require('penthouse');
const fs = require('fs');
(async () => {
  const critical = await penthouse({
    url: 'https://eliavafar.co.il',
    cssString: fs.readFileSync('css/style.min.css', 'utf8'),
    width: 390, height: 844, timeout: 60000,
    puppeteerArgs: ['--no-sandbox', '--disable-gpu']
  });
  fs.writeFileSync('critical-home.css', critical);
  console.log('Wrote critical-home.css', critical.length, 'bytes');
})();
