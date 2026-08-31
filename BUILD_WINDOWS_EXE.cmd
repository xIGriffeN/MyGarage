@echo off
title MyGarage EXE Builder
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js wurde nicht gefunden.
  echo Bitte Node.js LTS installieren und danach erneut starten.
  pause
  exit /b 1
)

echo.
echo [1/2] Pakete installieren...
call npm install
if errorlevel 1 goto error

echo.
echo [2/2] MyGarage Setup.exe bauen...
call npm run dist
if errorlevel 1 goto error

echo.
echo Fertig.
echo Die Setup-Datei liegt im Ordner:
echo %~dp0dist
echo.
pause
exit /b 0

:error
echo.
echo Beim Erstellen ist ein Fehler aufgetreten.
pause
exit /b 1
