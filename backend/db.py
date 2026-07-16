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

CREATE TABLE IF NOT EXISTS ig_accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ig_user_id      TEXT NOT NULL UNIQUE,
    username        TEXT NOT NULL DEFAULT '',
    access_token    TEXT NOT NULL DEFAULT '',
    token_expires_at TEXT,
    is_default      INTEGER NOT NULL DEFAULT 0,
    added_at        TEXT,
    profile_picture_url TEXT NOT NULL DEFAULT ''
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
    keys = row.keys()
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
        # Colunas adicionadas depois (integracao Instagram); usam .keys()
        # para nao quebrar caso o banco seja de uma versao anterior.
        "publish_error": row["publish_error"] if "publish_error" in keys else "",
        "ig_media_id": row["ig_media_id"] if "ig_media_id" in keys else "",
        "attempts": row["attempts"] if "attempts" in keys else 0,
        "ig_account_id": row["ig_account_id"] if "ig_account_id" in keys else None,
    }


# Colunas adicionadas apos a v2 (integracao Instagram). Sao criadas via
# ALTER TABLE na inicializacao para nao perder o banco existente.
_POST_EXTRA_COLUMNS = {
    "publish_error": "TEXT NOT NULL DEFAULT ''",
    "media_token": "TEXT NOT NULL DEFAULT ''",
    "ig_media_id": "TEXT NOT NULL DEFAULT ''",
    "attempts": "INTEGER NOT NULL DEFAULT 0",
    "ig_account_id": "INTEGER",
}


def init_db():
    """Cria a tabela, adiciona colunas novas e importa o queue.json antigo."""
    with _connect() as conn:
        conn.executescript(_SCHEMA)

        existing = {r["name"] for r in conn.execute("PRAGMA table_info(posts)")}
        for col, decl in _POST_EXTRA_COLUMNS.items():
            if col not in existing:
                conn.execute(f"ALTER TABLE posts ADD COLUMN {col} {decl}")

    with _connect() as conn:
        ig_cols = {r["name"] for r in conn.execute("PRAGMA table_info(ig_accounts)")}
        if "profile_picture_url" not in ig_cols:
            conn.execute("ALTER TABLE ig_accounts ADD COLUMN profile_picture_url TEXT NOT NULL DEFAULT ''")

    _migrate_legacy_queue()
    migrate_single_ig_to_multi()


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


