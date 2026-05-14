import { createDeterministicChecksum, isNonEmptyString, normalizeIsoDate, normalizeText } from './shared';

export type ButterflyAiDetails = Record<string, unknown>;

export type ButterflySyncStatus = 'local-only' | 'pending-sync' | 'synced';

export interface ButterflyRecordLocal {
  id: string;
  name_cn: string;
  name_en?: string | null;
  latin_name?: string | null;
  family?: string | null;
  subfamily?: string | null;
  genus?: string | null;
  distribution?: string | null;
  habitat?: string | null;
  wingspan?: string | null;
  description?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  collected_at?: string | null;
  photo_local_uri?: string | null;
  photo_remote_url?: string | null;
  ai_confidence?: string | null;
  ai_details_json?: ButterflyAiDetails | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  sync_status?: ButterflySyncStatus;
}

export interface ButterflyRecordInput {
  id?: string;
  name_cn: string;
  name_en?: string | null;
  latin_name?: string | null;
  family?: string | null;
  subfamily?: string | null;
  genus?: string | null;
  distribution?: string | null;
  habitat?: string | null;
  wingspan?: string | null;
  description?: string | null;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  collected_at?: string | null;
  photo_local_uri?: string | null;
  photo_remote_url?: string | null;
  ai_confidence?: string | null;
  ai_details_json?: ButterflyAiDetails | null;
  notes?: string | null;
}

export interface ButterflyRecordPatch extends Partial<Omit<ButterflyRecordInput, 'id' | 'name_cn'>> {
  name_cn?: string | null;
}

export interface ButterflyListFilters {
  search?: string | null;
  family?: string | null;
  genus?: string | null;
  limit?: number;
  offset?: number;
}

export interface ButterflyGroupSummary {
  name_cn: string;
  count: number;
  representative: ButterflyRecordLocal;
  records: ButterflyRecordLocal[];
  family: string | null;
  genus: string | null;
}

export interface ButterflyTaxonomySpeciesNode {
  name_cn: string;
  count: number;
  representative: ButterflyRecordLocal;
  records: ButterflyRecordLocal[];
}

export interface ButterflyTaxonomyGenusNode {
  name: string;
  count: number;
  species_count: number;
  species: ButterflyTaxonomySpeciesNode[];
}

export interface ButterflyTaxonomyFamilyNode {
  name: string;
  count: number;
  genus_count: number;
  species_count: number;
  genera: ButterflyTaxonomyGenusNode[];
}

export interface ButterflyTaxonomyTree {
  count: number;
  family_count: number;
  genus_count: number;
  species_count: number;
  families: ButterflyTaxonomyFamilyNode[];
}

export interface ButterflyStatistics {
  record_count: number;
  family_count: number;
  genus_count: number;
  species_count: number;
  photo_count: number;
}

export interface LegacyButterflyRecord {
  name_cn: string;
  name_en?: string;
  latin_name?: string;
  family?: string;
  subfamily?: string;
  genus?: string;
  distribution?: string;
  habitat?: string;
  wingspan?: string;
  description?: string;
  location?: string;
  collected_at?: string;
  photo_url?: string;
  ai_confidence?: string;
  notes?: string;
}

export interface LegacyButterflyExport {
  version: string;
  exported_at: string;
  total_count: number;
  butterflies: LegacyButterflyRecord[];
}

export interface LocalLegacyImportResult {
  exportData: LegacyButterflyExport;
  records: ButterflyRecordInput[];
}

export function normalizeButterflyRecordInput(input: ButterflyRecordInput, now = new Date()): ButterflyRecordLocal {
  const timestamp = normalizeIsoDate(now) ?? new Date().toISOString();

  return {
    id: input.id?.trim() || createDeterministicId(input.name_cn, timestamp),
    name_cn: normalizeRequiredName(input.name_cn),
    name_en: normalizeText(input.name_en),
    latin_name: normalizeText(input.latin_name),
    family: normalizeText(input.family),
    subfamily: normalizeText(input.subfamily),
    genus: normalizeText(input.genus),
    distribution: normalizeText(input.distribution),
    habitat: normalizeText(input.habitat),
    wingspan: normalizeText(input.wingspan),
    description: normalizeText(input.description),
    location: normalizeText(input.location),
    latitude: normalizeText(input.latitude),
    longitude: normalizeText(input.longitude),
    collected_at: normalizeIsoDate(input.collected_at) ?? timestamp,
    photo_local_uri: normalizeText(input.photo_local_uri),
    photo_remote_url: normalizeText(input.photo_remote_url),
    ai_confidence: normalizeText(input.ai_confidence),
    ai_details_json: input.ai_details_json ?? null,
    notes: normalizeText(input.notes),
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: 'local-only',
  };
}

export function normalizeButterflyPatch(patch: ButterflyRecordPatch): Partial<ButterflyRecordLocal> {
  return {
    name_cn: patch.name_cn == null ? undefined : normalizeRequiredName(patch.name_cn),
    name_en: normalizeText(patch.name_en),
    latin_name: normalizeText(patch.latin_name),
    family: normalizeText(patch.family),
    subfamily: normalizeText(patch.subfamily),
    genus: normalizeText(patch.genus),
    distribution: normalizeText(patch.distribution),
    habitat: normalizeText(patch.habitat),
    wingspan: normalizeText(patch.wingspan),
    description: normalizeText(patch.description),
    location: normalizeText(patch.location),
    latitude: normalizeText(patch.latitude),
    longitude: normalizeText(patch.longitude),
    collected_at: normalizeIsoDate(patch.collected_at) ?? undefined,
    photo_local_uri: normalizeText(patch.photo_local_uri),
    photo_remote_url: normalizeText(patch.photo_remote_url),
    ai_confidence: normalizeText(patch.ai_confidence),
    ai_details_json: patch.ai_details_json ?? undefined,
    notes: normalizeText(patch.notes),
  };
}

