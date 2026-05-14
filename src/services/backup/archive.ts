import JSZip = require('jszip');

import {
  createBackupManifest,
  validateBackupManifest,
  type BackupArchiveInput,
  type BackupManifestV2,
} from '../../types/backup';
import { normalizeText } from '../../types/shared';

export interface ReadBackupArchiveResult {
  manifest: BackupManifestV2;
  files: Array<{
    archive_path: string;
    data: Uint8Array;
    mime_type: string | null;
  }>;
}

export interface BackupArchivePlan {
  manifest: BackupManifestV2;
  files: BackupArchiveInput['files'];
}

export function createBackupArchivePlan(input: BackupArchiveInput): BackupArchivePlan {
  return {
    manifest: input.manifest,
    files: input.files
      .slice()
      .sort((left, right) => left.archive_path.localeCompare(right.archive_path))
      .map((file) => ({
      archive_path: normalizeArchivePath(file.archive_path),
      data: file.data,
      mime_type: file.mime_type ?? null,
      })),
  };
}

export async function packBackupArchive(input: BackupArchiveInput): Promise<Uint8Array> {
  const plan = createBackupArchivePlan(input);
  const manifest = validateBackupManifest(plan.manifest);
  const zip = new JSZip();

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('records.json', JSON.stringify(manifest.records, null, 2));

  for (const file of plan.files) {
    zip.file(file.archive_path, file.data, {
      binary: true,
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
  }

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}

export async function unpackBackupArchive(data: Uint8Array | ArrayBuffer | string): Promise<ReadBackupArchiveResult> {
  const zip = await JSZip.loadAsync(data);
  const manifestFile = zip.file('manifest.json');

  if (!manifestFile) {
    throw new Error('Backup archive is missing manifest.json');
  }

  const manifest = validateBackupManifest(JSON.parse(await manifestFile.async('string')));
  const files: ReadBackupArchiveResult['files'] = [];

  for (const entry of manifest.files) {
    const archivePath = normalizeArchivePath(entry.archive_path);
    const file = zip.file(archivePath);
    if (!file) {
      throw new Error(`Backup archive is missing file: ${archivePath}`);
    }

    files.push({
      archive_path: archivePath,
      data: await file.async('uint8array'),
      mime_type: normalizeText(entry.mime_type) ?? null,
    });
  }

  return {
    manifest,
    files,
  };
}

export function createBackupArchiveManifest(
  records: Parameters<typeof createBackupManifest>[0],
  files: Parameters<typeof createBackupManifest>[1],
  options?: Parameters<typeof createBackupManifest>[2],
): BackupManifestV2 {
  return createBackupManifest(records, files, options);
}

export function normalizeArchivePath(path: string): string {
  const normalized = normalizeText(path);
  if (!normalized) {
    throw new Error('Backup archive path is required');
  }

  const safePath = normalized.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!safePath || safePath.includes('..')) {
    throw new Error('Backup archive path is invalid');
  }

  return safePath;
}
