import { chromium, type Browser } from "playwright";
import { writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

// Resuelve un Chromium ya instalado (útil si la versión de playwright
// pide un build aún no descargado). Acepta override por env.
async function resolveExecutable(): Promise<string | undefined> {
  if (process.env.PLAYWRIGHT_EXECUTABLE) return process.env.PLAYWRIGHT_EXECUTABLE;
  try {
    const dir = path.join(os.homedir(), ".cache", "ms-playwright");
    const entries = await readdir(dir);
    const cands = entries.filter((e) => e.startsWith("chromium-")).sort().reverse();
    for (const c of cands) {
      const p = path.join(dir, c, "chrome-linux64", "chrome");
      try { await import("node:fs/promises").then((m) => m.access(p)); return p; } catch { /* siguiente */ }
    }
  } catch { /* sin cache, usar default */ }
  return undefined;
}

export const VIEWPORTS = [
  { width: 375, height: 812, label: "375" },
  { width: 768, height: 1024, label: "768" },
  { width: 1440, height: 900, label: "1440" },
] as const;

export interface CaptureResult {
  screenshots: { viewport: string; file: string }[];
  context: {
    url: string;
    fonts: string[];
    headings: { level: string; text: string }[];
    palette: string[];
  };
}

export async function capture(url: string, outDir = ".output"): Promise<CaptureResult> {
  await mkdir(outDir, { recursive: true });
  let browser: Browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    const exe = await resolveExecutable();
    if (!exe) throw new Error("Sin Chromium: corre `pnpm exec playwright install chromium`");
    browser = await chromium.launch({ headless: true, executablePath: exe });
  }
  const screenshots: CaptureResult["screenshots"] = [];
  let context: CaptureResult["context"] | null = null;

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      // esperar hydration: un tick + ocultar skeletons eternos no, solo esperar
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
      await page.waitForTimeout(400);

      const raw = path.join(outDir, `raw-${vp.label}.png`);
      await page.screenshot({ path: raw, fullPage: false });

      // resize a 1024px lado mayor para abaratar inferencia
      const file = path.join(outDir, `shot-${vp.label}.png`);
      await sharp(raw).resize({ width: 1024, withoutEnlargement: true }).png().toFile(file);
      screenshots.push({ viewport: vp.label, file });

      if (vp.label === "1440") {
        const data = await page.evaluate(() => ({
          fonts: [...new Set(
            Array.from(document.querySelectorAll("*")).slice(0, 500).map((el) =>
              getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim()
            )
          )].filter(Boolean).slice(0, 10),
          headings: Array.from(document.querySelectorAll("h1,h2,h3"))
            .slice(0, 12)
            .map((h) => ({ level: h.tagName, text: (h.textContent ?? "").trim().slice(0, 120) })),
          palette: [...new Set(
            Array.from(document.querySelectorAll("*")).slice(0, 300).map((el) =>
              getComputedStyle(el).color
            )
          )].slice(0, 12),
        }));
        context = { url, ...data };
        await writeFile(path.join(outDir, "context.json"), JSON.stringify(context, null, 2));
      }
      await page.close();
    }
    return { screenshots, context: context! };
  } finally {
    await browser.close();
  }
}
