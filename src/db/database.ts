import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';
import { seedCategories } from './seed';

const DB_NAME = 'splitwise.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(CREATE_TABLES);
  await seedCategories(db);

  _db = db;
  return db;
}

export function getDatabaseSync(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Database not initialized. Call getDatabase() first.');
  return _db;
}
