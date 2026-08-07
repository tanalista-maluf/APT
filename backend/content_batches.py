"""
AutoPost WebApp - Blueprint "Gerar Conteudo"

Transforma o roteiro de N expedicoes em posts de carrossel: gera os textos
(Claude, agrupado por tema) e as fotos (Unsplash, via unsplash_worker.py) em
background, e oferece agendamento de carrossel direto na tela quando cada
tema fica pronto.

Este modulo e um Blueprint separado (registrado em app.py) para nao inflar
ainda mais o app.py. Ele reaproveita `client`/`CLAUDE_MODEL`/`db`/
`PHOTOS_FOLDER`/`UNSPLASH_ACCESS_KEY`/`_persist_carousel_post` que sao
injetados por app.py via `init_app()`, em vez de reimportar tudo e criar
dependencia circular.
"""

import json
import os
import re
import threading
import unicodedata
from datetime import datetime

import requests
from flask import Blueprint, jsonify, request
from PIL import Image, ImageDraw, ImageFont

import db
import unsplash_worker
from expedition_presets import EXPEDITION_PRESETS

content_batches_bp = Blueprint("content_batches", __name__)

# Preenchidos por init_app() (chamado a partir de app.py logo apos criar o
# Flask app), pra evitar import circular com app.py.
_ctx = {
    "client": None,
    "claude_model": None,
    "photos_folder": None,
    "unsplash_access_key": "",
    "persist_carousel_post": None,
}

DEFAULT_THEMES = [
    {"name": "Cidades", "photo_count": 5},
    {"name": "Highlights", "photo_count": 5},
    {"name": "Pratos e Bebidas Típicas", "photo_count": 5},
    {"name": "Locais Instagramáveis", "photo_count": 5},
    {"name": "Dicas Práticas", "photo_count": 5},
]

MIN_PHOTO_COUNT = 3
MAX_PHOTO_COUNT = 9  # +1 capa = 10, limite de fotos por carrossel do Instagram

COVER_ITEM_ORDER = -1
COVER_LABEL = "30°S EXPLORERS CLUB"
FONTS_DIR = os.path.join(os.path.dirname(__file__), "static", "fonts")
FONT_PLAYFAIR = os.path.join(FONTS_DIR, "PlayfairDisplay.ttf")
FONT_CORMORANT = os.path.join(FONTS_DIR, "CormorantGaramond.ttf")
COVER_SIZE = 1080


def _clamp_photo_count(value):
    try:
        n = int(value)
    except (TypeError, ValueError):
        n = 5
    return max(MIN_PHOTO_COUNT, min(MAX_PHOTO_COUNT, n))

UNSPLASH_API_BASE = "https://api.unsplash.com"


# ============================================================
# Composicao da capa (Pillow)
# ============================================================

def _cover_font(path, size, variation=None):
    f = ImageFont.truetype(path, size)
    if variation:
        try:
            f.set_variation_by_name(variation)
        except Exception:
            pass
    return f


def _cover_center_crop(img, size):
    img = img.convert("RGB")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    return img.resize((size, size), Image.LANCZOS)


def _cover_wrap_text(draw, text, font_path, variation, start_size, min_size, max_width, max_lines):
    """Reduz o tamanho da fonte ate o texto quebrar em no maximo max_lines
    linhas cabendo em max_width. Retorna (linhas, font)."""
    size = start_size
    while size >= min_size:
        f = _cover_font(font_path, size, variation)
        words = text.split()
        lines = []
        current = ""
        for word in words:
            trial = f"{current} {word}".strip()
            bbox = draw.textbbox((0, 0), trial, font=f)
            if bbox[2] - bbox[0] <= max_width or not current:
                current = trial
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
        if len(lines) <= max_lines:
            return lines, f
        size -= 10
    # ultimo recurso: fonte minima, aceita quantas linhas precisar
    f = _cover_font(font_path, min_size, variation)
    return lines, f


