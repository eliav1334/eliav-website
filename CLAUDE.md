# CLAUDE.md — eliavafar.co.il

## About
אתר עסקי עבור **"א.א. עבודות קידוחים ופיתוח"** — חברת קידוחים, עבודות עפר ופיתוח תשתיות.
- **רישיון קבלן**: 36281, ניסיון 10+ שנים
- **בעלים**: אליאב אפר
- **דומיין**: eliavafar.co.il
- **GitHub**: github.com/eliav1334/eliav-website
- **Vercel**: eliav-website-three.vercel.app (auto-deploy מ-GitHub)

## Tech Stack
- Pure HTML/CSS/JS — ללא frameworks
- פונטים: Heebo + Rubik (Google Fonts)
- צבע ראשי: `#F97316` (כתום), ערכת נושא כהה
- RTL עברית
- Deployed on Vercel

## Dev Server
```bash
npx serve "D:/אפליקציות/אתר eliavafar/eliav-website"
```
→ http://localhost:3000

---

## Project Structure

```
eliav-website/
├── .github/workflows/weekly-check.yml   # GitHub Action — דוח שבועי
├── .well-known/security.txt             # Security contact
├── api/subscribe.js                     # Vercel serverless function
├── blog/                                # 13 מאמרי בלוג (HTML)
├── css/
│   ├── style.css         (~4875 שורות)
│   ├── style.min.css     (מוקטן)
│   └── accessibility.css
├── docs/ISSUES-LOG.md                   # לוג בעיות ותיקונים
├── images/                              # תמונות
├── js/
│   ├── main.js
│   ├── main.min.js       (מוקטן)
│   └── accessibility.js
├── טלפונים/                              # אנשי קשר (Excel)
├── [10 HTML pages at root]
├── vercel.json           # Rewrites + Redirects + Headers
├── sitemap.xml           # 21 URLs
├── sitemap-images.xml
├── robots.txt
├── llms.txt / llms-full.txt
├── manifest.json
└── CLAUDE.md
```

## Pages (23 HTML files total)

### Main Pages (10)
| File | Description |
|------|-------------|
| `index.html` | Landing page — hero, services, stats, testimonials |
| `bentonite-drilling.html` | שירות קידוחי בנטונייט |
| `earthworks.html` | שירות עבודות עפר ופיתוח |
| `drainage-pits.html` | שירות בורות חלחול וניקוז |
| `equipment-rental.html` | שירות השכרת ציוד (תמיד כולל מפעיל!) |
| `contact.html` | טופס צור קשר (FormSubmit.co) |
| `blog.html` | עמוד בלוג ראשי + 13 כרטיסי מאמרים |
| `accessibility-statement.html` | הצהרת נגישות |
| `thanks.html` | עמוד תודה אחרי שליחת טופס |
| `demolition.html` | redirect → earthworks.html |

### Blog Articles (13 — in `blog/` folder)
| File | נושא |
|------|------|
| `bentonite-guide.html` | מדריך קידוחי בנטונייט |
| `drainage-pits-guide.html` | מדריך בורות חלחול |
| `drilling-netanya.html` | קידוח בנתניה והסביבה |
| `earthworks-tips.html` | טיפים לעבודות עפר |
| `choose-drilling-contractor.html` | בחירת קבלן קידוח |
| `bentonite-vs-polymer.html` | בנטונייט מול פולימר |
| `drilling-hod-hasharon.html` | קידוח בהוד השרון |
| `equipment-rental-guide.html` | מדריך השכרת ציוד |
| `contractor-license-guide.html` | מדריך רישיון קבלן |
| `site-development-guide.html` | מדריך פיתוח שטח |
| `drainage-pits-pricing.html` | תמחור בורות חלחול |
| `waste-removal-guide.html` | מדריך פינוי פסולת |
| `foundation-piles-guide.html` | מדריך כלונסאות יסוד |

---

## CRITICAL RULES

### Performance — Do NOT waste tokens
- **NEVER read image files** (webp, jpg, png, gif, svg, ico) — uses thousands of tokens.
  Use sharp for metadata: `node -e "require('sharp')('path').metadata().then(m=>console.log(JSON.stringify({w:m.width,h:m.height})))"`
