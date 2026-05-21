import sqlite3
from contextlib import contextmanager

from app.config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  due_time TEXT,
  duration INTEGER,
  reminder TEXT,
  repeat_rule TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  list TEXT DEFAULT 'inbox',
  starred INTEGER DEFAULT 0,
  parent_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  pinned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  location TEXT,
  color TEXT DEFAULT 'indigo',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview TEXT,
  body TEXT,
  received_at INTEGER NOT NULL,
  is_read INTEGER DEFAULT 0,
  is_starred INTEGER DEFAULT 0,
  label TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Phase B: the data flywheel. Every generated plan is persisted with its full
-- feature set so a future ADHD model can train on (input -> plan -> outcome).
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  dump TEXT NOT NULL,
  state TEXT NOT NULL,
  energy TEXT NOT NULL,
  energy_mode TEXT NOT NULL,
  overwhelm_score INTEGER NOT NULL,
  cognitive_load_budget REAL NOT NULL,
  in_recovery INTEGER NOT NULL DEFAULT 0,
  energy_self_report TEXT,
  helpful INTEGER,
  plan_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  hour_of_day INTEGER NOT NULL,
  weekday INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- One row per do_now task. scores_json snapshots the features; status +
-- completed_at are the training labels.
CREATE TABLE IF NOT EXISTS task_outcomes (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  task_raw TEXT NOT NULL,
  rewrite TEXT NOT NULL,
  category TEXT NOT NULL,
  position INTEGER NOT NULL,
  scores_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
"""


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


_db = _connect()


def _safe_add_column(table: str, column: str, decl: str) -> None:
    existing = {r["name"] for r in _db.execute(f"PRAGMA table_info({table})")}
    if column not in existing:
        _db.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")


def init_db() -> None:
    _db.executescript(SCHEMA)
    # Migrations for DBs created before Phase B.
    _safe_add_column("users", "last_recovery_restart", "INTEGER")
    _db.commit()


@contextmanager
def cursor():
    cur = _db.cursor()
    try:
        yield cur
        _db.commit()
    finally:
        cur.close()


def query_one(sql: str, params: tuple = ()) -> sqlite3.Row | None:
    cur = _db.execute(sql, params)
    return cur.fetchone()


def query_all(sql: str, params: tuple = ()) -> list[sqlite3.Row]:
    cur = _db.execute(sql, params)
    return cur.fetchall()


def execute(sql: str, params: tuple = ()) -> None:
    _db.execute(sql, params)
    _db.commit()


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}