def _render_cover_image(background_path, title_text, expedition_name, out_path):
    """Compoe a capa do carrossel: foto de fundo (Unsplash) + scrim escuro +
    rotulo/titulo/divisor/expedicao em tipografia serifada."""
    W = H = COVER_SIZE
    bg = Image.open(background_path)
    bg = _cover_center_crop(bg, W).convert("RGBA")

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle([0, 0, W, H], fill=(10, 15, 12, 100))
    # gradiente mais escuro na faixa central onde o texto fica
    band_top, band_bottom = int(H * 0.28), int(H * 0.78)
    od.rectangle([0, band_top, W, band_bottom], fill=(6, 10, 8, 90))

    img = Image.alpha_composite(bg, overlay)
    draw = ImageDraw.Draw(img)

    def draw_center(y, text, f, fill):
        bbox = draw.textbbox((0, 0), text, font=f)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        draw.text(((W - w) / 2 - bbox[0], y), text, font=f, fill=fill)
        return h

    max_width = W - 160

    # rotulo "30°S EXPLORERS CLUB" com letter-spacing manual
    f_label = _cover_font(FONT_CORMORANT, 34, b"SemiBold")
    label = " ".join(list(COVER_LABEL))
    y = 150
    y += draw_center(y, label, f_label, (210, 190, 140, 255)) + 60

    # titulo (quebra automatica, reduz fonte se necessario)
    title = (title_text or "").strip().upper()
    title_lines, f_title = _cover_wrap_text(draw, title, FONT_PLAYFAIR, b"Bold", 108, 48, max_width, 3)
    line_height = f_title.size + 14
    for line in title_lines:
        y += draw_center(y, line, f_title, (255, 255, 255, 255)) + 14
    y += 20

    # divisor decorativo: linha -- losango -- linha
    divider_w = 160
    cx = W / 2
    draw.line([(cx - divider_w, y), (cx - 22, y)], fill=(210, 190, 140, 255), width=2)
    draw.line([(cx + 22, y), (cx + divider_w, y)], fill=(210, 190, 140, 255), width=2)
    diamond = 9
    draw.polygon(
        [(cx, y - diamond), (cx + diamond, y), (cx, y + diamond), (cx - diamond, y)],
        fill=(210, 190, 140, 255),
    )
    y += 46

    # "NA {EXPEDICAO}"
    exp_text = f"NA {expedition_name or ''}".strip().upper()
    exp_lines, f_exp = _cover_wrap_text(draw, exp_text, FONT_CORMORANT, b"Medium", 56, 30, max_width, 2)
    for line in exp_lines:
        y += draw_center(y, line, f_exp, (235, 228, 210, 255)) + 8

    img.convert("RGB").save(out_path, "JPEG", quality=92)
    return out_path


def init_app(client, claude_model, photos_folder, unsplash_access_key, persist_carousel_post):
    _ctx["client"] = client
    _ctx["claude_model"] = claude_model
    _ctx["photos_folder"] = photos_folder
    _ctx["unsplash_access_key"] = unsplash_access_key
    _ctx["persist_carousel_post"] = persist_carousel_post


# ============================================================
# Helpers
# ============================================================

def _slugify(text, fallback):
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or fallback


def _now_iso():
    return datetime.now().isoformat()


def _theme_ready(items):
    """Todos os itens do tema (N fotos) com texto e foto prontos."""
    if not items:
        return False
    return all(it["text_status"] == "done" and it["photo_status"] == "done" for it in items)


def _derive_batch_status(stored_status, totals):
    """Deriva o status "de verdade" da leva a partir das contagens de itens,
    em vez de confiar cegamente no status gravado — texto pronto não quer
    dizer leva concluída, as fotos ainda podem estar pendentes/baixando."""
    if stored_status == "cancelled":
        return "cancelled"
    total = totals.get("total", 0)
    if total and totals.get("text_done") == total and totals.get("photo_done") == total:
        return "done"
    if totals.get("text_pending", 0) > 0 or totals.get("text_error", 0) > 0 and totals.get("text_done", 0) < total:
        return "generating_text"
    if totals.get("photo_pending", 0) > 0:
        return "downloading_photos"
    return stored_status