- **NEVER read entire `css/style.css`** (~4875 lines) — use Grep to find specific sections
- **NEVER read entire `index.html`** (~62KB) — use Grep or Read with offset+limit
- Use `/compact` proactively when conversation gets long
- Keep responses concise — avoid repeating unchanged code

### Business Rules — NEVER violate
- **לא להוסיף שירותים/דפים חדשים** ללא אישור אליאב — הוא מכיר את ההיצע העסקי שלו
- **כלונסאות CFA ומיקרופילים — לא שירותים של העסק** (מכונות ותחום שונה)
- **קירות סלארי = מוצר של קידוח בנטונייט**, לא שירות נפרד
- **השכרת ציוד תמיד כולל מפעיל מוסמך** — לעולם לא להציג "ללא מפעיל". אין אחריות דלק על הלקוח
- **אין שינויים תוכניים או ויזואליים** ללא אישור אליאב — רק שינויים טכניים/בלתי נראים מותרים

### New Page/Article Checklist
When adding any new HTML page or blog article, ALL of these are required:
1. **Accessibility**: Include `css/accessibility.css` + `js/accessibility.js` + footer link to הצהרת נגישות
2. **Schema**: Add BlogPosting entry in `blog.html` + Article schema in the article itself
3. **Sitemap**: Add URL to `sitemap.xml`
4. **Vercel**: Add rewrite rule in `vercel.json`
5. **FAQ section**: FAQ h2 title MUST be inside `<section class="faq">` using `<div class="section-header">`, NOT in the service-content section above
6. **Cache-busting**: Use same `style.min.css?v=1772308892` query parameter as all other pages

### Linking Rules
- **תמיד URLs נקיים** — `/earthworks` ולא `earthworks.html` (Vercel rewrites מטפל בהמרה)
- **לינקים פנימיים** — לא לכלול `.html` בקישורים שנראים למשתמש

---

## Schema.org

### Business Data (Single Source of Truth)
```
שם:         א.א. עבודות קידוחים ופיתוח
טלפון:      +972-52-9556123
אימייל:     eliav1334@gmail.com
אתר:        https://eliavafar.co.il
כתובת:      אליכין, מיקוד 262, IL
קואורדינטות:  32.2, 34.9
טווח מחירים:  $$
```

### Schema Types in Use
- `LocalBusiness` — index.html
- `Service` — service pages
- `FAQPage` — service + article pages
- `BlogPosting` — blog.html (13 entries) + each article
- `BreadcrumbList` — all inner pages
- `Article` — blog articles

### Schema.org Checklist — MUST verify before every push
From `docs/ISSUES-LOG.md` — lessons learned from past bugs:

1. [ ] **ערכים מספריים ללא מרכאות** — `"ratingValue": 5` (number), NOT `"ratingValue": "5"` (string)
2. [ ] **טלפון בפורמט אחיד** — תמיד `+972-52-9556123` בכל הדפים
3. [ ] **כתובת מלאה** — streetAddress + addressLocality + postalCode + addressCountry
4. [ ] **URLs נקיים** — `/earthworks` ולא `earthworks.html`
5. [ ] **Article חייב תאריכים** — `datePublished` + `dateModified` בכל Article/BlogPosting schema
6. [ ] **עקביות בין דפים** — להשוות נתוני עסק מול index.html (הדף המרכזי)
7. [ ] **בדיקה ב-Rich Results Test** — https://search.google.com/test/rich-results

---

## Integrations & Services

| Service | Purpose | Config |
|---------|---------|--------|
| **Vercel** | Hosting + CDN | vercel.json (21 rewrites, 25 redirects, security headers) |
| **FormSubmit.co** | Contact form → email | eliav1334@gmail.com |
| **GA4** | Analytics | G-EN4K9ELZC5 |
| **Microsoft Clarity** | Heatmaps + recordings | vjveyed1u4 |
| **Google Fonts** | Heebo + Rubik | Preloaded in `<head>` |

