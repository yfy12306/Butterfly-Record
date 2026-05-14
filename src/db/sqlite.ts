import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { CREATE_BUTTERFLY_TABLE_SQL, DEFAULT_BUTTERFLY_DATABASE_NAME } from './schema';

export interface SQLiteWriteResult {
  lastInsertRowId: number;
  changes: number;
}

export interface ButterflyDatabaseLike {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: any): Promise<SQLiteWriteResult>;
  getFirstAsync<T>(source: string, params: any): Promise<T | null>;
  getAllAsync<T>(source: string, params: any): Promise<T[]>;
  withTransactionAsync?(task: () => Promise<void>): Promise<void>;
  withExclusiveTransactionAsync?(task: (txn: unknown) => Promise<void>): Promise<void>;
}

export async function openButterflyDatabase(databaseName = DEFAULT_BUTTERFLY_DATABASE_NAME): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(databaseName);
  await database.execAsync(CREATE_BUTTERFLY_TABLE_SQL);
  return database;
}

export async function initializeButterflyDatabase(database: ButterflyDatabaseLike): Promise<void> {
  await database.execAsync(CREATE_BUTTERFLY_TABLE_SQL);
}
