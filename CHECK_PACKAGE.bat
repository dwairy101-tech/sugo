@echo off
setlocal
cd /d "%~dp0"
echo Running complete SUGO validation...
node tests\run-tests.js
if errorlevel 1 goto :fail
echo.
echo PACKAGE CHECK PASSED
pause
exit /b 0
:fail
echo.
echo PACKAGE CHECK FAILED
pause
exit /b 1
