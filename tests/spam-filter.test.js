/**
 * Regression test for ISS-027 — Spam bypass via /api/notify-lead
 * 
 * Reproduces the exact spam payloads that reached Brevo and verifies:
 * 1. They are now FILTERED by the multi-layer defense
 * 2. Valid Israeli leads still pass through
 * 3. Origin/Referer policy blocks bots without headers
 * 4. Phone validation catches invalid Israeli numbers
 * 5. Time-trap blocks instant POST submissions
 * 6. Generic Hebrew spam patterns are detected
 */

const assert = require('assert');

// ============================================================================
// SPAM FILTER LOGIC (extracted from api/notify-lead.js)
// ============================================================================

/**
 * Multi-layer spam filter — returns { filtered: true, reason } if spam detected
 */
function checkSpamFilters(body) {
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const email = (body.email || '').trim();
  const service = (body.service || '').trim();
  const message = (body.message || '').trim();
  const formTimestamp = body._formts || 0;

  // 1. Honeypot trap
  const honeypot = String(body._honey || body._gotcha || '').trim();
  if (honeypot) {
    return { filtered: true, reason: 'honeypot' };
  }

  // 2. Time-trap — form must be on screen for minimum dwell time
  const now = Date.now();
  const dwellMs = formTimestamp ? now - formTimestamp : 0;
  const MIN_DWELL_MS = 3000; // 3 seconds minimum
  const MAX_DWELL_MS = 3600000; // 1 hour max
  if (!formTimestamp || dwellMs < MIN_DWELL_MS || dwellMs > MAX_DWELL_MS) {
    return { filtered: true, reason: 'time-trap', dwellMs };
  }

  // 3. Israeli phone validation
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const isValidIsraeliMobile = /^05\d{7,8}$/.test(digits);
    if (!isValidIsraeliMobile) {
      return { filtered: true, reason: 'invalid-phone', digits };
    }
  }

  // 4. Link detection
  const linkRe = /(https?:\/\/|www\.|bit\.ly|tinyurl|goo\.gl|t\.me\b|calendar\.app|calendly\.com|wa\.me\/)/i;
  if (linkRe.test(`${name} ${message}`)) {
    return { filtered: true, reason: 'link-detected' };
  }

  // 5. B2B pitch & generic spam patterns
  const pitchRe = /(revenue share|partnership|back[- ]?link|\bseo\b|web (?:design|development)|software (?:development|house|agency)|digital marketing|lead generation|grow your (?:business|revenue)|cold (?:email|outreach)|\bcrypto\b|invest(?:ment)? opportunity|חלוקת הכנסות|שיתוף פעולה עסקי|קידום אתרים|בניית אתרים|שיווק דיגיטלי|לידים בחינם)/i;
  const genericSpamRe = /(אשמח לקבל מידע נוסף|לפרטים נוספים|מעוניין בפרטים|זקוק למידע)\s*$/i;
  const commonBotNames = /^(יעל לוי|דני כהן|משה ישראלי|אבי לוי)$/i;
  
  if (pitchRe.test(`${name} ${message} ${service}`) || 
      (genericSpamRe.test(message) && commonBotNames.test(name))) {
    return { filtered: true, reason: 'spam-pattern' };
  }

  return { filtered: false };
}

/**
 * Origin/Referer check (extracted from lib/rate-limit.js)
 */
function checkOrigin(headers) {
  const ALLOWED_ORIGIN = 'https://eliavafar.co.il';
  const origin = headers.origin;
  const referer = headers.referer || headers.referrer;
  
  let refererOrigin = null;
  if (referer) {
    try {
      refererOrigin = new URL(referer).origin;
    } catch (e) {
      // Invalid Referer URL — treat as missing
    }
  }

  const hasValidOrigin = origin === ALLOWED_ORIGIN;
  const hasValidReferer = refererOrigin === ALLOWED_ORIGIN;

  // Require at least ONE of Origin or Referer to be present AND match
  if (!origin && !referer) {
    return { blocked: true, reason: 'missing-both-headers' };
  }

  if (!hasValidOrigin && !hasValidReferer) {
    return { blocked: true, reason: 'invalid-origin', origin, refererOrigin };
  }

  return { blocked: false };
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log('🧪 Running ISS-027 Regression Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(`   ${err.message}`);
    failed++;
  }
}

// ============================================================================
// SECTION 1: EXACT SPAM PAYLOADS (must be filtered)
// ============================================================================

console.log('📧 Section 1: Exact spam payloads from production\n');

