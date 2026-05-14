import Constants from "expo-constants";
import JSZip from "jszip";

import type { ButterflyRecordLocal } from "@/types";
import {
  buildBackupArchivePath,
  createBackupFileChecksum,
  createBackupManifest,
  validateBackupManifest,
  type BackupFileEntry,
  type BackupManifestV2,
} from "@/types/backup";
import {
  createExportFileUri,
  deleteFileIfExists,
  getFileInfo,
  persistBase64PhotoToSandbox,
  readFileBase64,
  writeBase64File,
} from "./files";

type ExportBackupResult = {
  uri: string;
  manifest: BackupManifestV2;
};

type ImportBackupResult = {
  manifest: BackupManifestV2;
  records: ButterflyRecordLocal[];
};

function inferExtensionFromArchivePath(archivePath: string) {
  return archivePath.split(".").pop()?.toLowerCase() || "jpg";
}

function createFileEntry(record: ButterflyRecordLocal, archivePath: string, base64: string, sizeBytes: number | null): BackupFileEntry {
  const unsigned = {
    record_id: record.id,
    archive_path: archivePath,
    source_uri: record.photo_local_uri ?? null,
    mime_type: null,
    size_bytes: sizeBytes,
  };

  return {
    ...unsigned,
    checksum: createBackupFileChecksum(unsigned, new TextEncoder().encode(base64)),
  };
}

function stripChecksum(entry: BackupFileEntry): Omit<BackupFileEntry, "checksum"> {
  return {
    record_id: entry.record_id,
    archive_path: entry.archive_path,
    source_uri: entry.source_uri,
    mime_type: entry.mime_type,
    size_bytes: entry.size_bytes,
  };
}

function assertMatchingRecordSets(manifest: BackupManifestV2, records: ButterflyRecordLocal[]) {
  const manifestIds = manifest.records.map((record) => record.id);
  const recordIds = records.map((record) => record.id);

  if (new Set(manifestIds).size !== manifestIds.length) {
    throw new Error("Backup manifest contains duplicate record ids.");
  }

  if (new Set(recordIds).size !== recordIds.length) {
    throw new Error("Backup records.json contains duplicate record ids.");
  }

  const manifestIdSet = new Set(manifestIds);
  const recordIdSet = new Set(recordIds);
  if (manifestIdSet.size !== recordIdSet.size) {
    throw new Error("Backup manifest and records.json do not describe the same record set.");
  }

  for (const recordId of recordIdSet) {
    if (!manifestIdSet.has(recordId)) {
      throw new Error("Backup manifest and records.json do not describe the same record set.");
    }
  }
}

export async function exportBackupArchive(records: ButterflyRecordLocal[]): Promise<ExportBackupResult> {
  const zip = new JSZip();
  const fileEntries: BackupFileEntry[] = [];

  for (const record of records) {
    if (!record.photo_local_uri) {
      continue;
    }

    const base64 = await readFileBase64(record.photo_local_uri);
    const archivePath = buildBackupArchivePath(record, inferExtensionFromArchivePath(record.photo_local_uri));
    const fileInfo = await getFileInfo(record.photo_local_uri);
    const sizeBytes = "size" in fileInfo && typeof fileInfo.size === "number" ? fileInfo.size : null;
    fileEntries.push(createFileEntry(record, archivePath, base64, sizeBytes));
    zip.file(archivePath, base64, { base64: true });
  }

  const manifest = createBackupManifest(records, fileEntries, {
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? null,
  });

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("records.json", JSON.stringify(records, null, 2));

  const archiveBase64 = await zip.generateAsync({ type: "base64", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const fileUri = await createExportFileUri(`butterfly-backup-${new Date().toISOString().slice(0, 10)}.zip`);
  await writeBase64File(fileUri, archiveBase64);

  return {
    uri: fileUri,
    manifest,
  };
}

export async function importBackupArchive(zipUri: string): Promise<ImportBackupResult> {
  const zipBase64 = await readFileBase64(zipUri);
  const zip = await JSZip.loadAsync(zipBase64, { base64: true });

  const manifestText = await zip.file("manifest.json")?.async("string");
  if (!manifestText) {
    throw new Error("Backup archive is missing manifest.json.");
  }

  const recordsText = await zip.file("records.json")?.async("string");
  if (!recordsText) {
    throw new Error("Backup archive is missing records.json.");
  }

  const manifest = validateBackupManifest(JSON.parse(manifestText));
  const records = JSON.parse(recordsText) as ButterflyRecordLocal[];
  if (records.length !== manifest.record_count) {
    throw new Error("Backup records.json count does not match the manifest.");
  }
  assertMatchingRecordSets(manifest, records);

  const manifestRecords = new Map(manifest.records.map((record) => [record.id, record]));
  const fileEntries = new Map(manifest.files.map((entry) => [entry.record_id, entry]));
  const restoredPhotoUris: string[] = [];

  try {
    const restoredRecords = await Promise.all(
      records.map(async (record) => {
        const manifestRecord = manifestRecords.get(record.id);
        if (!manifestRecord) {
          throw new Error(`Backup manifest is missing record ${record.id}.`);
        }

        const fileEntry = fileEntries.get(record.id);
        if (!manifestRecord.photo_file) {
          return {
            ...record,
            photo_local_uri: null,
          };
        }

        if (!fileEntry || fileEntry.archive_path !== manifestRecord.photo_file) {
          throw new Error(`Backup manifest is missing photo metadata for record ${record.id}.`);
        }

        const zipEntry = zip.file(fileEntry.archive_path);
        if (!zipEntry) {
          throw new Error(`Backup archive is missing ${fileEntry.archive_path}.`);
        }

        const fileBytes = await zipEntry.async("uint8array");
        const expectedChecksum = fileEntry.checksum;
        if (expectedChecksum) {
          const actualChecksum = createBackupFileChecksum(stripChecksum(fileEntry), fileBytes);
          if (actualChecksum !== expectedChecksum) {
            throw new Error(`Backup photo checksum mismatch for ${fileEntry.archive_path}.`);
          }
        }

        const fileBase64 = await zipEntry.async("base64");
        const restoredUri = await persistBase64PhotoToSandbox(fileBase64, inferExtensionFromArchivePath(fileEntry.archive_path));
        restoredPhotoUris.push(restoredUri);

        return {
          ...record,
          photo_local_uri: restoredUri,
        };
      }),
    );

    return {
      manifest,
      records: restoredRecords,
    };
  } catch (error) {
    await Promise.allSettled(restoredPhotoUris.map((uri) => deleteFileIfExists(uri)));
    throw error;
  }
}
