<#
  Sea Robin Classic - Windows 11 dev bootstrap
  ---------------------------------------------
  One-shot setup for a new developer. Installs Node LTS, Git, the Gemini CLI
  (free Claude-Code-style terminal agent), and the Netlify CLI, then prepares
  the project (deps + .env.local).

  HOW TO RUN:
    1. Put this file in the sea-robin-classic project folder.
    2. Open Windows Terminal (PowerShell), cd into that folder.
    3. Run:   powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1

  Safe to re-run - it skips anything already installed.
#>

$ErrorActionPreference = "Stop"
$ProjectPath = $PSScriptRoot
if (-not $ProjectPath) { $ProjectPath = (Get-Location).Path }

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

function Refresh-Path {
  # winget installs land on PATH only in NEW shells; pull them into this session.
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user    = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machine;$user"
}

Write-Host "Sea Robin Classic - Windows dev setup" -ForegroundColor Green
Write-Host "Project: $ProjectPath"

# --- winget sanity check (ships with Windows 11) ---
if (-not (Have "winget")) {
  throw "winget not found. Update Windows 11 / install 'App Installer' from the Microsoft Store, then re-run."
}

# --- Node.js LTS (needed by everything below and by the app build) ---
Write-Step "Node.js LTS"
if (Have "node") {
  Write-Host "Already installed: $(node --version)"
} else {
  winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
  Refresh-Path
}

# --- Git ---
Write-Step "Git"
if (Have "git") {
  Write-Host "Already installed: $(git --version)"
} else {
  winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements
  Refresh-Path
}

# --- Git line-ending config (repo was authored on macOS = LF; avoids noisy diffs) ---
Write-Step "Git line-ending config"
git config --global core.autocrlf input
Write-Host "Set core.autocrlf=input"

# --- Global CLIs: Gemini (the coding agent) + Netlify (deploy) ---
Write-Step "Gemini CLI (free coding agent)"
if (Have "gemini") {
  Write-Host "Already installed."
} else {
  npm install -g @google/gemini-cli
}

Write-Step "Netlify CLI (deploy + local functions)"
if (Have "netlify") {
  Write-Host "Already installed."
} else {
  npm install -g netlify-cli
}

# --- Supabase CLI (optional - migrations are managed via the dashboard) ---
# Global npm install is deprecated by Supabase, so use winget; if the catalog
# lacks it, fall through with instructions instead of failing the whole setup.
Write-Step "Supabase CLI (optional)"
if (Have "supabase") {
  Write-Host "Already installed: $(supabase --version)"
} else {
  winget install --id Supabase.CLI -e --silent --accept-package-agreements --accept-source-agreements
  Refresh-Path
  if (-not (Have "supabase")) {
    Write-Host "Could not auto-install the Supabase CLI (not required for this project)." -ForegroundColor Yellow
    Write-Host "If you want it later: install Scoop, then 'scoop install supabase'. See https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
  }
}

# --- PowerShell 7 (nicer terminal + better rendering for the gemini UI) ---
Write-Step "PowerShell 7"
if (Have "pwsh") {
  Write-Host "Already installed: $(pwsh --version)"
} else {
  winget install --id Microsoft.PowerShell -e --silent --accept-package-agreements --accept-source-agreements
  Refresh-Path
}

# --- Project setup (only if run from inside the project) ---
$pkg = Join-Path $ProjectPath "package.json"
if (Test-Path $pkg) {
  Write-Step "Installing project dependencies (npm install)"
  Push-Location $ProjectPath
  npm install

  $envLocal   = Join-Path $ProjectPath ".env.local"
  $envExample = Join-Path $ProjectPath ".env.example"
  if ((Test-Path $envExample) -and (-not (Test-Path $envLocal))) {
    Copy-Item $envExample $envLocal
    Write-Host "Created .env.local from .env.example - leave the Supabase vars blank for local-only mode."
  }
  Pop-Location
} else {
  Write-Host "`n(No package.json here - run this from inside the project folder to also install deps.)" -ForegroundColor Yellow
}

# --- Verify (fails loudly if anything above didn't land) ---
Write-Step "Verifying toolchain"
Refresh-Path
$ok = $true
foreach ($c in @("node","npm","git","gemini","netlify")) {
  if (Have $c) { Write-Host ("  OK  {0}" -f $c) -ForegroundColor Green }
  else         { Write-Host ("  MISSING  {0}" -f $c) -ForegroundColor Red; $ok = $false }
}
# Optional tools - report but don't block.
if (Have "supabase") { Write-Host "  OK  supabase (CLI)" -ForegroundColor Green }
else                 { Write-Host "  optional  supabase CLI not installed (fine - dashboard-managed)" -ForegroundColor Yellow }
if (Have "pwsh") { Write-Host "  OK  pwsh (PowerShell 7)" -ForegroundColor Green }
else             { Write-Host "  optional  pwsh not on PATH yet (reopen terminal)" -ForegroundColor Yellow }

Write-Host ""
if ($ok) {
  Write-Host "All set." -ForegroundColor Green
  Write-Host @"

Next steps:
  1. Read SRCSFT_APP.md - full app + handoff. GEMINI.md loads automatically as agent context.
  2. Start the coding agent:   gemini      (sign in with a personal Google account -> free tier)
  3. Run the app locally:      npm run dev (local-only IndexedDB; demo login moc@searobinclassic.com / searobin)
  4. Get the real Supabase + Netlify credentials from Mike, put the Supabase values in .env.local for cloud mode.
  5. Ship a change:            netlify deploy --build --prod
"@ -ForegroundColor Gray
} else {
  Write-Host "Some tools are missing. Close this terminal, open a NEW one, and re-run - winget PATH updates need a fresh shell." -ForegroundColor Yellow
}
