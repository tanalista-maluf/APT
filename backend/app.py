"""
AutoPost WebApp - Backend Flask
Serve o frontend + API completa:
- Analise de fotos com Claude Vision (3 opcoes de legenda + hashtags
  baseadas na legenda e na localizacao da foto)
- Extracao de EXIF (camera, GPS, data)
- Geolocalizacao reversa (GPS -> nome do local)
- Fila de posts em banco SQLite, com edicao e cancelamento
- Protecao por senha opcional (defina APP_PASSWORD para ativar)

Local:    python3 app.py            -> http://localhost:1234
Producao: gunicorn app:app          -> porta definida pela variavel PORT
"""

from flask import Flask, request, jsonify, send_from_directory, session
from werkzeug.exceptions import HTTPException
from dotenv import load_dotenv
import anthropic
from PIL import Image, ExifTags, ImageOps
import hmac
import os
import json
import base64
import io
import secrets
import requests
import threading
import time
from datetime import datetime, timedelta

import db
import instagram
import scheduler

# Suporte a HEIC/HEIF (formato padrao de fotos do iPhone).
# Sem isso, o Pillow nao consegue abrir nem ler EXIF de fotos .heic.
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIC_SUPPORT = True
except ImportError:
    HEIC_SUPPORT = False

load_dotenv()

DATA_FOLDER = db.DATA_DIR
PHOTOS_FOLDER = os.path.join(DATA_FOLDER, "photos")
os.makedirs(PHOTOS_FOLDER, exist_ok=True)

db.init_db()

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-4-8")
APP_PASSWORD = os.getenv("APP_PASSWORD", "").strip()
AUTH_ENABLED = bool(APP_PASSWORD)

META_APP_ID = os.getenv("META_APP_ID", "").strip()
META_APP_SECRET = os.getenv("META_APP_SECRET", "").strip()

# URL publica HTTPS do app (ex: https://apt.30s.world).
# O Instagram precisa dela para BUSCAR a foto na hora de publicar - por isso
# a publicacao real so funciona com o app publicado na internet, nao no localhost.
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")

# Endereco do site do clube - usado no link "voltar ao 30ºS" da barra lateral.
CLUB_URL = os.getenv("CLUB_URL", "https://www.30s.world").strip()

client = anthropic.Anthropic(api_key=CLAUDE_API_KEY) if CLAUDE_API_KEY else None


def _load_secret_key():
    """Chave usada para assinar o cookie de sessao (login).

    Persistida em disco para que o login sobreviva a reinicios do servidor.
    Pode ser definida via variavel de ambiente SECRET_KEY.
    """
    env_key = os.getenv("SECRET_KEY")
    if env_key:
        return env_key
    key_file = os.path.join(DATA_FOLDER, ".secret_key")
    try:
        if os.path.exists(key_file):
            with open(key_file, "r") as f:
                key = f.read().strip()
                if key:
                    return key
        key = secrets.token_hex(32)
        with open(key_file, "w") as f:
            f.write(key)
        return key
    except OSError:
        return secrets.token_hex(32)