test('Spam case 1: יעל לוי + 501231867 + charina.belardo@gmail.com', () => {
  const payload = {
    name: 'יעל לוי',
    phone: '501231867', // 9 digits, missing leading 0
    email: 'charina.belardo@gmail.com',
    message: 'אשמח לקבל מידע נוסף',
    source: '/',
    _formts: Date.now() - 5000 // 5 seconds ago (passes time-trap)
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true, 'Should be filtered');
  // Should be caught by EITHER invalid-phone OR spam-pattern
  assert(
    result.reason === 'invalid-phone' || result.reason === 'spam-pattern',
    `Should be filtered by phone or spam pattern, got: ${result.reason}`
  );
});

test('Spam case 2: יעל לוי + 501231154 + sarcodena@aol.com', () => {
  const payload = {
    name: 'יעל לוי',
    phone: '501231154', // 9 digits, missing leading 0
    email: 'sarcodena@aol.com',
    message: 'אשמח לקבל מידע נוסף',
    source: '/',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true, 'Should be filtered');
  assert(
    result.reason === 'invalid-phone' || result.reason === 'spam-pattern',
    `Should be filtered by phone or spam pattern, got: ${result.reason}`
  );
});

test('Generic Hebrew spam: common bot name + generic message', () => {
  const payload = {
    name: 'דני כהן',
    phone: '0525551234', // Valid phone
    email: 'bot@spam.com',
    message: 'אשמח לקבל מידע נוסף',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true, 'Should be filtered by spam pattern');
  assert.strictEqual(result.reason, 'spam-pattern');
});

// ============================================================================
// SECTION 2: PHONE VALIDATION (Israeli format)
// ============================================================================

console.log('\n📞 Section 2: Israeli phone validation\n');

test('Invalid phone: 9 digits without leading 0', () => {
  const payload = {
    name: 'Test',
    phone: '501231867',
    email: 'test@test.com',
    message: 'test',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'invalid-phone');
  assert.strictEqual(result.digits, '501231867');
});

test('Invalid phone: 8 digits', () => {
  const payload = {
    name: 'Test',
    phone: '52955612',
    message: 'test',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'invalid-phone');
});

test('Invalid phone: starts with 04 (not mobile)', () => {
  const payload = {
    name: 'Test',
    phone: '0499556123',
    message: 'test',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'invalid-phone');
});

test('Valid phone: 05X-XXXXXXXX (10 digits)', () => {
  const payload = {
    name: 'אליאב אהרון',
    phone: '0529556123',
    email: 'valid@test.co.il',
    message: 'אני צריך קידוח בנטונייט לבית חדש באליכין',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, false, 'Valid Israeli mobile should pass');
});

test('Valid phone: 052-955-6123 (with dashes)', () => {
  const payload = {
    name: 'אליאב אהרון',
    phone: '052-955-6123',
    message: 'צריך בור חלחול',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, false);
});

test('Valid phone: 9 digits (legacy format)', () => {
  const payload = {
    name: 'Test',
    phone: '052955612', // 9 digits starting with 05
    message: 'test',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, false);
});

// ============================================================================
// SECTION 3: TIME-TRAP VALIDATION
// ============================================================================

console.log('\n⏱️  Section 3: Time-trap validation\n');

test('Time-trap: missing _formts', () => {
  const payload = {
    name: 'Test',
    phone: '0529556123',
    message: 'test',
    // _formts missing
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'time-trap');
});

test('Time-trap: _formts = 0', () => {
  const payload = {
    name: 'Test',
    phone: '0529556123',
    message: 'test',
    _formts: 0
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'time-trap');
});

test('Time-trap: instant POST (dwell < 3s)', () => {
  const payload = {
    name: 'Test',
    phone: '0529556123',
    message: 'test',
    _formts: Date.now() - 2000 // 2 seconds ago — too fast
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'time-trap');
  assert(result.dwellMs < 3000, 'Dwell time should be less than 3 seconds');
});

test('Time-trap: stale timestamp (> 1 hour)', () => {
  const payload = {
    name: 'Test',
    phone: '0529556123',
    message: 'test',
    _formts: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'time-trap');
});

test('Time-trap: valid dwell time (5 seconds)', () => {
  const payload = {
    name: 'אליאב',
    phone: '0529556123',
    message: 'צריך קידוח',
    _formts: Date.now() - 5000 // 5 seconds — valid
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, false);
});

// ============================================================================
// SECTION 4: ORIGIN/REFERER POLICY
// ============================================================================

console.log('\n🌐 Section 4: Origin/Referer policy\n');

