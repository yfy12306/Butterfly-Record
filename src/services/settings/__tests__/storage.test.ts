// @ts-nocheck

import { createAiSettingsStore, normalizeAiSettingsInput, validateAiSettings } from '../storage';

function createMemoryAdapter() {
  let config = null;
  let apiKey = null;

  return {
    async getConfig() {
      return config;
    },
    async setConfig(value) {
      config = value;
    },
    async removeConfig() {
      config = null;
    },
    async getApiKey() {
      return apiKey;
    },
    async setApiKey(value) {
      apiKey = value;
    },
    async removeApiKey() {
      apiKey = null;
    },
  };
}

describe('ai settings storage', () => {
  test('splits config and secret storage', async () => {
    const adapter = createMemoryAdapter();
    const store = createAiSettingsStore(adapter);

    const saved = await store.save({
      apiUrl: ' https://example.com/api ',
      model: ' butterfly-model ',
      apiKey: ' secret-key ',
    });

    expect(saved).toEqual({
      apiUrl: 'https://example.com/api',
      model: 'butterfly-model',
      apiKey: 'secret-key',
    });

    const loaded = await store.load();
    expect(loaded).toEqual(saved);
    expect(await adapter.getConfig()).toContain('"apiUrl":"https://example.com/api"');
    expect(await adapter.getApiKey()).toBe('secret-key');
  });

  test('clears the secret when api key is empty', async () => {
    const adapter = createMemoryAdapter();
    const store = createAiSettingsStore(adapter);

    await store.save({
      apiUrl: 'https://example.com/api',
      model: 'butterfly-model',
      apiKey: 'secret-key',
    });
    await store.save({
      apiUrl: 'https://example.com/api',
      model: 'butterfly-model',
      apiKey: '',
    });

    expect(await adapter.getApiKey()).toBeNull();
  });

  test('normalizes and validates settings', () => {
    expect(
      normalizeAiSettingsInput({
        apiUrl: ' https://example.com/api ',
        model: ' model ',
        apiKey: ' key ',
      }),
    ).toEqual({
      apiUrl: 'https://example.com/api',
      model: 'model',
      apiKey: 'key',
    });

    expect(validateAiSettings({ apiUrl: '', model: '', apiKey: '' })).toHaveLength(3);
  });
});