def get_due_posts(now_iso):
    """Posts pendentes cuja hora de publicacao ja chegou (usado pelo agendador)."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM posts WHERE status = 'pending' AND schedule_date IS NOT NULL "
            "AND schedule_date <= ? ORDER BY schedule_date",
            (now_iso,),
        ).fetchall()
    return [_row_to_post(r) for r in rows]


def get_media_token(post_id):
    """Retorna (criando se preciso) o token da URL publica da foto do post.

    Esse token deixa a imagem acessivel sem senha num endereco impossivel de
    adivinhar - necessario porque o servidor do Instagram precisa BUSCAR a foto
    num link publico na hora de publicar.
    """
    import secrets
    with _connect() as conn:
        row = conn.execute("SELECT media_token FROM posts WHERE id = ?", (post_id,)).fetchone()
        if row is None:
            return None
        token = row["media_token"]
        if not token:
            token = secrets.token_urlsafe(24)
            conn.execute("UPDATE posts SET media_token = ? WHERE id = ?", (token, post_id))
    return token


def get_post_by_media_token(token):
    if not token:
        return None
    with _connect() as conn:
        row = conn.execute("SELECT * FROM posts WHERE media_token = ?", (token,)).fetchone()
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
        "publish_error": lambda v: v,
        "ig_media_id": lambda v: v,
        "attempts": lambda v: int(v),
        "ig_account_id": lambda v: int(v) if v else None,
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


def delete_settings(keys):
    with _connect() as conn:
        for key in keys:
            conn.execute("DELETE FROM settings WHERE key = ?", (key,))
    return get_settings()


# ============================================================
# Contas do Instagram (multiplas)
# ============================================================

def _row_to_ig_account(row):
    keys = row.keys()
    return {
        "id": row["id"],
        "ig_user_id": row["ig_user_id"],
        "username": row["username"],
        "access_token": row["access_token"],
        "token_expires_at": row["token_expires_at"],
        "is_default": bool(row["is_default"]),
        "added_at": row["added_at"],
        "profile_picture_url": row["profile_picture_url"] if "profile_picture_url" in keys else "",
    }


def list_ig_accounts():
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM ig_accounts ORDER BY is_default DESC, added_at").fetchall()
    return [_row_to_ig_account(r) for r in rows]


def get_ig_account(account_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM ig_accounts WHERE id = ?", (account_id,)).fetchone()
    return _row_to_ig_account(row) if row else None


def get_default_ig_account():
    with _connect() as conn:
        row = conn.execute("SELECT * FROM ig_accounts WHERE is_default = 1").fetchone()
        if not row:
            row = conn.execute("SELECT * FROM ig_accounts ORDER BY added_at LIMIT 1").fetchone()
    return _row_to_ig_account(row) if row else None


def add_ig_account(ig_user_id, username, access_token, token_expires_at=None, profile_picture_url=""):
    from datetime import datetime
    with _connect() as conn:
        existing = conn.execute("SELECT id FROM ig_accounts WHERE ig_user_id = ?", (ig_user_id,)).fetchone()
        if existing:
            conn.execute(
                "UPDATE ig_accounts SET username=?, access_token=?, token_expires_at=?, profile_picture_url=? WHERE ig_user_id=?",
                (username, access_token, token_expires_at, profile_picture_url, ig_user_id),
            )
            return get_ig_account(existing["id"])

        has_any = conn.execute("SELECT 1 FROM ig_accounts LIMIT 1").fetchone()
        is_default = 0 if has_any else 1
        conn.execute(
            "INSERT INTO ig_accounts (ig_user_id, username, access_token, token_expires_at, is_default, added_at, profile_picture_url) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (ig_user_id, username, access_token, token_expires_at, is_default, datetime.utcnow().isoformat(), profile_picture_url),
        )
        row = conn.execute("SELECT * FROM ig_accounts WHERE ig_user_id = ?", (ig_user_id,)).fetchone()
    return _row_to_ig_account(row)


def remove_ig_account(account_id):
    with _connect() as conn:
        was_default = conn.execute("SELECT is_default FROM ig_accounts WHERE id = ?", (account_id,)).fetchone()
        conn.execute("DELETE FROM ig_accounts WHERE id = ?", (account_id,))
        if was_default and was_default["is_default"]:
            conn.execute("UPDATE ig_accounts SET is_default = 1 WHERE id = (SELECT MIN(id) FROM ig_accounts)")
        return conn.execute("SELECT COUNT(*) as c FROM ig_accounts").fetchone()["c"]


def set_default_ig_account(account_id):
    with _connect() as conn:
        conn.execute("UPDATE ig_accounts SET is_default = 0")
        conn.execute("UPDATE ig_accounts SET is_default = 1 WHERE id = ?", (account_id,))


def update_ig_account_token(ig_user_id, access_token, token_expires_at=None):
    with _connect() as conn:
        conn.execute(
            "UPDATE ig_accounts SET access_token=?, token_expires_at=? WHERE ig_user_id=?",
            (access_token, token_expires_at, ig_user_id),
        )


def migrate_single_ig_to_multi():
    """Migra a conta unica (settings) para a tabela ig_accounts."""
    s = get_settings()
    ig_user_id = s.get("ig_user_id", "")
    access_token = s.get("ig_access_token", "")
    if not ig_user_id or not access_token:
        return
    with _connect() as conn:
        exists = conn.execute("SELECT 1 FROM ig_accounts WHERE ig_user_id = ?", (ig_user_id,)).fetchone()
        if exists:
            return
    add_ig_account(
        ig_user_id=ig_user_id,
        username=s.get("ig_username", ""),
        access_token=access_token,
        token_expires_at=s.get("ig_token_expires_at"),
    )
    delete_settings(["ig_user_id", "ig_access_token", "ig_username", "ig_token_expires_at"])
