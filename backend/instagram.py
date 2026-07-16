"""
AutoPost WebApp - Cliente da API oficial do Instagram (Graph API da Meta)

Publica uma foto num perfil Instagram Profissional (Comercial/Criador)
vinculado a uma Pagina do Facebook. O fluxo oficial tem 2 (as vezes 3) passos:

1. Cria um "container" de midia apontando para a URL PUBLICA da foto + legenda
2. (opcional) Verifica se o container terminou de processar
3. Publica o container

Requisitos que ficam por conta de quem configura (nao do codigo):
- Conta Instagram Profissional vinculada a uma Pagina do Facebook
- App da Meta com a permissao instagram_content_publish
- Um token de acesso valido (de preferencia de longa duracao, ~60 dias)
- A foto acessivel numa URL publica HTTPS (o servidor do Instagram a busca)

Limitacoes conhecidas da API de publicacao (v1 desta integracao):
- Marcar localizacao e marcar pessoas NAO sao suportados de forma simples
  pela API; por isso a localizacao/pessoas ficam guardadas no post mas nao
  vao para o Instagram automaticamente. As hashtags entram junto da legenda.
"""

import time
import requests

GRAPH_VERSION = "v21.0"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_VERSION}"


class InstagramError(Exception):
    """Erro tratado da API do Instagram, com mensagem amigavel em PT-BR."""
    pass


def _post(url, params, timeout=30):
    try:
        resp = requests.post(url, data=params, timeout=timeout)
    except requests.RequestException as e:
        raise InstagramError(f"Sem conexao com o Instagram: {e}")
    return _parse(resp)


def _get(url, params, timeout=30):
    try:
        resp = requests.get(url, params=params, timeout=timeout)
    except requests.RequestException as e:
        raise InstagramError(f"Sem conexao com o Instagram: {e}")
    return _parse(resp)


def _parse(resp):
    try:
        data = resp.json()
    except ValueError:
        raise InstagramError(f"Resposta inesperada do Instagram (HTTP {resp.status_code}).")

    if isinstance(data, dict) and data.get("error"):
        err = data["error"]
        msg = err.get("error_user_msg") or err.get("message") or "Erro desconhecido"
        raise InstagramError(f"Instagram: {msg}")

    if resp.status_code >= 400:
        raise InstagramError(f"Instagram retornou erro HTTP {resp.status_code}.")

    return data


def build_caption(caption, hashtags):
    """Junta legenda + hashtags no formato de um post do Instagram."""
    caption = (caption or "").strip()
    tags = [t if t.startswith("#") else "#" + t for t in (hashtags or []) if t]
    if tags:
        return (caption + "\n\n" + " ".join(tags)).strip()
    return caption


def get_account_info(ig_user_id, access_token):
    """Valida o token e devolve dados basicos da conta (username, nome).

    Usado na tela de configuracao para confirmar que a conexao funciona
    antes de salvar as credenciais.
    """
    data = _get(
        f"{GRAPH_BASE}/{ig_user_id}",
        {"fields": "username,name", "access_token": access_token},
    )
    return {
        "id": str(data.get("id", ig_user_id)),
        "username": data.get("username", ""),
        "name": data.get("name", ""),
    }


def publish_photo(ig_user_id, access_token, image_url, caption, poll_seconds=25):
    """Publica uma foto e devolve o id da midia publicada no Instagram.

    Levanta InstagramError com mensagem clara em qualquer falha.
    """
    if not ig_user_id or not access_token:
        raise InstagramError("Conta do Instagram nao configurada.")
    if not image_url or not image_url.startswith("http"):
        raise InstagramError(
            "A foto precisa estar num link publico (https). "
            "Isso so funciona com o app publicado na internet."
        )

    # 1. Cria o container
    container = _post(
        f"{GRAPH_BASE}/{ig_user_id}/media",
        {"image_url": image_url, "caption": caption or "", "access_token": access_token},
    )
    creation_id = container.get("id")
    if not creation_id:
        raise InstagramError("O Instagram nao retornou o id do container de midia.")

    # 2. Aguarda o container terminar de processar (a busca da imagem e async)
    deadline = time.time() + poll_seconds
    while time.time() < deadline:
        status = _get(
            f"{GRAPH_BASE}/{creation_id}",
            {"fields": "status_code,status", "access_token": access_token},
        )
        code = status.get("status_code")
        if code == "FINISHED":
            break
        if code == "ERROR":
            raise InstagramError(f"O Instagram rejeitou a imagem: {status.get('status', 'erro')}.")
        time.sleep(2)

    # 3. Publica
    published = _post(
        f"{GRAPH_BASE}/{ig_user_id}/media_publish",
        {"creation_id": creation_id, "access_token": access_token},
    )
    media_id = published.get("id")
    if not media_id:
        raise InstagramError("O Instagram nao confirmou a publicacao (sem id de midia).")

    return media_id


def exchange_long_lived_token(app_id, app_secret, short_token):
    """Troca um token de curta duracao por um de longa duracao (~60 dias).

    Opcional - util quando o usuario cola um token curto do Explorer da Meta.
    Retorna (novo_token, expires_in_seconds | None).
    """
    data = _get(
        f"{GRAPH_BASE}/oauth/access_token",
        {
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": short_token,
        },
    )
    return data.get("access_token", short_token), data.get("expires_in")


def refresh_long_lived_token(app_id, app_secret, current_token):
    """Renova um token de longa duracao por mais ~60 dias.

    A API da Meta permite renovar tokens de longa duracao que ainda nao
    expiraram. O token precisa ter pelo menos 24h de vida restante.
    Retorna (novo_token, expires_in_seconds | None).
    """
    data = _get(
        f"{GRAPH_BASE}/oauth/access_token",
        {
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": current_token,
        },
    )
    return data.get("access_token", current_token), data.get("expires_in")
