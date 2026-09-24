import { z } from "zod";

export const BBox = z.object({
  // cuadrantes normalizados 0-1000 para no depender de resolución
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
  w: z.number().min(0).max(1000),
  h: z.number().min(0).max(1000),
  viewport: z.enum(["375", "768", "1440"]),
});

export const Issue = z.object({
  type: z.string(), // id del cliche, ej. purple-gradient
  bbox: BBox,
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.string(), // qué vio el modelo, 1 frase
  fix: z.string(), // cómo romper el molde, 1 acción concreta
});

export const Report = z.object({
  url: z.string(),
  score: z.number().min(0).max(100),
  verdict: z.enum(["Clean", "Light Slop", "High AI Slop"]),
  issues: z.array(Issue),
  model: z.string(),
  viewports: z.array(z.string()),
});

export type ReportT = z.infer<typeof Report>;
export type IssueT = z.infer<typeof Issue>;

export function verdictFor(score: number) {
  if (score < 25) return "Clean" as const;
  if (score <= 60) return "Light Slop" as const;
  return "High AI Slop" as const;
}