export function getButterflyDisplayPhoto(record: ButterflyRecordLocal): string | null {
  return record.photo_local_uri ?? record.photo_remote_url ?? null;
}

export function groupButterfliesByNameCn(records: ButterflyRecordLocal[]): ButterflyGroupSummary[] {
  const groups = new Map<string, ButterflyRecordLocal[]>();

  for (const record of records) {
    const key = record.name_cn.trim();
    const existing = groups.get(key);
    if (existing) {
      existing.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  return Array.from(groups.entries())
    .map(([name_cn, groupedRecords]) => {
      const sorted = groupedRecords.slice().sort(compareRecordsByRecentActivity);
      const representative = sorted[0];

      return {
        name_cn,
        count: sorted.length,
        representative,
        records: sorted,
        family: representative.family ?? null,
        genus: representative.genus ?? null,
      };
    })
    .sort((left, right) => left.name_cn.localeCompare(right.name_cn, 'zh-Hans-CN'));
}

export function buildButterflyTaxonomyTree(records: ButterflyRecordLocal[]): ButterflyTaxonomyTree {
  const familyMap = new Map<string, ButterflyRecordLocal[]>();

  for (const record of records) {
    const familyName = record.family ?? '未分类科';
    const familyRecords = familyMap.get(familyName);
    if (familyRecords) {
      familyRecords.push(record);
    } else {
      familyMap.set(familyName, [record]);
    }
  }

  const families = Array.from(familyMap.entries())
    .map(([familyName, familyRecords]) => {
      const genusMap = new Map<string, ButterflyRecordLocal[]>();

      for (const record of familyRecords) {
        const genusName = record.genus ?? '未分类属';
        const genusRecords = genusMap.get(genusName);
        if (genusRecords) {
          genusRecords.push(record);
        } else {
          genusMap.set(genusName, [record]);
        }
      }

      const genera = Array.from(genusMap.entries())
        .map(([genusName, genusRecords]) => {
          const speciesMap = new Map<string, ButterflyRecordLocal[]>();

          for (const record of genusRecords) {
            const speciesName = record.name_cn.trim();
            const speciesRecords = speciesMap.get(speciesName);
            if (speciesRecords) {
              speciesRecords.push(record);
            } else {
              speciesMap.set(speciesName, [record]);
            }
          }

          const species = Array.from(speciesMap.entries())
            .map(([speciesName, speciesRecords]) => {
              const sortedSpeciesRecords = speciesRecords.slice().sort(compareRecordsByRecentActivity);
              return {
                name_cn: speciesName,
                count: sortedSpeciesRecords.length,
                representative: sortedSpeciesRecords[0],
                records: sortedSpeciesRecords,
              };
            })
            .sort((left, right) => left.name_cn.localeCompare(right.name_cn, 'zh-Hans-CN'));

          return {
            name: genusName,
            count: genusRecords.length,
            species_count: species.length,
            species,
          };
        })
        .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));

      const speciesCount = genera.reduce((total, genus) => total + genus.species_count, 0);
      return {
        name: familyName,
        count: familyRecords.length,
        genus_count: genera.length,
        species_count: speciesCount,
        genera,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));

  return {
    count: records.length,
    family_count: families.length,
    genus_count: families.reduce((total, family) => total + family.genus_count, 0),
    species_count: families.reduce((total, family) => total + family.species_count, 0),
    families,
  };
}

export function getButterflyStatistics(records: ButterflyRecordLocal[]): ButterflyStatistics {
  const familyNames = new Set<string>();
  const genusNames = new Set<string>();
  const speciesNames = new Set<string>();
  let photoCount = 0;

  for (const record of records) {
    if (isNonEmptyString(record.family)) {
      familyNames.add(record.family.trim());
    }
    if (isNonEmptyString(record.genus)) {
      genusNames.add(record.genus.trim());
    }
    if (isNonEmptyString(record.name_cn)) {
      speciesNames.add(record.name_cn.trim());
    }
    if (record.photo_local_uri || record.photo_remote_url) {
      photoCount += 1;
    }
  }

  return {
    record_count: records.length,
    family_count: familyNames.size,
    genus_count: genusNames.size,
    species_count: speciesNames.size,
    photo_count: photoCount,
  };
}

function compareRecordsByRecentActivity(left: ButterflyRecordLocal, right: ButterflyRecordLocal): number {
  return toComparableTime(right.updated_at) - toComparableTime(left.updated_at) || toComparableTime(right.created_at) - toComparableTime(left.created_at);
}

function toComparableTime(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeRequiredName(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error('name_cn is required');
  }

  return normalized;
}

function createDeterministicId(nameCn: string, timestamp: string): string {
  return createDeterministicChecksum({ nameCn: normalizeRequiredName(nameCn), timestamp });
}
