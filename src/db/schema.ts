import type { ButterflyAiDetails, ButterflyRecordInput, ButterflyRecordLocal } from '../types/butterflies';
import { normalizeIsoDate, normalizeText } from '../types/shared';

export interface ButterflyDatabaseRow {
  id: string;
  name_cn: string;
  name_en: string | null;
  latin_name: string | null;
  family: string | null;
  subfamily: string | null;
  genus: string | null;
  distribution: string | null;
  habitat: string | null;
  wingspan: string | null;
  description: string | null;
  location: string | null;
  latitude: string | null;
  longitude: string | null;
  collected_at: string | null;
  photo_local_uri: string | null;
  photo_remote_url: string | null;
  ai_confidence: string | null;
  ai_details_json: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

export const BUTTERFLY_TABLE_NAME = 'butterflies';
export const BUTTERFLY_DATABASE_VERSION = 1;
export const DEFAULT_BUTTERFLY_DATABASE_NAME = 'butterflies.db';

export const CREATE_BUTTERFLY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS butterflies (
  id TEXT PRIMARY KEY NOT NULL,
  name_cn TEXT NOT NULL,
  name_en TEXT,
  latin_name TEXT,
  family TEXT,
  subfamily TEXT,
  genus TEXT,
  distribution TEXT,
  habitat TEXT,
  wingspan TEXT,
  description TEXT,
  location TEXT,
  latitude TEXT,
  longitude TEXT,
  collected_at TEXT,
  photo_local_uri TEXT,
  photo_remote_url TEXT,
  ai_confidence TEXT,
  ai_details_json TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'local-only'
);

CREATE INDEX IF NOT EXISTS idx_butterflies_name_cn ON butterflies(name_cn);
CREATE INDEX IF NOT EXISTS idx_butterflies_family ON butterflies(family);
CREATE INDEX IF NOT EXISTS idx_butterflies_genus ON butterflies(genus);
CREATE INDEX IF NOT EXISTS idx_butterflies_updated_at ON butterflies(updated_at);
`;

export function normalizeDatabaseRow(row: Partial<ButterflyDatabaseRow>): ButterflyDatabaseRow {
  return {
    id: row.id?.trim() ?? '',
    name_cn: row.name_cn?.trim() ?? '',
    name_en: normalizeText(row.name_en) ?? null,
    latin_name: normalizeText(row.latin_name) ?? null,
    family: normalizeText(row.family) ?? null,
    subfamily: normalizeText(row.subfamily) ?? null,
    genus: normalizeText(row.genus) ?? null,
    distribution: normalizeText(row.distribution) ?? null,
    habitat: normalizeText(row.habitat) ?? null,
    wingspan: normalizeText(row.wingspan) ?? null,
    description: normalizeText(row.description) ?? null,
    location: normalizeText(row.location) ?? null,
    latitude: normalizeText(row.latitude) ?? null,
    longitude: normalizeText(row.longitude) ?? null,
    collected_at: normalizeIsoDate(row.collected_at) ?? null,
    photo_local_uri: normalizeText(row.photo_local_uri) ?? null,
    photo_remote_url: normalizeText(row.photo_remote_url) ?? null,
    ai_confidence: normalizeText(row.ai_confidence) ?? null,
    ai_details_json: normalizeJson(row.ai_details_json),
    notes: normalizeText(row.notes) ?? null,
    created_at: normalizeIsoDate(row.created_at) ?? new Date().toISOString(),
    updated_at: normalizeIsoDate(row.updated_at) ?? new Date().toISOString(),
    sync_status: normalizeText(row.sync_status) ?? 'local-only',
  };
}

export function butterflyInputToDbRow(record: ButterflyRecordInput & { id: string; created_at: string; updated_at: string }): ButterflyDatabaseRow {
  return {
    id: record.id,
    name_cn: record.name_cn.trim(),
    name_en: normalizeText(record.name_en) ?? null,
    latin_name: normalizeText(record.latin_name) ?? null,
    family: normalizeText(record.family) ?? null,
    subfamily: normalizeText(record.subfamily) ?? null,
    genus: normalizeText(record.genus) ?? null,
    distribution: normalizeText(record.distribution) ?? null,
    habitat: normalizeText(record.habitat) ?? null,
    wingspan: normalizeText(record.wingspan) ?? null,
    description: normalizeText(record.description) ?? null,
    location: normalizeText(record.location) ?? null,
    latitude: normalizeText(record.latitude) ?? null,
    longitude: normalizeText(record.longitude) ?? null,
    collected_at: normalizeIsoDate(record.collected_at) ?? record.created_at,
    photo_local_uri: normalizeText(record.photo_local_uri) ?? null,
    photo_remote_url: normalizeText(record.photo_remote_url) ?? null,
    ai_confidence: normalizeText(record.ai_confidence) ?? null,
    ai_details_json: normalizeJson(record.ai_details_json),
    notes: normalizeText(record.notes) ?? null,
    created_at: record.created_at,
    updated_at: record.updated_at,
    sync_status: 'local-only',
  };
}

export function butterflyRecordToDbRow(record: ButterflyRecordLocal): ButterflyDatabaseRow {
  return {
    id: record.id,
    name_cn: record.name_cn.trim(),
    name_en: normalizeText(record.name_en) ?? null,
    latin_name: normalizeText(record.latin_name) ?? null,
    family: normalizeText(record.family) ?? null,
    subfamily: normalizeText(record.subfamily) ?? null,
    genus: normalizeText(record.genus) ?? null,
    distribution: normalizeText(record.distribution) ?? null,
    habitat: normalizeText(record.habitat) ?? null,
    wingspan: normalizeText(record.wingspan) ?? null,
    description: normalizeText(record.description) ?? null,
    location: normalizeText(record.location) ?? null,
    latitude: normalizeText(record.latitude) ?? null,
    longitude: normalizeText(record.longitude) ?? null,
    collected_at: normalizeIsoDate(record.collected_at),
    photo_local_uri: normalizeText(record.photo_local_uri) ?? null,
    photo_remote_url: normalizeText(record.photo_remote_url) ?? null,
    ai_confidence: normalizeText(record.ai_confidence) ?? null,
    ai_details_json: normalizeJson(record.ai_details_json),
    notes: normalizeText(record.notes) ?? null,
    created_at: normalizeIsoDate(record.created_at) ?? new Date().toISOString(),
    updated_at: normalizeIsoDate(record.updated_at) ?? new Date().toISOString(),
    sync_status: normalizeText(record.sync_status) ?? 'local-only',
  };
}

export function dbRowToButterflyRecord(row: ButterflyDatabaseRow): ButterflyRecordLocal {
  return {
    id: row.id,
    name_cn: row.name_cn,
    name_en: row.name_en,
    latin_name: row.latin_name,
    family: row.family,
    subfamily: row.subfamily,
    genus: row.genus,
    distribution: row.distribution,
    habitat: row.habitat,
    wingspan: row.wingspan,
    description: row.description,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    collected_at: row.collected_at,
    photo_local_uri: row.photo_local_uri,
    photo_remote_url: row.photo_remote_url,
    ai_confidence: row.ai_confidence,
    ai_details_json: parseJson(row.ai_details_json),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sync_status: row.sync_status as ButterflyRecordLocal['sync_status'],
  };
}

export function dbRowsToButterflyRecords(rows: ButterflyDatabaseRow[]): ButterflyRecordLocal[] {
  return rows.map(dbRowToButterflyRecord);
}

function normalizeJson(value: string | ButterflyAiDetails | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    return trimmed;
  }

  return JSON.stringify(value);
}

function parseJson(value: string | null): ButterflyAiDetails | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as ButterflyAiDetails;
  } catch {
    return null;
  }
}
