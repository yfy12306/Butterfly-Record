import { normalizeText } from '../types/shared';

export interface ButterflySelectFilters {
  search?: string | null;
  family?: string | null;
  genus?: string | null;
  limit?: number;
  offset?: number;
}

export function buildButterflySelectQuery(filters: ButterflySelectFilters): { sql: string; params: Record<string, string | number> } {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};

  if (filters.family) {
    clauses.push('family = $family');
    params.$family = normalizeText(filters.family) ?? '';
  }

  if (filters.genus) {
    clauses.push('genus = $genus');
    params.$genus = normalizeText(filters.genus) ?? '';
  }

  if (filters.search) {
    const searchValue = normalizeText(filters.search);
    if (searchValue) {
      const search = escapeLikePattern(searchValue);
      clauses.push(`(
        name_cn LIKE $search ESCAPE '\\' OR
        name_en LIKE $search ESCAPE '\\' OR
        latin_name LIKE $search ESCAPE '\\' OR
        family LIKE $search ESCAPE '\\' OR
        genus LIKE $search ESCAPE '\\'
      )`);
      params.$search = `%${search}%`;
    }
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const hasLimit = Number.isFinite(filters.limit);
  const hasOffset = Number.isFinite(filters.offset);

  if (hasLimit) {
    params.$limit = Math.max(0, Math.floor(filters.limit ?? 0));
  }

  if (hasOffset) {
    params.$offset = Math.max(0, Math.floor(filters.offset ?? 0));
  }

  const paginationClause = hasLimit
    ? `LIMIT $limit${hasOffset ? ' OFFSET $offset' : ''}`
    : hasOffset
      ? 'LIMIT -1 OFFSET $offset'
      : '';

  return {
    sql: `
      SELECT *
      FROM butterflies
      ${whereClause}
      ORDER BY updated_at DESC, created_at DESC
      ${paginationClause}
    `,
    params,
  };
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
