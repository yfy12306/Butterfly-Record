import {
  type ButterflyRecordInput,
  type ButterflyRecordLocal,
  type LegacyButterflyExport,
  type LegacyButterflyRecord,
} from './butterflies';
import { createDeterministicChecksum, isHttpUrl, normalizeIsoDate, normalizeText } from './shared';

export interface BackupFileEntry {
  record_id: string;
  archive_path: string;
  source_uri: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
}

export interface BackupManifestRecord {
  id: string;
  name_cn: string;
  created_at: string;
  updated_at: string;
  photo_file: string | null;
  photo_remote_url: string | null;
}

export interface BackupManifestV2 {
  format: 'butterfly-collection-backup';
  version: 'backup_v2';
  schema_version: number;
  exported_at: string;
  app_version: string | null;
  record_count: number;
  file_count: number;
  checksum: string;
  records: BackupManifestRecord[];
  files: BackupFileEntry[];
}

export interface BackupArchiveInput {
  manifest: BackupManifestV2;
  files: Array<{
    archive_path: string;
    data: Uint8Array;
    mime_type?: string | null;
  }>;
}

export function createBackupManifest(
  records: ButterflyRecordLocal[],
  files: BackupFileEntry[],
  options?: { exportedAt?: string | Date; appVersion?: string | null; schemaVersion?: number },
): BackupManifestV2 {
  const exportedAt = normalizeIsoDate(options?.exportedAt) ?? new Date().toISOString();
  const sortedFiles = files.slice().sort((left, right) => left.archive_path.localeCompare(right.archive_path));
  const manifestRecords = records.map((record) => ({
    id: record.id,
    name_cn: record.name_cn,
    created_at: record.created_at,
    updated_at: record.updated_at,
    photo_file: sortedFiles.find((entry) => entry.record_id === record.id)?.archive_path ?? null,
    photo_remote_url: normalizeText(record.photo_remote_url),
  }));

  const manifest: BackupManifestV2 = {
    format: 'butterfly-collection-backup',
    version: 'backup_v2',
    schema_version: options?.schemaVersion ?? 1,
    exported_at: exportedAt,
    app_version: normalizeText(options?.appVersion ?? null),
    record_count: records.length,
    file_count: files.length,
    checksum: createDeterministicChecksum({
      records: manifestRecords,
      files: sortedFiles,
      exported_at: exportedAt,
      schema_version: options?.schemaVersion ?? 1,
    }),
    records: manifestRecords,
    files: sortedFiles,
  };

  return manifest;
}

export function validateBackupManifest(value: unknown): BackupManifestV2 {
  const manifest = value as BackupManifestV2;

  if (!manifest || manifest.format !== 'butterfly-collection-backup' || manifest.version !== 'backup_v2') {
    throw new Error('Invalid backup manifest');
  }

  if (!Array.isArray(manifest.records) || !Array.isArray(manifest.files)) {
    throw new Error('Invalid backup manifest');
  }

  if (manifest.record_count !== manifest.records.length || manifest.file_count !== manifest.files.length) {
    throw new Error('Backup manifest count mismatch');
  }

  const expectedChecksum = createDeterministicChecksum({
    records: manifest.records,
    files: manifest.files,
    exported_at: manifest.exported_at,
    schema_version: manifest.schema_version,
  });

  if (manifest.checksum !== expectedChecksum) {
    throw new Error('Backup manifest checksum mismatch');
  }

  return manifest;
}

export function toLegacyButterflyExport(
  records: ButterflyRecordLocal[],
  options?: { exportedAt?: string | Date },
): LegacyButterflyExport {
  const exportedAt = normalizeIsoDate(options?.exportedAt) ?? new Date().toISOString();
  return {
    version: '1.0',
    exported_at: exportedAt,
    total_count: records.length,
    butterflies: records.map(toLegacyButterflyRecord),
  };
}

export function parseLegacyButterflyExport(input: string | LegacyButterflyExport | { success?: boolean; data?: unknown }): LegacyButterflyExport {
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  const candidate = unwrapLegacyPayload(raw);

  if (!candidate || !Array.isArray(candidate.butterflies)) {
    throw new Error('Invalid legacy export payload');
  }

  return {
    version: String(candidate.version ?? '1.0'),
    exported_at: normalizeIsoDate(candidate.exported_at) ?? new Date().toISOString(),
    total_count: Number.isFinite(Number(candidate.total_count))
      ? Number(candidate.total_count)
      : candidate.butterflies.length,
    butterflies: (candidate.butterflies as LegacyButterflyRecord[]).map(normalizeLegacyButterflyRecord),
  };
}

