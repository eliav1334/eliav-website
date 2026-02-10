const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'D:/eliav-website/images/תמונות אלון';
const OUTPUT = 'D:/eliav-website/images/gallery2';

// All images - re-converted with .rotate() for EXIF fix
// Removed borehole images from earthworks (they're drilling-related)
// Added unique images for index page
const selections = {
  'bentonite': [
    { src: 'קידוחי ביסוס בנטונייט ברכבת  ראשון לציון/WhatsApp Image 2025-05-19 at 21.57.19.jpeg', name: 'bentonite-rishon-1' },
    { src: 'קידוחי ביסוס בנטונייט ברכבת  ראשון לציון/WhatsApp Image 2025-05-19 at 21.57.18 (1).jpeg', name: 'bentonite-rishon-2' },
    { src: 'קידוחי ביסוס בנטונייט ברכבת  ראשון לציון/WhatsApp Image 2025-05-19 at 21.57.23 (1).jpeg', name: 'bentonite-rishon-3' },
    { src: 'קידוחי ביסוס לגשר כביש 5/1.webp', name: 'bentonite-kvish5-1' },
    { src: 'קידוחי ביסוס לגשר כביש 5/20240501_172507.jpg', name: 'bentonite-kvish5-2' },
    { src: 'קידוחי ביסוס לגשר כביש 5/20240502_144413.jpg', name: 'bentonite-kvish5-3' },
    { src: 'קידוחי ביסוס וילה סביון/20241125_155927.jpg', name: 'bentonite-savyon-1' },
    { src: 'קידוחי ביסוס וילה סביון/WhatsApp Image 2025-05-19 at 21.57.31 (1).jpeg', name: 'bentonite-savyon-2' },
    { src: 'קידוחי ביסוס לוילות במקומות שונים/20240529_104531.jpg', name: 'bentonite-villa-1' },
    { src: 'קידוחי ביסוס לוילות במקומות שונים/ביסוס מנוף הרצליה חב פרושקובסקי.jpg', name: 'bentonite-villa-2' },
    { src: 'קידוחי ביסוס לוילות במקומות שונים/קיר דיפון אודים לפני חפירה.jpg', name: 'bentonite-villa-3' },
    { src: 'קידוחי ביסוס לחשמול רכבת ישראל אשדוד/IMG-20200407-WA0097.jpg', name: 'bentonite-ashdod-1' },
    { src: 'קידוחי ביסוס לחשמול רכבת ישראל אשדוד/IMG-20200510-WA0021.jpg', name: 'bentonite-ashdod-2' },
    { src: 'קידוחי ביסוס לחשמול רכבת ישראל אשדוד/IMG-20200405-WA0011.jpg', name: 'bentonite-ashdod-3' },
  ],

  'earthworks': [
    // Electra development project
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20221207_105509.jpg', name: 'earthworks-electra-1' },
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230102_132912.jpg', name: 'earthworks-electra-2' },
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230116_092720.jpg', name: 'earthworks-electra-3' },
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230223_075443.jpg', name: 'earthworks-electra-4' },
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230321_082943.jpg', name: 'earthworks-electra-5' },
    // Various earthworks projects - NOT drilling
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/חפירה לתשתיות חשמל נתניה.jpg', name: 'earthworks-netanya-1' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/חפירת בריכה פרדס חנה.jpeg', name: 'earthworks-pool-1' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/משתלבות רעננה.jpeg', name: 'earthworks-raanana-1' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/פיזור קרצוף לפנצריה חדרה.jpg', name: 'earthworks-hadera-1' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/פיתוח לוילה בית אליעזר.jpeg', name: 'earthworks-villa-1' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/20230511_170327.jpg', name: 'earthworks-project-1' },
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230116_144840.jpg', name: 'earthworks-electra-6' },
  ],

  'demolition': [
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/הורדת סלעים מצוק נתניה.jpg', name: 'demolition-rocks-1' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/20241028_074847.jpg', name: 'demolition-project-1' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/IMG-20190627-WA0076.jpg', name: 'demolition-project-2' },
    { src: 'עבודת פיתוח תמונות מכל מיני פרויקטים/IMG-20190704-WA0049.jpg', name: 'demolition-project-3' },
  ],

  'hero': [
    { src: 'קידוחי ביסוס לגשר כביש 5/20240609_122320.jpg', name: 'hero-drilling-1' },
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230228_133354.jpg', name: 'hero-earthworks-1' },
    { src: 'קידוחי ביסוס לוילות במקומות שונים/20230418_141235.jpg', name: 'hero-villa-1' },
    { src: 'WhatsApp Image 2025-05-19 at 21.57.18.jpeg', name: 'hero-general-1' },
    { src: 'WhatsApp Image 2025-05-19 at 21.57.29 (1).jpeg', name: 'hero-general-2' },
    { src: 'WhatsApp Image 2025-05-19 at 21.57.30 (2).jpeg', name: 'hero-general-3' },
  ],

  // Unique images for index gallery (not used on service pages)
  'index-gallery': [
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230123_121811.jpg', name: 'index-electra-1' },
    { src: 'עבודת פיתוח אוגלה חברת אלקטרה/20230223_112935.jpg', name: 'index-electra-2' },
    { src: 'קידוחי ביסוס בנטונייט ברכבת  ראשון לציון/WhatsApp Image 2025-05-19 at 21.57.19 (1).jpeg', name: 'index-rishon-1' },
    { src: 'קידוחי ביסוס בנטונייט ברכבת  ראשון לציון/WhatsApp Image 2025-05-19 at 21.57.24.jpeg', name: 'index-rishon-2' },
    { src: 'קידוחי ביסוס לוילות במקומות שונים/20240529_104548.jpg', name: 'index-villa-1' },
    { src: 'קידוחי ביסוס לוילות במקומות שונים/WhatsApp Image 2025-05-19 at 21.57.31.jpeg', name: 'index-villa-2' },
    { src: 'בורות חלחול/20240826_114933.jpg', name: 'index-borehole-1' },
    { src: 'בורות חלחול/בור החדרה עם פולימור/20221219_095453.jpg', name: 'index-borehole-2' },
    { src: 'קידוחי ביסוס לחשמול רכבת ישראל אשדוד/IMG-20200407-WA0095.jpg', name: 'index-ashdod-1' },
  ],
};

async function convertAll() {
  let total = 0, success = 0, failed = [];

  for (const [category, images] of Object.entries(selections)) {
    console.log(`\n=== ${category} (${images.length}) ===`);
    for (const img of images) {
      total++;
      const srcPath = path.join(BASE, img.src);
      const outPath = path.join(OUTPUT, `${img.name}.webp`);
      try {
        if (!fs.existsSync(srcPath)) {
          console.log(`  SKIP: ${img.src}`);
          failed.push(img.src);
          continue;
        }
        await sharp(srcPath)
          .rotate() // AUTO-FIX EXIF ORIENTATION
          .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outPath);
        const outSize = fs.statSync(outPath).size;
        console.log(`  OK: ${img.name}.webp (${(outSize/1024).toFixed(0)}KB)`);
        success++;
      } catch(e) {
        console.log(`  FAIL: ${img.src} - ${e.message}`);
        failed.push(img.src);
      }
    }
  }
  console.log(`\n=== DONE: ${success}/${total} ===`);
  if (failed.length) console.log('Failed:', failed);
}

convertAll();