app = Flask(__name__, static_folder="static", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 30 * 1024 * 1024  # 30MB por requisicao (fotos em base64 sao ~33% maiores que o arquivo original)
app.config["SECRET_KEY"] = _load_secret_key()
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.getenv("COOKIE_SECURE", "0") == "1"
app.permanent_session_lifetime = timedelta(days=30)


@app.after_request
def add_cors_headers(response):
    """CORS manual, sem depender do pacote flask-cors."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return response


@app.errorhandler(413)
def handle_too_large(e):
    return jsonify({"error": "Arquivo muito grande. Tente uma foto menor (limite: 30MB)."}), 413


@app.errorhandler(500)
def handle_server_error(e):
    return jsonify({"error": "Erro interno no servidor. Verifique o terminal para detalhes."}), 500


# ============================================================
# Autenticacao (ativa somente se APP_PASSWORD estiver definida)
# ============================================================

AUTH_PUBLIC_PATHS = {"/api/health", "/api/login", "/api/auth-status", "/auth/callback"}


@app.before_request
def require_auth():
    if not AUTH_ENABLED or request.method == "OPTIONS":
        return None
    path = request.path
    needs_auth = (path.startswith("/api/") and path not in AUTH_PUBLIC_PATHS) or path.startswith("/data/")
    if needs_auth and not session.get("authed"):
        return jsonify({"error": "Login necessário", "auth_required": True}), 401
    return None


@app.route("/api/auth-status", methods=["GET"])
def auth_status():
    return jsonify({
        "auth_required": AUTH_ENABLED,
        "authenticated": (not AUTH_ENABLED) or bool(session.get("authed")),
    })


@app.route("/api/login", methods=["POST"])
def login():
    if not AUTH_ENABLED:
        return jsonify({"success": True})
    data = request.json or {}
    password = str(data.get("password", ""))
    if hmac.compare_digest(password, APP_PASSWORD):
        session.permanent = True
        session["authed"] = True
        return jsonify({"success": True})
    return jsonify({"error": "Senha incorreta"}), 401


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


# ============================================================
# Helpers
# ============================================================

def decode_base64_image(photo_base64):
    if "," in photo_base64:
        photo_base64 = photo_base64.split(",")[1]
    return base64.b64decode(photo_base64)


def convert_to_degrees(value):
    """Converte coordenadas GPS EXIF (graus, minutos, segundos) para decimal."""
    try:
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return None


def extract_exif_data(image_bytes):
    """Extrai dados EXIF de uma imagem: camera, data, GPS, config."""
    result = {
        "cameraModel": "Desconhecido",
        "dateTime": "",
        "latitude": None,
        "longitude": None,
        "focalLength": "",
        "aperture": "",
        "iso": "",
        "exposureTime": "",
        "flashUsed": False,
        "locationName": ""
    }

    try:
        image = Image.open(io.BytesIO(image_bytes))

        # Usa a API publica getexif() (funciona em JPEG, HEIC, PNG, etc),
        # em vez do metodo legado _getexif() que so e confiavel para JPEG.
        exif_raw = image.getexif()

        if not exif_raw:
            return result

        exif = {ExifTags.TAGS.get(k, k): v for k, v in exif_raw.items()}

        # Camera
        make = exif.get("Make", "")
        model = exif.get("Model", "")
        if make or model:
            result["cameraModel"] = f"{make} {model}".strip()

        # Data
        if "DateTimeOriginal" in exif:
            result["dateTime"] = str(exif["DateTimeOriginal"])
        elif "DateTime" in exif:
            result["dateTime"] = str(exif["DateTime"])

        # Config
        if "FocalLength" in exif:
            try:
                result["focalLength"] = str(round(float(exif["FocalLength"]), 1))
            except Exception:
                pass

        if "FNumber" in exif:
            try:
                result["aperture"] = str(round(float(exif["FNumber"]), 1))
            except Exception:
                pass

        if "ISOSpeedRatings" in exif:
            result["iso"] = str(exif["ISOSpeedRatings"])

        if "ExposureTime" in exif:
            try:
                result["exposureTime"] = str(exif["ExposureTime"])
            except Exception:
                pass

        if "Flash" in exif:
            result["flashUsed"] = bool(exif["Flash"] and exif["Flash"] % 2 == 1)

        # GPS - IFD separado, acessado via get_ifd (API publica e universal)
        gps_info = None
        try:
            gps_info = exif_raw.get_ifd(0x8825)  # tag padrao "GPSInfo"
        except Exception:
            gps_info = exif.get("GPSInfo")

        if gps_info:
            gps_tags = {ExifTags.GPSTAGS.get(k, k): v for k, v in gps_info.items()}

            lat = gps_tags.get("GPSLatitude")
            lat_ref = gps_tags.get("GPSLatitudeRef")
            lon = gps_tags.get("GPSLongitude")
            lon_ref = gps_tags.get("GPSLongitudeRef")

            if lat and lon:
                latitude = convert_to_degrees(lat)
                longitude = convert_to_degrees(lon)

                if latitude is not None and lat_ref == "S":
                    latitude = -latitude
                if longitude is not None and lon_ref == "W":
                    longitude = -longitude

                result["latitude"] = latitude
                result["longitude"] = longitude

    except Exception as e:
        print(f"Erro ao extrair EXIF: {e}")

    return result


_geocode_lock = threading.Lock()
_last_geocode_time = 0.0


def reverse_geocode(latitude, longitude):
    """Usa Nominatim (OpenStreetMap) para achar o nome do local mais proximo.

    Nominatim exige no maximo 1 requisicao por segundo. Se varias fotos forem
    processadas ao mesmo tempo (varias abas/threads), esse lock garante que
    as chamadas fiquem em fila com pelo menos 1.1s de intervalo entre elas,
    evitando bloqueio temporario do servico.
    """
    global _last_geocode_time

    with _geocode_lock:
        elapsed = time.time() - _last_geocode_time
        if elapsed < 1.1:
            time.sleep(1.1 - elapsed)

        try:
            result = _do_reverse_geocode(latitude, longitude)
        finally:
            _last_geocode_time = time.time()

    return result


def _do_reverse_geocode(latitude, longitude):
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "json",
            "zoom": 16
        }
        headers = {"User-Agent": "AutoPostApp/1.0"}
        response = requests.get(url, params=params, headers=headers, timeout=5)

        if response.status_code == 200:
            data = response.json()
            address = data.get("address", {})

            # Tenta achar o nome mais especifico primeiro
            name = (
                address.get("attraction") or
                address.get("tourism") or
                address.get("leisure") or
                address.get("neighbourhood") or
                address.get("suburb") or
                address.get("city") or
                address.get("town") or
                address.get("village") or
                data.get("display_name", "").split(",")[0]
            )
            city = address.get("city") or address.get("town") or address.get("municipality") or ""

            if name and city and name != city:
                return f"{name}, {city}"
            return name or data.get("display_name", "Local desconhecido")

    except Exception as e:
        print(f"Erro na geolocalizacao reversa: {e}")

    return ""


# ============================================================
# Claude Vision
# ============================================================

# Schema do JSON que o Claude deve devolver na analise da foto.
# Com structured outputs a resposta sempre vem como JSON valido nesse
# formato - sem markdown, sem texto solto, sem parsing fragil.
ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "content_type": {
            "type": "string",
            "description": "Tipo de conteudo da foto (paisagem, retrato, comida, evento, natureza, arquitetura, etc)"
        },
        "captions": {
            "type": "array",
            "description": "Exatamente 3 opcoes de legenda, cada uma com estilo diferente",
            "items": {
                "type": "object",
                "properties": {
                    "style": {"type": "string", "description": "Nome curto do estilo em portugues"},
                    "text": {"type": "string", "description": "Texto da legenda"}
                },
                "required": ["style", "text"],
                "additionalProperties": False
            }
        },
        "hashtags": {
            "type": "array",
            "description": "8 a 12 hashtags, comecando com #",
            "items": {"type": "string"}
        }
    },
    "required": ["content_type", "captions", "hashtags"],
    "additionalProperties": False
}

HASHTAGS_SCHEMA = {
    "type": "object",
    "properties": {
        "hashtags": {
            "type": "array",
            "description": "8 a 12 hashtags, comecando com #",
            "items": {"type": "string"}
        }
    },
    "required": ["hashtags"],
    "additionalProperties": False
}


def _clean_hashtags(hashtags):
    """Garante formato #semespacos e remove duplicadas preservando a ordem."""
    seen = set()
    cleaned = []
    for tag in hashtags or []:
        tag = str(tag).strip().replace(" ", "")
        if not tag:
            continue
        if not tag.startswith("#"):
            tag = "#" + tag
        if tag.lower() not in seen:
            seen.add(tag.lower())
            cleaned.append(tag)
    return cleaned[:15]


def _claude_error_response(e):
    """Converte erros da API do Claude em mensagens claras para o frontend."""
    if isinstance(e, anthropic.AuthenticationError):
        return jsonify({"error": "Chave da API do Claude inválida. Confira CLAUDE_API_KEY no arquivo .env."}), 502
    if isinstance(e, anthropic.RateLimitError):
        return jsonify({"error": "Muitas análises seguidas. Aguarde alguns segundos e tente novamente."}), 429
    if isinstance(e, anthropic.NotFoundError):
        return jsonify({"error": f"Modelo '{CLAUDE_MODEL}' não encontrado. Confira CLAUDE_MODEL no .env."}), 502
    if isinstance(e, anthropic.APIStatusError):
        return jsonify({"error": f"Erro na API do Claude ({e.status_code}). Tente novamente."}), 502
    if isinstance(e, anthropic.APIConnectionError):
        return jsonify({"error": "Sem conexão com a API do Claude. Verifique sua internet."}), 502
    return jsonify({"error": str(e)}), 500


@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    """Analisa a foto com Claude Vision.

    Recebe a foto + contexto opcional (local vindo do GPS, data) e devolve:
    - 3 opcoes de legenda em estilos diferentes
    - hashtags baseadas no conteudo da foto, nas legendas e no local
    """
    if client is None:
        return jsonify({"error": "CLAUDE_API_KEY não configurada no servidor."}), 503

    try:
        data = request.json
        photo_base64 = data.get("photo")
        location = (data.get("location") or "").strip()
        photo_date = (data.get("date") or "").strip()

        if not photo_base64:
            return jsonify({"error": "Foto e obrigatoria"}), 400

        if "," in photo_base64:
            photo_base64_clean = photo_base64.split(",")[1]
        else:
            photo_base64_clean = photo_base64

        context_lines = []
        if location:
            context_lines.append(f"- Local onde a foto foi tirada (do GPS): {location}")
        if photo_date:
            context_lines.append(f"- Data da foto: {photo_date}")
        context_block = ""
        if context_lines:
            context_block = "\nContexto da foto:\n" + "\n".join(context_lines) + "\n"

        location_rule = (
            f"- Inclua 2 a 4 hashtags do local ({location}) — cidade, país e/ou ponto turístico"
            if location else
            "- A foto não tem localização; use apenas hashtags do conteúdo"
        )

        prompt = f"""Analise esta foto para um post de Instagram.
{context_block}
Crie EXATAMENTE 3 opções de legenda em português do Brasil, cada uma com um estilo diferente:
1. style "Estilo Maluf" — Pense em 3 camadas: o que está na foto, o contexto cultural/clichê esperado, e a subversão. A sacada pode ser trocadilho, duplo sentido, referência pop, ironia do clichê, ou resposta inesperada ao óbvio. Uma frase, máximo duas. O teste: "isso eu teria escrito". Ex: selfie de lado → "A verdadeira foto 'de perfil'" / frente ao Louvre sem 'segurar' a pirâmide → "Be different" / Rosslyn Chapel → "Não encontrei o Sr. Langdon por lá.."
2. style "Curta e direta" — no máximo 1 frase certeira, sem emoji. Atitude, não poesia.
3. style "Storytelling" — 2-3 frases contando algo real ou uma observação interessante sobre o momento. Sem melodrama.

Regras das legendas:
- Sem hashtags dentro das legendas
- Se houver local conhecido, pode mencioná-lo naturalmente
- Tom de pessoa real: autêntico, esperto, com atitude. NUNCA piegas, motivacional ou poético forçado.
- Emojis: no máximo 1 por legenda, e só se fizer sentido. Zero é melhor que forçar.
- Proibido: frases tipo "momento especial", "coração cheio", "gratidão", "alma lavada", "sem palavras", "que fase". Fuja de clichês de Instagram.

Depois crie de 8 a 12 hashtags baseadas no conteúdo da foto e nas legendas:
{location_rule}
- Misture hashtags populares e de nicho, em português e inglês
- Todas começando com #, sem espaços"""

        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2000,
            output_config={"format": {"type": "json_schema", "schema": ANALYSIS_SCHEMA}},
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": photo_base64_clean,
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        )

        response_text = next((b.text for b in message.content if b.type == "text"), "")
        analysis = json.loads(response_text)

        captions = [
            {"style": str(c.get("style", "Legenda")), "text": str(c.get("text", "")).strip()}
            for c in analysis.get("captions", [])
            if str(c.get("text", "")).strip()
        ][:3]
        hashtags = _clean_hashtags(analysis.get("hashtags", []))

        if not captions:
            captions = [{"style": "Legenda", "text": "Momento especial capturado. ✨"}]

        return jsonify({
            "success": True,
            "content_type": analysis.get("content_type", "conteudo"),
            "captions": captions,
            "caption": captions[0]["text"],  # compatibilidade: primeira opcao como padrao
            "hashtags": hashtags
        })

    except HTTPException:
        raise
    except json.JSONDecodeError:
        return jsonify({"error": "A IA retornou uma resposta inesperada. Tente novamente."}), 502
    except Exception as e:
        return _claude_error_response(e)


