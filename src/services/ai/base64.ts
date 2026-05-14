import { File } from 'expo-file-system';

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index] ?? 0;
    const byte2 = bytes[index + 1] ?? 0;
    const byte3 = bytes[index + 2] ?? 0;

    const hasByte2 = index + 1 < bytes.length;
    const hasByte3 = index + 2 < bytes.length;

    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    output += alphabet[(triplet >> 18) & 63];
    output += alphabet[(triplet >> 12) & 63];
    output += hasByte2 ? alphabet[(triplet >> 6) & 63] : '=';
    output += hasByte3 ? alphabet[triplet & 63] : '=';
  }

  return output;
}

export function inferMimeTypeFromUri(uri: string, fallback = 'image/jpeg'): string {
  const cleanUri = uri.split('?')[0] ?? uri;
  const lowerCaseUri = cleanUri.toLowerCase();
  const matchedExtension = Object.keys(MIME_TYPE_BY_EXTENSION).find((extension) =>
    lowerCaseUri.endsWith(extension),
  );

  return matchedExtension ? MIME_TYPE_BY_EXTENSION[matchedExtension] : fallback;
}

async function readBytesFromUri(uri: string): Promise<Uint8Array> {
  try {
    const file = new File(uri);
    return await file.bytes();
  } catch {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Unable to read image URI: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

export async function imageUriToBase64DataUri(
  uri: string,
  mimeType: string = inferMimeTypeFromUri(uri),
): Promise<{ base64: string; mimeType: string; dataUri: string }> {
  const bytes = await readBytesFromUri(uri);
  const base64 = bytesToBase64(bytes);
  const normalizedMimeType = mimeType.trim() || 'image/jpeg';
  return {
    base64,
    mimeType: normalizedMimeType,
    dataUri: `data:${normalizedMimeType};base64,${base64}`,
  };
}

export function bytesToBase64String(bytes: Uint8Array): string {
  return bytesToBase64(bytes);
}
