@echo off
setlocal
cd /d "%~dp0"
title SUGO Existing AI + Admin Images Setup
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0worker\setup-cloudflare.ps1"
echo.
echo Press any key to close this window.
pause >nul
