@echo off
title Elo Arc
color 0A
echo.
echo  =======================================
echo   Elo Arc - AI Chess Coaching Platform
echo  =======================================
echo.
echo  Iniciando...
echo.

:: Kill anything on port 4000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":4000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Start backend
echo  [1/2] Iniciando servidor backend...
start "Elo Arc Backend" /min cmd /c "cd /d %~dp0server && node server.js"

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Open browser
echo  [2/2] Abrindo navegador...
start "" "http://localhost:5173"

echo.
echo  Elo Arc rodando em http://localhost:5173
echo  Backend em http://localhost:4000
echo.
echo  Pressione qualquer tecla para fechar este terminal (o app continua rodando)
pause >nul
