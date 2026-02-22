# לוג בעיות ותיקונים - אתר א.א. עבודות קידוחים ופיתוח

> מערכת מעקב בעיות, סיבות שורש, פתרונות ומניעה לעתיד.
> כל בעיה מתועדת כדי שנלמד ממנה ונמנע חזרה עליה.

---

## סטטיסטיקה

| סה"כ בעיות | נפתרו | פתוחות |
|------------|--------|--------|
| 5          | 5      | 0      |

---

## ISS-001: סוג ערך שגוי ב-aggregateRating (Schema.org)

| שדה | פרטים |
|-----|-------|
| **תאריך גילוי** | 2026-02-19 (Google Search Console) |
| **תאריך תיקון** | 2026-02-22 |
| **חומרה** | קריטית |
| **קטגוריה** | SEO / נתונים מובנים |
| **קבצים מושפעים** | `index.html` |
| **commit שיצר את הבעיה** | `ef10a36` (2026-02-16) |
| **commit שתיקן** | `a86bee0` (2026-02-22) |

### תיאור הבעיה
ערכי `aggregateRating` ב-JSON-LD הוגדרו כמחרוזות (string) במקום מספרים (number):
```json
// שגוי:
"ratingValue": "5",
"bestRating": "5",
"ratingCount": "6",
"reviewCount": "6"
```

### סיבת שורש
טעות בכתיבת JSON-LD - הוספת מרכאות סביב ערכים מספריים. ב-JSON יש הבדל בין `"5"` (string) ל-`5` (number). Google Schema Validator דורש Number עבור שדות מספריים.

### פתרון
הסרת המרכאות מהערכים המספריים:
```json
// תקין:
"ratingValue": 5,
"bestRating": 5,
"ratingCount": 6,
"reviewCount": 6
```

