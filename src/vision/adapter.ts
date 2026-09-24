import { readFile } from "node:fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Report, verdictFor } from "../schema.js";

// Adaptador Gemini (notebook). Modelo default barato con visión.
export async function auditWithGemini(opts: {
  shots: { viewport: string; file: string }[];
  context: unknown;
  url: string;
  model?: string;
}): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env");
  const modelName = opts.model ?? "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });

  const rubric = await readFile("benchmark/cliches.yaml", "utf8");
  const parts: unknown[] = [
    { text: SYSTEM_PROMPT + "\n\n## RUBRICA\n" + rubric + "\n\n## CONTEXTO COMPUTADO\n" + JSON.stringify(opts.context).slice(0, 4000) },
  ];
  for (const s of opts.shots) {
    const b64 = (await readFile(s.file)).toString("base64");
    parts.push({ text: `VIEWPORT ${s.viewport}:` });
    parts.push({ inlineData: { data: b64, mimeType: "image/png" } });
  }
  parts.push({ text: RESPONSE_SHAPE });

  const res = await model.generateContent(parts as never[]);
  const text = res.response.text();
  const json = JSON.parse(text);
  // score ponderado simple si el modelo no lo calcula: contar highs
  const parsed = Report.passthrough().safeParse({
    url: opts.url, model: modelName,
    viewports: opts.shots.map((s) => s.viewport),
    verdict: verdictFor(json.score ?? 0),
    ...json,
  });
  if (!parsed.success) throw new Error("Schema inválido del modelo: " + JSON.stringify(parsed.error.issues).slice(0, 1000));
  return parsed.data;
}

export async function auditWithOllama(opts: {
  shots: { viewport: string; file: string }[];
  context: unknown;
  url: string;
  model?: string;
  host?: string;
}): Promise<Record<string, unknown>> {
  // Desktop RX 7600: Ollama con ROCm. Modelo sugerido qwen2.5vl:7b o qwen3-vl:8b.
  const host = opts.host ?? process.env.OLLAMA_HOST ?? "http://localhost:11434";
  const model = opts.model ?? process.env.OLLAMA_MODEL ?? "qwen2.5vl:7b";
  const images: string[] = [];
  for (const s of opts.shots) images.push((await readFile(s.file)).toString("base64"));

  const prompt = SYSTEM_PROMPT + "\n" + RESPONSE_SHAPE + "\nCONTEXTO: " + JSON.stringify(opts.context).slice(0, 3000);
  const r = await fetch(`${host}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, images, stream: false, format: "json" }),
  });
  if (!r.ok) throw new Error(`Ollama ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { response: string };
  const json = JSON.parse(j.response);
  const parsed = Report.passthrough().safeParse({
    url: opts.url, model: `ollama/${model}`,
    viewports: opts.shots.map((s) => s.viewport),
    verdict: verdictFor(json.score ?? 0),
    ...json,
  });
  if (!parsed.success) throw new Error("Schema Ollama inválido: " + JSON.stringify(parsed.error.issues).slice(0, 1000));
  return parsed.data;
}

const SYSTEM_PROMPT = `Sos auditor visual de UI. Evaluás PIXELES, no código.
Penalizá solo lo visible y molesto. Un minimalismo con jerarquía real (Linear, Stripe) es Clean aunque tenga espacio en blanco.
Para cada issue: type = id del cliché, bbox en cuadrantes 0-1000 + viewport, severity, evidence (1 frase de lo que se ve), fix (1 acción que rompa el molde).
No inventes bboxes: si no localizás, usá el cuadrante de la sección (hero x:0 y:0 w:1000 h:400).`;

const RESPONSE_SHAPE = `Devolvé SOLO JSON: {"score":0-100,"verdict":"Clean|Light Slop|High AI Slop","issues":[{"type":"purple-gradient","bbox":{"x":0,"y":0,"w":1000,"h":400,"viewport":"1440"},"severity":"high","evidence":"...","fix":"..."}]}`;
