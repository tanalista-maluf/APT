#!/bin/bash
# Roda baixar_fotos_unsplash.py de hora em hora, automaticamente,
# até que todos os itens tenham sido baixados (sem precisar você ficar
# digitando o comando toda hora).
#
# COMO USAR
#   cd ~/Desktop/Round\ 2
#   chmod +x rodar_a_cada_hora.sh
#   ./rodar_a_cada_hora.sh
#
# Deixe essa janela do Terminal aberta e o Mac ligado (sem dormir) até
# o script avisar "TUDO CONCLUÍDO". Se fechar o Terminal, ele para.

SCRIPT="baixar_fotos_unsplash.py"
LOG="log_download_fotos.txt"
MAX_RODADAS=12          # margem de segurança (375 itens / 50 por hora ~ 8 rodadas)
ESPERA_SEGUNDOS=3700    # um pouco mais que 1h, para garantir que a cota já renovou

echo "Iniciando automação — log completo em $LOG"
echo "" > "$LOG"

for i in $(seq 1 $MAX_RODADAS); do
    echo "===== Rodada $i — $(date) =====" | tee -a "$LOG"

    # roda o script e guarda a saída para checar se terminou ou foi pausado
    SAIDA=$(python3 "$SCRIPT" 2>&1)
    echo "$SAIDA" | tee -a "$LOG"

    if echo "$SAIDA" | grep -q "Pausado por limite"; then
        echo "Cota esgotada. Aguardando ~1h para a próxima rodada..." | tee -a "$LOG"
        # impede o Mac de dormir durante a espera
        caffeinate -i -t $ESPERA_SEGUNDOS
    else
        echo "" | tee -a "$LOG"
        echo "TUDO CONCLUÍDO — nenhuma pausa por limite nesta rodada." | tee -a "$LOG"
        exit 0
    fi
done

echo "Atingido o número máximo de rodadas ($MAX_RODADAS) sem concluir." | tee -a "$LOG"
echo "Confira o log e rode de novo se ainda faltar algo." | tee -a "$LOG"