def _theme_text_schema(photo_count):
    return {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "description": f"Exatamente {photo_count} paragrafos sobre o tema, um por foto do carrossel",
                "items": {
                    "type": "object",
                    "properties": {
                        "caption_text": {"type": "string", "description": "Paragrafo curto em portugues do Brasil, legenda da foto individual"},
                        "search_keyword": {"type": "string", "description": "Termo de busca de foto no Unsplash, em ingles, objetivo (ex: 'lisbon alfama street')"},
                    },
                    "required": ["caption_text", "search_keyword"],
                    "additionalProperties": False,
                },
            },
            "cover_keyword": {
                "type": "string",
                "description": "Termo de busca no Unsplash, em ingles, para a FOTO DE FUNDO DA CAPA do carrossel (distinta das fotos dos itens): deve combinar a expedicao e o tema, visual e amplo (ex: 'scandinavian nordic city aerial dramatic sky')",
            },
        },
        "required": ["items", "cover_keyword"],
        "additionalProperties": False,
    }

THEME_SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "theme_summary": {"type": "string", "description": "Legenda final do post de carrossel, resumindo o tema (portugues do Brasil)"}
    },
    "required": ["theme_summary"],
    "additionalProperties": False,
}


def _generate_theme_text(expedition, theme):
    """1 chamada Claude: N paragrafos + N keywords de busca pra um tema."""
    client = _ctx["client"]
    photo_count = _clamp_photo_count(theme.get("photo_count", 5))
    prompt = f"""Você está criando o conteúdo de um carrossel de Instagram ({photo_count} fotos) sobre o tema "{theme['name']}" dentro da expedição "{expedition['name']}".

Roteiro completo da expedição (use como contexto e fonte de fatos reais):
---
{expedition.get('roteiro_text', '')}
---

Gere EXATAMENTE {photo_count} itens, um para cada foto do carrossel, cobrindo o tema "{theme['name']}" com base no roteiro acima. Se o roteiro não tiver {photo_count} momentos/lugares claramente distintos para esse tema, use o bom senso para dividir em {photo_count} partes coerentes (ex: {photo_count} ângulos, {photo_count} cidades, {photo_count} momentos do dia) — nunca invente lugares que não existem no roteiro.

Para cada item:
- "caption_text": um parágrafo curto (2-4 frases) em português do Brasil, tom autêntico e interessante, sem hashtags, sem emoji forçado, sem clichês tipo "momento especial" ou "sem palavras".
- "search_keyword": um termo de busca em inglês para encontrar uma foto real no Unsplash que combine com esse parágrafo (ex: "santorini blue dome church", "lisbon tram yellow"). Seja específico e visual, não genérico.

Além dos {photo_count} itens, gere também "cover_keyword": um termo de busca em inglês para a foto de FUNDO DA CAPA do carrossel (uma foto distinta das anteriores, mais ampla/atmosférica, que combine com a expedição "{expedition['name']}" e o tema "{theme['name']}" ao mesmo tempo — ex: "scandinavian nordic city aerial dramatic sky")."""

    message = client.messages.create(
        model=_ctx["claude_model"],
        max_tokens=2000,
        output_config={"format": {"type": "json_schema", "schema": _theme_text_schema(photo_count)}},
        messages=[{"role": "user", "content": prompt}],
    )
    response_text = next((b.text for b in message.content if b.type == "text"), "")
    data = json.loads(response_text)
    items = data.get("items", [])[:photo_count]
    while len(items) < photo_count:
        items.append({"caption_text": "", "search_keyword": theme["name"]})
    cover_keyword = str(data.get("cover_keyword", "")).strip() or f"{expedition['name']} {theme['name']}"
    return items, cover_keyword


