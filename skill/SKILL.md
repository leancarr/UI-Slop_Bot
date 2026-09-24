# Skill ui-slop-bot (wrapper del CLI)

Audita píxeles renderizados, no código. Usa el CLI, no reimplementes.

## Cuándo usar
- El usuario pide auditar UI, detectar AI slop, revisar landing/dashboard.

## Cómo
```bash
pnpm audit -- --url http://localhost:3000 --provider gemini
# desktop con GPU AMD:
# pnpm audit -- --url http://localhost:3000 --provider ollama --model qwen2.5vl:7b
```
Leer `.output/report.json` y resumir: score, top 3 issues con fix, link a `.output/report.html`.

## Reglas
- Si score > 60 en CI (`--ci`), marcar fail.
- No pedir bboxes en px, el modelo usa cuadrantes 0-1000.
