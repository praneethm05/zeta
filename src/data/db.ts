import * as SQLite from 'expo-sqlite';

export type Db = SQLite.SQLiteDatabase;

let db: Db | null = null;

export function openDb(): Db {
  if (db === null) {
    db = SQLite.openDatabaseSync('zeta.db');
    runMigrations(db);
  }
  return db;
}

// Columns mirror master spec §7 exactly so Z3's Supabase schema matches.
// SQLite has no boolean type; booleans are stored as INTEGER 0/1.
export function runMigrations(d: Db): void {
  d.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      age_band TEXT,
      gender TEXT,
      handedness TEXT,
      device_model TEXT,
      screen_w INTEGER,
      screen_h INTEGER,
      os_version TEXT,
      consent_ts INTEGER,
      hyperdrive_condition TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      participant_id TEXT,
      app_version TEXT,
      module_order TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      abandoned INTEGER
    );

    CREATE TABLE IF NOT EXISTS trials (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      module TEXT,
      trial_index INTEGER,
      condition TEXT,
      stimulus_meta TEXT,
      rt_ms INTEGER,
      correct INTEGER,
      abandoned INTEGER,
      started_ts INTEGER,
      ended_ts INTEGER
    );

    CREATE TABLE IF NOT EXISTS touch_events (
      id TEXT PRIMARY KEY,
      trial_id TEXT,
      pointer_id INTEGER,
      phase TEXT,
      x_norm REAL,
      y_norm REAL,
      t_ms INTEGER,
      pressure REAL
    );

    CREATE TABLE IF NOT EXISTS assignment_counter (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      counter INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO assignment_counter (id, counter) VALUES (1, 0);
  `);
}
