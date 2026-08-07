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

_CONTENT_SCHEMA = """
CREATE TABLE IF NOT EXISTS content_batches (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL DEFAULT '',
    expeditions   TEXT NOT NULL DEFAULT '[]',
    themes        TEXT NOT NULL DEFAULT '[]',
    status        TEXT NOT NULL DEFAULT 'draft',
    created_at    TEXT,
    updated_at    TEXT
);

CREATE TABLE IF NOT EXISTS content_items (
    id                 TEXT PRIMARY KEY,
    batch_id           TEXT NOT NULL,
    expedition_id      TEXT NOT NULL,
    expedition_name    TEXT NOT NULL DEFAULT '',
    theme_id           TEXT NOT NULL,
    theme_name         TEXT NOT NULL DEFAULT '',
    item_order         INTEGER NOT NULL,
    caption_text       TEXT NOT NULL DEFAULT '',
    search_keyword     TEXT NOT NULL DEFAULT '',
    text_status        TEXT NOT NULL DEFAULT 'pending',
    text_error         TEXT NOT NULL DEFAULT '',
    photo_status       TEXT NOT NULL DEFAULT 'pending',
    photo_error        TEXT NOT NULL DEFAULT '',
    photo_path         TEXT NOT NULL DEFAULT '',
    unsplash_photo_id  TEXT NOT NULL DEFAULT '',
    photographer_name  TEXT NOT NULL DEFAULT '',
    photographer_url   TEXT NOT NULL DEFAULT '',
    theme_summary      TEXT NOT NULL DEFAULT '',
    scheduled_post_id  TEXT NOT NULL DEFAULT '',
    created_at         TEXT,
    updated_at         TEXT,
    UNIQUE(batch_id, expedition_id, theme_id, item_order)
);
CREATE INDEX IF NOT EXISTS idx_content_items_batch ON content_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(text_status, photo_status);
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
        "post_type": row["post_type"] if "post_type" in keys else "feed",
        "carousel_photos": json.loads(row["carousel_photos"]) if "carousel_photos" in keys and row["carousel_photos"] else [],
    }


# Colunas adicionadas apos a v2 (integracao Instagram). Sao criadas via
# ALTER TABLE na inicializacao para nao perder o banco existente.
_POST_EXTRA_COLUMNS = {
    "publish_error": "TEXT NOT NULL DEFAULT ''",
    "media_token": "TEXT NOT NULL DEFAULT ''",
    "ig_media_id": "TEXT NOT NULL DEFAULT ''",
    "attempts": "INTEGER NOT NULL DEFAULT 0",
    "ig_account_id": "INTEGER",
    "post_type": "TEXT NOT NULL DEFAULT 'feed'",
    "carousel_photos": "TEXT NOT NULL DEFAULT ''",
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

    with _connect() as conn:
        conn.executescript(_CONTENT_SCHEMA)

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
                schedule_date, status, created_at, posted_at, post_type, carousel_photos)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
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
                post.get("post_type", "feed"),
                json.dumps(post.get("carousel_photos", []), ensure_ascii=False),
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
        "post_type": lambda v: v,
        "carousel_photos": lambda v: json.dumps(v, ensure_ascii=False),
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


# ============================================================
# Levas de conteudo (content_batches / content_items)
# ============================================================

def _row_to_batch(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "expeditions": json.loads(row["expeditions"] or "[]"),
        "themes": json.loads(row["themes"] or "[]"),
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def add_content_batch(batch):
    with _connect() as conn:
        conn.execute(
            """INSERT INTO content_batches
               (id, name, expeditions, themes, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                batch["id"],
                batch.get("name", ""),
                json.dumps(batch.get("expeditions", []), ensure_ascii=False),
                json.dumps(batch.get("themes", []), ensure_ascii=False),
                batch.get("status", "draft"),
                batch.get("created_at"),
                batch.get("updated_at"),
            ),
        )


