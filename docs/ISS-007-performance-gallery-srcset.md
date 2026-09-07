# ISS-007: Missing Responsive srcset on Service Page Galleries

**תאריך**: 2026-09-07  
**סטטוס**: ✅ נפתר  
**חומרה**: בינונית (Performance)

## תיאור הבעיה

שלושה דפי שירות (bentonite-drilling, earthworks, drainage-pits) טענו תמונות גלריה בגודל מלא (1200px, 150-280KB) גם למשתמשי מובייל, ללא srcset רספונסיבי. זה גרם לבזבוז bandwidth משמעותי והשפיע על LCP ו-Performance Score במובייל.

### דוגמה לתמונה לפני התיקון
```html
<img src="images/gallery/bentonite-project-1.webp" alt="..." width="1200" height="560" loading="lazy">
```
→ מובייל טוען 246KB

## סיבת שורש

1. דף הבית (`index.html`) כבר היה מיושם עם srcset וגרסאות -800px לתמונות hero
2. דפי השירות לא עודכנו באותו זמן
3. לא היו גרסאות -800px לתמונות הגלריות של דפי השירות

## הפתרון המיושם

### 1. יצירת 34 גרסאות -800px חדשות
```bash
ffmpeg -i <image>.webp -vf "scale=800:-1" -q:v 80 -y <image>-800.webp
```

**חיסכון דוגמה**:
- `bentonite-project-1.webp`: 246KB → 106KB (57% קטן יותר)
- `drainage-pit-3.webp`: 232KB → 104KB (55% קטן יותר)
- `earthworks-electra-2.webp`: 282KB → 140KB (50% קטן יותר)

### 2. הוספת srcset לכל תמונות הגלריות

**דוגמה אחרי התיקון**:
```html
<img src="images/gallery/bentonite-project-1.webp" 
     srcset="images/gallery/bentonite-project-1-800.webp 800w, images/gallery/bentonite-project-1.webp 1200w" 
     sizes="(max-width: 768px) 100vw, 33vw" 
     alt="..." 
     width="1200" height="560" 
     loading="lazy">
```
→ מובייל טוען 106KB (חיסכון 57%)

### 3. שינויים בדפים
- **bentonite-drilling.html**: 14 תמונות עם srcset
- **earthworks.html**: 9 תמונות עם srcset
- **drainage-pits.html**: 6 תמונות עם srcset

## תוצאות צפויות

### Mobile Performance Impact
- **LCP צפוי**: שיפור של 0.5-1.0s בדפי השירות (במובייל)
- **Bandwidth**: חיסכון של ~100KB לתמונה במובייל
- **Performance Score**: צפוי לעלות מ-86 ל-88-90 בדפי השירות

### Desktop
השפעה מינימלית - Desktop כבר טוען גרסאות 1200px שמתאימות לרוב המסכים.

## מניעת בעיות דומות בעתיד

### Checklist לתמונות חדשות
1. [ ] צור גרסת -800px עם ffmpeg: `ffmpeg -i <img>.webp -vf "scale=800:-1" -q:v 80 -y <img>-800.webp`
2. [ ] הוסף srcset לתג img: `srcset="...-800.webp 800w, ...-1200.webp 1200w"`
3. [ ] הוסף sizes מתאים: `sizes="(max-width: 768px) 100vw, 33vw"`
4. [ ] בדוק את הגדלים: `ls -lh images/gallery/<img>*.webp`

### Standard Image Sizes
- **Hero images**: 1920px + 800px
- **Gallery images**: 1200px + 800px
- **Project thumbnails**: 800px (already exists)

### Performance Testing
אחרי הוספת תמונות חדשות, הרץ:
```bash
npm run lighthouse-mobile
```
ובדוק את LCP ו-Performance Score.

## קבצים שהשתנו

```
bentonite-drilling.html          (14 תמונות)
earthworks.html                  (9 תמונות)
drainage-pits.html               (6 תמונות)
images/gallery/*-800.webp        (34 קבצים חדשים)
```

## לקחים

1. **Consistency**: כאשר מיישמים אופטימיזציה (כמו srcset) בדף אחד, יש ליישם בכל הדפים המתאימים.
2. **Asset Coverage**: לא מספיק srcset בקוד - צריך גם גרסאות מוקטנות בפועל של כל התמונות.
3. **Mobile-First**: 60%+ מהמבקרים במובייל, אז אופטימיזציית תמונות למובייל היא קריטית.
4. **Automated Checks**: כדאי לבדוק באופן אוטומטי שכל תמונה >100KB יש לה גרסה מוקטנת.

## קישורים רלוונטיים

- [Web.dev: Responsive Images](https://web.dev/responsive-images/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- PR: [To be added]
