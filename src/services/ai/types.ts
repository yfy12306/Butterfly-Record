import type { AiSettings } from '../settings';

export interface ButterflyIdentifyImageInput {
  settings: AiSettings;
  imageUri?: string;
  imageBase64?: string;
  imageMimeType?: string;
  prompt?: string;
}

export interface ButterflyIdentifyRequestMessagePartText {
  type: 'text';
  text: string;
}

export interface ButterflyIdentifyRequestMessagePartImageUrl {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export interface ButterflyIdentifyRequestBody {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: Array<ButterflyIdentifyRequestMessagePartText | ButterflyIdentifyRequestMessagePartImageUrl> | string;
  }>;
  temperature?: number;
  response_format?: {
    type: 'json_object';
  };
}

export interface IdentifyResponse {
  is_not_butterfly: boolean;
  name_cn: string | null;
  name_en: string | null;
  latin_name: string | null;
  family: string | null;
  subfamily: string | null;
  genus: string | null;
  distribution: string | null;
  habitat: string | null;
  wingspan: string | null;
  description: string | null;
  confidence: number | null;
  raw: unknown;
}

export interface ButterflyIdentifyOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
}

export interface ButterflyIdentifyBatchResult {
  ok: boolean;
  attempts: number;
  response?: IdentifyResponse;
  error?: string;
}

export interface ImageDataUri {
  mimeType: string;
  base64: string;
  dataUri: string;
  uri?: string;
}
