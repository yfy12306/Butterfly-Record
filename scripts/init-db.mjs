import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS species (
  id TEXT PRIMARY KEY NOT NULL,
  chineseName TEXT NOT NULL,
  scientificName TEXT NOT NULL UNIQUE,
  family TEXT NOT NULL,
  genus TEXT NOT NULL,
  orderName TEXT DEFAULT '鳞翅目',
  subfamily TEXT,
  description TEXT,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS species_alias (
  id TEXT PRIMARY KEY NOT NULL,
  speciesId TEXT NOT NULL,
  alias TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speciesId) REFERENCES species(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS species_alias_speciesId_alias_key ON species_alias(speciesId, alias);

CREATE TABLE IF NOT EXISTS region (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL,
  parentId TEXT,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parentId) REFERENCES region(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS region_name_level_parentId_key ON region(name, level, parentId);

CREATE TABLE IF NOT EXISTS species_region_distribution (
  id TEXT PRIMARY KEY NOT NULL,
  speciesId TEXT NOT NULL,
  regionId TEXT NOT NULL,
  isNative BOOLEAN NOT NULL DEFAULT 1,
  note TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speciesId) REFERENCES species(id) ON DELETE CASCADE,
  FOREIGN KEY (regionId) REFERENCES region(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS species_region_distribution_speciesId_regionId_key ON species_region_distribution(speciesId, regionId);

CREATE TABLE IF NOT EXISTS collection_record (
  id TEXT PRIMARY KEY NOT NULL,
  speciesId TEXT NOT NULL,
  regionId TEXT NOT NULL,
  observedAt DATETIME NOT NULL,
  locationDetail TEXT NOT NULL,
  status TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speciesId) REFERENCES species(id) ON DELETE CASCADE,
  FOREIGN KEY (regionId) REFERENCES region(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS image_asset (
  id TEXT PRIMARY KEY NOT NULL,
  speciesId TEXT,
  collectionRecordId TEXT,
  fileName TEXT NOT NULL,
  originalName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  title TEXT,
  description TEXT,
  shotAt DATETIME,
  isCover BOOLEAN NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speciesId) REFERENCES species(id) ON DELETE SET NULL,
  FOREIGN KEY (collectionRecordId) REFERENCES collection_record(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS species_user_status (
  id TEXT PRIMARY KEY NOT NULL,
  speciesId TEXT NOT NULL UNIQUE,
  isTarget BOOLEAN NOT NULL DEFAULT 0,
  isPendingIdentify BOOLEAN NOT NULL DEFAULT 0,
  isNewDiscovery BOOLEAN NOT NULL DEFAULT 0,
  personalNote TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speciesId) REFERENCES species(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS import_export_log (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  fileName TEXT,
  itemCount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  message TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

db.close();
console.log(`SQLite schema ensured at ${dbPath}`);
