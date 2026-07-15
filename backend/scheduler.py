"""
AutoPost WebApp - Agendador de publicacao

Uma thread em segundo plano que, a cada `interval` segundos, procura no banco
posts pendentes cuja hora de publicacao ja chegou e chama a funcao de
publicacao (injetada pelo app.py). Erros de um post nao derrubam os outros
nem o loop.

Roda dentro do proprio processo do servidor (gunicorn com 1 worker em
producao). Nao usa nada do Flask alem do que for passado, entao nao precisa
de contexto de request.
"""

import threading
import time

_thread = None
_started = False
_lock = threading.Lock()


def is_running():
    return _started


def start(get_due_fn, publish_fn, interval=60, on_log=None):
    """Inicia o loop do agendador uma unica vez (thread-safe).

    - get_due_fn() -> lista de posts prontos para publicar (mais antigos 1o)
    - publish_fn(post) -> publica; deve levantar excecao em caso de falha
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
            print(f"[agendador] {msg}")

    def loop():
        log(f"iniciado (verificando a cada {interval}s)")
        while True:
            try:
                due = get_due_fn()
                for post in due:
                    try:
                        publish_fn(post)
                    except Exception as e:
                        log(f"falha ao publicar post {post.get('id')}: {e}")
            except Exception as e:
                log(f"erro no loop do agendador: {e}")
            time.sleep(interval)

    _thread = threading.Thread(target=loop, name="autopost-scheduler", daemon=True)
    _thread.start()