def get_content_batch(batch_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM content_batches WHERE id = ?", (batch_id,)).fetchone()
    return _row_to_batch(row) if row else None


def list_content_batches():
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM content_batches ORDER BY created_at DESC").fetchall()
    return [_row_to_batch(r) for r in rows]


def update_content_batch(batch_id, fields):
    allowed = {
        "name": lambda v: v,
        "expeditions": lambda v: json.dumps(v, ensure_ascii=False),
        "themes": lambda v: json.dumps(v, ensure_ascii=False),
        "status": lambda v: v,
        "updated_at": lambda v: v,
    }
    sets, values = [], []
    for key, transform in allowed.items():
        if key in fields:
            sets.append(f"{key} = ?")
            values.append(transform(fields[key]))
    if not sets:
        return get_content_batch(batch_id)
    values.append(batch_id)
    with _connect() as conn:
        conn.execute(f"UPDATE content_batches SET {', '.join(sets)} WHERE id = ?", values)
    return get_content_batch(batch_id)


def _row_to_item(row):
    return {
        "id": row["id"],
        "batch_id": row["batch_id"],
        "expedition_id": row["expedition_id"],
        "expedition_name": row["expedition_name"],
        "theme_id": row["theme_id"],
        "theme_name": row["theme_name"],
        "item_order": row["item_order"],
        "caption_text": row["caption_text"],
        "search_keyword": row["search_keyword"],
        "text_status": row["text_status"],
        "text_error": row["text_error"],
        "photo_status": row["photo_status"],
        "photo_error": row["photo_error"],
        "photo_path": row["photo_path"],
        "unsplash_photo_id": row["unsplash_photo_id"],
        "photographer_name": row["photographer_name"],
        "photographer_url": row["photographer_url"],
        "theme_summary": row["theme_summary"],
        "scheduled_post_id": row["scheduled_post_id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def add_content_items(items):
    """Insere uma lista de content_items de uma vez."""
    with _connect() as conn:
        for item in items:
            conn.execute(
                """INSERT INTO content_items
                   (id, batch_id, expedition_id, expedition_name, theme_id, theme_name,
                    item_order, caption_text, search_keyword, text_status, text_error,
                    photo_status, photo_error, photo_path, unsplash_photo_id,
                    photographer_name, photographer_url, theme_summary, scheduled_post_id,
                    created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    item["id"],
                    item["batch_id"],
                    item["expedition_id"],
                    item.get("expedition_name", ""),
                    item["theme_id"],
                    item.get("theme_name", ""),
                    item["item_order"],
                    item.get("caption_text", ""),
                    item.get("search_keyword", ""),
                    item.get("text_status", "pending"),
                    item.get("text_error", ""),
                    item.get("photo_status", "pending"),
                    item.get("photo_error", ""),
                    item.get("photo_path", ""),
                    item.get("unsplash_photo_id", ""),
                    item.get("photographer_name", ""),
                    item.get("photographer_url", ""),
                    item.get("theme_summary", ""),
                    item.get("scheduled_post_id", ""),
                    item.get("created_at"),
                    item.get("updated_at"),
                ),
            )


def list_content_items(batch_id=None, expedition_id=None, theme_id=None):
    query = "SELECT * FROM content_items WHERE 1=1"
    params = []
    if batch_id:
        query += " AND batch_id = ?"
        params.append(batch_id)
    if expedition_id:
        query += " AND expedition_id = ?"
        params.append(expedition_id)
    if theme_id:
        query += " AND theme_id = ?"
        params.append(theme_id)
    query += " ORDER BY expedition_id, theme_id, item_order"
    with _connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [_row_to_item(r) for r in rows]


def get_content_item(item_id):
    with _connect() as conn:
        row = conn.execute("SELECT * FROM content_items WHERE id = ?", (item_id,)).fetchone()
    return _row_to_item(row) if row else None


def update_content_item(item_id, fields):
    allowed = {
        "caption_text": lambda v: v,
        "search_keyword": lambda v: v,
        "text_status": lambda v: v,
        "text_error": lambda v: v,
        "photo_status": lambda v: v,
        "photo_error": lambda v: v,
        "photo_path": lambda v: v,
        "unsplash_photo_id": lambda v: v,
        "photographer_name": lambda v: v,
        "photographer_url": lambda v: v,
        "theme_summary": lambda v: v,
        "scheduled_post_id": lambda v: v,
        "updated_at": lambda v: v,
    }
    sets, values = [], []
    for key, transform in allowed.items():
        if key in fields:
            sets.append(f"{key} = ?")
            values.append(transform(fields[key]))
    if not sets:
        return get_content_item(item_id)
    values.append(item_id)
    with _connect() as conn:
        conn.execute(f"UPDATE content_items SET {', '.join(sets)} WHERE id = ?", values)
    return get_content_item(item_id)


def cancel_pending_content_items(batch_id):
    """Marca como erro (Cancelado) todo item pendente de texto/foto da leva.

    Usado ao cancelar uma leva: tira os itens da fila do worker Unsplash
    (que so pega photo_status='pending') e impede a thread de geracao de
    texto de continuar processando temas ja marcados como erro.
    """
    from datetime import datetime
    now = datetime.utcnow().isoformat()
    with _connect() as conn:
        conn.execute(
            """UPDATE content_items SET text_status = 'error', text_error = 'Cancelado pelo usuário', updated_at = ?
               WHERE batch_id = ? AND text_status = 'pending'""",
            (now, batch_id),
        )
        conn.execute(
            """UPDATE content_items SET photo_status = 'error', photo_error = 'Cancelado pelo usuário', updated_at = ?
               WHERE batch_id = ? AND photo_status = 'pending'""",
            (now, batch_id),
        )


def get_pending_photo_items(limit=None):
    query = "SELECT * FROM content_items WHERE photo_status = 'pending' AND text_status = 'done' ORDER BY created_at"
    if limit:
        query += f" LIMIT {int(limit)}"
    with _connect() as conn:
        rows = conn.execute(query).fetchall()
    return [_row_to_item(r) for r in rows]


def count_items_by_status(batch_id):
    with _connect() as conn:
        rows = conn.execute(
            "SELECT text_status, photo_status, COUNT(*) as c FROM content_items "
            "WHERE batch_id = ? GROUP BY text_status, photo_status",
            (batch_id,),
        ).fetchall()

    totals = {
        "text_pending": 0, "text_done": 0, "text_error": 0,
        "photo_pending": 0, "photo_done": 0, "photo_error": 0, "photo_skipped": 0,
        "total": 0,
    }
    for r in rows:
        c = r["c"]
        totals["total"] += c
        ts_key = f"text_{r['text_status']}"
        if ts_key in totals:
            totals[ts_key] += c
        ps_key = f"photo_{r['photo_status']}"
        if ps_key in totals:
            totals[ps_key] += c
    return totals