@app.route("/api/generate-hashtags", methods=["POST"])
def generate_hashtags():
    """Gera hashtags a partir da legenda atual + local (sem reanalizar a foto).

    Usado pelo botao "gerar hashtags da legenda" na tela de revisao - util
    depois que o usuario editou a legenda ou trocou o local.
    """
    if client is None:
        return jsonify({"error": "CLAUDE_API_KEY não configurada no servidor."}), 503

    try:
        data = request.json or {}
        caption = (data.get("caption") or "").strip()
        location = (data.get("location") or "").strip()
        content_type = (data.get("content_type") or "").strip()

        if not caption and not location:
            return jsonify({"error": "Escreva uma legenda (ou um local) primeiro."}), 400

        parts = ["Gere hashtags para um post de Instagram com base nisto:"]
        if caption:
            parts.append(f'Legenda: "{caption}"')
        if location:
            parts.append(f"Local da foto: {location}")
        if content_type:
            parts.append(f"Tipo de conteúdo: {content_type}")
        parts.append(
            "Regras: de 8 a 12 hashtags relevantes; misture populares e de nicho, "
            "em português e inglês; "
            + ("inclua 2 a 4 hashtags do local (cidade, país, ponto turístico); "
               if location else "")
            + "todas começando com # e sem espaços."
        )

        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=500,
            output_config={"format": {"type": "json_schema", "schema": HASHTAGS_SCHEMA}},
            messages=[{"role": "user", "content": "\n".join(parts)}],
        )

        response_text = next((b.text for b in message.content if b.type == "text"), "")
        result = json.loads(response_text)
        hashtags = _clean_hashtags(result.get("hashtags", []))

        return jsonify({"success": True, "hashtags": hashtags})

    except HTTPException:
        raise
    except json.JSONDecodeError:
        return jsonify({"error": "A IA retornou uma resposta inesperada. Tente novamente."}), 502
    except Exception as e:
        return _claude_error_response(e)


