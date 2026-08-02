/**
 * Gemini configuration layer.
 *
 * Reads ALL values from environment variables. No API key and no model name are
 * ever hardcoded — both GEMINI_API_KEY and GEMINI_MODEL must be supplied by the
 * operator. When either is missing the assistant stays functional via the
 * retrieval-based fallback (see chat.service.ts); it simply does not call Gemini.
 */

export interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  /** True only when BOTH the API key and the model are configured. */
  isConfigured: boolean;
  /** Human-readable reason when isConfigured is false (else undefined). */
  configError?: string;
}

// baseUrl is an API endpoint, not a model, so a default is acceptable here.
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export function getGeminiConfig(): GeminiConfig {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const model = (process.env.GEMINI_MODEL || '').trim();
  const baseUrl = (process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL).trim();

  const missing: string[] = [];
  if (!apiKey) missing.push('GEMINI_API_KEY');
  if (!model) missing.push('GEMINI_MODEL');

  const isConfigured = missing.length === 0;

  return {
    apiKey,
    model,
    baseUrl,
    isConfigured,
    configError: isConfigured
      ? undefined
      : `Gemini is not configured: missing ${missing.join(' and ')}. ` +
        `Set ${missing.join(' and ')} in your environment to enable AI replies.`,
  };
}
