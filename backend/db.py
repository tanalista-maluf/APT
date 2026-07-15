"""
AutoPost WebApp - Camada de banco de dados (SQLite)

Substitui o antigo queue.json. Na primeira execucao, se existir um
queue.json com posts, eles sao importados automaticamente e o arquivo
e renomeado para queue.json.importado (fica como backup).

O caminho do banco respeita a variavel de ambiente DATA_DIR (usada no
deploy, onde o volume persistente e montado em outro lugar).
"""

import json
import os
import sqlite3
from contextlib import contextmanager

DATA_DIR = os.getenv("DATA_DIR") or os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DATA_DIR, "autopost.db")
LEGACY_QUEUE_FILE = os.path.join(DATA_DIR, "queue.json")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS posts (
    id            TEXT PRIMARY KEY,
    photo_path    TEXT NOT NULL,
    caption       TEXT NOT NULL DEFAULT '',
    hashtags      TEXT NOT NULL DEFAULT '[]',
    location      TEXT NOT NULL DEFAULT '',
    tagged_people TEXT NOT NULL DEFAULT '[]',
    schedule_date TEXT,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    TEXT,
    posted_at     TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);
"""


@contextmanager
def _connect():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _row_to_post(row):
    return {
        "id": row["id"],
        "photo_path": row["photo_path"],
        "caption": row["caption"],
        "hashtags": json.loads(row["hashtags"] or "[]"),
        "location": row["location"],
        "tagged_people": json.loads(row["tagged_people"] or "[]"),
        "schedule_date": row["schedule_date"],
        "status": row["status"],
        "created_at": row["created_at"],
        "posted_at": row["posted_at"],
    }


def init_db():
    """Cria a tabela e importa o queue.json antigo, se existir."""
    with _connect() as conn:
        conn.executescript(_SCHEMA)

    _migrate_legacy_queue()


def _migrate_legacy_queue():
    if not os.path.exists(LEGACY_QUEUE_FILE):
        return

    try:
        with open(LEGACY_QUEUE_FILE, "r") as f:
            legacy_posts = json.load(f)
    except Exception as e:
        print(f"Aviso: nao foi possivel ler o queue.json antigo: {e}")
        return

    if not isinstance(legacy_posts, list):
        return

    imported = 0
    with _connect() as conn:
        for post in legacy_posts:
            if not isinstance(post, dict) or not post.get("id"):
                continue
            exists = conn.execute(
                "SELECT 1 FROM posts WHERE id = ?", (post["id"],)
            ).fetchone()
            if exists:
                continue
            conn.execute(
                """INSERT INTO posts
                   (id, photo_path, caption, hashtags, location, tagged_people,
                    schedule_date, status, created_at, posted_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    post["id"],
                    post.get("photo_path", ""),
                    post.get("caption", ""),
                    json.dumps(post.get("hashtags", []), ensure_ascii=False),
                    post.get("location", ""),
                    json.dumps(post.get("tagged_people", []), ensure_ascii=False),
                    post.get("schedule_date"),
                    post.get("status", "pending"),
                    post.get("created_at"),
                    post.get("posted_at"),
                ),
            )
            imported += 1

    backup_path = LEGACY_QUEUE_FILE + ".importado"
    try:
        os.rename(LEGACY_QUEUE_FILE, backup_path)
    except OSError as e:
        print(f"Aviso: nao foi possivel renomear o queue.json antigo: {e}")

    if imported:
        print(f"Migracao: {imported} post(s) importado(s) do queue.json para o banco SQLite")


def list_posts():
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM posts ORDER BY schedule_date").fetchall()
    return [_row_to_post(r) for r in rows]


def get_post(post_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    return _row_to_post(row) if row else None


def add_post(post):
    with _connect() as conn:
        conn.execute(
            """INSERT INTO posts
               (id, photo_path, caption, hashtags, location, tagged_people,
                schedule_date, status, created_at, posted_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                post["id"],
                post["photo_path"],
                post.get("caption", ""),
                json.dumps(post.get("hashtags", []), ensure_ascii=False),
                post.get("location", ""),
                json.dumps(post.get("tagged_people", []), ensure_ascii=False),
                post.get("schedule_date"),
                post.get("status", "pending"),
                post.get("created_at"),
                post.get("posted_at"),
            ),
        )


def update_post(post_id, fields):
    """Atualiza apenas os campos permitidos presentes em `fields`."""
    allowed = {
        "caption": lambda v: v,
        "hashtags": lambda v: json.dumps(v, ensure_ascii=False),
        "location": lambda v: v,
        "tagged_people": lambda v: json.dumps(v, ensure_ascii=False),
        "schedule_date": lambda v: v,
        "status": lambda v: v,
        "posted_at": lambda v: v,
    }

    sets, values = [], []
    for key, transform in allowed.items():
        if key in fields:
            sets.append(f"{key} = ?")
            values.append(transform(fields[key]))

    if not sets:
        return get_post(post_id)

    values.append(post_id)
    with _connect() as conn:
        cur = conn.execute(f"UPDATE posts SET {', '.join(sets)} WHERE id = ?", values)
        if cur.rowcount == 0:
            return None
    return get_post(post_id)


def delete_post(post_id):
    with _connect() as conn:
        cur = conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))
        return cur.rowcount > 0


# ============================================================
# Settings (chave/valor simples: idioma, nome do perfil vinculado, etc)
# ============================================================

def get_settings():
    with _connect() as conn:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
    return {r["key"]: r["value"] for r in rows}


def update_settings(fields):
    with _connect() as conn:
        for key, value in fields.items():
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, "" if value is None else str(value)),
            )
    return get_settings()
