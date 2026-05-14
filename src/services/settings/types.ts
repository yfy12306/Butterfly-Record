export interface AiSettings {
  apiUrl: string;
  model: string;
  apiKey: string;
}

export interface AiSettingsInput {
  apiUrl?: string | null;
  model?: string | null;
  apiKey?: string | null;
}

export interface StoredAiSettingsConfig {
  version: number;
  apiUrl: string;
  model: string;
  updatedAt: string;
}

export interface AiSettingsStorageAdapter {
  getConfig(): Promise<string | null>;
  setConfig(value: string): Promise<void>;
  removeConfig(): Promise<void>;
  getApiKey(): Promise<string | null>;
  setApiKey(value: string): Promise<void>;
  removeApiKey(): Promise<void>;
}

export interface AiSettingsValidationIssue {
  field: keyof AiSettings;
  message: string;
}

export interface AiConnectionTestResult {
  ok: boolean;
  status?: number;
  message: string;
  responseText?: string;
  responseJson?: unknown;
  retried: number;
}

