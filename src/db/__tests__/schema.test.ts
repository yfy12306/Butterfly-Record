import { describe, expect, it } from '@jest/globals';

import { dbRowToButterflyRecord, butterflyRecordToDbRow, normalizeDatabaseRow } from '../schema';
import { normalizeButterflyRecordInput } from '../../types/butterflies';

describe('butterfly schema mapping', () => {
  it('round-trips ai details and optional fields', () => {
    const record = normalizeButterflyRecordInput({
      id: 'record-1',
      name_cn: '玉带凤蝶',
      family: '凤蝶科',
      ai_details_json: { nested: { confidence: 0.81 } },
      photo_remote_url: 'https://example.com/photo.jpg',
    });

    const dbRow = butterflyRecordToDbRow(record);
    const roundTrip = dbRowToButterflyRecord(dbRow);

    expect(roundTrip.id).toBe('record-1');
    expect(roundTrip.name_cn).toBe('玉带凤蝶');
    expect(roundTrip.ai_details_json).toEqual({ nested: { confidence: 0.81 } });
    expect(roundTrip.photo_remote_url).toBe('https://example.com/photo.jpg');
  });

  it('normalizes partially populated rows', () => {
    const row = normalizeDatabaseRow({
      id: 'abc',
      name_cn: '  斑蝶  ',
      name_en: '  Common Tiger  ',
      sync_status: ' synced ',
    });

    expect(row.name_cn).toBe('斑蝶');
    expect(row.name_en).toBe('Common Tiger');
    expect(row.sync_status).toBe('synced');
  });
});
