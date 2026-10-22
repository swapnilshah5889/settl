export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    default_currency TEXT DEFAULT 'USD',
    image_uri TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    image_uri TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS groups_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    group_type TEXT DEFAULT 'other',
    cover_image_uri TEXT,
    simplify_debts INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES groups_(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES friends(id),
    UNIQUE(group_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER REFERENCES groups_(id),
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    date TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    created_by INTEGER,
    is_payment INTEGER DEFAULT 0,
    notes TEXT,
    receipt_uri TEXT,
    split_type TEXT DEFAULT 'equal',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    friend_id INTEGER,
    paid_amount REAL DEFAULT 0,
    owed_amount REAL DEFAULT 0,
    UNIQUE(expense_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    friend_id INTEGER,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;
