import { getGeminiConfig } from '@/src/config/gemini';

/**
 * Thin Gemini (Google Generative Language API) client.
 *
 * Uses the REST endpoint via fetch — no extra dependency required. All errors are
 * surfaced as typed errors so the orchestrator can decide whether to fall back to
 * the rule-based response.
 */

export class GeminiNotConfiguredError extends Error {
  constructor(message = 'Gemini is not configured') {
    super(message);
    this.name = 'GeminiNotConfiguredError';
  }
}

export class GeminiRequestError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GeminiRequestError';
  }
}

export interface GeminiTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GenerateOptions {
  systemInstruction: string;
  /** Prior turns for multi-turn context (already trimmed by the caller). */
  history?: GeminiTurn[];
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * When set, Gemini is constrained to emit JSON matching this schema
   * (responseMimeType=application/json). Used by the grounded generation path so
   * the reply arrives with explicit citations that can be machine-verified.
   */
  responseSchema?: Record<string, any>;
}

export class GeminiParseError extends Error {
  constructor(message: string, public raw: string) {
    super(message);
    this.name = 'GeminiParseError';
  }
}

export function isGeminiConfigured(): boolean {
  return getGeminiConfig().isConfigured;
}

/**
 * Safe, key-free snapshot of the Gemini integration state for diagnostics/logging.
 * Never includes the API key itself — only whether one is present and its length.
 */
export function geminiDiagnostics() {
  const config = getGeminiConfig();
  return {
    configured: config.isConfigured,
    model: config.model || '(not set)',
    baseHost: (() => {
      try {
        return new URL(config.baseUrl).host;
      } catch {
        return '(invalid base url)';
      }
    })(),
    apiKeyPresent: config.apiKey.length > 0,
    apiKeyLength: config.apiKey.length, // length only — never the value
  };
}

export type GeminiRootCause =
  | 'quota_exhausted_free_tier'
  | 'quota_exhausted'
  | 'rate_limiting'
  | 'invalid_billing'
  | 'wrong_project_or_api_disabled'
  | 'invalid_api_key'
  | 'unknown';

export interface GeminiErrorDiagnosis {
  httpStatus: number;
  apiStatus?: string; // e.g. RESOURCE_EXHAUSTED, PERMISSION_DENIED
  rootCause: GeminiRootCause;
  quotaId?: string;
  quotaMetric?: string;
  retryDelay?: string;
  message?: string;
}

/**
 * Classifies a non-2xx Gemini response body into a concrete root cause. Parses the
 * Google API error envelope (error.status + QuotaFailure/RetryInfo details).
 */
export function diagnoseGeminiError(httpStatus: number, bodyText: string): GeminiErrorDiagnosis {
  let err: any = {};
  try {
    err = JSON.parse(bodyText)?.error ?? {};
  } catch {
    /* non-JSON body */
  }

  const apiStatus: string | undefined = err?.status;
  const details: any[] = Array.isArray(err?.details) ? err.details : [];
  const quotaFailure = details.find((d) => String(d?.['@type']).includes('QuotaFailure'));
  const violation = quotaFailure?.violations?.[0] ?? {};
  const quotaId: string = violation?.quotaId || '';
  const quotaMetric: string = violation?.quotaMetric || '';
  const retryInfo = details.find((d) => String(d?.['@type']).includes('RetryInfo'));
  const retryDelay: string | undefined = retryInfo?.retryDelay;
  const blob = `${apiStatus || ''} ${err?.message || ''} ${bodyText}`;

  // A "limit: 0" on a free-tier metric means the project has NO free-tier
  // allowance at all — this is a billing/plan problem, not transient rate limiting.
  const hasZeroLimit = /limit:\s*0\b/i.test(bodyText);
  const isFreeTier = /FreeTier|free_tier/i.test(quotaId + quotaMetric + bodyText);

  let rootCause: GeminiRootCause = 'unknown';
  if (httpStatus === 429) {
    if (hasZeroLimit && isFreeTier) rootCause = 'invalid_billing';
    else if (/PerMinute|per minute|RequestsPerMinute/i.test(quotaId + quotaMetric)) rootCause = 'rate_limiting';
    else if (/FreeTier|free_tier|PerDay|per day/i.test(quotaId + quotaMetric)) rootCause = 'quota_exhausted_free_tier';
    else rootCause = 'quota_exhausted';
  } else if (httpStatus === 403) {
    if (/SERVICE_DISABLED|PERMISSION_DENIED|has not been used|is disabled/i.test(blob))
      rootCause = 'wrong_project_or_api_disabled';
    else rootCause = 'wrong_project_or_api_disabled';
  } else if (httpStatus === 400 && /API_KEY_INVALID|API key not valid/i.test(blob)) {
    rootCause = 'invalid_api_key';
  } else if (/billing|BILLING_DISABLED|billing account/i.test(blob)) {
    rootCause = 'invalid_billing';
  }

  return { httpStatus, apiStatus, rootCause, quotaId, quotaMetric, retryDelay, message: err?.message };
}

export async function generateContent(options: GenerateOptions): Promise<string> {
  const config = getGeminiConfig();
  if (!config.isConfigured) {
    // Clear, specific configuration error (names the missing variable(s)).
    throw new GeminiNotConfiguredError(config.configError);
  }

  const contents = [
    ...(options.history || []).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    { role: 'user', parts: [{ text: options.prompt }] },
  ];

  const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;

  // Safe pre-flight diagnostic — no key, no URL (URL carries the key in query).
  console.log(
    `[Gemini] request → configured=${config.isConfigured} model=${config.model} host=${geminiDiagnostics().baseHost}`
  );

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.systemInstruction }] },
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          maxOutputTokens: options.maxOutputTokens ?? 800,
          ...(options.responseSchema
            ? {
                responseMimeType: 'application/json',
                responseSchema: options.responseSchema,
              }
            : {}),
        },
      }),
    });
  } catch (err: any) {
    throw new GeminiRequestError(`Network error calling Gemini: ${err?.message || err}`);
  }

  console.log(`[Gemini] response ← HTTP ${response.status}`);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const diag = diagnoseGeminiError(response.status, body);
    // Structured, key-free diagnostic log so the root cause is visible in logs.
    console.error('[Gemini] request failed:', {
      httpStatus: diag.httpStatus,
      apiStatus: diag.apiStatus,
      rootCause: diag.rootCause,
      quotaId: diag.quotaId || undefined,
      retryDelay: diag.retryDelay,
    });
    throw new GeminiRequestError(
      `Gemini API returned ${response.status} (${diag.apiStatus || 'error'}, rootCause=${diag.rootCause}): ${(diag.message || body).slice(0, 200)}`,
      response.status
    );
  }

  const data: any = await response.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new GeminiRequestError('Gemini returned an empty response');
  }

  return text;
}

/**
 * Structured generation. Forces a JSON response and parses it, tolerating the
 * ```json fences some model versions still emit.
 *
 * This is the only generation path used for grounded answers: a free-text reply
 * cannot be machine-verified against the retrieved documents, whereas explicit
 * `citedProductIds` / `citedKnowledgeRefs` can.
 */
export async function generateStructured<T = any>(
  options: GenerateOptions & { responseSchema: Record<string, any> }
): Promise<T> {
  const raw = await generateContent({
    ...options,
    // Grounded generation is a rephrasing task, not a creative one.
    temperature: options.temperature ?? 0.2,
  });

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Last resort: extract the outermost JSON object.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new GeminiParseError('Gemini returned a non-JSON response', raw.slice(0, 500));
  }
}
