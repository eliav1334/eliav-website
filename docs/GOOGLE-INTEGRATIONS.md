# Google Integrations — מצב + פערים

עדכון: 25/05/2026

## ✅ מה מחובר היום

| כלי | מצב | מזהה | מה הוא נותן |
|------|------|------|--------------|
| **Google Analytics 4** | פעיל | `G-EN4K9ELZC5` | תעבורה, התנהגות, אירועי המרה (אם יוגדרו) |
| **Microsoft Clarity** | פעיל | `vjveyed1u4` | Heatmaps, session replay, scroll depth |
| **Google Search Console** | פעיל | eliavafar.co.il | קליקים, חשיפות, מילות מפתח, מיקומים |
| **Google Business Profile** | פעיל | 2 פרופילים | "עפר" + "קידוחים" — שיחות, מסלולים, ביקורות |
| **PageSpeed Insights API** | פעיל | `PAGESPEED_API_KEY` (Secret) | בדיקה שבועית + יומית של Performance/LCP |
| **Bing Webmaster Tools** | חלקי | — | רק בדיקת אינדקס בדוח השבועי |

## 📡 אירועי המרה ש-GA4 כבר מקבל (מה-JS באתר)

| אירוע | מתי נשלח | מיקום בקוד |
|--------|-----------|------------|
| `generate_lead` (form) | שליחת טופס צור קשר | `main.js:302` |
| `generate_lead` (popup) | מילוי פופאפ הצעת מחיר | `main.js:382` |
| `generate_lead` (scroll) | פופאפ אחרי גלילה | `main.js:539` |
| `phone_call` | לחיצה על מספר טלפון | `main.js:399` |
| `whatsapp_click` | לחיצה על כפתור WhatsApp | `main.js:412` |

---

## ❌ פערים — מה חסר לבדיקות מלאות

### 1. **Key Events (Conversions) לא מוגדרים ב-GA4** ⚠️ קריטי
ה-events נשלחים, אבל לא סומנו ב-GA4 כ"Key events" → אין דוח Conversions, אין Funnel.

**פעולה — צריך לעשות בממשק GA4 ידנית (5 דקות):**
1. היכנס ל-https://analytics.google.com/
2. Admin → תחת Property בחר **Events**
3. עבור כל event מהרשימה למעלה (`generate_lead`, `phone_call`, `whatsapp_click`):
   - לחץ על הסליידר **"Mark as key event"** (מסומן ב-⭐)
4. **אופציונלי:** Admin → Conversions → Custom dimensions → להוסיף `event_category` ו-`event_label` כ-custom dimensions לקבלת דוחות מפורטים יותר

### 2. **GSC ↔ GA4 לא מקושרים** ⚠️ קריטי
בלי זה — לא רואים מילות חיפוש שמתורגמות להמרה.

**פעולה — בממשק GA4 (5 דקות):**
1. GA4 → Admin → תחת Property → **Search Console links**
2. Link → בחר את eliavafar.co.il
3. בחר Web stream → Confirm
4. אחרי 24 שעות יופיע דוח **Reports → Acquisition → Search Console**

### 3. **Lighthouse CI ב-PR-ים** 🟡 חסר
ה-daily-check בודק production, אבל שינוי קוד חדש (PR) לא נבדק לפני merge. אם מישהו דוחף קוד שמאט את האתר — נדע רק למחרת.

**פעולה — יישומה בסשן הזה:** מוסיף workflow `lighthouse-ci.yml` שיריץ Lighthouse על כל PR.

### 4. **Google Ads — Conversion Tracking** 🟡 ממתין
אין צורך עכשיו (הקמפיין לא פעיל). כשמתחילים — צריך:
1. ליצור Conversion ב-Google Ads
2. לקשר אותו ל-event ב-GA4 (`generate_lead`)
3. לאמת עם Google Tag Assistant

### 5. **Google Tag Manager (GTM)** 🟢 לא קריטי
היתרון: ניהול אירועים בלי לערוך קוד. החיסרון: שכבת JS נוספת = מאט קצת.
**ההמלצה:** לדחות. ה-events הקיימים ב-`main.js` עובדים מצוין; GTM לא נחוץ עד שיהיו 10+ events חדשים.

### 6. **Bing/Yandex Webmaster Tools — אינדוקס מלא** 🟢 לא קריטי
בדוח השבועי בודק אם יש תוצאות, אבל אין connection אמיתי. ניתן להוסיף בעתיד.

---

## סדר עדיפויות לפעולה שלך

| # | מה לעשות | איפה | זמן | חשיבות |
|---|----------|------|-----|---------|
| 1 | סימון Key Events ב-GA4 | analytics.google.com | 5 דק׳ | ⚠️ קריטי |
| 2 | קישור GSC ↔ GA4 | analytics.google.com | 5 דק׳ | ⚠️ קריטי |
| 3 | המתנה 24 שעות לתחילת אסיפת נתונים | — | — | — |
| 4 | בדיקת דוח Conversions ב-GA4 | analytics.google.com | 5 דק׳ | מומלץ |

**אחרי 7 ימים** של איסוף נתונים — תהיה לנו תמונה מלאה: כמה מ-70 הקליקים הופכים ל-phone_call/whatsapp_click/generate_lead. זה ייתן לנו conversion rate אמיתי לראשונה.
