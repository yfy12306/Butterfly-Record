import { createId } from '../lib/id';

import {
  buildButterflyTaxonomyTree,
  getButterflyStatistics,
  groupButterfliesByNameCn,
  normalizeButterflyPatch,
  normalizeButterflyRecordInput,
  type ButterflyGroupSummary,
  type ButterflyListFilters,
  type ButterflyRecordInput,
  type ButterflyRecordLocal,
  type ButterflyRecordPatch,
  type ButterflyStatistics,
  type ButterflyTaxonomyTree,
  type LegacyButterflyExport,
} from '../types/butterflies';
import { legacyExportToLocalDrafts, parseLegacyButterflyExport } from '../types/backup';
import { normalizeIsoDate, normalizeText } from '../types/shared';
import { buildButterflySelectQuery } from './query';
import {
  butterflyRecordToDbRow,
  dbRowToButterflyRecord,
  dbRowsToButterflyRecords,
  type ButterflyDatabaseRow,
  CREATE_BUTTERFLY_TABLE_SQL,
  DEFAULT_BUTTERFLY_DATABASE_NAME,
} from './schema';
import { openButterflyDatabase, type ButterflyDatabaseLike } from './sqlite';

export interface ButterflyRepositoryOptions {
  now?: () => Date;
  generateId?: () => string;
}

export interface ButterflyRepositoryLike {
  initialize(): Promise<void>;
  create(input: ButterflyRecordInput): Promise<ButterflyRecordLocal>;
  upsert(record: ButterflyRecordLocal): Promise<ButterflyRecordLocal>;
  update(id: string, patch: ButterflyRecordPatch): Promise<ButterflyRecordLocal | null>;
  delete(id: string): Promise<boolean>;
  deleteByNameCn(nameCn: string): Promise<number>;
  getById(id: string): Promise<ButterflyRecordLocal | null>;
  getByNameCn(nameCn: string): Promise<ButterflyRecordLocal[]>;
  list(filters?: ButterflyListFilters): Promise<ButterflyRecordLocal[]>;
  listGrouped(filters?: ButterflyListFilters): Promise<ButterflyGroupSummary[]>;
  getStatistics(filters?: ButterflyListFilters): Promise<ButterflyStatistics>;
  getTaxonomy(filters?: ButterflyListFilters): Promise<ButterflyTaxonomyTree>;
  replaceAll(records: ButterflyRecordLocal[]): Promise<void>;
  importLegacyExport(exportPayload: string | LegacyButterflyExport | { success?: boolean; data?: unknown }): Promise<ButterflyRecordLocal[]>;
}

export class ButterflyRepository implements ButterflyRepositoryLike {
  constructor(private readonly db: ButterflyDatabaseLike, private readonly options: ButterflyRepositoryOptions = {}) {}

  static async open(databaseName = DEFAULT_BUTTERFLY_DATABASE_NAME): Promise<ButterflyRepository> {
    const database = await openButterflyDatabase(databaseName);
    return new ButterflyRepository(database);
  }

  async initialize(): Promise<void> {
    await this.db.execAsync(CREATE_BUTTERFLY_TABLE_SQL);
  }

  async create(input: ButterflyRecordInput): Promise<ButterflyRecordLocal> {
    const record = normalizeButterflyRecordInput(
      {
        ...input,
        id: input.id ?? this.generateId(),
      },
      this.now(),
    );

    await this.db.runAsync(
      `
      INSERT INTO butterflies (
        id, name_cn, name_en, latin_name, family, subfamily, genus, distribution, habitat,
        wingspan, description, location, latitude, longitude, collected_at, photo_local_uri,
        photo_remote_url, ai_confidence, ai_details_json, notes, created_at, updated_at, sync_status
      ) VALUES (
        $id, $name_cn, $name_en, $latin_name, $family, $subfamily, $genus, $distribution, $habitat,
        $wingspan, $description, $location, $latitude, $longitude, $collected_at, $photo_local_uri,
        $photo_remote_url, $ai_confidence, $ai_details_json, $notes, $created_at, $updated_at, $sync_status
      )
      `,
      dbParams(butterflyRecordToDbRow(record)),
    );

    return record;
  }