# ============================================================
# ENDPOINT: Reescrever legenda em outro "mood" (humor/tom)
# ============================================================

CAPTION_SCHEMA = {
    "type": "object",
    "properties": {
        "caption": {"type": "string", "description": "Legenda reescrita, sem hashtags"}
    },
    "required": ["caption"],
    "additionalProperties": False
}

# Cada mood e um botao na tela de revisao - a legenda atual e reescrita
# no tom escolhido, mantendo o assunto original.
MOOD_PROMPTS = {
    "maluf": (
        "estilo pessoal do dono do perfil. Pense em 3 camadas antes de escrever: "
        "1) O que está na foto (detalhe, pose, cenário, objeto). "
        "2) O contexto cultural invisível (o clichê que todo turista faz ali, a referência "
        "pop que o lugar evoca, o que 'se espera' de uma foto assim, o óbvio que todos diriam). "
        "3) A subversão — brinque com a expectativa, vire do avesso, faça o trocadilho "
        "que conecta o literal com o figurado, ou simplesmente ironize o clichê. "
        "A sacada pode vir de qualquer camada: um detalhe visual, um duplo sentido, "
        "uma referência cultural, ou a subversão do que é esperado. "
        "Uma frase só, no máximo duas. Tom conversacional. Sem emoji (máximo 1 se reforçar humor). "
        "NUNCA: piegas, motivacional, poético, turístico, ou explicar a piada. "
        "O teste: o dono olharia e diria 'isso eu teria escrito'. "
        "Exemplos reais com a lógica por trás: "
        "Selfie de lado → 'A verdadeira foto de perfil' (literal vs figurado) / "
        "Em frente ao Louvre, braço levantado sem 'segurar' a pirâmide → 'Be different' (subverte o clichê) / "
        "Rosslyn Chapel → 'Não encontrei o Sr. Langdon por lá..' (referência pop) / "
        "Vilarejo qualquer → 'Aqui, em 19 de julho de 1729 não aconteceu absolutamente nada' (anti-turístico) / "
        "Vulcão com lago dentro → 'O que tem dentro de um vulcão? Um lago congelado, claro.' (resposta óbvia inesperada) / "
        "Pôr do sol → 'Quase tão bonito quanto o do Guaíba' (bairrismo irônico)"
    ),
    "espirituosa": "autêntica, alegre e espirituosa — levemente engraçada, perspicaz, com uma ponta de ironia. Como alguém inteligente e bem-humorado escreveria. Sem melodrama, sem poesia barata, sem emoji forçado",
    "seca": "seca e certeira — poucas palavras, atitude, zero emoji. Como quem posta e não precisa explicar",
    "ironica": "irônica e afiada — deboche inteligente, sarcasmo elegante. Nunca grosseira, sempre esperta",
    "storyteller": "narrativa envolvente — conta o que aconteceu de verdade, com uma observação interessante ou um detalhe inesperado. Sem romantizar",
    "zoeira": "zoeira de grupo de amigos — descontraída, engraçada, sem filtro (mas com classe). Piada de quem estava lá",
    "cronica": "crônica urbana — tom de cronista brasileiro, observação afiada do cotidiano com humor sutil. Pense em Luis Fernando Verissimo ou Tati Bernardi",
}


