# AutoPost WebApp - imagem de producao
# Build:  docker build -t autopost .
# Run:    docker run -p 8080:8080 --env-file backend/.env -v autopost_data:/data autopost

FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Dados (banco SQLite + fotos) ficam em /data. No Railway isso vira um
# "Railway Volume" montado nesse caminho (adicionado pela interface).
# NAO usar a instrucao Docker VOLUME aqui: o builder do Railway a rejeita.
# Para rodar via Docker puro, monte com: -v autopost_data:/data
ENV DATA_DIR=/data

EXPOSE 8080

# 1 worker + threads: mantem o limite de 1 req/s do Nominatim e evita
# concorrencia de escrita no SQLite. timeout alto porque a analise de
# foto com IA pode levar dezenas de segundos.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 8 --timeout 180 app:app"]
