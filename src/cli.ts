#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { capture } from "./runner/capture.js";
import { auditWithGemini, auditWithOllama } from "./vision/adapter.js";
import { renderHtml } from "./reporter/html.js";

const program = new Command();
program.name("ui-slop-bot").description("Auditor visual de UI Slop").version("0.1.0");

program.command("audit")
  .requiredOption("--url <url>", "URL a auditar, ej. http://localhost:3000")
  .option("--provider <p>", "gemini|ollama", "gemini")
  .option("--model <m>", "override modelo")
  .option("--ci", "exit 1 si score > 60", false)
  .action(async (o) => {
    console.log(`[1/3] capturando ${o.url} ...`);
    const { screenshots, context } = await capture(o.url);
    console.log(`[2/3] visión (${o.provider}) ...`);
    const report = o.provider === "ollama"
      ? await auditWithOllama({ shots: screenshots, context, url: o.url, model: o.model })
      : await auditWithGemini({ shots: screenshots, context, url: o.url, model: o.model });
    const score = (report as { score: number }).score;
    console.log(`[3/3] score ${score}`);
    // @ts-expect-error json validado
    await renderHtml(report, screenshots);
    console.log("→ .output/report.html + .output/report.json");
    if (o.ci && score > 60) { console.error("CI fail: slop > 60"); process.exit(1); }
  });

program.parse();
