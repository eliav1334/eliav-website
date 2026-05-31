// Vercel serverless function: send a nicely formatted HTML email to the owner
// when someone submits a form on the site. Replaces FormSubmit.co's plain look.
// Uses Brevo's Transactional Email API (already provisioned for /api/subscribe).

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://eliavafar.co.il');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const email = (body.email || '').trim();
  const service = (body.service || '').trim();
  const message = (body.message || '').trim();
  const source = (body.source || '').trim();
  const pagePath = (body.page_path || source || '/').trim();

  if (!name && !phone) {
    return res.status(400).json({ error: 'Name or phone required' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

  // Build clean WhatsApp URL — international format, no leading zero
  const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^0/, '972');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';
  const telUrl = phone ? `tel:${phone.replace(/[\s\-()]/g, '')}` : '';

  // Israel time, formatted in Hebrew
  const now = new Date();
  const dateStr = now.toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Identify origin page in Hebrew
  const originMap = {
    '/': 'דף הבית',
    '/contact': 'דף צור קשר',
    '/contact.html': 'דף צור קשר',
    '/bentonite-drilling': 'קידוחי בנטונייט',
    '/bentonite-drilling.html': 'קידוחי בנטונייט',
    '/drainage-pits': 'בורות חלחול',
    '/drainage-pits.html': 'בורות חלחול',
    '/earthworks': 'עבודות עפר',
    '/earthworks.html': 'עבודות עפר',
    '/equipment-rental': 'השכרת ציוד',
    '/equipment-rental.html': 'השכרת ציוד',
    '/about': 'דף אודות',
    '/about.html': 'דף אודות',
    '/projects': 'דף פרויקטים',
    '/projects.html': 'דף פרויקטים',
  };
  let originName = originMap[pagePath] || 'דף הבית';
  if (pagePath.startsWith('/blog/')) originName = 'מאמר בלוג';
  if (pagePath.includes('popup')) originName = 'פופאפ הצעת מחיר';
  if (pagePath.includes('scroll-popup')) originName = 'פופאפ גלילה';

  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Clean, bold, professional RTL Hebrew lead-notification email
  const htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>פנייה חדשה מהאתר</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#eef0f3;font-family:'Heebo','Rubik','Assistant',Arial,sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,0.10);">

        <!-- Header: white bg, orange title — renders in every client (no colored-bg dependency, Outlook-safe) -->
        <tr><td style="padding:26px 32px 6px 32px;text-align:right;border-top:4px solid #C05621;">
          <div style="font-size:13px;color:#9ca3af;font-weight:600;letter-spacing:0.3px;">א.א. עבודות קידוחים ופיתוח</div>
          <div style="font-size:24px;color:#C05621;font-weight:700;line-height:1.3;margin-top:6px;">🔔 פנייה חדשה מהאתר</div>
          <div style="font-size:13px;color:#9ca3af;font-weight:500;margin-top:8px;">${escapeHtml(originName)} • ${escapeHtml(dateStr)}</div>
        </td></tr>

        <!-- Name -->
        <tr><td style="padding:26px 32px 0 32px;text-align:right;">
          <div style="font-size:13px;color:#6b7280;font-weight:700;letter-spacing:0.5px;">שם הפונה</div>
          <div style="font-size:26px;color:#111827;font-weight:700;margin-top:4px;">${escapeHtml(name) || '<span style="color:#9ca3af;font-weight:600;">לא צוין</span>'}</div>
        </td></tr>

        ${phone ? `
        <tr><td style="padding:18px 32px 0 32px;text-align:right;">
          <div style="border-top:1px solid #eef0f3;padding-top:18px;">
            <div style="font-size:13px;color:#6b7280;font-weight:700;">📞 טלפון</div>
            <a href="${telUrl}" dir="ltr" style="display:inline-block;font-size:24px;color:#C05621;font-weight:700;text-decoration:none;margin-top:4px;letter-spacing:0.5px;">${escapeHtml(phone)}</a>
          </div>
        </td></tr>` : ''}

        ${email ? `
        <tr><td style="padding:18px 32px 0 32px;text-align:right;">
          <div style="border-top:1px solid #eef0f3;padding-top:18px;">
            <div style="font-size:13px;color:#6b7280;font-weight:700;">✉️ אימייל</div>
            <a href="mailto:${escapeHtml(email)}" dir="ltr" style="display:inline-block;font-size:17px;color:#111827;font-weight:700;text-decoration:none;margin-top:4px;">${escapeHtml(email)}</a>
          </div>
        </td></tr>` : ''}

        ${service ? `
        <tr><td style="padding:18px 32px 0 32px;text-align:right;">
          <div style="border-top:1px solid #eef0f3;padding-top:18px;">
            <div style="font-size:13px;color:#6b7280;font-weight:700;">🔧 שירות מבוקש</div>
            <div style="display:inline-block;background:#fff1e6;color:#9a3412;font-size:16px;font-weight:700;padding:8px 16px;border-radius:10px;margin-top:8px;">${escapeHtml(service)}</div>
          </div>
        </td></tr>` : ''}

        ${message ? `
        <tr><td style="padding:18px 32px 0 32px;text-align:right;">
          <div style="border-top:1px solid #eef0f3;padding-top:18px;">
            <div style="font-size:13px;color:#6b7280;font-weight:700;margin-bottom:8px;">💬 הודעת הלקוח</div>
            <div style="background:#fff7ed;border-right:4px solid #C05621;padding:16px 18px;border-radius:10px;font-size:16px;color:#1f2937;font-weight:500;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>
          </div>
        </td></tr>` : ''}

        <!-- CTA buttons (full width, easy tap) -->
        <tr><td style="padding:26px 32px 8px 32px;">
          ${telUrl ? `<a href="${telUrl}" style="display:block;background:#C05621;color:#ffffff;font-size:17px;font-weight:700;padding:15px;border-radius:12px;text-decoration:none;text-align:center;margin-bottom:12px;">📞 התקשר עכשיו</a>` : ''}
          ${waUrl ? `<a href="${waUrl}" style="display:block;background:#0e7a33;color:#ffffff;font-size:17px;font-weight:700;padding:15px;border-radius:12px;text-decoration:none;text-align:center;">💬 שלח וואטסאפ</a>` : ''}
        </td></tr>

        <tr><td style="padding:6px 32px 24px 32px;text-align:center;">
          <div style="font-size:13px;color:#9ca3af;font-weight:600;">⏱ מומלץ לחזור ללקוח תוך 60 דקות</div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #eef0f3;font-size:12px;color:#9ca3af;">
          התקבל מהאתר <span dir="ltr" style="font-weight:600;">eliavafar.co.il${escapeHtml(pagePath)}</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

  // Plain-text fallback for clients that don't render HTML
  const textContent = [
    `🔔 ליד חדש מהאתר — ${originName}`,
    `התקבל: ${dateStr}`,
    '',
    `שם: ${name || '(לא צוין)'}`,
    phone ? `טלפון: ${phone}` : '',
    email ? `אימייל: ${email}` : '',
    service ? `שירות: ${service}` : '',
    message ? `הודעה: ${message}` : '',
    '',
    `מקור: eliavafar.co.il${pagePath}`,
  ].filter(Boolean).join('\n');

  // Subject — visible in inbox, must scream "lead"
  const subject = `🔔 ליד חדש מ${name ? `-${name}` : 'האתר'} — ${originName}${service ? ` (${service})` : ''}`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: 'אתר eliavafar.co.il', email: 'noreply@eliavafar.co.il' },
        to: [{ email: 'eliav1334@gmail.com', name: 'אליאב אהרון' }],
        replyTo: email ? { email, name } : undefined,
        subject,
        htmlContent,
        textContent,
        tags: ['lead', originName]
      })
    });

    if (response.ok) return res.status(200).json({ success: true });
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json({ error: data.message || 'Brevo error' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send notification' });
  }
};
