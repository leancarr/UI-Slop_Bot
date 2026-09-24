#!/usr/bin/env bash
# Loop de auditoría: intenta el audit completo cada N minutos hasta que
# la cuota gratuita de Gemini lo deje pasar. Log en .output/loop.log
# Uso: bash scripts/loop-audit.sh [url] [cada_segundos] [max_intentos]
set -u
URL="${1:-http://localhost:3000}"
EVERY="${2:-600}"
MAX="${3:-18}"
LOG=".output/loop.log"
mkdir -p .output
echo "[$(date -Is)] loop inicio url=$URL cada=${EVERY}s max=$MAX" >> "$LOG"
i=0
while [ "$i" -lt "$MAX" ]; do
  i=$((i+1))
  echo "[$(date -Is)] intento $i/$MAX" >> "$LOG"
  if ./node_modules/.bin/tsx src/cli.ts audit --url "$URL" --provider gemini >> "$LOG" 2>&1; then
    echo "[$(date -Is)] EXITO en intento $i" >> "$LOG"
    echo "EXITO intento $i"
    exit 0
  fi
  echo "[$(date -Is)] fallo, espero ${EVERY}s" >> "$LOG"
  sleep "$EVERY"
done
echo "[$(date -Is)] FIN sin exito tras $MAX intentos" >> "$LOG"
echo "FIN-SIN-EXITO"
exit 1
