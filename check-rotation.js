const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function check() {
  const dir = 'images/gallery';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp') && !f.endsWith('.tmp'));

  console.log('Checking ' + files.length + ' images for rotation issues...\n');

  const rotated = [];

  for (const file of files) {
    const fp = path.join(dir, file);
    try {
      const m = await sharp(fp).metadata();
      const o = m.orientation || 'none';
      // Check if image appears to be portrait (taller than wide) which might indicate rotation
      const ratio = m.width / m.height;
      console.log(`${file}: ${m.width}x${m.height} orientation=${o} ratio=${ratio.toFixed(2)}`);

      if (o !== 'none' && o !== 1 && o !== undefined) {
        rotated.push({ file, orientation: o, width: m.width, height: m.height });
      }
    } catch(e) {
      console.log(file + ' -> ERR: ' + e.message);
    }
  }

  console.log('\n--- Summary ---');
  if (rotated.length === 0) {
    console.log('No images with EXIF orientation issues found.');
    console.log('If images appear rotated in the browser, they may need manual rotation.');
  } else {
    console.log('Found ' + rotated.length + ' images with orientation metadata:');
    rotated.forEach(r => console.log('  ' + r.file + ' (orientation=' + r.orientation + ')'));
  }
}

check();