@app.route("/api/rewrite-caption", methods=["POST"])
def rewrite_caption():
    """Reescreve a legenda atual num mood/tom escolhido pelo usuario."""
    if client is None:
        return jsonify({"error": "CLAUDE_API_KEY não configurada no servidor."}), 503

    try:
        data = request.json or {}
        caption = (data.get("caption") or "").strip()
        mood = (data.get("mood") or "").strip()
        location = (data.get("location") or "").strip()
        content_type = (data.get("content_type") or "").strip()

        mood_desc = MOOD_PROMPTS.get(mood)
        if not mood_desc:
            return jsonify({"error": "Mood inválido."}), 400

        parts = [f"Reescreva esta legenda de Instagram em português do Brasil, em um tom {mood_desc}:"]
        if caption:
            parts.append(f'Legenda atual: "{caption}"')
        if content_type:
            parts.append(f"Tipo de conteúdo da foto: {content_type}")
        if location:
            parts.append(f"Local da foto: {location}")
        parts.append(
            "Mantenha o mesmo assunto/contexto, apenas mude o tom. "
            "Sem hashtags. No máximo 3 frases curtas. "
            "Emojis: no máximo 1, e só se fizer sentido — zero é melhor que forçar. "
            "Proibido: frases piegas, clichês motivacionais, poesia barata, melodrama."
        )

        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=500,
            output_config={"format": {"type": "json_schema", "schema": CAPTION_SCHEMA}},
            messages=[{"role": "user", "content": "\n".join(parts)}],
        )

        response_text = next((b.text for b in message.content if b.type == "text"), "")
        result = json.loads(response_text)

        return jsonify({"success": True, "caption": str(result.get("caption", "")).strip()})

    except HTTPException:
        raise
    except json.JSONDecodeError:
        return jsonify({"error": "A IA retornou uma resposta inesperada. Tente novamente."}), 502
    except Exception as e:
        return _claude_error_response(e)


# ============================================================
# ENDPOINT: Informações do app e configurações
# ============================================================

@app.route("/api/app-info", methods=["GET"])
def app_info():
    return jsonify({
        "claude_model": CLAUDE_MODEL,
        "ai_configured": client is not None,
        "heic_support": HEIC_SUPPORT,
        "auth_enabled": AUTH_ENABLED,
        "public_base_url_set": bool(PUBLIC_BASE_URL),
        "club_url": CLUB_URL,
    })


@app.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify({"settings": db.get_settings()})


@app.route("/api/settings", methods=["PATCH"])
def patch_settings():
    data = request.json or {}
    allowed_keys = {"language"}
    fields = {k: v for k, v in data.items() if k in allowed_keys}
    if not fields:
        return jsonify({"error": "Nenhum campo válido para atualizar."}), 400
    return jsonify({"success": True, "settings": db.update_settings(fields)})


# ============================================================
# INTEGRACAO INSTAGRAM
# ============================================================
# As credenciais (id da conta + token) sao guardadas na tabela settings,
# preenchidas pela tela de Configuracoes. O token e sensivel; fica no banco
# (fora do git, no volume persistente do deploy).

def _ig_credentials(account_id=None):
    """Retorna (ig_user_id, access_token) da conta especificada ou da padrao."""
    if account_id:
        acct = db.get_ig_account(account_id)
    else:
        acct = db.get_default_ig_account()
    if not acct:
        return "", ""
    return acct["ig_user_id"], acct["access_token"]


def _public_photo_url(post):
    """Monta a URL publica HTTPS da foto de um post (o Instagram vai busca-la)."""
    if not PUBLIC_BASE_URL:
        raise instagram.InstagramError(
            "Falta definir PUBLIC_BASE_URL (o endereco publico do app). "
            "A publicacao real so funciona com o app publicado na internet."
        )
    token = db.get_media_token(post["id"])
    return f"{PUBLIC_BASE_URL}/public/media/{token}"


def publish_post(post):
    """Publica UM post no Instagram e atualiza seu status no banco.

    Usada tanto pelo agendador quanto pelo botao 'publicar agora'.
    Levanta InstagramError em caso de falha (e registra o erro no post).
    """
    ig_user_id, access_token = _ig_credentials(post.get("ig_account_id"))
    if not ig_user_id or not access_token:
        raise instagram.InstagramError("Conecte uma conta do Instagram nas Configurações.")

    try:
        image_url = _public_photo_url(post)
        caption = instagram.build_caption(post.get("caption", ""), post.get("hashtags", []))
        media_id = instagram.publish_photo(ig_user_id, access_token, image_url, caption)
    except instagram.InstagramError as e:
        db.update_post(post["id"], {
            "publish_error": str(e),
            "attempts": (post.get("attempts", 0) or 0) + 1,
        })
        raise

    db.update_post(post["id"], {
        "status": "posted",
        "posted_at": datetime.now().isoformat(),
        "ig_media_id": media_id,
        "publish_error": "",
    })
    print(f"[instagram] post {post['id']} publicado (media {media_id})")
    return media_id


@app.route("/api/instagram/accounts", methods=["GET"])
def instagram_accounts():
    accounts = db.list_ig_accounts()
    safe = [{"id": a["id"], "ig_user_id": a["ig_user_id"], "username": a["username"],
             "is_default": a["is_default"], "profile_picture_url": a.get("profile_picture_url", "")} for a in accounts]
    return jsonify({
        "accounts": safe,
        "public_base_url_set": bool(PUBLIC_BASE_URL),
        "meta_app_configured": bool(META_APP_ID and META_APP_SECRET),
    })


