// Converts the 29 hand-picked project JPGs into optimized webp for the
// projects.html gallery. For each source pick_NN-###.jpg it emits two webp
// sizes into images/gallery/ matching the site's existing -800 + full scheme:
//   project-NN.webp      → width ~1200 (fit inside, no enlargement), q80
//   project-NN-800.webp  → width 800, q78
// Aspect ratio is preserved (NOT forced to 4:3). Actual output dimensions are
// printed as a JSON manifest so the <img> width/height attrs can be exact
// (CLS-safe). Uses the already-installed sharp.
//
// Run:  node scripts/convert-gallery.mjs

import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = 'E:/ריכוז כל התמונות/_gallery_pick';
const OUT_DIR = 'images/gallery';

mkdirSync(OUT_DIR, { recursive: true });

// pick_NN-###.jpg, excluding pick_montage.jpg. Sort ascending by NN.
const sources = readdirSync(SRC_DIR)
  .filter((f) => /^pick_\d{2}-\d+\.jpg$/i.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/^pick_(\d{2})/)[1], 10);
    const nb = parseInt(b.match(/^pick_(\d{2})/)[1], 10);
    return na - nb;
  });

if (sources.length !== 29) {
  console.warn(`⚠️  expected 29 sources, found ${sources.length}`);
}

const manifest = [];
let totalBytes = 0;

for (let i = 0; i < sources.length; i++) {
  const src = join(SRC_DIR, sources[i]);
  const nn = String(i + 1).padStart(2, '0');
  const fullName = `project-${nn}.webp`;
  const thumbName = `project-${nn}-800.webp`;
  const fullPath = join(OUT_DIR, fullName);
  const thumbPath = join(OUT_DIR, thumbName);

  const full = await sharp(src)
    .rotate() // honor EXIF orientation
    .resize({ width: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(fullPath);

  await sharp(src)
    .rotate()
    .resize({ width: 800, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(thumbPath);

  totalBytes += statSync(fullPath).size + statSync(thumbPath).size;

  // Use the -800 file's real dimensions for the <img> width/height (src points
  // at the -800 file); ratio is what matters for CLS.
  const thumbMeta = await sharp(thumbPath).metadata();
  manifest.push({
    index: i,
    src: sources[i],
    full: fullName,
    thumb: thumbName,
    width: thumbMeta.width,
    height: thumbMeta.height,
  });
  console.log(`  ${sources[i]} → ${fullName} (${full.width}x${full.height}) + ${thumbName} (${thumbMeta.width}x${thumbMeta.height})`);
}

console.log('\n---MANIFEST-JSON---');
console.log(JSON.stringify(manifest));
console.log('---END-MANIFEST---');
console.log(`\n✅ ${sources.length} sources → ${sources.length * 2} webp files`);
console.log(`   total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
