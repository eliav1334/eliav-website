import fs from 'fs';
const KEEP = [2,3,5,8,9,10,16,17,23,24,26,29];
const REMOVE = [1,4,6,7,11,12,13,14,15,18,19,20,21,22,25,27,28];
const keepSet = new Set(KEEP);
const pad = n => String(n).padStart(2,'0');

// 1. Edit projects.html gallery
const file = 'projects.html';
let html = fs.readFileSync(file,'utf8');
const blockRe = /<div class="gallery-item">\s*<img src="images\/gallery\/project-(\d+)-800\.webp"[\s\S]*?onclick="openLightbox\(\d+\)">\s*<\/div>/g;
const blocks = [...html.matchAll(blockRe)];
if (blocks.length !== 29) { console.error('EXPECTED 29 blocks, got', blocks.length); process.exit(1); }
const first = blocks[0].index;
const last = blocks[28].index + blocks[28][0].length;
let idx = 0;
const kept = blocks
  .filter(m => keepSet.has(Number(m[1])))
  .map(m => m[0].replace(/onclick="openLightbox\(\d+\)"/, `onclick="openLightbox(${idx++})"`));
if (kept.length !== KEEP.length) { console.error('KEEP mismatch', kept.length); process.exit(1); }
html = html.slice(0, first) + kept.join('\n        ') + html.slice(last);
fs.writeFileSync(file, html);
console.log('projects.html: kept', kept.length, 'items, renumbered openLightbox 0..'+(kept.length-1));

// 2. Delete removed webp files
let del = 0;
for (const n of REMOVE) {
  for (const f of [`images/gallery/project-${pad(n)}.webp`, `images/gallery/project-${pad(n)}-800.webp`]) {
    if (fs.existsSync(f)) { fs.unlinkSync(f); del++; }
  }
}
console.log('deleted', del, 'webp files ('+REMOVE.length+' images x2)');