@app.route("/api/instagram/status", methods=["GET"])
def instagram_status():
    accounts = db.list_ig_accounts()
    default = next((a for a in accounts if a["is_default"]), accounts[0] if accounts else None)
    return jsonify({
        "connected": bool(default),
        "username": default["username"] if default else "",
        "ig_user_id": default["ig_user_id"] if default else "",
        "public_base_url_set": bool(PUBLIC_BASE_URL),
        "meta_app_configured": bool(META_APP_ID and META_APP_SECRET),
        "accounts": [{"id": a["id"], "ig_user_id": a["ig_user_id"], "username": a["username"],
                       "is_default": a["is_default"], "profile_picture_url": a.get("profile_picture_url", "")} for a in accounts],
    })


@app.route("/api/instagram/connect", methods=["POST"])
def instagram_connect():
    data = request.json or {}
    ig_user_id = str(data.get("ig_user_id", "")).strip()
    access_token = str(data.get("access_token", "")).strip()

    if not ig_user_id or not access_token:
        return jsonify({"error": "Informe o ID da conta e o token de acesso."}), 400

    if META_APP_ID and META_APP_SECRET:
        try:
            access_token, expires_in = instagram.exchange_long_lived_token(META_APP_ID, META_APP_SECRET, access_token)
        except instagram.InstagramError:
            expires_in = None
    else:
        expires_in = None

    try:
        info = instagram.get_account_info(ig_user_id, access_token)
    except instagram.InstagramError as e:
        return jsonify({"error": str(e)}), 502

    token_expires_at = None
    if expires_in:
        token_expires_at = (datetime.utcnow() + timedelta(seconds=int(expires_in))).isoformat()

    acct = db.add_ig_account(
        ig_user_id=info["id"],
        username=info.get("username", ""),
        access_token=access_token,
        token_expires_at=token_expires_at,
        profile_picture_url=info.get("profile_picture_url", ""),
    )

    return jsonify({"success": True, "username": info.get("username", ""), "account": {
        "id": acct["id"], "ig_user_id": acct["ig_user_id"], "username": acct["username"],
        "is_default": acct["is_default"], "profile_picture_url": acct.get("profile_picture_url", "")
    }})


@app.route("/api/instagram/disconnect", methods=["POST"])
def instagram_disconnect():
    data = request.json or {}
    account_id = data.get("account_id")
    if account_id:
        db.remove_ig_account(int(account_id))
    else:
        for acct in db.list_ig_accounts():
            db.remove_ig_account(acct["id"])
    return jsonify({"success": True})


@app.route("/api/instagram/set-default", methods=["POST"])
def instagram_set_default():
    data = request.json or {}
    account_id = data.get("account_id")
    if not account_id:
        return jsonify({"error": "Informe account_id."}), 400
    db.set_default_ig_account(int(account_id))
    return jsonify({"success": True})


@app.route("/auth/callback")
def oauth_callback():
    code = request.args.get("code")
    if not code:
        error = request.args.get("error_description", "Autorização negada.")
        return f"<h2>Erro</h2><p>{error}</p>", 400

    redirect_uri = (PUBLIC_BASE_URL or request.host_url.rstrip("/")) + "/auth/callback"

    try:
        resp = requests.get(f"https://graph.facebook.com/{instagram.GRAPH_VERSION}/oauth/access_token", params={
            "client_id": META_APP_ID,
            "client_secret": META_APP_SECRET,
            "redirect_uri": redirect_uri,
            "code": code,
        }, timeout=15)
        data = resp.json()
    except Exception as e:
        return f"<h2>Erro ao trocar código</h2><p>{e}</p>", 502

    if "error" in data:
        return f"<h2>Erro</h2><p>{data['error'].get('message', data['error'])}</p>", 400

    short_token = data["access_token"]

    try:
        long_token, expires_in = instagram.exchange_long_lived_token(META_APP_ID, META_APP_SECRET, short_token)
    except Exception:
        long_token, expires_in = short_token, None

    try:
        pages_resp = requests.get(f"https://graph.facebook.com/{instagram.GRAPH_VERSION}/me/accounts", params={
            "access_token": long_token,
            "fields": "id,name,instagram_business_account{id,username,profile_picture_url}",
        }, timeout=15)
        pages_data = pages_resp.json()
    except Exception as e:
        return f"<h2>Erro ao buscar páginas</h2><p>{e}</p>", 502

    connected = []
    for page in pages_data.get("data", []):
        ig = page.get("instagram_business_account")
        if not ig:
            continue
        ig_id = ig["id"]
        username = ig.get("username", "")
        pic = ig.get("profile_picture_url", "")
        page_token_resp = requests.get(f"https://graph.facebook.com/{instagram.GRAPH_VERSION}/{page['id']}", params={
            "fields": "access_token",
            "access_token": long_token,
        }, timeout=15).json()
        page_token = page_token_resp.get("access_token", long_token)
        try:
            ll_page_token, pg_expires = instagram.exchange_long_lived_token(META_APP_ID, META_APP_SECRET, page_token)
        except Exception:
            ll_page_token, pg_expires = page_token, expires_in
        token_expires_at = None
        if pg_expires:
            token_expires_at = (datetime.utcnow() + timedelta(seconds=int(pg_expires))).isoformat()
        db.add_ig_account(
            ig_user_id=ig_id,
            username=username,
            access_token=ll_page_token,
            token_expires_at=token_expires_at,
            profile_picture_url=pic,
        )
        connected.append(f"@{username}" if username else ig_id)

    if connected:
        names = ", ".join(connected)
        return f"""<html><body style="font-family:sans-serif;text-align:center;padding:40px">
        <h2>✅ Conectado com sucesso!</h2>
        <p>Contas vinculadas: <b>{names}</b></p>
        <p><a href="/">Voltar ao AutoPost</a></p>
        </body></html>"""
    else:
        return f"""<html><body style="font-family:sans-serif;text-align:center;padding:40px">
        <h2>⚠️ Nenhuma conta Instagram encontrada</h2>
        <p>Suas páginas do Facebook não têm contas Instagram Profissional vinculadas.</p>
        <p>Verifique se a conta é Profissional (Criador ou Empresa) e está vinculada a uma Página.</p>
        <p><a href="/">Voltar ao AutoPost</a></p>
        </body></html>"""


