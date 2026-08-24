# סשן 24/08/2026 — מוכנות לסוכני AI (is-agentic) + תיקון OPR

## מה נעשה ואומת

**1. OPR ריק בדוח השבועי** — `397726c`
המייל השבועי הדפיס `/10` בלי מספר. סיבת השורש: תבנית המייל השתמשה בפלט הגולמי `opr_rank` ועקפה את לוגיקת-הגיבוי שכבר הייתה קיימת בדוח ה-GitHub; כש-`jq` נכשל הוא החזיר מחרוזת ריקה. תוקן עם פלט `opr_display` שתמיד קריא + `::warning::` שרושם את ראש תשובת ה-API כדי שנדע בשבוע הבא אם זה מפתח פגום או API שנפל.

**2. is-agentic 80/100 → כל 5 הממצאים נסגרו** — `f97f618` · `c71f185` · `e7ff99d`
מתועד במלואו ב-`docs/ISSUES-LOG.md` → **ISS-019**. תמצית:
- `middleware.js` — משא-ומתן markdown לפי `Accept` (⛔ ראה מלכודת למטה)
- `index.md` · `404.html` (עם בלוק `agent-recovery`) · `privacy.html` (מקושר מ-31 פוטרים + sitemap)
- `contactPoint`+`email`+`logo` בסכמת LocalBusiness
- `When to Use` / `When NOT to recommend` / handoff ב-`llms.txt` ו-`llms-full.txt`
- `scripts/check-agentic.mjs` — 21 טענות מול פרוד, ב-`npm run check-all`
- שלב `agentic` ב-`weekly-check.yml` → ציון + ממצאים ל-Issue ולמייל (+`actions/checkout@v4` שלא היה בקובץ)

**אימות:** `npm run check-agentic -- --no-remote` → 21/21 עוברות מול הפרוד החי.

## ⛔ שתי מלכודות שאסור לחזור עליהן

1. **Vercel `rewrites` נבדקים אחרי מערכת הקבצים.** חוק `has`-Accept על `/` לעולם לא ירוץ — `/` תמיד נפתר ל-`index.html`. התוצאה בפרוד הייתה HTML עם `Content-Type: text/markdown`, גרוע מכלום. רק `middleware.js` ב-root רץ מוקדם מספיק. **אל תנסה שוב דרך `rewrites`.**
2. **`String.replace` עם מחרוזת החלפה שמכילה `$'` משכפל את שאר הקובץ.** קרה בעת תיקון ה-workflow (`IFS=$'\t'`). להשתמש ב-callback: `s.replace(a, () => b)`.
3. `weekly-check.yml` הוא **CRLF** — סקריפט שמזריק לתוכו חייב לנרמל EOL בשני הכיוונים.

## פתוח

| # | מה | מי |
|---|-----|-----|
| 1 | **מטמון is-agentic לא ניתן לעקיפה** — הציון עדיין 80 כי הסריקה מ-03:02 ממוטמחת ברמת-דומיין (`refresh=1`, `www.`, `/api/scan/stream` — כולם `servedFromCache:true`). לחיצה על **Rescan** ב-https://is-agentic.com/scan/eliavafar.co.il תפתור. אחרת הריצה השבועית תשקף | אליאב (קליק אחד) |
| 2 | מיזוג GBP + 26 ביקורות מפוצלות → אחרי המיזוג לעדכן `aggregateRating` ל-26/4.8 ב-`index.html` ו-`drainage-pit-home.html` | אליאב, ואז אני |
| 3 | LCP/FCP 3.0s — הראיות נאספו, **התיקון לא בוצע**: החשוד היחיד הוא `style.min.css` החוסם-ציור, והפתרון המתבקש (critical-CSS inline) הוא בדיוק מה ש-ISS-006 אוסר (יצר CLS 1.0). ה-CLS=0 הנוכחי הוא נכס. ההמלצה: להשאיר, או לצמצם CSS (114KB) בלי לגעת ב-inline | החלטה של אליאב |
| 4-8 | אחידות שם ברשת · מקרי-בוחן עם תמונות · סרטונים · היטל הטמנה 2026 · דוח GSC אוגוסט | אליאב |

טבלת הפערים המלאה: `memory/eliavafar_gaps_table_2026_08_16.md`
