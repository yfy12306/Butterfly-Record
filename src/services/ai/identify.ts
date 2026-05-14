import type { AiSettings } from '../settings';
import { validateAiSettings } from '../settings';
import { ButterflyAiError } from './errors';
import { buildButterflyIdentifyRequestBody, isRetryableStatus, postJsonWithRetry, readResponseBody } from './client';
import { imageUriToBase64DataUri } from './base64';
import type {
  ButterflyIdentifyBatchResult,
  ButterflyIdentifyImageInput,
  ButterflyIdentifyOptions,
  IdentifyResponse,
} from './types';

export const DEFAULT_BUTTERFLY_IDENTIFY_PROMPT =
  '请识别图片中的蝴蝶并仅返回 JSON。若不是蝴蝶，is_not_butterfly 设为 true。请使用中文输出：name_cn 必须以“蝶”结尾（例如“柠檬眼蝶”）；family/subfamily/genus 使用“中文（拉丁文）”格式；distribution/habitat/description 使用简体中文整句；wingspan 使用“xx-xx mm”；confidence 必须是 0 到 1 之间的小数。';

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, '');
  return withoutOpeningFence.replace(/\s*```$/, '').trim();
}

function hasCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function normalizeNameCn(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (!hasCjk(normalized)) {
    return normalized;
  }

  return normalized.endsWith('蝶') ? normalized : `${normalized}蝶`;
}

function normalizeTaxonomyLabel(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const slashParts = trimmed.split('\\').map((part) => part.trim()).filter(Boolean);
  if (slashParts.length >= 2) {
    return `${slashParts[0]}（${slashParts.slice(1).join(' ')}）`;
  }

  const fullWidth = trimmed.match(/^(.+?)（(.+?)）$/);
  if (fullWidth) {
    return `${fullWidth[1].trim()}（${fullWidth[2].trim()}）`;
  }

  const halfWidth = trimmed.match(/^(.+?)\((.+?)\)$/);
  if (halfWidth) {
    return `${halfWidth[1].trim()}（${halfWidth[2].trim()}）`;
  }

  const withSlash = trimmed.split('/').map((part) => part.trim()).filter(Boolean);
  if (withSlash.length === 2 && hasCjk(withSlash[0])) {
    return `${withSlash[0]}（${withSlash[1]}）`;
  }

  return trimmed;
}

function extractOpenAiLikePayload(raw: unknown): unknown {
  if (!isPlainObject(raw)) {
    return raw;
  }

  if (raw.data && isPlainObject(raw.data)) {
    return raw.data;
  }

  if (raw.result && isPlainObject(raw.result)) {
    return raw.result;
  }

  const choices = raw.choices;
  if (Array.isArray(choices)) {
    const firstChoice = choices[0];
    if (isPlainObject(firstChoice)) {
      const message = firstChoice.message;
      if (isPlainObject(message)) {
        const content = message.content;
        if (typeof content === 'string') {
          const stripped = stripCodeFence(content);
          try {
            return JSON.parse(stripped) as unknown;
          } catch {
            return stripped;
          }
        }
      }
    }
  }

  return raw;
}

function normalizeIdentifyResponse(raw: unknown): IdentifyResponse {
  const payload = extractOpenAiLikePayload(raw);
  const source = isPlainObject(payload) ? payload : {};

  return {
    is_not_butterfly: toBoolean(source.is_not_butterfly),
    name_cn: normalizeNameCn(toNullableString(source.name_cn)),
    name_en: toNullableString(source.name_en),
    latin_name: toNullableString(source.latin_name),
    family: normalizeTaxonomyLabel(toNullableString(source.family)),
    subfamily: normalizeTaxonomyLabel(toNullableString(source.subfamily)),
    genus: normalizeTaxonomyLabel(toNullableString(source.genus)),
    distribution: toNullableString(source.distribution),
    habitat: toNullableString(source.habitat),
    wingspan: toNullableString(source.wingspan),
    description: toNullableString(source.description),
    confidence: toNullableNumber(source.confidence),
    raw,
  };
}

function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) {
    throw signal.reason ?? createAbortError('Request aborted.');
  }

  return await new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(createAbortError('Identify request timed out.'));
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal?.reason ?? createAbortError('Request aborted.'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        reject(error);
      });
  });
}

function shouldRetryIdentifyError(error: unknown): boolean {
  if (error instanceof ButterflyAiError) {
    return Boolean(error.retriable);
  }

  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('Network') || error.message.includes('timeout');
  }

  return false;
}

export async function identifyButterflyImage(
  input: ButterflyIdentifyImageInput,
  options: ButterflyIdentifyOptions = {},
): Promise<IdentifyResponse> {
  const settings: AiSettings = {
    apiUrl: input.settings.apiUrl.trim(),
    model: input.settings.model.trim(),
    apiKey: input.settings.apiKey.trim(),
  };

  const issues = validateAiSettings(settings);
  if (issues.length > 0) {
    throw new ButterflyAiError('invalid-settings', issues.map((issue) => issue.message).join(' '));
  }

  if (!input.imageBase64 && !input.imageUri) {
    throw new ButterflyAiError('missing-image', 'Image data is required.');
  }

  const imageDataUri = input.imageBase64
    ? {
        base64: input.imageBase64,
        mimeType: input.imageMimeType?.trim() || 'image/jpeg',
        uri: input.imageUri ?? 'inline-base64',
        dataUri: `data:${input.imageMimeType?.trim() || 'image/jpeg'};base64,${input.imageBase64}`,
      }
    : await imageUriToBase64DataUri(input.imageUri as string, input.imageMimeType);

  const requestBody = buildButterflyIdentifyRequestBody(
    settings.model,
    imageDataUri,
    input.prompt?.trim() || DEFAULT_BUTTERFLY_IDENTIFY_PROMPT,
  );
  const response = await withTimeout(
    postJsonWithRetry(settings.apiUrl, requestBody, {
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      retries: options.retries ?? 0,
      retryDelayMs: options.retryDelayMs,
      signal: options.signal,
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
      },
    }),
    options.timeoutMs ?? 60_000,
    options.signal,
  );

  const { responseText, responseJson } = await readResponseBody(response);
  if (!response.ok) {
    throw new ButterflyAiError('http-error', `HTTP ${response.status}`, {
      status: response.status,
      retriable: isRetryableStatus(response.status),
      cause: responseJson ?? responseText,
    });
  }

  return normalizeIdentifyResponse(responseJson);
}

export async function identifyButterflyImageWithRetry(
  input: ButterflyIdentifyImageInput,
  options: ButterflyIdentifyOptions = {},
): Promise<ButterflyIdentifyBatchResult> {
  const retries = options.retries ?? 2;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await identifyButterflyImage(input, {
        ...options,
        retries: 0,
      });

      return {
        ok: true,
        attempts: attempt + 1,
        response,
      };
    } catch (error) {
      const retriable = attempt < retries && shouldRetryIdentifyError(error);
      if (!retriable) {
        return {
          ok: false,
          attempts: attempt + 1,
          error: error instanceof Error ? error.message : 'Identify request failed.',
        };
      }
    }
  }

  return {
    ok: false,
    attempts: retries + 1,
    error: 'Identify request failed.',
  };
}