### vercel.json Summary
- **21 rewrites**: Clean URLs for all pages (e.g., `/blog` → `/blog.html`)
- **25 redirects (301)**: Old/removed URLs → correct destinations (demolition, Hebrew URLs from uPress, cfa-piles, micropiles, admin, etc.)
- **Security headers**: HSTS, CSP, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Cache headers**: Images 30d immutable, CSS/JS 1h must-revalidate, LLM files 24h

### CSS Cache-Busting
All pages use: `style.min.css?v=1772308892` — when updating CSS, change this version across ALL pages at once.

---

## Accessibility Widget
- 8 features: font size, contrast, grayscale, links highlight, readable font, animations toggle, cursor, keyboard navigation
- localStorage persistence
- Hebrew UI
- Files: `css/accessibility.css` + `js/accessibility.js`

---

## Weekly Monitoring (GitHub Action)
**File**: `.github/workflows/weekly-check.yml`
- **Schedule**: Every Sunday 08:00 Israel time (06:00 UTC)
- **Manual trigger**: Available via `workflow_dispatch`

### Checks Performed
1. All 22 pages HTTP status (9 main + 13 blog)
2. 6 redirect verifications (301 status)
3. Infrastructure files (sitemap.xml, robots.txt, llms.txt, manifest.json)
4. SSL certificate + expiry
5. Lighthouse: Performance, Accessibility, SEO, Best Practices + Core Web Vitals
6. External links (FormSubmit, Google Fonts, etc.)
7. Security headers scan

### Output
- GitHub Issue (auto-closes previous weekly issues)
- Email via Gmail SMTP (requires `GMAIL_APP_PASSWORD` secret)

---

## Issues Log & Bug Prevention
**File**: `docs/ISSUES-LOG.md` — 5 בעיות תועדו ונפתרו.

כל בעיה חדשה חייבת להתועד עם: תיאור, סיבת שורש, פתרון, מניעה לעתיד.

### Past Bugs Summary (don't repeat these!)
| # | בעיה | לקח |
|---|------|------|
| ISS-001 | aggregateRating values as strings | ערכים מספריים ב-JSON-LD = number, לא string |
| ISS-002 | פורמט טלפון לא אחיד בין דפים | תמיד `+972-52-9556123` |
| ISS-003 | PostalAddress חלקית ב-contact.html | כתובת מלאה בכל LocalBusiness schema |
| ISS-004 | הפניה ל-`earthworks.html` במקום `/earthworks` | תמיד URLs נקיים |
| ISS-005 | חסר datePublished ב-Article schema | כל Article חייב datePublished + dateModified |

---

## SEO Notes
- **Sitemap**: 21 URLs submitted to Google Search Console
- **robots.txt**: Allows all crawlers, blocks AhrefsBot/SemrushBot/DotBot/MJ12bot, includes LLM bot permissions
- **llms.txt / llms-full.txt**: Structured business info for AI crawlers
- **sitemap-images.xml**: Image sitemap for Google Images
- **Google Search Console**: מוגדר ופעיל — 30 דפים מאונדקסים
- **301 Redirects**: 25 redirects ב-vercel.json לכיסוי כל URLים ישנים מ-uPress ודפים שהוסרו

---

## Git & Deployment Workflow

### Repository
- **Remote**: github.com/eliav1334/eliav-website (branch: `main`)
- **User**: eliav / eliav1334@gmail.com
- **Auto-deploy**: כל push ל-main → Vercel builds ומעדכן את האתר בתוך ~30 שניות

### Commit Flow
1. בצע שינויים בקבצים
2. `git add <files>` — רק קבצים רלוונטיים, לא `git add .`
3. `git commit -m "תיאור השינוי"` — הודעה בעברית או אנגלית
4. `git push origin main` — מפרסם לאתר החי