def _generate_theme_summary(expedition, theme, captions):
    """1 chamada extra: legenda final do post (resumo, nao concatenacao)."""
    client = _ctx["client"]
    paragraphs = "\n".join(f"- {c}" for c in captions if c)
    prompt = f"""Você já escreveu os 5 parágrafos abaixo para um carrossel de Instagram sobre o tema "{theme['name']}" da expedição "{expedition['name']}":

{paragraphs}

Agora escreva a legenda FINAL do post (a que aparece no feed, não é a soma dos parágrafos). Deve resumir o tema de forma envolvente em 1-3 frases, tom autêntico e esperto, sem hashtags, sem clichês de Instagram."""

    message = client.messages.create(
        model=_ctx["claude_model"],
        max_tokens=500,
        output_config={"format": {"type": "json_schema", "schema": THEME_SUMMARY_SCHEMA}},
        messages=[{"role": "user", "content": prompt}],
    )
    response_text = next((b.text for b in message.content if b.type == "text"), "")
    data = json.loads(response_text)
    return data.get("theme_summary", "").strip()


def _run_generate_text(batch_id):
    """Roda em thread de background: 1 chamada de texto + 1 de resumo por tema."""
    batch = db.get_content_batch(batch_id)
    if not batch:
        return
    db.update_content_batch(batch_id, {"status": "generating_text", "updated_at": _now_iso()})

    expeditions = {e["id"]: e for e in batch["expeditions"]}
    themes = {t["id"]: t for t in batch["themes"]}

    items = db.list_content_items(batch_id=batch_id)
    by_theme = {}
    for it in items:
        by_theme.setdefault((it["expedition_id"], it["theme_id"]), []).append(it)

    for (expedition_id, theme_id), theme_items in by_theme.items():
        current = db.get_content_batch(batch_id)
        if not current or current.get("status") == "cancelled":
            return

        expedition = expeditions.get(expedition_id, {"name": theme_items[0]["expedition_name"]})
        theme = themes.get(theme_id, {"name": theme_items[0]["theme_name"]})
        theme_items.sort(key=lambda i: i["item_order"])
        cover_item = next((it for it in theme_items if it["item_order"] == COVER_ITEM_ORDER), None)
        photo_items = [it for it in theme_items if it["item_order"] != COVER_ITEM_ORDER]
        try:
            generated, cover_keyword = _generate_theme_text(expedition, theme)
            captions = []
            for item, gen in zip(photo_items, generated):
                caption = str(gen.get("caption_text", "")).strip()
                keyword = str(gen.get("search_keyword", "")).strip() or theme.get("name", "")
                db.update_content_item(item["id"], {
                    "caption_text": caption,
                    "search_keyword": keyword,
                    "text_status": "done",
                    "text_error": "",
                    "updated_at": _now_iso(),
                })
                captions.append(caption)

            if cover_item:
                photo_count = _clamp_photo_count(theme.get("photo_count", len(photo_items) or 5))
                cover_title = f"{photo_count:02d} {theme.get('name', '').upper()} IMPERDÍVEIS"
                db.update_content_item(cover_item["id"], {
                    "caption_text": cover_title,
                    "search_keyword": cover_keyword,
                    "text_status": "done",
                    "text_error": "",
                    "updated_at": _now_iso(),
                })

            summary = _generate_theme_summary(expedition, theme, captions)
            for item in theme_items:
                db.update_content_item(item["id"], {"theme_summary": summary, "updated_at": _now_iso()})
        except Exception as e:
            for item in theme_items:
                db.update_content_item(item["id"], {
                    "text_status": "error",
                    "text_error": str(e),
                    "updated_at": _now_iso(),
                })

    counts = db.count_items_by_status(batch_id)
    current = db.get_content_batch(batch_id)
    new_status = _derive_batch_status(current["status"] if current else "draft", counts)
    db.update_content_batch(batch_id, {"status": new_status, "updated_at": _now_iso()})


# ============================================================
# Worker Unsplash: funcoes injetadas em unsplash_worker.start()
# ============================================================

