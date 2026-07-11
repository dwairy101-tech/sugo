@echo off
cd /d "%~dp0"
echo Checking SUGO package...
node --check js\worker-api.js || goto :fail
node --check js\admin.js || goto :fail
node --check js\kb-media.js || goto :fail
node --check js\app.js || goto :fail
node --check worker\worker.js || goto :fail
echo.
echo PACKAGE CHECK PASSED
pause
exit /b 0
:fail
echo.
echo PACKAGE CHECK FAILED
pause
exit /b 1
