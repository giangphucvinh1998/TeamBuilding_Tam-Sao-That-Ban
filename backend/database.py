"""Database module - SQLite async connection and schema management."""

import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "game.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    status TEXT NOT NULL DEFAULT 'CREATED',
    rounds_per_team INTEGER NOT NULL DEFAULT 6,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    member_count INTEGER NOT NULL DEFAULT 5,
    score INTEGER NOT NULL DEFAULT 0,
    play_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT DEFAULT '',
    hint_image_url TEXT,
    is_used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    state TEXT NOT NULL DEFAULT 'READY',
    main_answer_correct INTEGER,
    hint_answer_correct INTEGER,
    steal_team_id TEXT REFERENCES teams(id),
    steal_answer_correct INTEGER,
    score_awarded INTEGER NOT NULL DEFAULT 0,
    score_to_team TEXT,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    media_url TEXT NOT NULL,
    original_filename TEXT DEFAULT '',
    hint TEXT DEFAULT '',
    is_used INTEGER NOT NULL DEFAULT 0,
    is_final_live INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS humming_rounds (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    state TEXT NOT NULL DEFAULT 'READY',
    main_answer_correct INTEGER,
    hint_answer_correct INTEGER,
    steal_team_id TEXT REFERENCES teams(id),
    steal_answer_correct INTEGER,
    score_awarded INTEGER NOT NULL DEFAULT 0,
    score_to_team TEXT,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);
"""


async def get_db() -> aiosqlite.Connection:
    """Get a database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Initialize database schema."""
    db = await get_db()
    try:
        await db.executescript(SCHEMA)
        
        # Safe migration for hint_image_url
        try:
            await db.execute("ALTER TABLE keywords ADD COLUMN hint_image_url TEXT;")
        except aiosqlite.OperationalError:
            pass # Column likely already exists
            
        # Safe migration for original_filename in songs
        try:
            await db.execute("ALTER TABLE songs ADD COLUMN original_filename TEXT DEFAULT '';")
        except aiosqlite.OperationalError:
            pass # Column likely already exists
            
        await db.commit()
    finally:
        await db.close()