### מניעה לעתיד
- **כלל**: ערכים מספריים ב-JSON-LD (rating, count, price) חייבים להיות ללא מרכאות
- **בדיקה**: לפני push של שינויי Schema.org - להריץ בדיקה ב-[Rich Results Test](https://search.google.com/test/rich-results)
- **תבנית**: להשתמש בתבנית הנכונה מ-schema.org/AggregateRating

---

## ISS-002: פורמט טלפון לא אחיד בין דפים

| שדה | פרטים |
|-----|-------|
| **תאריך גילוי** | 2026-02-22 |
| **תאריך תיקון** | 2026-02-22 |
| **חומרה** | בינונית |
| **קטגוריה** | SEO / נתונים מובנים |
| **קבצים מושפעים** | `index.html`, `contact.html` |
| **commit שתיקן** | `a86bee0` (2026-02-22) |

### תיאור הבעיה
פורמט טלפון שונה בין הדפים:
- `index.html`: `"+972-52-955-6123"` (מקף מיותר)
- `contact.html`: `"052-955-6123"` (חסר קידומת בינלאומית)
- שאר הדפים: `"+972-52-9556123"` (תקין)

### סיבת שורש
כל דף נכתב/עודכן בזמן שונה, ללא תבנית אחידה לפורמט טלפון. אין מקור אמת יחיד (single source of truth) לנתוני העסק.

### פתרון
אחדנו את כל הדפים לפורמט: `+972-52-9556123`

### מניעה לעתיד
- **כלל**: פורמט טלפון תמיד `+972-XX-XXXXXXX` (עם קידומת בינלאומית, מקף אחד אחרי קידומת אזור)
- **בדיקה**: בעדכון כל דף - לחפש `telephone` ולוודא פורמט אחיד
- **שיפור עתידי**: לשקול מעבר ל-template system שמנהל נתוני עסק ממקום אחד

---

## ISS-003: PostalAddress חסרה פרטים ב-contact.html

| שדה | פרטים |
|-----|-------|
| **תאריך גילוי** | 2026-02-22 |
| **תאריך תיקון** | 2026-02-22 |
| **חומרה** | בינונית |
| **קטגוריה** | SEO / נתונים מובנים |
| **קבצים מושפעים** | `contact.html` |
| **commit שתיקן** | (commit של תיקון נוכחי) |

### תיאור הבעיה
ב-`contact.html` ה-PostalAddress הכיל רק `addressCountry: IL` בלי streetAddress, addressLocality ו-postalCode - בעוד ב-`index.html` הפרטים המלאים קיימים.

### סיבת שורש
הדף נוצר בנפרד מדף הבית, ללא העתקת כל פרטי הכתובת. חוסר עקביות בין הדפים.

### פתרון
הוספת הפרטים החסרים בהתאמה ל-index.html:
```json
"address": {
  "@type": "PostalAddress",
  "streetAddress": "אליכין",
  "addressLocality": "אליכין",
  "postalCode": "262",
  "addressCountry": "IL"
}
```

### מניעה לעתיד
- **כלל**: כל LocalBusiness schema חייב לכלול כתובת מלאה
- **בדיקה**: בעת הוספת schema חדש - להשוות מול index.html (הדף המרכזי)
- **צ'קליסט**: name, telephone, email, url, address (מלאה), areaServed

---

## ISS-004: הפניה ב-demolition.html לקובץ במקום URL נקי

| שדה | פרטים |
|-----|-------|
| **תאריך גילוי** | 2026-02-22 |
| **תאריך תיקון** | 2026-02-22 |
| **חומרה** | נמוכה |
| **קטגוריה** | ניתוב / SEO |
| **קבצים מושפעים** | `demolition.html` |
| **commit שתיקן** | (commit של תיקון נוכחי) |

### תיאור הבעיה
דף ההפניה `demolition.html` הצביע על `earthworks.html` (שם קובץ) במקום `/earthworks` (URL נקי שמנוהל ע"י Vercel rewrites).

### סיבת שורש
בעת יצירת דף ההפניה השתמשנו בנתיב קובץ ישיר במקום URL נקי. לא התחשבנו במערכת ה-rewrites של Vercel.

### פתרון
שינוי כל ההפניות ל-URL נקי:
```html
<!-- לפני -->
<meta http-equiv="refresh" content="0;url=earthworks.html">
<!-- אחרי -->
<meta http-equiv="refresh" content="0;url=/earthworks">
```

### מניעה לעתיד
- **כלל**: תמיד להשתמש ב-URLs נקיים (`/earthworks`) ולא בשמות קבצים (`earthworks.html`)
- **הגדרה**: ה-rewrites ב-vercel.json מטפלים בהמרה

---

## ISS-005: חסר datePublished ב-Article schema

| שדה | פרטים |
|-----|-------|
| **תאריך גילוי** | 2026-02-22 |
| **תאריך תיקון** | 2026-02-22 |
| **חומרה** | בינונית |
| **קטגוריה** | SEO / נתונים מובנים |
| **קבצים מושפעים** | `bentonite-drilling.html` |
| **commit שתיקן** | `a86bee0` (2026-02-22) |

### תיאור הבעיה
ה-Article schema ב-`bentonite-drilling.html` חסר את השדות `datePublished` ו-`dateModified` שנדרשים ע"י Google.

### סיבת שורש
בעת יצירת ה-Article schema, לא נכללו שדות תאריך שהם recommended ע"י Google.

### פתרון
הוספת שדות תאריך:
```json
"datePublished": "2025-01-01",
"dateModified": "2026-02-22"
```

### מניעה לעתיד
- **כלל**: כל Article schema חייב לכלול `datePublished` ו-`dateModified`
- **צ'קליסט Article**: headline, author, publisher, datePublished, dateModified, description

---

## כללים ולקחים כלליים

### צ'קליסט לפני Push של שינויי Schema.org:
1. [ ] ערכים מספריים בלי מרכאות (number, לא string)
2. [ ] טלפון בפורמט `+972-XX-XXXXXXX`
3. [ ] כתובת מלאה (street, locality, postalCode, country)
4. [ ] URLs נקיים (לא שמות קבצים)
5. [ ] Article כולל datePublished/dateModified
6. [ ] עקביות נתונים בין כל הדפים
7. [ ] בדיקה ב-Rich Results Test לפני push

### מקור אמת לנתוני עסק:
- **שם**: א.א. עבודות קידוחים ופיתוח
- **טלפון**: +972-52-9556123
- **אימייל**: eliav1334@gmail.com
- **אתר**: https://eliavafar.co.il
- **כתובת**: אליכין, מיקוד 262, ישראל (IL)
- **קואורדינטות**: 32.2, 34.9
- **טווח מחירים**: $$