test('Origin check: missing both Origin and Referer', () => {
  const headers = {
    // No origin, no referer — bot signature
  };
  
  const result = checkOrigin(headers);
  assert.strictEqual(result.blocked, true);
  assert.strictEqual(result.reason, 'missing-both-headers');
});

test('Origin check: valid Origin', () => {
  const headers = {
    origin: 'https://eliavafar.co.il'
  };
  
  const result = checkOrigin(headers);
  assert.strictEqual(result.blocked, false);
});

test('Origin check: valid Referer (without Origin)', () => {
  const headers = {
    referer: 'https://eliavafar.co.il/contact'
  };
  
  const result = checkOrigin(headers);
  assert.strictEqual(result.blocked, false);
});

test('Origin check: invalid Origin', () => {
  const headers = {
    origin: 'https://evil-bot.com'
  };
  
  const result = checkOrigin(headers);
  assert.strictEqual(result.blocked, true);
  assert.strictEqual(result.reason, 'invalid-origin');
});

test('Origin check: invalid Referer', () => {
  const headers = {
    referer: 'https://spam-site.xyz/attack'
  };
  
  const result = checkOrigin(headers);
  assert.strictEqual(result.blocked, true);
  assert.strictEqual(result.reason, 'invalid-origin');
});

// ============================================================================
// SECTION 5: OTHER SPAM PATTERNS
// ============================================================================

console.log('\n🚫 Section 5: Other spam patterns\n');

test('Honeypot: _honey field filled', () => {
  const payload = {
    name: 'Bot',
    phone: '0529556123',
    message: 'spam',
    _honey: 'filled by bot',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'honeypot');
});

test('Link detection: URL in message', () => {
  const payload = {
    name: 'Spammer',
    phone: '0529556123',
    message: 'Check out https://spam-link.com for great deals',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'link-detected');
});

test('B2B pitch: SEO service', () => {
  const payload = {
    name: 'Marketing Agency',
    phone: '0529556123',
    message: 'We offer SEO and digital marketing services',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'spam-pattern');
});

test('Hebrew B2B pitch: קידום אתרים', () => {
  const payload = {
    name: 'חברת שיווק',
    phone: '0529556123',
    message: 'אנחנו מציעים שירותי קידום אתרים בגוגל',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, true);
  assert.strictEqual(result.reason, 'spam-pattern');
});

// ============================================================================
// SECTION 6: VALID LEADS (must NOT be filtered)
// ============================================================================

console.log('\n✅ Section 6: Valid leads (must pass)\n');

test('Valid lead 1: Hebrew name + valid phone + drilling inquiry', () => {
  const payload = {
    name: 'משה כהן',
    phone: '0529556123',
    email: 'moshe@example.co.il',
    service: 'קידוח בנטונייט',
    message: 'שלום, אני צריך קידוח בנטונייט לבית חדש באליכין. מה המחיר?',
    source: '/bentonite-drilling',
    _formts: Date.now() - 8000 // 8 seconds
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, false, 'Valid lead should pass all filters');
});

test('Valid lead 2: Simple inquiry', () => {
  const payload = {
    name: 'דוד לוי',
    phone: '052-444-5566',
    message: 'צריך בור חלחול בחדרה',
    _formts: Date.now() - 6000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, false);
});

test('Valid lead 3: English name + Israeli phone', () => {
  const payload = {
    name: 'John Smith',
    phone: '0525551234',
    email: 'john@gmail.com',
    message: 'Need drilling services for my property',
    _formts: Date.now() - 10000
  };
  
  const result = checkSpamFilters(payload);
  assert.strictEqual(result.filtered, false);
});

test('Valid lead 4: No email (phone only)', () => {
  const payload = {
    name: 'אבי ישראלי', // Note: "אבי" is in bot list, but different last name
    phone: '0529556123',
    message: 'צריך מידע על עבודות עפר',
    _formts: Date.now() - 5000
  };
  
  const result = checkSpamFilters(payload);
  // Should pass because "אבי ישראלי" doesn't match the exact pattern "אבי לוי"
  assert.strictEqual(result.filtered, false);
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 Test Results Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);
console.log('='.repeat(60));

if (failed > 0) {
  console.error('\n❌ Some tests failed. The spam filter has regressions.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Spam filter is working correctly.');
  console.log('\n📝 Verified:');
  console.log('  • Exact spam payloads from production are now filtered');
  console.log('  • Israeli phone validation catches invalid formats');
  console.log('  • Time-trap blocks instant bot submissions');
  console.log('  • Origin/Referer policy blocks requests without headers');
  console.log('  • Generic Hebrew spam patterns are detected');
  console.log('  • Valid Israeli leads pass through all filters');
  process.exit(0);
}
