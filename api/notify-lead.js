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

  // Beautifully formatted RTL Hebrew HTML email
  const htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><title>ליד חדש מהאתר</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Heebo','Rubik',Arial,sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

        <!-- Orange Header -->
        <tr><td style="background:linear-gradient(135deg,#F97316 0%,#EA580C 100%);padding:24px 32px;color:#ffffff;text-align:right;">
          <div style="font-size:13px;font-weight:600;letter-spacing:1px;opacity:0.95;margin-bottom:6px;">🔔 ליד חדש מהאתר</div>
          <div style="font-size:22px;font-weight:700;line-height:1.3;">${escapeHtml(originName)}</div>
          <div style="font-size:12px;opacity:0.9;margin-top:8px;">${escapeHtml(dateStr)}</div>
        </td></tr>

        <!-- Customer Name -->
        <tr><td style="padding:28px 32px 12px 32px;text-align:right;">
          <div style="font-size:14px;color:#6b7280;font-weight:500;margin-bottom:4px;">שם הפונה</div>
          <div style="font-size:24px;color:#111827;font-weight:700;">${escapeHtml(name) || '<span style="color:#9ca3af;">לא צוין</span>'}</div>
        </td></tr>

        ${phone ? `
        <!-- Phone -->
        <tr><td style="padding:12px 32px;text-align:right;">
          <div style="font-size:14px;color:#6b7280;font-weight:500;margin-bottom:6px;">📞 טלפון</div>
          <a href="${telUrl}" style="font-size:20px;color:#F97316;font-weight:700;text-decoration:none;letter-spacing:0.5px;">${escapeHtml(phone)}</a>
        </td></tr>` : ''}

        ${email ? `
        <!-- Email -->
        <tr><td style="padding:12px 32px;text-align:right;">
          <div style="font-size:14px;color:#6b7280;font-weight:500;margin-bottom:6px;">✉️ אימייל</div>
          <a href="mailto:${escapeHtml(email)}" style="font-size:16px;color:#1f2937;font-weight:600;text-decoration:none;" dir="ltr">${escapeHtml(email)}</a>
        </td></tr>` : ''}

        ${service ? `
        <!-- Service -->
        <tr><td style="padding:12px 32px;text-align:right;">
          <div style="font-size:14px;color:#6b7280;font-weight:500;margin-bottom:6px;">🔧 שירות מבוקש</div>
          <div style="display:inline-block;background:#fed7aa;color:#9a3412;font-size:15px;font-weight:600;padding:6px 14px;border-radius:20px;">${escapeHtml(service)}</div>
        </td></tr>` : ''}

        ${message ? `
        <!-- Message -->
        <tr><td style="padding:12px 32px;text-align:right;">
          <div style="font-size:14px;color:#6b7280;font-weight:500;margin-bottom:8px;">💬 הודעה מהלקוח</div>
          <div style="background:#fff7ed;border-right:4px solid #F97316;padding:14px 18px;border-radius:8px;font-size:15px;color:#1f2937;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </td></tr>` : ''}

        <!-- Action Buttons -->
        <tr><td style="padding:24px 32px;text-align:right;">
          <div style="font-size:13px;color:#9ca3af;margin-bottom:12px;">⏱ זמן מענה אופטימלי: עד 60 דקות</div>
          ${telUrl ? `<a href="${telUrl}" style="display:inline-block;background:#F97316;color:#ffffff;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-left:8px;margin-bottom:8px;">📞 חייג עכשיו</a>` : ''}
          ${waUrl ? `<a href="${waUrl}" style="display:inline-block;background:#0e7a33;color:#ffffff;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:8px;">💬 WhatsApp</a>` : ''}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:right;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
          הליד הגיע מ-<span dir="ltr">eliavafar.co.il${escapeHtml(pagePath)}</span>
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
