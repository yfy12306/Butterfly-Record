import {
  DEFAULT_AI_CONNECTION_RETRIES,
  DEFAULT_AI_CONNECTION_TIMEOUT_MS,
} from './constants';
import { aiSettingsStore, validateAiSettings, normalizeAiSettingsInput } from './storage';
import type { AiConnectionTestResult, AiSettings, AiSettingsValidationIssue } from './types';

export interface TestAiConnectionOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
  settings?: AiSettings;
}

export interface AiConnectionRequestPayload {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  response_format?: { type: 'json_object' };
}

function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

async function fetchJsonWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(createAbortError('AI request timed out.')), timeoutMs);
  const onAbort = () => controller.abort(signal?.reason ?? createAbortError('AI request aborted.'));

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw signal.reason ?? createAbortError('AI request aborted.');
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}

async function readResponseBody(response: Response): Promise<{ responseText: string; responseJson: unknown }> {
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

function buildConnectionTestPayload(model: string): AiConnectionRequestPayload {
  return {
    model,
    messages: [
      {
        role: 'user',
        content: 'Reply with a JSON object containing {"ok": true}.',
      },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  };
}

function formatValidationMessage(issues: AiSettingsValidationIssue[]): string {
  return issues.map((issue) => issue.message).join(' ');
}

export async function testAiSettingsConnection(options: TestAiConnectionOptions = {}): Promise<AiConnectionTestResult> {
  const settings = normalizeAiSettingsInput(options.settings ?? (await aiSettingsStore.load()));
  const issues = validateAiSettings(settings);

  if (issues.length > 0) {
    return {
      ok: false,
      message: formatValidationMessage(issues),
      retried: 0,
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_AI_CONNECTION_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_AI_CONNECTION_RETRIES;
  const payload = buildConnectionTestPayload(settings.model);
  const requestBody = JSON.stringify(payload);
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: requestBody,
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchJsonWithTimeout(fetchImpl, settings.apiUrl, requestInit, timeoutMs, options.signal);
      const { responseText, responseJson } = await readResponseBody(response);

      if (!response.ok) {
        const message = `AI connection test failed with HTTP ${response.status}.`;
        if (attempt < retries && isRetryableStatus(response.status)) {
          lastError = new Error(message);
          await delay(250 * (attempt + 1));
          continue;
        }

        return {
          ok: false,
          status: response.status,
          message,
          responseText,
          responseJson,
          retried: attempt,
        };
      }

      return {
        ok: true,
        status: response.status,
        message: 'Connection test succeeded.',
        responseText,
        responseJson,
        retried: attempt,
      };
    } catch (error) {
      lastError = error;
      const retriable = attempt < retries;
      if (!retriable) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'AI connection test failed.',
          retried: attempt,
        };
      }

      await delay(250 * (attempt + 1));
    }
  }

  return {
    ok: false,
    message: lastError instanceof Error ? lastError.message : 'AI connection test failed.',
    retried: retries,
  };
}

