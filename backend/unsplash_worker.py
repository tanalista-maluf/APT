"""
AutoPost WebApp - Worker de download de fotos do Unsplash

Mesma logica de thread singleton do scheduler.py: uma thread daemon que fica
em loop buscando content_items com foto pendente (texto ja gerado) e baixando
a foto correspondente via API do Unsplash, respeitando o "download trigger"
obrigatorio das guidelines (GET /photos/:id/download) e o rate limit exposto
no header X-Ratelimit-Remaining.

Roda dentro do mesmo processo do servidor (1 worker gunicorn em producao,
mesmo pressuposto do scheduler.py). Todo o estado vive no SQLite, entao um
restart do processo so precisa chamar get_pending_fn() de novo para continuar
de onde parou.
"""

import threading
import time

_thread = None
_started = False
_lock = threading.Lock()

UNSPLASH_API_BASE = "https://api.unsplash.com"
SLEEP_BETWEEN_ITEMS = 5          # segundos entre fotos, mesmo com cota sobrando
POLL_WHEN_IDLE = 30              # segundos entre checagens quando nao ha pendencias
RATE_LIMIT_FLOOR = 1             # abaixo disso, espera ate a proxima hora cheia


def is_running():
    return _started


def start(get_pending_fn, download_fn, on_log=None):
    """Inicia o loop do worker uma unica vez (thread-safe).

    - get_pending_fn() -> lista de content_items com foto pendente
    - download_fn(item) -> baixa a foto e atualiza o item; deve levantar
      excecao em caso de falha (o loop marca photo_status='error' e segue)
    - on_log(msg) -> callback opcional para registrar mensagens
    """
    global _thread, _started
    with _lock:
        if _started:
            return
        _started = True

    def log(msg):
        if on_log:
            on_log(msg)
        else:
            print(f"[unsplash] {msg}")

    def loop():
        log("iniciado")
        while True:
            try:
                pending = get_pending_fn()
                if not pending:
                    time.sleep(POLL_WHEN_IDLE)
                    continue
                for item in pending:
                    try:
                        download_fn(item)
                    except Exception as e:
                        log(f"falha ao baixar foto do item {item.get('id')}: {e}")
                    time.sleep(SLEEP_BETWEEN_ITEMS)
            except Exception as e:
                log(f"erro no loop do worker: {e}")
                time.sleep(POLL_WHEN_IDLE)

    _thread = threading.Thread(target=loop, name="autopost-unsplash-worker", daemon=True)
    _thread.start()


def handle_rate_limit(response, log=print):
    """Le o header X-Ratelimit-Remaining e dorme ate a proxima hora cheia
    se a cota estiver no fim. Chamar apos toda requisicao a API do Unsplash."""
    remaining = response.headers.get("X-Ratelimit-Remaining")
    if remaining is None:
        return
    try:
        remaining = int(remaining)
    except ValueError:
        return
    if remaining <= RATE_LIMIT_FLOOR:
        import datetime
        now = datetime.datetime.now()
        next_hour = (now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1))
        wait_seconds = max(1, (next_hour - now).total_seconds())
        log(f"[unsplash] rate limit quase no fim (remaining={remaining}); dormindo {int(wait_seconds)}s ate a proxima hora")
        time.sleep(wait_seconds)