export function legacyExportToLocalDrafts(exportData: LegacyButterflyExport): ButterflyRecordInput[] {
  return exportData.butterflies.map((record) => {
    const localRecord: ButterflyRecordInput = {
      name_cn: record.name_cn,
      name_en: normalizeText(record.name_en) ?? undefined,
      latin_name: normalizeText(record.latin_name) ?? undefined,
      family: normalizeText(record.family) ?? undefined,
      subfamily: normalizeText(record.subfamily) ?? undefined,
      genus: normalizeText(record.genus) ?? undefined,
      distribution: normalizeText(record.distribution) ?? undefined,
      habitat: normalizeText(record.habitat) ?? undefined,
      wingspan: normalizeText(record.wingspan) ?? undefined,
      description: normalizeText(record.description) ?? undefined,
      location: normalizeText(record.location) ?? undefined,
      collected_at: normalizeIsoDate(record.collected_at) ?? undefined,
      ai_confidence: normalizeText(record.ai_confidence) ?? undefined,
      notes: normalizeText(record.notes) ?? undefined,
    };

    if (isHttpUrl(record.photo_url)) {
      localRecord.photo_remote_url = normalizeText(record.photo_url) ?? undefined;
    }

    return localRecord;
  });
}

export function toLegacyButterflyRecord(record: ButterflyRecordLocal): LegacyButterflyRecord {
  return {
    name_cn: record.name_cn,
    name_en: normalizeText(record.name_en) ?? undefined,
    latin_name: normalizeText(record.latin_name) ?? undefined,
    family: normalizeText(record.family) ?? undefined,
    subfamily: normalizeText(record.subfamily) ?? undefined,
    genus: normalizeText(record.genus) ?? undefined,
    distribution: normalizeText(record.distribution) ?? undefined,
    habitat: normalizeText(record.habitat) ?? undefined,
    wingspan: normalizeText(record.wingspan) ?? undefined,
    description: normalizeText(record.description) ?? undefined,
    location: normalizeText(record.location) ?? undefined,
    collected_at: normalizeIsoDate(record.collected_at) ?? undefined,
    photo_url: normalizeText(record.photo_remote_url ?? record.photo_local_uri) ?? undefined,
    ai_confidence: normalizeText(record.ai_confidence) ?? undefined,
    notes: normalizeText(record.notes) ?? undefined,
  };
}

export function buildBackupArchivePath(record: ButterflyRecordLocal, fileExtension = 'jpg'): string {
  const safeExtension = fileExtension.startsWith('.') ? fileExtension.slice(1) : fileExtension;
  return `photos/${record.id}.${safeExtension.toLowerCase() || 'jpg'}`;
}

export function normalizeBackupFileEntry(entry: BackupFileEntry): BackupFileEntry {
  return {
    record_id: normalizeText(entry.record_id) ?? '',
    archive_path: normalizeText(entry.archive_path) ?? '',
    source_uri: normalizeText(entry.source_uri) ?? null,
    mime_type: normalizeText(entry.mime_type) ?? null,
    size_bytes: Number.isFinite(entry.size_bytes ?? NaN) ? Number(entry.size_bytes) : null,
    checksum: normalizeText(entry.checksum) ?? null,
  };
}

export function createBackupFileChecksum(entry: Omit<BackupFileEntry, 'checksum'>, data: Uint8Array): string {
  return createDeterministicChecksum({
    entry,
    bytes: Array.from(data),
  });
}

function unwrapLegacyPayload(value: unknown): LegacyButterflyExport | { butterflies: unknown[]; version?: string; exported_at?: string; total_count?: number } {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid legacy export payload');
  }

  const candidate = value as { success?: boolean; data?: unknown; butterflies?: unknown[] };
  if (candidate.success && candidate.data && typeof candidate.data === 'object') {
    return candidate.data as LegacyButterflyExport;
  }

  return value as LegacyButterflyExport;
}

function normalizeLegacyButterflyRecord(record: LegacyButterflyRecord): LegacyButterflyRecord {
  return {
    name_cn: normalizeText(record.name_cn) ?? '',
    name_en: normalizeText(record.name_en) ?? undefined,
    latin_name: normalizeText(record.latin_name) ?? undefined,
    family: normalizeText(record.family) ?? undefined,
    subfamily: normalizeText(record.subfamily) ?? undefined,
    genus: normalizeText(record.genus) ?? undefined,
    distribution: normalizeText(record.distribution) ?? undefined,
    habitat: normalizeText(record.habitat) ?? undefined,
    wingspan: normalizeText(record.wingspan) ?? undefined,
    description: normalizeText(record.description) ?? undefined,
    location: normalizeText(record.location) ?? undefined,
    collected_at: normalizeIsoDate(record.collected_at) ?? undefined,
    photo_url: normalizeText(record.photo_url) ?? undefined,
    ai_confidence: normalizeText(record.ai_confidence) ?? undefined,
    notes: normalizeText(record.notes) ?? undefined,
  };
}
