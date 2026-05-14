// @ts-nocheck

import { testAiSettingsConnection } from '../connection-test';

function createResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

describe('ai connection test', () => {
  test('posts the configured model and reports success', async () => {
    const fetchImpl = jest.fn(async (_url, init) => {
      expect(_url).toBe('https://example.com/ai');
      expect(init.method).toBe('POST');
      const requestBody = JSON.parse(init.body);

      expect(requestBody).toMatchObject({
        model: 'butterfly-model',
        messages: [
          {
            role: 'user',
          },
        ],
      });
      expect(requestBody.messages[0].content).toContain('{"ok": true}');

      return createResponse(200, { ok: true });
    });

    const result = await testAiSettingsConnection({
      fetchImpl,
      settings: {
        apiUrl: 'https://example.com/ai',
        model: 'butterfly-model',
        apiKey: 'secret-key',
      },
      retries: 0,
      timeoutMs: 1_000,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('short-circuits invalid settings', async () => {
    const fetchImpl = jest.fn();

    const result = await testAiSettingsConnection({
      fetchImpl,
      settings: {
        apiUrl: 'not-a-url',
        model: '',
        apiKey: '',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('API URL');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
