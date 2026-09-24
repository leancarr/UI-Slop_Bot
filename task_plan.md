# Plan de Arquitectura — UI-Slop Bot (supera a impeccable)

**Objetivo:** Auditor visual que detecta UI Slop desde píxeles renderizados, no código estático. Score 0-100 + heatmap + fixes.
**Origen:** CONTEXTO.md (2026-09-22) + README.md MVP.
**Estado:** Fase 0 - planificación.

## Fase 0 - Alineamiento y decisiones [complete]
- Stack: Node/TS + Playwright con pnpm. Instalado y `tsc --noEmit` ok.
- Provider: Gemini en notebook (.env, ignorado), Ollama en desktop RX 7600.
- Distribución: CLI sí + skill wrapper en `skill/SKILL.md`.
- Repo: `skills/`, `Scrapling/` a `.gitignore`.

## Fase 1 - Benchmark 10 Clichés + rúbrica [complete]
- Definir stack, provider visión, forma de distribución (CLI vs skill vs ambos)
- Cerrar JSON contract `{score, verdict, issues: [{type, bbox, severity, fix}]}`
- Registrar ADRs iniciales

## Fase 1 - Benchmark 10 Clichés + rúbrica
- Formalizar los 10 clichés en `benchmark/cliches.yaml` con pesos y ejemplos +/-
- Definir rúbrica few-shot (evitar confundir Linear/Stripe minimalista con slop)
- Salida: rúbrica versionada

## Fase 2 - Runner Playwright (captura)
- Headless, viewports 375/768/1440, fullPage + above-fold
- Wait hydration/skeletons, scroll + hover básico
- Extractor contexto computado: fonts, paleta, headings, contraste
- Salida: `screenshots/` + `context.json`

## Fase 3 - Motor de visión
- Prompt calibrado + resize 1024px (costo)
- Provider primario Gemini Flash, fallback Claude Vision
- Output JSON estricto validado con schema
- Salida: `report.json`

## Fase 4 - Visual Reporter
- HTML local + imágenes anotadas (bboxes rojas)
- Lista fixes priorizados "cómo romper el molde"
- Comparativa antes/después (V1)

## Fase 5 - CLI + CI
- `npx ui-slop-bot audit --url http://localhost:3000 --viewports 375,768,1440`
- `--ci` falla si score > 60, cache, batch
- Latencia objetivo 10-25s, costo ~$0.03/corrida

## Fase 6 - Calibración y hardening
- Dataset 20-30 capturas etiquetadas, ajuste pesos
- Métricas falsos +/-, docs

## Decisiones abiertas
- [ ] Lenguaje: Node/TS vs Python
- [ ] Provider: Gemini-only vs multi-provider
- [ ] Distribución: CLI npm vs OpenCode skill vs ambos
- [ ] Repo actual contiene `skills/` y `Scrapling/` no relacionados: ¿limpiar o ignorar?

## Errores encontrados
| Error | Intentos | Solución |
|-------|----------|----------|
| — | — | — |
