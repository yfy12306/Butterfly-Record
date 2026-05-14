import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import JSZip from "jszip";

import { createBackupFileChecksum, createBackupManifest } from "@/types/backup";
import { normalizeButterflyRecordInput } from "@/types/butterflies";

const mockArchiveStorage = new Map<string, string>();

jest.mock("expo-constants", () => ({
  expoConfig: {
    version: "1.0.0",
  },
  default: {
    expoConfig: {
      version: "1.0.0",
    },
  },
}));

jest.mock("../files", () => {
  const mockDeleteFileIfExists = jest.fn(async () => true);
  const mockPersistBase64PhotoToSandbox = jest.fn(
    async (_base64: string, extensionHint?: string) => `file:///sandbox/${Date.now()}.${extensionHint ?? "jpg"}`,
  );

  return {
    createExportFileUri: jest.fn(),
    deleteFileIfExists: mockDeleteFileIfExists,
    getFileInfo: jest.fn(),
    persistBase64PhotoToSandbox: mockPersistBase64PhotoToSandbox,
    readFileBase64: jest.fn(async (uri: string) => {
      const contents = mockArchiveStorage.get(uri);
      if (!contents) {
        throw new Error(`Missing mocked file for ${uri}`);
      }
      return contents;
    }),
    writeBase64File: jest.fn(),
    __mockDeleteFileIfExists: mockDeleteFileIfExists,
    __mockPersistBase64PhotoToSandbox: mockPersistBase64PhotoToSandbox,
  };
});

import { importBackupArchive } from "../backup-archive";

const filesMock = jest.requireMock("../files") as {
  __mockDeleteFileIfExists: jest.Mock;
  __mockPersistBase64PhotoToSandbox: jest.Mock;
};
const persistPhotoMock = filesMock.__mockPersistBase64PhotoToSandbox as unknown as {
  mockClear: () => void;
  mockResolvedValueOnce: (value: string) => unknown;
  mockRejectedValueOnce: (reason: Error) => unknown;
};

async function createArchiveBase64({
  manifest,
  records,
  files = [],
}: {
  manifest: ReturnType<typeof createBackupManifest>;
  records: ReturnType<typeof normalizeButterflyRecordInput>[];
  files?: Array<{ path: string; data: Uint8Array }>;
}) {
  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("records.json", JSON.stringify(records, null, 2));

  for (const file of files) {
    zip.file(file.path, file.data);
  }

  return zip.generateAsync({ type: "base64", compression: "DEFLATE" });
}

function createPhotoFileEntry(recordId: string, archivePath: string, bytes: Uint8Array) {
  return {
    record_id: recordId,
    archive_path: archivePath,
    source_uri: `file:///sandbox/${recordId}.jpg`,
    mime_type: "image/jpeg",
    size_bytes: bytes.length,
    checksum: createBackupFileChecksum(
      {
        record_id: recordId,
        archive_path: archivePath,
        source_uri: `file:///sandbox/${recordId}.jpg`,
        mime_type: "image/jpeg",
        size_bytes: bytes.length,
      },
      bytes,
    ),
  };
}

describe("backup archive import", () => {
  beforeEach(() => {
    mockArchiveStorage.clear();
    filesMock.__mockDeleteFileIfExists.mockClear();
    persistPhotoMock.mockClear();
  });

  it("rejects archives that are missing a required photo entry", async () => {
    const record = normalizeButterflyRecordInput({
      id: "alpha",
      name_cn: "Blue morpho",
      photo_local_uri: "file:///sandbox/alpha.jpg",
    });
    const fileBytes = new Uint8Array([1, 2, 3]);
    const manifest = createBackupManifest(
      [record],
      [createPhotoFileEntry(record.id, "photos/alpha.jpg", fileBytes)],
      { exportedAt: "2024-01-01T00:00:00.000Z" },
    );

    mockArchiveStorage.set(
      "file:///backup-missing-photo.zip",
      await createArchiveBase64({
        manifest,
        records: [record],
      }),
    );

    await expect(importBackupArchive("file:///backup-missing-photo.zip")).rejects.toThrow("missing photos/alpha.jpg");
  });

  it("rejects archives with a checksum mismatch", async () => {
    const record = normalizeButterflyRecordInput({
      id: "alpha",
      name_cn: "Blue morpho",
      photo_local_uri: "file:///sandbox/alpha.jpg",
    });
    const manifestBytes = new Uint8Array([1, 2, 3]);
    const archiveBytes = new Uint8Array([9, 9, 9]);
    const manifest = createBackupManifest(
      [record],
      [createPhotoFileEntry(record.id, "photos/alpha.jpg", manifestBytes)],
      { exportedAt: "2024-01-01T00:00:00.000Z" },
    );

    mockArchiveStorage.set(
      "file:///backup-bad-checksum.zip",
      await createArchiveBase64({
        manifest,
        records: [record],
        files: [{ path: "photos/alpha.jpg", data: archiveBytes }],
      }),
    );

    await expect(importBackupArchive("file:///backup-bad-checksum.zip")).rejects.toThrow("checksum mismatch");
  });

  it("rejects archives when records.json and manifest record ids diverge", async () => {
    const alpha = normalizeButterflyRecordInput({
      id: "alpha",
      name_cn: "Alpha",
    });
    const manifest = createBackupManifest([alpha], [], {
      exportedAt: "2024-01-01T00:00:00.000Z",
    });
    const mismatchedRecord = normalizeButterflyRecordInput({
      id: "beta",
      name_cn: "Beta",
    });

    mockArchiveStorage.set(
      "file:///backup-mismatched-records.zip",
      await createArchiveBase64({
        manifest,
        records: [mismatchedRecord],
      }),
    );

    await expect(importBackupArchive("file:///backup-mismatched-records.zip")).rejects.toThrow(
      "do not describe the same record set",
    );
  });

  it("cleans up already-restored photos if a later restore step fails", async () => {
    persistPhotoMock.mockResolvedValueOnce("file:///sandbox/restored-alpha.jpg");
    persistPhotoMock.mockRejectedValueOnce(new Error("disk full"));

    const alpha = normalizeButterflyRecordInput({
      id: "alpha",
      name_cn: "Alpha",
      photo_local_uri: "file:///sandbox/alpha.jpg",
    });
    const beta = normalizeButterflyRecordInput({
      id: "beta",
      name_cn: "Beta",
      photo_local_uri: "file:///sandbox/beta.jpg",
    });
    const alphaBytes = new Uint8Array([1, 2, 3]);
    const betaBytes = new Uint8Array([4, 5, 6]);
    const manifest = createBackupManifest(
      [alpha, beta],
      [
        createPhotoFileEntry(alpha.id, "photos/alpha.jpg", alphaBytes),
        createPhotoFileEntry(beta.id, "photos/beta.jpg", betaBytes),
      ],
      { exportedAt: "2024-01-01T00:00:00.000Z" },
    );

    mockArchiveStorage.set(
      "file:///backup-partial-failure.zip",
      await createArchiveBase64({
        manifest,
        records: [alpha, beta],
        files: [
          { path: "photos/alpha.jpg", data: alphaBytes },
          { path: "photos/beta.jpg", data: betaBytes },
        ],
      }),
    );

    await expect(importBackupArchive("file:///backup-partial-failure.zip")).rejects.toThrow("disk full");
    expect(filesMock.__mockDeleteFileIfExists).toHaveBeenCalledWith("file:///sandbox/restored-alpha.jpg");
  });
});
