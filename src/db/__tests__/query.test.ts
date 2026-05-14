import { describe, expect, it } from '@jest/globals';

import { buildButterflySelectQuery, escapeLikePattern } from '../query';

describe('butterfly query helpers', () => {
  it('escapes sqlite like wildcards', () => {
    expect(escapeLikePattern('a_b%c\\d')).toBe('a\\_b\\%c\\\\d');
  });

  it('builds a search query with pagination', () => {
    const { sql, params } = buildButterflySelectQuery({
      family: '蛱蝶科',
      search: '金斑',
      offset: 10,
    });

    expect(sql).toContain('WHERE family = $family');
    expect(sql).toContain('LIMIT -1 OFFSET $offset');
    expect(params.$family).toBe('蛱蝶科');
    expect(params.$search).toBe('%金斑%');
    expect(params.$offset).toBe(10);
  });
});
