#Requires -Version 5.1
# Setup UI-Slop Bot en PC escritorio Windows (RX 7600 + Ryzen 8400F)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1

$ErrorActionPreference = "Stop"

Write-Host "[1/5] Verificando Node + pnpm..." -ForegroundColor Cyan
node --version
$corepack = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $corepack) {
  corepack enable
  corepack prepare pnpm@latest --activate
}
pnpm --version

Write-Host "[2/5] Instalando dependencias..." -ForegroundColor Cyan
pnpm install
pnpm exec playwright install chromium

Write-Host "[3/5] Verificando Ollama..." -ForegroundColor Cyan
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
  Write-Host "Ollama no encontrado. Instalalo desde https://ollama.com/download/windows" -ForegroundColor Yellow
  Write-Host "Despues corre: ollama pull qwen2.5vl:7b" -ForegroundColor Yellow
} else {
  ollama --version
  Write-Host "Bajando modelo qwen2.5vl:7b (~5GB)..." -ForegroundColor Cyan
  ollama pull qwen2.5vl:7b
}

Write-Host "[4/5] Configurando .env..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
  Copy-Item ".env.desktop.example" ".env"
  Write-Host ".env creado desde .env.desktop.example (modo ollama local)" -ForegroundColor Green
} else {
  Write-Host ".env ya existe, no lo toco" -ForegroundColor Yellow
}

Write-Host "[5/5] Build check..." -ForegroundColor Cyan
pnpm build
Write-Host ""
Write-Host "Listo. Levanta fitt-app en :3000 y corre:" -ForegroundColor Green
Write-Host '  pnpm audit -- --url http://localhost:3000 --provider ollama --model qwen2.5vl:7b'
