import type { ButterflyIdentifyOptions, ButterflyIdentifyRequestBody, ImageDataUri } from './types';
import { ButterflyAiError } from './errors';

export interface JsonRequestOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  signal?: AbortSignal;
  retryDelayMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  options: JsonRequestOptions = {},
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(createAbortError('Request timed out.')), timeoutMs);
  const externalSignal = options.signal;
  const onAbort = () => controller.abort(externalSignal?.reason ?? createAbortError('Request aborted.'));

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw externalSignal.reason ?? createAbortError('Request aborted.');
    }
    externalSignal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort);
    }
  }
}

export async function readResponseBody(response: Response): Promise<{ responseText: string; responseJson: unknown }> {
  const responseText = await response.text();
  if (!responseText) {
    return { responseText, responseJson: null };
  }

  try {
    return { responseText, responseJson: JSON.parse(responseText) as unknown };
  } catch {
    return { responseText, responseJson: responseText };
  }
}

export function buildButterflyIdentifyRequestBody(
  model: string,
  image: ImageDataUri,
  prompt: string,
): ButterflyIdentifyRequestBody {
  return {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '你是中文蝴蝶图像识别助手。只返回严格 JSON，字段为 is_not_butterfly, name_cn, name_en, latin_name, family, subfamily, genus, distribution, habitat, wingspan, description, confidence。输出规则：name_cn 必须是中文且以“蝶”结尾；family/subfamily/genus 必须是“中文（拉丁文）”格式；distribution/habitat/description 必须是简体中文；wingspan 使用“xx-xx mm”；confidence 必须是 0 到 1 的数字，不要返回百分号或其他文本。',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: image.dataUri,
            },
          },
        ],
      },
    ],
  };
}

export function buildConnectionTestRequestBody(model: string): ButterflyIdentifyRequestBody {
  return {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: 'Reply with {"ok": true}.',
      },
    ],
  };
}

export async function postJsonWithRetry(
  url: string,
  body: unknown,
  options: ButterflyIdentifyOptions & { headers?: Record<string, string>; retries?: number; timeoutMs?: number },
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retries = options.retries ?? 0;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const retryDelayMs = options.retryDelayMs ?? 250;
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: JSON.stringify(body),
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchJsonWithTimeout(url, init, {
        fetchImpl,
        timeoutMs,
        signal: options.signal,
      });

      if (!response.ok && attempt < retries && isRetryableStatus(response.status)) {
        lastError = new ButterflyAiError('http-error', `HTTP ${response.status}`, {
          status: response.status,
          retriable: true,
        });
        await delay(retryDelayMs * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      const retriable = attempt < retries;
      if (!retriable) {
        throw error;
      }
      await delay(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed.');
}

