// Rate limiting for the public lead/subscribe endpoints.
//
// Both endpoints are unauthenticated and each one sends a real email through
// Brevo, so an unthrottled endpoint is a free mailer: a script can drain the
// Brevo quota and bury genuine leads under fake ones. This was confirmed live —
// five rapid POSTs all returned 200 with no throttling whatsoever.
//
// State lives in module scope, which on Vercel means per warm instance rather
// than a shared store. That is deliberate: it is dependency-free and blocks the
// realistic attack (one script hammering from one IP lands on a small number of
// warm instances). It is NOT a hard guarantee across a distributed flood — if
// this endpoint ever starts getting seriously abused, move the counter to a
// shared store. The honest bar here is "raise the cost a lot for zero deps".

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PER_IP = 5; // a real person submits once, maybe twice on a retry
const PER_INSTANCE = 40; // backstop against a distributed-ish flood

const hits = new Map(); // ip -> number[] (timestamps)
let globalHits = [];

function prune(list, now) {
  return list.filter((t) => now - t < WINDOW_MS);
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Returns null when the request may proceed, or {status, body, retryAfter}
 * describing the rejection. Call before doing any work that costs money.
 */
function checkRateLimit(req) {
  const now = Date.now();
  const ip = clientIp(req);

  globalHits = prune(globalHits, now);
  const mine = prune(hits.get(ip) || [], now);

  // Keep the Map from growing without bound on a long-lived warm instance.
  if (hits.size > 500) {
    for (const [key, list] of hits) {
      if (prune(list, now).length === 0) hits.delete(key);
    }
  }

  const retryAfter = Math.ceil(WINDOW_MS / 1000);

  if (mine.length >= PER_IP || globalHits.length >= PER_INSTANCE) {
    const reason = mine.length >= PER_IP ? 'per-ip' : 'per-instance';
    console.warn('[rate-limit] blocked', reason, ip);
    return {
      status: 429,
      retryAfter,
      body: { error: 'Too many requests. Please try again later, or call 052-9556123.' }
    };
  }

  mine.push(now);
  globalHits.push(now);
  hits.set(ip, mine);
  return null;
}

module.exports = { checkRateLimit };