  async upsert(record: ButterflyRecordLocal): Promise<ButterflyRecordLocal> {
    const normalized = coerceRecordForWrite(record, this.now());

    await this.db.runAsync(
      `
      INSERT INTO butterflies (
        id, name_cn, name_en, latin_name, family, subfamily, genus, distribution, habitat,
        wingspan, description, location, latitude, longitude, collected_at, photo_local_uri,
        photo_remote_url, ai_confidence, ai_details_json, notes, created_at, updated_at, sync_status
      ) VALUES (
        $id, $name_cn, $name_en, $latin_name, $family, $subfamily, $genus, $distribution, $habitat,
        $wingspan, $description, $location, $latitude, $longitude, $collected_at, $photo_local_uri,
        $photo_remote_url, $ai_confidence, $ai_details_json, $notes, $created_at, $updated_at, $sync_status
      )
      ON CONFLICT(id) DO UPDATE SET
        name_cn = excluded.name_cn,
        name_en = excluded.name_en,
        latin_name = excluded.latin_name,
        family = excluded.family,
        subfamily = excluded.subfamily,
        genus = excluded.genus,
        distribution = excluded.distribution,
        habitat = excluded.habitat,
        wingspan = excluded.wingspan,
        description = excluded.description,
        location = excluded.location,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        collected_at = excluded.collected_at,
        photo_local_uri = excluded.photo_local_uri,
        photo_remote_url = excluded.photo_remote_url,
        ai_confidence = excluded.ai_confidence,
        ai_details_json = excluded.ai_details_json,
        notes = excluded.notes,
        updated_at = excluded.updated_at,
        sync_status = excluded.sync_status
      `,
      dbParams(butterflyRecordToDbRow(normalized)),
    );

    return normalized;
  }

  async update(id: string, patch: ButterflyRecordPatch): Promise<ButterflyRecordLocal | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const merged = coerceRecordForWrite(
      {
        ...existing,
        ...normalizeButterflyPatch(patch),
        id: existing.id,
        created_at: existing.created_at,
      },
      this.now(),
      existing.created_at,
    );

    await this.db.runAsync(
      `
      UPDATE butterflies
      SET
        name_cn = $name_cn,
        name_en = $name_en,
        latin_name = $latin_name,
        family = $family,
        subfamily = $subfamily,
        genus = $genus,
        distribution = $distribution,
        habitat = $habitat,
        wingspan = $wingspan,
        description = $description,
        location = $location,
        latitude = $latitude,
        longitude = $longitude,
        collected_at = $collected_at,
        photo_local_uri = $photo_local_uri,
        photo_remote_url = $photo_remote_url,
        ai_confidence = $ai_confidence,
        ai_details_json = $ai_details_json,
        notes = $notes,
        updated_at = $updated_at,
        sync_status = $sync_status
      WHERE id = $id
      `,
      dbParams(butterflyRecordToDbRow(merged)),
    );

    return merged;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.runAsync('DELETE FROM butterflies WHERE id = $id', { $id: id });
    return result.changes > 0;
  }

  async deleteByNameCn(nameCn: string): Promise<number> {
    const result = await this.db.runAsync('DELETE FROM butterflies WHERE name_cn = $name_cn', {
      $name_cn: normalizeText(nameCn) ?? '',
    });
    return result.changes;
  }

  async getById(id: string): Promise<ButterflyRecordLocal | null> {
    const row = await this.db.getFirstAsync<ButterflyDatabaseRow>('SELECT * FROM butterflies WHERE id = $id LIMIT 1', {
      $id: id,
    });
    return row ? dbRowToButterflyRecord(row) : null;
  }

  async getByNameCn(nameCn: string): Promise<ButterflyRecordLocal[]> {
    const rows = await this.db.getAllAsync<ButterflyDatabaseRow>(
      `
      SELECT * FROM butterflies
      WHERE name_cn = $name_cn
      ORDER BY updated_at DESC, created_at DESC
      `,
      { $name_cn: normalizeText(nameCn) ?? '' },
    );

    return dbRowsToButterflyRecords(rows);
  }

  async list(filters: ButterflyListFilters = {}): Promise<ButterflyRecordLocal[]> {
    const { sql, params } = buildButterflySelectQuery(filters);
    const rows = await this.db.getAllAsync<ButterflyDatabaseRow>(sql, params);
    return dbRowsToButterflyRecords(rows);
  }

  async listGrouped(filters: ButterflyListFilters = {}): Promise<ButterflyGroupSummary[]> {
    return groupButterfliesByNameCn(await this.list({ ...filters, limit: undefined, offset: undefined }));
  }

  async getStatistics(filters: ButterflyListFilters = {}): Promise<ButterflyStatistics> {
    return getButterflyStatistics(await this.list({ ...filters, limit: undefined, offset: undefined }));
  }

  async getTaxonomy(filters: ButterflyListFilters = {}): Promise<ButterflyTaxonomyTree> {
    return buildButterflyTaxonomyTree(await this.list({ ...filters, limit: undefined, offset: undefined }));
  }

  async replaceAll(records: ButterflyRecordLocal[]): Promise<void> {
    await withWriteTransaction(this.db, async () => {
      await this.db.execAsync('DELETE FROM butterflies;');
      for (const record of records) {
        await this.db.runAsync(
          `
          INSERT INTO butterflies (
            id, name_cn, name_en, latin_name, family, subfamily, genus, distribution, habitat,
            wingspan, description, location, latitude, longitude, collected_at, photo_local_uri,
            photo_remote_url, ai_confidence, ai_details_json, notes, created_at, updated_at, sync_status
          ) VALUES (
            $id, $name_cn, $name_en, $latin_name, $family, $subfamily, $genus, $distribution, $habitat,
            $wingspan, $description, $location, $latitude, $longitude, $collected_at, $photo_local_uri,
            $photo_remote_url, $ai_confidence, $ai_details_json, $notes, $created_at, $updated_at, $sync_status
          )
          `,
          dbParams(butterflyRecordToDbRow(record)),
        );
      }
    });
  }

  async importLegacyExport(
    exportPayload: string | LegacyButterflyExport | { success?: boolean; data?: unknown },
  ): Promise<ButterflyRecordLocal[]> {
    const exportData = parseLegacyButterflyExport(exportPayload);
    const drafts = legacyExportToLocalDrafts(exportData).filter((record) => normalizeText(record.name_cn));

    if (drafts.length === 0) {
      throw new Error('Legacy export does not contain any valid butterfly records');
    }

    const records = drafts.map((record) =>
      normalizeButterflyRecordInput(
        {
          ...record,
          id: this.generateId(),
        },
        this.now(),
      ),
    );

    await this.replaceAll(records);
    return records;
  }

  private now(): Date {
    return this.options.now?.() ?? new Date();
  }

  private generateId(): string {
    return this.options.generateId?.() ?? createId('bf_');
  }
}