def _get_pending_photo_items():
    return db.get_pending_photo_items()


def _download_photo_for_item(item):
    """Busca 1 foto no Unsplash pra keyword do item, dispara o download
    trigger obrigatorio, baixa o arquivo e atualiza o content_item."""
    access_key = _ctx["unsplash_access_key"]
    if not access_key:
        raise RuntimeError("UNSPLASH_ACCESS_KEY nao configurada")

    headers = {"Authorization": f"Client-ID {access_key}"}
    keyword = item.get("search_keyword") or item.get("theme_name") or "travel"

    search_res = requests.get(
        f"{UNSPLASH_API_BASE}/search/photos",
        headers=headers,
        params={"query": keyword, "per_page": 1, "orientation": "squarish"},
        timeout=20,
    )
    unsplash_worker.handle_rate_limit(search_res)
    search_res.raise_for_status()
    results = search_res.json().get("results", [])
    if not results:
        db.update_content_item(item["id"], {
            "photo_status": "error",
            "photo_error": f"nenhuma foto encontrada para '{keyword}'",
            "updated_at": _now_iso(),
        })
        return

    photo = results[0]
    photo_id = photo["id"]

    # Download trigger obrigatorio pelas guidelines do Unsplash (conta pra
    # estatistica do fotografo, nao usar o link direto sem isso).
    trigger_res = requests.get(
        f"{UNSPLASH_API_BASE}/photos/{photo_id}/download",
        headers=headers,
        timeout=20,
    )
    unsplash_worker.handle_rate_limit(trigger_res)
    trigger_res.raise_for_status()

    raw_url = photo.get("urls", {}).get("raw") or photo.get("urls", {}).get("full")
    image_res = requests.get(raw_url, params={"w": 1600, "q": 85, "fm": "jpg"}, timeout=30)
    image_res.raise_for_status()

    filename = f"unsplash_{photo_id}.jpg"
    photo_path = os.path.join(_ctx["photos_folder"], filename)
    with open(photo_path, "wb") as f:
        f.write(image_res.content)

    final_relpath = f"data/photos/{filename}"

    if item.get("item_order") == COVER_ITEM_ORDER:
        try:
            cover_filename = f"unsplash_{photo_id}_cover.jpg"
            cover_path = os.path.join(_ctx["photos_folder"], cover_filename)
            _render_cover_image(
                background_path=photo_path,
                title_text=item.get("caption_text") or "",
                expedition_name=item.get("expedition_name") or "",
                out_path=cover_path,
            )
            final_relpath = f"data/photos/{cover_filename}"
        except Exception as e:
            db.update_content_item(item["id"], {
                "photo_status": "error",
                "photo_error": f"falha ao compor capa: {e}",
                "unsplash_photo_id": photo_id,
                "photographer_name": photo.get("user", {}).get("name", ""),
                "photographer_url": photo.get("user", {}).get("links", {}).get("html", ""),
                "updated_at": _now_iso(),
            })
            return

    db.update_content_item(item["id"], {
        "photo_status": "done",
        "photo_error": "",
        "photo_path": final_relpath,
        "unsplash_photo_id": photo_id,
        "photographer_name": photo.get("user", {}).get("name", ""),
        "photographer_url": photo.get("user", {}).get("links", {}).get("html", ""),
        "updated_at": _now_iso(),
    })


def ensure_worker_started():
    if _ctx["unsplash_access_key"]:
        unsplash_worker.start(_get_pending_photo_items, _download_photo_for_item)


# ============================================================
# Rotas
# ============================================================

@content_batches_bp.route("/api/content-batches/preset-expeditions", methods=["GET"])
def preset_expeditions():
    return jsonify({"expeditions": EXPEDITION_PRESETS})


