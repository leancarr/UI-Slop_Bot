# Findings — UI-Slop Bot

## 2026-09-24 - Contexto inicial (CONTEXTO.md + README.md)
- Diferencial vs impeccable: impeccable = AST/Tailwind estático, texto en terminal. Bot = píxeles renderizados + visión multimodal + heatmap. Punto ciego de impeccable: no ve colisiones, roturas 375px, contraste real, blur.
- 10 clichés ya listados en CONTEXTO.md:4.2 (gradiente violeta, pricing 3-cards Popular, hero vacío, textos genéricos, glassmorphism, rounded-2xl, shadow-xl, anim 700ms, opacidad/baja legibilidad, sin empty/error states).
- Trade-offs conocidos: latencia 10-25s vs 1-2s linter; costo ~$0.02-0.05 con Flash; riesgo calibración (minimalismo legítimo vs slop).
- Evidencia Antigravity: veredicto `High AI Slop`, Nielsen 1/4, cognitive load extremadamente alto.
- Hallazgo repo: raíz contiene `skills/` (es repo mattpocock/skills v1.2.3) y `Scrapling/` (librería scraping) sin relación con bot. Decidir si son submódulos accidentales o dependencias a usar (Scrapling podría servir para fetching, pero Playwright es lo planeado).

## 2026-09-24 - Decisiones usuario + entorno
- Stack: pide comparativa completa. Entorno detectado: Node v20.20.2, Python 3.12.3, sin GPU (nvidia-smi ausente), sin Ollama instalado, Playwright 1.63 disponible vía npx. Local en CPU = inferencia lenta.
- Provider: **local-first + Gemini free como fallback opcional**. Modelos 2026 vía Ollama: `qwen2.5vl:7b` (~6GB, mejor OCR/UI), `minicpm-v:8b` (~5.5GB, eficiente), `llama3.2-vision:11b` (~8GB, mejor calidad general, pide GPU), `moondream:1.8b` (~1.7GB, único viable en CPU pelada pero flojo en detalle). Para UI Slop interesa Qwen2.5-VL o MiniCPM-V. InternVL2.5 es el más fuerte en UI pero con peor integración Ollama.
- Distribución: pide comparativa, sesgo a CLI.
- Repo: `skills/` y `Scrapling/` son herramientas del agente → movidos a `.gitignore`, no parte del bot.

## 2026-09-24 - Scaffold MVP + decisión contexto vs training
- Scaffold Node/TS+Playwright+pnpm creado: capture.ts, adapter.ts (gemini+ollama), html.ts, cli.ts, schema.ts, cliches.yaml, skill wrapper. tsc ok.
- Desktop RX 7600 8GB RDNA3 + Ryzen 8400F: Ollama ROCm corre Q4 7-8B. Recomendado `qwen2.5vl:7b` (~5GB, mejor UI/OCR) o `qwen3-vl:8b`. `llama3.2-vision:11b` (~7.8GB) al límite, swap. `moondream` descartado con 8GB.
- API Gemini guardada en `.env` (600, git-ignored). Formato atípico (no AIza...), verificar con primera corrida.
- Estrategia detección: contexto + few-shot, NO fine-tuning en MVP (ver respuesta al usuario).

## Pendiente investigar
- [ ] Skill `impeccable` real: ¿qué reglas implementa para no duplicar?
- [ ] Precios actuales Gemini Flash vs Claude Haiku Vision 2026
- [ ] Playwright vs Puppeteer en este entorno
