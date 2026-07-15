#!/bin/bash
# AutoPost WebApp - Script de inicializacao
# Uso: ./start.sh

cd "$(dirname "$0")"

echo "🚀 AutoPost WebApp"
echo ""

# Verifica se as dependencias estao instaladas
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📦 Instalando dependências (primeira vez)..."
    pip3 install -r requirements.txt --break-system-packages
    echo ""
fi

# Mostra o IP local para acesso via celular
echo "📱 Para acessar de outro dispositivo na mesma rede Wi-Fi, use:"
ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print "   http://" $2 ":1234"}'
echo ""
echo "💻 Neste computador, acesse:"
echo "   http://localhost:1234"
echo ""
echo "Pressione Ctrl+C para parar o servidor."
echo "─────────────────────────────────────────"
echo ""

python3 app.py