@app.route("/api/queue/<post_id>/publish-now", methods=["POST"])
def publish_now(post_id):
    post = db.get_post(post_id)
    if post is None:
        return jsonify({"error": "Post não encontrado"}), 404
    if post["status"] == "posted":
        return jsonify({"error": "Este post já foi publicado."}), 400

    data = request.json or {}
    if data.get("ig_account_id"):
        db.update_post(post_id, {"ig_account_id": int(data["ig_account_id"])})
        post = db.get_post(post_id)

    try:
        media_id = publish_post(post)
    except instagram.InstagramError as e:
        return jsonify({"error": str(e)}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"success": True, "ig_media_id": media_id, "post": db.get_post(post_id)})


# ============================================================
# ENDPOINT PUBLICO: servir a foto para o Instagram buscar
# ============================================================
# Sem senha (o Instagram nao faz login), mas acessivel apenas por um token
# aleatorio e impossivel de adivinhar, ligado a um post especifico.

@app.route("/public/media/<token>")
def public_media(token):
    post = db.get_post_by_media_token(token)
    if post is None:
        return jsonify({"error": "not found"}), 404
    filename = os.path.basename(post["photo_path"])
    return send_from_directory(PHOTOS_FOLDER, filename)


# ============================================================
# Agendador de publicacao: inicia no primeiro request. Assim roda tanto
# sob gunicorn (producao) quanto no servidor local, e nunca duplica sob o
# reloader do Flask - porque so o processo que atende requests chega aqui.
# ============================================================

SCHEDULER_ENABLED = os.getenv("ENABLE_SCHEDULER", "1").lower() in ("1", "true")


def _maybe_refresh_ig_tokens():
    """Renova tokens de todas as contas do Instagram quando faltam menos de 7 dias."""
    if not META_APP_ID or not META_APP_SECRET:
        return
    for acct in db.list_ig_accounts():
        expires_at = acct.get("token_expires_at", "")
        if not expires_at or not acct["access_token"]:
            continue
        try:
            expiry = datetime.fromisoformat(expires_at)
            days_left = (expiry - datetime.utcnow()).total_seconds() / 86400
            if days_left > 7:
                continue
            new_token, new_expires = instagram.refresh_long_lived_token(
                META_APP_ID, META_APP_SECRET, acct["access_token"]
            )
            new_expiry = None
            if new_expires:
                new_expiry = (datetime.utcnow() + timedelta(seconds=int(new_expires))).isoformat()
            db.update_ig_account_token(acct["ig_user_id"], new_token, new_expiry)
            print(f"[instagram] token renovado para @{acct['username']}")
        except Exception as e:
            print(f"[instagram] falha ao renovar token de @{acct['username']}: {e}")


def _get_due_and_refresh():
    """Wrapper que verifica renovacao do token antes de buscar posts."""
    _maybe_refresh_ig_tokens()
    return db.get_due_posts(datetime.now().isoformat())


@app.before_request
def _ensure_scheduler_started():
    if SCHEDULER_ENABLED:
        scheduler.start(
            get_due_fn=_get_due_and_refresh,
            publish_fn=publish_post,
            interval=int(os.getenv("SCHEDULER_INTERVAL", "60")),
        )


# ============================================================
# ROTAS DE FRONTEND
# ============================================================

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


# ============================================================
# ENDPOINT: Health check
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "service": "AutoPost WebApp Backend"
    })


# ============================================================
# ENDPOINT: Processar foto (normaliza formato + orientacao + EXIF + local)
# ============================================================
# Roda uma vez, assim que a foto e selecionada. Resolve 3 problemas de uma vez:
# 1. Fotos HEIC do iPhone viram JPEG (todo navegador consegue exibir)
# 2. Fotos "deitadas" (orientacao EXIF) sao corrigidas para a posicao certa
# 3. EXIF (camera, GPS) e extraido ANTES da conversao, senao se perde

@app.route("/api/process-photo", methods=["POST"])
def process_photo():
    try:
        data = request.json
        photo_base64 = data.get("photo")

        if not photo_base64:
            return jsonify({"error": "Foto e obrigatoria"}), 400

        original_bytes = decode_base64_image(photo_base64)

        # 1. Extrai EXIF do arquivo ORIGINAL (antes de qualquer conversao)
        exif_data = extract_exif_data(original_bytes)

        # 2. Geolocalizacao reversa se tiver GPS
        if exif_data["latitude"] is not None and exif_data["longitude"] is not None:
            exif_data["locationName"] = reverse_geocode(exif_data["latitude"], exif_data["longitude"])

        # 3. Abre a imagem (HEIC ou qualquer formato, com o opener registrado)
        image = Image.open(io.BytesIO(original_bytes))

        # 4. Corrige rotacao baseada na tag EXIF Orientation
        image = ImageOps.exif_transpose(image)

        # 5. Converte para RGB (HEIC/PNG podem vir em modos incompativeis com JPEG)
        if image.mode not in ("RGB",):
            image = image.convert("RGB")

        # 6. Redimensiona se for muito grande (economiza banda e custo de IA)
        max_dimension = 1600
        if max(image.size) > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.LANCZOS)

        # 7. Reencoda como JPEG
        output_buffer = io.BytesIO()
        image.save(output_buffer, format="JPEG", quality=87)
        normalized_bytes = output_buffer.getvalue()
        normalized_base64 = "data:image/jpeg;base64," + base64.b64encode(normalized_bytes).decode("utf-8")

        return jsonify({
            "success": True,
            "normalized_photo": normalized_base64,
            "exif": exif_data
        })

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "cannot identify image file" in error_msg and not HEIC_SUPPORT:
            error_msg += " (suporte a HEIC nao esta instalado no servidor)"
        return jsonify({"error": error_msg}), 500


