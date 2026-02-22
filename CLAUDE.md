# Eliav Website - Project Context

## About
Website for "אליאב קידוחים ופיתוח" - a construction/drilling business.
Contractor license: 36281. 10+ years experience.

## Tech Stack
- Pure HTML/CSS/JS (no frameworks)
- Fonts: Heebo + Rubik (Google Fonts)
- Primary color: #F97316 (orange)
- RTL Hebrew layout
- Deployed on Vercel

## Dev Server
Run: `npx serve "D:/אפליקציות/אתר eliavafar/eliav-website"` → http://localhost:3000

## Pages
- index.html - landing page with hero, services, stats, testimonials
- contact.html - contact form
- admin.html - admin panel
- earthworks.html - earthworks services detail
- demolition.html - demolition services detail
- bentonite-drilling.html - drilling services detail
- thanks.html - form submission thank you
- simple-upload.html - file upload utility

## CRITICAL RULES
- **NEVER use the Read tool on image files** (webp, jpg, jpeg, png, gif, svg, ico).
  Reading images consumes thousands of tokens and fills the context window.
  Instead, use Bash with sharp/node to check metadata:
  ```bash
  node -e "require('sharp')('path/to/image.webp').metadata().then(m=>console.log(JSON.stringify({w:m.width,h:m.height,orient:m.orientation})))"
  ```
- **NEVER read the entire style.css** (79KB) - always use Grep to find specific sections
- **NEVER read the entire index.html** (62KB) - use Grep or read with offset+limit
- Use `/compact` proactively when the conversation gets long
- Keep responses concise - avoid repeating code that wasn't changed

## Issues Log
- **`docs/ISSUES-LOG.md`** - מערכת מעקב בעיות ותיקונים
- כל בעיה חדשה חייבת להתועד שם עם: תיאור, סיבת שורש, פתרון, ומניעה לעתיד
- לפני push של שינויי Schema.org - לעבור על הצ'קליסט בתחתית הקובץ

## Schema.org Business Data (Single Source of Truth)
- **שם**: א.א. עבודות קידוחים ופיתוח
- **טלפון**: +972-52-9556123
- **אימייל**: eliav1334@gmail.com
- **אתר**: https://eliavafar.co.il
- **כתובת**: אליכין, מיקוד 262, IL
- **קואורדינטות**: 32.2, 34.9

## Notes
- All text in Hebrew (RTL)
- Images stored in `images/` with Hebrew folder names
- Keep design consistent with existing orange + dark theme
