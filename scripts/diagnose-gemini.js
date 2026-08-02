/**
 * Gemini integration diagnostic. Makes ONE real request and reports the exact
 * root cause of any failure. Never prints the API key.
 *
 * Run: node -r dotenv/config scripts/diagnose-gemini.js
 */
function classify(httpStatus, bodyText) {
  let err = {};
  try {
    err = JSON.parse(bodyText)?.error ?? {};
  } catch {}
  const apiStatus = err?.status;
  const details = Array.isArray(err?.details) ? err.details : [];
  const violation = (details.find((d) => String(d?.['@type']).includes('QuotaFailure'))?.violations || [])[0] || {};
  const quotaId = violation.quotaId || '';
  const quotaMetric = violation.quotaMetric || '';
  const retryDelay = details.find((d) => String(d?.['@type']).includes('RetryInfo'))?.retryDelay;
  const blob = `${apiStatus || ''} ${err?.message || ''} ${bodyText}`;

  const hasZeroLimit = /limit:\s*0\b/i.test(bodyText);
  const isFreeTier = /FreeTier|free_tier/i.test(quotaId + quotaMetric + bodyText);

  let rootCause = 'unknown';
  if (httpStatus === 429) {
    if (hasZeroLimit && isFreeTier) rootCause = 'invalid_billing (free-tier limit is 0 → enable billing)';
    else if (/PerMinute|per minute/i.test(quotaId + quotaMetric)) rootCause = 'rate_limiting';
    else if (/FreeTier|free_tier|PerDay|per day/i.test(quotaId + quotaMetric)) rootCause = 'quota_exhausted_free_tier';
    else rootCause = 'quota_exhausted';
  } else if (httpStatus === 403) rootCause = 'wrong_project_or_api_disabled';
  else if (httpStatus === 400 && /API_KEY_INVALID|API key not valid/i.test(blob)) rootCause = 'invalid_api_key';
  else if (/billing/i.test(blob)) rootCause = 'invalid_billing';

  return { apiStatus, rootCause, quotaId, quotaMetric, retryDelay, message: err?.message };
}

async function run() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const model = (process.env.GEMINI_MODEL || '').trim();
  const baseUrl = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').trim();

  console.log('=== Gemini Configuration (safe) ===');
  console.log('configured   :', apiKey.length > 0 && model.length > 0);
  console.log('model        :', model || '(NOT SET)');
  console.log('baseHost     :', (() => { try { return new URL(baseUrl).host; } catch { return '(invalid)'; } })());
  console.log('apiKeyPresent:', apiKey.length > 0);
  console.log('apiKeyLength :', apiKey.length, '(value never printed)');

  if (!apiKey || !model) {
    console.log('\nResult: Gemini is NOT configured (missing key and/or model). No call made.');
    return;
  }

  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
  console.log('\n=== Live probe ===');
  let res, body;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] }),
    });
    body = await res.text();
  } catch (e) {
    console.log('Network error:', e.message);
    return;
  }

  console.log('HTTP status  :', res.status, res.statusText);
  if (res.ok) {
    console.log('Result: SUCCESS — Gemini responded. Integration is healthy.');
    return;
  }

  const d = classify(res.status, body);
  console.log('\n=== Diagnosis ===');
  console.log('apiStatus    :', d.apiStatus);
  console.log('rootCause    :', d.rootCause);
  console.log('quotaId      :', d.quotaId || '(none)');
  console.log('quotaMetric  :', d.quotaMetric || '(none)');
  console.log('retryDelay   :', d.retryDelay || '(none)');
  console.log('apiMessage   :', d.message);
}

run();
