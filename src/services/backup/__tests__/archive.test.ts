import { describe, expect, it } from '@jest/globals';

import {
  createBackupFileChecksum,
  createBackupManifest,
  legacyExportToLocalDrafts,
  parseLegacyButterflyExport,
  toLegacyButterflyExport,
} from '../../../types/backup';
import { normalizeButterflyRecordInput } from '../../../types/butterflies';
import { packBackupArchive, unpackBackupArchive } from '../archive';

describe('backup archive helpers', () => {
  const records = [
    normalizeButterflyRecordInput({
      id: 'alpha',
      name_cn: '金斑蝶',
      family: '蛱蝶科',
      photo_local_uri: 'file:///private/alpha.jpg',
    }),
  ];

  it('creates a stable manifest checksum', () => {
    const files = [
      {
        record_id: 'alpha',
        archive_path: 'photos/alpha.jpg',
        source_uri: 'file:///private/alpha.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 3,
        checksum: createBackupFileChecksum(
          {
            record_id: 'alpha',
            archive_path: 'photos/alpha.jpg',
            source_uri: 'file:///private/alpha.jpg',
            mime_type: 'image/jpeg',
            size_bytes: 3,
          },
          new Uint8Array([1, 2, 3]),
        ),
      },
    ];

    const manifest = createBackupManifest(records, files, {
      exportedAt: '2024-01-01T00:00:00.000Z',
      appVersion: '1.0.0',
    });

    expect(manifest.record_count).toBe(1);
    expect(manifest.file_count).toBe(1);
    expect(manifest.records[0].photo_file).toBe('photos/alpha.jpg');
  });

  it('packs and unpacks a backup archive', async () => {
    const manifest = createBackupManifest(
      records,
      [
        {
          record_id: 'alpha',
          archive_path: 'photos/alpha.jpg',
          source_uri: 'file:///private/alpha.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 3,
          checksum: 'fnv1a32:00000000',
        },
      ],
      { exportedAt: '2024-01-01T00:00:00.000Z' },
    );

    const archive = await packBackupArchive({
      manifest,
      files: [{ archive_path: 'photos/alpha.jpg', data: new Uint8Array([1, 2, 3]), mime_type: 'image/jpeg' }],
    });
    const unpacked = await unpackBackupArchive(archive);

    expect(unpacked.manifest.checksum).toBe(manifest.checksum);
    expect(unpacked.files).toHaveLength(1);
    expect(Array.from(unpacked.files[0].data)).toEqual([1, 2, 3]);
  });

  it('keeps legacy export compatibility', () => {
    const legacy = toLegacyButterflyExport(records, { exportedAt: '2024-01-01T00:00:00.000Z' });
    const wrapped = parseLegacyButterflyExport({ success: true, data: legacy });
    const drafts = legacyExportToLocalDrafts(wrapped);

    expect(wrapped.total_count).toBe(1);
    expect(drafts[0].photo_local_uri).toBeUndefined();
    expect(drafts[0].photo_remote_url).toBeUndefined();
  });
});
