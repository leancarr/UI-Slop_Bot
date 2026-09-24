# UI-Slop Bot — Guía de uso

Auditor visual de UI Slop: captura tu app renderizada en 3 viewports y la evalúa
con visión (Gemini en la note, Ollama local en la desktop) contra la rúbrica de
10 clichés (`benchmark/cliches.yaml`). Devuelve Slop Score 0-100 + heatmap.

## Requisitos

- Node 20+, `pnpm` (`corepack enable`)
- La app a auditar corriendo (ej. `http://localhost:3000`)

```bash
pnpm install          # instala deps + Chromium (postinstall)
```

## Configuración

```bash
cp .env.example .env        # notebook: completar GEMINI_API_KEY
# o en desktop Windows:
# copy .env.desktop.example .env   (modo Ollama local, sin key)
```

| Variable | Dónde | Default |
|---|---|---|
| `GEMINI_API_KEY` | notebook | — (requerida para `--provider gemini`) |
| `GEMINI_MODEL` | notebook | `gemini-3.6-flash` (fallback `gemini-flash-latest`, `gemini-3.1-flash-lite`) |
| `OLLAMA_HOST` | desktop | `http://localhost:11434` |
| `OLLAMA_MODEL` | desktop | `qwen2.5vl:7b` |
| `PLAYWRIGHT_EXECUTABLE` | cualquiera | auto (usa el Chromium del postinstall o uno ya instalado) |

## Comandos

```bash
# Notebook (Gemini API)
pnpm audit:notebook
# = tsx src/cli.ts audit --url http://localhost:3000 --provider gemini

# Desktop Windows RX 7600 (Ollama local, gratis)
pnpm audit:desktop
# = tsx src/cli.ts audit --url http://localhost:3000 --provider ollama --model qwen2.5vl:7b

# Forma general
./node_modules/.bin/tsx src/cli.ts audit --url http://localhost:3000 --provider gemini --model gemini-3.6-flash
./node_modules/.bin/tsx src/cli.ts audit --url http://localhost:3000 --provider ollama --model qwen3-vl:8b

# Modo CI: exit 1 si score > 60
./node_modules/.bin/tsx src/cli.ts audit --url http://localhost:3000 --provider gemini --ci
```

Setup inicial en desktop Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1
# instala deps + Chromium + ollama pull qwen2.5vl:7b + crea .env
```

Si la cuota gratuita de Gemini está saturada (429/503), el CLI reintenta solo
con backoff y cambia de modelo; para dejarlo corriendo:

```bash
bash scripts/loop-audit.sh http://localhost:3000 600 18  # cada 10 min, 18 intentos
```

## Salidas (`.output/`, ignorado por git)

| Archivo | Qué es |
|---|---|
| `report.json` | `{score, verdict, issues:[{type, bbox, severity, evidence, fix}], model, viewports}` |
| `report.html` | Reporte visual + capturas |
| `shot-375/768/1440.png` | Screenshots redimensionados a 1024px (los que ve el modelo) |
| `raw-*.png` | Originales full-res |
| `context.json` | Fonts, headings y paleta extraídos del DOM (contexto para el modelo) |

`verdict`: `Clean` (<25), `Light Slop` (25-60), `High AI Slop` (>60).

## Skill (OpenCode)

`skill/SKILL.md` es un wrapper: no reimplementa nada, corre el CLI y resume
`.output/report.json` (score, top 3 issues con fix, link al HTML).

## Ejemplo real (fitt-app, 2026-09-24)

```bash
pnpm audit:notebook
# [1/3] capturando http://localhost:3000 ...
# [2/3] visión (gemini) ...
# [gemini] gemini-3.6-flash → 429 ... fallback → gemini-3.1-flash-lite OK
# [3/3] score 65
# → .output/report.html + .output/report.json
```

`report.json`: `score 65`, `verdict High AI Slop`, 3 issues —
`rounded-everywhere` (medium, 1440), `low-contrast` (medium, 1440),
`no-states` (high, 375: un ENOTFOUND crudo llega al usuario).
Cada issue trae `evidence` (1 frase) y `fix` (1 acción concreta).

## Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `Executable doesn't exist ... ms-playwright` | El Chromium del postinstall no bajó | `pnpm exec playwright install chromium` o setear `PLAYWRIGHT_EXECUTABLE` |
| `Gemini 429/503 tras 4 intentos` | Cuota gratuita saturada (común 12-20h UTC) | Esperar / usar `loop-audit.sh` / cambiar a `--provider ollama` / subir plan |
| `Gemini 404 ... is no longer available` | Modelo retirado para keys nuevas | Actualizar `GEMINI_MODEL` (listar con `GET /v1beta/models?key=...`) |
| `Schema inválido del modelo` | El modelo devolvió texto no-JSON | Reintentar; si persiste, probar otro modelo |
| `Falta GEMINI_API_KEY` | Sin `.env` | `cp .env.example .env` y completar |

## Cómo funciona (resumen)

```
localhost:3000 → Playwright (375/768/1440, resize 1024, scroll+hover)
  → contexto computado (fonts, headings, paleta, contraste)
  → visión: Gemini REST (note) u Ollama /api/generate (desktop)
  → validación zod → report.json + report.html
```

Detalle de arquitectura y trade-offs: `CONTEXTO.md`, `task_plan.md`.
