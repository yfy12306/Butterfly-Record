// @ts-nocheck

import { bytesToBase64String } from '../base64';
import { identifyButterflyImage, identifyButterflyImageWithRetry } from '../identify';

function createResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

describe('ai identify service', () => {
  test('encodes bytes to base64', () => {
    expect(bytesToBase64String(new Uint8Array([0, 1, 2, 253, 254, 255]))).toBe('AAEC/f7/');
  });

  test('normalizes openai-like responses', async () => {
    const fetchImpl = jest.fn(async () =>
      createResponse(200, {
        choices: [
          {
            message: {
              content:
                '{"is_not_butterfly":false,"name_cn":"凤蝶","family":"凤蝶科","confidence":"0.98"}',
            },
          },
        ],
      }),
    );

    const result = await identifyButterflyImage(
      {
        settings: {
          apiUrl: 'https://example.com/ai',
          model: 'butterfly-model',
          apiKey: 'secret-key',
        },
        imageBase64: 'AQID',
        imageMimeType: 'image/png',
      },
      {
        fetchImpl,
        timeoutMs: 1_000,
      },
    );

    expect(result).toMatchObject({
      is_not_butterfly: false,
      name_cn: '凤蝶',
      family: '凤蝶科',
      confidence: 0.98,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('retries transient http failures', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(createResponse(500, { error: 'temporary' }))
      .mockResolvedValueOnce(
        createResponse(200, {
          is_not_butterfly: false,
          name_cn: '粉蝶',
          confidence: 0.88,
        }),
      );

    const result = await identifyButterflyImageWithRetry(
      {
        settings: {
          apiUrl: 'https://example.com/ai',
          model: 'butterfly-model',
          apiKey: 'secret-key',
        },
        imageBase64: 'AQID',
        imageMimeType: 'image/png',
      },
      {
        fetchImpl,
        timeoutMs: 1_000,
        retries: 1,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test('normalizes chinese name and taxonomy labels', async () => {
    const fetchImpl = jest.fn(async () =>
      createResponse(200, {
        is_not_butterfly: false,
        name_cn: '柠檬眼蛱',
        family: '蛱蝶科 (Nymphalidae)',
        subfamily: '蛱蝶亚科\\Nymphalinae',
        genus: 'Junonia',
        confidence: 0.76,
      }),
    );

    const result = await identifyButterflyImage(
      {
        settings: {
          apiUrl: 'https://example.com/ai',
          model: 'butterfly-model',
          apiKey: 'secret-key',
        },
        imageBase64: 'AQID',
        imageMimeType: 'image/png',
      },
      {
        fetchImpl,
        timeoutMs: 1_000,
      },
    );

    expect(result).toMatchObject({
      name_cn: '柠檬眼蛱蝶',
      family: '蛱蝶科（Nymphalidae）',
      subfamily: '蛱蝶亚科（Nymphalinae）',
      genus: 'Junonia',
    });
  });
});

