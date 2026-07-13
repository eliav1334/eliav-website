const { checkRateLimit, checkOrigin } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://eliavafar.co.il');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const badOrigin = checkOrigin(req);
  if (badOrigin) return res.status(badOrigin.status).json(badOrigin.body);

  const limited = checkRateLimit(req);
  if (limited) {
    res.setHeader('Retry-After', String(limited.retryAfter));
    return res.status(limited.status).json(limited.body);
  }

  const body = req.body || {};
  const contactEmail = body.email;
  const contactName = body.name;
  const contactPhone = body.phone;
  const contactSource = body.source;

  if (!contactEmail && !contactPhone) {
    return res.status(400).json({ error: 'Email or phone required' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Build contact attributes
  const attributes = {};
  if (contactName) attributes.FIRSTNAME = contactName;

  // Brevo's phone attributes want international format.
  let intlPhone = '';
  if (contactPhone) {
    const digits = String(contactPhone).replace(/\D/g, '');
    if (digits) {
      intlPhone = '+' + (digits.startsWith('0') ? '972' + digits.slice(1) : digits);
      attributes.PHONE = intlPhone;
      attributes.SMS = intlPhone;
    }
  }
  if (contactSource) attributes.SOURCE = contactSource;

  const brevoBody = {
    updateEnabled: true,
    listIds: [3], // "לקוחות מהאתר" list
    attributes
  };

  // Brevo needs an IDENTIFIER, not just attributes. We made email optional on the
  // forms for conversion, so most leads arrive phone-only — and those were being
  // POSTed with no identifier at all, which Brevo rejects. The lead still reached
  // the owner (that's /api/notify-lead, a separate path), but the contact never
  // made it into the list. Fall back to the phone as ext_id so it does.
  if (contactEmail) brevoBody.email = contactEmail;
  else if (intlPhone) brevoBody.ext_id = intlPhone;

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(brevoBody)
    });

    const data = await response.json();

    if (response.ok || response.status === 204) {
      return res.status(200).json({ success: true });
    }

    // Contact already exists - that's fine
    if (data.code === 'duplicate_parameter') {
      return res.status(200).json({ success: true, existing: true });
    }

    console.error('[subscribe] brevo error:', response.status, data.message || '(no message)');
    return res.status(502).json({ error: 'Failed to connect to email service' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to connect to email service' });
  }
}
