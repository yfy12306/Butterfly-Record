import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';

import {
  AI_SETTINGS_CONFIG_STORAGE_KEY,
  AI_SETTINGS_SECRET_STORAGE_KEY,
  AI_SETTINGS_STORAGE_VERSION,
} from './constants';
import type {
  AiSettings,
  AiSettingsInput,
  AiSettingsStorageAdapter,
  AiSettingsValidationIssue,
  StoredAiSettingsConfig,
} from './types';

function trimOrEmpty(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nowIso(): string {
  return new Date().toISOString();
}

const FALLBACK_SETTINGS_DIRECTORY = `${FileSystem.documentDirectory ?? ''}butterfly-collection/settings/`;
const FALLBACK_SETTINGS_FILE = `${FALLBACK_SETTINGS_DIRECTORY}ai-settings-config.json`;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeAiSettingsInput(input: AiSettingsInput): AiSettings {
  return {
    apiUrl: trimOrEmpty(input.apiUrl),
    model: trimOrEmpty(input.model),
    apiKey: trimOrEmpty(input.apiKey),
  };
}

export function createStoredAiSettingsConfig(settings: Pick<AiSettings, 'apiUrl' | 'model'>): StoredAiSettingsConfig {
  return {
    version: AI_SETTINGS_STORAGE_VERSION,
    apiUrl: trimOrEmpty(settings.apiUrl),
    model: trimOrEmpty(settings.model),
    updatedAt: nowIso(),
  };
}

export function validateAiSettings(settings: AiSettings): AiSettingsValidationIssue[] {
  const issues: AiSettingsValidationIssue[] = [];

  if (!settings.apiUrl) {
    issues.push({ field: 'apiUrl', message: 'API URL is required.' });
  } else if (!isHttpUrl(settings.apiUrl)) {
    issues.push({ field: 'apiUrl', message: 'API URL must use http or https.' });
  }

  if (!settings.model) {
    issues.push({ field: 'model', message: 'Model is required.' });
  }

  if (!settings.apiKey) {
    issues.push({ field: 'apiKey', message: 'API key is required.' });
  }

  return issues;
}

export function parseStoredAiSettingsConfig(raw: string | null): StoredAiSettingsConfig | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAiSettingsConfig>;
    if (typeof parsed.apiUrl !== 'string' || typeof parsed.model !== 'string') {
      return null;
    }

    return {
      version: typeof parsed.version === 'number' ? parsed.version : AI_SETTINGS_STORAGE_VERSION,
      apiUrl: trimOrEmpty(parsed.apiUrl),
      model: trimOrEmpty(parsed.model),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
    };
  } catch {
    return null;
  }
}

export function createDefaultAiSettingsStorageAdapter(): AiSettingsStorageAdapter {
  async function readConfigFromFileFallback() {
    if (!FileSystem.documentDirectory) {
      return null;
    }

    const fileInfo = await FileSystem.getInfoAsync(FALLBACK_SETTINGS_FILE);
    if (!fileInfo.exists) {
      return null;
    }

    return FileSystem.readAsStringAsync(FALLBACK_SETTINGS_FILE, { encoding: FileSystem.EncodingType.UTF8 });
  }

  async function writeConfigToFileFallback(value: string) {
    if (!FileSystem.documentDirectory) {
      return;
    }

    const dirInfo = await FileSystem.getInfoAsync(FALLBACK_SETTINGS_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FALLBACK_SETTINGS_DIRECTORY, { intermediates: true });
    }

    await FileSystem.writeAsStringAsync(FALLBACK_SETTINGS_FILE, value, { encoding: FileSystem.EncodingType.UTF8 });
  }

  async function removeConfigFileFallback() {
    if (!FileSystem.documentDirectory) {
      return;
    }
    await FileSystem.deleteAsync(FALLBACK_SETTINGS_FILE, { idempotent: true });
  }

  async function getConfigSafe() {
    try {
      return await AsyncStorage.getItem(AI_SETTINGS_CONFIG_STORAGE_KEY);
    } catch {
      return readConfigFromFileFallback();
    }
  }

  async function setConfigSafe(value: string) {
    try {
      await AsyncStorage.setItem(AI_SETTINGS_CONFIG_STORAGE_KEY, value);
    } catch {
      await writeConfigToFileFallback(value);
    }
  }

  async function removeConfigSafe() {
    try {
      await AsyncStorage.removeItem(AI_SETTINGS_CONFIG_STORAGE_KEY);
    } catch {
      await removeConfigFileFallback();
    }
  }

  return {
    async getConfig() {
      return getConfigSafe();
    },
    async setConfig(value: string) {
      await setConfigSafe(value);
    },
    async removeConfig() {
      await removeConfigSafe();
    },
    async getApiKey() {
      if (!(await SecureStore.isAvailableAsync())) {
        throw new Error('SecureStore is not available on this platform.');
      }
      return SecureStore.getItemAsync(AI_SETTINGS_SECRET_STORAGE_KEY);
    },
    async setApiKey(value: string) {
      if (!(await SecureStore.isAvailableAsync())) {
        throw new Error('SecureStore is not available on this platform.');
      }
      await SecureStore.setItemAsync(AI_SETTINGS_SECRET_STORAGE_KEY, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    },
    async removeApiKey() {
      if (!(await SecureStore.isAvailableAsync())) {
        throw new Error('SecureStore is not available on this platform.');
      }
      await SecureStore.deleteItemAsync(AI_SETTINGS_SECRET_STORAGE_KEY);
    },
  };
}

export function createAiSettingsStore(adapter: AiSettingsStorageAdapter = createDefaultAiSettingsStorageAdapter()) {
  async function load(): Promise<AiSettings> {
    const [storedConfig, apiKey] = await Promise.all([adapter.getConfig(), adapter.getApiKey()]);
    const parsedConfig = parseStoredAiSettingsConfig(storedConfig);

    return normalizeAiSettingsInput({
      apiUrl: parsedConfig?.apiUrl ?? '',
      model: parsedConfig?.model ?? '',
      apiKey: apiKey ?? '',
    });
  }

  async function save(nextSettings: AiSettings): Promise<AiSettings> {
    const normalized = normalizeAiSettingsInput(nextSettings);
    const config = createStoredAiSettingsConfig(normalized);

    await Promise.all([
      adapter.setConfig(JSON.stringify(config)),
      normalized.apiKey ? adapter.setApiKey(normalized.apiKey) : adapter.removeApiKey(),
    ]);

    return normalized;
  }

  async function update(partialSettings: AiSettingsInput): Promise<AiSettings> {
    const current = await load();
    return save({
      apiUrl: partialSettings.apiUrl ?? current.apiUrl,
      model: partialSettings.model ?? current.model,
      apiKey: partialSettings.apiKey ?? current.apiKey,
    });
  }

  async function clear(): Promise<void> {
    await Promise.all([adapter.removeConfig(), adapter.removeApiKey()]);
  }

  async function testReady(): Promise<{ ready: boolean; issues: AiSettingsValidationIssue[]; settings: AiSettings }> {
    const settings = await load();
    const issues = validateAiSettings(settings);
    return { ready: issues.length === 0, issues, settings };
  }

  return {
    load,
    save,
    update,
    clear,
    testReady,
  };
}

export const aiSettingsStore = createAiSettingsStore();
