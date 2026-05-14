import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  buildButterflyTaxonomyTree,
  createButterflyRepository,
  getButterflyStatistics,
  groupButterfliesByNameCn,
  type ButterflyGroupSummary,
  type ButterflyRecordInput,
  type ButterflyRecordLocal,
  type ButterflyRecordPatch,
  type ButterflyRepositoryLike,
  type ButterflyStatistics,
  type ButterflyTaxonomyTree,
} from "@/db";
import { deleteFileIfExists } from "@/lib/files";

type ButterflyDataContextValue = {
  ready: boolean;
  loading: boolean;
  error: string | null;
  records: ButterflyRecordLocal[];
  groups: ButterflyGroupSummary[];
  stats: ButterflyStatistics;
  taxonomy: ButterflyTaxonomyTree;
  refresh: () => Promise<void>;
  createRecord: (input: ButterflyRecordInput) => Promise<ButterflyRecordLocal>;
  updateRecord: (id: string, patch: ButterflyRecordPatch) => Promise<ButterflyRecordLocal | null>;
  deleteRecord: (id: string) => Promise<boolean>;
  deleteGroupByName: (nameCn: string) => Promise<number>;
  importLegacyExport: (payload: string | { success?: boolean; data?: unknown }) => Promise<ButterflyRecordLocal[]>;
  replaceAll: (records: ButterflyRecordLocal[]) => Promise<void>;
  findRecordById: (id: string) => ButterflyRecordLocal | null;
  findGroupByName: (nameCn: string) => ButterflyGroupSummary | null;
};

const EMPTY_STATS: ButterflyStatistics = {
  record_count: 0,
  family_count: 0,
  genus_count: 0,
  species_count: 0,
  photo_count: 0,
};

const EMPTY_TAXONOMY: ButterflyTaxonomyTree = {
  count: 0,
  family_count: 0,
  genus_count: 0,
  species_count: 0,
  families: [],
};

const ButterflyDataContext = createContext<ButterflyDataContextValue | null>(null);

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}

async function cleanupPhotoFiles(records: Array<{ photo_local_uri?: string | null }>, scope: string) {
  const results = await Promise.allSettled(records.map((record) => deleteFileIfExists(record.photo_local_uri)));
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failures.length > 0) {
    console.warn(`[butterfly-data] ${scope} left ${failures.length} managed files behind.`, failures.map((failure) => failure.reason));
  }
}

export function ButterflyDataProvider({ children }: PropsWithChildren) {
  const repoRef = useRef<ButterflyRepositoryLike | null>(null);
  const mountedRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<ButterflyRecordLocal[]>([]);

  const refresh = useCallback(async () => {
    if (!repoRef.current) {
      return;
    }

    setLoading(true);
    try {
      const nextRecords = await repoRef.current.list();
      if (!mountedRef.current) {
        return;
      }
      setRecords(nextRecords);
      setError(null);
    } catch (refreshError) {
      if (!mountedRef.current) {
        return;
      }
      setError(toErrorMessage(refreshError));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    void (async () => {
      try {
        const repository = await createButterflyRepository();
        if (!mountedRef.current) {
          return;
        }
        repoRef.current = repository;
        setReady(true);
        await refresh();
      } catch (initError) {
        if (!mountedRef.current) {
          return;
        }
        setError(toErrorMessage(initError));
        setLoading(false);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const groups = useMemo(() => groupButterfliesByNameCn(records), [records]);
  const stats = useMemo(() => getButterflyStatistics(records), [records]);
  const taxonomy = useMemo(() => buildButterflyTaxonomyTree(records), [records]);

  const createRecord = useCallback(async (input: ButterflyRecordInput) => {
    if (!repoRef.current) {
      throw new Error("Repository is not ready.");
    }

    const created = await repoRef.current.create(input);
    await refresh();
    return created;
  }, [refresh]);

  const updateRecord = useCallback(async (id: string, patch: ButterflyRecordPatch) => {
    if (!repoRef.current) {
      throw new Error("Repository is not ready.");
    }

    const updated = await repoRef.current.update(id, patch);
    await refresh();
    return updated;
  }, [refresh]);

  const deleteRecord = useCallback(async (id: string) => {
    if (!repoRef.current) {
      throw new Error("Repository is not ready.");
    }

    const existing = await repoRef.current.getById(id);
    const deleted = await repoRef.current.delete(id);
    if (deleted && existing?.photo_local_uri) {
      await cleanupPhotoFiles([existing], `deleteRecord(${id})`);
    }
    await refresh();
    return deleted;
  }, [refresh]);

  const deleteGroupByName = useCallback(async (nameCn: string) => {
    if (!repoRef.current) {
      throw new Error("Repository is not ready.");
    }

    const existing = await repoRef.current.getByNameCn(nameCn);
    const count = await repoRef.current.deleteByNameCn(nameCn);
    await cleanupPhotoFiles(existing, `deleteGroupByName(${nameCn})`);
    await refresh();
    return count;
  }, [refresh]);

  const importLegacyExport = useCallback(async (payload: string | { success?: boolean; data?: unknown }) => {
    if (!repoRef.current) {
      throw new Error("Repository is not ready.");
    }

    const previousRecords = [...records];
    const imported = await repoRef.current.importLegacyExport(payload);
    await cleanupPhotoFiles(previousRecords, "importLegacyExport");
    await refresh();
    return imported;
  }, [records, refresh]);

  const replaceAll = useCallback(async (nextRecords: ButterflyRecordLocal[]) => {
    if (!repoRef.current) {
      throw new Error("Repository is not ready.");
    }

    const previousRecords = [...records];
    await repoRef.current.replaceAll(nextRecords);
    await cleanupPhotoFiles(previousRecords, "replaceAll");
    await refresh();
  }, [records, refresh]);

  const value = useMemo<ButterflyDataContextValue>(() => ({
    ready,
    loading,
    error,
    records,
    groups,
    stats: stats ?? EMPTY_STATS,
    taxonomy: taxonomy ?? EMPTY_TAXONOMY,
    refresh,
    createRecord,
    updateRecord,
    deleteRecord,
    deleteGroupByName,
    importLegacyExport,
    replaceAll,
    findRecordById: (id: string) => records.find((record) => record.id === id) ?? null,
    findGroupByName: (nameCn: string) => groups.find((group) => group.name_cn === nameCn) ?? null,
  }), [
    createRecord,
    deleteGroupByName,
    deleteRecord,
    error,
    groups,
    importLegacyExport,
    loading,
    ready,
    records,
    refresh,
    replaceAll,
    stats,
    taxonomy,
    updateRecord,
  ]);

  return <ButterflyDataContext.Provider value={value}>{children}</ButterflyDataContext.Provider>;
}

export function useButterflyData() {
  const context = useContext(ButterflyDataContext);
  if (!context) {
    throw new Error("useButterflyData must be used inside ButterflyDataProvider.");
  }
  return context;
}
