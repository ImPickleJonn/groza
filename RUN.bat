@echo off
title GROZA - Local Server
color 0D
cd /d "%~dp0"

echo.
echo  =========================================
echo   GROZA  -  starting local server...
echo  =========================================
echo.

REM Check Node is installed
where node >nul 2>nul
if errorlevel 1 (
  echo  ERROR: Node.js is not installed.
  echo.
  echo  Download and install Node from:
  echo    https://nodejs.org
  echo.
  echo  Pick the LTS version, restart your computer, then run this again.
  echo.
  pause
  exit /b 1
)

REM Open browser after a short delay so server has time to boot
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

echo  Server starting on http://localhost:3000
echo  Browser will open automatically in 2 seconds.
echo.
echo  To stop the server: close this window.
echo.

node server.js

pause