export async function createButterflyRepository(databaseName = DEFAULT_BUTTERFLY_DATABASE_NAME): Promise<ButterflyRepository> {
  return ButterflyRepository.open(databaseName);
}

export function normalizeImportedRecords(records: ButterflyRecordInput[]): ButterflyRecordLocal[] {
  return records.map((record) => normalizeButterflyRecordInput({ ...record, id: record.id ?? createId('bf_') }, new Date()));
}

function coerceRecordForWrite(
  record: ButterflyRecordLocal,
  now: Date,
  createdAtOverride?: string,
): ButterflyRecordLocal {
  const timestamp = now.toISOString();
  const createdAt = normalizeIsoDate(createdAtOverride ?? record.created_at) ?? timestamp;
  const nameCn = normalizeText(record.name_cn);

  if (!nameCn) {
    throw new Error('name_cn is required');
  }

  return {
    ...record,
    name_cn: nameCn,
    name_en: normalizeText(record.name_en),
    latin_name: normalizeText(record.latin_name),
    family: normalizeText(record.family),
    subfamily: normalizeText(record.subfamily),
    genus: normalizeText(record.genus),
    distribution: normalizeText(record.distribution),
    habitat: normalizeText(record.habitat),
    wingspan: normalizeText(record.wingspan),
    description: normalizeText(record.description),
    location: normalizeText(record.location),
    latitude: normalizeText(record.latitude),
    longitude: normalizeText(record.longitude),
    collected_at: normalizeIsoDate(record.collected_at) ?? createdAt,
    photo_local_uri: normalizeText(record.photo_local_uri),
    photo_remote_url: normalizeText(record.photo_remote_url),
    ai_confidence: normalizeText(record.ai_confidence),
    ai_details_json: record.ai_details_json ?? null,
    notes: normalizeText(record.notes),
    created_at: createdAt,
    updated_at: timestamp,
    sync_status: record.sync_status ?? 'local-only',
  };
}

async function withWriteTransaction(db: ButterflyDatabaseLike, task: () => Promise<void>): Promise<void> {
  if (typeof db.withExclusiveTransactionAsync === 'function') {
    await db.withExclusiveTransactionAsync(task);
    return;
  }

  if (typeof db.withTransactionAsync === 'function') {
    await db.withTransactionAsync(task);
    return;
  }

  await task();
}

function dbParams(row: ButterflyDatabaseRow): Record<string, string | null> {
  return {
    $id: row.id,
    $name_cn: row.name_cn,
    $name_en: row.name_en,
    $latin_name: row.latin_name,
    $family: row.family,
    $subfamily: row.subfamily,
    $genus: row.genus,
    $distribution: row.distribution,
    $habitat: row.habitat,
    $wingspan: row.wingspan,
    $description: row.description,
    $location: row.location,
    $latitude: row.latitude,
    $longitude: row.longitude,
    $collected_at: row.collected_at,
    $photo_local_uri: row.photo_local_uri,
    $photo_remote_url: row.photo_remote_url,
    $ai_confidence: row.ai_confidence,
    $ai_details_json: row.ai_details_json,
    $notes: row.notes,
    $created_at: row.created_at,
    $updated_at: row.updated_at,
    $sync_status: row.sync_status,
  };
}
