@echo off
title BLUE SHINESHOP - Servidor Local
echo ===================================================
echo   INICIANDO BLUE SHINESHOP (Landing Page Oficial)
echo ===================================================
echo.

:: Verificar si el puerto 8080 ya esta respondiendo
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] El servidor ya esta activo en http://localhost:8080/
) else (
    echo [i] Iniciando servidor web local en segundo plano...
    start /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\serve_local.ps1"
    ping 127.0.0.1 -n 3 >nul
)

echo [>] Abriendo en el navegador predeterminado...
start http://localhost:8080/
echo.
echo ===================================================
echo   Sitio web activo en: http://localhost:8080/
echo   Panel CRM de Ventas: http://localhost:8080/admin.html
echo ===================================================
ping 127.0.0.1 -n 3 >nul
exit
