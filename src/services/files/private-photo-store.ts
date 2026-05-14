import { Directory, File, Paths } from 'expo-file-system';

import { createDeterministicChecksum, normalizeText } from '../../types/shared';
import {
  buildPrivatePhotoRelativePath,
  createPrivatePhotoFileName,
  inferFileExtension,
  isHttpUrl,
  PRIVATE_PHOTO_DIRECTORY_NAME,
  PRIVATE_PHOTO_DEFAULT_EXTENSION,
} from './photo-paths';

export interface PrivatePhotoCopyOptions {
  rootDirectory?: Directory | string;
  recordId?: string;
  fileName?: string;
  overwrite?: boolean;
}

export interface PrivatePhotoCopyResult {
  fileName: string;
  uri: string;
  directoryUri: string;
}

export function resolvePrivatePhotoDirectory(rootDirectory: Directory | string = Paths.document): Directory {
  const directory = new Directory(rootDirectory, PRIVATE_PHOTO_DIRECTORY_NAME);
  directory.create({ intermediates: true, idempotent: true });
  return directory;
}

export function buildPrivatePhotoUri(fileName: string, rootDirectory: Directory | string = Paths.document): string {
  return new File(resolvePrivatePhotoDirectory(rootDirectory), fileName).uri;
}

export async function copyPhotoToPrivateStorage(sourceUri: string, options: PrivatePhotoCopyOptions = {}): Promise<PrivatePhotoCopyResult> {
  const directory = resolvePrivatePhotoDirectory(options.rootDirectory ?? Paths.document);
  const fileName = options.fileName ?? createPrivatePhotoFileName(
    options.recordId ?? createDeterministicChecksum({ sourceUri, at: Date.now() }),
    sourceUri,
  );
  const target = new File(directory, fileName);

  if (target.exists) {
    if (options.overwrite === false) {
      throw new Error(`Private photo already exists: ${fileName}`);
    }
    target.delete();
  }

  if (isHttpUrl(sourceUri)) {
    await File.downloadFileAsync(sourceUri, target, { idempotent: true });
  } else {
    const source = new File(sourceUri);
    source.copy(target);
  }

  return {
    fileName,
    uri: target.uri,
    directoryUri: directory.uri,
  };
}

export async function downloadPhotoToPrivateStorage(
  remoteUrl: string,
  options: PrivatePhotoCopyOptions = {},
): Promise<PrivatePhotoCopyResult> {
  return copyPhotoToPrivateStorage(remoteUrl, options);
}

export async function deletePrivatePhotoFile(photoUri: string | null | undefined): Promise<boolean> {
  const normalized = normalizeText(photoUri);
  if (!normalized) {
    return false;
  }

  try {
    const file = new File(normalized);
    if (!file.exists) {
      return false;
    }

    file.delete();
    return true;
  } catch {
    return false;
  }
}

export async function readPrivatePhotoBytes(photoUri: string): Promise<Uint8Array> {
  const file = new File(photoUri);
  return file.bytes();
}

export function ensurePrivatePhotoFileName(recordId: string, sourceUri?: string | null): string {
  return createPrivatePhotoFileName(recordId, sourceUri, inferFileExtension(sourceUri) ?? PRIVATE_PHOTO_DEFAULT_EXTENSION);
}

export function getBackupArchivePathForPhoto(recordId: string, sourceUri?: string | null): string {
  return buildPrivatePhotoRelativePath(ensurePrivatePhotoFileName(recordId, sourceUri));
}
