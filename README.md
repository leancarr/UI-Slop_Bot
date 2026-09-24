# UI-Slop_Bot

> Auditor visual de **UI Slop** — detecta patrones genéricos de IA analizando **píxeles renderizados**, no código. Supera el enfoque estático tipo `impeccable` con visión multimodal + heatmaps.

📄 Contexto: [`CONTEXTO.md`](./CONTEXTO.md) · Plan: [`task_plan.md`](./task_plan.md)

## Uso

```bash
# Notebook (Gemini API, .env con GEMINI_API_KEY)
pnpm install
pnpm audit:notebook

# PC escritorio Windows RX 7600 (Ollama local)
powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1
pnpm audit:desktop
# = audit --url http://localhost:3000 --provider ollama --model qwen2.5vl:7b
```

Salida: `.output/report.json` + `.output/report.html` (heatmap). `--ci` falla si score > 60.

## Arquitectura MVP

```
localhost:3000 → Playwright (375/768/1440, resize 1024)
  → contexto computado (fonts, headings, paleta)
  → visión (gemini-2.0-flash | ollama/qwen2.5vl:7b)
  → report.json {score, verdict, issues:[{type,bbox,severity,evidence,fix}]}
  → report.html
```

Rúbrica: `benchmark/cliches.yaml` (10 clichés con pesos + excepciones legítimas).
Skill wrapper: `skill/SKILL.md`.

## Máquinas

| | Notebook (Linux, sin GPU) | Desktop (Windows, RX 7600 8GB) |
|---|---|---|
| Provider | `gemini` | `ollama` + `qwen2.5vl:7b` |
| Env | `.env` con `GEMINI_API_KEY` | `.env` desde `.env.desktop.example` |
| Comando | `pnpm audit:notebook` | `pnpm audit:desktop` |
