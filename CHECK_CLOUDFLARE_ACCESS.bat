@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo SUGO Cloudflare read-only diagnostic
echo ============================================================
echo This tool will open Cloudflare OAuth in your browser if needed.
echo It will NOT deploy, edit secrets, or change KV data.
echo.

if not exist "%~dp0worker\cloudflare-diagnostic.ps1" (
  echo ERROR: worker\cloudflare-diagnostic.ps1 was not found.
  echo Extract the complete SUGO package, then run this file again.
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0worker\cloudflare-diagnostic.ps1" -ProjectRoot "%~dp0"
set EXIT_CODE=%ERRORLEVEL%
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Diagnostic exited with code %EXIT_CODE%.
  pause
)
exit /b %EXIT_CODE%
