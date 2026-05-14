import { describe, expect, it } from '@jest/globals';

import {
  buildButterflyTaxonomyTree,
  getButterflyStatistics,
  groupButterfliesByNameCn,
  normalizeButterflyRecordInput,
} from '../butterflies';

describe('butterfly helpers', () => {
  const records = [
    normalizeButterflyRecordInput({
      id: 'a',
      name_cn: '  金斑蝶  ',
      family: '蛱蝶科',
      genus: 'Danaus',
      photo_remote_url: 'https://example.com/a.jpg',
      ai_details_json: { score: 0.92 },
    }),
    normalizeButterflyRecordInput({
      id: 'b',
      name_cn: '金斑蝶',
      family: '蛱蝶科',
      genus: 'Danaus',
      photo_local_uri: 'file:///data/user/0/app/b.jpg',
    }),
    normalizeButterflyRecordInput({
      id: 'c',
      name_cn: '凤蝶',
      family: '凤蝶科',
      genus: 'Papilio',
    }),
  ];

  it('groups records by name', () => {
    const groups = groupButterfliesByNameCn(records);
    expect(groups).toHaveLength(2);
    expect(groups[0].name_cn).toBe('凤蝶');
    expect(groups[1].name_cn).toBe('金斑蝶');
    expect(groups[1].count).toBe(2);
  });

  it('builds taxonomy and statistics', () => {
    const taxonomy = buildButterflyTaxonomyTree(records);
    const stats = getButterflyStatistics(records);

    expect(taxonomy.count).toBe(3);
    expect(taxonomy.family_count).toBe(2);
    expect(taxonomy.genus_count).toBe(2);
    expect(taxonomy.species_count).toBe(2);
    expect(taxonomy.families[0].name).toBe('凤蝶科');
    expect(stats.record_count).toBe(3);
    expect(stats.family_count).toBe(2);
    expect(stats.genus_count).toBe(2);
    expect(stats.species_count).toBe(2);
    expect(stats.photo_count).toBe(2);
  });

  it('normalizes input text and timestamps', () => {
    const record = normalizeButterflyRecordInput({
      name_cn: '  黑脉金斑蝶  ',
      name_en: ' Danaus chrysippus ',
      family: '  ',
      photo_remote_url: ' https://example.com/photo.jpg ',
    });

    expect(record.name_cn).toBe('黑脉金斑蝶');
    expect(record.name_en).toBe('Danaus chrysippus');
    expect(record.family).toBeNull();
    expect(record.photo_remote_url).toBe('https://example.com/photo.jpg');
    expect(record.created_at).toBe(record.updated_at);
  });
});