### Important
- **לא לעשות push בלי לבדוק** — כל push הוא deploy חי לאתר
- **לא לכלול קבצי node_modules/** — כבר ב-.gitignore
- **CSS**: אחרי שינוי ב-style.css → minify ל-style.min.css → עדכן cache-bust version בכל 23 דפים
- **JS**: אחרי שינוי ב-main.js → minify ל-main.min.js

---

## Weekly Report — פירוט הדוח

הדוח השבועי נשלח כ-GitHub Issue כל יום ראשון ב-08:00. מבנה הדוח:

| סעיף | מה בודק | סף תקינות |
|-------|---------|-----------|
| **דפים ראשיים (9)** | HTTP 200 לכל דף | כולם חייבים 200 |
| **מאמרי בלוג (13)** | HTTP 200 לכל מאמר | כולם חייבים 200 |
| **Redirects (6)** | HTTP 301 לדפים ישנים | כולם חייבים 301 |
| **תשתית** | sitemap.xml, robots.txt, llms.txt, manifest.json | כולם חייבים להחזיר 200 |
| **SSL** | תעודה בתוקף + ימים לפקיעה | התראה מתחת 30 יום |
| **Lighthouse Mobile** | Performance, Accessibility, SEO, Best Practices | ירוק ≥90, כתום ≥50, אדום <50 |
| **Core Web Vitals** | FCP, LCP, TBT, CLS | לפי סטנדרט Google |
| **לינקים חיצוניים** | FormSubmit, Google Fonts, CDN, Analytics | כולם חייבים להגיב |
| **Security Headers** | HSTS, CSP, X-Frame-Options, וכו' | כולם חייבים להיות מוגדרים |

### דגלים
- **כותרת עם 🚨** = יש בעיה קריטית (דף נפל, SSL קרוב לפקיעה, לינק שבור)
- **כותרת רגילה** = הכל תקין

### GitHub Secrets נדרשים
| Secret | תיאור | סטטוס |
|--------|--------|--------|
| `GMAIL_APP_PASSWORD` | סיסמת אפליקציה של Gmail לשליחת מייל | ✅ מוגדר |

---

## Open Tasks — משימות שטרם הושלמו

רשימה מלאה ב: `memory/marketing-tasks.md`

### SEO טכני (עדיפות גבוהה)
| # | משימה | סטטוס |
|---|--------|--------|
| 1 | **Review/Rating Schema** — הוספת AggregateRating מביקורות GMB | ⏸️ חסום — Reviews paused ב-GMB |
| 2 | **Image optimization** — homepage-project תמונות גדולות (~1.1MB מיותר) | ממתין |
| 3 | **Contrast ratio fix** — כפתורי מובייל (sticky-bar, mobile-cta) | ממתין לאישור אליאב (שינוי ויזואלי) |

### מוניטורינג — בדיקות חסרות ב-GitHub Action
| # | בדיקה | תיאור |
|---|--------|--------|
| 4 | **Domain expiry** | בדיקת תאריך פקיעת דומיין |
| 5 | **TTFB** | Time To First Byte — מהירות תגובת שרת |
| 6 | **Mixed content** | תוכן HTTP בתוך HTTPS |
| 7 | **Meta tags validation** | title, description, canonical בכל דף |
| 8 | **Sitemap cross-validation** | כל URL ב-sitemap מחזיר 200 |
| 9 | **Schema.org validation** | בדיקת JSON-LD תקינות |
| 10 | **DNS resolution** | בדיקת A/CNAME records |

### SEO אורגני — הפער הגדול מהמתחרים
| # | משימה | תיאור |
|---|--------|--------|
| 11 | **Local SEO — דפי ערים** | עידן קידוחים יש 35 דפי ערים, לנו יש 2. הפער הכי גדול |
| 12 | **Featured Snippet Optimization** | תשובות קצרות (80-120 תווים) בתחילת מאמרים |

### שיווק (דורש פעולה של אליאב)
| # | משימה | סטטוס |
|---|--------|--------|
| 13 | **Google My Business** | ⚠️ Reviews paused — לפתור |
| 14 | **WhatsApp קמפיין** | תבניות מוכנות, ממתין להתחלה |
| 15 | **פנייה ל-10-20 קבלנים** | WhatsApp אישי |
| 16 | **פוסט/מודעה לפייסבוק** | טקסט מוכן, צריך להעלות עם תמונה |
| 17 | **TikTok** | פרטי פרופיל מוכנים, צריך להגדיר |

### MCP Plugins (להתקנה עתידית)
| Plugin | עדיפות |
|--------|--------|
| Google Search Console MCP | גבוהה |
| Google Analytics 4 MCP | גבוהה |
| PageSpeed Insights MCP | גבוהה |
| KeywordsPeopleUse MCP | בינונית |
