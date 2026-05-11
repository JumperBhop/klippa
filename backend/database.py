import sqlite3
import threading
from pathlib import Path

DB_PATH = Path(__file__).parent / "klippa.db"
_lock = threading.Lock()


def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _lock:
        conn = get_conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS jobs (
                id          TEXT PRIMARY KEY,
                status      TEXT NOT NULL DEFAULT 'pending',
                progress    INTEGER NOT NULL DEFAULT 0,
                step        TEXT NOT NULL DEFAULT '',
                error       TEXT,
                youtube_url TEXT,
                file_path   TEXT,
                created_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS clips (
                id          TEXT PRIMARY KEY,
                job_id      TEXT NOT NULL,
                file_path   TEXT NOT NULL,
                score       INTEGER NOT NULL DEFAULT 0,
                reason      TEXT NOT NULL DEFAULT '',
                title       TEXT NOT NULL DEFAULT '',
                duration    TEXT NOT NULL DEFAULT '',
                time_start  REAL NOT NULL DEFAULT 0,
                time_end    REAL NOT NULL DEFAULT 0,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );
        """)
        conn.commit()
        conn.close()


def create_job(job_id: str, youtube_url: str = None, file_path: str = None):
    with _lock:
        conn = get_conn()
        conn.execute(
            "INSERT INTO jobs (id, youtube_url, file_path) VALUES (?, ?, ?)",
            (job_id, youtube_url, file_path),
        )
        conn.commit()
        conn.close()


def update_job(job_id: str, status: str = None, progress: int = None, step: str = None, error: str = None):
    with _lock:
        conn = get_conn()
        fields, vals = [], []
        if status is not None:
            fields.append("status = ?"); vals.append(status)
        if progress is not None:
            fields.append("progress = ?"); vals.append(progress)
        if step is not None:
            fields.append("step = ?"); vals.append(step)
        if error is not None:
            fields.append("error = ?"); vals.append(error)
        if fields:
            vals.append(job_id)
            conn.execute(f"UPDATE jobs SET {', '.join(fields)} WHERE id = ?", vals)
            conn.commit()
        conn.close()


def get_job(job_id: str):
    with _lock:
        conn = get_conn()
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        conn.close()
        return dict(row) if row else None


def save_clip(clip_id: str, job_id: str, file_path: str, score: int,
              reason: str, title: str, duration: str, time_start: float, time_end: float):
    with _lock:
        conn = get_conn()
        conn.execute(
            """INSERT INTO clips (id, job_id, file_path, score, reason, title, duration, time_start, time_end)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (clip_id, job_id, file_path, score, reason, title, duration, time_start, time_end),
        )
        conn.commit()
        conn.close()


def get_clips(job_id: str):
    with _lock:
        conn = get_conn()
        rows = conn.execute("SELECT * FROM clips WHERE job_id = ? ORDER BY score DESC", (job_id,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]


def get_clip(clip_id: str):
    with _lock:
        conn = get_conn()
        row = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
        conn.close()
        return dict(row) if row else None