@content_batches_bp.route("/api/content-batches", methods=["POST"])
def create_batch():
    try:
        data = request.json or {}
        name = (data.get("name") or "").strip()
        expeditions_in = data.get("expeditions") or []
        themes_in = data.get("themes") or DEFAULT_THEMES

        if not expeditions_in:
            return jsonify({"error": "Informe ao menos 1 expedição"}), 400
        if not themes_in:
            return jsonify({"error": "Informe ao menos 1 tema"}), 400

        batch_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

        used_exp_ids = set()
        expeditions = []
        for i, exp in enumerate(expeditions_in):
            eid = _slugify(exp.get("name", ""), f"expedicao-{i+1}")
            base_eid = eid
            n = 2
            while eid in used_exp_ids:
                eid = f"{base_eid}-{n}"
                n += 1
            used_exp_ids.add(eid)
            expeditions.append({
                "id": eid,
                "name": exp.get("name", "").strip() or f"Expedição {i+1}",
                "roteiro_text": exp.get("roteiro_text", ""),
            })

        used_theme_ids = set()
        themes = []
        for i, th in enumerate(themes_in):
            tid = _slugify(th.get("name", ""), f"tema-{i+1}")
            base_tid = tid
            n = 2
            while tid in used_theme_ids:
                tid = f"{base_tid}-{n}"
                n += 1
            used_theme_ids.add(tid)
            themes.append({
                "id": tid,
                "name": th.get("name", "").strip() or f"Tema {i+1}",
                "photo_count": _clamp_photo_count(th.get("photo_count", 5)),
            })

        batch = {
            "id": batch_id,
            "name": name or f"Leva {batch_id}",
            "expeditions": expeditions,
            "themes": themes,
            "status": "draft",
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }
        db.add_content_batch(batch)

        items = []
        for exp in expeditions:
            for th in themes:
                for order in range(COVER_ITEM_ORDER, th.get("photo_count", 5)):
                    items.append({
                        "id": f"{batch_id}_{exp['id']}_{th['id']}_{order}",
                        "batch_id": batch_id,
                        "expedition_id": exp["id"],
                        "expedition_name": exp["name"],
                        "theme_id": th["id"],
                        "theme_name": th["name"],
                        "item_order": order,
                        "created_at": _now_iso(),
                        "updated_at": _now_iso(),
                    })
        db.add_content_items(items)

        return jsonify({"success": True, "batch_id": batch_id, "total_items": len(items)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@content_batches_bp.route("/api/content-batches/<batch_id>/generate-text", methods=["POST"])
def generate_text(batch_id):
    if _ctx["client"] is None:
        return jsonify({"error": "CLAUDE_API_KEY não configurada no servidor."}), 503

    batch = db.get_content_batch(batch_id)
    if not batch:
        return jsonify({"error": "Leva não encontrada"}), 404

    thread = threading.Thread(target=_run_generate_text, args=(batch_id,), daemon=True)
    thread.start()

    db.update_content_batch(batch_id, {"status": "generating_text", "updated_at": _now_iso()})
    return jsonify({"success": True, "status": "generating_text"})


@content_batches_bp.route("/api/content-batches/<batch_id>/cancel", methods=["POST"])
def cancel_batch(batch_id):
    """Para a produção de texto/fotos da leva: marca itens pendentes como
    erro (tira o texto da thread de geração e as fotos da fila do worker
    Unsplash) e muda o status da leva para 'cancelled'."""
    batch = db.get_content_batch(batch_id)
    if not batch:
        return jsonify({"error": "Leva não encontrada"}), 404

    db.cancel_pending_content_items(batch_id)
    db.update_content_batch(batch_id, {"status": "cancelled", "updated_at": _now_iso()})
    return jsonify({"success": True, "status": "cancelled"})


@content_batches_bp.route("/api/content-batches/<batch_id>/start-photo-download", methods=["POST"])
def start_photo_download(batch_id):
    if not _ctx["unsplash_access_key"]:
        return jsonify({"error": "UNSPLASH_ACCESS_KEY não configurada no servidor."}), 503

    batch = db.get_content_batch(batch_id)
    if not batch:
        return jsonify({"error": "Leva não encontrada"}), 404

    ensure_worker_started()
    db.update_content_batch(batch_id, {"status": "downloading_photos", "updated_at": _now_iso()})
    return jsonify({"success": True, "status": "downloading_photos"})


@content_batches_bp.route("/api/content-batches/<batch_id>/progress", methods=["GET"])
def batch_progress(batch_id):
    batch = db.get_content_batch(batch_id)
    if not batch:
        return jsonify({"error": "Leva não encontrada"}), 404

    totals = db.count_items_by_status(batch_id)
    real_status = _derive_batch_status(batch["status"], totals)
    if real_status != batch["status"]:
        db.update_content_batch(batch_id, {"status": real_status, "updated_at": _now_iso()})
        batch["status"] = real_status
    items = db.list_content_items(batch_id=batch_id)

    grouped = {}
    for it in items:
        key = (it["expedition_id"], it["theme_id"])
        grouped.setdefault(key, []).append(it)

    themes_out = []
    for (expedition_id, theme_id), theme_items in grouped.items():
        theme_items.sort(key=lambda i: i["item_order"])
        themes_out.append({
            "expedition_id": expedition_id,
            "expedition_name": theme_items[0]["expedition_name"],
            "theme_id": theme_id,
            "theme_name": theme_items[0]["theme_name"],
            "ready": _theme_ready(theme_items),
            "scheduled": bool(theme_items[0]["scheduled_post_id"]),
            "items": theme_items,
        })

    themes_out.sort(key=lambda t: (t["expedition_id"], t["theme_id"]))

    photos_pending = totals["photo_pending"]
    est_hours = round(photos_pending / 25, 1) if photos_pending else 0

    return jsonify({
        "batch": batch,
        "totals": totals,
        "themes": themes_out,
        "estimated_hours_remaining": est_hours,
    })


@content_batches_bp.route("/api/content-batches", methods=["GET"])
def list_batches():
    batches = db.list_content_batches()
    for batch in batches:
        totals = db.count_items_by_status(batch["id"])
        batch["totals"] = totals
        real_status = _derive_batch_status(batch["status"], totals)
        if real_status != batch["status"]:
            db.update_content_batch(batch["id"], {"status": real_status, "updated_at": _now_iso()})
            batch["status"] = real_status
    return jsonify({"batches": batches})


@content_batches_bp.route("/api/content-batches/<batch_id>", methods=["GET"])
def get_batch(batch_id):
    batch = db.get_content_batch(batch_id)
    if not batch:
        return jsonify({"error": "Leva não encontrada"}), 404
    items = db.list_content_items(batch_id=batch_id)
    return jsonify({"batch": batch, "items": items})


@content_batches_bp.route("/api/content-batches/<batch_id>", methods=["DELETE"])
def delete_batch(batch_id):
    batch = db.get_content_batch(batch_id)
    if not batch:
        return jsonify({"error": "Leva não encontrada"}), 404

    # Apaga do disco as fotos baixadas que não viraram post agendado
    # (as agendadas continuam usadas pelo post em backend/data/photos).
    items = db.list_content_items(batch_id=batch_id)
    photos_folder = _ctx.get("photos_folder")
    if photos_folder:
        for item in items:
            if item["photo_path"] and not item["scheduled_post_id"]:
                full_path = os.path.join(photos_folder, os.path.basename(item["photo_path"]))
                try:
                    os.remove(full_path)
                except OSError:
                    pass

    db.delete_content_batch(batch_id)
    return jsonify({"success": True})


@content_batches_bp.route("/api/content-batches/<batch_id>/items/<item_id>/retry", methods=["POST"])
def retry_item(batch_id, item_id):
    item = db.get_content_item(item_id)
    if not item or item["batch_id"] != batch_id:
        return jsonify({"error": "Item não encontrado"}), 404

    batch = db.get_content_batch(batch_id)
    expeditions = {e["id"]: e for e in batch["expeditions"]}
    themes = {t["id"]: t for t in batch["themes"]}
    expedition = expeditions.get(item["expedition_id"], {"name": item["expedition_name"]})
    theme = themes.get(item["theme_id"], {"name": item["theme_name"]})

    try:
        if item["text_status"] == "error" or not item["caption_text"]:
            theme_items = db.list_content_items(batch_id=batch_id, expedition_id=item["expedition_id"], theme_id=item["theme_id"])
            theme_items.sort(key=lambda i: i["item_order"])
            cover_item = next((it for it in theme_items if it["item_order"] == COVER_ITEM_ORDER), None)
            photo_items = [it for it in theme_items if it["item_order"] != COVER_ITEM_ORDER]
            generated, cover_keyword = _generate_theme_text(expedition, theme)
            captions = []
            for it, gen in zip(photo_items, generated):
                caption = str(gen.get("caption_text", "")).strip()
                keyword = str(gen.get("search_keyword", "")).strip() or theme.get("name", "")
                db.update_content_item(it["id"], {
                    "caption_text": caption, "search_keyword": keyword,
                    "text_status": "done", "text_error": "", "updated_at": _now_iso(),
                })
                captions.append(caption)
            if cover_item:
                photo_count = _clamp_photo_count(theme.get("photo_count", len(photo_items) or 5))
                cover_title = f"{photo_count:02d} {theme.get('name', '').upper()} IMPERDÍVEIS"
                db.update_content_item(cover_item["id"], {
                    "caption_text": cover_title, "search_keyword": cover_keyword,
                    "text_status": "done", "text_error": "", "updated_at": _now_iso(),
                })
            summary = _generate_theme_summary(expedition, theme, captions)
            for it in theme_items:
                db.update_content_item(it["id"], {"theme_summary": summary, "updated_at": _now_iso()})

        item = db.get_content_item(item_id)
        if item["photo_status"] == "error" and item["text_status"] == "done":
            db.update_content_item(item_id, {"photo_status": "pending", "photo_error": "", "updated_at": _now_iso()})
            ensure_worker_started()

        return jsonify({"success": True, "item": db.get_content_item(item_id)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@content_batches_bp.route("/api/content-batches/<batch_id>/schedule-theme", methods=["POST"])
def schedule_theme(batch_id):
    try:
        data = request.json or {}
        expedition_id = data.get("expedition_id")
        theme_id = data.get("theme_id")
        schedule_date = data.get("schedule_date") or _now_iso()
        ig_account_id = data.get("ig_account_id")

        if not expedition_id or not theme_id:
            return jsonify({"error": "expedition_id e theme_id são obrigatórios"}), 400

        batch = db.get_content_batch(batch_id)
        if not batch:
            return jsonify({"error": "Leva não encontrada"}), 404
        theme_def = next((t for t in batch.get("themes", []) if t.get("id") == theme_id), None)
        expected_count = _clamp_photo_count(theme_def.get("photo_count", 5)) + 1 if theme_def else 6

        items = db.list_content_items(batch_id=batch_id, expedition_id=expedition_id, theme_id=theme_id)
        items.sort(key=lambda i: i["item_order"])
        if len(items) != expected_count or any(it["photo_status"] != "done" for it in items):
            return jsonify({"error": "Tema ainda não está pronto (faltam fotos)"}), 400
        if any(it["scheduled_post_id"] for it in items):
            return jsonify({"error": "Este tema já foi agendado"}), 400

        caption = items[0]["theme_summary"] or "\n\n".join(it["caption_text"] for it in items if it["caption_text"])
        photo_paths = [it["photo_path"] for it in items]

        post_id = _ctx["persist_carousel_post"](
            photo_paths=photo_paths,
            caption=caption,
            hashtags=[],
            location="",
            schedule_date=schedule_date,
            ig_account_id=ig_account_id,
        )

        for it in items:
            db.update_content_item(it["id"], {"scheduled_post_id": post_id, "updated_at": _now_iso()})

        return jsonify({"success": True, "post_id": post_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
