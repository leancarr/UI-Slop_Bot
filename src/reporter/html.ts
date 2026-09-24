import { writeFile } from "node:fs/promises";
import type { ReportT } from "../schema.js";

export async function renderHtml(report: ReportT, shots: { viewport: string; file: string }[], out = ".output/report.html") {
  const cards = report.issues.map((i) =>
    `<li><b>${i.type}</b> [${i.severity}] (${i.bbox.viewport}) — ${i.evidence}<br><i>Fix: ${i.fix}</i></li>`
  ).join("");
  const imgs = shots.map((s) => `<div><h3>${s.viewport}px</h3><img src="${s.file}" style="max-width:100%;border:1px solid #333"/></div>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><title>UI Slop — ${report.score}</title>
<body style="font-family:system-ui;max-width:900px;margin:auto;padding:24px">
<h1>Slop Score ${report.score} — ${report.verdict}</h1>
<p>${report.url} · ${report.model}</p>
<h2>Issues (${report.issues.length})</h2><ul>${cards}</ul>
<h2>Capturas</h2>${imgs}</body>`;
  await writeFile(out, html);
  await writeFile(".output/report.json", JSON.stringify(report, null, 2));
}
