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
  if (contactPhone) {
    const cleanPhone = contactPhone.replace(/[\s\-()]/g, '');
    attributes.PHONE = cleanPhone.replace(/^0/, '+972');
  }
  if (contactSource) attributes.SOURCE = contactSource;

  const brevoBody = {
    updateEnabled: true,
    listIds: [3], // "לקוחות מהאתר" list
    attributes
  };

  if (contactEmail) brevoBody.email = contactEmail;

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

    return res.status(response.status).json({ error: data.message || 'Brevo API error' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to connect to email service' });
  }
}