# ============================================================
# ENDPOINT: Criar post na fila
# ============================================================

@app.route("/api/create-post", methods=["POST"])
def create_post():
    try:
        data = request.json
        photo_base64 = data.get("photo")
        caption = data.get("caption", "")
        hashtags = data.get("hashtags", [])
        location = data.get("location", "")
        tagged_people = data.get("tagged_people", [])
        schedule_date = data.get("schedule_date", datetime.now().isoformat())
        ig_account_id = data.get("ig_account_id")

        if not photo_base64:
            return jsonify({"error": "Foto e obrigatoria"}), 400

        if not ig_account_id:
            default = db.get_default_ig_account()
            if default:
                ig_account_id = default["id"]

        post_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        image_bytes = decode_base64_image(photo_base64)

        photo_filename = f"photo_{post_id}.jpg"
        photo_path = os.path.join(PHOTOS_FOLDER, photo_filename)
        with open(photo_path, "wb") as f:
            f.write(image_bytes)

        post = {
            "id": post_id,
            "photo_path": f"data/photos/{photo_filename}",
            "caption": caption,
            "hashtags": hashtags,
            "location": location,
            "tagged_people": tagged_people,
            "schedule_date": schedule_date,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "posted_at": None
        }

        db.add_post(post)
        if ig_account_id:
            db.update_post(post_id, {"ig_account_id": ig_account_id})

        return jsonify({
            "success": True,
            "post_id": post_id,
            "message": "Post adicionado a fila com sucesso"
        })

    except HTTPException:
        raise
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ENDPOINT: Listar fila
# ============================================================

@app.route("/api/queue", methods=["GET"])
def get_queue():
    try:
        return jsonify({"posts": db.list_posts()})
    except HTTPException:
        raise
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ENDPOINT: Editar post na fila
# ============================================================

@app.route("/api/queue/<post_id>", methods=["PATCH"])
def edit_post(post_id):
    try:
        data = request.json or {}
        post = db.update_post(post_id, data)
        if post is None:
            return jsonify({"error": "Post nao encontrado"}), 404
        return jsonify({"success": True, "post": post})

    except HTTPException:
        raise
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ENDPOINT: Cancelar/remover post da fila
# ============================================================

@app.route("/api/queue/<post_id>", methods=["DELETE"])
def delete_post(post_id):
    try:
        post = db.get_post(post_id)
        if post is None:
            return jsonify({"error": "Post nao encontrado"}), 404

        # Remove arquivo de foto (usa PHOTOS_FOLDER, a mesma variavel usada
        # para salvar, em vez de reconstruir o caminho a partir de __file__)
        photo_filename = os.path.basename(post["photo_path"])
        photo_full_path = os.path.join(PHOTOS_FOLDER, photo_filename)
        if os.path.exists(photo_full_path):
            os.remove(photo_full_path)

        db.delete_post(post_id)

        return jsonify({"success": True, "message": "Post removido da fila"})

    except HTTPException:
        raise
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ENDPOINT: Servir fotos salvas
# ============================================================

@app.route("/data/photos/<filename>")
def serve_photo(filename):
    return send_from_directory(PHOTOS_FOLDER, filename)


# ============================================================
# Executar servidor (modo local; em producao use gunicorn app:app)
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", os.getenv("SERVER_PORT", 1234)))
    debug = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true")

    print("=" * 60)
    print(f"AutoPost WebApp rodando em http://localhost:{port}")

    if not CLAUDE_API_KEY:
        print("AVISO: CLAUDE_API_KEY nao encontrada no .env")
        print("A analise de fotos com IA nao vai funcionar ate configurar.")
    else:
        print(f"Claude API configurada (modelo: {CLAUDE_MODEL})")

    if AUTH_ENABLED:
        print("Protecao por senha ATIVA (APP_PASSWORD definida)")
    else:
        print("Sem senha de acesso (defina APP_PASSWORD no .env para ativar)")

    if HEIC_SUPPORT:
        print("Suporte a HEIC/HEIF (fotos iPhone) ativo")
    else:
        print("Suporte a HEIC INATIVO - rode: pip3 install pillow-heif --break-system-packages")
        print("Sem isso, fotos .heic do iPhone podem falhar ao processar.")

    ig_user_id, ig_token = _ig_credentials()
    if ig_user_id and ig_token:
        print(f"Instagram conectado (conta {ig_user_id})")
    else:
        print("Instagram nao conectado (conecte em Configuracoes)")

    if PUBLIC_BASE_URL:
        print(f"URL publica: {PUBLIC_BASE_URL}")
    else:
        print("PUBLIC_BASE_URL nao definida - publicacao real so funciona apos o deploy")

    print(f"Agendador de publicacao: {'ativo' if SCHEDULER_ENABLED else 'desativado'}")
    print(f"Banco de dados: {db.DB_PATH}")
    print("=" * 60)
    app.run(debug=debug, host="0.0.0.0", port=port, threaded=True)
