import { createDeterministicChecksum, normalizeText } from '../../types/shared';

export const PRIVATE_PHOTO_DIRECTORY_NAME = 'butterfly-photos';
export const PRIVATE_PHOTO_FILE_PREFIX = 'butterfly';
export const PRIVATE_PHOTO_DEFAULT_EXTENSION = 'jpg';

export function createPrivatePhotoFileName(recordId: string, sourceUri?: string | null, extension?: string | null): string {
  const safeId = sanitizeFileNameSegment(normalizeText(recordId) ?? fallbackSegment(recordId));
  const inferredExtension = normalizeFileExtension(extension ?? inferFileExtension(sourceUri));
  return `${PRIVATE_PHOTO_FILE_PREFIX}_${safeId}.${inferredExtension}`;
}

export function normalizeFileExtension(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    return PRIVATE_PHOTO_DEFAULT_EXTENSION;
  }

  const withoutDot = normalized.startsWith('.') ? normalized.slice(1) : normalized;
  const sanitized = withoutDot.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return sanitized || PRIVATE_PHOTO_DEFAULT_EXTENSION;
}

export function inferFileExtension(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const withoutQuery = normalized.split(/[?#]/, 1)[0];
  const lastDot = withoutQuery.lastIndexOf('.');
  if (lastDot < 0 || lastDot === withoutQuery.length - 1) {
    return null;
  }

  return withoutQuery.slice(lastDot + 1);
}

export function sanitizeFileNameSegment(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value);
}

export function buildPrivatePhotoRelativePath(fileName: string): string {
  return `${PRIVATE_PHOTO_DIRECTORY_NAME}/${sanitizeFileNameSegment(fileName)}`;
}

function fallbackSegment(value: string): string {
  return createDeterministicChecksum({ value }).replace(/^fnv1a32:/, '');
}
