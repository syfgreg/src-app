@echo off
REM ============================================================
REM  Sea Robin Classic - Windows 11 dev setup (double-click me)
REM  Wraps setup-windows.ps1: installs Node, Git, Gemini CLI,
REM  Netlify CLI, PowerShell 7, then preps the project.
REM ============================================================
setlocal

REM --- Self-elevate so all installs run under one admin prompt ---
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo This setup needs administrator permission to install software.
  echo A Windows prompt will appear next - click YES to continue.
  echo.
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

REM --- Run from this file's folder (elevation resets the working dir) ---
cd /d "%~dp0"

cls
echo ============================================================
echo   Sea Robin Classic - developer setup
echo ============================================================
echo.
echo This will install (skipping anything you already have):
echo   - Node.js LTS        (runs the app + tools)
echo   - Git                (+ line-ending fix for this repo)
echo   - Gemini CLI         (free AI coding agent, like Claude Code)
echo   - Netlify CLI        (deploy the app)
echo   - Supabase CLI       (optional - dashboard-managed)
echo   - PowerShell 7       (nicer terminal)
echo   - the project's npm dependencies
echo.
echo During the run you may see extra install prompts - allow them.
echo It is safe to run this more than once.
echo.
pause

if not exist "%~dp0setup-windows.ps1" (
  echo.
  echo ERROR: setup-windows.ps1 was not found next to this file.
  echo Make sure both files are in the same project folder, then re-run.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-windows.ps1"

echo.
echo ============================================================
echo   Setup finished. Read the steps printed above.
echo   Quick start:
echo     gemini        (sign in with a personal Google account)
echo     npm run dev   (run the app locally)
echo ============================================================
echo.
echo This window stays open so you can read the instructions.
pause
